import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../App';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  IndianRupee, 
  ArrowLeft, 
  Upload, 
  ShieldCheck, 
  MessageCircle,
  Clock,
  AlertCircle,
  Users,
  Zap,
  Phone
} from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice, compressImage } from '../lib/utils';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile, openAuth } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [step, setStep] = useState(1); // 1: Overview, 2: Contact Info, 3: Payment, 4: Success
  const [file, setFile] = useState<File | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [enrollmentInfo, setEnrollmentInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [uploading, setUploading] = useState(false);
  const [hasAlreadyEnrolled, setHasAlreadyEnrolled] = useState(false);

  useEffect(() => {
    if (user) {
      setEnrollmentInfo(prev => ({
        ...prev,
        email: user.email || '',
        name: profile?.name || user.displayName || ''
      }));
    }
  }, [user, profile]);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) return;
      const docSnap = await getDoc(doc(db, 'courses', id));
      if (docSnap.exists()) {
        setCourse({ id: docSnap.id, ...docSnap.data() });
      } else {
        toast.error("Course not found");
        navigate('/');
      }
      setLoading(false);
    };

    const checkEnrollment = async () => {
      if (!user || !id) return;
      const q = query(
        collection(db, 'enrollments'), 
        where('userId', '==', user.uid), 
        where('courseId', '==', id)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setHasAlreadyEnrolled(true);
      }
    };

    fetchCourse();
    checkEnrollment();
  }, [id, user]);

  const handleEnrollClick = () => {
    if (!user) {
      openAuth();
      return;
    }
    setStep(2);
  };

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollmentInfo.name || !enrollmentInfo.phone || !enrollmentInfo.email) {
      toast.error("Please fill all contact details");
      return;
    }
    setStep(3);
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !transactionId || !course || !user) {
      toast.error("Please provide both Transaction ID and Payment Proof");
      return;
    }

    if (transactionId.length < 6) {
      toast.error("Please enter a valid Transaction ID");
      return;
    }

    const checkId = toast.loading("Processing Digital Handshake...");
    setUploading(true);
    
    try {
      // 1. Digital Proof Compression (The "Upload" alternative)
      toast.loading("Compressing Digital Proof...", { id: checkId });
      const base64Proof = await compressImage(file);

      toast.loading("Instant Alert: Notifying Admin Panel...", { id: checkId });

      // 2. Creating the Database Record (New hand-shake schema)
      const enrollmentData = {
        userId: user.uid, // Required for security but keeping user fields as requested
        userName: enrollmentInfo.name,
        userEmail: enrollmentInfo.email,
        userPhone: enrollmentInfo.phone,
        courseId: id,
        courseTitle: course.title,
        amount: formatPrice(course.price),
        transactionId: transactionId.trim(),
        proofUrl: base64Proof, // Compressed screenshot stored as Base64 string
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'enrollments'), enrollmentData);

      toast.success("Lightning Proof Sent! Handshake Complete.", { id: checkId });
      setStep(4);
      
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(error.message || "Failed. Try again.", { id: checkId });
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 md:space-y-12 pb-20 px-4 md:px-0">
      <button 
        onClick={() => navigate('/')}
        className="flex items-center space-x-2 text-slate-500 hover:text-primary transition-colors pt-4"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm font-bold uppercase tracking-widest">Back to Courses</span>
      </button>

      <div className="flex flex-col lg:flex-row gap-12">
        <div className="flex-[1.5] space-y-8">
          <div className="relative aspect-video rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl">
            <img 
              src={course.thumbnail || `https://picsum.photos/seed/${course.id}/1200/800`} 
              alt={course.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
            <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 text-white pr-6">
              <div className="flex items-center space-x-2 bg-emerald-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3 md:mb-4 w-fit">
                High Demand
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black">{course.title}</h1>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">About this Course</h2>
            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
              {course.description.split('\n').map((para: string, i: number) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="sticky top-24 space-y-6">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 space-y-8"
                >
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Course Price</div>
                    <div className="text-5xl font-black text-slate-900">{formatPrice(course.price)}</div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 text-slate-600 text-sm font-medium">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      <span>Full Lifetime Access</span>
                    </div>
                    <div className="flex items-center space-x-3 text-slate-600 text-sm font-medium">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      <span>Access on Mobile and Desktop</span>
                    </div>
                    <div className="flex items-center space-x-3 text-slate-600 text-sm font-medium">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      <span>Direct Mentorship Coverage</span>
                    </div>
                  </div>

                  {hasAlreadyEnrolled ? (
                    <button 
                      onClick={() => navigate('/dashboard')}
                      className="w-full py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold transition-all"
                    >
                      Check Status
                    </button>
                  ) : (
                    <button 
                      onClick={handleEnrollClick}
                      className="w-full gradient-btn py-4 rounded-2xl text-white font-bold shadow-xl shadow-emerald-100 active:scale-95 transition-all"
                    >
                      Enroll Now
                    </button>
                  )}
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 space-y-8"
                >
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-slate-900">Your Details</h2>
                    <p className="text-sm text-slate-500 font-medium">Please confirm your contact info for the course portal.</p>
                  </div>
                  
                  <form onSubmit={handleInfoSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={enrollmentInfo.name}
                        onChange={(e) => setEnrollmentInfo({...enrollmentInfo, name: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Email Address</label>
                      <input 
                        type="email" 
                        disabled
                        value={enrollmentInfo.email}
                        className="w-full px-5 py-4 bg-slate-100 border border-slate-100 rounded-2xl cursor-not-allowed font-medium text-slate-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Phone Number (WhatsApp)</label>
                      <input 
                        type="tel" 
                        required
                        placeholder="+91 00000 00000"
                        value={enrollmentInfo.phone}
                        onChange={(e) => setEnrollmentInfo({...enrollmentInfo, phone: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all font-medium"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full gradient-btn py-4 rounded-2xl text-white font-bold shadow-xl shadow-emerald-100 active:scale-95 transition-all"
                    >
                      Continue to Payment
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setStep(1)}
                      className="w-full text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      Back to Summary
                    </button>
                  </form>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 space-y-8"
                >
                  <div className="flex items-center gap-3 py-2 md:py-3 px-3 md:px-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <ShieldCheck className="h-5 w-5 md:h-6 md:w-6 text-emerald-600 shrink-0" />
                    <div className="text-xs md:text-sm font-bold text-emerald-800">Secure Manual Payment</div>
                  </div>

                  <div className="space-y-4 md:space-y-6">
                    <h3 className="font-bold text-slate-800 text-xs md:text-sm italic">Transfer to our official account:</h3>
                    <div className="space-y-3 md:space-y-4 text-xs md:text-sm bg-slate-50 p-5 md:p-6 rounded-2xl border border-dashed border-slate-200">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <span className="text-slate-500">Payment Number:</span>
                        <div className="flex items-center gap-2">
                           <span className="font-black text-slate-800 text-base md:text-lg tracking-wider">8660888419</span>
                           <button onClick={() => { navigator.clipboard.writeText('8660888419'); toast.success('Number copied!'); }} className="text-[9px] md:text-[10px] bg-slate-200 px-2 py-1 rounded-md hover:bg-slate-300">Copy</button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Amount:</span>
                        <span className="font-black text-emerald-600 text-base md:text-lg">{formatPrice(course.price)}</span>
                      </div>
                      <div className="pt-4 mt-2 border-t border-slate-200">
                        <p className="text-xs text-slate-600 font-bold leading-relaxed text-center">
                          Pay through PhonePe, Google Pay, or Paytm on this number.
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleFileUpload} className="space-y-6">
                    <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Transaction ID / UTR</label>
                    <input 
                      type="text" 
                      placeholder="12-digit number"
                      required
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all font-medium"
                    />
                    </div>

                    <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Payment Proof Screenshot</label>
                    <motion.label 
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`flex flex-col items-center justify-center w-full h-32 px-4 transition-all border-2 border-dashed rounded-2xl appearance-none cursor-pointer focus:outline-none ${file ? 'bg-emerald-50 border-emerald-500 shadow-inner' : 'bg-white border-slate-200 hover:border-emerald-400'}`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        {file ? (
                          <div className="flex items-center space-x-2 text-emerald-600">
                             <CheckCircle2 className="w-8 h-8" />
                             <span className="font-bold text-sm truncate max-w-[200px]">{file.name}</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                            <span className="font-bold text-sm text-slate-500">Tap to Upload Screenshot</span>
                            <span className="text-[10px] text-slate-400 uppercase font-black">JPG, PNG supported</span>
                          </>
                        )}
                      </div>
                      <input type="file" required accept="image/*" className="hidden" onChange={(e) => {
                        const selected = e.target.files?.[0];
                        if (selected && selected.size > 5 * 1024 * 1024) {
                          toast.error("Image too large (max 5MB)");
                          return;
                        }
                        setFile(selected || null);
                      }} />
                    </motion.label>
                    </div>

                    <button 
                      type="submit"
                      disabled={uploading}
                      className="w-full h-14 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 flex items-center justify-center rounded-2xl text-white font-black text-lg shadow-2xl shadow-emerald-200 active:scale-[0.98] hover:brightness-110 transition-all disabled:opacity-70 disabled:cursor-not-allowed group overflow-hidden relative"
                    >
                      {uploading ? (
                        <div className="flex items-center space-x-3 relative z-10">
                          <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="tracking-tighter">TELEPORTING DATA...</span>
                        </div>
                      ) : (
                        <>
                          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
                          <div className="flex items-center space-x-3 relative z-10 uppercase tracking-tight">
                             <span>Submit Verification</span>
                             <Zap className="h-5 w-5 fill-white text-white group-hover:animate-bounce" />
                          </div>
                        </>
                      )}
                    </button>
                    
                    <button 
                      type="button" 
                      onClick={() => setStep(2)}
                      className="w-full text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      Back to Details
                    </button>
                  </form>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 text-center space-y-6"
                >
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">Request Submitted!</h3>
                  <p className="text-slate-500">Your payment is being verified by our team. You'll get access to the course within 24 hours.</p>
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold shadow-lg"
                  >
                    Go to Dashboard
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-6 bg-slate-900 rounded-[2.5rem] text-white">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 rounded-2xl overflow-hidden">
                  <img src="https://i.pravatar.cc/150?u=anju" alt="Anju Somani" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <div className="font-bold">Anju Somani</div>
                  <div className="text-xs text-slate-400">Head Mentor</div>
                </div>
              </div>
              <div className="flex flex-col gap-3 mt-6">
                <button 
                  onClick={() => window.open('https://wa.me/918660888419', '_blank')}
                  className="flex items-center space-x-2 text-emerald-400 text-sm font-bold hover:text-emerald-300 transition-colors"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>Chat with Mentor</span>
                </button>
                <a 
                  href="tel:+918660888419"
                  className="flex items-center space-x-2 text-blue-400 text-sm font-bold hover:text-blue-300 transition-colors"
                >
                  <Phone className="h-5 w-5" />
                  <span>Call Care Support</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
