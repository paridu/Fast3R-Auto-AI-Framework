
import React, { useState } from 'react';
import ThreeScene from './components/ThreeScene';
import JobUploader from './components/JobUploader';
import AIAssistant from './components/AIAssistant';
import { ReconstructionJob, JobStatus, JobSettings } from './types';

const App: React.FC = () => {
  const [jobs, setJobs] = useState<ReconstructionJob[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const activeJob = jobs.find(j => j.id === activeJobId);

  const handleStartJob = (name: string, images: File[], settings: JobSettings) => {
    const newJob: ReconstructionJob = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      imageCount: images.length,
      status: JobStatus.PROCESSING,
      createdAt: new Date(),
      settings
    };
    setJobs(prev => [newJob, ...prev]);
    setActiveJobId(newJob.id);
    
    // จำลองการประมวลผล 8 วินาที
    setTimeout(() => {
      setJobs(prev => prev.map(j => j.id === newJob.id ? { ...j, status: JobStatus.COMPLETED } : j));
    }, 8000);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-gray-900">
      {/* ส่วนแถบด้านข้าง (Sidebar) */}
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col hidden lg:flex">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-black text-blue-600 tracking-tighter uppercase italic">
            Fast3R <span className="text-gray-400 font-light">OS</span>
          </h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
            ระบบกู้คืน 3 มิติอัจฉริยะ
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-2">โครงการล่าสุด</h3>
          {jobs.length === 0 ? (
            <div className="text-center py-12 px-4 opacity-40">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-xs italic">ยังไม่มีโครงการที่บันทึกไว้</p>
            </div>
          ) : (
            jobs.map(job => (
              <button
                key={job.id}
                onClick={() => setActiveJobId(job.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  activeJobId === job.id 
                    ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500 shadow-sm' 
                    : 'border-transparent hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-sm truncate max-w-[140px]">{job.name}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                    job.status === JobStatus.COMPLETED ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700 animate-pulse'
                  }`}>
                    {job.status}
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 flex gap-2 font-medium">
                  <span>{job.imageCount} มุมมอง</span>
                  <span className="opacity-30">•</span>
                  <span>{job.settings.resolution}px</span>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 text-[9px] text-gray-400 font-black uppercase tracking-widest flex justify-between">
          <span>Engine: Fast3R-v2</span>
          <span>Build: 2025.05</span>
        </div>
      </aside>

      {/* ส่วนแสดงผลหลัก (Main Viewport) */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a]">
        <div className="h-[60%] w-full relative">
          <ThreeScene 
            isLoading={activeJob?.status === JobStatus.PROCESSING} 
            isCompleted={activeJob?.status === JobStatus.COMPLETED} 
          />
        </div>

        {/* ส่วนแผงควบคุมด้านล่าง (Lower Dashboard) */}
        <div className="flex-1 bg-gray-50 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-6 gap-6 overflow-hidden">
          <div className="lg:col-span-1 overflow-y-auto no-scrollbar">
            <JobUploader onStart={handleStartJob} isBusy={activeJob?.status === JobStatus.PROCESSING} />
          </div>
          <div className="lg:col-span-2 overflow-hidden">
            <AIAssistant />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
