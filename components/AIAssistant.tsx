
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { geminiService } from '../services/geminiService';

const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'สวัสดี! ผมคือผู้ช่วยอัจฉริยะ Fast3R คุณสามารถส่งภาพให้ผมวิเคราะห์ สั่งสร้างภาพ 3D Concept หรือวิดีโอโมเดลได้ทันที', 
      timestamp: new Date() 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const [imageSize, setImageSize] = useState<"1K" | "2K" | "4K">("1K");
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const addMessage = (msg: Message) => setMessages(prev => [...prev, msg]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          setIsLoading(true);
          try {
            const text = await geminiService.transcribeAudio(base64);
            if (text) setInput(text);
          } catch (err) {
            console.error(err);
          } finally {
            setIsLoading(false);
          }
        };
      };
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { role: 'user', content: input, timestamp: new Date() };
    addMessage(userMsg);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      if (currentInput.toLowerCase().startsWith('/image')) {
        const url = await geminiService.generateImage(currentInput.replace('/image', '').trim(), imageSize);
        addMessage({ role: 'assistant', content: 'สร้างภาพสำเร็จ:', timestamp: new Date(), type: 'image', mediaUrl: url });
      } else if (currentInput.toLowerCase().startsWith('/video')) {
        const url = await geminiService.generateVideo(currentInput.replace('/video', '').trim(), "16:9");
        addMessage({ role: 'assistant', content: 'สร้างวิดีโอสำเร็จ:', timestamp: new Date(), type: 'video', mediaUrl: url });
      } else {
        const res = await geminiService.chatAssistant(currentInput, useThinking);
        addMessage({ role: 'assistant', content: res.text, timestamp: new Date(), groundingLinks: res.grounding });
      }
    } catch (err) {
      addMessage({ role: 'assistant', content: 'เกิดข้อผิดพลาดในการประมวลผล', timestamp: new Date() });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      addMessage({ role: 'user', content: 'วิเคราะห์รูปภาพนี้', timestamp: new Date(), type: 'image', mediaUrl: reader.result as string });
      try {
        const res = await geminiService.chatAssistant("ช่วยวิเคราะห์ภาพนี้ในบริบทของ 3D reconstruction และแนะนำวิธีแต่งภาพหากจำเป็น", false, base64);
        addMessage({ role: 'assistant', content: res.text, timestamp: new Date() });
      } catch (err) {
        addMessage({ role: 'assistant', content: 'วิเคราะห์ภาพล้มเหลว', timestamp: new Date() });
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white h-full rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <h2 className="font-bold text-gray-800">Fast3R AI Command Center</h2>
        </div>
        <div className="flex items-center gap-2">
          <select 
            className="text-[10px] bg-gray-50 border rounded p-1 outline-none"
            value={imageSize}
            onChange={(e) => setImageSize(e.target.value as any)}
          >
            <option value="1K">1K Image</option>
            <option value="2K">2K Image</option>
            <option value="4K">4K Image</option>
          </select>
          <label className="flex items-center gap-1 text-[10px] cursor-pointer bg-purple-50 px-2 py-1 rounded text-purple-700 font-bold border border-purple-100 transition-colors hover:bg-purple-100">
            <input type="checkbox" checked={useThinking} onChange={(e) => setUseThinking(e.target.checked)} className="rounded" />
            Thinking Mode
          </label>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/20">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] px-4 py-3 rounded-2xl text-sm ${
              m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none shadow-md' : 'bg-white text-gray-800 border rounded-bl-none shadow-sm'
            }`}>
              <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
              {m.type === 'image' && <img src={m.mediaUrl} className="mt-2 rounded-lg max-w-full h-auto border shadow-sm" />}
              {m.type === 'video' && <video src={m.mediaUrl} controls className="mt-2 rounded-lg max-w-full shadow-sm" />}
              {m.groundingLinks && m.groundingLinks.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-tight">แหล่งข้อมูลที่เกี่ยวข้อง:</p>
                  <div className="flex flex-col gap-1">
                    {m.groundingLinks.map((link: any, idx) => (
                      <a key={idx} href={link.web.uri} target="_blank" className="text-[10px] text-blue-500 hover:text-blue-700 transition-colors flex items-center gap-1 truncate">
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                        {link.web.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 ml-2">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <span className="text-[10px] text-gray-400 font-bold italic">FAST3R_AI กำลังประมวลผล...</span>
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-white space-y-2">
        <div className="flex gap-2 text-[10px] items-center">
          <button onClick={() => setInput('/image ')} className="bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 transition-colors">/image (สร้างภาพ)</button>
          <button onClick={() => setInput('/video ')} className="bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 transition-colors">/video (สร้างวิดีโอ)</button>
          <button onClick={() => fileInputRef.current?.click()} className="bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition-colors flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            วิเคราะห์ภาพ
          </button>
          <button 
            onMouseDown={startRecording} 
            onMouseUp={stopRecording}
            onMouseLeave={isRecording ? stopRecording : undefined}
            className={`px-2 py-1 rounded transition-all flex items-center gap-1 font-bold ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
            {isRecording ? 'ปล่อยเพื่อส่ง' : 'กดค้างเพื่อถอดเสียง'}
          </button>
        </div>
        <div className="flex gap-2">
          <input 
            type="text" className="flex-1 bg-gray-50 border rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            placeholder="พิมพ์คำสั่งเพื่อควบคุมระบบอัตโนมัติ..."
            value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button onClick={handleSend} disabled={isLoading || !input.trim()} className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-100 disabled:opacity-30 transition-transform active:scale-90">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
      </div>
    </div>
  );
};

export default AIAssistant;
