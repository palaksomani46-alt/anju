import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { Toaster, toast } from 'sonner';
import Navbar from './components/Navbar';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import Home from './pages/Home';
import CourseDetail from './pages/CourseDetail';
import Dashboard from './pages/Dashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';
import Explore from './pages/Explore';
import LiveClassroom from './pages/LiveClassroom';
import AuthModal from './components/AuthModal';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isAdmin: boolean;
  openAuth: () => void;
  closeAuth: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => useContext(AuthContext)!;

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    // Capture referral ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      sessionStorage.setItem('referredBy', ref);
    }
  }, []);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      setUser(user);
      
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        
        // Initial check and auto-create
        try {
          const initialSnap = await getDoc(docRef);
          if (!initialSnap.exists()) {
            const admins = ['somanimayank723@gmail.com', 'palaksomani46@gmail.com'];
            const isDefaultAdmin = admins.includes(user.email?.toLowerCase() || '');
            const referredBy = sessionStorage.getItem('referredBy');
            
            const newProfile = {
              uid: user.uid,
              shortId: user.uid.substring(0, 8),
              name: user.displayName || 'Anonymous User',
              email: user.email,
              role: isDefaultAdmin ? 'admin' : 'student',
              enrolledCourses: [],
              referredBy: referredBy || null,
              status: 'online',
              lastSeen: serverTimestamp(),
              createdAt: serverTimestamp(),
            };
            await setDoc(docRef, newProfile);
            sessionStorage.removeItem('referredBy'); // Clear after use
            setProfile(newProfile);
          } else {
            const data = initialSnap.data();
            setProfile(data);
            // Sync status and ensure shortId
            const updates: any = { 
              status: 'online', 
              lastSeen: serverTimestamp() 
            };
            if (!data.shortId) {
              updates.shortId = user.uid.substring(0, 8);
            }
            await updateDoc(docRef, updates);
          }
        } catch (error) {
          console.error("Error during initial profile setup:", error);
        }

        // Real-time listener to handle deletions or updates
        unsubProfile = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const adminEmails = ['somanimayank723@gmail.com', 'palaksomani46@gmail.com'];
            const isAdminEmail = adminEmails.includes(user.email?.toLowerCase() || '');
            
            // Sync role if needed
            if (data.role === 'admin' && !isAdminEmail) {
              updateDoc(docRef, { role: 'student' });
              data.role = 'student';
            } else if (isAdminEmail && data.role !== 'admin') {
              updateDoc(docRef, { role: 'admin' });
              data.role = 'admin';
            }
            
            setProfile(data);
          } else {
            // Profile deleted by admin! Force logout
            setProfile(null);
            auth.signOut();
            toast.error("Your account has been removed by the administrator.");
          }
        }, (err) => {
          console.error("Profile listener error:", err);
        });
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const adminEmails = ['somanimayank723@gmail.com', 'palaksomani46@gmail.com'];
  const value = {
    user,
    profile,
    loading,
    isAdmin: adminEmails.includes(user?.email?.toLowerCase() || ''),
    openAuth: () => setIsAuthOpen(true),
    closeAuth: () => setIsAuthOpen(false),
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      <Router>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/course/:id" element={<CourseDetail />} />
              <Route 
                path="/dashboard" 
                element={user ? <Dashboard /> : <Navigate to="/" />} 
              />
              <Route 
                path="/live/:courseId" 
                element={user ? <LiveClassroom /> : <Navigate to="/" />} 
              />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfUse />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <FloatingWhatsApp />
          <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
          <Toaster position="top-center" richColors />
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

