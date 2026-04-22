import { motion } from 'motion/react';
import { Shield, Lock, Eye, Mail, Phone, Calendar, MessageCircle } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 text-center"
      >
        <div className="inline-flex items-center justify-center p-3 bg-secondary rounded-2xl mb-4">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
        <div className="flex items-center justify-center gap-2 text-slate-500 font-medium">
          <Calendar className="h-4 w-4" />
          <span>Effective Date: 15-04-2026</span>
        </div>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed pt-4">
          Welcome to our Course Selling Platform. Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="prose prose-slate max-w-none space-y-10"
      >
        <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-3 text-slate-900 mb-2">
            <div className="bg-green-100 p-2 rounded-lg">
              <Eye className="h-5 w-5 text-green-700" />
            </div>
            <h2 className="text-xl font-bold m-0">1. Information We Collect</h2>
          </div>
          <p className="text-slate-600 leading-relaxed m-0">When you use our website, we may collect the following information:</p>
          <ul className="grid md:grid-cols-2 gap-2 text-slate-600 list-none p-0 m-0">
            {[
              "Full Name",
              "Email Address",
              "Phone Number (WhatsApp enabled)",
              "Course selection details",
              "Payment details (Transaction ID & Screenshot)"
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-sm font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4 px-4">
          <h2 className="text-xl font-bold text-slate-900">2. How We Use Your Information</h2>
          <div className="grid gap-4">
            {[
              "Process your course enrollment",
              "Verify your payment status securely",
              "Provide instant access to the course content",
              "Send critical course-related updates",
              "Share live class invitations via WhatsApp"
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">{i+1}</span>
                <p className="text-slate-600 m-0 leading-normal">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-emerald-50/50 p-8 rounded-3xl border border-emerald-100 space-y-4">
          <div className="flex items-center gap-3 text-slate-900 mb-2">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <Lock className="h-5 w-5 text-emerald-700" />
            </div>
            <h2 className="text-xl font-bold m-0">3. Payment Information</h2>
          </div>
          <p className="text-slate-700 leading-relaxed font-medium">We do not process payments directly on our platform. Users are required to make payments manually to the provided number.</p>
          <div className="bg-white/80 p-4 rounded-xl border border-emerald-100/50">
            <p className="text-sm text-slate-600 m-0 italic">We only collect Transaction ID and Payment proof (screenshot) strictly for verification purposes.</p>
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-8 px-4">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider text-xs">4. Sharing of Information</h2>
            <p className="text-sm text-slate-600 leading-relaxed">We do not sell, trade, or rent your personal information to others. Your information is only used for course access and communication related to your purchase.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider text-xs">5. Data Storage</h2>
            <p className="text-sm text-slate-600 leading-relaxed">Your data may be stored securely using database systems. We take reasonable steps to protect your info, but absolute security cannot be guaranteed.</p>
          </section>
        </div>

        <section className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl space-y-6">
          <h2 className="text-xl font-bold text-white mb-4">6. User Responsibility</h2>
          <div className="space-y-4">
            <p className="text-slate-300 text-sm italic">As an elite learner in our community, we expect:</p>
            <div className="grid gap-3">
              {[
                "Providng accurate information at all times",
                "Ensuring payment is made to the correct recipient",
                "Avoiding sharing false payment proofs"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/10 p-3 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-6 px-4">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 m-0">7. Communication</h2>
            <p className="text-slate-600 text-sm">By using our platform, you agree to receive course-related messages on WhatsApp and Email.</p>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 m-0">8. Changes to Policy</h2>
            <p className="text-slate-600 text-sm">We may update this policy. Updates will be visible on this page.</p>
          </div>
        </section>

        <section className="bg-white border-2 border-slate-100 p-10 rounded-[2.5rem] space-y-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full translate-x-1/2 -translate-y-1/2" />
          <h2 className="text-2xl font-bold text-slate-900 m-0">9. Need Assistance?</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <a 
              href="tel:+918660888419" 
              className="flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-2xl hover:bg-blue-50 transition-colors group"
            >
              <Phone className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-slate-700">Call Support</span>
            </a>
            <a 
              href="https://wa.me/918660888419" 
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-2xl hover:bg-green-50 transition-colors group"
            >
              <MessageCircle className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-slate-700">WhatsApp</span>
            </a>
            <a href="mailto:somanimayank723@gmail.com" className="flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-2xl hover:bg-emerald-50 transition-colors group">
              <Mail className="h-5 w-5 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-slate-700">Email</span>
            </a>
          </div>
          <div className="pt-4 border-t border-slate-50">
            <p className="text-sm font-bold text-slate-900 m-0">10. Consent</p>
            <p className="text-xs text-slate-500 m-0 mt-1">By using our platform, you hereby agree to this Privacy Policy.</p>
          </div>
        </section>
      </motion.div>
    </div>
  );
}
