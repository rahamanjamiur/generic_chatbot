
import { useState, useCallback, useRef } from 'react';

const decode = (base64: string): Uint8Array => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
): Promise<AudioBuffer> {
  const sampleRate = 24000;
  const numChannels = 1;
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

interface AudioQueueItem {
  audioData: string;
  messageId: number | null;
}

interface ActiveSourceItem {
  source: AudioBufferSourceNode;
  messageId: number | null;
}

export const useTextToSpeech = (onPlayingIdChange: (id: number | null) => void) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioQueueRef = useRef<AudioQueueItem[]>([]);
    const sourcesRef = useRef<ActiveSourceItem[]>([]);
    const isPlayingRef = useRef(false);
    const isProcessingQueue = useRef(false);
    const currentPlayingMessageIdRef = useRef<number | null>(null);
    const nextStartTimeRef = useRef(0);

    const init = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume().catch(e => console.error("Audio resume failed", e));
        }
    }, []);

    const stop = useCallback(() => {
        audioQueueRef.current = [];
        sourcesRef.current.forEach(({ source }) => {
            source.onended = null; // Prevent onended from firing after manual stop
            try {
                source.stop();
            } catch (e) {
                // Source may have already stopped naturally.
            }
            source.disconnect();
        });
        sourcesRef.current = [];
        isPlayingRef.current = false;
        setIsPlaying(false);
        isProcessingQueue.current = false; // Allow new processing to start
        nextStartTimeRef.current = 0;
        if (currentPlayingMessageIdRef.current !== null) {
            onPlayingIdChange(null);
            currentPlayingMessageIdRef.current = null;
        }
    }, [onPlayingIdChange]);

    const processQueue = useCallback(async () => {
        if (isProcessingQueue.current || audioQueueRef.current.length === 0) {
            return;
        }

        isProcessingQueue.current = true;
        
        if (!isPlayingRef.current) {
            isPlayingRef.current = true;
            setIsPlaying(true);
            // Prime the timeline, adding a small buffer to avoid scheduling in the past
            nextStartTimeRef.current = (audioContextRef.current?.currentTime ?? 0) + 0.1;
        }
        
        while (audioQueueRef.current.length > 0) {
            const item = audioQueueRef.current.shift();
            if (!item || !audioContextRef.current) continue;
            
            try {
                if (audioContextRef.current.state === 'suspended') {
                    await audioContextRef.current.resume();
                }

                const audioData = decode(item.audioData);
                const audioBuffer = await decodeAudioData(audioData, audioContextRef.current);
                
                // CRITICAL CHECK: If stopped while decoding, do not schedule playback.
                if (!isPlayingRef.current) {
                    break;
                }

                const source = audioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContextRef.current.destination);

                // This is the core logic: schedule chunks sequentially on the timeline
                source.start(nextStartTimeRef.current);
                const scheduledEndTime = nextStartTimeRef.current + audioBuffer.duration;
                nextStartTimeRef.current = scheduledEndTime;

                const activeSource: ActiveSourceItem = { source, messageId: item.messageId };
                sourcesRef.current.push(activeSource);

                source.onended = () => {
                    sourcesRef.current = sourcesRef.current.filter(s => s.source !== source);

                    // Check if this was the last source for the messageId
                    const hasMoreForThisId = sourcesRef.current.some(s => s.messageId === item.messageId);
                    if (!hasMoreForThisId && currentPlayingMessageIdRef.current === item.messageId) {
                         onPlayingIdChange(null);
                         currentPlayingMessageIdRef.current = null;
                    }

                    // If all sources are finished, reset state
                    if (sourcesRef.current.length === 0) {
                        isPlayingRef.current = false;
                        setIsPlaying(false);
                        nextStartTimeRef.current = 0;
                    }
                };

                // Update UI to show which message is playing
                if (item.messageId !== null && currentPlayingMessageIdRef.current !== item.messageId) {
                    onPlayingIdChange(item.messageId);
                    currentPlayingMessageIdRef.current = item.messageId;
                }
            } catch (error) {
                console.error("Failed to decode or schedule audio:", error);
            }
        }
        
        isProcessingQueue.current = false;
    }, [onPlayingIdChange]);

    const addToQueue = useCallback((base64Audio: string | null, messageId: number | null = null) => {
        if (!audioContextRef.current) {
            audioContextRef.current = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        if (!base64Audio) return;

        const isNewMessageRequest = messageId !== null && currentPlayingMessageIdRef.current !== messageId && isPlayingRef.current;

        if (isNewMessageRequest) {
            stop();
        }

        audioQueueRef.current.push({ audioData: base64Audio, messageId });
        processQueue();
    }, [processQueue, stop]);

    return { addToQueue, stop, isPlaying, init };
};
