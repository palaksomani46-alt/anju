import { motion } from 'motion/react';
import { Gavel, Scale, FileText, CheckCircle, Calendar } from 'lucide-react';

export default function TermsOfUse() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 md:px-4 space-y-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 text-center"
      >
        <div className="inline-flex items-center justify-center p-4 bg-emerald-50 rounded-2xl mb-4">
          <Scale className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">Terms of Use</h1>
        <div className="flex items-center justify-center gap-2 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
          <Calendar className="h-4 w-4" />
          <span>Last Updated: 15-04-2026</span>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-8"
      >
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-lg md:text-xl font-black text-slate-900 flex items-center gap-3 mb-4">
              <CheckCircle className="h-6 w-6 text-emerald-500" />
              1. Acceptance
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">By accessing <span className="text-slate-900 font-bold">Stricth Toppers</span>, you agree to be bound by these Terms of Use and all applicable laws and regulations of the region.</p>
          </div>
          <div className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-lg md:text-xl font-black text-slate-900 flex items-center gap-3 mb-4">
              <FileText className="h-6 w-6 text-emerald-500" />
              2. Access Protocol
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">Access is granted upon manual verification of payment. We reserve the absolute right to revoke access if payment is found to be fraudulent or documentation is forged.</p>
          </div>
        </div>

        <section className="bg-slate-900 text-white p-8 md:p-12 rounded-[3rem] space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl opacity-50" />
          <h2 className="text-xl md:text-2xl font-black flex items-center gap-4 relative z-10">
            <Gavel className="h-8 w-8 text-emerald-400" />
            3. Intellectual Property
          </h2>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed font-medium relative z-10">
            All course materials, including proprietary videos, instructional PDFs, and mentorship frameworks, are the exclusive intellectual property of <span className="text-white font-bold underline decoration-emerald-500 decoration-2 underline-offset-4">Stricth Toppers</span> and Anju Somani. Unauthorized sharing, recording, or commercial redistribution is strictly prohibited and will be met with immediate legal prosecution.
          </p>
        </section>

        <section className="p-8 md:p-12 border-2 border-dashed border-slate-200 rounded-[3rem] space-y-6">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">4. Code of Conduct</h2>
          <ul className="space-y-4 text-slate-600 text-sm md:text-base font-medium">
            <li className="flex gap-4 bg-slate-50 p-4 rounded-2xl">
              <div className="mt-1.5 w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
              <span>Users must strictly provide verified payment screenshots. Distribution of false documents is a criminal offense.</span>
            </li>
            <li className="flex gap-4 bg-slate-50 p-4 rounded-2xl">
              <div className="mt-1.5 w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
              <span>Professional and respectful behavior in all community channels (Zoom/WhatsApp) is mandatory.</span>
            </li>
            <li className="flex gap-4 bg-slate-50 p-4 rounded-2xl">
              <div className="mt-1.5 w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
              <span>Account credentials are non-transferable. Group buys or account splitting will result in permanent ban without refund.</span>
            </li>
          </ul>
        </section>

        <div className="text-center pt-8 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black">Legal Inquiries: palaksomani46@gmail.com</p>
        </div>
      </motion.div>
    </div>
  );
}
