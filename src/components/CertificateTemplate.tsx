import React from 'react';

interface CertificateTemplateProps {
  userName: string;
  courseTitle: string;
  date: string;
  certificateId: string;
}

export const CertificateTemplate: React.FC<CertificateTemplateProps> = ({ 
  userName, 
  courseTitle, 
  date,
  certificateId 
}) => {
  return (
    <div 
      id="certificate-template"
      className="w-[800px] h-[600px] bg-white relative overflow-hidden flex flex-col items-center justify-center p-12 border-[20px] border-emerald-600"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-50 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-50" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-50 rounded-full translate-x-1/2 translate-y-1/2 opacity-50" />
      
      {/* Border accent */}
      <div className="absolute inset-4 border-2 border-emerald-100 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
            S
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">
            Stricth<span className="text-emerald-600">Toppers</span>
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-sm font-black uppercase tracking-[0.3em] text-emerald-600">Certificate of Completion</h1>
          <p className="text-slate-500 font-medium">This is to certify that</p>
        </div>

        <h2 className="text-5xl font-black text-slate-900 border-b-4 border-emerald-500 pb-2 px-8 italic">
          {userName}
        </h2>

        <div className="space-y-2 pt-4">
          <p className="text-slate-500 font-medium text-lg">has successfully completed the masterclass in</p>
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">
            {courseTitle}
          </h3>
        </div>

        <div className="flex justify-between w-full pt-12">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-40 border-b border-slate-300" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date Issued</span>
            <span className="text-sm font-bold text-slate-700">{date}</span>
          </div>
          
          <div className="flex flex-col items-center space-y-2">
            <img 
              src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=https://strictch-toppers.app/verify/" 
              className="w-16 h-16 opacity-20"
              alt="QR Code"
            />
            <span className="text-[8px] font-bold text-slate-300 uppercase">ID: {certificateId}</span>
          </div>

          <div className="flex flex-col items-center space-y-2">
            <div className="w-40 border-b border-slate-300" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Anju Somani</span>
            <span className="text-sm font-bold text-slate-700">Head Mentor</span>
          </div>
        </div>
      </div>
      
      {/* Corners */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600 clip-path-polygon-[100%_0,100%_100%,0_0]" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 0)' }} />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-600 clip-path-polygon-[0_0,0_100%,100%_100%]" style={{ clipPath: 'polygon(0 0, 0 100%, 100% 100%)' }} />
    </div>
  );
};
