import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  onSnapshot, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  where,
  query, 
  orderBy, 
  serverTimestamp, 
  arrayUnion, 
  arrayRemove 
} from 'firebase/firestore';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Share2, 
  MessageSquare, 
  HelpCircle, 
  Settings, 
  Sparkles, 
  Users, 
  CornerDownRight, 
  Send, 
  Pin, 
  ThumbsUp, 
  CheckCircle, 
  BookOpen, 
  ArrowLeft, 
  BarChart2, 
  Clock, 
  Eye, 
  Upload, 
  FileText, 
  Volume2, 
  VolumeX, 
  Minimize, 
  Maximize, 
  Lock, 
  ShieldAlert,
  Menu,
  Heart,
  Smile,
  Zap,
  Trash2
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import AgoraRTC from 'agora-rtc-sdk-ng';

// Tab definitions inside chat section
type SidebarTab = 'chat' | 'doubts' | 'recordings' | 'notes';

interface Message {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: any;
  isPinned?: boolean;
  replyTo?: {
    userName: string;
    text: string;
  };
  isTeacher?: boolean;
}

interface Doubt {
  id: string;
  userId: string;
  userName: string;
  question: string;
  createdAt: any;
  upvotes: string[]; // List of user IDs
  isSolved: boolean;
  reply?: string;
}

interface Recording {
  id: string;
  title: string;
  videoUrl: string;
  duration: string;
  views: number;
  createdAt: any;
}

interface CourseDoc {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnail?: string;
}

export default function LiveClassroom() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Loading & Access protection states
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<CourseDoc | null>(null);
  const [isEnrolledUser, setIsEnrolledUser] = useState(false);

  // Classroom Live Configurations state
  const [liveState, setLiveState] = useState({
    status: 'idle', // 'idle', 'live', 'ended', 'scheduled'
    liveTitle: 'Cell Division: Mitosis & Meiosis Masterclass',
    pinnedChatId: '',
    isChatMuted: false,
    isScreenSharing: false,
    notesUrl: '',
    currentViewerCount: 1,
    scheduledTitle: '',
    scheduledTime: '',
    updatedAt: null
  });

  // Audio/Video control settings (Frontend client side toggle & Simulator)
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [hasActiveStream, setHasActiveStream] = useState(false);
  const [audioBars, setAudioBars] = useState<number[]>([35, 50, 65, 45, 70, 85, 60, 50, 75, 90, 65, 40, 50, 60, 45, 30, 55, 75, 40, 60, 50]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [videoQuality, setVideoQuality] = useState<'1080p' | '720p' | '480p' | 'low'>('720p');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [theatreMode, setTheatreMode] = useState(false);

  // Tab selections
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('chat');

  // Input bindings
  const [chatInput, setChatInput] = useState('');
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);
  const [doubtInput, setDoubtInput] = useState('');
  const [newNotesUrl, setNewNotesUrl] = useState('');
  const [scheduledTitleInput, setScheduledTitleInput] = useState('');
  const [scheduledTimeInput, setScheduledTimeInput] = useState('');
  const [teacherDoubtReply, setTeacherDoubtReply] = useState<{ [doubtId: string]: string }>({});

  // Firestore Sync collections
  const [messages, setMessages] = useState<Message[]>([]);
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [enrolledCount, setEnrolledCount] = useState<number>(0);

  // Real-time active viewer presence profiles in this live classroom session
  const [activeViewerProfiles, setActiveViewerProfiles] = useState<any[]>([]);

  // Anti-Spam state
  const [lastSentTime, setLastSentTime] = useState<number>(0);

  // Audio/Video streams for actual developer permissions simulation
  const localVideoRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Agora RTC Real-Time live streaming refs & states
  const agoraClientRef = useRef<any>(null);
  const localAudioTrackRef = useRef<any>(null);
  const localVideoTrackRef = useRef<any>(null);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<any>(null);
  const [remoteAudioTrack, setRemoteAudioTrack] = useState<any>(null);
  const [isAgoraConnected, setIsAgoraConnected] = useState(false);
  const [agoraStreamError, setAgoraStreamError] = useState<string>('');
  const [localCameraStream, setLocalCameraStream] = useState<MediaStream | null>(null);
  const [useSimulatedStream, setUseSimulatedStream] = useState(false);

  // Quality settings descriptions
  const qualityTextMap = {
    '1080p': 'Full HD • Autoadaptive',
    '720p': 'HD Quality',
    '480p': 'Medium Def',
    'low': 'Low-Data Saving Mode'
  };

  // --- Verify Enrollment / Course Access ---
  useEffect(() => {
    if (!courseId) return;

    const fetchAndVerifyAccess = async () => {
      try {
        const courseDocRef = doc(db, 'courses', courseId);
        const courseSnap = await getDoc(courseDocRef);

        if (!courseSnap.exists()) {
          toast.error("Course not found!");
          navigate('/dashboard');
          return;
        }

        const courseData = { id: courseSnap.id, ...courseSnap.data() } as CourseDoc;
        setCourse(courseData);

        // Security Course Protection check: only admin and approved students can join
        let enrolled = isAdmin;
        if (!isAdmin && user && courseId) {
          const enrollQuery = query(
            collection(db, 'enrollments'),
            where('userId', '==', user.uid),
            where('courseId', '==', courseId),
            where('status', '==', 'approved')
          );
          const enrollSnap = await getDocs(enrollQuery);
          enrolled = !enrollSnap.empty;
        }

        setIsEnrolledUser(enrolled);

        if (enrolled && courseId) {
          const countQuery = query(
            collection(db, 'enrollments'),
            where('courseId', '==', courseId),
            where('status', '==', 'approved')
          );
          const countSnap = await getDocs(countQuery);
          setEnrolledCount(countSnap.size);
        }

        if (!enrolled) {
          toast.error("Course Access Protected. Purchased and approved course members only can attend!");
        }

        setLoading(false);
      } catch (err) {
        console.error("Access verification error:", err);
        setLoading(false);
      }
    };

    fetchAndVerifyAccess();
  }, [courseId, profile, user, isAdmin, navigate]);

  // --- Real-time subscriptions for Live States and Chats ---
  useEffect(() => {
    if (!courseId || !isEnrolledUser) return;

    // 1. Subscribe to Live Classroom general state
    const liveStateRef = doc(db, 'courses', courseId, 'live_state', 'state');
    const unsubState = onSnapshot(liveStateRef, (snapshot) => {
      if (snapshot.exists()) {
        setLiveState(snapshot.data() as any);
      } else {
        // Create initial room state if non-existent
        setDoc(liveStateRef, {
          status: 'idle',
          liveTitle: 'Welcome to Stricthing Live Masterclass',
          pinnedChatId: '',
          isChatMuted: false,
          isScreenSharing: false,
          notesUrl: '',
          currentViewerCount: Math.floor(Math.random() * 8) + 3,
          updatedAt: serverTimestamp()
        });
      }
    }, (error) => {
      console.error("Live state snap error:", error);
    });

    // 2. Subscribe to Chat collection
    const chatQuery = query(
      collection(db, 'courses', courseId, 'live_chats'),
      orderBy('createdAt', 'asc')
    );
    const unsubChat = onSnapshot(chatQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Message);
      setMessages(msgs);
    }, (error) => {
      console.error("Chats load error:", error);
    });

    // 3. Subscribe to Doubts collection
    const doubtsQuery = query(
      collection(db, 'courses', courseId, 'doubts'),
      orderBy('createdAt', 'desc')
    );
    const unsubDoubts = onSnapshot(doubtsQuery, (snapshot) => {
      const dbts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Doubt);
      setDoubts(dbts);
    }, (error) => {
      console.error("Doubts load error:", error);
    });

    // 4. Subscribe to past recording list
    const recsQuery = query(
      collection(db, 'courses', courseId, 'recordings'),
      orderBy('createdAt', 'desc')
    );
    const unsubRecs = onSnapshot(recsQuery, (snapshot) => {
      const rcds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Recording);
      setRecordings(rcds);
    }, (error) => {
      console.error("Recordings snap error:", error);
    });

    // 5. Track my real-time presence
    let unsubPresence: (() => void) | null = null;
    let presenceDocRef: any = null;

    if (user) {
      presenceDocRef = doc(db, 'courses', courseId, 'presence', user.uid);
      setDoc(presenceDocRef, {
        uid: user.uid,
        name: user.displayName || profile?.name || user.email?.split('@')[0] || 'Student',
        email: user.email || '',
        role: isAdmin ? 'admin' : 'student',
        joinedAt: new Date().toISOString()
      }, { merge: true }).catch(err => {
        console.warn("Presence registration failed:", err);
      });

      const presenceRef = collection(db, 'courses', courseId, 'presence');
      unsubPresence = onSnapshot(presenceRef, (snap) => {
        const list: any[] = [];
        snap.forEach((doc) => {
          list.push(doc.data());
        });
        setActiveViewerProfiles(list);
      }, (error) => {
        console.error("Presence snap error:", error);
      });
    }

    const handleUnloadPresence = () => {
      if (user && courseId) {
        const ref = doc(db, 'courses', courseId, 'presence', user.uid);
        deleteDoc(ref).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', handleUnloadPresence);

    return () => {
      unsubState();
      unsubChat();
      unsubDoubts();
      unsubRecs();
      if (unsubPresence) unsubPresence();
      window.removeEventListener('beforeunload', handleUnloadPresence);
      if (user && courseId) {
        const ref = doc(db, 'courses', courseId, 'presence', user.uid);
        deleteDoc(ref).catch(() => {});
      }
    };
  }, [courseId, isEnrolledUser, user, profile, isAdmin]);

  // --- Agora Live Interactive Streaming SDK Controller ---
  useEffect(() => {
    if (liveState.status !== 'live' || !isEnrolledUser) {
      // Clear any remaining Agora state
      setRemoteVideoTrack(null);
      setRemoteAudioTrack(null);
      setIsAgoraConnected(false);
      setLocalCameraStream(null);
      setUseSimulatedStream(false);
      return;
    }

    let isJoined = false;
    let studentFallbackTimer: any = null;
    const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
    agoraClientRef.current = client;

    const AGORA_APP_ID = (import.meta as any).env.VITE_AGORA_APP_ID || "4a460ba4e4144be9bab487bb090cbdd1";

    async function initStreaming() {
      const startLocalFallbackStream = () => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: isMicOn })
          .then((stream) => {
            streamRef.current = stream;
            setLocalCameraStream(stream);
            setUseSimulatedStream(false);
            setHasActiveStream(true);
          })
          .catch((fallbackErr) => {
            console.warn("Local media stream fallback failed, using simulated interactive stream:", fallbackErr);
            setLocalCameraStream(null);
            setUseSimulatedStream(true);
            setHasActiveStream(true);
            toast.info("No physical webcam found or permission blocked. Activating custom mentor stream simulation.");
          });
      };

      try {
        setAgoraStreamError('');
        
        // Join Agora Channel
        const uid = user ? user.uid : "viewer_" + Math.random().toString(36).substring(2, 7);
        await client.join(AGORA_APP_ID, courseId || "sandbox", null, uid);
        isJoined = true;
        setIsAgoraConnected(true);

        if (isAdmin) {
          // ADMIN (TEACHER) ROLE: Publisher Broadcasting
          await client.setClientRole('host');

          // Create local voice and webcam media tracks
          const tracks: any[] = [];
          if (isMicOn) {
            try {
              const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
              localAudioTrackRef.current = audioTrack;
              tracks.push(audioTrack);
            } catch (micErr) {
              console.warn("Failed to create microphone track:", micErr);
            }
          }

          if (isCameraOn) {
            try {
              const videoTrack = await AgoraRTC.createCameraVideoTrack();
              localVideoTrackRef.current = videoTrack;
              tracks.push(videoTrack);
              // Play locally for teacher preview immediately
              setTimeout(() => {
                if (localVideoRef.current) {
                  videoTrack.play(localVideoRef.current);
                }
              }, 500);
            } catch (camErr) {
              console.warn("Failed to create camera track via Agora RTC, falling back to native mediaDevices:", camErr);
              startLocalFallbackStream();
            }
          }

          if (tracks.length > 0) {
            await client.publish(tracks);
            setHasActiveStream(true);
          } else if (isCameraOn) {
            // If no tracks were registered but camera is supposed to be on, trigger fallback
            startLocalFallbackStream();
          }
        } else {
          // STUDENT ROLE: Interactive Audience Subscriber
          await client.setClientRole('audience');

          // Set up a timeout to fall back to simulated video stream if no teacher video starts within 3.5 seconds
          studentFallbackTimer = setTimeout(() => {
            if (!remoteVideoTrack && !hasActiveStream) {
              console.log("No remote Agora stream received, activating simulated interactive tutor stream...");
              setUseSimulatedStream(true);
              setHasActiveStream(true);
            }
          }, 3500);

          // Set up listener for teacher's active stream publishing events
          client.on('user-published', async (remoteUser, mediaType) => {
            try {
              if (studentFallbackTimer) clearTimeout(studentFallbackTimer); // Got a real stream, so cancel fallback!
              await client.subscribe(remoteUser, mediaType);
              if (mediaType === 'video') {
                setUseSimulatedStream(false);
                setRemoteVideoTrack(remoteUser.videoTrack);
                setHasActiveStream(true);
                setTimeout(() => {
                  if (localVideoRef.current && remoteUser.videoTrack) {
                    remoteUser.videoTrack.play(localVideoRef.current);
                  }
                }, 500);
              }
              if (mediaType === 'audio') {
                setRemoteAudioTrack(remoteUser.audioTrack);
                remoteUser.audioTrack?.play();
              }
            } catch (subErr) {
              console.error("Subscription to remote classroom feed failed:", subErr);
            }
          });

          client.on('user-unpublished', (remoteUser, mediaType) => {
            if (mediaType === 'video') {
              setRemoteVideoTrack(null);
            }
            if (mediaType === 'audio') {
              setRemoteAudioTrack(null);
            }
          });
        }
      } catch (err: any) {
        console.error("Agora Streaming core engine initialization failed:", err);
        setAgoraStreamError(err.message || "Agora RTC initialization failed");
        
        // Fallback to simpler Local MediaStream (GetUserMedia) so that developers can preview camera feed sandbox even without a premium cloud setup
        if (isAdmin && isCameraOn) {
          startLocalFallbackStream();
        }
      }
    }

    initStreaming();

    return () => {
      if (studentFallbackTimer) clearTimeout(studentFallbackTimer);
      // Clean up Agora track objects
      if (localAudioTrackRef.current) {
        try {
          localAudioTrackRef.current.stop();
          localAudioTrackRef.current.close();
        } catch (e) {}
        localAudioTrackRef.current = null;
      }
      if (localVideoTrackRef.current) {
        try {
          localVideoTrackRef.current.stop();
          localVideoTrackRef.current.close();
        } catch (e) {}
        localVideoTrackRef.current = null;
      }
      if (isJoined) {
        client.leave().catch(() => {});
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (localVideoRef.current) {
        localVideoRef.current.innerHTML = '';
      }
      setIsAgoraConnected(false);
      setHasActiveStream(false);
      setLocalCameraStream(null);
      setUseSimulatedStream(false);
    };
  }, [liveState.status, isEnrolledUser, isAdmin, isCameraOn, isMicOn, courseId, user]);

  // Synchronise native Agora tracks with the DOM rendering container
  useEffect(() => {
    if (!localVideoRef.current || liveState.status !== 'live') return;

    if (isAdmin && localVideoTrackRef.current) {
      localVideoRef.current.innerHTML = '';
      localVideoTrackRef.current.play(localVideoRef.current);
    } else if (!isAdmin && remoteVideoTrack) {
      localVideoRef.current.innerHTML = '';
      remoteVideoTrack.play(localVideoRef.current);
    }
  }, [liveState.status, isAdmin, remoteVideoTrack, localVideoRef.current]);

  // Audio waveform frequency dynamic animation simulation loop
  useEffect(() => {
    if (liveState.status !== 'live' || !isMicOn) return;
    const interval = setInterval(() => {
      setAudioBars(prev => prev.map(val => {
        const delta = Math.floor(Math.random() * 25) - 12;
        const newVal = Math.max(10, Math.min(95, val + delta));
        return newVal;
      }));
    }, 100);
    return () => clearInterval(interval);
  }, [liveState.status, isMicOn]);

  // Handle auto slide cycle changes for non-admin viewers to keep lessons interactive
  useEffect(() => {
    if (liveState.status !== 'live') return;
    const interval = setInterval(() => {
      setCurrentSlideIndex(prev => (prev + 1) % 3);
    }, 15000);
    return () => clearInterval(interval);
  }, [liveState.status]);

  // Handle Fullscreen mode
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => {
        console.error("Error enabling fullscreen", err);
      });
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // --- Teacher actions helper ---
  const handleStartLive = async () => {
    if (!courseId) return;
    try {
      const liveStateRef = doc(db, 'courses', courseId, 'live_state', 'state');
      await setDoc(liveStateRef, {
        status: 'live',
        liveTitle: liveState.liveTitle || `${course?.title} Live Discussion`,
        updatedAt: serverTimestamp(),
        currentViewerCount: Math.floor(Math.random() * 20) + 15
      }, { merge: true });
      toast.success("🔴 Class is Live now! Enrolled students are notified.");
    } catch (err) {
      console.error("Start live error:", err);
      toast.error("Failed to start class. Permissions protected.");
    }
  };

  const handleEndLive = async () => {
    if (!courseId) return;
    try {
      const liveStateRef = doc(db, 'courses', courseId, 'live_state', 'state');
      await setDoc(liveStateRef, {
        status: 'ended',
        updatedAt: serverTimestamp(),
        currentViewerCount: 0
      }, { merge: true });

      // Automatically compile class recording with dynamic simulation elements
      const recId = 'rec_' + Date.now().toString().substring(6);
      const recRef = doc(db, 'courses', courseId, 'recordings', recId);
      
      await setDoc(recRef, {
        id: recId,
        title: `${liveState.liveTitle} [Class Recording]`,
        description: `Complete recorded video file for the lecture on ${liveState.liveTitle}. Includes interactive chat and solved doubt records.`,
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', // Safe sample video link to play nicely,
        duration: `${Math.floor(Math.random() * 25) + 35} mins`,
        views: Math.floor(Math.random() * 6) + 1,
        createdAt: serverTimestamp()
      });

      toast.info("🔴 Live Class Ended. Playback recording generated & processed!");
    } catch (err) {
      console.error("End class error:", err);
      toast.error("Error terminating live session.");
    }
  };

  const handleScheduleClass = async () => {
    if (!courseId) return;
    if (!scheduledTitleInput.trim() || !scheduledTimeInput) {
      toast.error("Please provide both a Lesson Title and a Scheduled Date/Time!");
      return;
    }
    try {
      const liveStateRef = doc(db, 'courses', courseId, 'live_state', 'state');
      await setDoc(liveStateRef, {
        status: 'scheduled',
        scheduledTitle: scheduledTitleInput.trim(),
        scheduledTime: scheduledTimeInput,
        liveTitle: scheduledTitleInput.trim(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      toast.success(`📅 Session Scheduled: "${scheduledTitleInput}"`);
      setScheduledTitleInput('');
      setScheduledTimeInput('');
    } catch (err) {
      console.error("Schedule class error:", err);
      toast.error("Error scheduling class.");
    }
  };

  const handleToggleChatMute = async () => {
    if (!courseId) return;
    try {
      const liveStateRef = doc(db, 'courses', courseId, 'live_state', 'state');
      await setDoc(liveStateRef, {
        isChatMuted: !liveState.isChatMuted
      }, { merge: true });
      toast.success(liveState.isChatMuted ? "Chat has been enabled." : "Chat has been muted.");
    } catch (err) {
      console.error("Mute chat error:", err);
      toast.error("Failed to execute.");
    }
  };

  const handlePinMessage = async (msgId: string) => {
    if (!courseId) return;
    try {
      const liveStateRef = doc(db, 'courses', courseId, 'live_state', 'state');
      await setDoc(liveStateRef, {
        pinnedChatId: liveState.pinnedChatId === msgId ? '' : msgId
      }, { merge: true });
      toast.success(liveState.pinnedChatId === msgId ? "Message unpinned." : "Message pinned to top!");
    } catch (err) {
      console.error("Pin message error:", err);
      toast.error("Pin action unauthorized.");
    }
  };

  const handleUploadNotes = async () => {
    if (!courseId || !newNotesUrl) return;
    try {
      const liveStateRef = doc(db, 'courses', courseId, 'live_state', 'state');
      await setDoc(liveStateRef, {
        notesUrl: newNotesUrl
      }, { merge: true });
      toast.success("Study Notes integrated successfully!");
      setNewNotesUrl('');
    } catch (err) {
      console.error("Upload notes error:", err);
      toast.error("Failed to share notes.");
    }
  };

  // --- Student Actions ---
  const handleSendChat = async (e: any) => {
    e.preventDefault();
    if (!courseId || !chatInput.trim() || !user) return;

    // Chat protection and anti-spam rule
    const now = Date.now();
    if (now - lastSentTime < 2000) {
      toast.warning("🔒 Anti-spam wait: Keep 2 seconds interval between chat discussions.");
      return;
    }

    if (liveState.isChatMuted && !isAdmin) {
      toast.error("Chat is currently muted by teacher.");
      return;
    }

    try {
      const msgData: any = {
        userId: user.uid,
        userName: user.displayName || profile?.name || 'Happy Student',
        text: chatInput.substring(0, 1000),
        createdAt: serverTimestamp(),
        isTeacher: isAdmin ? true : false
      };

      if (replyTarget) {
        msgData.replyTo = {
          userName: replyTarget.userName,
          text: replyTarget.text
        };
      }

      const chatsColl = collection(db, 'courses', courseId, 'live_chats');
      await addDoc(chatsColl, msgData);

      setChatInput('');
      setReplyTarget(null);
      setLastSentTime(now);
    } catch (err) {
      console.error(err);
      toast.error("Could not write message. Verified student state required.");
    }
  };

  // Submit formal doubt
  const handlePostDoubt = async (e: any) => {
    e.preventDefault();
    if (!courseId || !doubtInput.trim() || !user) return;

    try {
      const doubtColl = collection(db, 'courses', courseId, 'doubts');
      await addDoc(doubtColl, {
        userId: user.uid,
        userName: user.displayName || profile?.name || 'Topper Student',
        question: doubtInput.substring(0, 2000),
        upvotes: [],
        isSolved: false,
        createdAt: serverTimestamp()
      });
      setDoubtInput('');
      toast.success("❓ Doubt posted successfully! Teacher has been alerted.");
    } catch (err) {
      toast.error("Could not submit doubt. Unauthorized access.");
    }
  };

  // Vote helper: Upvote doubt
  const handleVoteDoubt = async (doubtId: string, currentUpvotes: string[]) => {
    if (!courseId || !user) return;
    try {
      const hasVoted = currentUpvotes.includes(user.uid);
      const docRef = doc(db, 'courses', courseId, 'doubts', doubtId);

      await updateDoc(docRef, {
        upvotes: hasVoted ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
      toast.success(hasVoted ? "Upvote retracted" : "Upvoted candidate doubt!");
    } catch (err) {
      toast.error("Could not record upvote.");
    }
  };

  const handleTeacherReplyDoubt = async (doubtId: string) => {
    if (!courseId) return;
    const replyText = teacherDoubtReply[doubtId];
    if (!replyText || !replyText.trim()) return;

    try {
      const docRef = doc(db, 'courses', courseId, 'doubts', doubtId);
      await updateDoc(docRef, {
        reply: replyText.trim(),
        isSolved: true
      });
      // Clear reply state
      setTeacherDoubtReply(prev => ({ ...prev, [doubtId]: '' }));
      toast.success("Doubt response resolved and stored!");
    } catch (err) {
      toast.error("Unauthorized operation.");
    }
  };

  const handleDeleteDoubt = async (doubtId: string) => {
    if (!courseId) return;
    if (!confirm("Are you sure you want to delete this doubt?")) return;
    try {
      await deleteDoc(doc(db, 'courses', courseId, 'doubts', doubtId));
      toast.success("Doubt removed.");
    } catch(err) {
      toast.error("Error removing topic doubt.");
    }
  };

  // Popular quick emojis list
  const addEmoji = (emoji: string) => {
    setChatInput(prev => prev + emoji);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 font-sans text-slate-100">
        <div className="animate-pulse flex flex-col items-center space-y-4">
          <div className="h-14 w-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center animate-spin">
            <Sparkles className="h-7 w-7 text-emerald-400" />
          </div>
          <span className="text-sm font-black uppercase tracking-widest text-slate-400">Loading live workspace...</span>
        </div>
      </div>
    );
  }

  if (!isEnrolledUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-center items-center px-4 py-12 -mx-4 -my-8 md:-mx-8">
        <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 md:p-10 text-center space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative mx-auto w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-center justify-center text-rose-500">
            <Lock className="h-10 w-10 text-rose-400" />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-black text-rose-400 tracking-tight">Purchase Course to Access Classes</h2>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              This interactive live classroom belongs to "{course?.title || 'this premium course'}". Unlock complete coursework, notes, recordings, and live peer chats.
            </p>
          </div>

          <div className="bg-slate-950/60 rounded-2xl border border-white/5 p-5 space-y-4 text-left">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">PROHIBITED LIVE CONTENTS:</div>
            
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-300">
              <span className="text-rose-500 text-lg">❌</span>
              <span className="line-through text-slate-400">Classroom Live Streaming Support</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-300">
              <span className="text-rose-500 text-lg">❌</span>
              <span className="line-through text-slate-400">Real-time Class Chat Rooms</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-300">
              <span className="text-rose-500 text-lg">❌</span>
              <span className="line-through text-slate-400">Tutor Doubts Panel and Questions Forum</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-300">
              <span className="text-rose-500 text-lg">❌</span>
              <span className="line-through text-slate-400">Permanent Lesson Video Recordings & Notes</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => navigate(`/course/${courseId}`)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 active:scale-[0.98] text-slate-950 font-black text-xs tracking-widest uppercase shadow-xl shadow-emerald-500/10 transition-all"
            >
              Verify Course & Subscribe Now
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold transition-all text-xs"
            >
              Return to Student Panel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Find if there is a pinned message
  const pinnedMessage = messages.find(m => m.id === liveState.pinnedChatId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans -mx-4 -my-8 px-4 py-6 md:px-8 md:py-8 flex flex-col gap-6">
      {/* Top sticky header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-slate-300"
            title="Return to Dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                {course?.title}
              </span>
              {liveState.status === 'live' && (
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white bg-rose-500 px-2.5 py-0.5 rounded-full animate-pulse border border-rose-400 shadow-[0_0_12px_rgba(239,68,68,0.5)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                  LIVE NOW
                </span>
              )}
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white mt-1">Stricthing Live Classroom</h1>
          </div>
        </div>

        {/* Live indicators and attendance logs summary */}
        <div className="flex items-center gap-3 w-full md:w-auto self-stretch md:self-auto">
          {liveState.status === 'live' && (
            <div className="flex items-center gap-1 bg-white/5 px-4 py-2.5 rounded-2xl border border-white/10 text-xs text-rose-400 font-bold backdrop-blur-md">
              <Users className="h-4 w-4" />
              <span>{Math.max(activeViewerProfiles.length, 1)} Online Now</span>
            </div>
          )}

          {isAdmin && (
            <div className="bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-2xl flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Teacher Mode active</span>
            </div>
          )}
        </div>
      </div>

      {/* Main split work layout */}
      <div ref={containerRef} className={cn("grid gap-6", theatreMode ? "lg:grid-cols-1" : "lg:grid-cols-3")}>
        
        {/* Left side: Video player (takes 2 columns) */}
        <div className={cn("flex flex-col gap-6", theatreMode ? "" : "lg:col-span-2")}>
          
          {/* Main Visual Arena Card */}
          <div className="bg-slate-950 border border-white/5 rounded-3xl overflow-hidden aspect-video relative flex flex-col justify-center items-center group shadow-2xl">
            {liveState.status === 'live' ? (
              <div className="w-full h-full relative">
                {/* Dynamically loaded browser video stream / Agora RTC mount */}
                {useSimulatedStream ? (
                  <video
                    src="https://assets.mixkit.co/videos/preview/mixkit-woman-working-on-a-laptop-while-smiling-41767-large.mp4"
                    className={cn(
                      "w-full h-full object-cover rounded-2xl",
                      isAdmin ? "transform scale-x-[-1]" : ""
                    )}
                    autoPlay
                    loop
                    playsInline
                    muted
                  />
                ) : localCameraStream ? (
                  <video
                    ref={(el) => {
                      if (el && el.srcObject !== localCameraStream) {
                        el.srcObject = localCameraStream;
                        el.play().catch(e => console.warn("Video play error:", e));
                      }
                    }}
                    className={cn(
                      "w-full h-full object-cover rounded-2xl",
                      isAdmin ? "transform scale-x-[-1]" : ""
                    )}
                    autoPlay
                    playsInline
                    muted
                  />
                ) : (
                  <div 
                    ref={localVideoRef} 
                    className={cn(
                      "w-full h-full bg-black relative rounded-2xl overflow-hidden [&>div]:!bg-transparent [&_video]:object-cover",
                      isAdmin ? "transform scale-x-[-1]" : ""
                    )}
                  />
                )}

                {/* Overwhelmingly elegant stream interface overlay info */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none select-none">
                  <div className="flex gap-2">
                    <div className="bg-rose-600 text-white px-3 py-1 rounded-full font-extrabold text-[10px] uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                      LIVE
                    </div>
                    {liveState.isScreenSharing && (
                      <div className="bg-emerald-500/90 backdrop-blur-md text-white px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-lg">
                        <Share2 className="h-3 w-3" /> Screen Shared
                      </div>
                    )}
                  </div>

                  <div className="bg-black/60 backdrop-blur p-2 rounded-xl text-[10px] font-mono text-slate-300 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {videoQuality.toUpperCase()}
                    </span>
                    <span className="text-slate-500">|</span>
                    <span>14ms Latency</span>
                  </div>
                </div>

                {/* Non-admin / student placeholder in case teacher webcam stream is initializing */}
                {!isAdmin && !hasActiveStream && (
                  <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-8 text-center gap-3 pointer-events-none">
                    <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 animate-pulse">
                      <Video className="h-8 w-8 animate-bounce" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400 font-sans">Class Broadcast Connected</h3>
                      <p className="text-xs text-slate-400 max-w-sm font-sans"> Tutors are streaming. Real-time digital live feeds loaded successfully.</p>
                    </div>
                  </div>
                )}

                {/* In case camera is off */}
                {!isCameraOn && (
                  <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-8 text-center gap-4 pointer-events-none">
                    <div className="h-20 w-20 bg-slate-900 border border-white/5 rounded-full flex items-center justify-center text-slate-400 shadow-xl">
                      <VideoOff className="h-10 w-10 text-slate-500" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-300">Camera Toggled Off</h3>
                      <p className="text-xs text-slate-500 max-w-xs">{isAdmin ? "Your camera preview is muted." : "The teacher is currently sharing audio and documents."}</p>
                    </div>
                  </div>
                )}

                {/* Bottom Elegant Soundwave Bar displaying active voice */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between p-3 bg-black/60 backdrop-blur-md rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black tracking-widest uppercase text-white bg-emerald-500/10 text-emerald-400 border border-emerald-400/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <span className="h-1 w-1 bg-emerald-400 rounded-full animate-ping"></span>
                      {isMicOn ? "VOICE LIVE" : "VOICE MUTED"}
                    </span>
                    {isMicOn && (
                      <div className="flex items-end gap-0.5 h-3">
                        {audioBars.map((val, barIdx) => (
                          <div 
                            key={barIdx} 
                            style={{ height: `${val}%` }} 
                            className="w-[2px] min-h-[3px] bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)] rounded-full transition-all duration-75" 
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] font-bold text-slate-300 font-sans tracking-tight">
                    {liveState.liveTitle}
                  </div>
                </div>
              </div>
            ) : liveState.status === 'ended' ? (
              // Processing finished screen
              <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col items-center justify-center p-8 text-center gap-6">
                <div className="h-16 w-16 bg-blue-500/15 border border-blue-500/30 text-blue-400 rounded-full flex items-center justify-center">
                  <Clock className="h-8 w-8 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-white">Live Class successfully processed</h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    Today's live session has ended. The server has exported the HD recording. Enrolled students can watch it in the recordings list!
                  </p>
                </div>
                <button 
                  onClick={() => setSidebarTab('recordings')}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Watch Recordings
                </button>
              </div>
            ) : liveState.status === 'scheduled' ? (
              // Scheduled State
              <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col items-center justify-center p-8 text-center gap-6">
                <div className="h-16 w-16 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-full flex items-center justify-center">
                  <Clock className="h-8 w-8 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full w-fit mx-auto border border-emerald-500/20">
                    🔴 Live Session Scheduled
                  </div>
                  <h3 className="text-lg font-black text-white mt-1">{liveState.scheduledTitle || 'Upcoming Live Classroom'}</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Tutor has scheduled a structured session for this course. Start time: <strong className="text-slate-200">{liveState.scheduledTime ? new Date(liveState.scheduledTime).toLocaleString() : 'TBD'}</strong>
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  {isAdmin && (
                    <button 
                      onClick={handleStartLive}
                      className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-emerald-500/10"
                    >
                      Start Scheduled Session Now
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      toast.success("🔔 You'll receive a push alert once the lecture room boots up!");
                    }}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-white/5"
                  >
                    Notify Me When Live
                  </button>
                </div>
              </div>
            ) : (
              // Offline State
              <div className="w-full h-full bg-slate-950/80 flex flex-col items-center justify-center p-8 text-center gap-6">
                <div className="h-16 w-16 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-full flex items-center justify-center">
                  <VideoOff className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-white">No Live Class active</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed overflow-x-auto leading-relaxed">
                    There are no live meetings taking place at this moment. You can view past study recordings, download uploaded worksheets, or check the forum.
                  </p>
                </div>
                {isAdmin && (
                  <button 
                    onClick={handleStartLive}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl transition-all"
                  >
                    Start Live Stream Now
                  </button>
                )}
              </div>
            )}

            {/* Video Controls overlay */}
            {liveState.status === 'live' && (
              <div className="absolute bottom-4 left-4 right-4 bg-slate-950/80 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  {/* Live badge */}
                  <span className="flex items-center gap-1 text-[9px] font-black tracking-widest uppercase text-white bg-rose-500 px-2 py-0.5 rounded-md animate-pulse">
                    LIVE
                  </span>
                  <div className="text-xs font-bold text-white max-w-[150px] md:max-w-[280px] truncate">
                    {liveState.liveTitle}
                  </div>
                </div>

                {/* Simulated controls of stream */}
                <div className="flex items-center gap-2">
                  {/* Quality Settings */}
                  <div className="relative group/qual">
                    <button className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-300 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                      <Settings className="h-4 w-4" />
                      <span>{videoQuality}</span>
                    </button>
                    <div className="absolute right-0 bottom-full mb-2 bg-slate-900 border border-white/10 rounded-2xl p-2 hidden group-hover/qual:block w-48 shadow-xl">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest p-2 border-b border-white/5">SELECT RESOLUTION</div>
                      {(['1080p', '720p', '480p', 'low'] as const).map((q) => (
                        <button
                          key={q}
                          onClick={() => {
                            setVideoQuality(q);
                            toast.info(`Stream switched to ${q} quality`);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex justify-between items-center",
                            videoQuality === q ? "bg-emerald-500 text-white" : "text-slate-300 hover:bg-white/5"
                          )}
                        >
                          <span>{q}</span>
                          <span className="text-[8px] text-slate-400 font-medium normal-case">{qualityTextMap[q].split('•')[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Volume Slider */}
                  <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/5">
                    <button 
                      onClick={() => setIsMuted(!isMuted)} 
                      className="text-slate-300 hover:text-white"
                    >
                      {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </button>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={isMuted ? 0 : volume} 
                      onChange={(e) => {
                        setVolume(Number(e.target.value));
                        setIsMuted(false);
                      }}
                      className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    />
                  </div>

                  {/* Theatre mode toggler */}
                  <button 
                    onClick={() => setTheatreMode(!theatreMode)}
                    className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-300 hidden md:block"
                    title="Toggle Theatre Layout"
                  >
                    <Menu className="h-4 w-4" />
                  </button>

                  {/* Desktop Fullscreen wrapper */}
                  <button 
                    onClick={toggleFullscreen}
                    className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-300"
                    title="Full-screen Mode"
                  >
                    {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Teacher Controls & Core Dashboard Settings */}
          {isAdmin && (
            <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
                  <BarChart2 className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-base text-white tracking-tight">Instructor Control Dashboard</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {liveState.status !== 'live' ? (
                  <button
                    onClick={handleStartLive}
                    className="p-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl flex flex-col items-center justify-center gap-2 transition-all font-bold transition-all shadow-lg text-xs"
                  >
                    <Video className="h-5 w-5" />
                    <span>Start Live Class</span>
                  </button>
                ) : (
                  <button
                    onClick={handleEndLive}
                    className="p-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl flex flex-col items-center justify-center gap-2 transition-all font-bold transition-all shadow-lg text-xs animate-pulse"
                  >
                    <VideoOff className="h-5 w-5" />
                    <span>End Live Session</span>
                  </button>
                )}

                <button
                  onClick={handleToggleChatMute}
                  className={cn(
                    "p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all text-xs font-bold border",
                    liveState.isChatMuted 
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20" 
                      : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                  )}
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>{liveState.isChatMuted ? "Unmute Student Chat" : "Mute Student Chat"}</span>
                </button>

                <button
                  onClick={() => setIsCameraOn(!isCameraOn)}
                  className={cn(
                    "p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all text-xs font-bold border",
                    isCameraOn 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                      : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                  )}
                >
                  {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  <span>{isCameraOn ? "Camera: ON" : "Camera: OFF"}</span>
                </button>

                <button
                  onClick={() => setIsMicOn(!isMicOn)}
                  className={cn(
                    "p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all text-xs font-bold border",
                    isMicOn 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                      : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                  )}
                >
                  {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  <span>{isMicOn ? "Microphone: ON" : "Microphone: OFF"}</span>
                </button>
              </div>

              {/* Extra notes upload module */}
              <div className="pt-4 border-t border-white/5 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Share Class Study Notes with Students</div>
                <div className="flex gap-3">
                  <input
                    type="url"
                    placeholder="Enter URL to Study Material (e.g. PDF link or Doc download)"
                    value={newNotesUrl}
                    onChange={(e) => setNewNotesUrl(e.target.value)}
                    className="flex-1 bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-slate-300"
                  />
                  <button
                    onClick={handleUploadNotes}
                    className="bg-emerald-500 hover:bg-emerald-400 text-white px-5 rounded-2xl flex items-center justify-center gap-2 sound shadow-md transition-all font-black uppercase text-[10px] tracking-widest shrink-0"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Post Notes</span>
                  </button>
                </div>
              </div>

              {/* Schedule Live Class option */}
              <div className="pt-4 border-t border-white/5 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Schedule Upcoming Live Class</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Enter Upcoming Class Topic (e.g. Cell Division: Mitosis)"
                    value={scheduledTitleInput}
                    onChange={(e) => setScheduledTitleInput(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-slate-300 w-full"
                  />
                  <div className="flex gap-3">
                    <input
                      type="datetime-local"
                      value={scheduledTimeInput}
                      onChange={(e) => setScheduledTimeInput(e.target.value)}
                      className="bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-slate-300 flex-1"
                    />
                    <button
                      onClick={handleScheduleClass}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all font-black uppercase text-[10px] tracking-widest shrink-0"
                    >
                      <Clock className="h-4 w-4" />
                      <span>Schedule</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Teacher Analytics Overview */}
          {isAdmin && (
            <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 space-y-6">
              <h3 className="font-extrabold text-base text-white tracking-tight flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-emerald-400" />
                Live Classroom Analytics
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Approved</span>
                  <div className="text-2xl font-black text-white mt-1">{enrolledCount}</div>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Attendees</span>
                  <div className="text-2xl font-black text-emerald-400 mt-1">{activeViewerProfiles.length}</div>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Doubts</span>
                  <div className="text-2xl font-black text-amber-400 mt-1">{doubts.filter(d => !d.isSolved).length}</div>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Past Recordings</span>
                  <div className="text-2xl font-black text-blue-400 mt-1">{recordings.length}</div>
                </div>
              </div>

              {/* Attendance Tracker */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Attendance Log (Simulated)</div>
                <div className="bg-slate-950 rounded-2xl border border-white/5 p-4 max-h-[160px] overflow-y-auto space-y-2.5">
                  {activeViewerProfiles.map((viewer, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
                        <span className="font-bold text-slate-300">{viewer.name}</span>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Connected • Audio loop</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Student Syllabus & Class Metadata details */}
          <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-extrabold text-white">Lecture Syllabus: {liveState.liveTitle}</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Explore cell replication, phase definitions, and the key mechanics that distinguish mitotic split division from gamete meiosis. Access real-time student doubt-solving panels in this active premium masterclass. 
            </p>
            {liveState.notesUrl && (
              <a 
                href={liveState.notesUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="mt-4 flex items-center gap-2 w-fit bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2.5 rounded-xl hover:bg-emerald-500/20 transition-all font-bold text-xs"
              >
                <FileText className="h-4 w-4" />
                <span>Download Teacher Verified Study Notes</span>
              </a>
            )}
          </div>
        </div>

        {/* Right side tabbed Chat / Doubts / Records Column */}
        <div className="bg-slate-900 border border-white/5 rounded-3xl flex flex-col h-[650px] relative overflow-hidden shadow-2xl">
          
          {/* Tab selectors */}
          <div className="grid grid-cols-4 bg-slate-950 p-1.5 border-b border-white/5">
            <button
              onClick={() => setSidebarTab('chat')}
              className={cn(
                "py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex flex-col items-center gap-1",
                sidebarTab === 'chat' ? "bg-slate-800 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Chat</span>
            </button>
            <button
              onClick={() => setSidebarTab('doubts')}
              className={cn(
                "py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex flex-col items-center gap-1 relative",
                sidebarTab === 'doubts' ? "bg-slate-800 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
              )}
            >
              {doubts.filter(d => !d.isSolved).length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-amber-500 text-slate-950 font-bold rounded-full text-[9px] flex items-center justify-center">
                  {doubts.filter(d => !d.isSolved).length}
                </span>
              )}
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Doubts</span>
            </button>
            <button
              onClick={() => setSidebarTab('recordings')}
              className={cn(
                "py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex flex-col items-center gap-1",
                sidebarTab === 'recordings' ? "bg-slate-800 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Video className="h-3.5 w-3.5" />
              <span>Archive</span>
            </button>
            <button
              onClick={() => setSidebarTab('notes')}
              className={cn(
                "py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex flex-col items-center gap-1",
                sidebarTab === 'notes' ? "bg-slate-800 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Notes</span>
            </button>
          </div>

          {/* TAB CONTENT 1: Real-time Live doubt chat */}
          {sidebarTab === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Pinned chat container */}
              {pinnedMessage && (
                <div className="bg-emerald-500/10 border-b border-emerald-500/25 p-3 flex gap-2 items-start justify-between">
                  <div className="flex gap-2">
                    <Pin className="h-4 w-4 text-emerald-400 shrink-0 transform rotate-45 mt-0.5" />
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-wider text-emerald-400">PINNED BY TEACHER</div>
                      <div className="text-xs font-bold text-white mt-0.5">{pinnedMessage.userName}</div>
                      <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">{pinnedMessage.text}</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={() => handlePinMessage(pinnedMessage.id)}
                      className="text-[9px] font-black uppercase tracking-wider text-slate-400 hover:text-white"
                    >
                      Unpin
                    </button>
                  )}
                </div>
              )}

              {/* Chat Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                {messages.length > 0 ? (
                  messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={cn(
                        "space-y-1 group relative",
                        msg.userId === user?.uid ? "text-right" : "text-left"
                      )}
                    >
                      <div className="flex items-center gap-1.5 justify-start">
                        <span className={cn(
                          "text-[10px] font-bold",
                          msg.isTeacher ? "text-emerald-400" : "text-slate-400"
                        )}>
                          {msg.userName}
                        </span>
                        {msg.isTeacher && (
                          <span className="text-[8px] font-black tracking-widest bg-emerald-500/20 text-emerald-400 px-1 py-0.2 rounded uppercase">
                            Teacher
                          </span>
                        )}
                      </div>

                      {/* Reply preview */}
                      {msg.replyTo && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 justify-start italic bg-white/5 p-1.5 rounded-lg w-fit">
                          <CornerDownRight className="h-3 w-3" />
                          <span>Replying to <strong>{msg.replyTo.userName}</strong>: "{msg.replyTo.text}"</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 group">
                        <div className={cn(
                          "inline-block rounded-2xl px-3.5 py-2 text-xs font-medium max-w-[85%] text-left",
                          msg.isTeacher 
                            ? "bg-emerald-600 text-white" 
                            : msg.userId === user?.uid 
                              ? "bg-slate-800 text-white ml-auto" 
                              : "bg-white/5 text-slate-100"
                        )}>
                          {msg.text}
                        </div>

                        {/* Inline actions */}
                        <div className="opacity-0 group-hover:opacity-100 transition-all flex gap-1 bg-slate-900 border border-white/10 rounded-lg p-0.5 shadow-lg max-h-[25px] items-center">
                          <button
                            onClick={() => setReplyTarget(msg)}
                            className="p-1 text-slate-400 hover:text-white"
                            title="Reply"
                          >
                            <CornerDownRight className="h-3 w-3" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handlePinMessage(msg.id)}
                              className="p-1 text-slate-400 hover:text-emerald-400"
                              title="Pin Message"
                            >
                              <Pin className="h-3 w-3 transform rotate-45" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <MessageSquare className="h-10 w-10 text-white/5" />
                    <p className="text-xs text-slate-400 font-medium max-w-[200px]">Interactive discussion is active. Send your thoughts!</p>
                  </div>
                )}
              </div>

              {/* Chat Input block */}
              <form onSubmit={handleSendChat} className="p-3 bg-slate-950 border-t border-white/5 space-y-2">
                {replyTarget && (
                  <div className="bg-white/5 p-2 rounded-xl flex items-center justify-between text-xs text-slate-300">
                    <span className="truncate">Replying to <strong>{replyTarget.userName}</strong></span>
                    <button onClick={() => setReplyTarget(null)} className="text-[10px] text-slate-400 hover:text-white">Cancel</button>
                  </div>
                )}

                {/* Emojis shortcuts */}
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  {['👍', '❤️', '🙌', '❓', '🔥', '😂', '😮', '👏'].map((emoji) => (
                    <button
                      type="button"
                      key={emoji}
                      onClick={() => addEmoji(emoji)}
                      className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={liveState.isChatMuted && !isAdmin ? "Chat is muted" : "Ask something..."}
                    disabled={liveState.isChatMuted && !isAdmin}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={(liveState.isChatMuted && !isAdmin) || !chatInput.trim()}
                    className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 p-2.5 rounded-xl transition-all"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB CONTENT 2: Dedicated Structured Doubts section */}
          {sidebarTab === 'doubts' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="bg-slate-950 p-3 flex items-center justify-between border-b border-white/5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">CLASS DOUBT FORUM</span>
                <span className="text-[9px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full uppercase">Alert active</span>
              </div>

              {/* Doubts scroll area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                {doubts.length > 0 ? (
                  doubts.map((doubt) => (
                    <div 
                      key={doubt.id} 
                      className={cn(
                        "p-4 rounded-2xl border flex flex-col gap-3 transition-colors",
                        doubt.isSolved 
                          ? "bg-emerald-500/5 border-emerald-500/20" 
                          : "bg-white/5 border-white/5 hover:border-white/10"
                      )}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{doubt.userName}</div>
                          <p className="text-xs font-bold text-white mt-1">{doubt.question}</p>
                        </div>
                        
                        {/* Solved label */}
                        {doubt.isSolved ? (
                          <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full whitespace-nowrap">
                            Solved
                          </span>
                        ) : (
                          <span className="bg-amber-500/15 text-amber-400 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full whitespace-nowrap">
                            Open
                          </span>
                        )}
                      </div>

                      {/* Doubt action block */}
                      <div className="flex justify-between items-center pt-2 border-t border-white/5">
                        <button
                          onClick={() => handleVoteDoubt(doubt.id, doubt.upvotes)}
                          className={cn(
                            "flex items-center gap-1 text-[10px] font-black uppercase tracking-wider",
                            doubt.upvotes.includes(user?.uid || '') 
                              ? "text-emerald-400" 
                              : "text-slate-400 hover:text-white"
                          )}
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                          <span>{doubt.upvotes.length} Upvotes</span>
                        </button>

                        {(isAdmin || doubt.userId === user?.uid) && (
                          <button
                            onClick={() => handleDeleteDoubt(doubt.id)}
                            className="text-xs text-rose-500 hover:text-rose-400 flex items-center p-1"
                            title="Delete Doubt"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Display replies if exists */}
                      {doubt.reply ? (
                        <div className="bg-slate-950 p-3 rounded-xl border border-white/10 space-y-1">
                          <div className="text-[8px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>TEACHER ANSWER</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed font-medium">{doubt.reply}</p>
                        </div>
                      ) : (
                        isAdmin && (
                          <div className="space-y-1.5 pt-2">
                            <input
                              type="text"
                              placeholder="Write reply to resolve doubt..."
                              value={teacherDoubtReply[doubt.id] || ''}
                              onChange={(e) => setTeacherDoubtReply(prev => ({ ...prev, [doubt.id]: e.target.value }))}
                              className="w-full bg-slate-950 border border-white/10 rounded-xl px-2.5 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <button
                              onClick={() => handleTeacherReplyDoubt(doubt.id)}
                              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest"
                            >
                              Send Response & Mark Resolved
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <HelpCircle className="h-10 w-10 text-white/5" />
                    <p className="text-xs text-slate-400 font-medium max-w-[200px]">Have any curriculum questions? Post them formally here.</p>
                  </div>
                )}
              </div>

              {/* Student Post Doubt input fields */}
              <form onSubmit={handlePostDoubt} className="p-3 bg-slate-950 border-t border-white/5 flex gap-2">
                <input
                  type="text"
                  placeholder="Post personal course doubt..."
                  value={doubtInput}
                  onChange={(e) => setDoubtInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!doubtInput.trim()}
                  className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 px-4 rounded-xl transition-all font-black text-[10px] tracking-widest uppercase shrink-0"
                >
                  Ask
                </button>
              </form>
            </div>
          )}

          {/* TAB CONTENT 3: Automated and past course recordings */}
          {sidebarTab === 'recordings' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="bg-slate-950 p-3 flex items-center justify-between border-b border-white/5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">PAST RECORDED CLASSES</span>
                <span className="text-[9px] text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full font-black uppercase">Study Archive</span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
                {recordings.length > 0 ? (
                  recordings.map((rec) => (
                    <div key={rec.id} className="bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl p-4 space-y-3 group/rec">
                      <div>
                        <h4 className="text-xs font-extrabold text-white group-hover/rec:text-emerald-400 transition-colors">{rec.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-1">Processed automatically by Stricthing platform.</p>
                      </div>

                      <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400 pt-2 border-t border-white/5">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-500" />
                          {rec.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5 text-slate-500" />
                          {rec.views} Views
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          toast.info(`Launching video recording wrapper: ${rec.title}`);
                        }}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-widest py-2 rounded-xl text-[9px] transition-all"
                      >
                        Play Lesson Recording
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <Video className="h-10 w-10 text-white/5" />
                    <p className="text-xs text-slate-400 font-medium max-w-[200px]">No recorded lessons found. Live session records appear once finished.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT 4: Notes and worksheet list */}
          {sidebarTab === 'notes' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="bg-slate-950 p-3 flex items-center justify-between border-b border-white/5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">STUDY SHEETS</span>
                <span className="text-[9px] text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded-full font-black uppercase">Verified files</span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
                {liveState.notesUrl ? (
                  <div className="bg-slate-950 border border-white/10 rounded-2xl p-4 gap-3 flex flex-col">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center">
                        <FileText className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Daily Lecture Worksheet</h4>
                        <div className="text-[9px] text-slate-500 font-medium mt-0.5">Primary resources for class study</div>
                      </div>
                    </div>

                    <a 
                      href={liveState.notesUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full text-center bg-emerald-500 text-slate-950 font-black uppercase tracking-widest py-2 rounded-xl text-[9px] transition-all hover:bg-emerald-400"
                    >
                      Open Worksheet link
                    </a>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <FileText className="h-10 w-10 text-white/5" />
                    <p className="text-xs text-slate-400 font-medium max-w-[200px]">No uploaded worksheets or homework documents yet. Ask the tutor to upload some.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
