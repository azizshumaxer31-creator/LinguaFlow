import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../utils/audio';
import { ConnectionState, TranscriptionItem } from '../types';
import { GEMINI_MODEL } from '../constants';

interface UseLiveSessionProps {
  language: string; // The target language name (e.g., "Spanish")
  voiceName: string;
  context: string;
  onTranscriptionUpdate?: (item: TranscriptionItem) => void;
}

export function useLiveSession({ language, voiceName, context, onTranscriptionUpdate }: UseLiveSessionProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [isMicOn, setIsMicOn] = useState(true);
  
  // Audio Contexts and Nodes
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Session Logic
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  
  // Cleanup function
  const cleanup = useCallback(() => {
    // Stop all playing audio
    activeSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) { /* ignore */ }
    });
    activeSourcesRef.current.clear();
    
    // Close audio contexts
    if (inputAudioContextRef.current?.state !== 'closed') {
      inputAudioContextRef.current?.close();
    }
    if (outputAudioContextRef.current?.state !== 'closed') {
      outputAudioContextRef.current?.close();
    }
    
    // Stop microphone stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Close session if possible (though we don't have a direct close method on the promise, 
    // the server will timeout or we can assume strictly closing context handles client side)
    // Actually, session object has close()
    sessionPromiseRef.current?.then(session => {
        try { session.close(); } catch(e) {}
    });

    setConnectionState(ConnectionState.DISCONNECTED);
    nextStartTimeRef.current = 0;
  }, []);

  const connect = useCallback(async () => {
    if (!process.env.API_KEY) {
      console.error("API Key not found");
      setConnectionState(ConnectionState.ERROR);
      return;
    }

    try {
      setConnectionState(ConnectionState.CONNECTING);

      // Initialize Audio Contexts
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      inputAudioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;
      
      const outputGain = outputCtx.createGain();
      outputNodeRef.current = outputGain;
      outputGain.connect(outputCtx.destination);

      // Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const config = {
        model: GEMINI_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } },
          },
          systemInstruction: {
            parts: [
              {
                text: `You are a helpful language tutor helping the user practice ${language}. 
                  Context: ${context}. 
                  Keep your responses concise, natural, and encouraging. 
                  Speak primarily in ${language}, but you can use English for complex explanations if needed.
                  If the user makes a mistake, gently correct them.`
              }
            ]
          },
          // Fixed: Empty objects to enable transcription, removing incorrect 'model' field
          inputAudioTranscription: {}, 
          outputAudioTranscription: {}, 
        },
      };

      const sessionPromise = ai.live.connect({
        ...config,
        callbacks: {
          onopen: () => {
            setConnectionState(ConnectionState.CONNECTED);
            
            // Setup Input Processing
            const source = inputCtx.createMediaStreamSource(stream);
            inputSourceRef.current = source;
            
            // Use ScriptProcessor for raw PCM access (AudioWorklet is better but requires external file)
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;
            
            processor.onaudioprocess = (e) => {
              // Only send if mic is logically on
              // Note: We can't easily access the latest 'isMicOn' state inside this callback 
              // without a ref or closure. Relying on stream track enabled state is better.
              
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              
              sessionPromise.then(session => {
                 session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Transcriptions
            const outputText = message.serverContent?.outputTranscription?.text;
            const inputText = message.serverContent?.inputTranscription?.text;
            
            if (outputText && onTranscriptionUpdate) {
               onTranscriptionUpdate({ text: outputText, isUser: false, timestamp: Date.now() });
            }
            if (inputText && onTranscriptionUpdate) {
               onTranscriptionUpdate({ text: inputText, isUser: true, timestamp: Date.now() });
            }

            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            
            if (base64Audio) {
              const ctx = outputAudioContextRef.current;
              if (!ctx) return;

              // Ensure playback scheduling is smooth
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioData = base64ToUint8Array(base64Audio);
              const audioBuffer = await decodeAudioData(audioData, ctx, 24000, 1);
              
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNodeRef.current!);
              
              source.addEventListener('ended', () => {
                activeSourcesRef.current.delete(source);
              });
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              activeSourcesRef.current.add(source);
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
              activeSourcesRef.current.forEach(src => {
                 try { src.stop(); } catch(e) {}
              });
              activeSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            console.log("Session closed");
            setConnectionState(ConnectionState.DISCONNECTED);
          },
          onerror: (err) => {
            console.error("Session error", err);
            setConnectionState(ConnectionState.ERROR);
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (error) {
      console.error("Failed to connect", error);
      setConnectionState(ConnectionState.ERROR);
      cleanup();
    }
  }, [language, voiceName, context, onTranscriptionUpdate, cleanup]);

  const disconnect = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const toggleMic = useCallback(() => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !isMicOn;
      });
      setIsMicOn(!isMicOn);
    }
  }, [isMicOn]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    connectionState,
    connect,
    disconnect,
    isMicOn,
    toggleMic
  };
}
