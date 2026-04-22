import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getGeminiResponse } from '../services/gemini';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface CourseAssistantProps {
  enrolledCourses: any[];
  userName: string;
}

export default function CourseAssistant({ enrolledCourses, userName }: CourseAssistantProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const enrolledCourseTitles = enrolledCourses.map(c => c.title).join(', ');
  const systemInstruction = `You are a "Special Learning Assistant" for ${userName} on the Strictch Toppers platform.
${userName} is currently enrolled in the following courses: ${enrolledCourseTitles}.

Your role is to:
1. Answer specific doubts about the course content.
2. Provide guidance on how to succeed in these fields (Marketing, Career Growth, etc., depending on the courses).
3. Be an encouraging mentor.

SECURITY RULES:
- NEVER disclose the email addresses of the administrators or mentors.
- NEVER discuss the existence, credentials, or internal details of the "Admin Panel" or background administrative systems.
- Focus ONLY on educational guidance and course-related doubts. If asked about site secrets or admin access, politely redirect to the course material.

Be deeply knowledgeable about the subjects mentioned in the course titles. If they ask a specific question about a course module, provide a helpful and professional educational response. If they ask something outside the scope of their courses, gently bring them back to their learning goals.

Always address ${userName} by name occasionally to make it personal.`;

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: Message = { role: 'user', parts: [{ text: input }] };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const responseText = await getGeminiResponse(input, systemInstruction, messages);
    
    setMessages(prev => [...prev, { role: 'model', parts: [{ text: responseText || "I'm processing that. Let me look it up. Can you rephrase or ask something else?" }] }]);
    setIsTyping(false);
  };

  return (
    <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-emerald-100 shadow-xl overflow-hidden flex flex-col h-[500px] md:h-[600px] relative">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-6 md:p-8 text-white relative">
        <div className="absolute top-0 right-0 p-6 md:p-8 opacity-10">
          <Sparkles className="h-16 w-16 md:h-24 md:w-24" />
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="bg-white/20 backdrop-blur-md p-2 md:p-3 rounded-xl md:rounded-2xl">
            <Bot className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold">Personal Course Assistant</h3>
            <p className="text-emerald-100 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1">Specialized for your learning path</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-6 bg-slate-50/50 no-scrollbar"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 md:space-y-6">
            <div className="bg-emerald-100 w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-emerald-600 animate-bounce">
              <MessageCircle className="h-8 w-8 md:h-10 md:w-10" />
            </div>
            <div className="space-y-2 max-w-[280px]">
              <h4 className="font-bold text-slate-800">Hello, {userName}!</h4>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium leading-relaxed">
                I'm your dedicated mentor for your enrolled courses. Ask me any doubt or for guidance on your path!
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
              {["How do I start these courses?", "Tips for career growth?", "What is the key takeaway?"].map((q, i) => (
                <button 
                  key={i} 
                  onClick={() => { setInput(q); handleSend(); }}
                  className="bg-white px-4 py-2 rounded-xl border border-slate-100 text-[10px] md:text-xs font-bold text-slate-600 hover:border-emerald-300 transition-all text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div 
            key={i}
            className={cn(
              "flex flex-col max-w-[90%] md:max-w-[85%]",
              m.role === 'user' ? "ml-auto items-end" : "items-start"
            )}
          >
            <div className={cn(
              "p-4 md:p-5 rounded-[1.2rem] md:rounded-[1.5rem] text-sm font-medium leading-relaxed shadow-sm",
              m.role === 'user' 
                ? "bg-slate-900 text-white rounded-tr-none" 
                : "bg-white text-slate-800 border border-emerald-50 rounded-tl-none"
            )}>
              {m.parts[0].text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-center space-x-1.5 p-5 bg-white border border-emerald-50 shadow-sm rounded-2xl rounded-tl-none w-20">
            <div className="w-2 h-2 bg-emerald-300 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-emerald-300 rounded-full animate-bounce [animation-delay:0.2s]" />
            <div className="w-2 h-2 bg-emerald-300 rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 md:p-8 bg-white border-t border-slate-100">
        <div className="relative group">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your course doubt..."
            className="w-full pl-6 md:pl-8 pr-12 md:pr-16 py-3 md:py-4 bg-slate-50 border border-slate-100 rounded-[1.2rem] md:rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-200 transition-all text-sm font-medium"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 bg-emerald-600 p-2 md:p-3 text-white rounded-lg md:rounded-xl shadow-lg shadow-emerald-200 hover:scale-110 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100"
          >
            <Send className="h-4 w-4 md:h-5 md:w-5" />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-3 md:mt-4 text-center">Powered by Gemini AI • Special Learning Mode</p>
      </form>
    </div>
  );
}
