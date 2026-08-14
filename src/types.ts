export type RegionId =
  | "africa"
  | "europe"
  | "asia"
  | "middle-east"
  | "americas"
  | "oceania";

export type ModeId = "leaders" | "empires" | "wars" | "timeline";

export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Region {
  id: RegionId;
  name: string;
  eyebrow: string;
  center: [number, number];
  zoom: number;
  availability: Record<ModeId, number>;
  progress: number;
  description: string;
}

export interface HistoricalPerson {
  id: string;
  name: string;
  initials: string;
  country: string;
  region: RegionId;
  birthYear?: number;
  deathYear?: number;
  role: string;
  summary: string;
}

export type QuestionType =
  | "image"
  | "country"
  | "fact"
  | "war"
  | "timeline";

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  region: RegionId;
  mode: ModeId;
  prompt: string;
  imageLabel?: string;
  portraitInitials?: string;
  answers?: string[];
  correctAnswer?: string;
  timelineItems?: string[];
  correctOrder?: string[];
  fact: string;
}

export interface QuizResult {
  score: number;
  total: number;
  bestStreak: number;
  difficulty: Difficulty;
  region: RegionId;
  mode: ModeId;
}

