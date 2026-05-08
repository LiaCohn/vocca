"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { WordForm } from "@/components/word-form";
import type { Word } from "@/domain/types";
import { getListRepository, type ListWithWordCount } from "@/data/list-repository";
import { getWordRepository } from "@/data/word-repository";

export default function EditWordPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [word, setWord] = useState<Word | null>(null);
  const [lists, setLists] = useState<ListWithWordCount[]>([]);
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [listsError, setListsError] = useState<string | null>(null);

  useEffect(() => {
    getWordRepository()
      .getById(params.id)
      .then(setWord);
  }, [params.id]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getListRepository().list(), getListRepository().listWordIdsForWord(params.id)])
      .then(([availableLists, assignedListIds]) => {
        if (cancelled) return;
        setLists(availableLists);
        setSelectedListIds(assignedListIds);
        setListsError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setListsError("Could not load list assignments.");
      });

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function syncListAssignments(wordId: string, nextListIds: string[]) {
    const repository = getListRepository();
    const currentListIds = await repository.listWordIdsForWord(wordId);
    const desiredSet = new Set(nextListIds);
    const currentSet = new Set(currentListIds);
    const toAssign = nextListIds.filter((id) => !currentSet.has(id));
    const toUnassign = currentListIds.filter((id) => !desiredSet.has(id));

    await Promise.all([
      ...toAssign.map((listId) => repository.assignWord(listId, wordId)),
      ...toUnassign.map((listId) => repository.unassignWord(listId, wordId)),
    ]);
  }

  if (!word) {
    return <p className="text-sm text-zinc-600">Word not found.</p>;
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Edit word</h1>
      <section className="space-y-2 rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-medium">Lists</h2>
        {listsError ? <p className="text-sm text-red-600">{listsError}</p> : null}
        {lists.length === 0 ? (
          <p className="text-sm text-zinc-600">No lists yet. Create one in the Lists page.</p>
        ) : (
          <div className="space-y-2">
            {lists.map((list) => {
              const checked = selectedListIds.includes(list.id);
              return (
                <label key={list.id} className="flex items-center gap-2 text-sm text-zinc-800">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => {
                      setSelectedListIds((current) =>
                        event.target.checked
                          ? current.includes(list.id)
                            ? current
                            : [...current, list.id]
                          : current.filter((id) => id !== list.id),
                      );
                    }}
                  />
                  <span>
                    {list.name} ({list.wordCount})
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </section>
      <WordForm
        initialValues={{
          text: word.text,
          meaning: word.meaning ?? "",
          example: word.example ?? "",
          tags: word.tags,
        }}
        submitLabel="Save changes"
        onSubmit={async (values) => {
          await getWordRepository().update(word.id, {
            text: values.text,
            meaning: values.meaning,
            example: values.example,
            tags: values.tags,
          });
          await syncListAssignments(word.id, selectedListIds);
          router.push("/");
        }}
      />
    </section>
  );
}
