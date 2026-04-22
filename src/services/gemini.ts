import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getGeminiResponse = async (prompt: string, systemInstruction: string, history: { role: string, parts: { text: string }[] }[] = []) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history.map(item => ({
          role: item.role,
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
