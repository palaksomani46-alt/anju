import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { auth } from '../lib/firebase';
import { LogOut, User as UserIcon, BookOpen, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Navbar() {
  const { user, profile, openAuth, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  return (
    <nav className="h-16 px-10 sticky top-0 z-50 glass shadow-sm">
      <div className="container mx-auto px-4 h-full">
        <div className="flex h-full items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              S
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Strictch<span className="text-green-600">Toppers</span></span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-sm font-medium text-green-600 border-b-2 border-green-500 pb-1">Home</Link>
            <a href="#courses" className="text-sm font-medium text-slate-600 hover:text-green-600 transition-colors">Browse Courses</a>
            {user && (
              <Link to="/dashboard" className="text-sm font-medium text-slate-600 hover:text-green-600 transition-colors">
                {isAdmin ? 'Admin View' : 'My Learning'}
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

      {/* Mobile Nav */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-slate-100"
          >
            <div className="flex flex-col p-4 space-y-4">
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-slate-600 font-medium">Home</Link>
              <a href="#courses" onClick={() => setIsMenuOpen(false)} className="text-slate-600 font-medium">Courses</a>
              {user && (
                <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="text-slate-600 font-medium">
                  Dashboard
                </Link>
              )}
              {user ? (
                <button onClick={handleLogout} className="text-red-500 font-medium text-left">Logout</button>
              ) : (
                <button onClick={() => { setIsMenuOpen(false); openAuth(); }} className="gradient-btn px-6 py-2 rounded-xl text-white font-semibold">
                  Get Started
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
