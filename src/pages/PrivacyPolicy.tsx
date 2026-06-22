import { motion } from 'motion/react';
import { Shield, Lock, Eye, Mail, Phone, Calendar, MessageCircle } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 md:px-4 space-y-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 text-center"
      >
        <div className="inline-flex items-center justify-center p-4 bg-emerald-50 rounded-2xl mb-4">
          <Shield className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">Privacy Policy</h1>
        <div className="flex items-center justify-center gap-2 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
          <Calendar className="h-4 w-4" />
          <span>Effective Date: 15-04-2026</span>
        </div>
        <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed pt-4 font-medium">
          Welcome to <span className="text-slate-900 font-bold">Stricth Toppers</span>. Your privacy is paramount. This policy explains how we handle your data with transparency and care.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="prose prose-slate max-w-none space-y-10"
      >
        <section className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-3 text-slate-900 mb-2">
            <div className="bg-emerald-100 p-2 rounded-xl">
              <Eye className="h-5 w-5 text-emerald-700" />
            </div>
            <h2 className="text-xl md:text-2xl font-black m-0 tracking-tight">1. Information We Collect</h2>
          </div>
          <p className="text-slate-600 leading-relaxed m-0 text-sm md:text-base font-medium">When you use our ecosystem, we collect data to provide a seamless learning experience:</p>
          <ul className="grid sm:grid-cols-2 gap-3 text-slate-600 list-none p-0 m-0 pt-4">
            {[
              "Full Identity Name",
              "Primary Email Address",
              "WhatsApp-enabled Contact",
              "Course Selection History",
              "Payment Proof (Screenshots)"
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 bg-slate-50 px-5 py-3 rounded-2xl text-xs md:text-sm font-bold text-slate-700">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-6 px-2 md:px-6">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">2. Strategic Data Usage</h2>
          <div className="grid gap-4">
            {[
              "Expediting your course enrollment manually",
              "Maintaining the integrity of our elite cohort",
              "Granting instant access upon verification",
              "Facilitating direct mentorship communication",
              "Live class invitations via secure channels"
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start bg-white p-4 rounded-2xl border border-slate-50 shadow-sm">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black">{i+1}</span>
                <p className="text-slate-600 m-0 leading-relaxed text-sm font-medium">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-slate-900 text-white p-8 md:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="flex items-center gap-3 text-white mb-6">
            <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md">
              <Lock className="h-6 w-6 text-emerald-400" />
            </div>
            <h2 className="text-xl md:text-2xl font-black m-0 tracking-tight">3. Security Zero-Trust</h2>
          </div>
          <p className="text-slate-300 leading-relaxed font-medium text-sm md:text-lg mb-8">
            We do not process automated payments. All transactions are manual. We strictly collect Transaction IDs for identity mapping only.
          </p>
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
            <p className="text-xs md:text-sm text-slate-400 m-0 italic font-medium leading-relaxed">
              *Your financial security is our priority. We nunca store card details or CVV. Verification is handled by our senior support team manually.
            </p>
          </div>
        </section>

        <section className="bg-white border-2 border-slate-100 p-8 md:p-12 rounded-[3rem] space-y-10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-50 rounded-full translate-x-1/2 -translate-y-1/2" />
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 m-0 tracking-tight">Direct Support Channels</h2>
          <p className="text-slate-500 font-medium text-sm max-w-md mx-auto">Our human-first support team is available for any privacy-related inquiries.</p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6">
            <a 
              href="mailto:somanimayank723@gmail.com" 
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl hover:scale-105 transition-all group shadow-xl shadow-slate-200"
            >
              <Mail className="h-5 w-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="font-black uppercase tracking-widest text-[10px]">Email Support</span>
            </a>
            <a 
              href="https://wa.me/918660888419" 
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-slate-100 rounded-2xl hover:border-emerald-500 transition-all group"
            >
              <MessageCircle className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform" />
              <span className="font-black uppercase tracking-widest text-[10px] text-slate-900">WhatsApp Hub</span>
            </a>
          </div>
          
          <div className="pt-8 border-t border-slate-100 mt-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] m-0">© 2026 Stricth Toppers Ecosystem</p>
          </div>
        </section>
      </motion.div>
    </div>
  );
}
