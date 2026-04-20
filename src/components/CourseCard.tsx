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
      className="group bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <div className="w-full h-40 bg-slate-100 rounded-xl mb-4 overflow-hidden relative">
        <img 
          src={course.thumbnail || `https://picsum.photos/seed/${course.id}/600/400`} 
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
        <div className="absolute bottom-3 left-3 flex gap-2">
          <span className="text-[10px] uppercase font-bold bg-green-500 text-white px-2 py-0.5 rounded shadow-sm leading-tight">Featured</span>
          <span className="text-[10px] uppercase font-bold bg-white/80 backdrop-blur-sm text-slate-800 px-2 py-0.5 rounded shadow-sm leading-tight">Premium</span>
        </div>
      </div>
      
      <div>
        <h3 className="font-bold text-slate-800 mb-1 group-hover:text-green-600 transition-colors leading-snug line-clamp-1">
          {course.title}
        </h3>
        
        <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">
          {course.description || "Master the principles with Anju Somani's specific frameworks and direct mentorship."}
        </p>
        
        <div className="flex items-center justify-between pt-2">
          <span className="text-lg font-bold text-slate-900">{formatPrice(course.price)}</span>
          <Link 
            to={`/course/${course.id}`}
            className="text-xs font-bold py-2 px-4 bg-slate-900 text-white rounded-lg group-hover:bg-green-600 transition-colors shadow-sm"
          >
            Enroll Now
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default CourseCard;
