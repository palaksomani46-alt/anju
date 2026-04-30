import { MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';

export default function FloatingWhatsApp() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.a
          initial={{ opacity: 0, scale: 0.5, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 50 }}
          href="https://wa.me/918660888419" 
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[100] flex items-center gap-3 bg-emerald-500 text-white p-3 md:p-4 rounded-full md:rounded-2xl shadow-[0_20px_50px_rgba(16,185,129,0.3)] hover:shadow-[0_20px_50px_rgba(16,185,129,0.5)] hover:scale-110 active:scale-95 transition-all group border-2 border-white/20 backdrop-blur-sm"
          title="Chat with us on WhatsApp"
        >
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-80 leading-none mb-1">Need Help?</span>
            <span className="text-sm font-bold">Chat with Ma'am</span>
          </div>
          <div className="relative">
             <MessageCircle className="h-6 w-6 md:h-7 md:w-7" />
             <span className="absolute -top-1 -right-1 flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
             </span>
          </div>
        </motion.a>
      )}
    </AnimatePresence>
  );
}
