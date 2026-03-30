import { beforeEach, describe, expect, it } from "vitest";

import { LocalWordRepository } from "@/data/word-repository";

const STORAGE_KEY = "vocca.words.v1";

describe("LocalWordRepository", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("stores and updates quiz stats", async () => {
    const repository = new LocalWordRepository();

    const created = await repository.create({
      text: "meticulous",
      meaning: "showing great attention to detail",
    });

    await repository.recordQuizResult(created.id, false);
    const afterWrong = await repository.recordQuizResult(created.id, true);

    expect(afterWrong).not.toBeNull();
    expect(afterWrong?.stats.timesSeen).toBe(2);
    expect(afterWrong?.stats.timesWrong).toBe(1);
    expect(afterWrong?.stats.timesCorrect).toBe(1);
    expect(afterWrong?.stats.lastSeen).toBeDefined();
    expect(afterWrong?.stats.lastCorrect).toBeDefined();

    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).toContain("meticulous");
  });
});
