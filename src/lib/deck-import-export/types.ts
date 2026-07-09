import type { AnswerConfig, QuestionType, SettingScope, ShuffleMode } from "@/lib/game";

export type ExportFormat = "squad-games" | "kahoot" | "blooket" | "gimkit";

export type DeckExportQuestion = {
  text: string;
  options: string[];
  correctIndex?: number | null;
  order: number;
  questionType?: QuestionType | null;
  answerConfig?: AnswerConfig | null;
};

export type DeckExportData = {
  title: string;
  description?: string | null;
  answerShuffleMode?: ShuffleMode | string | null;
  questionShuffleMode?: ShuffleMode | string | null;
  answerShuffleScope?: SettingScope | string | null;
  questionShuffleScope?: SettingScope | string | null;
  questionTimeSeconds?: number | null;
  questions: DeckExportQuestion[];
};

export type ImportedQuestion = {
  text: string;
  options: string[];
  correctIndex: number;
  questionType: QuestionType;
  answerConfig?: AnswerConfig | null;
  order: number;
};

export type ImportedDeck = {
  title: string;
  description?: string;
  answerShuffleMode?: ShuffleMode;
  questionShuffleMode?: ShuffleMode;
  answerShuffleScope?: SettingScope;
  questionShuffleScope?: SettingScope;
  questionTimeSeconds?: number;
  questions: ImportedQuestion[];
};

export type ExportPreview = {
  totalQuestions: number;
  exportableCount: number;
  skippedByType: Partial<Record<QuestionType, number>>;
  invalidMcCount: number;
};

export type SquadGamesExportFile = {
  blob: Blob;
  filename: string;
  extension: "json" | "csv";
};

export type ExportFile = {
  blob: Blob;
  filename: string;
};
