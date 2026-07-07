import type { GameType, GameStatus } from "@/lib/game";

export type QuestionSnapshot = {
  text: string;
  options: string[];
  correctIndex: number;
};

export type DeckQuestion = {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  order: number;
};

export type GameRecord = {
  id: string;
  code: string;
  gameType: GameType;
  status: GameStatus;
  currentQuestionIndex: number;
  questionStartedAt?: number | null;
  progress: number;
  lives: number;
  questionTimeSeconds: number;
  questionsSnapshot: QuestionSnapshot[];
  createdAt: number;
  host?: { id: string } | null;
};

export type PlayerRecord = {
  id: string;
  nickname: string;
  joinedAt: number;
  user?: { id: string } | null;
};

export type AnswerRecord = {
  id: string;
  questionIndex: number;
  choiceIndex: number;
  isCorrect: boolean;
  answeredAt: number;
  player?: { id: string; nickname: string } | null;
};
