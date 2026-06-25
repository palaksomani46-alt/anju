import React, { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  getDoc,
  setDoc,
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  deleteDoc,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../App';
import { 
  Plus, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink, 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  CreditCard,
  Trash2,
  Edit2,
  Eye,
  Calendar,
  MessageCircle,
  Search,
  Filter,
  Mail,
  X,
  Award,
  Download,
  Gift,
  Share2,
  Copy,
  Video,
  Mic,
  Bell,
  AlertCircle,
  Play,
  Square,
  RotateCcw,
  Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { formatPrice, formatDate, cn } from '../lib/utils';
import { CertificateTemplate } from '../components/CertificateTemplate';
import { generateAndSaveCertificate } from '../lib/certificateUtils';

export default function Dashboard() {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(isAdmin ? 'enrollments' : 'my_courses');
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [referredUsers, setReferredUsers] = useState<any[]>([]);
  const [referredEnrollments, setReferredEnrollments] = useState<any[]>([]);
  const [completionRequests, setCompletionRequests] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [siteUsers, setSiteUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [certData, setCertData] = useState<any>(null);
  
  // Admin Filter States
  const [courseSearch, setCourseSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  
  // Admin Form States
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showEditCourse, setShowEditCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [courseForm, setCourseForm] = useState({ title: '', description: '', price: '', thumbnail: '' });

  // Admin Live Streaming Cockpit States
  const [selectedCourseForLive, setSelectedCourseForLive] = useState<string>('');
  const [selectedLiveState, setSelectedLiveState] = useState<any>(null);
  const [liveStreamForm, setLiveStreamForm] = useState({
    title: '',
    scheduledTime: '',
    notesUrl: '',
    timetable: ''
  });
  const [micTestActive, setMicTestActive] = useState(false);
  const [micLevel, setMicLevel] = useState(0);

  // Student Live Subscriptions for purchased/enrolled courses
  const [enrolledLiveStates, setEnrolledLiveStates] = useState<Record<string, any>>({});

  // Xirsys STUN/TURN Setup States for admins
  const [xirsysIdent, setXirsysIdent] = useState('palaksomani');
  const [xirsysSecret, setXirsysSecret] = useState('740646fa-6fdc-11f1-9282-0242ac140003');
  const [xirsysChannel, setXirsysChannel] = useState('channelv5dnpvyq');
  const [isSavingXirsys, setIsSavingXirsys] = useState(false);
  const [isTestingXirsys, setIsTestingXirsys] = useState(false);
  const [xirsysTestResult, setXirsysTestResult] = useState<{ status: 'success' | 'error' | 'warning', message: string } | null>(null);
  const [showXirsysDetails, setShowXirsysDetails] = useState(false);

  // Load saved Xirsys credentials on mount for Admin
  useEffect(() => {
    if (!isAdmin) return;
    const fetchXirsysConfig = async () => {
      try {
        const docRef = doc(db, 'system', 'xirsys');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.ident) setXirsysIdent(data.ident);
          if (data.secret) setXirsysSecret(data.secret);
          if (data.channel) setXirsysChannel(data.channel);
        }
      } catch (err: any) {
        console.warn("Could not load stored Xirsys config from Firestore:", err.message);
      }
    };
    fetchXirsysConfig();
  }, [isAdmin]);

  const handleSaveXirsysConfig = async () => {
    if (!xirsysIdent.trim() || !xirsysSecret.trim()) {
      toast.error("Please enter both Xirsys Ident and Secret.");
      return;
    }

    const toastId = toast.loading("Saving WebRTC signaling settings to cloud...");
    setIsSavingXirsys(true);
    setXirsysTestResult(null);

    try {
      const docRef = doc(db, 'system', 'xirsys');
      await setDoc(docRef, {
        ident: xirsysIdent.trim(),
        secret: xirsysSecret.trim(),
        channel: xirsysChannel.trim() || 'default',
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || 'admin'
      });
      toast.success("WebRTC credentials updated successfully!", { id: toastId });
    } catch (err: any) {
      console.error("Error saving Xirsys configuration:", err);
      toast.error("Failed to save credentials: " + err.message, { id: toastId });
    } finally {
      setIsSavingXirsys(false);
    }
  };

  const handleTestXirsysConfig = async () => {
    if (!xirsysIdent.trim() || !xirsysSecret.trim()) {
      toast.error("Enter Ident and Secret to execute diagnostics.");
      return;
    }

    setIsTestingXirsys(true);
    setXirsysTestResult(null);
    const toastId = toast.loading("Executing secure WebRTC diagnostics...");

    try {
      const response = await fetch('/api/xirsys/test-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ident: xirsysIdent.trim(),
          secret: xirsysSecret.trim(),
          channel: xirsysChannel.trim() || 'default'
        })
      });

      const data = await response.json();
      if (response.ok && data.status === 'success') {
        setXirsysTestResult({
          status: 'success',
          message: `Active STUN/TURN connection verified successfully! Received ${data.iceServers?.length || 0} secure ICE servers.`
        });
        toast.success("Xirsys credentials verified successfully!", { id: toastId });
      } else {
        setXirsysTestResult({
          status: 'error',
          message: `Verification Failed: ${data.message || 'The Xirsys API returned an authorization or connection error.'}`
        });
        toast.error("Xirsys connection check failed.", { id: toastId });
      }
    } catch (err: any) {
      setXirsysTestResult({
        status: 'error',
        message: `Network Error: ${err.message || 'Failed to reach backend diagnostics server.'}`
      });
      toast.error("Failed to execute diagnostics.", { id: toastId });
    } finally {
      setIsTestingXirsys(false);
    }
  };
  
  // Real-time Dashboard notifications state
  const [notifications, setNotifications] = useState<any[]>([]);

  // Subscribe to real-time user-specific notifications
  useEffect(() => {
    if (!user) return;
    try {
      const basicQuery = query(
        collection(db, 'notifications'), 
        where('userId', '==', user.uid)
      );
      const unsub = onSnapshot(basicQuery, (snap) => {
        const list: any[] = [];
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        // Clientside sorting to robustly avoid custom index requirements
        list.sort((a, b) => {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tB - tA;
        });
        setNotifications(list);
      }, (err) => {
        console.warn("Notifications subscription error:", err);
      });
      return unsub;
    } catch (err) {
      console.error("Notifications query configuration failed:", err);
    }
  }, [user]);

  // Handle Mark Notification as Read or dismiss
  const handleMarkNotifRead = async (notifId: string) => {
    try {
      const notifRef = doc(db, 'notifications', notifId);
      await setDoc(notifRef, { isRead: true }, { merge: true });
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleDeleteNotif = async (notifId: string) => {
    try {
      const notifRef = doc(db, 'notifications', notifId);
      await deleteDoc(notifRef);
      setNotifications(prev => prev.filter(n => n.id !== notifId));
      toast.success("Notification dismissed.");
    } catch (err) {
      console.error("Error dismissing notification:", err);
    }
  };

  useEffect(() => {
    if (!profile?.enrolledCourses || profile.enrolledCourses.length === 0) return;
    
    const unsubs = profile.enrolledCourses.map((courseId: string) => {
      const liveStateRef = doc(db, 'courses', courseId, 'live_state', 'state');
      return onSnapshot(liveStateRef, (snap) => {
        if (snap.exists()) {
          setEnrolledLiveStates(prev => ({
            ...prev,
            [courseId]: snap.data()
          }));
        }
      }, (err) => {
        console.warn("Live status snapshot permission lock or error:", err);
      });
    });

    return () => {
      unsubs.forEach((unsub: any) => unsub());
    };
  }, [profile?.enrolledCourses]);

  // Dynamic Microphone Audio stream frequency test loop
  useEffect(() => {
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let microphone: MediaStreamAudioSourceNode | null = null;
    let javascriptNode: ScriptProcessorNode | null = null;
    let stream: MediaStream | null = null;

    if (micTestActive) {
      navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then((s) => {
          stream = s;
          try {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            microphone = audioContext.createMediaStreamSource(s);
            javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

            analyser.smoothingTimeConstant = 0.8;
            analyser.fftSize = 1024;

            microphone.connect(analyser);
            analyser.connect(javascriptNode);
            javascriptNode.connect(audioContext.destination);

            javascriptNode.onaudioprocess = () => {
              if (!analyser) return;
              const array = new Uint8Array(analyser.frequencyBinCount);
              analyser.getByteFrequencyData(array);
              let values = 0;
              const length = array.length;
              for (let i = 0; i < length; i++) {
                values += array[i];
              }
              const average = values / length;
              // Map average representing mic level to value between 0 and 100
              setMicLevel(Math.min(100, Math.round((average / 120) * 100)));
            };
          } catch (audioErr) {
            console.error("Audio contest error", audioErr);
          }
        })
        .catch(err => {
          console.warn("Failed to get audio device for testing:", err);
          toast.error("Could not access microphone for device test.");
          setMicTestActive(false);
        });
    } else {
      setMicLevel(0);
    }

    return () => {
      try {
        if (javascriptNode) javascriptNode.disconnect();
        if (microphone) microphone.disconnect();
        if (audioContext) audioContext.close();
      } catch (e) {}
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [micTestActive]);

  // Pre-load previously saved scheduled stream settings when selecting a target course with real-time sync
  useEffect(() => {
    if (!selectedCourseForLive) {
      setSelectedLiveState(null);
      return;
    }
    const liveStateRef = doc(db, 'courses', selectedCourseForLive, 'live_state', 'state');
    const unsub = onSnapshot(liveStateRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSelectedLiveState(data);
        setLiveStreamForm({
          title: data.scheduledTitle || data.liveTitle || '',
          scheduledTime: data.scheduledTime || '',
          notesUrl: data.notesUrl || '',
          timetable: data.timetable || ''
        });
      } else {
        setSelectedLiveState({
          status: 'idle',
          liveTitle: '',
          pinnedChatId: '',
          isChatMuted: false,
          isScreenSharing: false,
          notesUrl: '',
          currentViewerCount: 0
        });
        setLiveStreamForm({
          title: '',
          scheduledTime: '',
          notesUrl: '',
          timetable: ''
        });
      }
    }, (err) => {
      console.warn("Error subscribing to live classroom state:", err);
    });

    return unsub;
  }, [selectedCourseForLive]);

  const handleSaveLiveSchedule = async (courseId: string) => {
    if (!courseId) {
      toast.error("Please pick a course first!");
      return;
    }
    if (!liveStreamForm.title || !liveStreamForm.scheduledTime) {
      toast.error("Please fill in both the live stream title and scheduled date/time!");
      return;
    }

    try {
      setIsGenerating(true);
      const liveStateRef = doc(db, 'courses', courseId, 'live_state', 'state');
      await setDoc(liveStateRef, {
        status: 'scheduled',
        scheduledTitle: liveStreamForm.title.trim(),
        scheduledTime: liveStreamForm.scheduledTime,
        liveTitle: liveStreamForm.title.trim(),
        notesUrl: liveStreamForm.notesUrl.trim(),
        timetable: liveStreamForm.timetable.trim(),
        notified_4h: false, // Reset trigger flag for server scheduler
        updatedAt: serverTimestamp()
      }, { merge: true });

      toast.success("🗓️ Live Class scheduled successfully!");
    } catch (err: any) {
      console.error("Failed saving schedule:", err);
      toast.error("Failed saving schedule details: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendScheduleNotice = async (courseId: string) => {
    if (!courseId) {
      toast.error("Please select a course to notify students!");
      return;
    }
    if (!liveStreamForm.scheduledTime) {
      toast.error("Please configure the scheduled class timing before sending an alert so students can prepare.");
      return;
    }

    try {
      setIsGenerating(true);
      const courseObj = courses.find(c => c.id === courseId);
      const courseTitle = courseObj?.title || "Your Registered Class";

      const approvedEnrollments = enrollments.filter(e => e.courseId === courseId && e.status === 'approved');
      if (approvedEnrollments.length === 0) {
        toast.info("No approved students have purchased this course yet. No alerts needed!");
        setIsGenerating(false);
        return;
      }

      const alertsRef = collection(db, 'courses', courseId, 'live_alerts');
      await addDoc(alertsRef, {
        title: liveStreamForm.title || `${courseTitle} Live lecture`,
        scheduledTime: liveStreamForm.scheduledTime,
        createdAt: serverTimestamp(),
        courseId: courseId,
        courseTitle: courseTitle,
        recipientUids: approvedEnrollments.map(e => e.userId)
      });

      const liveStateRef = doc(db, 'courses', courseId, 'live_state', 'state');
      await setDoc(liveStateRef, {
        lastNoticeSentAt: new Date().toISOString(),
        hasNoticeActive: true
      }, { merge: true });

      toast.success(`📢 Broadcast alert dispatched to all ${approvedEnrollments.length} approved course purchasers!`);
    } catch (e: any) {
      console.error("Notice error:", e);
      toast.error("Error dispatching schedule alert: " + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChangeLiveStatus = async (courseId: string, newStatus: 'idle' | 'scheduled' | 'live' | 'ended') => {
    if (!courseId) return;
    try {
      setIsGenerating(true);
      const liveStateRef = doc(db, 'courses', courseId, 'live_state', 'state');
      const updates: any = {
        status: newStatus,
        updatedAt: serverTimestamp()
      };
      if (newStatus === 'scheduled') {
        updates.notified_4h = false;
      } else if (newStatus === 'live') {
        updates.liveTitle = liveStreamForm.title.trim() || 'Live masterclass session';
        updates.currentViewerCount = 1;
      } else if (newStatus === 'ended') {
        updates.currentViewerCount = 0;
      }
      await setDoc(liveStateRef, updates, { merge: true });
      toast.success(`Class status updated to ${newStatus.toUpperCase()} successfully!`);
    } catch (err: any) {
      console.error("Error changing live class status:", err);
      toast.error("Failed to update classroom status: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      if (!['enrollments', 'manage_courses', 'manage_users', 'cert_requests'].includes(activeTab)) {
        setActiveTab('enrollments');
      }
    } else {
      if (!['my_courses', 'requests', 'referrals'].includes(activeTab)) {
        setActiveTab('my_courses');
      }
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!user) return;

    // Real-time enrollments
    const enrollQuery = isAdmin ? 
      query(collection(db, 'enrollments'), orderBy('createdAt', 'desc')) : 
      query(collection(db, 'enrollments'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));

    const unsubEnroll = onSnapshot(enrollQuery, (snapshot) => {
      setEnrollments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Enrollment sub error:", error);
      toast.error("Failed to sync enrollments. Please check your connection.");
      setLoading(false);
    });

    // Real-time completion requests
    const certReqQuery = isAdmin ? 
      query(collection(db, 'completion_requests'), orderBy('createdAt', 'desc')) : 
      query(collection(db, 'completion_requests'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));

    const unsubCertReq = onSnapshot(certReqQuery, (snapshot) => {
      setCompletionRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Cert request sub error:", error);
    });

    // Fetch all courses for admin
    const unsubCourses = onSnapshot(collection(db, 'courses'), (snapshot) => {
      setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Courses sub error:", error);
    });

    // Fetch all users for admin
    let unsubUsers = () => {};
    if (isAdmin) {
      unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        setSiteUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        console.error("Users sub error:", error);
      });
    } else {
      // Fetch referred users for students
      const refQuery = query(
        collection(db, 'users'), 
        where('referredBy', 'in', [user.uid, profile?.shortId].filter(Boolean))
      );
      unsubUsers = onSnapshot(refQuery, (snapshot) => {
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        setReferredUsers(users);
        
        // Fetch enrollments status for these users to show in the list
        if (users.length > 0) {
          const uids = users.map((u: any) => u.uid).filter(Boolean);
          // Only fetch if we have UIDs
          if (uids.length > 0) {
             const batchUids = uids.slice(0, 10); // Firestore 'in' limit is 10 for some versions, more for others
             const enrollRefQuery = query(collection(db, 'enrollments'), where('userId', 'in', batchUids));
             onSnapshot(enrollRefQuery, (enrollSnap) => {
               setReferredEnrollments(enrollSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
             });
          }
        }
      });
    }

    return () => {
      unsubEnroll();
      unsubCertReq();
      unsubCourses();
      unsubUsers();
    };
  }, [user, isAdmin]);

  const handleApprove = async (enrollment: any) => {
    try {
      // 1. Update enrollment status
      await updateDoc(doc(db, 'enrollments', enrollment.id), { status: 'approved' });
      
      // 2. Add course to user's profile
      const userRef = doc(db, 'users', enrollment.userId);
      await updateDoc(userRef, {
        enrolledCourses: arrayUnion(enrollment.courseId)
      });

      toast.success("Enrollment approved!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleReject = async (enrollment: any) => {
    try {
      // 1. Update enrollment status
      await updateDoc(doc(db, 'enrollments', enrollment.id), { status: 'rejected' });
      
      // 2. Remove course from user's profile if it was there
      const userRef = doc(db, 'users', enrollment.userId);
      await updateDoc(userRef, {
        enrolledCourses: arrayRemove(enrollment.courseId)
      });

      toast.error("Enrollment rejected");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleFirestoreError = (error: any, operation: string, path: string | null) => {
    const errorInfo = {
      error: error?.message || String(error),
      operationType: operation,
      path: path,
      authInfo: {
        userId: user?.uid,
        email: user?.email,
        emailVerified: user?.emailVerified,
      }
    };
    console.error('Firestore Error Detail:', JSON.stringify(errorInfo, null, 2));
    if (error?.code === 'permission-denied') {
      toast.error("Permission denied. You might not have admin rights.");
    }
    return new Error(JSON.stringify(errorInfo));
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'courses'), {
        ...courseForm,
        price: Number(courseForm.price),
        createdBy: user?.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setShowAddCourse(false);
      setCourseForm({ title: '', description: '', price: '', thumbnail: '' });
      toast.success("Course added successfully");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEditClick = (course: any) => {
    setEditingCourse(course);
    setCourseForm({
      title: course.title,
      description: course.description,
      price: course.price.toString(),
      thumbnail: course.thumbnail || '',
    });
    setShowEditCourse(true);
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    const toastId = toast.loading("Updating course...");
    try {
      const courseRef = doc(db, 'courses', editingCourse.id);
      await updateDoc(courseRef, {
        title: courseForm.title,
        description: courseForm.description,
        price: Number(courseForm.price),
        thumbnail: courseForm.thumbnail,
        updatedAt: serverTimestamp(),
      });
      
      setShowEditCourse(false);
      setEditingCourse(null);
      setCourseForm({ title: '', description: '', price: '', thumbnail: '' });
      toast.success("Course updated successfully", { id: toastId });
    } catch (error: any) {
      toast.error("Update failed: " + error.message, { id: toastId });
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesTitle = course.title.toLowerCase().includes(courseSearch.toLowerCase());
    const price = Number(course.price);
    const matchesMin = minPrice === '' || price >= Number(minPrice);
    const matchesMax = maxPrice === '' || price <= Number(maxPrice);
    return matchesTitle && matchesMin && matchesMax;
  });

  const handleDeleteCourse = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete "${title}"? This will also remove it from all enrolled students and delete all payment history for this course. This action cannot be undone.`)) {
      return;
    }

    const toastId = toast.loading("Cleaning up course data...");
    try {
      // 1. Delete all enrollments related to this course
      const relatedEnrollments = enrollments.filter(e => e.courseId === id);
      if (relatedEnrollments.length > 0) {
        const deletePromises = relatedEnrollments.map(e => deleteDoc(doc(db, 'enrollments', e.id)));
        await Promise.all(deletePromises);
      }

      // 2. Remove course from any user who has it in their profile
      const usersToUpdate = siteUsers.filter(u => u.enrolledCourses?.includes(id));
      if (usersToUpdate.length > 0) {
        const userUpdatePromises = usersToUpdate.map(u => 
          updateDoc(doc(db, 'users', u.id), {
            enrolledCourses: arrayRemove(id)
          })
        );
        await Promise.all(userUpdatePromises);
      }

      // 3. Delete the course
      await deleteDoc(doc(db, 'courses', id));
      
      // 4. Force frontend sync just in case onSnapshot is slow (redundant but safe)
      setCourses(prev => prev.filter(c => c.id !== id));
      
      toast.success(`"${title}" and ${relatedEnrollments.length} related records deleted successfully`, { id: toastId });
    } catch (error: any) {
      console.error("Deletion failed:", error);
      toast.error("Cleanup failed: " + error.message, { id: toastId });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === user?.uid) {
      toast.error("You cannot delete your own admin account.");
      return;
    }

    if (!window.confirm("Are you sure you want to PERMANENTLY delete this user? This will also remove all their course enrollments, certificate requests, and payment records. This action cannot be undone.")) {
      return;
    }

    const toastId = toast.loading("Removing user and clearing data...");
    try {
      // 1. Delete all enrollments related to this user
      const enrollQuery = query(collection(db, 'enrollments'), where('userId', '==', userId));
      const enrollSnap = await getDocs(enrollQuery);
      
      const enrollDeletePromises = enrollSnap.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(enrollDeletePromises);

      // 2. Delete all certificate requests related to this user
      const certQuery = query(collection(db, 'completion_requests'), where('userId', '==', userId));
      const certSnap = await getDocs(certQuery);
      const certDeletePromises = certSnap.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(certDeletePromises);

      // 3. Delete the user document
      await deleteDoc(doc(db, 'users', userId));
      
      toast.success(`User data cleared: ${enrollSnap.size} enrollments and ${certSnap.size} certificate requests removed.`, { id: toastId });
    } catch (error: any) {
      console.error("Cleanup failed:", error);
      toast.error("Cleanup failed: " + error.message, { id: toastId });
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    if (userId === user?.uid) {
      toast.error("You cannot change your own role.");
      return;
    }

    const newRole = currentRole === 'admin' ? 'student' : 'admin';
    if (!window.confirm(`Are you sure you want to make this user a ${newRole}?`)) {
      return;
    }

    const toastId = toast.loading(`Updating user to ${newRole}...`);
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: serverTimestamp()
      });
      toast.success(`User is now a ${newRole}`, { id: toastId });
    } catch (error: any) {
      toast.error("Failed to update role: " + error.message, { id: toastId });
    }
  };

  const downloadExistingCertificate = (courseId: string) => {
    const cert = profile?.certificates?.find((c: any) => c.courseId === courseId);
    if (cert && cert.certificateUrl) {
      const link = document.createElement('a');
      link.href = cert.certificateUrl;
      link.download = `${cert.courseTitle.replace(/\s+/g, '_')}_Certificate.pdf`;
      link.click();
    }
  };

  const handleRequestCertificate = async (course: any) => {
    if (!profile || !user) return;
    
    const existingReq = completionRequests.find(r => r.courseId === course.id && r.status === 'pending');
    if (existingReq) {
      toast.error("You already have a pending request for this certificate.");
      return;
    }

    const toastId = toast.loading("Sending request to admin...");
    try {
      await addDoc(collection(db, 'completion_requests'), {
        userId: user.uid,
        userName: profile.name,
        courseId: course.id,
        courseTitle: course.title,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      toast.success("Request sent! Admin will review and issue your certificate soon.", { id: toastId });
    } catch (error: any) {
      toast.error("Failed to send request: " + error.message, { id: toastId });
    }
  };

  const handleApproveCompletion = async (request: any) => {
    const toastId = toast.loading(`Generating certificate for ${request.userName}...`);
    setIsGenerating(true);
    
    // Set data for the hidden template to render
    const certId = Math.random().toString(36).substring(2, 10).toUpperCase();
    setCertData({
      userName: request.userName,
      courseTitle: request.courseTitle,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      certificateId: certId
    });

    // Wait for the Template to render in the certData state
    setTimeout(async () => {
      try {
        // 1. Generate and save PDF to user profile
        await generateAndSaveCertificate(
          request.userId,
          request.userName,
          request.courseId,
          request.courseTitle
        );
        
        // 2. Add course to completed courses list if not already there
        const userRef = doc(db, 'users', request.userId);
        await updateDoc(userRef, {
          completedCourses: arrayUnion(request.courseId)
        });

        // 3. Update request status
        await updateDoc(doc(db, 'completion_requests', request.id), { 
          status: 'issued',
          certificateId: certId,
          updatedAt: serverTimestamp()
        });

        toast.success(`Certificate issued to ${request.userName}!`, { id: toastId });
      } catch (error: any) {
        toast.error("Failed to issue certificate: " + error.message, { id: toastId });
      } finally {
        setIsGenerating(false);
        setCertData(null);
      }
    }, 800);
  };

  const handleRejectCompletion = async (id: string) => {
    if (!window.confirm("Are you sure you want to reject this certificate request?")) return;
    
    try {
      await updateDoc(doc(db, 'completion_requests', id), { 
        status: 'rejected',
        updatedAt: serverTimestamp()
      });
      toast.error("Certificate request rejected");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-1 w-full lg:w-auto">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
            {isAdmin ? 'Admin' : 'Student'} <span className="text-primary italic">Workspace</span>
          </h1>
          <p className="text-slate-500 font-medium text-sm md:text-base">Welcome back, {profile?.name}</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 w-full lg:w-auto overflow-x-auto no-scrollbar scroll-smooth">
          <div className="flex min-w-max">
            {!isAdmin ? (
              <>
                <button 
                  onClick={() => setActiveTab('my_courses')}
                  className={cn(
                    "flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
                    activeTab === 'my_courses' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'
                  )}
                >
                  <BookOpen className="h-4 w-4" />
                  <span>My Courses</span>
                </button>
                <button 
                  onClick={() => setActiveTab('requests')}
                  className={cn(
                    "flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
                    activeTab === 'requests' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'
                  )}
                >
                  <Clock className="h-4 w-4" />
                  <span>Status</span>
                </button>
                <button 
                  onClick={() => setActiveTab('referrals')}
                  className={cn(
                    "flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
                    activeTab === 'referrals' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'
                  )}
                >
                  <Gift className="h-4 w-4" />
                  <span>Referrals</span>
                </button>
                <button 
                  onClick={() => setActiveTab('live_classes')}
                  className={cn(
                    "flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
                    activeTab === 'live_classes' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'
                  )}
                >
                  <Video className="h-4 w-4 text-rose-500" />
                  <span>Live Classes</span>
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setActiveTab('enrollments')}
                  className={cn(
                    "flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all relative whitespace-nowrap",
                    activeTab === 'enrollments' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'
                  )}
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Enrollments</span>
                  {enrollments.filter(e => e.status === 'pending').length > 0 && (
                    <span className="absolute top-0 right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[10px] items-center justify-center text-white font-black">
                        {enrollments.filter(e => e.status === 'pending').length}
                      </span>
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab('manage_courses')}
                  className={cn(
                    "flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
                    activeTab === 'manage_courses' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'
                  )}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Catalog</span>
                </button>
                <button 
                  onClick={() => setActiveTab('live_classes')}
                  className={cn(
                    "flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
                    activeTab === 'live_classes' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'
                  )}
                >
                  <Video className="h-4 w-4 text-rose-500" />
                  <span>Live Cockpit</span>
                </button>
                <button 
                  onClick={() => setActiveTab('manage_users')}
                  className={cn(
                    "flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
                    activeTab === 'manage_users' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'
                  )}
                >
                  <Users className="h-4 w-4" />
                  <span>Users</span>
                </button>
                <button 
                  onClick={() => setActiveTab('cert_requests')}
                  className={cn(
                    "flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all relative whitespace-nowrap",
                    activeTab === 'cert_requests' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'
                  )}
                >
                  <Award className="h-4 w-4" />
                  <span>Certs</span>
                  {completionRequests.filter(r => r.status === 'pending').length > 0 && (
                    <span className="absolute top-0 right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 text-[10px] items-center justify-center text-white font-black">
                        {completionRequests.filter(r => r.status === 'pending').length}
                      </span>
                    </span>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <AnimatePresence mode="wait">
          {activeTab === 'referrals' && !isAdmin && (
            <motion.div 
              key="referrals"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 sm:p-8 md:p-12 rounded-3xl md:rounded-[2.5rem] text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                      <Gift className="h-4 w-4" />
                      Referral Program
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight leading-tight">Earn ₹500 for <span className="text-emerald-400">50 Referrals!</span></h2>
                    <p className="text-slate-400 font-medium text-xs sm:text-sm max-w-lg leading-relaxed">Invite your friends to level up. When 50 friends join a course using your link, you get a massive ₹500 cash reward directly in your account!</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4 w-full md:w-auto shrink-0">
                    <div className="text-center">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Earned</div>
                      <div className="text-3xl sm:text-4xl font-black text-emerald-400">
                        ₹{referredEnrollments.filter(e => e.status === 'approved').length >= 50 ? 500 : 0}
                      </div>
                    </div>
                    <div className="h-[1px] bg-white/5" />
                    <div className="text-center">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Friends Joined</div>
                      <div className="text-lg sm:text-xl font-black text-white">{referredUsers.length}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-5 sm:p-8 rounded-3xl md:rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-800">Your Sharing Link</h3>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">Send this link to your friends on WhatsApp or Facebook.</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="flex-1 bg-slate-50 border border-slate-100 p-4 rounded-2xl truncate text-xs font-mono text-slate-500 select-all min-w-0">
                      {window.location.origin}/?ref={user?.uid.substring(0, 8)}
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 sm:flex-none bg-slate-900 text-white px-5 py-4 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-md shrink-0 flex items-center justify-center gap-2 cursor-pointer text-xs font-bold uppercase tracking-wider"
                        onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/?ref=${user?.uid.substring(0, 8)}`);
                            toast.success("Link copied! Now paste it on WhatsApp.");
                        }}
                      >
                        <Copy className="h-4 w-4" />
                        <span className="sm:hidden">Copy</span>
                      </button>
                      <button className="flex-1 sm:flex-none bg-emerald-500 text-white px-5 py-4 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-md shrink-0 flex items-center justify-center gap-2 cursor-pointer text-xs font-bold uppercase tracking-wider"
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: 'Stricth Toppers',
                              text: 'Join me and learn new skills. Use my link to sign up!',
                              url: `${window.location.origin}/?ref=${user?.uid.substring(0, 8)}`
                            });
                          } else {
                            navigator.clipboard.writeText(`${window.location.origin}/?ref=${user?.uid.substring(0, 8)}`);
                            toast.success("Link copied! Share it with your friends.");
                          }
                        }}
                      >
                        <Share2 className="h-4 w-4" />
                        <span className="sm:hidden">Share</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">How it works</h4>
                    <div className="grid gap-4">
                      {[
                        { step: "01", text: "Send your link to 50 friends" },
                        { step: "02", text: "They sign up and enroll" },
                        { step: "03", text: "We verify their enrollment" },
                        { step: "04", text: "You get ₹500 instantly!" }
                      ].map((step, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">{step.step}</div>
                          <p className="text-xs sm:text-sm font-medium text-slate-600">{step.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white p-5 sm:p-8 rounded-3xl md:rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                    <div className="flex justify-between items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-800">Your Referrals</h3>
                      <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0">
                        {referredUsers.length} Total
                      </div>
                    </div>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                      {referredUsers.length > 0 ? (
                        referredUsers.map((refUser) => {
                          const userEnrollments = referredEnrollments.filter(e => e.userId === refUser.uid);
                          const hasApproved = userEnrollments.some(e => e.status === 'approved');
                          const isPending = userEnrollments.some(e => e.status === 'pending');
                          const isCompleted = refUser.completedCourses?.length > 0;

                          return (
                            <div key={refUser.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-emerald-100 transition-all">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-400 uppercase shrink-0">
                                  {refUser.name?.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-sm text-slate-800 truncate">{refUser.name}</div>
                                  <div className="text-[10px] text-slate-400 font-medium">{formatDate(refUser.createdAt).split(',')[0]}</div>
                                </div>
                              </div>
                              
                              <div className="text-left sm:text-right shrink-0">
                                {isCompleted ? (
                                  <div className="inline-flex px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-wider items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Completed
                                  </div>
                                ) : hasApproved ? (
                                  <div className="inline-flex px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-wider items-center gap-1">
                                    <BookOpen className="h-3 w-3" />
                                    Enrolled
                                  </div>
                                ) : isPending ? (
                                  <div className="inline-flex px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase tracking-wider items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Pending
                                  </div>
                                ) : (
                                  <div className="inline-flex px-2.5 py-1 bg-slate-200 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-wider">
                                    Signed Up
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-12 space-y-3">
                          <Users className="h-10 w-10 text-slate-200 mx-auto" />
                          <p className="text-sm text-slate-400 font-medium">No friends referred yet.</p>
                        </div>
                      )}
                    </div>

                    {referredUsers.length > 50 && (
                      <div className="pt-4 border-t border-slate-50">
                         <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                           <div 
                             className="h-full bg-emerald-500 transition-all duration-1000" 
                             style={{ width: `${Math.min((referredUsers.length / 100) * 100, 100)}%` }}
                           />
                         </div>
                         <div className="mt-2 flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                           <span>Milestone progress</span>
                           <span>{referredUsers.length}/100</span>
                         </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                        <Gift className="h-5 w-5" />
                      </div>
                      <h4 className="font-bold text-emerald-900 text-sm italic">Pro Tip from Ma'am</h4>
                    </div>
                    <p className="text-xs text-emerald-700 font-medium leading-relaxed">
                      "Help your friends join classes that fit their goals! If you bring 50 members who join a course, you get <strong>₹500</strong> direkt cash. Keep sharing!"
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'enrollments' && isAdmin && (
            <motion.div 
              key="enrollments"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl md:text-2xl font-bold text-slate-800">Enrollment Requests</h2>
                  <p className="text-xs md:text-sm text-slate-500 font-medium">Monitor who is purchasing which course.</p>
                </div>
                <div className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-100 w-fit">
                  {enrollments.filter(e => e.status === 'pending').length} Actions Pending
                </div>
              </div>

              <div className="grid gap-6">
                {enrollments.map((enroll) => (
                  <div key={enroll.id} className="bg-white p-5 md:p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 group hover:shadow-md transition-shadow">
                    <div className="flex gap-4 md:gap-6 items-center w-full md:w-auto overflow-hidden">
                      <div 
                        onClick={() => setSelectedImage(enroll.proofUrl || enroll.paymentScreenshot)}
                        className="h-14 w-14 md:h-16 md:w-16 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 p-1 relative cursor-zoom-in shrink-0"
                      >
                        <img src={enroll.proofUrl || enroll.paymentScreenshot} className="h-full w-full object-cover rounded-xl" alt="Proof" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div className="space-y-1 overflow-hidden">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider whitespace-nowrap">
                            Req
                          </span>
                          <span className="text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">
                            {enroll.amount || '₹0'}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-800 text-base md:text-lg leading-tight truncate">
                          {enroll.userName}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium truncate">Buying: {enroll.courseTitle}</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-50">
                      <div className="flex items-center gap-2 flex-1 md:flex-none">
                        <button 
                          onClick={() => handleApprove(enroll)}
                          disabled={enroll.status === 'approved'}
                          className={`flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 md:px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${enroll.status === 'approved' ? 'bg-emerald-50 text-emerald-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100'}`}
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>{enroll.status === 'approved' ? 'Approved' : 'Approve'}</span>
                        </button>
                        <button 
                          onClick={() => handleReject(enroll)}
                          disabled={enroll.status === 'rejected'}
                          className={`flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 md:px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${enroll.status === 'rejected' ? 'bg-red-50 text-red-400 cursor-not-allowed' : 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600'}`}
                        >
                          <XCircle className="h-4 w-4" />
                          <span>{enroll.status === 'rejected' ? 'Rejected' : 'Reject'}</span>
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => window.open(enroll.paymentScreenshot, '_blank')}
                          className="hidden sm:flex p-3 text-slate-400 hover:text-primary transition-colors bg-slate-50 rounded-xl"
                          title="View Proof"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'manage_courses' && isAdmin && (
            <motion.div 
              key="manage_courses"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-center bg-slate-900 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] text-white">
                <div className="space-y-1 md:space-y-2">
                  <h2 className="text-xl md:text-2xl font-bold">Manage Catalog</h2>
                  <p className="text-slate-400 text-[10px] md:text-sm font-medium">Create and manage your courses.</p>
                </div>
                <button 
                  onClick={() => setShowAddCourse(true)}
                  className="bg-emerald-500 text-white p-3 md:p-4 rounded-xl md:rounded-2xl shadow-lg hover:scale-105 transition-transform shrink-0"
                >
                  <Plus className="h-5 w-5 md:h-6 md:w-6" />
                </button>
              </div>

              {/* Filtering Controls */}
              <div className="bg-white p-4 md:p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Search courses by title..."
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all text-sm"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2 flex-1 md:flex-none">
                      <Filter className="h-3 w-3 md:h-4 md:w-4 text-slate-400 mr-2" />
                      <input 
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="bg-transparent focus:outline-none text-xs md:text-sm w-16 md:w-24"
                      />
                      <span className="text-slate-300 mx-2">|</span>
                      <input 
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="bg-transparent focus:outline-none text-xs md:text-sm w-16 md:w-24"
                      />
                    </div>
                    {(courseSearch || minPrice || maxPrice) && (
                      <button 
                        onClick={() => {
                          setCourseSearch('');
                          setMinPrice('');
                          setMaxPrice('');
                        }}
                        className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors px-2 ml-auto"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-2">
                  Showing {filteredCourses.length} of {courses.length} courses
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
                {filteredCourses.map(course => (
                  <div key={course.id} className="bg-white p-4 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row items-center gap-4 md:gap-6 group">
                    <div className="h-24 w-full sm:h-20 sm:w-32 rounded-2xl overflow-hidden shadow-sm shrink-0">
                      <img src={course.thumbnail || `https://picsum.photos/seed/${course.id}/400/300`} className="h-full w-full object-cover" alt="" />
                    </div>
                    <div className="flex-1 space-y-1 text-center sm:text-left w-full">
                      <h3 className="font-bold text-slate-800 line-clamp-1">{course.title}</h3>
                      <div className="text-lg font-black text-primary">{formatPrice(course.price)}</div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-50 w-full sm:w-auto justify-center sm:justify-end">
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                        <button 
                          onClick={() => handleEditClick(course)}
                          className="p-2 sm:p-3 bg-slate-50 text-slate-400 hover:text-primary rounded-xl transition-colors"
                          title="Edit Course"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteCourse(course.id, course.title)}
                          className="p-2 sm:p-3 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-colors"
                          title="Delete Course"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'manage_users' && isAdmin && (
            <motion.div 
              key="manage_users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl md:text-2xl font-bold text-slate-800">Site Users</h2>
                  <p className="text-xs md:text-sm text-slate-500 font-medium">View and manage all registered users and their details.</p>
                </div>
                <div className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-slate-200 w-fit">
                  {siteUsers.length} Registered
                </div>
              </div>

              {/* User Search */}
              <div className="bg-white p-4 md:p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search users by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all text-sm font-medium"
                  />
                  {userSearch && (
                    <button 
                      onClick={() => setUserSearch('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors"
                    >
                      <X className="h-4 w-4 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid gap-3 md:gap-4">
                {siteUsers
                  .filter(u => 
                    u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
                    u.email?.toLowerCase().includes(userSearch.toLowerCase())
                  )
                  .map((siteUser) => (
                  <div key={siteUser.id} className="bg-white p-4 md:p-5 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group hover:border-emerald-100 transition-colors">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="relative shrink-0">
                        <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center font-bold text-sm">
                          {siteUser.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
                          siteUser.status === 'online' ? "bg-emerald-500" : "bg-slate-300"
                        )} title={siteUser.status || 'offline'} />
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-bold text-slate-800 flex flex-wrap items-center gap-2">
                          <span className="truncate max-w-[150px] sm:max-w-none text-sm md:text-base">{siteUser.name}</span>
                          <button 
                            onClick={() => handleToggleRole(siteUser.id, siteUser.role)}
                            className={cn(
                              "text-[9px] px-1.5 py-0.5 rounded-md uppercase tracking-tighter transition-colors",
                              siteUser.role === 'admin' ? "bg-slate-900 text-white hover:bg-emerald-600" : "bg-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white"
                            )}
                            title="Click to toggle role"
                          >
                            {siteUser.role === 'admin' ? 'Admin' : 'Student'}
                          </button>
                        </div>
                        <div className="text-[10px] md:text-xs text-slate-500 truncate">{siteUser.email}</div>
                        <div className="flex flex-col gap-1 mt-1">
                          {siteUser.referredBy && (() => {
                            const referrer = siteUsers.find(u => u.uid === siteUser.referredBy || u.shortId === siteUser.referredBy);
                            return (
                              <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                                Ref By: {referrer ? referrer.name : siteUser.referredBy}
                              </div>
                            );
                          })()}
                          {(() => {
                            const referralCount = siteUsers.filter(u => u.referredBy === siteUser.uid || u.referredBy === siteUser.shortId).length;
                            return referralCount > 0 && (
                              <div className="text-[10px] text-primary font-bold uppercase tracking-wider flex items-center gap-1">
                                <Users className="h-2.5 w-2.5" />
                                Referred: {referralCount} {referralCount >= 50 ? "🔥 (Earned ₹500 Bonus)" : `(Progress: ${referralCount}/50)`}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-slate-50 mt-1 md:mt-0">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-start md:items-end gap-1">
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Enrolled</div>
                          <div className="flex -space-x-1.5">
                            {siteUser.enrolledCourses?.length > 0 ? (
                              siteUser.enrolledCourses.slice(0, 3).map((_: any, i: number) => (
                                <div key={i} className="w-5 h-5 rounded-full bg-emerald-100 border border-white flex items-center justify-center shadow-sm">
                                  <BookOpen className="w-2 h-2 text-emerald-600" />
                                </div>
                              ))
                            ) : (
                              <span className="text-[9px] text-slate-300 font-bold uppercase">None</span>
                            )}
                            {siteUser.enrolledCourses?.length > 3 && (
                              <div className="w-5 h-5 rounded-full bg-slate-100 border border-white flex items-center justify-center text-[7px] font-bold text-slate-500 shadow-sm">
                                +{siteUser.enrolledCourses.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="h-8 w-[1px] bg-slate-100" />
                        <div className="flex flex-col items-start md:items-end gap-0.5">
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Seen</div>
                          <span className="text-[10px] font-bold text-slate-700 whitespace-nowrap">
                             {siteUser.status === 'online' ? 'Active' : formatDate(siteUser.lastSeen).split(',')[0]}
                          </span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleDeleteUser(siteUser.id)}
                        className="p-2.5 bg-red-50 text-red-400 hover:text-red-600 rounded-xl transition-colors shrink-0"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {siteUsers.length > 0 && siteUsers.filter(u => 
                  u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
                  u.email?.toLowerCase().includes(userSearch.toLowerCase())
                ).length === 0 && (
                  <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-slate-100">
                    <Search className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold">No users found matching "{userSearch}"</p>
                    <button onClick={() => setUserSearch('')} className="mt-2 text-emerald-500 font-bold hover:underline">Clear Search</button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'live_classes' && (
            <motion.div 
              key="live_classes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {isAdmin ? (
                /* --- TEACHER / ADMIN LIVE COCKPIT --- */
                <div className="space-y-8">
                  <div className="bg-slate-900 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                      <h2 className="text-xl md:text-3xl font-black tracking-tight">Live Classes Control Cockpit</h2>
                      <p className="text-slate-450 text-xs md:text-sm font-medium">Broadcast interactive high-fidelity video streams, schedule lectures, and manage student presence.</p>
                    </div>
                    <span className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] uppercase font-black px-4 py-2 rounded-full tracking-widest animate-pulse flex items-center gap-1.5 shrink-0">
                      <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                      Streaming Center
                    </span>
                  </div>

                  {/* WebRTC TURN/STUN Configuration Box */}
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-[2rem] border border-slate-200/60 shadow-sm space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-900 text-white rounded-2xl">
                          <Settings className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm md:text-base flex items-center gap-2">
                            <span>WebRTC STUN/TURN Signaling Settings (Xirsys)</span>
                            <span className="bg-emerald-50 text-emerald-700 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Secure Cloud Backup</span>
                          </h3>
                          <p className="text-slate-500 text-xs font-semibold">Enter your Xirsys API credentials below to establish secure peer-to-peer audio/video connections.</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowXirsysDetails(!showXirsysDetails)}
                        className="text-xs font-bold text-slate-650 bg-white hover:bg-slate-50 px-4 py-2 rounded-xl border border-slate-250 shadow-sm transition-colors"
                      >
                        {showXirsysDetails ? 'Hide Panel' : 'Configure Credentials'}
                      </button>
                    </div>

                    {showXirsysDetails && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="pt-4 border-t border-slate-200/60 space-y-4 overflow-hidden"
                      >
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">Xirsys Ident (Username)</label>
                            <input 
                              type="text"
                              placeholder="e.g. your-username"
                              value={xirsysIdent}
                              onChange={(e) => setXirsysIdent(e.target.value)}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all text-xs font-bold text-slate-700 font-mono"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">Xirsys Secret (API Key)</label>
                            <input 
                              type="password"
                              placeholder="e.g. your-api-key-token"
                              value={xirsysSecret}
                              onChange={(e) => setXirsysSecret(e.target.value)}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all text-xs font-bold text-slate-700 font-mono"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">Xirsys Channel (Optional)</label>
                            <input 
                              type="text"
                              placeholder="e.g. default"
                              value={xirsysChannel}
                              onChange={(e) => setXirsysChannel(e.target.value)}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all text-xs font-bold text-slate-700 font-mono"
                            />
                          </div>
                        </div>

                        {xirsysTestResult && (
                          <div className={cn(
                            "p-4 rounded-2xl border text-xs font-medium space-y-1 transition-all",
                            xirsysTestResult.status === 'success' 
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                              : "bg-rose-50 border-rose-200 text-rose-800"
                          )}>
                            <p className="font-bold uppercase tracking-wider text-[10px]">
                              {xirsysTestResult.status === 'success' ? '⚡ Diagnostic Verification Success' : '❌ Diagnostic Verification Failed'}
                            </p>
                            <p className="font-semibold leading-relaxed">{xirsysTestResult.message}</p>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                          <button 
                            onClick={handleSaveXirsysConfig}
                            disabled={isSavingXirsys}
                            className="flex-1 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
                          >
                            {isSavingXirsys ? 'Saving...' : 'Save credentials'}
                          </button>
                          <button 
                            onClick={handleTestXirsysConfig}
                            disabled={isTestingXirsys}
                            className="flex-1 py-3 bg-white text-slate-700 rounded-2xl font-bold hover:bg-slate-50 border border-slate-200 text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2"
                          >
                            {isTestingXirsys ? 'Testing connection...' : 'Test Connection / Verify'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Course Selector card */}
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-850">Select Active Course for Live Broadcast</h3>
                      <p className="text-slate-400 text-xs font-semibold">Select a course to set up scheduling, broadcast triggers, or upload past recordings.</p>
                    </div>
                    <select 
                      value={selectedCourseForLive}
                      onChange={(e) => setSelectedCourseForLive(e.target.value)}
                      className="w-full md:w-96 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-705 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all shadow-sm"
                    >
                      <option value="">-- Choose a course to broadcast --</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>{course.title}</option>
                      ))}
                    </select>
                  </div>

                  {!selectedCourseForLive ? (
                    <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-slate-100 border-dashed">
                      <Video className="h-12 w-12 text-slate-300 mx-auto mb-4 animate-bounce" />
                      <p className="text-slate-500 font-bold mb-2">No Course Selected</p>
                      <p className="text-slate-400 text-xs max-w-sm mx-auto">Please select a course from the dropdown above to view live scheduling, alert students, or activate rooms.</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Configuration Form Card */}
                      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                        <div className="border-b border-slate-50 pb-4">
                          <h4 className="font-bold text-lg text-slate-800">1. Configure Class Metadata</h4>
                          <p className="text-slate-400 text-xs">Set up topics, timings, and custom study materials.</p>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">Session / Lecture Title</label>
                            <input 
                              type="text"
                              placeholder="e.g. Masterclass: Advanced Trigonometry Tricks"
                              value={liveStreamForm.title}
                              onChange={(e) => setLiveStreamForm(prev => ({ ...prev, title: e.target.value }))}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all text-xs font-bold text-slate-700"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">Scheduled Date & Time</label>
                            <input 
                              type="datetime-local"
                              value={liveStreamForm.scheduledTime}
                              onChange={(e) => setLiveStreamForm(prev => ({ ...prev, scheduledTime: e.target.value }))}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all text-xs font-bold text-slate-700"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">Class Notes / Study PDF URL</label>
                            <input 
                              type="url"
                              placeholder="e.g. https://drive.google.com/notes.pdf"
                              value={liveStreamForm.notesUrl}
                              onChange={(e) => setLiveStreamForm(prev => ({ ...prev, notesUrl: e.target.value }))}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all text-xs font-bold text-slate-700"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">Timetable Outline / Description</label>
                            <textarea 
                              placeholder="e.g. 04:00 PM: Introduction, 04:15 PM: Important formulas, 05:00 PM: Q&A session"
                              value={liveStreamForm.timetable}
                              rows={3}
                              onChange={(e) => setLiveStreamForm(prev => ({ ...prev, timetable: e.target.value }))}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all text-xs font-bold text-slate-700"
                            />
                          </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button 
                            onClick={() => handleSaveLiveSchedule(selectedCourseForLive)}
                            disabled={isGenerating}
                            className="flex-1 py-3.5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
                          >
                            <Calendar className="h-4 w-4" />
                            <span>Save Schedule</span>
                          </button>
                          <button 
                            onClick={() => handleSendScheduleNotice(selectedCourseForLive)}
                            disabled={isGenerating}
                            className="flex-1 py-3.5 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
                          >
                            <Bell className="h-4 w-4" />
                            <span>Notify Students</span>
                          </button>
                        </div>
                      </div>

                      {/* Room Controllers & Broadcaster Actions */}
                      <div className="space-y-6">
                        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                          <div className="border-b border-slate-50 pb-4">
                            <h4 className="font-bold text-lg text-slate-800">2. Active Broadcast Signals</h4>
                            <p className="text-slate-400 text-xs">Transition active server rooms and start broadcasting signals.</p>
                          </div>

                          {/* Room Status Indicator */}
                          <div className={cn(
                            "p-5 rounded-3xl border flex items-center justify-between gap-4",
                            selectedLiveState?.status === 'live' 
                              ? "bg-rose-50 border-rose-200 text-rose-800" 
                              : selectedLiveState?.status === 'scheduled'
                                ? "bg-amber-50 border-amber-200 text-amber-800"
                                : "bg-slate-50 border-slate-200 text-slate-500"
                          )}>
                            <div className="space-y-1">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Classroom state</span>
                              <p className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
                                {selectedLiveState?.status === 'live' && <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />}
                                <span>{selectedLiveState?.status?.toUpperCase() || 'IDLE'}</span>
                              </p>
                            </div>
                            <span className="text-xs font-bold text-slate-500">
                              {selectedLiveState?.status === 'live' ? 'Students can join now' : 'Room is closed'}
                            </span>
                          </div>

                          {/* Trigger buttons */}
                          <div className="grid grid-cols-2 gap-3">
                            <button 
                              onClick={() => handleChangeLiveStatus(selectedCourseForLive, 'live')}
                              className="py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md"
                            >
                              <Play className="h-3.5 w-3.5" />
                              <span>Go Live 🔴</span>
                            </button>
                            <button 
                              onClick={() => handleChangeLiveStatus(selectedCourseForLive, 'ended')}
                              className="py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md"
                            >
                              <Square className="h-3.5 w-3.5" />
                              <span>End Lecture</span>
                            </button>
                          </div>

                          <div className="pt-2">
                            <button 
                              onClick={() => handleChangeLiveStatus(selectedCourseForLive, 'idle')}
                              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span>Reset Room to Idle</span>
                            </button>
                          </div>

                          {/* Giant enter classroom button */}
                          <div className="pt-4 border-t border-slate-50">
                            <button 
                              onClick={() => navigate(`/live/${selectedCourseForLive}`)}
                              className={cn(
                                "w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2.5 transition-all shadow-lg",
                                selectedLiveState?.status === 'live'
                                  ? "bg-emerald-500 text-white hover:bg-emerald-600 animate-pulse shadow-emerald-100"
                                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
                              )}
                              disabled={selectedLiveState?.status !== 'live'}
                            >
                              <Video className="h-4 w-4" />
                              <span>Enter Live Classroom 🎥</span>
                            </button>
                          </div>
                        </div>

                        {/* Add Recording sub-card */}
                        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                          <div className="border-b border-slate-50 pb-2">
                            <h4 className="font-bold text-sm text-slate-800">Archive Session Recording</h4>
                            <p className="text-slate-400 text-[10px]">Publish the recorded video of the ended lecture for self-paced revision.</p>
                          </div>
                          
                          <div className="space-y-3">
                            <input 
                              type="text" 
                              id="rec_title"
                              placeholder="e.g. Algebra Part 2 - Complete Recording" 
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold focus:outline-none text-slate-700"
                            />
                            <input 
                              type="url" 
                              id="rec_url"
                              placeholder="e.g. Video stream link (MP4, YouTube, etc.)" 
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold focus:outline-none text-slate-700"
                            />
                            <button 
                              onClick={async () => {
                                const titleInp = document.getElementById('rec_title') as HTMLInputElement;
                                const urlInp = document.getElementById('rec_url') as HTMLInputElement;
                                if (!titleInp?.value || !urlInp?.value) {
                                  toast.error("Please fill in both the recording title and video link!");
                                  return;
                                }
                                try {
                                  setIsGenerating(true);
                                  const recsCol = collection(db, 'courses', selectedCourseForLive, 'recordings');
                                  await addDoc(recsCol, {
                                    title: titleInp.value.trim(),
                                    videoUrl: urlInp.value.trim(),
                                    createdAt: serverTimestamp()
                                  });
                                  titleInp.value = '';
                                  urlInp.value = '';
                                  toast.success("📼 Session Recording archived successfully!");
                                } catch (e: any) {
                                  toast.error("Failed to archive recording: " + e.message);
                                } finally {
                                  setIsGenerating(false);
                                }
                              }}
                              className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all"
                            >
                              Publish Recording
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* --- STUDENT LIVE CLASSROOM PORTAL --- */
                <div className="space-y-8">
                  <div className="bg-slate-900 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                      <h2 className="text-xl md:text-3xl font-black tracking-tight">Your Live Lectures</h2>
                      <p className="text-slate-400 text-xs md:text-sm font-medium">Join real-time classrooms, download lecture handouts, and review lesson recordings.</p>
                    </div>
                    <span className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] uppercase font-black px-4 py-2 rounded-full tracking-widest flex items-center gap-1.5 shrink-0">
                      <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
                      Student Hub
                    </span>
                  </div>

                  {/* Active Live Classes List */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-2">🔴 Active Stream Chambers</h3>
                    
                    {courses.filter(c => profile?.enrolledCourses?.includes(c.id) && enrolledLiveStates[c.id]?.status === 'live').length === 0 ? (
                      <div className="text-center py-10 bg-slate-50 rounded-3xl border border-slate-100">
                        <Video className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-400 text-xs font-bold">No sessions are currently broadcasting live.</p>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-6">
                        {courses.filter(c => profile?.enrolledCourses?.includes(c.id) && enrolledLiveStates[c.id]?.status === 'live').map(course => (
                          <div key={course.id} className="bg-white p-6 rounded-[2rem] border-2 border-rose-400 shadow-xl flex flex-col gap-5 relative overflow-hidden group">
                            {/* Live glowing badge */}
                            <div className="absolute top-4 right-4 bg-rose-500 text-white font-black uppercase text-[9px] tracking-widest px-3 py-1 rounded-full animate-pulse flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-white" />
                              <span>LIVE NOW</span>
                            </div>

                            <div className="space-y-2">
                              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">{course.title}</span>
                              <h4 className="font-bold text-lg text-slate-900 leading-tight">
                                {enrolledLiveStates[course.id]?.liveTitle || 'Interactive Lecture Room'}
                              </h4>
                              {enrolledLiveStates[course.id]?.timetable && (
                                <p className="text-slate-500 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 line-clamp-2">
                                  {enrolledLiveStates[course.id]?.timetable}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-col gap-2.5 mt-auto">
                              {enrolledLiveStates[course.id]?.notesUrl && (
                                <a 
                                  href={enrolledLiveStates[course.id]?.notesUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-center font-bold text-xs flex items-center justify-center gap-2 transition-all"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  <span>Download Lesson Material</span>
                                </a>
                              )}
                              <button 
                                onClick={() => navigate(`/live/${course.id}`)}
                                className="w-full py-3.5 bg-rose-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-rose-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-100 animate-pulse"
                              >
                                <Video className="h-4 w-4" />
                                <span>Join Broadcast Lecture 🎥</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Scheduled Classes List */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-2">🗓️ Upcoming Classes Timetable</h3>
                    
                    {courses.filter(c => profile?.enrolledCourses?.includes(c.id) && enrolledLiveStates[c.id]?.status === 'scheduled').length === 0 ? (
                      <div className="text-center py-10 bg-slate-50 rounded-3xl border border-slate-100">
                        <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-400 text-xs font-bold">No upcoming classes have been scheduled yet.</p>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-6">
                        {courses.filter(c => profile?.enrolledCourses?.includes(c.id) && enrolledLiveStates[c.id]?.status === 'scheduled').map(course => (
                          <div key={course.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{course.title}</span>
                              <div className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                <span>SCHEDULED</span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <h4 className="font-bold text-base text-slate-800 leading-snug">
                                {enrolledLiveStates[course.id]?.scheduledTitle || 'Lecture'}
                              </h4>
                              <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs font-bold text-slate-650">
                                <Calendar className="h-4 w-4 text-emerald-550" />
                                <span>
                                  {enrolledLiveStates[course.id]?.scheduledTime ? new Date(enrolledLiveStates[course.id].scheduledTime).toLocaleString() : 'TBD'}
                                </span>
                              </div>
                              {enrolledLiveStates[course.id]?.timetable && (
                                <p className="text-slate-400 text-xs font-medium">
                                  <strong>Plan:</strong> {enrolledLiveStates[course.id]?.timetable}
                                </p>
                              )}
                            </div>

                            {enrolledLiveStates[course.id]?.notesUrl && (
                              <a 
                                href={enrolledLiveStates[course.id]?.notesUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="mt-auto py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl text-center font-bold text-xs flex items-center justify-center gap-2 transition-all border border-slate-150"
                              >
                                <Download className="h-3.5 w-3.5 text-slate-400" />
                                <span>Download Prep Notes</span>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Past Recordings Archive */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-2">📼 Saved Recordings (Archives)</h3>
                    
                    <div className="text-center py-10 bg-slate-50 rounded-3xl border border-slate-100">
                      <Volume2 className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-400 text-xs font-bold">Past session archives can be accessed directly inside each course modules section.</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'my_courses' && !isAdmin && (
            <motion.div 
              key="my_courses"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* User Search Bar */}
              {profile?.enrolledCourses?.length > 0 && (
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                  <div className="flex-1 relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Search your enrolled courses..."
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all text-sm font-medium"
                    />
                    {courseSearch && (
                      <button 
                        onClick={() => setCourseSearch('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors"
                      >
                        <X className="h-4 w-4 text-slate-400" />
                      </button>
                    )}
                  </div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap px-2">
                    {courses.filter(c => 
                      profile?.enrolledCourses?.includes(c.id) && 
                      c.title.toLowerCase().includes(courseSearch.toLowerCase())
                    ).length} Enrolled Courses
                  </div>
                </div>
              )}



              <div className="grid sm:grid-cols-2 gap-4 md:gap-8">
                {courses
                  .filter(c => 
                    profile?.enrolledCourses?.includes(c.id) && 
                    c.title.toLowerCase().includes(courseSearch.toLowerCase())
                  )
                  .map(course => (
                    <div key={course.id} className="bg-white p-4 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 flex flex-col gap-4 md:gap-6 shadow-sm hover:shadow-xl transition-all group">
                      <div className="relative aspect-video rounded-2xl md:rounded-3xl overflow-hidden">
                        <img src={course.thumbnail || `https://picsum.photos/seed/${course.id}/800/600`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                        <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button className="bg-white text-primary px-5 py-2.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl font-bold shadow-xl flex items-center space-x-2 text-xs md:text-base">
                            <BookOpen className="h-4 w-4 md:h-5 md:w-5" />
                            <span>Continue</span>
                          </button>
                        </div>
                      </div>
                      <div className="space-y-3 md:space-y-4 px-1">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="text-base md:text-xl font-bold text-slate-800 leading-tight">{course.title}</h3>
                          <div className="bg-emerald-100 text-emerald-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest shrink-0">
                            Active
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="w-full bg-slate-100 h-1.5 md:h-2 rounded-full overflow-hidden">
                            <div className={cn(
                              "h-full transition-all duration-1000",
                              profile?.completedCourses?.includes(course.id) ? "w-full bg-emerald-500" : "w-1/3 bg-emerald-500"
                            )}></div>
                          </div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span>{profile?.completedCourses?.includes(course.id) ? "100%" : "35%"} Complete</span>
                            {!profile?.completedCourses?.includes(course.id) && <span className="hidden xs:inline">Next: Module 4</span>}
                          </div>
                        </div>

                        <div className="pt-2 space-y-2">
                          {profile?.completedCourses?.includes(course.id) ? (
                            <button 
                              onClick={() => downloadExistingCertificate(course.id)}
                              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-bold hover:bg-emerald-100 transition-all border border-emerald-100 text-xs"
                            >
                              <Download className="h-4 w-4" />
                              <span>Download Certificate</span>
                            </button>
                          ) : (
                            <div>
                              {completionRequests.find(r => r.courseId === course.id && r.status === 'pending') ? (
                                <div className="w-full py-3 bg-slate-50 text-slate-400 rounded-2xl font-bold border border-slate-100 flex items-center justify-center gap-2 cursor-default text-xs">
                                  <Clock className="h-4 w-4" />
                                  <span>Pending Approval</span>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => handleRequestCertificate(course)}
                                  disabled={isGenerating}
                                  className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50 text-xs"
                                >
                                  <Award className="h-4 w-4" />
                                  <span>{isGenerating ? "Processing..." : "Request Certificate"}</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                
                {(!profile?.enrolledCourses || profile.enrolledCourses.length === 0) && (
                  <div className="col-span-2 text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                    <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold mb-4">You haven't enrolled in any courses yet</p>
                    <button onClick={() => window.scrollTo(0, 0)} className="text-primary font-bold hover:underline">Explore Courses</button>
                  </div>
                )}

                {profile?.enrolledCourses?.length > 0 && courseSearch && courses.filter(c => 
                  profile?.enrolledCourses?.includes(c.id) && 
                  c.title.toLowerCase().includes(courseSearch.toLowerCase())
                ).length === 0 && (
                  <div className="col-span-2 text-center py-20 bg-slate-50 rounded-[3rem] border border-slate-100">
                    <Search className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold">No enrolled courses found matching "{courseSearch}"</p>
                    <button onClick={() => setCourseSearch('')} className="mt-2 text-emerald-500 font-bold hover:underline">Clear Search</button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'cert_requests' && isAdmin && (
            <motion.div 
              key="cert_requests"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl md:text-2xl font-bold text-slate-800">Certificate Requests</h2>
                  <p className="text-xs md:text-sm text-slate-500 font-medium">Approve completion requests to issue official certificates.</p>
                </div>
                <div className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-100 w-fit">
                  {completionRequests.filter(r => r.status === 'pending').length} Unissued
                </div>
              </div>

              <div className="grid gap-4">
                {completionRequests.map((req) => (
                  <div key={req.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-emerald-100 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-slate-50 rounded-xl flex items-center justify-center text-emerald-600">
                        <Award className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">{req.userName}</h3>
                        <p className="text-xs text-slate-400 font-medium">Course: {req.courseTitle}</p>
                        <p className="text-[10px] text-slate-400">{formatDate(req.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                      {req.status === 'pending' ? (
                        <>
                          <button 
                            onClick={() => handleApproveCompletion(req)}
                            disabled={isGenerating}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Issue Certificate
                          </button>
                          <button 
                            onClick={() => handleRejectCompletion(req.id)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-100 text-slate-500 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </button>
                        </>
                      ) : (
                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${req.status === 'issued' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-400'}`}>
                          {req.status === 'issued' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                          {req.status}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {completionRequests.length === 0 && (
                  <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                    <Award className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold">No certificate requests found</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}



          {activeTab === 'requests' && !isAdmin && (
            <motion.div key="requests" className="space-y-6">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800">Enrollment Status</h2>
              <div className="grid gap-4 md:gap-6">
                {enrollments.map(enroll => (
                  <div key={enroll.id} className="bg-white p-4 md:p-6 rounded-[2rem] border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl shrink-0 ${enroll.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : enroll.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                        {enroll.status === 'approved' ? <CheckCircle className="h-5 w-5 md:h-6 md:w-6" /> : enroll.status === 'pending' ? <Clock className="h-5 w-5 md:h-6 md:w-6" /> : <XCircle className="h-5 w-5 md:h-6 md:w-6" />}
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-slate-800 text-sm md:text-base leading-tight">{enroll.courseTitle}</h3>
                        <div className="text-[10px] md:text-xs text-slate-400">ID: {enroll.id.slice(-8).toUpperCase()} • {formatDate(enroll.createdAt)}</div>
                        {enroll.status === 'approved' && (
                          <div className="text-[10px] font-bold text-emerald-600 animate-pulse mt-1">
                            🎉 Access Granted! Our team will contact you in 24 hours.
                          </div>
                        )}
                        {enroll.status === 'rejected' && (
                          <div className="text-[10px] font-bold text-red-500 mt-1">
                             ❌ Request Rejected. Contact support if needed.
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="w-full sm:w-auto text-right flex items-center justify-between sm:block">
                      <span className="sm:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
                      <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                        enroll.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-50' : 
                        enroll.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                        'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        {enroll.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Edit Course Modal */}
      <AnimatePresence>
        {showEditCourse && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl p-6 md:p-10 relative my-auto"
            >
              <button 
                onClick={() => {
                  setShowEditCourse(false);
                  setEditingCourse(null);
                  setCourseForm({ title: '', description: '', price: '', thumbnail: '' });
                }}
                className="absolute top-6 right-6 md:top-8 md:right-8 text-slate-400 hover:text-slate-600"
              >
                <XCircle />
              </button>
              
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">Edit Course</h2>
              <p className="text-slate-500 text-xs md:text-sm mb-6 md:mb-8">Update course details for your students.</p>
              
              <form onSubmit={handleUpdateCourse} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Course Title</label>
                  <input 
                    type="text" 
                    required 
                    value={courseForm.title}
                    onChange={(e) => setCourseForm({...courseForm, title: e.target.value})}
                    placeholder="e.g. Advanced Marketing Mastery" 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all font-medium"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Price (INR)</label>
                  <input 
                    type="number" 
                    required 
                    value={courseForm.price}
                    onChange={(e) => setCourseForm({...courseForm, price: e.target.value})}
                    placeholder="2999" 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Description</label>
                  <textarea 
                    required 
                    rows={4}
                    value={courseForm.description}
                    onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                    placeholder="Describe what students will learn..." 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Thumbnail URL</label>
                  <input 
                    type="text" 
                    value={courseForm.thumbnail}
                    onChange={(e) => setCourseForm({...courseForm, thumbnail: e.target.value})}
                    placeholder="https://image-url.com/photo.jpg" 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all font-medium"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full gradient-btn py-4 rounded-2xl text-white font-bold shadow-xl shadow-emerald-100 active:scale-95 transition-all"
                >
                  Save Changes
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Course Modal */}
      <AnimatePresence>
        {showAddCourse && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl p-6 md:p-10 relative my-auto"
            >
              <button 
                onClick={() => setShowAddCourse(false)}
                className="absolute top-6 right-6 md:top-8 md:right-8 text-slate-400 hover:text-slate-600"
              >
                <XCircle />
              </button>
              
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-6 md:mb-8">Add New Course</h2>
              
              <form onSubmit={handleAddCourse} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Course Title</label>
                  <input 
                    type="text" 
                    required 
                    value={courseForm.title}
                    onChange={(e) => setCourseForm({...courseForm, title: e.target.value})}
                    placeholder="e.g. Advanced Marketing Mastery" 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all font-medium"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Price (INR)</label>
                  <input 
                    type="number" 
                    required 
                    value={courseForm.price}
                    onChange={(e) => setCourseForm({...courseForm, price: e.target.value})}
                    placeholder="2999" 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Description</label>
                  <textarea 
                    required 
                    rows={4}
                    value={courseForm.description}
                    onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                    placeholder="Describe what students will learn..." 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Thumbnail URL</label>
                  <input 
                    type="text" 
                    value={courseForm.thumbnail}
                    onChange={(e) => setCourseForm({...courseForm, thumbnail: e.target.value})}
                    placeholder="https://image-url.com/photo.jpg" 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all font-medium"
                  />
                  <p className="text-[10px] text-slate-400 px-2 italic">Leave empty to use a placeholder image.</p>
                </div>

                <button 
                  type="submit"
                  className="w-full gradient-btn py-4 rounded-2xl text-white font-bold shadow-xl shadow-emerald-100 active:scale-95 transition-all"
                >
                  Create Course
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full Screen Image Viewer Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 cursor-zoom-out"
          >
            <motion.button 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-[110]"
              onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
            >
              <X className="h-6 w-6" />
            </motion.button>

            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-black">
                <img 
                  src={selectedImage} 
                  className="w-full h-full object-contain" 
                  alt="Full Proof" 
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href={selectedImage} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto bg-white text-slate-900 px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-50 hover:text-emerald-600 transition-all uppercase tracking-widest text-[10px]"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Original
                </a>
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="w-full sm:w-auto bg-white/10 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition-all uppercase tracking-widest text-[10px]"
                >
                  Close Viewer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Hidden Certificate Template for PDF Generation */}
      <div className="fixed top-0 left-0 w-0 h-0 overflow-hidden opacity-0 pointer-events-none" aria-hidden="true">
        {certData && (
          <CertificateTemplate 
            userName={certData.userName}
            courseTitle={certData.courseTitle}
            date={certData.date}
            certificateId={certData.certificateId}
          />
        )}
      </div>
    </div>
  );
}
