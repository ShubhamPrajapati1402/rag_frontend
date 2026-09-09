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
  let cleaned = text;

  // Replace markdown code blocks (```python ... ```) with spoken placeholder
  cleaned = cleaned.replace(/```[\s\S]*?```/g, ' Code snippet omitted. ');
  // Strip inline code backticks `code` -> code
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
  // Strip footnote & citation indicators like [1], [^1], [1, 2]
  cleaned = cleaned.replace(/\[\^?\d+(?:,\s*\d+)*\]/g, '');
  // Convert markdown links [title](url) -> title
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  // Remove raw URLs
  cleaned = cleaned.replace(/https?:\/\/\S+/g, '');
  // Remove header hashes (# Title)
  cleaned = cleaned.replace(/^\s*#+\s*/gm, '');
  // Remove blockquote markers (> Quote)
  cleaned = cleaned.replace(/^\s*>+\s*/gm, '');
  // Remove bullet points / list dashes
  cleaned = cleaned.replace(/^\s*[-*+]\s+/gm, '');
  // Remove bold/italic markdown characters
  cleaned = cleaned.replace(/[*_~]/g, '');
  // Remove horizontal rules
  cleaned = cleaned.replace(/^\s*---+[\s]*$/gm, '');
  // Normalize multiple newlines and spaces
  cleaned = cleaned.replace(/\n\s*\n+/g, '. ');
  cleaned = cleaned.replace(/\s+/g, ' ');

  return cleaned.trim();
}

let cachedVoices: VoiceProfile[] | null = null;

export const voiceApi = {
  /**
   * Cleans text for natural speech synthesis
   */
  cleanText(text: string): string {
    return text
      // Strip markdown bold / italics
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      // Strip markdown headers
      .replace(/^#{1,6}\s+/gm, '')
      // Strip code blocks completely
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      // Strip markdown links [label](url) -> label
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Strip citations [1], [2], etc.
      .replace(/\[\d+\]/g, '')
      // Strip HTML tags
      .replace(/<[^>]+>/g, '')
      // Strip bullet characters
      .replace(/^[\s*•-]+\s+/gm, '')
      // Strip horizontal rules
      .replace(/^---+$/gm, '')
      // Normalize excessive whitespace
      .replace(/\n{2,}/g, '. ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  },

  /**
   * STT: Transcribe recorded audio Blob to text
   */
  async transcribeAudio(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    const filename = audioBlob.type.includes('webm') ? 'audio.webm' : 'audio.wav';
    formData.append('audio', audioBlob, filename);

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
   * TTS: Convert text to speech audio URL (blob URL)
   */
  async textToSpeech(text: string, voice?: string, rate?: string): Promise<string> {
    const cleaned = this.cleanText(text);
    if (!cleaned) throw new Error('No text provided to speak.');

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
   * Fetch list of curated Microsoft neural voices (cached)
   */
  async getVoices(): Promise<VoiceProfile[]> {
    if (cachedVoices && cachedVoices.length > 0) {
      return cachedVoices;
    }
    try {
      const res = await fetch(BASE_URL + '/api/v1/voice/voices', { credentials: 'omit' });
      if (!res.ok) return [];
      const data = await res.json();
      cachedVoices = data.voices || [];
      return cachedVoices;
    } catch {
      return [];
    }
  },

  /**
   * Get direct streaming TTS URL for HTMLAudioElement
   */
  getStreamUrl(text: string, voice?: string, rate?: string): string {
    const cleaned = this.cleanText(text);
    const params = new URLSearchParams({ text: cleaned });
    if (voice) params.append('voice', voice);
    if (rate) params.append('rate', rate);
    return `${BASE_URL}/api/v1/voice/stream?${params.toString()}`;
  },
};
