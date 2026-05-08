import type { List } from "@/domain/types";

export type ListWithWordCount = List & {
  wordCount: number;
};

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

export interface ListRepository {
  list(): Promise<ListWithWordCount[]>;
  create(name: string): Promise<List>;
  rename(id: string, name: string): Promise<List | null>;
  remove(id: string): Promise<void>;
  listWordIdsForWord(wordId: string): Promise<string[]>;
  assignWord(listId: string, wordId: string): Promise<void>;
  unassignWord(listId: string, wordId: string): Promise<void>;
}

class ApiListRepository implements ListRepository {
  async list(): Promise<ListWithWordCount[]> {
    return requestJson<ListWithWordCount[]>("/api/lists");
  }

  async create(name: string): Promise<List> {
    return requestJson<List>("/api/lists", { method: "POST", body: { name } });
  }

  async rename(id: string, name: string): Promise<List | null> {
    try {
      return await requestJson<List>(`/api/lists/${id}`, { method: "PATCH", body: { name } });
    } catch {
      return null;
    }
  }

  async remove(id: string): Promise<void> {
    await requestJson<void>(`/api/lists/${id}`, { method: "DELETE" });
  }

  async listWordIdsForWord(wordId: string): Promise<string[]> {
    try {
      const payload = await requestJson<{ listIds: string[] }>(`/api/words/${wordId}/lists`);
      return payload.listIds;
    } catch {
      return [];
    }
  }

  async assignWord(listId: string, wordId: string): Promise<void> {
    await requestJson<void>(`/api/lists/${listId}/words`, { method: "POST", body: { wordId } });
  }

  async unassignWord(listId: string, wordId: string): Promise<void> {
    await requestJson<void>(`/api/lists/${listId}/words`, { method: "DELETE", body: { wordId } });
  }
}

let repository: ListRepository | null = null;

export function getListRepository(): ListRepository {
  if (!repository) {
    repository = new ApiListRepository();
  }
  return repository;
}
