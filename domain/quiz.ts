import { getDifficulty } from "@/domain/metrics";
import type { QuizMode, QuizQuestion, Word } from "@/domain/types";

export function getWordsForMode(words: Word[], mode: QuizMode, now = new Date()): Word[] {
  if (mode === "random") {
    return [...words];
  }

  if (mode === "weak") {
    return [...words].sort((a, b) => getDifficulty(b) - getDifficulty(a));
  }

  const sinceMs = mode === "recent24h" ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
  const since = now.getTime() - sinceMs;

  return words.filter((word) => new Date(word.createdAt).getTime() >= since);
}

export function buildQuestion(word: Word, pool: Word[]): QuizQuestion | null {
  console.log("word", word);
  console.log("pool", pool);
  if (!word.meaning || word.meaning.trim().length === 0) {
    return null;
  }

  const distractorCandidates = pool
    .filter((candidate) => candidate.id !== word.id)
    .map((candidate) => candidate.meaning?.trim())
    .filter((meaning): meaning is string => Boolean(meaning && meaning.length > 0 && meaning !== word.meaning));
  console.log("distractorCandidates", distractorCandidates);
  const uniqueDistractors = Array.from(new Set(distractorCandidates));
  console.log("uniqueDistractors", uniqueDistractors);
  if (uniqueDistractors.length < 3) {
    return null;
  }

  const shuffledDistractors = shuffle(uniqueDistractors).slice(0, 3);
  const options = shuffle([word.meaning, ...shuffledDistractors]);

  return {
    wordId: word.id,
    prompt: word.text,
    correctAnswer: word.meaning,
    options,
  };
}

export function buildQuestionQueue(words: Word[], count: number): Word[] {
  return shuffle(words).slice(0, Math.max(0, count));
}

export function queueWordAgainSoon(queue: Word[], word: Word): Word[] {
  const next = [...queue];
  const insertionIndex = Math.min(2, next.length);
  next.splice(insertionIndex, 0, word);
  return next;
}

export function shuffle<T>(values: T[]): T[] {
  const result = [...values];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}
