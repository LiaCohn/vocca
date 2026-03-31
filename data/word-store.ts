import type { QueryResultRow } from "pg";

import type { Word } from "@/domain/types";
import { getPool } from "@/lib/postgres";

type WordRow = QueryResultRow & {
  id: string;
  text: string;
  meaning: string | null;
  example: string | null;
  tags: string[] | null;
  is_hard: boolean;
  created_at: Date | string;
  updated_at: Date | string;
  times_seen: number;
  times_correct: number;
  times_wrong: number;
  last_seen: Date | string | null;
  last_correct: Date | string | null;
};

export type CreateWordInput = {
  text: string;
  meaning?: string;
  example?: string;
  tags?: string[];
  isHard?: boolean;
};

export type UpdateWordInput = {
  text?: string;
  meaning?: string;
  example?: string;
  tags?: string[];
  isHard?: boolean;
};

function normalizeText(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

function mapWord(row: WordRow): Word {
  return {
    id: row.id,
    text: row.text,
    meaning: row.meaning ?? undefined,
    example: row.example ?? undefined,
    tags: row.tags ?? [],
    isHard: row.is_hard,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    stats: {
      timesSeen: row.times_seen,
      timesCorrect: row.times_correct,
      timesWrong: row.times_wrong,
      lastSeen: row.last_seen ? new Date(row.last_seen).toISOString() : undefined,
      lastCorrect: row.last_correct ? new Date(row.last_correct).toISOString() : undefined,
    },
  };
}

export async function listWords(ownerId: string): Promise<Word[]> {
  const pool = getPool();
  const result = await pool.query<WordRow>(
    `select *
     from words
     where user_id = $1
     order by created_at desc`,
    [ownerId],
  );
  return result.rows.map(mapWord);
}

export async function getWordById(ownerId: string, id: string): Promise<Word | null> {
  const pool = getPool();
  const result = await pool.query<WordRow>(
    `select *
     from words
     where user_id = $1 and id = $2
     limit 1`,
    [ownerId, id],
  );
  return result.rows[0] ? mapWord(result.rows[0]) : null;
}

export async function createWord(ownerId: string, input: CreateWordInput): Promise<Word> {
  const pool = getPool();
  const result = await pool.query<WordRow>(
    `insert into words (
      user_id,
      text,
      meaning,
      example,
      tags,
      is_hard
    ) values ($1, $2, $3, $4, $5, $6)
    returning *`,
    [
      ownerId,
      input.text.trim(),
      normalizeText(input.meaning),
      normalizeText(input.example),
      (input.tags ?? []).map((tag) => tag.trim()).filter((tag) => tag.length > 0),
      input.isHard ?? false,
    ],
  );
  return mapWord(result.rows[0]);
}

export async function updateWord(ownerId: string, id: string, input: UpdateWordInput): Promise<Word | null> {
  const pool = getPool();
  const result = await pool.query<WordRow>(
    `update words
      set
        text = coalesce($3, text),
        meaning = case when $4::boolean then $5 else meaning end,
        example = case when $6::boolean then $7 else example end,
        tags = case when $8::boolean then $9 else tags end,
        is_hard = coalesce($10, is_hard),
        updated_at = now()
      where user_id = $1 and id = $2
      returning *`,
    [
      ownerId,
      id,
      input.text !== undefined ? input.text.trim() : null,
      input.meaning !== undefined,
      normalizeText(input.meaning),
      input.example !== undefined,
      normalizeText(input.example),
      input.tags !== undefined,
      input.tags !== undefined ? input.tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0) : null,
      input.isHard ?? null,
    ],
  );

  return result.rows[0] ? mapWord(result.rows[0]) : null;
}

export async function removeWord(ownerId: string, id: string): Promise<void> {
  const pool = getPool();
  await pool.query(`delete from words where user_id = $1 and id = $2`, [ownerId, id]);
}

export async function recordQuizResult(ownerId: string, id: string, isCorrect: boolean): Promise<Word | null> {
  const pool = getPool();
  const result = await pool.query<WordRow>(
    `update words
      set
        times_seen = times_seen + 1,
        times_correct = times_correct + case when $3::boolean then 1 else 0 end,
        times_wrong = times_wrong + case when $3::boolean then 0 else 1 end,
        last_seen = now(),
        last_correct = case when $3::boolean then now() else last_correct end,
        updated_at = now()
      where user_id = $1 and id = $2
      returning *`,
    [ownerId, id, isCorrect],
  );
  return result.rows[0] ? mapWord(result.rows[0]) : null;
}
