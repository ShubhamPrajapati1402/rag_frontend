import { BACKEND_BASE_URL } from './chatApi';

export interface VoiceProfile {
  id: string;
  name: string;
  gender: string;
  accent: string;
  tag: string;
}

const BASE_URL = BACKEND_BASE_URL || 'http://localhost:2001';

export const voiceApi = {
  /**
   * Get direct streaming audio URL for instant (<100ms) playback via HTML5 <audio>
   */
  getStreamUrl(text: string, voice = 'en-US-ChristopherNeural', rate = '+0%'): string {
    return `${BASE_URL}/api/v1/voice/tts?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(voice)}&rate=${encodeURIComponent(rate)}`;
  },

  /**
   * Transcribe an in-memory audio recording to text using Groq Whisper Large v3 Turbo
   */
  async transcribeAudio(audioBlob: Blob, filename = 'speech.webm'): Promise<string> {
    const formData = new FormData();
    formData.append('file', audioBlob, filename);

    const res = await fetch(`${BASE_URL}/api/v1/voice/stt`, {
      method: 'POST',
      body: formData,
      credentials: 'omit',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to transcribe audio.');
    }

    const data = await res.json();
    return data.text || '';
  },

  /**
   * Synthesize text to speech using Edge-TTS neural voice streaming
   */
  async synthesizeSpeech(text: string, voice = 'en-US-ChristopherNeural', rate = '+0%'): Promise<string> {
    const res = await fetch(`${BASE_URL}/api/v1/voice/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, voice, rate }),
      credentials: 'omit',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to generate voice speech.');
    }

    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },

  /**
   * Fetch list of curated Microsoft neural voices
   */
  async getVoices(): Promise<VoiceProfile[]> {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/voice/voices`, { credentials: 'omit' });
      if (!res.ok) return [];
      const data = await res.json();
      return data.voices || [];
    } catch {
      return [];
    }
  },
};
