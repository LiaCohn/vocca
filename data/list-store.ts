import type { QueryResultRow } from "pg";

import type { List, Word } from "@/domain/types";
import { getPool } from "@/lib/postgres";

type ListRow = QueryResultRow & {
  id: string;
  user_id: string;
  name: string;
  created_at: Date | string;
  updated_at: Date | string;
};

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

export type ListWithWordCount = List & {
  wordCount: number;
};

export type CreateListInput = {
  name: string;
};

export type UpdateListInput = {
  name: string;
};

function mapList(row: ListRow): List {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
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

function normalizeName(name: string): string {
  return name.trim();
}

export async function listLists(ownerId: string): Promise<ListWithWordCount[]> {
  const pool = getPool();
  const result = await pool.query<(ListRow & { word_count: string | number })>(
    `select l.*, count(lw.word_id)::int as word_count
     from lists l
     left join list_words lw on lw.list_id = l.id
     where l.user_id = $1
     group by l.id
     order by l.created_at desc`,
    [ownerId],
  );

  return result.rows.map((row) => ({
    ...mapList(row),
    wordCount: Number(row.word_count),
  }));
}

export async function getListById(ownerId: string, id: string): Promise<List | null> {
  const pool = getPool();
  const result = await pool.query<ListRow>(
    `select *
     from lists
     where user_id = $1 and id = $2
     limit 1`,
    [ownerId, id],
  );
  return result.rows[0] ? mapList(result.rows[0]) : null;
}

export async function createList(ownerId: string, input: CreateListInput): Promise<List> {
  const pool = getPool();
  const result = await pool.query<ListRow>(
    `insert into lists (
      user_id,
      name
    ) values ($1, $2)
    returning *`,
    [ownerId, normalizeName(input.name)],
  );
  return mapList(result.rows[0]);
}

export async function updateList(ownerId: string, id: string, input: UpdateListInput): Promise<List | null> {
  const pool = getPool();
  const result = await pool.query<ListRow>(
    `update lists
      set
        name = $3,
        updated_at = now()
      where user_id = $1 and id = $2
      returning *`,
    [ownerId, id, normalizeName(input.name)],
  );
  return result.rows[0] ? mapList(result.rows[0]) : null;
}

export async function removeList(ownerId: string, id: string): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query(
    `delete from lists
     where user_id = $1 and id = $2`,
    [ownerId, id],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function assignWordToList(ownerId: string, listId: string, wordId: string): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query(
    `insert into list_words (list_id, word_id)
     select $2, $3
     where exists (
       select 1
       from lists l
       where l.id = $2 and l.user_id = $1
     )
     and exists (
       select 1
       from words w
       where w.id = $3 and w.user_id = $1
     )
     on conflict (list_id, word_id)
     do update set updated_at = now()
     returning list_id`,
    [ownerId, listId, wordId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function unassignWordFromList(ownerId: string, listId: string, wordId: string): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query(
    `delete from list_words lw
     using lists l, words w
     where lw.list_id = l.id
       and lw.word_id = w.id
       and l.id = $2
       and w.id = $3
       and l.user_id = $1
       and w.user_id = $1`,
    [ownerId, listId, wordId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function listWordsInList(ownerId: string, listId: string): Promise<Word[] | null> {
  const pool = getPool();
  const ownership = await pool.query(
    `select 1
     from lists
     where id = $2 and user_id = $1
     limit 1`,
    [ownerId, listId],
  );

  if (!ownership.rows[0]) {
    return null;
  }

  const result = await pool.query<WordRow>(
    `select w.*
     from words w
     inner join list_words lw on lw.word_id = w.id
     where lw.list_id = $2 and w.user_id = $1
     order by lw.created_at desc`,
    [ownerId, listId],
  );

  return result.rows.map(mapWord);
}

export async function listListIdsForWord(ownerId: string, wordId: string): Promise<string[] | null> {
  const pool = getPool();
  const ownership = await pool.query(
    `select 1
     from words
     where id = $2 and user_id = $1
     limit 1`,
    [ownerId, wordId],
  );

  if (!ownership.rows[0]) {
    return null;
  }

  const result = await pool.query<{ list_id: string }>(
    `select lw.list_id
     from list_words lw
     inner join lists l on l.id = lw.list_id
     where lw.word_id = $2 and l.user_id = $1
     order by lw.created_at desc`,
    [ownerId, wordId],
  );

  return result.rows.map((row) => row.list_id);
}
