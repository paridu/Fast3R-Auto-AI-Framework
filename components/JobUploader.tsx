
import React, { useState } from 'react';
import { JobSettings } from '../types';
import { geminiService } from '../services/geminiService';

interface JobUploaderProps {
  onStart: (name: string, images: File[], settings: JobSettings) => void;
  isBusy: boolean;
}

const JobUploader: React.FC<JobUploaderProps> = ({ onStart, isBusy }) => {
  const [name, setName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [advice, setAdvice] = useState<string>('');
  const [isAdvising, setIsAdvising] = useState(false);
  const [settings, setSettings] = useState<JobSettings>({
    resolution: '1024',
    mode: 'pointcloud',
    cameraIntrinsics: 'auto',
    optimization: 'quality'
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files));
  };

  const getAIAdvice = async () => {
    if (files.length === 0 || !name) return;
    setIsAdvising(true);
    try {
      const result = await geminiService.getWorkflowAdvice(files.length, name);
      setSettings(result.settings);
      setAdvice(result.explanation);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdvising(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length > 0 && name) onStart(name, files, settings);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span className="p-2 bg-blue-100 rounded-lg text-blue-600">🚀</span>
        สร้างโปรเจกต์ใหม่
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อโปรเจกต์</label>
          <input 
            type="text" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="เช่น รถคลาสสิก, ห้องทำงาน..."
            value={name} onChange={(e) => setName(e.target.value)} required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">สื่อตั้งต้น (Multi-view)</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-blue-400 transition-colors">
            <div className="space-y-1 text-center">
              <div className="flex text-sm text-gray-600">
                <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                  <span>อัปโหลดชุดภาพถ่าย</span>
                  <input type="file" multiple className="sr-only" onChange={handleFileChange} accept="image/*" />
                </label>
              </div>
              <p className="text-xs text-gray-500">เลือกภาพมุมต่างๆ เพื่อความแม่นยำ</p>
              {files.length > 0 && <p className="text-sm font-semibold text-blue-600 mt-2">เลือกแล้ว {files.length} ภาพ</p>}
            </div>
          </div>
        </div>

        <div className="pt-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fast3R Parameters</h3>
            <button 
              type="button" onClick={getAIAdvice} disabled={isAdvising || files.length === 0 || !name}
              className="text-xs flex items-center gap-1 text-purple-600 font-medium hover:bg-purple-50 px-2 py-1 rounded transition-colors disabled:opacity-50"
            >
              🪄 ปรับแต่งอัตโนมัติด้วย AI
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <select 
              value={settings.resolution} onChange={(e) => setSettings({...settings, resolution: e.target.value as any})}
              className="px-3 py-2 border rounded-lg text-sm bg-gray-50"
            >
              <option value="512">ความละเอียด 512px</option>
              <option value="1024">ความละเอียด 1024px</option>
              <option value="2048">ความละเอียด 2048px</option>
            </select>
            <select 
              value={settings.mode} onChange={(e) => setSettings({...settings, mode: e.target.value as any})}
              className="px-3 py-2 border rounded-lg text-sm bg-gray-50"
            >
              <option value="pointcloud">Point Cloud</option>
              <option value="mesh">Full Mesh</option>
            </select>
          </div>

          {advice && <div className="mb-4 p-3 bg-purple-50 rounded-lg text-[10px] text-purple-800 border border-purple-100 italic"><strong>แนะนำโดย Gemini:</strong> {advice}</div>}
        </div>

        <button 
          type="submit" disabled={isBusy || files.length === 0 || !name}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all transform active:scale-95"
        >
          {isBusy ? 'กำลังประมวลผลระบบ...' : 'เริ่มต้นสร้างโมเดล 3 มิติ'}
        </button>
      </form>
    </div>
  );
};

export default JobUploader;
