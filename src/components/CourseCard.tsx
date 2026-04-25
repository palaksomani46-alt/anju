import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, IndianRupee, Clock, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { formatPrice } from '../lib/utils';

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    description: string;
    price: number;
    thumbnail: string;
    createdAt: any;
  };
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="group bg-white border border-slate-100 rounded-[2rem] p-4 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full"
    >
      <div className="w-full aspect-[16/10] bg-slate-100 rounded-2xl mb-4 overflow-hidden relative">
        <img 
          src={course.thumbnail || `https://picsum.photos/seed/${course.id}/600/400`} 
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
        <div className="absolute bottom-3 left-3 flex gap-1.5 flex-wrap">
          <span className="text-[8px] md:text-[9px] uppercase font-black tracking-widest bg-emerald-500 text-white px-2 py-0.5 rounded-lg shadow-sm leading-tight">Featured</span>
          <span className="text-[8px] md:text-[9px] uppercase font-black tracking-widest bg-white/90 backdrop-blur-sm text-slate-800 px-2 py-0.5 rounded-lg shadow-sm leading-tight">Premium</span>
        </div>
      </div>
      
      <div className="flex flex-col flex-1">
        <h3 className="font-black text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors leading-tight line-clamp-2 md:text-lg">
          {course.title}
        </h3>
        
        <p className="text-[11px] md:text-xs text-slate-500 mb-5 line-clamp-2 leading-relaxed font-medium">
          {course.description || "Master the principles with Anju Somani's specific frameworks and direct mentorship."}
        </p>
        
        <div className="flex items-center justify-between pt-2 mt-auto">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enrollment Fee</span>
            <span className="text-base md:text-xl font-black text-slate-900">{formatPrice(course.price)}</span>
          </div>
          <Link 
            to={`/course/${course.id}`}
            className="text-[10px] md:text-xs font-black py-2.5 px-5 bg-slate-900 text-white rounded-xl group-hover:bg-emerald-600 transition-all shadow-xl shadow-slate-100 uppercase tracking-widest active:scale-95"
          >
            Enroll
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default CourseCard;
