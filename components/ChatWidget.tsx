
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getGroundedResponseStream, getTextToSpeech, getWelcomeMessageTTS, getErrorMessageTTS } from '../services/geminiService';
import type { ChatMessage } from '../types';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { BotIcon, CloseIcon, MicrophoneIcon, SendIcon, StopCircleIcon, VolumeUpIcon, SpinnerIcon } from './icons';
import {
  saveAudioToPersistentCache,
  getAudioFromPersistentCache,
  ERROR_MESSAGE_CACHE_KEY,
} from '../utils/audioCache';
import { WELCOME_MESSAGE_CONTENT, ERROR_MESSAGE_CONTENT, BRAND_GRADIENT, BOT_TITLE, BOT_SUBTITLE } from '../config';

const WELCOME_MESSAGE_ID = 0;

const renderMessageContent = (text: string) => {
  const markdownRegex = /(!?)\[([^\]]*)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = markdownRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const isImage = match[1] === '!';
    const altOrText = match[2];
    const url = match[3];

    if (isImage) {
      parts.push(
        <img
          key={match.index}
          src={url}
          alt={altOrText || "icon"}
          className="inline-block w-5 h-5 align-middle"
          referrerPolicy="no-referrer"
        />
      );
    } else {
      parts.push(
        <a
          key={match.index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#24c8d1] font-semibold hover:underline"
        >
          {altOrText}
        </a>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [language, setLanguage] = useState('en-US'); // 'en-US' or 'ms-MY'
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: WELCOME_MESSAGE_ID,
    role: 'model',
    content: WELCOME_MESSAGE_CONTENT,
    sources: [],
    audioData: null,
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<number | null>(null);
  const [audioLoadingMessageId, setAudioLoadingMessageId] = useState<number | null>(null);
  const [audioPlaybackError, setAudioPlaybackError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastInputWasVoice = useRef(false);
  const prevIsListening = useRef(false);
  const welcomeAudioFetchedRef = useRef(false);
  const currentModelResponseRef = useRef('');

  // Promise chain reference to enforce sequential TTS generation
  const ttsGenerationChain = useRef<Promise<void>>(Promise.resolve());

  const { isListening, transcript, startListening, stopListening, hasRecognitionSupport } = useSpeechRecognition(language);

  const handleTTSPlayingIdChange = useCallback((id: number | null) => {
    setPlayingMessageId(id);
  }, []);
  const { addToQueue, stop: stopTTS, init: initTTS } = useTextToSpeech(handleTTSPlayingIdChange);


  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [messages, isLoading, isOpen, scrollToBottom]);

  // Pre-load welcome message audio AND error message audio from IndexedDB (or fetch + cache them)
  useEffect(() => {
    if (!isOpen || welcomeAudioFetchedRef.current) {
      return;
    }
    welcomeAudioFetchedRef.current = true;

    // 1. Welcome message audio
    getAudioFromPersistentCache(WELCOME_MESSAGE_ID).then(cached => {
      if (cached) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === WELCOME_MESSAGE_ID ? { ...msg, audioData: cached } : msg
          )
        );
      } else {
        console.log('Pre-fetching and caching welcome message audio...');
        getWelcomeMessageTTS()
          .then(generatedAudioData => {
            if (generatedAudioData) {
              saveAudioToPersistentCache(WELCOME_MESSAGE_ID, generatedAudioData);
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === WELCOME_MESSAGE_ID ? { ...msg, audioData: generatedAudioData } : msg
                )
              );
            }
          })
          .catch(error => {
            console.error('Error pre-fetching welcome message audio:', error);
            setAudioPlaybackError('Failed to pre-load welcome audio. Please try refreshing.');
          });
      }
    });

    // 2. Error message audio — silently pre-cache so it's available offline/when TTS fails
    getAudioFromPersistentCache(ERROR_MESSAGE_CACHE_KEY).then(cached => {
      if (!cached) {
        console.log('Pre-fetching and caching error fallback audio...');
        getErrorMessageTTS()
          .then(audioData => {
            if (audioData) {
              saveAudioToPersistentCache(ERROR_MESSAGE_CACHE_KEY, audioData);
            }
          })
          .catch(err => console.warn('Could not pre-cache error audio:', err));
      }
    });
  }, [isOpen]);

  const handleCloseChat = useCallback(() => {
    stopTTS();
    lastInputWasVoice.current = false;
    setIsOpen(false);
    if (window.parent) {
      window.parent.postMessage('close-chat-widget', '*');
      window.parent.postMessage('close-c-siti', '*');
    }
  }, [stopTTS]);


  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();

    // If e exists, it's a manual submission (keyboard/button), so disable auto-voice.
    // Otherwise, it's a voice submission (e is undefined).
    if (e) {
      lastInputWasVoice.current = false;
    } else {
      lastInputWasVoice.current = true;
    }

    if (!input.trim() || isLoading) return;

    const userMessageContent = input.trim();
    const userMessage: ChatMessage = { role: 'user', content: userMessageContent, id: Date.now() };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    stopTTS();
    setAudioLoadingMessageId(null);
    setAudioPlaybackError(null);

    const modelMessageId = Date.now() + 1;
    currentModelResponseRef.current = '';
    let sentenceBuffer = '';

    // Reset the promise chain for the new message
    ttsGenerationChain.current = Promise.resolve();

    const modelMessage: ChatMessage = {
      role: 'model',
      content: '',
      id: modelMessageId,
      sources: [],
      audioData: null,
    };
    setMessages(prev => [...prev, modelMessage]);

    // Pre-check cache for this message (highly unlikely for new messages, but harmless)
    getAudioFromPersistentCache(modelMessageId).then(cached => {
      if (cached) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === modelMessageId ? { ...msg, audioData: cached } : msg
          )
        );
      }
    });

    try {
      const stream = getGroundedResponseStream(userMessageContent, language);

      for await (const chunk of stream) {
        if (chunk.text) {
          currentModelResponseRef.current += chunk.text;
          setMessages(prev => prev.map(msg =>
            msg.id === modelMessageId ? { ...msg, content: currentModelResponseRef.current } : msg
          ));

          if (lastInputWasVoice.current) {
            sentenceBuffer += chunk.text;
            // Use regex to split by punctuation marks followed by space or end of string
            const sentenceEndRegex = /([.!?]+)(?=\s|$)/g;
            let match;
            let lastIndex = 0;
            const sentencesToProcess: string[] = [];

            // Find all sentences in the buffer
            while ((match = sentenceEndRegex.exec(sentenceBuffer)) !== null) {
              const end = match.index + match[0].length;
              const sentence = sentenceBuffer.substring(lastIndex, end).trim();
              if (sentence) {
                sentencesToProcess.push(sentence);
              }
              lastIndex = end;
            }

            // Keep only the incomplete part in the buffer
            sentenceBuffer = sentenceBuffer.substring(lastIndex);

            // Process sentences SEQUENTIALLY using the promise chain.
            // This guarantees that Audio A is fetched and queued before Audio B,
            // regardless of network speed differences or partial chunks.
            if (sentencesToProcess.length > 0) {
              for (const sentence of sentencesToProcess) {
                ttsGenerationChain.current = ttsGenerationChain.current.then(async () => {
                  // Double check flag inside the chain in case user closed/stopped in the meantime
                  if (!lastInputWasVoice.current) return;
                  try {
                    const audioData = await getTextToSpeech(sentence, language);
                    // Triple check flag before playing, as the await above takes time
                    if (audioData && lastInputWasVoice.current) {
                      addToQueue(audioData, modelMessageId);
                    }
                  } catch (e) {
                    console.error('Error generating TTS for sentence:', sentence, e);
                  }
                });
              }
            }
          }
        }

        if (chunk.sources && chunk.sources.length > 0) {
          setMessages(prev => prev.map(msg =>
            msg.id === modelMessageId ? { ...msg, sources: (msg.sources || []).concat(chunk.sources!) } : msg
          ));
        }
      }

      // Handle any remaining text in the buffer after the stream ends
      if (lastInputWasVoice.current && sentenceBuffer.trim()) {
        ttsGenerationChain.current = ttsGenerationChain.current.then(async () => {
          if (!lastInputWasVoice.current) return;
          try {
            const finalChunkAudio = await getTextToSpeech(sentenceBuffer.trim(), language);
            if (finalChunkAudio && lastInputWasVoice.current) {
              addToQueue(finalChunkAudio, modelMessageId);
            }
          } catch (e) {
            console.error('Error generating TTS for final sentence chunk:', e);
          }
        });
      }

      // Proactively fetch full audio for caching (does not interfere with streaming playback)
      const finalContent = currentModelResponseRef.current;
      if (finalContent.trim()) {
        getAudioFromPersistentCache(modelMessageId).then(cached => {
          if (!cached) {
            // We don't add this to the ttsGenerationChain to strictly separate "live streaming" from "caching"
            getTextToSpeech(finalContent.trim(), language)
              .then(fullMessageAudioData => {
                if (fullMessageAudioData) {
                  saveAudioToPersistentCache(modelMessageId, fullMessageAudioData);
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === modelMessageId ? { ...msg, audioData: fullMessageAudioData } : msg
                    )
                  );
                }
              })
              .catch(error => {
                console.error('Error during proactive audio caching:', error);
              });
          }
        });
      }

    } catch (error) {
      console.error('Failed to get response:', error);
      // Update the message text to the error message
      setMessages(prev => prev.map(msg =>
        msg.id === modelMessageId ? { ...msg, content: ERROR_MESSAGE_CONTENT } : msg
      ));

      // Play error audio from IndexedDB cache (pre-cached on startup)
      getAudioFromPersistentCache(ERROR_MESSAGE_CACHE_KEY).then(errorAudio => {
        if (errorAudio) {
          addToQueue(errorAudio, modelMessageId);
          // Also store in the message so the play button works later
          setMessages(prev => prev.map(msg =>
            msg.id === modelMessageId ? { ...msg, audioData: errorAudio } : msg
          ));
        }
      });
    } finally {
      setIsLoading(false);
      // Do NOT reset lastInputWasVoice.current here.
      // We need it to remain true so the async TTS chain can finish queueing and playing audio for the full response.
      // It will be reset to false when the user initiates a manual Stop, Close, or sends a text message.
    }
  }, [input, isLoading, stopTTS, addToQueue, language]);

  const handleVoiceClick = () => {
    if (isListening) {
      stopListening();
    } else {
      stopTTS();
      setAudioLoadingMessageId(null);
      setAudioPlaybackError(null);
      // Initialize audio context on user interaction to allow auto-play later
      initTTS();
      startListening();
    }
  };

  useEffect(() => {
    if (prevIsListening.current && !isListening && transcript.trim()) {
      // lastInputWasVoice flag is set inside handleSubmit when called without event
      handleSubmit();
    }
    prevIsListening.current = isListening;
  }, [isListening, transcript, handleSubmit]);

  const handlePlayAudio = async (message: ChatMessage) => {
    setAudioPlaybackError(null);
    // CRITICAL: If user interacts manually, stop the "auto" flow immediately.
    lastInputWasVoice.current = false;

    if (audioLoadingMessageId) return;

    if (playingMessageId === message.id) {
      stopTTS();
    } else {
      stopTTS();

      // Check in-memory message state first, then fall back to IndexedDB
      let audioDataToPlay = message.audioData ?? await getAudioFromPersistentCache(message.id);

      if (audioDataToPlay) {
        if (!message.audioData) {
          setMessages(prev => prev.map(m => m.id === message.id ? { ...m, audioData: audioDataToPlay } : m));
        }
        addToQueue(audioDataToPlay, message.id);
      } else {
        setAudioLoadingMessageId(message.id);
        try {
          let generatedAudioData: string | null;
          if (message.id === WELCOME_MESSAGE_ID) {
            generatedAudioData = await getWelcomeMessageTTS();
          } else {
            generatedAudioData = await getTextToSpeech(message.content, language);
          }

          if (generatedAudioData) {
            saveAudioToPersistentCache(message.id, generatedAudioData);
            setMessages(prev => prev.map(m => m.id === message.id ? { ...m, audioData: generatedAudioData } : m));
            addToQueue(generatedAudioData, message.id);
          } else {
            throw new Error('Text-to-speech generation failed to return audio data.');
          }
        } catch (error) {
          console.error('Error fetching audio for TTS:', error);
          setAudioPlaybackError('Failed to play audio for this message. Please try again.');
        } finally {
          setAudioLoadingMessageId(null);
        }
      }
    }
  };

  const placeholderText = language === 'en-US' ? "Ask a question..." : "Tanya soalan...";
  const listeningText = language === 'en-US' ? "Listening..." : "Mendengar...";

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen && (
        <div className="w-[90vw] max-w-md h-[85vh] max-h-[700px] bg-white rounded-2xl shadow-2xl flex flex-col">
          <header className="text-white p-4 rounded-t-2xl flex justify-between items-center shadow-md flex-shrink-0" style={{ background: BRAND_GRADIENT }}>
            <div>
              <h2 className="text-xl font-bold">{BOT_TITLE}</h2>
              <p className="text-xs text-white">{BOT_SUBTITLE}</p>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="relative flex items-center rounded-full bg-[#1d9fa7] p-0.5"
                role="group"
                aria-label="Language selector"
              >
                <button
                  onClick={() => setLanguage('en-US')}
                  className={`relative z-10 px-3 py-1 text-sm rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#51d7e0]
                      ${language === 'en-US' ? 'bg-white text-[#24c8d1] shadow-sm' : 'text-white'}`}
                  aria-pressed={language === 'en-US'}
                  aria-label="Select English"
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage('ms-MY')}
                  className={`relative z-10 px-3 py-1 text-sm rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#51d7e0]
                      ${language === 'ms-MY' ? 'bg-white text-[#24c8d1] shadow-sm' : 'text-white'}`}
                  aria-pressed={language === 'ms-MY'}
                  aria-label="Select Bahasa Melayu"
                >
                  BM
                </button>
              </div>
              <button onClick={handleCloseChat} aria-label="Close chat" className="p-1 rounded-full hover:bg-white/20">
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>
          </header>

          <main className="flex-1 p-4 overflow-y-auto bg-gray-50">
            {audioPlaybackError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{audioPlaybackError}</span>
                <button
                  onClick={() => setAudioPlaybackError(null)}
                  className="absolute top-0 bottom-0 right-0 px-4 py-2"
                  aria-label="Close alert"
                >
                  <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.15a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" /></svg>
                </button>
              </div>
            )}
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'model' && (
                    <div className="w-8 h-8 rounded-full flex-shrink-0 self-start">
                      <BotIcon className="w-full h-full" />
                    </div>
                  )}
                  <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-lime-700 text-white rounded-br-none' : 'bg-gray-200 text-zinc-700 rounded-bl-none'}`}
                    style={msg.role === 'user' ? { backgroundColor: '#24c8d1' } : { color: '#61616a' }}>
                    <p className="whitespace-pre-wrap">{renderMessageContent(msg.content)}</p>
                    {msg.role === 'model' && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-300">
                        <h4 className="text-xs font-semibold mb-1">Sources:</h4>
                        <ul className="space-y-1">
                          {msg.sources.map((source, i) => (
                            <li key={i}>
                              <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-[#24c8d1] hover:underline truncate block">
                                {source.title || 'Untitled Source'}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  {msg.role === 'model' && msg.content && (
                    <button
                      onClick={() => handlePlayAudio(msg)}
                      className="p-1 rounded-full text-gray-500 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[#51d7e0] self-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={
                        audioLoadingMessageId === msg.id ? 'Loading audio' : (playingMessageId === msg.id ? 'Stop audio' : 'Play audio')
                      }
                      disabled={!!audioLoadingMessageId || (isLoading && msg.id === messages[messages.length - 1].id)}
                    >
                      {audioLoadingMessageId === msg.id
                        ? <SpinnerIcon className="w-5 h-5 animate-spin text-[#24c8d1]" />
                        : playingMessageId === msg.id
                          ? <StopCircleIcon className="w-5 h-5 text-[#24c8d1]" />
                          : <VolumeUpIcon className="w-5 h-5" />
                      }
                    </button>
                  )}
                </div>
              ))}
              {isLoading && messages[messages.length - 1].role === 'user' && (
                <div className="flex justify-start items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex-shrink-0 self-start">
                    <BotIcon className="w-full h-full" />
                  </div>
                  <div className="bg-gray-200 text-gray-800 rounded-2xl rounded-bl-none px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-[#4ad2dc] rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-[#4ad2dc] rounded-full animate-pulse [animation-delay:0.2s]"></div>
                      <div className="w-2 h-2 bg-[#4ad2dc] rounded-full animate-pulse [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </main>

          <footer className="p-3 border-t bg-white rounded-b-2xl flex-shrink-0">
            <form onSubmit={handleSubmit} className="flex items-center space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? listeningText : placeholderText}
                className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#51d7e0] transition"
                style={{ '--tw-ring-color': '#51d7e0' } as React.CSSProperties}
                disabled={isLoading}
              />
              {hasRecognitionSupport && (
                <button
                  type="button"
                  onClick={handleVoiceClick}
                  className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-[#24c8d1] text-white hover:bg-[#1f9fa7]'}`}
                  style={!isListening ? { background: BRAND_GRADIENT } : {}}
                  disabled={isLoading}
                >
                  {isListening ? <StopCircleIcon className="w-6 h-6" /> : <MicrophoneIcon className="w-6 h-6" />}
                </button>
              )}
              <button
                type="submit"
                className="p-2 bg-[#24c8d1] text-white rounded-full hover:bg-[#1f9fa7] disabled:bg-gray-300 transition-colors"
                style={{ background: BRAND_GRADIENT }}
                disabled={!input.trim() || isLoading}
              >
                <SendIcon className="w-6 h-6" />
              </button>
            </form>
          </footer>
        </div>
      )}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-[#209097] focus:ring-offset-2 transition-transform transform hover:scale-110"
          aria-label="Open chat"
        >
          <BotIcon className="w-full h-full" />
        </button>
      )}
    </div>
  );
};

export default ChatWidget;
