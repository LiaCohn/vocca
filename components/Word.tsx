"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { getListRepository, type ListWithWordCount } from "@/data/list-repository";
import type { Word } from "@/domain/types";

type WordProps = {
  word: Word;
  onDelete: (id: string) => void;
  nowMs: number;
  availableLists: ListWithWordCount[];
};

export const WordComponent = ({ word, onDelete, nowMs, availableLists }: WordProps) => {
    const [showLists, setShowLists] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const actionsRef = useRef<HTMLDivElement>(null);
    const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
    const [hasLoadedAssignments, setHasLoadedAssignments] = useState(false);
    const [listsPending, setListsPending] = useState(false);
    const [listsError, setListsError] = useState<string | null>(null);

    const handleDelete = (id: string) => {
        onDelete(id);
    }

    const formatAddedAt =(value: string): string => {
        const createdMs = new Date(value).getTime();
        if (Number.isNaN(createdMs)) {
          return "Unknown date";
        }
        const diffMs = nowMs - createdMs;
        const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
        if (days <= 0) {
          return "Today";
        }
        if (days === 1) {
          return "1 Day Ago";
        }
        return `${days} Days Ago`;
    }

    async function toggleListsPanel() {
      if (!showLists && !hasLoadedAssignments) {
        setListsPending(true);
        try {
          const ids = await getListRepository().listWordIdsForWord(word.id);
          setSelectedListIds(ids);
          setHasLoadedAssignments(true);
          setListsError(null);
        } catch {
          setListsError("Could not load assignments.");
        } finally {
          setListsPending(false);
        }
      }

      setShowLists((current) => !current);
    }

    async function handleListToggle(listId: string, checked: boolean) {
      setListsPending(true);
      try {
        if (checked) {
          await getListRepository().assignWord(listId, word.id);
          setSelectedListIds((current) => (current.includes(listId) ? current : [...current, listId]));
        } else {
          await getListRepository().unassignWord(listId, word.id);
          setSelectedListIds((current) => current.filter((id) => id !== listId));
        }
        setListsError(null);
      } catch {
        setListsError("Could not update assignments.");
      } finally {
        setListsPending(false);
      }
    }

    useEffect(() => {
      if (!showActions) return;

      function handlePointerDown(event: PointerEvent) {
        const node = actionsRef.current;
        if (!node?.contains(event.target as Node)) {
          setShowActions(false);
        }
      }

      function handleKeyDown(event: KeyboardEvent) {
        if (event.key === "Escape") {
          setShowActions(false);
        }
      }

      document.addEventListener("pointerdown", handlePointerDown);
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("pointerdown", handlePointerDown);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, [showActions]);

  return (
        <li className="rounded-md border border-zinc-200 px-3 py-2">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 flex-1 text-base font-semibold">{word.text}</p>
              <div ref={actionsRef} className="relative flex shrink-0 items-center gap-2">
                <p className="text-xs text-zinc-500 flex gap-1">{word.tags.map((t) => 
                    <span key={t} className="bg-brand-softer border border-brand-subtle text-fg-brand-strong text-xs font-medium px-1.5 py-0.5 rounded">{t}</span>
    ) ?? "No Tags"}
    
    </p>
                <button
                  type="button"
                  aria-label={`Open actions for ${word.text}`}
                  aria-expanded={showActions}
                  aria-haspopup="menu"
                  onClick={() => setShowActions((current) => !current)}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-300 text-zinc-700 transition hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-4"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Zm0 6a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Zm0 6a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
                    />
                  </svg>
                </button>

                {showActions ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-10 z-10 min-w-36 rounded-md border border-zinc-200 bg-white p-1 shadow-lg"
                  >
                    <Link
                      href={`/words/${word.id}/edit`}
                      onClick={() => setShowActions(false)}
                      className="block rounded px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setShowActions(false);
                        void toggleListsPanel();
                      }}
                      className="w-full rounded px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100"
                    >
                      {showLists ? "Hide lists" : "Add to list"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowActions(false);
                        handleDelete(word.id);
                      }}
                      className="w-full rounded px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
            {showLists ? (
              <section className="mt-2 rounded-md border border-zinc-200 bg-zinc-50 p-2">
                {availableLists.length === 0 ? (
                  <p className="text-xs text-zinc-600">No lists yet.</p>
                ) : (
                  <div className="space-y-1">
                    {availableLists.map((list) => (
                      <label key={list.id} className="flex items-center gap-2 text-xs text-zinc-800">
                        <input
                          type="checkbox"
                          checked={selectedListIds.includes(list.id)}
                          disabled={listsPending}
                          onChange={(event) => handleListToggle(list.id, event.target.checked)}
                        />
                        <span>{list.name}</span>
                      </label>
                    ))}
                  </div>
                )}
                {listsPending ? <p className="mt-2 text-xs text-zinc-500">Saving...</p> : null}
                {listsError ? <p className="mt-2 text-xs text-red-600">{listsError}</p> : null}
              </section>
            ) : null}
            <p className="text-sm text-zinc-700">{word.meaning ?? "No meaning yet"}</p>
            {word.example?.trim() ? (
              <details className="group mt-2 mb-2 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-sm text-zinc-700">
                <summary className="cursor-pointer text-xs font-medium text-zinc-600 select-none marker:text-zinc-500">
                  <span className="group-open:hidden">Show example</span>
                  <span className="hidden group-open:inline">Hide example</span>
                </summary>
                <p className="mt-2 italic">&ldquo;{word.example.trim()}&rdquo;</p>
              </details>
            ) : null}
            <p className="text-xs text-zinc-500">{formatAddedAt(word.createdAt)}</p>
        </li>

  );
};