import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../App';
import CourseCard from '../components/CourseCard';
import { motion } from 'motion/react';
import { CheckCircle, ShieldCheck, Zap, Users, ArrowRight, BookOpen, MessageCircle, Mail, Phone } from 'lucide-react';

export default function Home() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { openAuth, user } = useAuth();

  useEffect(() => {
    const q = query(collection(db, 'courses'), orderBy('createdAt', 'desc'), limit(6));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCourses(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching courses:", error);
      setLoading(false);
    });

    // Handle hash scroll on mount
    if (window.location.hash === '#courses') {
      setTimeout(() => {
        const el = document.getElementById('courses');
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }

    return () => unsub();
  }, []);

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative flex min-h-[400px] md:min-h-[500px] lg:min-h-[600px] bg-gradient-to-br from-green-50 via-emerald-50 to-white px-6 md:px-12 items-center overflow-hidden py-16 md:py-24">
        <div className="container mx-auto flex flex-col lg:flex-row items-center gap-12 relative text-center lg:text-left">
          <div className="flex-1 z-10 w-full">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center space-x-2 bg-white/60 backdrop-blur-md px-4 py-2 rounded-full border border-emerald-100 mb-6 mx-auto lg:mx-0"
            >
              <Zap className="h-4 w-4 text-emerald-500 fill-emerald-500" />
              <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-emerald-700">Top-Tier Education</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tight"
            >
              Level up your skills with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-500">Expert Guidance</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-slate-600 text-sm md:text-lg mb-8 max-w-lg mx-auto lg:mx-0 font-medium leading-relaxed"
            >
              Join our community of elite learners. Manual verification ensures the highest quality cohort focused on practical mastery and direct industry impact.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4"
            >
              {!user ? (
                <button 
                  onClick={openAuth}
                  className="w-full sm:w-auto px-10 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-2xl shadow-slate-200 hover:scale-[1.03] transition-all uppercase tracking-widest text-xs"
                >
                  Get Started Now
                </button>
              ) : (
                 <a href="#courses" className="w-full sm:w-auto text-center px-10 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-2xl shadow-slate-200 hover:scale-[1.03] transition-all uppercase tracking-widest text-xs">
                  Browse Catalog
                </a>
              )}
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white border border-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all text-xs">
                <span>Success Stories</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          </div>
          
          <div className="flex-1 hidden lg:block relative">
            <div className="relative z-10 bg-white p-8 rounded-[3rem] shadow-2xl shadow-emerald-100 border border-emerald-50">
               <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop" className="rounded-[2rem] shadow-sm" alt="Learning" />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-emerald-500 text-white p-6 rounded-3xl shadow-xl z-20 animate-bounce">
              <Users className="h-8 w-8" />
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 px-6 md:px-12">
        {[
          { icon: <ShieldCheck className="h-8 w-8 text-emerald-600" />, title: "Secure Payments", desc: "Manual verification ensures every transaction is safe, genuine, and recorded for your peace of mind." },
          { icon: <Zap className="h-8 w-8 text-emerald-600" />, title: "Expert Mentorship", desc: "Get direct guidance from Anju Somani and specialized instructors with years of industry expertise." },
          { icon: <Users className="h-8 w-8 text-emerald-600" />, title: "Elite Community", desc: "Connect with like-minded high-achievers and expand your professional network globally." },
        ].map((feat, i) => (
          <motion.div 
            key={i} 
            whileHover={{ y: -10 }}
            className="p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
          >
            <div className="bg-emerald-50 w-20 h-20 rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              {feat.icon}
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{feat.title}</h3>
            <p className="text-slate-500 font-medium leading-relaxed text-sm">{feat.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* Featured Courses */}
      <section id="courses" className="px-6 md:px-12 space-y-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-8">
          <div>
            <div className="inline-block bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Course Catalog</div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">Our Masterclasses</h2>
            <p className="text-slate-500 text-sm md:text-base font-medium mt-2">Hand-picked curriculum designed for rapid skill acquisition.</p>
          </div>
          <Link to="/explore" className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest hover:gap-3 transition-all whitespace-nowrap bg-emerald-50 px-6 py-3 rounded-xl border border-emerald-100">
            <span>View All</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[1,2,3].map(i => (
              <div key={i} className="h-80 bg-slate-100 animate-pulse rounded-[2.5rem] shadow-sm border border-slate-50"></div>
            ))}
          </div>
        ) : courses.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {courses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No courses available yet</p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="pt-24 border-t border-slate-100 px-6 md:px-12 bg-slate-50/50">
        <div className="grid lg:grid-cols-4 gap-16 pb-16">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center space-x-3">
              <div className="bg-slate-900 p-2.5 rounded-xl shadow-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tighter">Strictch Toppers</span>
            </div>
            <p className="text-slate-500 max-w-sm font-medium leading-relaxed">
              Empowering the next generation of professional leaders through curated masterclasses and direct mentorship.
            </p>
            <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <Link to="/privacy" className="hover:text-emerald-600 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-emerald-600 transition-colors">Terms of Use</Link>
            </div>
          </div>
          
          <div className="space-y-8">
            <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-[0.2em]">Contact Us</h4>
            <div className="flex flex-col space-y-5">
              <a 
                href="https://wa.me/918660888419" 
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-4 text-sm text-slate-600 hover:text-emerald-600 transition-all"
              >
                <div className="bg-white border border-emerald-100 p-2.5 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                  <MessageCircle className="h-5 w-5 text-emerald-500 group-hover:text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-slate-900">WhatsApp</span>
                  <span className="text-[11px] text-slate-400 font-bold">+91 86608 88419</span>
                </div>
              </a>
              
              <a 
                href="mailto:somanimayank723@gmail.com" 
                className="group flex items-center gap-4 text-sm text-slate-600 hover:text-emerald-600 transition-all"
              >
                <div className="bg-white border border-slate-100 p-2.5 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                  <Mail className="h-5 w-5 text-slate-400 group-hover:text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-slate-900">Email Status</span>
                  <span className="text-[11px] text-slate-400 font-bold">Priority Support</span>
                </div>
              </a>

              <a 
                href="tel:8660888419" 
                className="group flex items-center gap-4 text-sm text-slate-600 hover:text-emerald-600 transition-all"
              >
                <div className="bg-white border border-slate-100 p-2.5 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                  <Phone className="h-5 w-5 text-slate-400 group-hover:text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-slate-900">Call Support</span>
                  <span className="text-[11px] text-slate-400 font-bold">+91 86608 88419</span>
                </div>
              </a>
            </div>
          </div>

          <div className="space-y-8">
            <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-[0.2em]">Our Office</h4>
            <div className="space-y-4">
               <div className="flex items-start gap-4 text-sm text-slate-600">
                  <div className="bg-white border border-slate-100 p-2.5 rounded-xl">
                    <ShieldCheck className="h-5 w-5 text-slate-400" />
                  </div>
                  <div>
                    <span className="font-black text-slate-900 block mb-1">Global HQ</span>
                    <span className="text-xs text-slate-400 font-medium">Remote-first cohort with physical hubs in major metros.</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
        
        <div className="py-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center md:text-left">
            © 2026 Strictch Toppers • Crafted for High Performers
          </p>
          <div className="flex items-center space-x-6">
            <div className="h-10 w-10 bg-white border border-slate-100 rounded-xl shadow-sm"></div>
            <div className="h-10 w-10 bg-white border border-slate-100 rounded-xl shadow-sm"></div>
            <div className="h-10 w-10 bg-white border border-slate-100 rounded-xl shadow-sm"></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
