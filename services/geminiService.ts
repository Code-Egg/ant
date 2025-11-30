import { GoogleGenAI } from "@google/genai";

const getAI = () => {
  if (process.env.API_KEY) {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return null;
};

export const getWaveIntro = async (wave: number, difficulty: string): Promise<string> => {
  const ai = getAI();
  if (!ai) return `Wave ${wave} incoming! Defend the cake!`;

  try {
    const prompt = `
      You are the Queen of Ants leading an army to steal a picnic cake.
      The player is defending with towers.
      Write a very short, funny, 1-sentence taunt for Wave ${wave}.
      Context: This is a ${difficulty} wave.
      Don't use quotes.
    `;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        maxOutputTokens: 30,
        temperature: 0.9,
      }
    });

    return response.text || `Wave ${wave} approaching!`;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `Wave ${wave} is here! Watch out!`;
  }
};

export const getGameOverMessage = async (wave: number, score: number): Promise<string> => {
  const ai = getAI();
  if (!ai) return `Game Over! You reached Wave ${wave}.`;

  try {
    const prompt = `
      The player lost the tower defense game at Wave ${wave} with score ${score}.
      Write a short, sarcastic console log from the Ant General celebrating their victory over the humans.
      Max 2 sentences.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        maxOutputTokens: 60,
      }
    });

    return response.text || "The ants have conquered the picnic!";
  } catch (error) {
    return "Mission Failed. The cake is gone.";
  }
};