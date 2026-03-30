import type { Word } from "@/domain/types";

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
