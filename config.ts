/**
 * Application Configuration & Model Settings
 * Customize bot metadata, system instructions, branding, and model details here.
 */

// Model & API Configuration
export const LLM_API_KEY =
  process.env.LLM_API_KEY ||
  process.env.VITE_LLM_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.API_KEY ||
  "";

// Default LLM Model Name (e.g., gemini-2.5-flash, gpt-4o, claude-3-5-sonnet, etc.)
export const LLM_MODEL_NAME =
  process.env.LLM_MODEL_NAME ||
  process.env.VITE_LLM_MODEL_NAME ||
  "gemini-2.5-flash";

// Default TTS Model Name (e.g., gemini-3.1-flash-tts-preview)
export const LLM_TTS_MODEL_NAME =
  process.env.LLM_TTS_MODEL_NAME ||
  process.env.VITE_LLM_TTS_MODEL_NAME || "gemini-3.1-flash-tts-preview";

// Bot Identity & Branding
export const BOT_NAME = process.env.VITE_BOT_NAME || "AI Co-Worker";
export const BOT_TITLE = process.env.VITE_BOT_TITLE || "AI Co-Worker";
export const BOT_SUBTITLE = process.env.VITE_BOT_SUBTITLE || "Explore. Ask. Discover.";

// Welcome Messages
export const WELCOME_MESSAGE_EN = "Hi! I'm your AI Associate. How can I help you today?";
export const WELCOME_MESSAGE_MS = "Hai! Saya Rakan AI anda. Bagaimana saya boleh membantu anda hari ini?";
export const WELCOME_MESSAGE_CONTENT = `${WELCOME_MESSAGE_EN}\n\n${WELCOME_MESSAGE_MS}`;

// Error Fallback Message (also pre-cached as TTS audio)
export const ERROR_MESSAGE_CONTENT = "Sorry, I ran into an issue. Please try again.";

// Theme & Styling
export const BRAND_GRADIENT = "linear-gradient(135deg, rgb(132, 204, 22) 0%, rgb(26, 199, 229) 100%)";
export const BRAND_PRIMARY_COLOR = "#24c8d1";

// Contact Information & Direct Response Fallback Placeholder
export const CONTACT_INFO_MARKDOWN = `🌐 Official Website: [https://example.com](https://example.com)
✉️ Email: [support@example.com](mailto:support@example.com)
💬 Contact Us: [Get in touch](https://example.com/contact)`;

/**
 * Generates the system prompt instruction for the LLM.
 * Customize this prompt to match your domain and required assistant behavior.
 */
export const getSystemInstruction = (selectedLanguage: string): string => {
  const languageName =
    selectedLanguage === "en-US"
      ? "English"
      : "Bahasa Melayu (Malaysian Malay, NOT Bahasa Indonesia)";

  return `You are "${BOT_NAME}," an official, expert, and friendly conversational AI assistant. Your goal is to assist users with accurate and helpful information.

**Strict Language Adherence:** You MUST respond exclusively in ${languageName}.

**Core Guidelines:**
1. **Contact Information:** If the user explicitly asks how to contact support, team, or official channels, respond clearly with:
${CONTACT_INFO_MARKDOWN}

2. **Web Search / Grounding:** For other general or factual inquiries, retrieve verified and up-to-date information using available web search tools when needed.

3. **Voice Output Optimization:** Keep your answers concise, clear, and easy to understand when spoken aloud by a Text-to-Speech (TTS) system. Avoid excessive formatting or complex punctuation.

4. **Tone & Constraints:**
   - Maintain a helpful, respectful, and professional tone.
   - Keep responses concise (around 2 to 3 sentences maximum unless the user requests detailed explanations).
   - If factual information cannot be found, politely inform the user and direct them to official resources.`;
};

// Custom Speech Recognition Keywords (Optional)
export const SPEECH_RECOGNITION_KEYWORDS = [
  BOT_NAME,
  "Assistant",
  "Help",
  "Support",
];
