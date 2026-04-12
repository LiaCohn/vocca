"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getWordRepository } from "@/data/word-repository";
import { buildQuestion, buildQuestionQueue, getWordsForMode } from "@/domain/quiz";
import type { QuizMode, QuizResult, Word } from "@/domain/types";

const SUMMARY_STORAGE_KEY = "vocca.last-quiz-summary.v1";
const RETRY_STORAGE_KEY = "vocca.retry-ids.v1";

type Summary = {
  mode: QuizMode;
  total: number;
  correct: number;
  results: QuizResult[];
};

type AnswerState = {
  selected: string;
  isCorrect: boolean;
  correctAnswer: string;
};

export default function QuizRunClient() {
  const router = useRouter();
  const params = useSearchParams();
  const mode = (params.get("mode") as QuizMode) ?? "recent7d";
  const count = Number(params.get("count") ?? "10");

  const [queue, setQueue] = useState<Word[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [pool, setPool] = useState<Word[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuiz() {
      const allWords = await getWordRepository().list();
      let modeWords = getWordsForMode(allWords, mode);
      const retryRaw = window.sessionStorage.getItem(RETRY_STORAGE_KEY);

      if (retryRaw) {
        try {
          const retryIds = JSON.parse(retryRaw) as string[];
          const retrySet = new Set(retryIds);
          const retryWords = allWords.filter((word) => retrySet.has(word.id));
          if (retryWords.length > 0) {
            modeWords = retryWords;
          }
        } catch {
          // Ignore invalid retry payload and fall back to mode selection.
        }
      }

      const withMeaning = modeWords.filter((word) => Boolean(word.meaning?.trim()));
      const initialQueue = buildQuestionQueue(withMeaning, count);
      setPool(allWords);
      setQueue(initialQueue);
      setTotalQuestions(initialQueue.length);
      window.sessionStorage.removeItem(RETRY_STORAGE_KEY);
      setLoading(false);
    }

    void loadQuiz();
  }, [count, mode]);

  const currentWord = queue[0];

  const question = useMemo(() => {
    if (!currentWord) {
      return null;
    }

    return buildQuestion(currentWord, pool);
  }, [currentWord, pool]);

  async function handleAnswer(selectedAnswer: string) {
    if (!question || !currentWord || answerState) {
      return;
    }

    const isCorrect = selectedAnswer === question.correctAnswer;
    await getWordRepository().recordQuizResult(currentWord.id, isCorrect);

    setResults((current) => [
      ...current,
      {
        wordId: currentWord.id,
        isCorrect,
        selectedAnswer,
        correctAnswer: question.correctAnswer,
      },
    ]);
    setAnswerState({
      selected: selectedAnswer,
      isCorrect,
      correctAnswer: question.correctAnswer,
    });
  }

  function goToNextQuestion() {
    setQueue((current) => current.slice(1));
    setAnswerState(null);
  }

  function finishQuiz() {
    const summary: Summary = {
      mode,
      total: results.length,
      correct: results.filter((result) => result.isCorrect).length,
      results,
    };

    window.sessionStorage.setItem(SUMMARY_STORAGE_KEY, JSON.stringify(summary));
    router.push("/quiz/result");
  }

  if (loading) {
    return <p className="text-sm text-zinc-600">Preparing quiz...</p>;
  }

  if (queue.length === 0 || !question) {
    console.log("queue ", queue);
    console.log("question", question);
    if (results.length > 0) {
      return (
        <section className="space-y-4">
          <h1 className="text-2xl font-semibold">Quiz completed</h1>
          <p className="text-sm text-zinc-600">You answered {results.length} questions.</p>
          <button
            type="button"
            onClick={finishQuiz}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
          >
            See results
          </button>
        </section>
      );
    }

    return (
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold">No quiz words available</h1>
        <p className="text-sm text-zinc-600">
          Add words with meanings first. Each question needs one correct meaning and at least three distractors.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <article className="rounded-lg border border-zinc-200 bg-white p-5">
        <p className="text-2xl">Progress: {Math.min(results.length + 1, totalQuestions)} / {totalQuestions}</p>
        <p className="mt-8 text-4xl">What is the meaning of:</p>
        <h2 className="mt-6 text-center text-5xl font-semibold">&quot;{question.prompt}&quot;</h2>

        <div className="mt-5 grid gap-2">
          {question.options.map((option, index) => (
            <button
              key={option}
              type="button"
              onClick={() => handleAnswer(option)}
              disabled={Boolean(answerState)}
              className={getOptionClassName(option, answerState)}
            >
              {String.fromCharCode(65 + index)}. {option}
            </button>
          ))}
        </div>

        {answerState && !answerState.isCorrect ? (
          <p className="mt-4 text-sm text-zinc-700">Correct answer: {answerState.correctAnswer}</p>
        ) : null}

        {answerState ? (
          <button
            type="button"
            onClick={goToNextQuestion}
            className="mt-5 rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold"
          >
            Next
          </button>
        ) : null}
      </article>
    </section>
  );
}

function getOptionClassName(option: string, answerState: AnswerState | null): string {
  const baseClassName = "rounded-md border px-3 py-2 text-left";
  if (!answerState) {
    return `${baseClassName} border-zinc-300 hover:bg-zinc-50`;
  }

  if (option === answerState.correctAnswer) {
    return `${baseClassName} border-green-400 bg-green-50 text-green-900`;
  }

  if (option === answerState.selected && !answerState.isCorrect) {
    return `${baseClassName} border-red-400 bg-red-50 text-red-900`;
  }

  return `${baseClassName} border-zinc-300 opacity-70`;
}
