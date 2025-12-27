
export enum JobStatus {
  PENDING = 'รอดำเนินการ',
  PROCESSING = 'กำลังประมวลผล',
  COMPLETED = 'เสร็จสมบูรณ์',
  FAILED = 'ล้มเหลว'
}

export interface ReconstructionJob {
  id: string;
  name: string;
  imageCount: number;
  status: JobStatus;
  createdAt: Date;
  settings: JobSettings;
  resultUrl?: string;
}

export interface JobSettings {
  resolution: '512' | '1024' | '2048';
  mode: 'pointcloud' | 'mesh';
  cameraIntrinsics: 'auto' | 'manual';
  optimization: 'speed' | 'quality';
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'image' | 'video';
  mediaUrl?: string;
  groundingLinks?: { web: { uri: string; title: string } }[];
}
