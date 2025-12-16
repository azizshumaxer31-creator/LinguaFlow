export interface Language {
  id: string;
  name: string;
  voiceName: string; // Gemini voice name
  flag: string;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  icon: string;
  promptContext: string;
}

export interface TranscriptionItem {
  text: string;
  isUser: boolean;
  timestamp: number;
}

export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}
