import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../App';
import CourseCard from '../components/CourseCard';
import { motion } from 'motion/react';
import { CheckCircle, ShieldCheck, Zap, Users, ArrowRight, BookOpen, MessageCircle, Mail } from 'lucide-react';

export default function Home() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { openAuth, user } = useAuth();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const q = query(collection(db, 'courses'), orderBy('createdAt', 'desc'), limit(6));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCourses(data);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative flex min-h-[320px] bg-gradient-to-br from-green-50 via-emerald-50 to-white px-6 md:px-12 items-center overflow-hidden py-12 lg:py-24">
        <div className="container mx-auto flex flex-col lg:flex-row items-center gap-12 relative text-center lg:text-left">
          <div className="flex-1 z-10">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-4 tracking-tight"
            >
              Level up your skills with <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">Expert Guidance</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-slate-600 text-base md:text-lg mb-6 max-w-md mx-auto lg:mx-0"
            >
              Join our community of elite learners. Manual verification ensures the highest quality cohort focused on practical mastery.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4 pt-4"
            >
              {!user ? (
                <button 
                  onClick={openAuth}
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-green-200 hover:scale-[1.02] transition-transform"
                >
                  Explore Courses
                </button>
              ) : (
                 <a href="#courses" className="w-full sm:w-auto text-center px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-green-200 hover:scale-[1.02] transition-transform">
                  Browse Catalog
                </a>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 px-4 md:px-10">
        {[
          { icon: <ShieldCheck className="h-8 w-8 text-emerald-600" />, title: "Secure Payments", desc: "Manual verification ensures every transaction is safe and genuine." },
          { icon: <Zap className="h-8 w-8 text-emerald-600" />, title: "Expert Mentorship", desc: "Get direct guidance from Anju Somani and experienced instructors." },
          { icon: <Users className="h-8 w-8 text-emerald-600" />, title: "Active Community", desc: "Connect with like-minded learners and expand your professional network." },
        ].map((feat, i) => (
          <div key={i} className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-emerald-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
              {feat.icon}
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">{feat.title}</h3>
          </div>
        ))}
      </section>

      {/* Featured Courses */}
      <section id="courses" className="px-4 space-y-12">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Featured Courses</h2>
            <p className="text-slate-500 text-sm">Hand-picked masterclasses for your career growth.</p>
          </div>
          <button className="text-green-600 font-semibold text-sm hover:underline">View All Courses →</button>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-2xl shadow-sm border border-slate-50"></div>
            ))}
          </div>
        ) : courses.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
            {courses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-[3rem]">
            <p className="text-slate-400 font-medium">No courses available yet. Check back soon!</p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="pt-24 border-t border-slate-100">
        <div className="grid md:grid-cols-4 gap-12 pb-12">
          <div className="col-span-2 space-y-6">
            <div className="flex items-center space-x-2">
              <div className="bg-primary p-2 rounded-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-800">Strictch Toppers</span>
            </div>
            <div className="flex items-center space-x-4 text-xs font-bold uppercase tracking-widest text-slate-400">
              <Link to="/privacy" className="hover:text-green-600 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-green-600 transition-colors">Terms of Use</Link>
            </div>
          </div>
          <div className="space-y-6">
            <h4 className="font-bold text-slate-800 uppercase text-xs tracking-widest">Connect</h4>
            <div className="flex flex-col space-y-4">
              <a 
                href="https://wa.me/918660888419" 
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 text-sm text-slate-600 hover:text-green-600 transition-all"
              >
                <div className="bg-green-100 p-2 rounded-xl group-hover:bg-green-500 group-hover:text-white transition-colors shadow-sm shadow-green-100">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold">WhatsApp Us</span>
                  <span className="text-[10px] text-slate-400 font-medium">+91 86608 88419</span>
                </div>
              </a>
              <a 
                href="mailto:somanimayank723@gmail.com" 
                className="group flex items-center gap-3 text-sm text-slate-600 hover:text-green-600 transition-all"
              >
                <div className="bg-slate-100 p-2 rounded-xl group-hover:bg-green-500 group-hover:text-white transition-colors shadow-sm shadow-slate-100">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold">Email Support</span>
                  <span className="text-[10px] text-slate-400 font-medium">somanimayank723@gmail.com</span>
                </div>
              </a>
            </div>
          </div>
        </div>
        <div className="py-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-400">© 2026 Strictch Toppers. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 bg-slate-100 rounded-full"></div>
            <div className="h-8 w-8 bg-slate-100 rounded-full"></div>
            <div className="h-8 w-8 bg-slate-100 rounded-full"></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
