import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, ShieldCheck, Zap, Layout, ChevronRight, X } from 'lucide-react';

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const steps: OnboardingStep[] = [
  {
    title: "Welcome to Strictch Toppers",
    description: "Your destination for elite career growth and professional masterclasses. Let's show you around!",
    icon: <BookOpen className="h-8 w-8" />,
    color: "bg-emerald-500"
  },
  {
    title: "Expert-Led Courses",
    description: "Browse our catalog of courses led by Anju Somani and industry experts. Find the perfect path for your goals.",
    icon: <Zap className="h-8 w-8" />,
    color: "bg-amber-500"
  },
  {
    title: "Secure Enrollment",
    description: "We use a manual verification system for payments to ensure the highest security and a quality cohort of learners.",
    icon: <ShieldCheck className="h-8 w-8" />,
    color: "bg-blue-500"
  },
  {
    title: "Your Personal Dashboard",
    description: "Once your payment is verified, access all your learning materials and track progress from your personal dashboard.",
    icon: <Layout className="h-8 w-8" />,
    color: "bg-purple-500"
  }
];

export default function OnboardingGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('hasSeenOnboarding_v1');
    if (!hasSeenGuide) {
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(curr => curr + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('hasSeenOnboarding_v1', 'true');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header / Progress */}
            <div className="flex items-center justify-between p-6 pb-2">
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <div 
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-emerald-500' : 'w-2 bg-slate-100'}`}
                  />
                ))}
              </div>
              <button 
                onClick={handleClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Container */}
            <div className="p-8 text-center sm:text-left">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className={`w-16 h-16 ${steps[currentStep].color} text-white rounded-2xl flex items-center justify-center mx-auto sm:mx-0 shadow-lg shadow-emerald-100`}>
                    {steps[currentStep].icon}
                  </div>
                  
                  <div className="space-y-3">
                    <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                      {steps[currentStep].title}
                    </h2>
                    <p className="text-slate-600 leading-relaxed">
                      {steps[currentStep].description}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="p-6 pt-0 flex items-center justify-between bg-slate-50/50">
              <button 
                onClick={handleClose}
                className="text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Skip Guide
              </button>
              
              <button 
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-100"
              >
                <span>{currentStep === steps.length - 1 ? "Get Started" : "Next Step"}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
