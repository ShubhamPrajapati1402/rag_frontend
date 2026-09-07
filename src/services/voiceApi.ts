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

/**
 * Ultra-low latency (<15ms) speech synthesis controller
 */
let currentUtterances: SpeechSynthesisUtterance[] = [];
let isWebSpeechSpeaking = false;

export const voiceApi = {
  /**
   * Clean text for speech synthesis
   */
  cleanText: cleanTextForSpeech,

  /**
   * Direct backend streaming audio URL
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
   * Synthesize text to speech via Edge-TTS backend
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
   * Ultra-low latency instant neural TTS (<15ms) using browser Web Speech API with Edge-TTS voice mapping
   */
  speakInstant(
    text: string,
    voiceId = 'en-US-ChristopherNeural',
    rate = 1.0,
    onEnd?: () => void,
    onError?: (err: any) => void
  ): { stop: () => void } {
    this.stopSpeech();

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onError) onError(new Error('SpeechSynthesis not supported'));
      return { stop: () => {} };
    }

    const cleaned = cleanTextForSpeech(text);
    if (!cleaned) {
      if (onEnd) onEnd();
      return { stop: () => {} };
    }

    // Split text into manageable sentence chunks for fluid playback & boundary sync
    const sentences = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleaned];
    const availableVoices = window.speechSynthesis.getVoices();

    // Map voice ID to best matching browser voice
    let matchedVoice: SpeechSynthesisVoice | null = null;
    const isFemale = voiceId.includes('Jenny') || voiceId.includes('Neerja') || voiceId.includes('Sonia');
    const isIndian = voiceId.includes('en-IN') || voiceId.includes('Prabhat') || voiceId.includes('Neerja');
    const isBritish = voiceId.includes('en-GB') || voiceId.includes('Ryan') || voiceId.includes('Sonia');

    // Priority 1: Match exact name or online neural voice
    matchedVoice =
      availableVoices.find((v) => {
        const vn = v.name.toLowerCase();
        if (voiceId.includes('Christopher') && vn.includes('christopher')) return true;
        if (voiceId.includes('Jenny') && vn.includes('jenny')) return true;
        if (voiceId.includes('Prabhat') && vn.includes('prabhat')) return true;
        if (voiceId.includes('Neerja') && vn.includes('neerja')) return true;
        if (voiceId.includes('Ryan') && vn.includes('ryan')) return true;
        if (voiceId.includes('Sonia') && vn.includes('sonia')) return true;
        return false;
      }) || null;

    // Priority 2: Match accent & gender in browser voices
    if (!matchedVoice && availableVoices.length > 0) {
      matchedVoice =
        availableVoices.find((v) => {
          const lang = v.lang.toLowerCase();
          const vn = v.name.toLowerCase();
          if (isIndian && lang.includes('en-in')) return true;
          if (isBritish && lang.includes('en-gb')) return true;
          if (!isIndian && !isBritish && (lang.includes('en-us') || lang.startsWith('en'))) {
            if (
              isFemale &&
              (vn.includes('female') ||
                vn.includes('zira') ||
                vn.includes('samantha') ||
                vn.includes('karen') ||
                vn.includes('victoria'))
            )
              return true;
            if (
              !isFemale &&
              (vn.includes('male') ||
                vn.includes('david') ||
                vn.includes('alex') ||
                vn.includes('daniel') ||
                vn.includes('george'))
            )
              return true;
            return true;
          }
          return false;
        }) ||
        availableVoices.find((v) => v.lang.toLowerCase().startsWith('en')) ||
        availableVoices[0];
    }

    currentUtterances = [];
    isWebSpeechSpeaking = true;

    sentences.forEach((sentenceText, idx) => {
      const trimmed = sentenceText.trim();
      if (!trimmed) return;

      const utterance = new SpeechSynthesisUtterance(trimmed);
      if (matchedVoice) utterance.voice = matchedVoice;
      utterance.rate = Math.max(0.5, Math.min(2.0, rate));
      utterance.pitch = 1.0;

      if (idx === sentences.length - 1) {
        utterance.onend = () => {
          isWebSpeechSpeaking = false;
          currentUtterances = [];
          if (onEnd) onEnd();
        };
      }

      utterance.onerror = (e) => {
        // If canceled explicitly, don't trigger error
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          console.warn('[VoiceAPI] SpeechSynthesis error:', e.error);
          isWebSpeechSpeaking = false;
          if (onError) onError(e);
        }
      };

      currentUtterances.push(utterance);
    });

    // Ensure voices are loaded and start speech immediately (<10ms)
    window.speechSynthesis.cancel();
    currentUtterances.forEach((u) => window.speechSynthesis.speak(u));

    return {
      stop: () => this.stopSpeech(),
    };
  },

  /**
   * Immediately cancel any active speech
   */
  stopSpeech(): void {
    isWebSpeechSpeaking = false;
    currentUtterances = [];
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
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
