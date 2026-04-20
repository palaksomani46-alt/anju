import { motion } from 'motion/react';
import { Gavel, Scale, FileText, CheckCircle, Calendar } from 'lucide-react';

export default function TermsOfUse() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 text-center"
      >
        <div className="inline-flex items-center justify-center p-3 bg-secondary rounded-2xl mb-4">
          <Scale className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Terms of Use</h1>
        <div className="flex items-center justify-center gap-2 text-slate-500 font-medium">
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
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              1. Acceptance
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">By accessing Strictch Toppers, you agree to be bound by these Terms of Use and all applicable laws and regulations.</p>
          </div>
          <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5 text-green-500" />
              2. Course Access
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">Access is granted upon manual verification of payment. We reserve the right to revoke access if payment is found to be fraudulent.</p>
          </div>
        </div>

        <section className="bg-slate-900 text-white p-8 rounded-3xl space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-3">
            <Gavel className="h-6 w-6 text-green-400" />
            3. Intellectual Property
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            All course materials, including videos, PDFs, and mentorship frameworks, are the exclusive property of Strictch Toppers and Anju Somani. Unauthorized sharing or commercial use is strictly prohibited and may result in legal action.
          </p>
        </section>

        <section className="p-8 border-2 border-dashed border-slate-200 rounded-3xl space-y-4">
          <h2 className="text-xl font-bold text-slate-900">4. User Conduct</h2>
          <ul className="space-y-3 text-slate-600 text-sm">
            <li className="flex gap-2">
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
              Users must not distribute false payment proofs or screenshots.
            </li>
            <li className="flex gap-2">
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
              Respectful behavior in live Zoom sessions and WhatsApp groups is mandatory.
            </li>
            <li className="flex gap-2">
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
              Account sharing is not permitted and will lead to immediate termination.
            </li>
          </ul>
        </section>

        <div className="text-center pt-8">
          <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Contact for Clarifications: somanimayank723@gmail.com</p>
        </div>
      </motion.div>
    </div>
  );
}
