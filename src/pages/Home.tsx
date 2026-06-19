import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../App';
import CourseCard from '../components/CourseCard';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { ArrowRight, BookOpen, Star, Gift, Globe, Award, Sparkles, Zap, Users, ShieldCheck } from 'lucide-react';

export default function Home() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { openAuth, user, profile } = useAuth();
  const navigate = useNavigate();
  
  const handleGetReferralLink = () => {
    if (!user) {
      openAuth();
      toast.info("Please sign in to get your referral link!");
      return;
    }
    
    const refLink = `${window.location.origin}/?ref=${profile?.shortId || user.uid.substring(0, 8)}`;
    navigator.clipboard.writeText(refLink);
    toast.success("Link copied! Now paste it on WhatsApp to share with friends.");
  };

  const testimonials = [
    {
      name: "Rahul Sharma",
      role: "Student",
      content: "Ma'am explains everything so simply in Hindi and English. It's very easy to understand even for beginners. Her personal help really changed my career!",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&h=200&fit=crop"
    },
    {
      name: "Priya Singh",
      role: "College Student",
      content: "The classes are very practical. I learned more here in 2 months than in my whole college semester. I even got my first internship thanks to the project work!",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&h=200&fit=crop"
    },
    {
      name: "Amit Verma",
      role: "Shop Owner",
      content: "Best place to learn how to grow your business online. No hard words, just simple steps that actually work. Very happy with the results!",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&h=200&fit=crop"
    }
  ];

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

    if (window.location.hash === '#courses') {
      setTimeout(() => {
        const el = document.getElementById('courses');
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }

    return () => unsub();
  }, []);

  return (
    <div className="space-y-24 pb-20 relative">
      {/* Hero Section */}
      <section className="relative flex min-h-[400px] md:min-h-[500px] lg:min-h-[600px] bg-gradient-to-br from-green-50 via-emerald-50 to-white px-6 md:px-12 items-center overflow-hidden py-16 md:py-24 rounded-[3rem] mt-4">
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
              Learn Skills, <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-500">Change Your Life</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-slate-600 text-sm md:text-lg mb-8 max-w-lg mx-auto lg:mx-0 font-medium leading-relaxed"
            >
              Join 1000+ students from your local area. Classes in simple Hindi & English. Real job help and direct mentorship.
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
                 <a href="#courses" onClick={(e) => {
                   e.preventDefault();
                   document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' });
                 }} className="w-full sm:w-auto text-center px-10 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-2xl shadow-slate-200 hover:scale-[1.03] transition-all uppercase tracking-widest text-xs">
                  Browse Catalog
                </a>
              )}
              <button 
                onClick={() => {
                  document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white border border-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all text-xs"
              >
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
      
      {/* Community Impact */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">
              Built for <span className="text-emerald-600">Local Students</span>
            </h2>
            <p className="text-slate-600 font-medium text-lg">
              We help people from small towns and cities learn high-value skills that actually get them paid. No fancy degrees needed.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="text-3xl font-black text-emerald-600">1000+</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Students</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="text-3xl font-black text-blue-600">₹50K+</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Rewards Sent</div>
              </div>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4">
             <img src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=400" className="rounded-3xl h-48 w-full object-cover grayscale active:grayscale-0 transition-all shadow-lg" alt="Study group" />
             <img src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=400" className="rounded-3xl h-48 w-full object-cover mt-8 shadow-lg" alt="Classroom" />
          </div>
        </div>
      </section>

      {/* Refer & Earn Banner */}
      <section className="px-4 md:px-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-[2rem] md:rounded-[3rem] p-8 md:p-16 text-center lg:text-left flex flex-col lg:flex-row items-center justify-between gap-12 relative overflow-hidden group shadow-2xl"
        >
          {/* Animated Background Elements */}
          <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-emerald-500/10 rounded-full translate-x-1/3 -translate-y-1/3 blur-[60px] md:blur-[100px] animate-pulse" />
          <div className="absolute -bottom-24 -left-24 w-48 md:w-64 h-48 md:h-64 bg-emerald-400/10 rounded-full blur-[60px] md:blur-[80px]" />
          
          <div className="space-y-6 relative z-10 max-w-2xl px-4 md:px-0">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-500/20">
              <Gift className="h-4 w-4 animate-bounce" />
              Help Your Friends
            </div>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-tight">
              Bring 50 Friends & <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400 drop-shadow-sm">Earn ₹500 Cash!</span>
            </h2>
            <p className="text-slate-400 font-medium text-base md:text-lg leading-relaxed">
              Help your community grow! When you refer 50 friends and they enroll in any course, we will send <strong>₹500</strong> directly to your account. Everyone wins!
            </p>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-4 w-full lg:w-auto">
            <motion.button 
              onClick={handleGetReferralLink}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group/btn relative bg-white text-slate-900 w-full lg:w-auto px-12 py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-[0_20px_50px_rgba(16,185,129,0.3)] hover:shadow-[0_20px_50px_rgba(16,185,129,0.5)] overflow-hidden cursor-pointer"
            >
              <span className="relative z-10">Get Your Link Now</span>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-100 to-white opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
              <div className="absolute -inset-full h-full w-full bg-gradient-to-r from-transparent via-white/40 to-transparent rotate-45 animate-[shimmer_2s_infinite] pointer-events-none" />
            </motion.button>
            
            <div className="flex items-center gap-2">
              <div className="flex -space-x-3">
                {[1,2,3].map(i => (
                  <img 
                    key={i} 
                    src={`https://i.pravatar.cc/100?u=user${i}`} 
                    className="w-8 h-8 rounded-full border-2 border-slate-800 shadow-lg" 
                    alt="User"
                  />
                ))}
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                +420 users earned today
              </span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Why Choose Us */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 px-6 md:px-12">
        {[
          { icon: <Globe className="h-8 w-8 text-emerald-600" />, title: "Stricting Classes", desc: "Structured, highly-disciplined live lectures to ensure constant daily progress." },
          { icon: <Award className="h-8 w-8 text-emerald-600" />, title: "Course Certificates", desc: "Receive certificates that help you get jobs and grow your career." },
          { icon: <ShieldCheck className="h-8 w-8 text-emerald-600" />, title: "100% Safe Payments", desc: "Every payment is manually checked so your money is always safe." },
          { icon: <Sparkles className="h-8 w-8 text-emerald-600" />, title: "Job & Internship Help", desc: "We help our best students find work in local companies and startups." },
        ].map((feat, i) => (
          <motion.div 
            key={i} 
            whileHover={{ y: -10 }}
            className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
          >
            <div className="bg-emerald-50 w-16 h-16 rounded-[1.2rem] flex items-center justify-center mb-6 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              {feat.icon}
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">{feat.title}</h3>
            <p className="text-slate-500 font-medium leading-relaxed text-xs">{feat.desc}</p>
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

      {/* Testimonials */}
      <section id="testimonials" className="px-6 md:px-12 py-24 bg-slate-50 rounded-[4rem]">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className="inline-block bg-emerald-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-600">Our Happy Students</div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">Trusted by 1000+ Learners</h2>
          <p className="text-slate-500 font-medium text-lg">See how Stricth Toppers is helping students and professionals across India reach their goals.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((test, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(star => <Star key={star} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-slate-600 font-medium leading-relaxed italic">"{test.content}"</p>
              </div>
              
              <div className="flex items-center gap-4 mt-8 pt-6 border-t border-slate-50">
                <img src={test.image} alt={test.name} className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-100 shadow-sm" />
                <div>
                  <h4 className="font-black text-slate-900 text-sm">{test.name}</h4>
                  <p className="text-xs text-slate-400 font-medium">{test.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-24 border-t border-slate-100 px-6 md:px-12 bg-slate-50/50">
        <div className="py-10 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            © 2026 Stricth Toppers • Crafted for High Performers
          </p>
          <div className="flex items-center space-x-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <Link to="/privacy" className="hover:text-emerald-600 transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-emerald-600 transition-colors">Terms</Link>
              <a href="tel:8660888419" className="hover:text-emerald-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
