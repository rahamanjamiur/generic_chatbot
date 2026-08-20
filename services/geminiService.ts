import { GoogleGenAI, Modality } from "@google/genai";
import type { GroundingChunk } from "@google/genai";
import type { GroundingSource } from '../types';
import {
  LLM_API_KEY,
  LLM_MODEL_NAME,
  LLM_TTS_MODEL_NAME,
  getSystemInstruction,
  WELCOME_MESSAGE_CONTENT,
  ERROR_MESSAGE_CONTENT
} from '../config';

const getAI = () => {
  if (!LLM_API_KEY) {
    throw new Error("LLM API key not set. Please configure LLM_API_KEY, VITE_LLM_API_KEY, or GEMINI_API_KEY in your environment or config.ts.");
  }
  return new GoogleGenAI({ apiKey: LLM_API_KEY });
};

export async function* getGroundedResponseStream(
  prompt: string,
  selectedUIMessageLanguage: string
): AsyncGenerator<{ text?: string; sources?: GroundingSource[] }> {
  const ai = getAI();
  const systemInstruction = getSystemInstruction(selectedUIMessageLanguage);

  try {
    const stream = await ai.models.generateContentStream({
      model: LLM_MODEL_NAME,
      contents: {
        role: 'user',
        parts: [{ text: prompt }]
      },
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    let sourcesHaveBeenSent = false;

    for await (const chunk of stream) {
      const text = chunk.text;
      const groundingChunks: GroundingChunk[] = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      
      let sources: GroundingSource[] | undefined = undefined;

      if (groundingChunks.length > 0 && !sourcesHaveBeenSent) {
        sources = groundingChunks
          .map(chunk => chunk.web)
          .filter((web): web is { uri: string; title: string } => !!web && !!web.uri)
          .map(web => ({ uri: web.uri, title: web.title || web.uri }));
        
        sources = Array.from(new Map(sources.map(item => {
          const normalizedUri = item.uri.replace(/\/$/, '');
          return [normalizedUri, { ...item, uri: normalizedUri }];
        })).values());
        sourcesHaveBeenSent = true;
      }

      yield { text, sources };
    }
  } catch (error) {
    console.error("Error getting response stream:", error);
    yield { text: "Sorry, I encountered an error. Please check your model details and API key configuration." };
  }
}

export const getTextToSpeech = async (text: string, _languageCode: string): Promise<string | null> => {
  if (!text) return null;
  const ai = getAI();
    
  try {
    const response = await ai.models.generateContent({
      model: LLM_TTS_MODEL_NAME,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("Error generating speech:", error);
    return null;
  }
};

export const getWelcomeMessageTTS = async (): Promise<string | null> => {
  return getTextToSpeech(WELCOME_MESSAGE_CONTENT, 'en-US');
};

export const getErrorMessageTTS = async (): Promise<string | null> => {
  return getTextToSpeech(ERROR_MESSAGE_CONTENT, 'en-US');
};
