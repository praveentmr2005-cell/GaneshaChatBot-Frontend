export interface GaneshResponse {
  lang: string;
  blessing_open: string;
  answer: string;
  blessing_close: string;
  refusal: boolean;
  refusal_reason?: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'ganesh';
  content: string;
  timestamp: Date;
  ganeshResponse?: GaneshResponse;
  isVoice?: boolean;
  audioUrl?: string;
}

export interface TranscribeResponse {
  id: string;
  transcription: string;
  ganesha_response: GaneshResponse;
  audio_url?: string;
}