import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key not found. Mocking response.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const getMartialArtsWisdom = async (score: number, level: number): Promise<string> => {
  const ai = getClient();
  if (!ai) {
    return "The path of the warrior is lonely. (API Key missing)";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are Jiumozhi (鸠摩智), the obsessed martial arts master from Demi-Gods and Semi-Devils. 
      The player has just finished a game of survival. 
      Score: ${score}. 
      Level Reached: ${level}.
      
      Generate a short, arrogant, yet somewhat wise comment about their performance in the style of a Wuxia villain. 
      If the score is low, mock them for their lack of training. 
      If high, acknowledge their potential but claim you are still superior.
      Limit to 2 sentences.`,
      config: {
        maxOutputTokens: 100,
        temperature: 0.8,
      }
    });

    return response.text || "Training is never finished.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Meditation interrupted. The mind is clouded.";
  }
};
