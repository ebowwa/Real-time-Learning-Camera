
import { GoogleGenAI } from "@google/genai";
import type { LearnedItem } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const base64ToGenerativePart = (imageBase64: string, mimeType: string) => {
  return {
    inlineData: {
      mimeType,
      data: imageBase64.split(',')[1],
    },
  };
};

export const classifyImage = async (
  currentFrameBase64: string,
  learnedItems: LearnedItem[]
): Promise<string> => {
  if (learnedItems.length === 0) {
    return "";
  }
  
  try {
    const model = 'gemini-2.5-flash';

    const currentFramePart = base64ToGenerativePart(currentFrameBase64, 'image/jpeg');
    
    const learnedParts = learnedItems.map(item => 
      base64ToGenerativePart(item.imageBase64, 'image/jpeg')
    );
    
    const labels = learnedItems.map(item => item.label);
    
    const prompt = `
      You are an expert visual classifier. The very first image is from a live camera feed. 
      The subsequent images are reference items with known labels. 
      Compare the primary object in the first image with each of the reference images.
      Which reference item is it most visually similar to?
      Respond with ONLY the label from the following list that best matches. 
      Possible labels: ${labels.join(', ')}.
      If there is no clear match, respond with '...'.
      Your response should be very short.
    `;

    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
      model,
      contents: { parts: [currentFramePart, ...learnedParts, textPart] },
    });

    // Clean up the response to get just the label
    let resultText = response.text.trim().replace(/['"`*.]/g, '');
    
    // Sometimes the model might respond with "Label: [TheLabel]". This extracts it.
    if (resultText.toLowerCase().startsWith('label:')) {
        resultText = resultText.substring(6).trim();
    }
    
    if (labels.includes(resultText) || resultText === '...') {
      return resultText;
    }

    // Fallback if the model returns something unexpected but contains a label
    const foundLabel = labels.find(label => resultText.includes(label));
    return foundLabel || '...';

  } catch (error) {
    console.error("Error classifying image with Gemini:", error);
    return "Error";
  }
};
