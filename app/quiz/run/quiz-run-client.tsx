"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getListRepository } from "@/data/list-repository";
import { getWordRepository } from "@/data/word-repository";
import { buildQuestion, buildQuestionQueue, getWordsForMode } from "@/domain/quiz";
import type { QuizMode, QuizResult, Word } from "@/domain/types";

const SUMMARY_STORAGE_KEY = "vocca.last-quiz-summary.v1";
const RETRY_STORAGE_KEY = "vocca.retry-ids.v1";

type Summary = {
  mode: QuizMode;
  listId?: string;
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
  const listId = params.get("listId") ?? "";

  const [queue, setQueue] = useState<Word[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [pool, setPool] = useState<Word[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuiz() {
      const scopedWords = listId ? await getListRepository().listWords(listId) : await getWordRepository().list();
      let modeWords = getWordsForMode(scopedWords, mode);
      const retryRaw = window.sessionStorage.getItem(RETRY_STORAGE_KEY);

      if (retryRaw) {
        try {
          const retryIds = JSON.parse(retryRaw) as string[];
          const retrySet = new Set(retryIds);
          const retryWords = scopedWords.filter((word) => retrySet.has(word.id));
          if (retryWords.length > 0) {
            modeWords = retryWords;
          }
        } catch {
          // Ignore invalid retry payload and fall back to mode selection.
        }
      }

      const withMeaning = modeWords.filter((word) => Boolean(word.meaning?.trim()));
      const initialQueue = buildQuestionQueue(withMeaning, count);
      setPool(scopedWords);
      setQueue(initialQueue);
      setTotalQuestions(initialQueue.length);
      window.sessionStorage.removeItem(RETRY_STORAGE_KEY);
      setLoading(false);
    }

    void loadQuiz();
  }, [count, listId, mode]);

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
      listId: listId || undefined,
      total: results.length,
      correct: results.filter((result) => result.isCorrect).length,
      results,
    };

    window.sessionStorage.setItem(SUMMARY_STORAGE_KEY, JSON.stringify(summary));
    router.push("/quiz/result");
  }

  if (loading) {
    return <p className="text-sm font-medium text-vocca-ink-muted">Preparing quiz...</p>;
  }

  if (queue.length === 0 || !question) {
    if (results.length > 0) {
      return (
        <section className="space-y-4">
          <h1 className="vocca-page-title">Quiz completed!</h1>
          <div className="vocca-card p-5 text-center">
            <p className="text-4xl" aria-hidden>
              🎉
            </p>
            <p className="mt-2 text-sm text-vocca-ink-muted">You answered {results.length} questions.</p>
            <button type="button" onClick={finishQuiz} className="vocca-btn-primary mt-4 w-full">
              See results
            </button>
          </div>
        </section>
      );
    }

    return (
      <section className="space-y-3">
        <h1 className="vocca-page-title">No quiz words yet</h1>
        <p className="text-sm text-vocca-ink-muted">
          Add words with meanings first. Each question needs one correct meaning and at least three distractors.
        </p>
      </section>
    );
  }

  const progress = Math.min(results.length + 1, totalQuestions);
  const progressPct = totalQuestions > 0 ? Math.round((progress / totalQuestions) * 100) : 0;

  return (
    <section className="space-y-4">
      <div className="vocca-card overflow-hidden p-0">
        <div className="h-2 bg-vocca-border">
          <div
            className="h-full bg-gradient-to-r from-vocca-primary via-vocca-coral to-vocca-sun transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <article className="p-4 sm:p-5">
          <p className="text-sm font-bold text-vocca-ink-muted">
            Question {progress} of {totalQuestions}
          </p>
          <p className="mt-4 text-sm font-bold uppercase tracking-wide text-vocca-coral">What does this mean?</p>
          <h2 className="mt-2 text-center font-display text-4xl font-semibold text-vocca-ink sm:text-5xl">
            {question.prompt}
          </h2>

          <div className="mt-5 grid gap-2">
            {question.options.map((option, index) => (
              <button
                key={option}
                type="button"
                onClick={() => handleAnswer(option)}
                disabled={Boolean(answerState)}
                className={getOptionClassName(option, answerState)}
              >
                <span className="mr-2 font-bold text-vocca-primary">{String.fromCharCode(65 + index)}.</span>
                {option}
              </button>
            ))}
          </div>

          {answerState && !answerState.isCorrect ? (
            <p className="mt-4 rounded-xl bg-vocca-bg px-3 py-2 text-sm font-medium text-vocca-ink">
              Correct answer: <span className="font-bold text-vocca-mint">{answerState.correctAnswer}</span>
            </p>
          ) : null}

          {answerState ? (
            <button type="button" onClick={goToNextQuestion} className="vocca-btn-primary mt-5 w-full">
              Next question
            </button>
          ) : null}
        </article>
      </div>
    </section>
  );
}

function getOptionClassName(option: string, answerState: AnswerState | null): string {
  const baseClassName =
    "rounded-xl border-2 px-3 py-3 text-left text-sm font-medium transition active:scale-[0.99]";
  if (!answerState) {
    return `${baseClassName} border-vocca-border bg-white text-vocca-ink hover:border-vocca-primary hover:bg-vocca-bg`;
  }

  if (option === answerState.correctAnswer) {
    return `${baseClassName} border-vocca-mint bg-emerald-50 text-emerald-900`;
  }

  if (option === answerState.selected && !answerState.isCorrect) {
    return `${baseClassName} border-vocca-coral bg-rose-50 text-rose-900`;
  }

  return `${baseClassName} border-vocca-border opacity-50`;
}
