import type {
  AnswerConfig,
  AnswerResponse,
  GameType,
  GameStatus,
  PlayerAnswerInput,
  QuestionType,
  SettingScope,
  ShuffleMode,
} from "@/lib/game";

export type { AnswerConfig, AnswerResponse, PlayerAnswerInput, QuestionType };

export type QuestionSnapshot = {
  text: string;
  options: string[];
  questionType: QuestionType;
  correctIndex?: number;
  answerConfig?: AnswerConfig;
};

export type DeckQuestion = {
  id: string;
  text: string;
  options: string[];
  correctIndex?: number | null;
  order: number;
  questionType?: QuestionType | null;
  answerConfig?: AnswerConfig | null;
};

export type DeckShuffleSettings = {
  answerShuffleMode: ShuffleMode;
  questionShuffleMode: ShuffleMode;
  answerShuffleScope: SettingScope;
  questionShuffleScope: SettingScope;
};

export type GameRecord = {
  id: string;
  code: string;
  gameType: GameType;
  status: GameStatus;
  durationSeconds: number;
  startedAt?: number | null;
  endsAt?: number | null;
  questionTimeSeconds: number;
  metersPerCorrect?: number;
  questionsSnapshot: QuestionSnapshot[];

  // Sea Sailors route selection (optional; only relevant when gameType === "seaSailors")
  seaOcean?: string | null;
  seaFromCity?: string | null;
  seaToCity?: string | null;
  seaRouteDistanceMeters?: number | null;
  seaRouteKey?: string | null;

  answerShuffleMode?: ShuffleMode;
  questionShuffleMode?: ShuffleMode;
  answerShuffleScope?: SettingScope;
  questionShuffleScope?: SettingScope;
  createdAt: number;
  deckTitle?: string | null;
  deckId?: string | null;
  endedAt?: number | null;
  host?: { id: string } | null;
};

export type PlayerRecord = {
  id: string;
  nickname: string;
  joinedAt: number;
  iconId?: string | null;
  avatarColor?: string | null;
  questionsSnapshot?: QuestionSnapshot[] | null;
  currentQuestionIndex: number;
  streak: number;
  repetition: number;
  questionStartedAt?: number | null;
  user?: { id: string } | null;
};

export type AnswerRecord = {
  id: string;
  questionIndex: number;
  choiceIndex: number;
  isCorrect: boolean;
  answeredAt: number;
  distanceGained: number;
  response?: AnswerResponse | null;
  player?: { id: string; nickname: string } | null;
};

export type HighScoreRecord = {
  id: string;
  gameType: GameType;
  seaRouteKey?: string | null;
  distanceMeters: number;
  achievedAt: number;
  deck?: { id: string } | null;
};

export type UserScoreEntryRecord = {
  id: string;
  displayName: string;
  distanceMeters: number;
  gameType: GameType;
  deckId?: string | null;
  deckTitle?: string | null;
  seaRouteKey?: string | null;
  seaRouteDistanceMeters?: number | null;
  gameCode?: string | null;
  gameId: string;
  endedAt: number;
  achievedAt: number;
  owner?: { id: string } | null;
};
