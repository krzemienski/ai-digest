/** Voice configuration for podcast episode generation. */
export interface VoiceConfig {
  /** Speaker-to-voice mappings */
  speakers: SpeakerVoice[];
  /** Audio output format (e.g., "mp3_44100_128") */
  audioFormat: string;
  /** Target episode duration in minutes */
  targetDurationMinutes: number;
}

/** ElevenLabs voice configuration for a single speaker. */
export interface SpeakerVoice {
  /** Speaker role identifier (e.g., "host_a", "host_b") */
  role: string;
  /** ElevenLabs voice ID */
  voiceId: string;
  /** Voice tuning parameters */
  settings: {
    /** Voice stability (0-1, higher = more consistent) */
    stability: number;
    /** Similarity boost (0-1, higher = closer to original voice) */
    similarityBoost: number;
    /** Speaking speed multiplier */
    speed: number;
    /** Style exaggeration (0-1) */
    style: number;
  };
}
