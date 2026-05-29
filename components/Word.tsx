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

function tagBadgeClass(tag: string): string {
  if (tag.toLowerCase() === "must") {
    return "bg-vocca-must-bg text-vocca-must-text border-amber-200";
  }
  return "bg-vocca-bg text-vocca-primary border-vocca-border";
}

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
  };

  const formatAddedAt = (value: string): string => {
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
      return "1 day ago";
    }
    return `${days} days ago`;
  };

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
    <li className="vocca-word-card">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 font-display text-xl font-semibold text-vocca-ink">{word.text}</p>
        <div ref={actionsRef} className="relative flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          {word.tags.length > 0 ? (
            <div className="flex flex-wrap justify-end gap-1">
              {word.tags.map((t) => (
                <span
                  key={t}
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tagBadgeClass(t)}`}
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}
          <button
            type="button"
            aria-label={`Open actions for ${word.text}`}
            aria-expanded={showActions}
            aria-haspopup="menu"
            onClick={() => setShowActions((current) => !current)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-vocca-border text-vocca-ink transition hover:border-vocca-primary hover:bg-vocca-bg focus:outline-none focus:ring-2 focus:ring-vocca-primary/30"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
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
              className="absolute right-0 top-11 z-10 min-w-36 rounded-xl border-2 border-vocca-border bg-white p-1 shadow-[var(--vocca-shadow)]"
            >
              <Link
                href={`/words/${word.id}/edit`}
                onClick={() => setShowActions(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-vocca-ink hover:bg-vocca-bg"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={() => {
                  setShowActions(false);
                  void toggleListsPanel();
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-vocca-ink hover:bg-vocca-bg"
              >
                {showLists ? "Hide lists" : "Add to list"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowActions(false);
                  handleDelete(word.id);
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {showLists ? (
        <section className="mt-3 rounded-xl border-2 border-dashed border-vocca-border bg-vocca-bg/60 p-3">
          {availableLists.length === 0 ? (
            <p className="text-xs text-vocca-ink-muted">No lists yet.</p>
          ) : (
            <div className="space-y-1.5">
              {availableLists.map((list) => (
                <label key={list.id} className="flex items-center gap-2 text-sm text-vocca-ink">
                  <input
                    type="checkbox"
                    checked={selectedListIds.includes(list.id)}
                    disabled={listsPending}
                    onChange={(event) => handleListToggle(list.id, event.target.checked)}
                    className="accent-vocca-primary"
                  />
                  <span>{list.name}</span>
                </label>
              ))}
            </div>
          )}
          {listsPending ? <p className="mt-2 text-xs text-vocca-ink-muted">Saving...</p> : null}
          {listsError ? <p className="mt-2 text-xs text-red-600">{listsError}</p> : null}
        </section>
      ) : null}

      <p className="mt-2 text-sm italic text-vocca-ink-muted">{word.meaning ?? "No meaning yet"}</p>

      {word.example?.trim() ? (
        <details className="group mt-3 overflow-hidden rounded-xl border-2 border-vocca-sun/40 bg-vocca-must-bg/40">
          <summary className="cursor-pointer px-3 py-2 text-xs font-bold text-vocca-must-text select-none marker:text-vocca-must-text">
            <span className="group-open:hidden">Show example</span>
            <span className="hidden group-open:inline">Hide example</span>
          </summary>
          <p className="border-t border-vocca-sun/30 px-3 py-2 text-sm text-vocca-ink">&ldquo;{word.example.trim()}&rdquo;</p>
        </details>
      ) : null}

      <p className="mt-2 text-xs font-medium text-vocca-ink-muted/80">{formatAddedAt(word.createdAt)}</p>
    </li>
  );
};
