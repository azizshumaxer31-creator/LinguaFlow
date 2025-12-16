import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Phone, PhoneOff, Settings, MessageSquare, AudioWaveform } from 'lucide-react';
import { ConnectionState, Language, Scenario, TranscriptionItem } from './types';
import { LANGUAGES, SCENARIOS } from './constants';
import { useLiveSession } from './hooks/useLiveSession';
import Visualizer from './components/Visualizer';
import LanguageSelector from './components/LanguageSelector';
import ScenarioSelector from './components/ScenarioSelector';

const App: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(LANGUAGES[0]);
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(SCENARIOS[0]);
  const [transcripts, setTranscripts] = useState<TranscriptionItem[]>([]);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  
  // Flag to manage immediate updates for partial transcriptions if needed
  // For now, we append to list on updates. A better approach might be to track "current turn"
  // but strictly appending works for a basic log.
  
  const handleTranscriptionUpdate = (item: TranscriptionItem) => {
    // In a real production app, we would debounce or merge streaming text updates.
    // Here we just append for simplicity, or update the last one if it's the same side.
    setTranscripts(prev => {
      const last = prev[prev.length - 1];
      // Simple logic: if the last item is from same speaker and very recent (< 2 sec), append text
      // Otherwise new item.
      if (last && last.isUser === item.isUser && (item.timestamp - last.timestamp < 2000)) {
         // This logic is a bit naive for streaming "delta" updates, 
         // but Live API often sends full segments or chunks. 
         // For a polish, let's just keep adding them as new bubbles for now unless it's very spammy.
         // Actually, let's just return [...prev, item] but maybe debounced in the hook?
         // Let's rely on the hook sending valid chunks.
         return [...prev, item];
      }
      return [...prev, item];
    });
  };

  const {
    connectionState,
    connect,
    disconnect,
    isMicOn,
    toggleMic
  } = useLiveSession({
    language: selectedLanguage.name,
    voiceName: selectedLanguage.voiceName,
    context: selectedScenario.promptContext,
    onTranscriptionUpdate: handleTranscriptionUpdate
  });

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcripts]);

  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="p-6 border-b border-slate-800/60 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg shadow-blue-500/20">
              <AudioWaveform className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              LinguaFlow Live
            </h1>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 text-xs font-mono text-slate-400">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
            {connectionState}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 flex flex-col lg:flex-row gap-6">
        
        {/* Left Panel: Controls / Settings */}
        <div className={`flex-1 flex flex-col gap-8 transition-all duration-500 ${isConnected ? 'lg:flex-[0.4]' : 'lg:flex-1'}`}>
          
          {/* Welcome / Status */}
          <div className="space-y-2">
            <h2 className="text-3xl font-light text-white">
              {isConnected ? 'Practice Session' : 'Start a Conversation'}
            </h2>
            <p className="text-slate-400">
              {isConnected 
                ? `Speaking ${selectedLanguage.name} about "${selectedScenario.title}"`
                : 'Select a language and scenario to begin your AI-powered practice session.'
              }
            </p>
          </div>

          {/* Configuration (Disabled when connected) */}
          <div className={`space-y-8 transition-opacity duration-300 ${isConnected ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
            <section className="space-y-3">
              <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4" /> Target Language
              </label>
              <LanguageSelector 
                selected={selectedLanguage} 
                onSelect={setSelectedLanguage} 
                disabled={isConnected}
              />
            </section>

            <section className="space-y-3">
              <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Scenario
              </label>
              <ScenarioSelector 
                selected={selectedScenario} 
                onSelect={setSelectedScenario} 
                disabled={isConnected}
              />
            </section>
          </div>
        </div>

        {/* Right Panel: Active Session */}
        {/* We keep this visible but expanded when connected */}
        <div className={`
          flex-1 bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl transition-all duration-500
          ${isConnected ? 'lg:flex-[0.6] ring-1 ring-blue-500/30' : 'lg:flex-[0.4] opacity-80 scale-95 grayscale'}
        `}>
          
          {/* Visualizer Area */}
          <div className="relative flex-1 min-h-[300px] flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-900/50">
            <Visualizer isActive={isConnected} color={isConnected ? "#3B82F6" : "#64748B"} />
            
            {/* Overlay Status */}
            {!isConnected && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm z-10">
                <button
                  onClick={connect}
                  disabled={isConnecting}
                  className="group relative px-8 py-4 bg-white text-slate-950 rounded-full font-bold text-lg shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:scale-105 hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] transition-all flex items-center gap-3"
                >
                  {isConnecting ? (
                    <>Connecting...</>
                  ) : (
                    <>
                      <Phone className="w-5 h-5" /> Start Call
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Transcript Area (Only visible when connected) */}
          {isConnected && (
            <div className="h-48 border-t border-slate-800 bg-slate-950/30 p-4 overflow-y-auto scrollbar-hide space-y-3">
              {transcripts.length === 0 && (
                <div className="text-center text-slate-600 text-sm italic mt-4">
                  Listening... Start speaking to see transcription.
                </div>
              )}
              {transcripts.map((t, i) => (
                <div key={i} className={`flex ${t.isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`
                    max-w-[85%] rounded-2xl px-4 py-2 text-sm
                    ${t.isUser 
                      ? 'bg-blue-600/20 text-blue-100 rounded-br-none border border-blue-500/20' 
                      : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                    }
                  `}>
                    {t.text}
                  </div>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          )}

          {/* Controls Bar */}
          <div className="p-6 bg-slate-900 border-t border-slate-800 flex justify-center items-center gap-6">
             <button
                onClick={toggleMic}
                disabled={!isConnected}
                className={`
                  p-4 rounded-full transition-all duration-200
                  ${!isConnected ? 'opacity-30' : ''}
                  ${isMicOn 
                    ? 'bg-slate-800 text-white hover:bg-slate-700' 
                    : 'bg-red-500/20 text-red-400 ring-1 ring-red-500/50 hover:bg-red-500/30'
                  }
                `}
              >
                {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </button>

              <button
                onClick={disconnect}
                disabled={!isConnected}
                className={`
                  p-4 rounded-full bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all hover:scale-105
                  ${!isConnected ? 'opacity-30 cursor-not-allowed' : ''}
                `}
              >
                <PhoneOff className="w-6 h-6" />
              </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
