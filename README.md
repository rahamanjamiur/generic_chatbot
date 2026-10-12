# Generic Conversational AI Chat Co-Worker Widget

A customizable, model-agnostic conversational AI chat widget for React applications. It features real-time streaming answers, multi-language support (English and Bahasa Melayu), speech-to-text input, and text-to-speech (TTS) audio responses.

---

## 🌟 Key Features

- **Model Agnostic & Configurable**: Easily specify your LLM API Key and Model Name (`LLM_MODEL_NAME`) via `.env` or central configuration (`config.ts`).
- **Real-Time Streaming & Search Grounding**: Interactive streaming responses with search grounding source references.
- **Voice Support (STT & TTS)**: Hands-free speech recognition input and audio response playback with automatic sequential TTS queuing.
- **Dual-Language Switching**: Quick toggle between English (`EN`) and Bahasa Melayu (`BM`).
- **Fully Customizable UI**: Easily customize assistant branding, title, sub-title, logo icon, gradient colors, and welcome messages.

---

## 📋 Prerequisites

- **Node.js**: v18.x or higher (LTS recommended)
- **API Key**: API key for your chosen LLM model provider (e.g. Gemini, OpenAI API key, or custom LLM gateway).

---

## 🚀 Quick Start & Installation

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your API key and model details in `.env`:
   ```env
   # API Key Configuration
   LLM_API_KEY=your_actual_api_key_here

   # Model Selection
   LLM_MODEL_NAME=gemini-3.8-flash
   LLM_TTS_MODEL_NAME=gemini-3.8-flash-tts

   # Optional Bot Branding
   VITE_BOT_NAME="AI Co-Worker"
   VITE_BOT_TITLE="AI Co-Worker"
   VITE_BOT_SUBTITLE="Explore. Ask. Discover."
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

---

## ⚙️ Customization & Configuration

All core placeholders and application settings are centralized in [`config.ts`](file:///Users/jamiur/Downloads/generic_chatbot/config.ts):

| Configuration Variable | Description | Default Placeholder |
| :--- | :--- | :--- |
| `LLM_API_KEY` | API Key for the LLM Provider | Reads from `process.env.LLM_API_KEY` |
| `LLM_MODEL_NAME` | Model ID used for text generation | `gemini-3.8-flash` |
| `LLM_TTS_MODEL_NAME` | Model ID used for Text-to-Speech | `gemini-3.8-flash-tts` |
| `BOT_NAME` | Name of your AI Assistant | `"AI Co-Worker"` |
| `BOT_TITLE` | Header Title in Widget UI | `"AI Co-Worker"` |
| `BOT_SUBTITLE` | Header Subtitle in Widget UI | `"Explore. Ask. Discover."` |
| `WELCOME_MESSAGE_EN` | Default English Welcome Message | `"Hi! I'm your AI Co-Worker..."` |
| `WELCOME_MESSAGE_MS` | Default Malay Welcome Message | `"Hai! Saya Pembantu AI anda..."` |
| `CONTACT_INFO_MARKDOWN` | Custom Markdown block for contact details | `https://example.com` |
| `BRAND_GRADIENT` | CSS Gradient for Header & Buttons | `linear-gradient(135deg, ...)` |

### Customizing the System Prompt

To adjust the instructions given to the LLM model, edit the `getSystemInstruction` function in [`config.ts`](file:///Users/jamiur/Downloads/generic_chatbot/config.ts):

```typescript
export const getSystemInstruction = (selectedLanguage: string): string => {
  // Add your custom system instructions, domain knowledge, or guidelines here.
};
```

---

## 📁 Project Structure

```
├── config.ts              # Central application configuration & model details
├── App.tsx                # Top-level React container
├── components/
│   ├── ChatWidget.tsx     # Main interactive chat widget UI
│   ├── icons.tsx          # SVG icon collection (BotIcon, Mic, Send, etc.)
│   └── chatbot_base64_string.tsx # Base64 image asset fallback
├── services/
│   └── geminiService.ts   # Generic AI model streaming & TTS service layer
├── hooks/
│   ├── useSpeechRecognition.ts # Web Speech API STT hook
│   └── useTextToSpeech.ts     # Audio queue & TTS playback hook
├── utils/
│   └── audioCache.ts      # In-memory & local storage audio cache manager
├── types.ts               # TypeScript interface definitions
├── .env.example           # Environment variables template
├── metadata.json          # Widget metadata settings
└── README.md              # Documentation
```

---

## 🛠️ Build for Production

To compile and build the production bundle:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```