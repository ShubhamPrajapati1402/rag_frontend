import { BACKEND_BASE_URL } from './chatApi';

export interface VoiceProfile {
  id: string;
  name: string;
  gender: string;
  accent: string;
  tag: string;
}

const BASE_URL = BACKEND_BASE_URL || 'http://localhost:2001';

/**
 * Sanitize markdown, citations, URLs, code blocks, and special characters for natural speech
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return '';
  return text
    // Strip fenced code blocks
    .replace(/`[\w-]*\n[\s\S]*?`/g, ' Code snippet omitted. ')
    .replace(/`[\s\S]*?`/g, ' Code snippet omitted. ')
    // Strip inline code backticks
    .replace(/([^]+)/g, '')
    // Strip footnote & citation indicators like [1], [^1], [1, 2]
    .replace(/\[\^?\d+(?:,\s*\d+)*\]/g, '')
    // Convert markdown links [title](url) to title
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '')
    // Remove raw URLs
    .replace(/https?:\/\/\S+/g, '')
    // Remove headers (# Title)
    .replace(/^\s*#+\s*/gm, '')
    // Remove blockquote markers
    .replace(/^\s*>+\s*/gm, '')
    // Remove bullet points / list markers
    .replace(/^\s*[-*+]\s+/gm, '')
    // Remove bold/italic markdown characters
    .replace(/[*_~]/g, '')
    // Remove horizontal rules
    .replace(/^\s*---+[\s]*$/gm, '')
    // Normalize newlines and whitespace
    .replace(/\n\s*\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const voiceApi = {
  /**
   * Clean text for speech synthesis
   */
  cleanText: cleanTextForSpeech,

  /**
   * Get direct streaming audio URL for server-side Edge-TTS neural speech
   */
  getStreamUrl(text: string, voice = 'en-US-ChristopherNeural', rate = '+0%'): string {
    const cleaned = cleanTextForSpeech(text);
    return (
      BASE_URL +
      '/api/v1/voice/tts?text=' +
      encodeURIComponent(cleaned) +
      '&voice=' +
      encodeURIComponent(voice) +
      '&rate=' +
      encodeURIComponent(rate)
    );
  },

  /**
   * Transcribe an in-memory audio recording to text using Groq Whisper Large v3 Turbo
   */
  async transcribeAudio(audioBlob: Blob, filename = 'speech.webm'): Promise<string> {
    const formData = new FormData();
    formData.append('file', audioBlob, filename);

    const res = await fetch(BASE_URL + '/api/v1/voice/stt', {
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
   * Synthesize text to speech via Edge-TTS backend and return object URL
   */
  async synthesizeSpeech(text: string, voice = 'en-US-ChristopherNeural', rate = '+0%'): Promise<string> {
    const cleaned = cleanTextForSpeech(text);
    const res = await fetch(BASE_URL + '/api/v1/voice/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: cleaned, voice, rate }),
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
      const res = await fetch(BASE_URL + '/api/v1/voice/voices', { credentials: 'omit' });
      if (!res.ok) return [];
      const data = await res.json();
      return data.voices || [];
    } catch {
      return [];
    }
  },
};
