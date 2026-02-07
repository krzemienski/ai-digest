export interface VoiceConfig {
  speakers: SpeakerVoice[];
  audioFormat: string;
  targetDurationMinutes: number;
}

export interface SpeakerVoice {
  role: string;
  voiceId: string;
  settings: {
    stability: number;
    similarityBoost: number;
    speed: number;
    style: number;
  };
}
