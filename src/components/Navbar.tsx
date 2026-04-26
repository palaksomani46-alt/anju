import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { LogOut, User as UserIcon, BookOpen, Menu, X, ArrowRight } from 'lucide-react';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Navbar() {
  const { user, profile, openAuth, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { 
          status: 'offline',
          lastSeen: serverTimestamp()
        });
      } catch (error) {
        console.error("Presence sync error:", error);
      }
    }
    await auth.signOut();
    navigate('/');
  };

  const handleCoursesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.location.pathname === '/') {
      const el = document.getElementById('courses');
      el?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/#courses');
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="h-16 px-4 md:px-10 sticky top-0 z-50 glass shadow-sm">
      <div className="container mx-auto h-full">
        <div className="flex h-full items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              S
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Strictch<span className="text-green-600">Toppers</span></span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className={cn(
               "text-sm font-medium transition-all",
               window.location.pathname === '/' ? "text-green-600 border-b-2 border-green-500 pb-1" : "text-slate-600 hover:text-green-600"
            )}>Home</Link>
            <button 
              onClick={handleCoursesClick}
              className="text-sm font-medium text-slate-600 hover:text-green-600 transition-colors cursor-pointer"
            >
              Browse Courses
            </button>
            {user && (
              <Link to="/dashboard" className="text-sm font-medium text-slate-600 hover:text-green-600 transition-colors">
                {isAdmin ? 'Admin Panel' : 'My Learning'}
              </Link>
            )}
            
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full border-2 border-green-200 p-0.5">
                  <div className="w-full h-full rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                    {profile?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={openAuth}
                className="gradient-btn px-8 py-2.5 rounded-xl text-sm font-semibold hover:scale-[1.02] transition-transform"
              >
                Get Started
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-600">
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm md:hidden z-[-1]"
            />
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden bg-white border-t border-slate-100 shadow-2xl absolute left-0 right-0"
            >
              <div className="flex flex-col p-6 space-y-5">
                <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-slate-900 font-bold text-lg flex items-center justify-between">
                  <span>Home</span>
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                </Link>
                <button 
                  onClick={handleCoursesClick} 
                  className="text-slate-900 font-bold text-lg flex items-center justify-between text-left"
                >
                  <span>Courses</span>
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                </button>
                {user && (
                  <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="text-slate-900 font-bold text-lg flex items-center justify-between">
                    <span>{isAdmin ? 'Admin Panel' : 'My Learning'}</span>
                    <ArrowRight className="h-4 w-4 text-slate-300" />
                  </Link>
                )}
                <div className="pt-4 mt-2 border-t border-slate-100 flex flex-col gap-4">
                  {user ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-600">
                          {profile?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 line-clamp-1">{profile?.name}</span>
                          <span className="text-[10px] text-slate-400 font-medium">Logged In</span>
                        </div>
                      </div>
                      <button onClick={handleLogout} className="p-3 text-red-500 bg-red-50 rounded-xl">
                        <LogOut className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => { setIsMenuOpen(false); openAuth(); }} className="gradient-btn w-full py-4 rounded-2xl text-white font-black shadow-xl shadow-emerald-100 uppercase tracking-widest text-xs">
                      Get Started Now
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
