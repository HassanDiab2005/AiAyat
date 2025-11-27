export interface Attachment {
  file: File;
  previewUrl: string;
  type: 'image' | 'audio' | 'pdf' | 'other';
  base64?: string;
}

export type GeminiModelId = 'gemini-3-pro-preview' | 'gemini-2.0-pro-exp-02-05' | 'gemini-2.5-flash' | 'gemini-flash-lite-latest';

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isStreaming?: boolean;
  error?: boolean;
  isHidden?: boolean;
  attachments?: Attachment[];
  modelId?: GeminiModelId; // Track which model generated this
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
  lastModelId?: GeminiModelId;
}

export interface SavedPrompt {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

export interface UserSettings {
  apiKey: string;
  userName: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}