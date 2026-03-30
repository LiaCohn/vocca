import type { Word } from "@/domain/types";

export function getAccuracy(word: Word): number {
  if (word.stats.timesSeen === 0) {
    return 0;
  }

  return word.stats.timesCorrect / word.stats.timesSeen;
}

export function getDifficulty(word: Word): number {
  return word.stats.timesWrong - word.stats.timesCorrect + (word.isHard ? 2 : 0);
}
