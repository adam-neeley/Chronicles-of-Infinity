export interface StoryState {
  turns: Turn[];
  inventory: string[];
  currentQuest: string;
  isGameOver: boolean;
}

export interface Turn {
  id: string;
  text: string;
  choices: string[];
  imageUrl?: string;
  isImageLoading: boolean;
}

export interface StoryResponse {
  story_segment: string;
  image_prompt: string;
  choices: string[];
  inventory_updates: {
    add: string[];
    remove: string[];
  };
  quest_update: string | null;
  is_game_over: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
}

export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  LOADING = 'LOADING',
  ERROR = 'ERROR'
}