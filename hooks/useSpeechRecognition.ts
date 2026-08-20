
import { useState, useEffect, useRef } from 'react';
import { SPEECH_RECOGNITION_KEYWORDS } from '../config';

// Define interfaces for the Web Speech API to provide type safety.
// These interfaces model the structure of the API objects as they are used in this hook.
interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  grammars?: ISpeechGrammarList; // Added grammars property
  start: () => void;
  stop: () => void;
  onresult: (event: ISpeechRecognitionEvent) => void;
  onerror: (event: ISpeechRecognitionErrorEvent) => void;
  onend: (event: Event) => void; // onend event does not typically have specific properties, so Event is sufficient
}

interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
    length: number;
  };
}

interface ISpeechRecognitionErrorEvent {
  error: string;
  message: string; // Add message property to conform to standard ErrorEvent
}

// New interfaces for SpeechGrammarList
interface ISpeechGrammarList extends EventTarget {
  readonly length: number;
  addFromString(string: string, weight?: number): void;
  addFromURI(src: string, weight?: number): void;
  item(index: number): ISpeechGrammar;
}

interface ISpeechGrammar {
  readonly src: string;
  readonly weight: number;
}


// Polyfill for browsers that might not have SpeechRecognition on the window
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const SpeechGrammarList = (window as any).SpeechGrammarList || (window as any).webkitSpeechGrammarList;


const SILENCE_TIMEOUT_MS = 3000; // 3 seconds of silence

export const useSpeechRecognition = (lang: string = 'en-US') => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const silenceTimerRef = useRef<number | null>(null);

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const startSilenceTimer = () => {
    clearSilenceTimer();
    silenceTimerRef.current = window.setTimeout(() => {
      if (recognitionRef.current && isListening) {
        console.log('Silence detected, stopping recognition.');
        recognitionRef.current.stop();
      }
    }, SILENCE_TIMEOUT_MS);
  };

  useEffect(() => {
    if (!SpeechRecognition) {
      console.warn('Speech Recognition API is not supported in this browser.');
      return;
    }
    
    const recognition: ISpeechRecognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    // --- Start of SpeechGrammarList implementation ---
    if (SpeechGrammarList) {
      const keywords = SPEECH_RECOGNITION_KEYWORDS;
      
      const formattedKeywords = keywords.map(k => {
        if (k.includes(' ')) {
          return `"${k}"`;
        }
        return k;
      }).join(' | ');

      const grammar = `#JSGF V1.0; grammar appKeywords; public <app_term> = ${formattedKeywords};`;
      
      const speechRecognitionList: ISpeechGrammarList = new SpeechGrammarList();
      speechRecognitionList.addFromString(grammar, 10); 
      recognition.grammars = speechRecognitionList;
    }
    // --- End of SpeechGrammarList implementation ---

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript + interimTranscript);
      startSilenceTimer(); // Reset timer on any new speech detection
    };

    recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error', event.error, event.message); // Log message for more detail
      setIsListening(false);
      clearSilenceTimer();
    };

    recognition.onend = () => {
      console.log('Recognition ended.');
      setIsListening(false);
      clearSilenceTimer();
    };
    
    recognitionRef.current = recognition;

    return () => {
      // Clean up on component unmount
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      clearSilenceTimer();
    };
  }, [lang]); // Re-initialize if language changes

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
      startSilenceTimer(); // Start timer when listening begins
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop(); // This will trigger onend
      clearSilenceTimer();
    }
  };

  return { isListening, transcript, startListening, stopListening, hasRecognitionSupport: !!SpeechRecognition };
};
