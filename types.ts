

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'model';
  content: string;
  sources?: GroundingSource[];
  audioData?: string | null;
}