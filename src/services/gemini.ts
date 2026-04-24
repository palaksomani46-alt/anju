import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    // Check multiple possible locations for the key
    const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
    
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "undefined") {
      console.error("GEMINI_API_KEY is missing or invalid. To fix this: Go to Settings -> Secrets in AI Studio and add GEMINI_API_KEY.");
      return null;
    }
    
    try {
      aiInstance = new GoogleGenAI({ apiKey });
    } catch (e) {
      console.error("Failed to initialize GoogleGenAI:", e);
      return null;
    }
  }
  return aiInstance;
};

export const getGeminiResponse = async (prompt: string, systemInstruction: string, history: { role: string, parts: { text: string }[] }[] = []) => {
  try {
    const ai = getAI();
    if (!ai) {
      return "Hi! I'm currently in a quick maintenance break (AI connection pending). Please make sure the Gemini API Key is configured in the settings, or try again in a moment!";
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history.map(item => ({
          role: item.role === 'model' ? 'model' : 'user',
          parts: [{ text: item.parts[0].text }]
        })),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm sorry, I'm having trouble connecting right now. Please try again later.";
  }
};
