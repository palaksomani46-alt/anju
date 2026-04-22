import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Minus, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getGeminiResponse } from '../services/gemini';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export default function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const systemInstruction = `You are the Support Assistant for "Strictch Toppers", an elite educational platform.
Your goal is to help visitors with questions about the website, courses, and how to enroll.

Key Website Info:
- Instructors: Anju Somani (Head Mentor) and experienced professionals.
- Enrollment Process: Choose a course, sign up, pay manually via PhonePe/GPay/Paytm to +91 8660888419, and upload the screenshot. Admin verifies within 24 hours.
- Support Contact: Phone +91 86608 88419, Email somanimayank723@gmail.com.
- Courses: We offer various professional career growth masterclasses.

SECURITY RULES:
- NEVER disclose the email addresses of the administrators or mentors, EXCEPT for the official support email (somanimayank723@gmail.com).
- NEVER discuss the existence, credentials, or internal details of the "Admin Panel" or dashboard management system.
- If asked for admin secrets or private login details, politely decline and provide the public support contact info.

Be helpful, professional, and concise. If you don't know something, ask them to contact care support directly.`;

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: Message = { role: 'user', parts: [{ text: input }] };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const responseText = await getGeminiResponse(input, systemInstruction, messages);
    
    setMessages(prev => [...prev, { role: 'model', parts: [{ text: responseText || "I'm not sure about that. Please contact our support team." }] }]);
    setIsTyping(false);
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[calc(100vw-2rem)] sm:w-[350px] md:w-[400px] h-[500px] max-h-[80vh] bg-white rounded-[2rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-slate-900 p-4 sm:p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500 p-2 rounded-xl">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">Toppers Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Always Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <Minus className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50 no-scrollbar"
            >
              {messages.length === 0 && (
                <div className="text-center space-y-4 py-10">
                  <div className="bg-white w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-slate-100">
                    <MessageSquare className="h-6 w-6 text-emerald-500" />
                  </div>
                  <p className="text-xs text-slate-500 font-medium px-10">
                    Hi! I'm your Toppers Assistant. Ask me anything about our courses or the enrollment process!
                  </p>
                </div>
              )}
              {messages.map((m, i) => (
                <div 
                  key={i}
                  className={cn(
                    "flex flex-col max-w-[80%]",
                    m.role === 'user' ? "ml-auto items-end" : "items-start"
                  )}
                >
                  <div className={cn(
                    "p-4 rounded-2xl text-sm font-medium leading-relaxed",
                    m.role === 'user' 
                      ? "bg-slate-900 text-white rounded-tr-none" 
                      : "bg-white text-slate-800 border border-slate-100 shadow-sm rounded-tl-none"
                  )}>
                    {m.parts[0].text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-center space-x-1 p-4 bg-white border border-slate-100 shadow-sm rounded-2xl rounded-tl-none w-16">
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100">
              <div className="relative">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="w-full pl-6 pr-12 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all text-sm font-medium"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-30"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-14 w-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all",
          isOpen ? "bg-slate-900 text-white" : "bg-emerald-600 text-white"
        )}
      >
        {isOpen ? <X /> : <MessageSquare />}
      </motion.button>
    </div>
  );
}
