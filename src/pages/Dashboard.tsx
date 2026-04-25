import React, { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
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
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { formatPrice, formatDate, cn } from '../lib/utils';

export default function Dashboard() {
  const { user, profile, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState(isAdmin ? 'enrollments' : 'my_courses');
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [siteUsers, setSiteUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Admin Filter States
  const [courseSearch, setCourseSearch] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  
  // Admin Form States
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showEditCourse, setShowEditCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [courseForm, setCourseForm] = useState({ title: '', description: '', price: '', thumbnail: '' });

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
    }

    return () => {
      unsubEnroll();
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

    const toastId = toast.loading("Removing user and clearing logs...");
    try {
      // 1. Delete all enrollments related to this user
      const userEnrollments = enrollments.filter(e => e.userId === userId);
      const deletePromises = userEnrollments.map(e => deleteDoc(doc(db, 'enrollments', e.id)));
      await Promise.all(deletePromises);

      // 2. Delete the user document
      await deleteDoc(doc(db, 'users', userId));
      
      toast.success(`User and their ${userEnrollments.length} requests cleared`, { id: toastId });
    } catch (error: any) {
      toast.error("Cleanup failed: " + error.message, { id: toastId });
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
            Hero's <span className="text-primary italic">Workspace</span>
          </h1>
          <p className="text-slate-500 font-medium text-sm md:text-base">Welcome back, {profile?.name}</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 w-full lg:w-auto overflow-x-auto no-scrollbar scroll-smooth">
          <div className="flex min-w-max">
            {isAdmin ? (
              <>
                <button 
                  onClick={() => setActiveTab('enrollments')}
                  className={`flex items-center space-x-2 px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all relative ${activeTab === 'enrollments' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Enrollments</span>
                  {enrollments.filter(e => e.status === 'pending').length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[10px] items-center justify-center text-white font-black">
                        {enrollments.filter(e => e.status === 'pending').length}
                      </span>
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab('manage_courses')}
                  className={`flex items-center space-x-2 px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === 'manage_courses' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Courses</span>
                </button>
                <button 
                  onClick={() => setActiveTab('manage_users')}
                  className={`flex items-center space-x-2 px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === 'manage_users' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}
                >
                  <Users className="h-4 w-4" />
                  <span>Users</span>
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setActiveTab('my_courses')}
                  className={`flex items-center space-x-2 px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === 'my_courses' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}
                >
                  <BookOpen className="h-4 w-4" />
                  <span>My Courses</span>
                </button>
                <button 
                  onClick={() => setActiveTab('requests')}
                  className={`flex items-center space-x-2 px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === 'requests' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}
                >
                  <Clock className="h-4 w-4" />
                  <span>Status</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <AnimatePresence mode="wait">
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
                    <div className="flex items-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-50 w-full sm:w-auto justify-center sm:justify-end">
                      <button 
                        onClick={() => handleEditClick(course)}
                        className="p-3 bg-slate-50 text-slate-400 hover:text-primary rounded-xl transition-colors"
                        title="Edit Course"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteCourse(course.id, course.title)}
                        className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-colors"
                        title="Delete Course"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
                <h2 className="text-xl md:text-2xl font-bold text-slate-800">Site Users</h2>
                <div className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-slate-200 w-fit">
                  {siteUsers.length} Registered
                </div>
              </div>

              <div className="grid gap-3 md:gap-4">
                {siteUsers.map((siteUser) => (
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
                          {siteUser.role === 'admin' && (
                            <span className="text-[9px] bg-slate-900 text-white px-1.5 py-0.5 rounded-md uppercase tracking-tighter">Admin</span>
                          )}
                        </div>
                        <div className="text-[10px] md:text-xs text-slate-500 truncate">{siteUser.email}</div>
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
              </div>
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
                            <div className="bg-emerald-500 h-full w-1/3 rounded-full"></div>
                          </div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span>35% Complete</span>
                            <span className="hidden xs:inline">Next: Module 4</span>
                          </div>
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
    </div>
  );
}
