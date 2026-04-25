import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { Toaster, toast } from 'sonner';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CourseDetail from './pages/CourseDetail';
import Dashboard from './pages/Dashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';
import AuthModal from './components/AuthModal';
import OnboardingGuide from './components/OnboardingGuide';

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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfile(data);
            // Update online status
            await updateDoc(docRef, { 
              status: 'online', 
              lastSeen: serverTimestamp() 
            });
          } else {
            // Auto-create profile if missing
            const admins = ['somanimayank723@gmail.com', 'palaksomani46@gmail.com', 'somanianju46@gmail.com'];
            const isDefaultAdmin = admins.includes(user.email || '');
            const newProfile = {
              uid: user.uid,
              name: user.displayName || 'Anonymous User',
              email: user.email,
              role: isDefaultAdmin ? 'admin' : 'student',
              enrolledCourses: [],
              status: 'online',
              lastSeen: serverTimestamp(),
              createdAt: serverTimestamp(),
            };
            await setDoc(docRef, newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
          toast.error("Failed to load user profile");
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin' || ['somanimayank723@gmail.com', 'palaksomani46@gmail.com', 'somanianju46@gmail.com'].includes(user?.email || ''),
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
              <Route path="/course/:id" element={<CourseDetail />} />
              <Route 
                path="/dashboard" 
                element={user ? <Dashboard /> : <Navigate to="/" />} 
              />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfUse />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
          <OnboardingGuide />
          <Toaster position="top-center" richColors />
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

