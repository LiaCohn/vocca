export type WordStats = {
  timesSeen: number;
  timesCorrect: number;
  timesWrong: number;
  lastSeen?: string;
  lastCorrect?: string;
};

export type Word = {
  id: string;
  text: string;
  meaning?: string;
  example?: string;
  tags: string[];
  isHard: boolean;
  createdAt: string;
  updatedAt: string;
  stats: WordStats;
};

export type QuizMode = "recent24h" | "recent7d" | "random" | "weak";

export type QuizQuestion = {
  wordId: string;
  prompt: string;
  correctAnswer: string;
  options: string[];
};

export type QuizResult = {
  wordId: string;
  isCorrect: boolean;
  selectedAnswer: string;
  correctAnswer: string;
};
