export type AppStep = 'upload' | 'preview' | 'payment' | 'result';

export interface ChatPersona {
  title: string;
  description: string;
  imagePrompt: string;
  imageUrl?: string;
}

export interface SessionAwards {
  longestMessage: { author: string; length: number };
  nightOwl: { author: string; count: number }; // Madrugueiro
  ghost: { author: string; count: number }; // Fantasma
}

export interface SessionStats {
  chatTitle?: string; // Name of the chat/group
  total_messages: number;
  participant_count: number;
  date_range: [string, string];
  top_active_day?: string;
  most_active_hour?: string;
  top_emoji?: string;
  top_words?: Array<{word: string, count: number}>;
  messages_by_author?: Record<string, number>;
  awards?: SessionAwards;
  persona?: ChatPersona;
}

export interface SessionData {
  session_id: string;
  status: 'pending' | 'paid';
  stats: SessionStats;
  created_at: number;
}

export interface PreferenceResponse {
  init_point: string;
  preference_id: string;
}

export interface StatusResponse {
  status: 'pending' | 'paid' | 'expired';
}

export interface FullReportResponse {
  stats: SessionStats;
  timeline_data?: Array<{date: string, count: number}>;
  hourly_heatmap?: Array<{hour: number, count: number}>;
}