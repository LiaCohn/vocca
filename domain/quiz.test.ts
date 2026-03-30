import { describe, expect, it } from "vitest";

import { getWordsForMode, queueWordAgainSoon } from "@/domain/quiz";
import type { Word } from "@/domain/types";

function makeWord(overrides: Partial<Word>): Word {
  return {
    id: overrides.id ?? "id",
    text: overrides.text ?? "word",
    meaning: overrides.meaning ?? "meaning",
    example: overrides.example,
    tags: overrides.tags ?? [],
    isHard: overrides.isHard ?? false,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    updatedAt: overrides.updatedAt ?? new Date().toISOString(),
    stats: overrides.stats ?? {
      timesSeen: 0,
      timesCorrect: 0,
      timesWrong: 0,
    },
  };
}

describe("quiz selection", () => {
  it("filters words by last 24 hours", () => {
    const now = new Date("2026-03-24T12:00:00.000Z");
    const recent = makeWord({ id: "recent", createdAt: "2026-03-24T10:00:00.000Z" });
    const old = makeWord({ id: "old", createdAt: "2026-03-20T10:00:00.000Z" });

    const result = getWordsForMode([recent, old], "recent24h", now);

    expect(result.map((word) => word.id)).toEqual(["recent"]);
  });

  it("prioritizes high difficulty in weak mode", () => {
    const easy = makeWord({ id: "easy", stats: { timesSeen: 5, timesCorrect: 5, timesWrong: 0 } });
    const weak = makeWord({ id: "weak", stats: { timesSeen: 5, timesCorrect: 1, timesWrong: 4 } });

    const result = getWordsForMode([easy, weak], "weak");

    expect(result[0]?.id).toBe("weak");
  });

  it("requeues wrong word near the front", () => {
    const queue = [makeWord({ id: "b" }), makeWord({ id: "c" })];
    const wrongWord = makeWord({ id: "a" });

    const result = queueWordAgainSoon(queue, wrongWord);

    expect(result.map((word) => word.id)).toEqual(["b", "c", "a"]);
  });
});
