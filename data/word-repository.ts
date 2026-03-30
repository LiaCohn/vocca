import { z } from "zod";

import type { Word } from "@/domain/types";

const STORAGE_KEY = "vocca.words.v1";

const wordSchema = z.object({
  id: z.string(),
  text: z.string(),
  meaning: z.string().optional(),
  example: z.string().optional(),
  tags: z.array(z.string()),
  isHard: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  stats: z.object({
    timesSeen: z.number(),
    timesCorrect: z.number(),
    timesWrong: z.number(),
    lastSeen: z.string().optional(),
    lastCorrect: z.string().optional(),
  }),
});

const wordsSchema = z.array(wordSchema);

type CreateWordInput = {
  text: string;
  meaning?: string;
  example?: string;
  tags?: string[];
  isHard?: boolean;
};

type UpdateWordInput = {
  text?: string;
  meaning?: string;
  example?: string;
  tags?: string[];
  isHard?: boolean;
};

export interface WordRepository {
  list(): Promise<Word[]>;
  getById(id: string): Promise<Word | null>;
  create(input: CreateWordInput): Promise<Word>;
  update(id: string, input: UpdateWordInput): Promise<Word | null>;
  remove(id: string): Promise<void>;
  recordQuizResult(id: string, isCorrect: boolean): Promise<Word | null>;
}

type JsonRequestInit = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
};

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `word-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseWords(raw: string | null): Word[] {
  if (!raw) {
    return [];
  }

  try {
    return wordsSchema.parse(JSON.parse(raw));
  } catch {
    return [];
  }
}

function normalizeText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

async function requestJson<T>(path: string, init: JsonRequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    method: init.method ?? "GET",
    headers: init.body ? { "content-type": "application/json" } : undefined,
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json();
  return payload as T;
}

export class LocalWordRepository implements WordRepository {
  private readWords(): Word[] {
    if (typeof window === "undefined") {
      return [];
    }

    return parseWords(window.localStorage.getItem(STORAGE_KEY));
  }

  private writeWords(words: Word[]): void {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
  }

  async list(): Promise<Word[]> {
    return this.readWords();
  }

  async getById(id: string): Promise<Word | null> {
    const word = this.readWords().find((item) => item.id === id);
    return word ?? null;
  }

  async create(input: CreateWordInput): Promise<Word> {
    const now = new Date().toISOString();

    const word: Word = {
      id: createId(),
      text: input.text.trim(),
      meaning: normalizeText(input.meaning),
      example: normalizeText(input.example),
      tags: (input.tags ?? []).map((tag) => tag.trim()).filter((tag) => tag.length > 0),
      isHard: input.isHard ?? false,
      createdAt: now,
      updatedAt: now,
      stats: {
        timesSeen: 0,
        timesCorrect: 0,
        timesWrong: 0,
      },
    };

    const words = this.readWords();
    words.push(word);
    this.writeWords(words);

    return word;
  }

  async update(id: string, input: UpdateWordInput): Promise<Word | null> {
    const words = this.readWords();
    const index = words.findIndex((item) => item.id === id);

    if (index < 0) {
      return null;
    }

    const current = words[index];
    const updated: Word = {
      ...current,
      text: normalizeText(input.text) ?? current.text,
      meaning: input.meaning !== undefined ? normalizeText(input.meaning) : current.meaning,
      example: input.example !== undefined ? normalizeText(input.example) : current.example,
      tags:
        input.tags !== undefined
          ? input.tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0)
          : current.tags,
      isHard: input.isHard ?? current.isHard,
      updatedAt: new Date().toISOString(),
    };

    words[index] = updated;
    this.writeWords(words);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const words = this.readWords().filter((item) => item.id !== id);
    this.writeWords(words);
  }

  async recordQuizResult(id: string, isCorrect: boolean): Promise<Word | null> {
    const words = this.readWords();
    const index = words.findIndex((item) => item.id === id);

    if (index < 0) {
      return null;
    }

    const now = new Date().toISOString();
    const current = words[index];
    const updated: Word = {
      ...current,
      updatedAt: now,
      stats: {
        ...current.stats,
        timesSeen: current.stats.timesSeen + 1,
        timesCorrect: current.stats.timesCorrect + (isCorrect ? 1 : 0),
        timesWrong: current.stats.timesWrong + (isCorrect ? 0 : 1),
        lastSeen: now,
        lastCorrect: isCorrect ? now : current.stats.lastCorrect,
      },
    };

    words[index] = updated;
    this.writeWords(words);

    return updated;
  }
}

export class ApiWordRepository implements WordRepository {
  async list(): Promise<Word[]> {
    return requestJson<Word[]>("/api/words");
  }

  async getById(id: string): Promise<Word | null> {
    try {
      return await requestJson<Word>(`/api/words/${id}`);
    } catch {
      return null;
    }
  }

  async create(input: CreateWordInput): Promise<Word> {
    return requestJson<Word>("/api/words", {
      method: "POST",
      body: input,
    });
  }

  async update(id: string, input: UpdateWordInput): Promise<Word | null> {
    try {
      return await requestJson<Word>(`/api/words/${id}`, {
        method: "PATCH",
        body: input,
      });
    } catch {
      return null;
    }
  }

  async remove(id: string): Promise<void> {
    await requestJson<void>(`/api/words/${id}`, { method: "DELETE" });
  }

  async recordQuizResult(id: string, isCorrect: boolean): Promise<Word | null> {
    try {
      return await requestJson<Word>(`/api/words/${id}/quiz-result`, {
        method: "POST",
        body: { isCorrect },
      });
    } catch {
      return null;
    }
  }
}

let repository: WordRepository | null = null;

export function getWordRepository(): WordRepository {
  if (!repository) {
    repository = new ApiWordRepository();
  }

  return repository;
}
