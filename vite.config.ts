import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Expose all supported API key aliases so any of them can be set in .env
      'process.env.LLM_API_KEY': JSON.stringify(env.LLM_API_KEY || ''),
      'process.env.VITE_LLM_API_KEY': JSON.stringify(env.VITE_LLM_API_KEY || ''),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      // Model names
      'process.env.LLM_MODEL_NAME': JSON.stringify(env.LLM_MODEL_NAME || ''),
      'process.env.VITE_LLM_MODEL_NAME': JSON.stringify(env.VITE_LLM_MODEL_NAME || ''),
      'process.env.LLM_TTS_MODEL_NAME': JSON.stringify(env.LLM_TTS_MODEL_NAME || ''),
      'process.env.VITE_LLM_TTS_MODEL_NAME': JSON.stringify(env.VITE_LLM_TTS_MODEL_NAME || ''),
      // Bot branding (also accessible as import.meta.env.VITE_* but exposed here for consistency)
      'process.env.VITE_BOT_NAME': JSON.stringify(env.VITE_BOT_NAME || ''),
      'process.env.VITE_BOT_TITLE': JSON.stringify(env.VITE_BOT_TITLE || ''),
      'process.env.VITE_BOT_SUBTITLE': JSON.stringify(env.VITE_BOT_SUBTITLE || ''),
    },
  };
});