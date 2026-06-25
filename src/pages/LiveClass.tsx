import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { 
  doc, 
  collection, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  onSnapshot, 
  serverTimestamp, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Hand, 
  MessageSquare, 
  Send, 
  Users, 
  X, 
  ChevronRight, 
  Play, 
  Square, 
  Share2, 
  Copy, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Award, 
  AlertTriangle,
  Monitor,
  Check,
  UserCheck,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

interface ChatMessage {
  id: string;
  text: string;
  userId: string;
  userName: string;
  isTeacher: boolean;
  createdAt: any;
}

interface PresenceUser {
  id: string;
  name: string;
  role: string;
  raisedHand: boolean;
  isMuted: boolean;
  joinedAt: any;
}

export default function LiveClass() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Active Modes: "webrtc" (Native custom WebRTC canvas) or "embed" (Jitsi Meeting client-side iframe)
  const [classMode, setClassMode] = useState<'webrtc' | 'embed'>('webrtc');

  // Media state
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Firestore status states
  const [liveState, setLiveState] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<PresenceUser[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeSidebarTab, setActiveSidebarTab] = useState<'chat' | 'participants'>('chat');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected');

  // WebRTC Peer Connection States and dynamic STUN/TURN servers
  const [iceServers, setIceServers] = useState<RTCIceServer[]>([
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]);

  useEffect(() => {
    let active = true;
    const fetchIceServers = async () => {
      try {
        const response = await fetch('/api/xirsys/ice');
        if (response.ok) {
          const data = await response.json();
          if (active && data && data.iceServers) {
            console.log("[LiveClass] Dynamically loaded secure WebRTC ICE configurations:", data.source);
            setIceServers(data.iceServers);
          }
        }
      } catch (err) {
        console.warn("[LiveClass] Fail-safe active: Using fallback Google STUN servers.", err);
      }
    };
    fetchIceServers();
    return () => {
      active = false;
    };
  }, []);

  const peerConnectionsRef = useRef<Record<string, RTCPeerConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  // Auto-scroll anchor for chat
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Attendance Logger & Session Keep-alive
  useEffect(() => {
    if (!courseId || !user || !profile) return;

    // Join attendance/presence
    const presenceRef = doc(db, 'courses', courseId, 'presence', user.uid);
    setDoc(presenceRef, {
      uid: user.uid,
      name: profile.name || 'Anonymous Learner',
      role: isAdmin ? 'admin' : 'student',
      joinedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      raisedHand: false,
      isMuted: !isAdmin,
      status: 'online'
    }).catch(err => console.error("Error setting presence:", err));

    // Cleanup presence on departure
    return () => {
      deleteDoc(presenceRef).catch(err => console.error("Error clearing presence:", err));
    };
  }, [courseId, user, profile, isAdmin]);

  // Keep-alive heartbeat to monitor internet disconnection & auto reconnect
  useEffect(() => {
    if (!courseId || !user) return;

    const interval = setInterval(() => {
      const presenceRef = doc(db, 'courses', courseId, 'presence', user.uid);
      updateDoc(presenceRef, {
        updatedAt: serverTimestamp()
      }).then(() => {
        setConnectionStatus('connected');
      }).catch((err) => {
        console.warn("Heartbeat connection loss, entering auto-reconnect:", err);
        setConnectionStatus('reconnecting');
      });
    }, 10000); // Heartbeat every 10 seconds

    return () => clearInterval(interval);
  }, [courseId, user]);

  // Listen to the classroom state
  useEffect(() => {
    if (!courseId) return;

    const liveStateRef = doc(db, 'courses', courseId, 'live_state', 'state');
    const unsub = onSnapshot(liveStateRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setLiveState(data);
        if (data.status === 'ended') {
          toast.info("This live session has been ended by the instructor.");
          setTimeout(() => navigate('/dashboard'), 3000);
        }
      } else {
        // If state is deleted, treat as idle
        setLiveState({ status: 'idle' });
      }
    }, (err) => {
      console.error("Error observing class status:", err);
    });

    return unsub;
  }, [courseId, navigate]);

  // Sync Live Chat messages
  useEffect(() => {
    if (!courseId) return;

    const chatQuery = query(
      collection(db, 'courses', courseId, 'live_chats'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsub = onSnapshot(chatQuery, (snap) => {
      const messages: ChatMessage[] = [];
      snap.forEach((docSnap) => {
        messages.push({ id: docSnap.id, ...docSnap.data() } as ChatMessage);
      });
      setChatMessages(messages);
      
      // Auto-scroll to bottom of chat
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, (err) => {
      console.error("Live chat snapshot error:", err);
    });

    return unsub;
  }, [courseId]);

  // Sync Active Participants list
  useEffect(() => {
    if (!courseId) return;

    const presenceCol = collection(db, 'courses', courseId, 'presence');
    const unsub = onSnapshot(presenceCol, (snap) => {
      const activeUsers: PresenceUser[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        activeUsers.push({
          id: docSnap.id,
          name: data.name,
          role: data.role,
          raisedHand: !!data.raisedHand,
          isMuted: !!data.isMuted,
          joinedAt: data.joinedAt
        });
      });
      setParticipants(activeUsers);
    }, (err) => {
      console.error("Participants list error:", err);
    });

    return unsub;
  }, [courseId]);

  // WebRTC Stream Manager & Signaling Loop
  useEffect(() => {
    if (!courseId || classMode !== 'webrtc') return;

    // Start local media stream for teacher or speaking students
    const setupMedia = async () => {
      try {
        if (isAdmin) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
          setLocalStream(stream);
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        }
      } catch (err) {
        console.warn("Failed to capture local video/audio:", err);
        toast.warning("Camera or Mic permission was denied. You can still join as a viewer.");
      }
    };

    setupMedia();

    // Teacher Signaling logic: listen to signals from students to establish RTCPeerConnection
    let unsubSignals: (() => void) | null = null;
    if (isAdmin) {
      const signalsCol = collection(db, 'courses', courseId, 'live_signals');
      unsubSignals = onSnapshot(signalsCol, async (snap) => {
        snap.docChanges().forEach(async (change) => {
          const studentId = change.doc.id;
          const signalData = change.doc.data();

          if (change.type === 'added' || change.type === 'modified') {
            // If student has generated an initial ping or ICE setup, establish RTC Connection
            if (signalData.type === 'join-request' && !peerConnectionsRef.current[studentId]) {
              createBroadcasterPeerConnection(studentId);
            } else if (signalData.answer && peerConnectionsRef.current[studentId]) {
              await peerConnectionsRef.current[studentId].setRemoteDescription(
                new RTCSessionDescription(signalData.answer)
              );
            }
          }
        });
      });
    } else {
      // Student view signaling: initiate join request
      const signalRef = doc(db, 'courses', courseId, 'live_signals', user?.uid || '');
      setDoc(signalRef, {
        type: 'join-request',
        studentName: profile?.name || 'Student',
        createdAt: serverTimestamp()
      });

      unsubSignals = onSnapshot(signalRef, async (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.offer) {
            await createReceiverPeerConnection(data.offer);
          }
        }
      });
    }

    return () => {
      if (unsubSignals) unsubSignals();
      // Cleanup peer connections
      (Object.values(peerConnectionsRef.current) as RTCPeerConnection[]).forEach(pc => pc.close());
      peerConnectionsRef.current = {};
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [courseId, isAdmin, classMode, user, profile]);

  // RTCPeerConnection logic for Teacher (Broadcaster)
  const createBroadcasterPeerConnection = async (studentId: string) => {
    const pc = new RTCPeerConnection({
      iceServers
    });

    peerConnectionsRef.current[studentId] = pc;

    // Add local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candRef = doc(
          db, 
          'courses', 
          courseId!, 
          'live_signals', 
          studentId, 
          'teacher_candidates', 
          `cand_${Date.now()}`
        );
        setDoc(candRef, event.candidate.toJSON());
      }
    };

    // Create SDP Offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const signalRef = doc(db, 'courses', courseId!, 'live_signals', studentId);
    await updateDoc(signalRef, {
      offer: {
        type: offer.type,
        sdp: offer.sdp
      },
      updatedAt: serverTimestamp()
    });

    // Listen to Student ICE Candidates
    const studentCandCol = collection(db, 'courses', courseId!, 'live_signals', studentId, 'student_candidates');
    onSnapshot(studentCandCol, (snap) => {
      snap.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const cand = new RTCIceCandidate(change.doc.data() as RTCIceCandidateInit);
          await pc.addIceCandidate(cand);
        }
      });
    });
  };

  // RTCPeerConnection logic for Student (Receiver)
  const createReceiverPeerConnection = async (offer: any) => {
    const pc = new RTCPeerConnection({
      iceServers
    });

    peerConnectionsRef.current['teacher'] = pc;

    // Track arrival of Teacher video/audio
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      }
    };

    // ICE candidates exchange
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candRef = doc(
          db, 
          'courses', 
          courseId!, 
          'live_signals', 
          user!.uid, 
          'student_candidates', 
          `cand_${Date.now()}`
        );
        setDoc(candRef, event.candidate.toJSON());
      }
    };

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    const signalRef = doc(db, 'courses', courseId!, 'live_signals', user!.uid);
    await updateDoc(signalRef, {
      answer: {
        type: answer.type,
        sdp: answer.sdp
      },
      updatedAt: serverTimestamp()
    });

    // Listen to Teacher ICE Candidates
    const teacherCandCol = collection(db, 'courses', courseId!, 'live_signals', user!.uid, 'teacher_candidates');
    onSnapshot(teacherCandCol, (snap) => {
      snap.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const cand = new RTCIceCandidate(change.doc.data() as RTCIceCandidateInit);
          await pc.addIceCandidate(cand);
        }
      });
    });
  };

  // Broadcast toggles
  const toggleCam = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCamOn(!isCamOn);
    }
  };

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMicOn(!isMicOn);
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Revert back to camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setIsScreenSharing(false);
        
        // Update peer tracks
        (Object.values(peerConnectionsRef.current) as RTCPeerConnection[]).forEach(pc => {
          const senders = pc.getSenders();
          const videoSender = senders.find(s => s.track?.kind === 'video');
          if (videoSender && stream.getVideoTracks()[0]) {
            videoSender.replaceTrack(stream.getVideoTracks()[0]);
          }
        });
      } catch (err) {
        console.error("Screen share restoration failure:", err);
      }
    } else {
      // Capture Screen
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setLocalStream(stream);
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setIsScreenSharing(true);

        // Update tracks for all peer connections
        (Object.values(peerConnectionsRef.current) as RTCPeerConnection[]).forEach(pc => {
          const senders = pc.getSenders();
          const videoSender = senders.find(s => s.track?.kind === 'video');
          if (videoSender && stream.getVideoTracks()[0]) {
            videoSender.replaceTrack(stream.getVideoTracks()[0]);
          }
        });

        // Handle stream stop by browser native overlay
        stream.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };
      } catch (err) {
        console.warn("Screen share canceled or failed:", err);
      }
    }
  };

  // Student Raise Hand Logic
  const handleRaiseHand = async () => {
    if (!courseId || !user) return;
    const presenceRef = doc(db, 'courses', courseId, 'presence', user.uid);
    const selfState = participants.find(p => p.id === user.uid);
    const newState = !selfState?.raisedHand;

    await updateDoc(presenceRef, {
      raisedHand: newState,
      raisedHandAt: newState ? serverTimestamp() : null
    });

    if (newState) {
      toast.success("✋ Hand raised. The instructor has been notified.");
    } else {
      toast.info("Lowered your hand.");
    }
  };

  // Teacher Moderation Actions
  const handleMuteParticipant = async (participantId: string) => {
    if (!isAdmin || !courseId) return;
    
    // Set user muted flag in their individual presence document
    const participantRef = doc(db, 'courses', courseId, 'presence', participantId);
    await updateDoc(participantRef, {
      isMuted: true
    });
    toast.success("Participant muted.");
  };

  const handleLowerParticipantHand = async (participantId: string) => {
    if (!isAdmin || !courseId) return;
    
    const participantRef = doc(db, 'courses', courseId, 'presence', participantId);
    await updateDoc(participantRef, {
      raisedHand: false,
      raisedHandAt: null
    });
    toast.success("Lowered participant's hand.");
  };

  const handleEndClassForAll = async () => {
    if (!isAdmin || !courseId) return;

    if (window.confirm("Are you sure you want to end this live session for everyone?")) {
      const liveStateRef = doc(db, 'courses', courseId, 'live_state', 'state');
      await setDoc(liveStateRef, {
        status: 'ended',
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Clean up signaling collection
      toast.success("Session closed. Returning to dashboard.");
      navigate('/dashboard');
    }
  };

  // Chat message submission
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !newMessage.trim() || !user || !profile) return;

    const chatCol = collection(db, 'courses', courseId, 'live_chats');
    await addDoc(chatCol, {
      text: newMessage.trim(),
      userId: user.uid,
      userName: profile.name || 'Anonymous User',
      isTeacher: isAdmin,
      createdAt: serverTimestamp()
    });

    setNewMessage('');
  };

  const copyClassCode = () => {
    navigator.clipboard.writeText(courseId || '');
    toast.success("📋 Class Code copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans -mx-4 -my-8 md:-mx-12 md:-my-8">
      {/* Top Banner Control Panel */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
          </div>
          <h1 className="font-black tracking-tight text-lg md:text-xl text-white flex items-center gap-2">
            <span>LIVE CLASSROOM:</span>
            <span className="text-emerald-400 font-bold italic">{liveState?.liveTitle || 'Interactive Lecture'}</span>
          </h1>
        </div>

        {/* Live stats and selectors */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-850 px-4 py-2 rounded-2xl border border-slate-800 text-xs font-bold text-slate-300">
            <Users className="h-4 w-4 text-emerald-400" />
            <span>{participants.length} Active Attendance</span>
          </div>

          <div className="flex items-center bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs gap-2">
            <span className="text-slate-400">Code:</span>
            <span className="font-mono text-emerald-300 font-black tracking-wider">{courseId?.substring(0, 8).toUpperCase()}</span>
            <button onClick={copyClassCode} className="hover:text-emerald-400 transition-colors">
              <Copy className="h-3 w-3" />
            </button>
          </div>

          {/* Connection Status Indicator */}
          {connectionStatus === 'connected' ? (
            <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] uppercase font-black px-3 py-1.5 rounded-full tracking-wider">
              Connected
            </span>
          ) : (
            <span className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] uppercase font-black px-3 py-1.5 rounded-full tracking-wider animate-pulse flex items-center gap-1.5">
              <RotateCcw className="h-3 w-3 animate-spin" />
              Reconnecting...
            </span>
          )}

          {/* Mode toggle */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button 
              onClick={() => setClassMode('webrtc')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                classMode === 'webrtc' ? 'bg-emerald-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              Native WebRTC
            </button>
            <button 
              onClick={() => setClassMode('embed')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                classMode === 'embed' ? 'bg-emerald-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              Jitsi Mirror
            </button>
          </div>

          {isAdmin && (
            <button 
              onClick={handleEndClassForAll}
              className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold px-4 py-2 rounded-2xl text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-md"
            >
              <Square className="h-3.5 w-3.5" />
              <span>End Class</span>
            </button>
          )}

          <button 
            onClick={() => navigate('/dashboard')}
            className="text-xs hover:text-white transition-colors bg-slate-800 p-2.5 rounded-2xl"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden relative">
        
        {/* Left Side: Video Canvas Main Player */}
        <div className="flex-1 flex flex-col justify-between p-4 md:p-6 bg-slate-950 relative overflow-hidden min-h-[420px] sm:min-h-[500px] lg:min-h-0">
          
          <div className="flex-1 bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 relative shadow-2xl flex items-center justify-center min-h-[280px] sm:min-h-[380px] lg:min-h-0">
            {classMode === 'webrtc' ? (
              // WebRTC Custom Video Stream Frame
              <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-slate-950">
                {isAdmin ? (
                  // Teacher local camera/screen broadcast source
                  <div className="relative w-full h-full">
                    <video 
                      ref={localVideoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-400 flex items-center gap-2">
                      <Video className="h-3.5 w-3.5" />
                      <span>Broadcasting Local Video Feed</span>
                    </div>
                  </div>
                ) : (
                  // Student subscription remote stream source
                  remoteStream ? (
                    <div className="relative w-full h-full">
                      <video 
                        ref={remoteVideoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-2">
                        <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Live Teacher Feed</span>
                      </div>
                    </div>
                  ) : (
                    // Stream waiting placeholders
                    <div className="text-center space-y-6 max-w-sm px-6">
                      <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30">
                        <Video className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-400 animate-pulse" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-bold text-sm sm:text-lg text-white">Connecting to WebRTC Live Room...</h3>
                        <p className="text-slate-400 text-[11px] sm:text-xs leading-relaxed">
                          Please wait while the peer-to-peer streaming socket completes handshakes with your instructor's browser.
                        </p>
                      </div>
                      <button 
                        onClick={() => setClassMode('embed')}
                        className="text-[11px] sm:text-xs bg-slate-800 hover:bg-slate-700 px-4 py-2.5 rounded-2xl font-bold transition-all border border-slate-700"
                      >
                        Trouble connecting? Try Jitsi Mirror
                      </button>
                    </div>
                  )
                )}
              </div>
            ) : (
              // Jitsi Mirror Video Frame Fallback
              <iframe 
                src={`https://meet.jit.si/${courseId}${!isAdmin ? '#config.startWithAudioMuted=true&config.startWithVideoMuted=true&config.prejoinPageEnabled=false' : ''}`} 
                allow={isAdmin ? "camera; microphone; display-capture; autoplay; clipboard-write; jitsi-meet" : "autoplay; clipboard-write; jitsi-meet"} 
                className="w-full h-full border-none bg-slate-900"
                title="Class Video Stream Mirror"
              />
            )}

            {/* Attendance checklist verification alert indicator */}
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto bg-slate-950/85 backdrop-blur-md border border-emerald-500/30 px-3.5 py-2.5 rounded-2xl flex items-center gap-2 text-[10px] sm:text-xs text-slate-300">
              <Check className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="truncate">Real-time attendance logged: <strong className="text-white">{profile?.name}</strong></span>
            </div>
          </div>

          {/* Bottom Controls Panel */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 bg-slate-900/40 p-4 rounded-3xl border border-slate-800">
            <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
              {isAdmin ? (
                <>
                  <button 
                    onClick={toggleCam} 
                    className={cn(
                      "p-4 rounded-2xl active:scale-95 transition-all",
                      isCamOn ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    )}
                  >
                    {isCamOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </button>
                  <button 
                    onClick={toggleMic} 
                    className={cn(
                      "p-4 rounded-2xl active:scale-95 transition-all",
                      isMicOn ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    )}
                  >
                    {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  </button>
                  <button 
                    onClick={toggleScreenShare} 
                    className={cn(
                      "p-4 rounded-2xl active:scale-95 transition-all",
                      isScreenSharing ? 'bg-emerald-500 text-white font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    )}
                    title="Screen Share"
                  >
                    <Monitor className="h-5 w-5" />
                  </button>
                </>
              ) : (
                // Student view-and-chat notice
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-400 font-bold select-none w-full justify-center">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span>View & Listen Mode • Ask Doubts in Live Chat 💬</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Video Signal Engine:</span>
              <span className="text-slate-300 font-bold text-xs bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl flex items-center gap-1.5 shrink-0">
                {!isAdmin && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                {isAdmin ? "WebRTC Broadcast Node" : "Listening Only • Participate via Live Chat"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Sidebar Panel (Chat + Participants) */}
        <aside className="w-full lg:w-96 h-[500px] lg:h-auto border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900 flex flex-col shrink-0 overflow-hidden relative">
          <div className="flex border-b border-slate-800 bg-slate-950 p-2 gap-2">
            <button 
              onClick={() => setActiveSidebarTab('chat')}
              className={cn(
                "flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                activeSidebarTab === 'chat' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Live Chat ({chatMessages.length})</span>
            </button>
            <button 
              onClick={() => setActiveSidebarTab('participants')}
              className={cn(
                "flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                activeSidebarTab === 'participants' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Users className="h-4 w-4" />
              <span>Learners ({participants.length})</span>
            </button>
          </div>

          {activeSidebarTab === 'chat' ? (
            // Chat panel layout
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                    <MessageSquare className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-xs font-medium">Welcome to the Live Class discussion! Be respectful and ask constructive questions.</p>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={cn(
                        "p-3 rounded-2xl text-xs max-w-[85%] flex flex-col gap-1",
                        msg.isTeacher 
                          ? "bg-rose-500/10 border border-rose-500/20 text-rose-200 ml-auto" 
                          : "bg-slate-850 border border-slate-800 text-slate-300"
                      )}
                    >
                      <div className="flex items-center gap-1.5 justify-between">
                        <span className={cn(
                          "font-black tracking-wide",
                          msg.isTeacher ? "text-rose-400 uppercase" : "text-emerald-400"
                        )}>
                          {msg.userName} {msg.isTeacher && "🏆"}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                        </span>
                      </div>
                      <p className="font-medium break-all whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  ))
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendMessage} className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
                <input 
                  type="text"
                  placeholder="Type class comment..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                />
                <button 
                  type="submit" 
                  className="bg-emerald-500 text-white p-3 rounded-2xl active:scale-95 hover:bg-emerald-600 transition-all shadow-md shrink-0"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          ) : (
            // Participants Panel layout
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2 pb-2 border-b border-slate-800">
                Online Classroom Directory
              </div>

              <div className="space-y-2">
                {participants.map((p) => (
                  <div 
                    key={p.id} 
                    className="bg-slate-850 p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative">
                        <div className="h-7 w-7 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-300">
                          {p.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-200 truncate">{p.name}</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                          {p.role === 'admin' ? (
                            <span className="text-emerald-400">Broadcaster 🎓</span>
                          ) : (
                            <span className="text-slate-400">Chat Only 💬</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Raised hand indicator */}
                      {p.raisedHand && (
                        <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-1 rounded-xl text-[9px] font-black flex items-center gap-1 animate-pulse">
                          <span>✋</span>
                          <span>RAISED</span>
                        </span>
                      )}

                      {/* Instructor/Teacher management cockpit tools */}
                      {isAdmin && p.id !== user?.uid && (
                        <div className="flex items-center gap-1">
                          {p.raisedHand && (
                            <button 
                              onClick={() => handleLowerParticipantHand(p.id)}
                              className="bg-slate-800 text-slate-400 hover:text-white px-2 py-1 rounded-xl text-[10px] font-bold"
                              title="Lower Hand"
                            >
                              Lower
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
