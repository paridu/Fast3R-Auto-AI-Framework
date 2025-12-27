
import { GoogleGenAI, Type } from "@google/genai";
import { JobSettings } from "../types";

export class GeminiService {
  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async getWorkflowAdvice(imageCount: number, subject: string): Promise<{ settings: JobSettings; explanation: string }> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `แนะนำการตั้งค่า Fast3R สำหรับภาพ ${imageCount} ภาพของ ${subject} ในภาษาไทย`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            settings: {
              type: Type.OBJECT,
              properties: {
                resolution: { type: Type.STRING, enum: ['512', '1024', '2048'] },
                mode: { type: Type.STRING, enum: ['pointcloud', 'mesh'] },
                cameraIntrinsics: { type: Type.STRING, enum: ['auto', 'manual'] },
                optimization: { type: Type.STRING, enum: ['speed', 'quality'] }
              },
              required: ['resolution', 'mode', 'cameraIntrinsics', 'optimization']
            },
            explanation: { type: Type.STRING }
          },
          required: ['settings', 'explanation']
        }
      }
    });

    try {
      return JSON.parse(response.text);
    } catch (e) {
      return {
        settings: { resolution: '1024', mode: 'pointcloud', cameraIntrinsics: 'auto', optimization: 'quality' },
        explanation: "ใช้การตั้งค่าเริ่มต้นเนื่องจากข้อผิดพลาด"
      };
    }
  }

  async chatAssistant(message: string, useThinking: boolean, imageBase64?: string): Promise<{ text: string, grounding?: any }> {
    const ai = this.getAI();
    
    // เลือกโมเดลตามความเหมาะสม:
    // 1. ถ้าใช้ Thinking -> Pro (max thinking budget)
    // 2. ถ้ามีรูปภาพ -> Pro (image understanding)
    // 3. ถ้าถามข้อมูลทั่วไป/ข่าวสาร -> Flash (Search Grounding)
    // 4. ทั่วไป -> Flash Lite (Fast)
    
    let model = 'gemini-2.5-flash-lite';
    let tools: any = undefined;
    let thinkingConfig: any = undefined;

    if (useThinking) {
      model = 'gemini-3-pro-preview';
      thinkingConfig = { thinkingBudget: 32768 };
    } else if (imageBase64) {
      model = 'gemini-3-pro-preview';
    } else if (message.includes('คือใคร') || message.includes('ข่าว') || message.includes('วันนี้') || message.includes('ข้อมูล')) {
      model = 'gemini-3-flash-preview';
      tools = [{ googleSearch: {} }];
    }

    const parts: any[] = [{ text: message }];
    if (imageBase64) {
      parts.push({
        inlineData: { mimeType: 'image/jpeg', data: imageBase64 }
      });
    }

    const response = await ai.models.generateContent({
      model,
      contents: [{ parts }],
      config: {
        systemInstruction: "คุณคือผู้ช่วย Fast3R AI อัจฉริยะ ตอบคำถามเป็นภาษาไทยอย่างมืออาชีพ และช่วยจัดการงานอัตโนมัติ",
        tools,
        thinkingConfig
      }
    });

    return {
      text: response.text || "ไม่สามารถประมวลผลได้",
      grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks
    };
  }

  async transcribeAudio(audioBase64: string): Promise<string> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { inlineData: { mimeType: 'audio/webm', data: audioBase64 } },
            { text: "ช่วยถอดความเสียงนี้เป็นข้อความภาษาไทย" }
          ]
        }
      ]
    });
    return response.text || "";
  }

  async generateImage(prompt: string, size: "1K" | "2K" | "4K"): Promise<string> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "1:1", imageSize: size } }
    });
    
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("Image generation failed");
  }

  async generateVideo(prompt: string, aspectRatio: "16:9" | "9:16"): Promise<string> {
    const ai = this.getAI();
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt,
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio }
    });
    
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }
    const link = operation.response?.generatedVideos?.[0]?.video?.uri;
    const fetchRes = await fetch(`${link}&key=${process.env.API_KEY}`);
    const blob = await fetchRes.blob();
    return URL.createObjectURL(blob);
  }

  async editImage(base64: string, prompt: string): Promise<string> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64, mimeType: 'image/jpeg' } },
          { text: prompt }
        ]
      }
    });
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("Image edit failed");
  }
}

export const geminiService = new GeminiService();
