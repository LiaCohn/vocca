import Link from "next/link";

import type { Word } from "@/domain/types";

export const WordComponent = ({ word ,onDelete}: { word: Word, onDelete: (id: string) => void }) => {
    const handleDelete = (id: string) => {
        onDelete(id);
    }

    const formatAddedAt =(value: string): string => {
        const createdMs = new Date(value).getTime();
        const diffMs = Date.now() - createdMs;
        const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
        if (days <= 0) {
          return "Today";
        }
        if (days === 1) {
          return "1 Day Ago";
        }
        return `${days} Days Ago`;
    }


  return (
        <li key={word.id} className="rounded-md border border-zinc-200 px-3 py-2">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 flex-1 text-base font-semibold">{word.text}</p>
              <div className="flex shrink-0 items-center gap-2">
                <p className="text-xs text-zinc-500 flex gap-1">{word.tags.map((t) => 
                    <span key={t} className="bg-brand-softer border border-brand-subtle text-fg-brand-strong text-xs font-medium px-1.5 py-0.5 rounded">{t}</span>
    ) ?? "No Tags"}
    
    </p>
                <Link
                  href={`/words/${word.id}/edit`}
                  aria-label={`Edit ${word.text}`}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-300 text-zinc-700 transition hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2"
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
                      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                    />
                  </svg>
                </Link>
                <button
                  type="button"
                  aria-label={`Delete ${word.text}`}
                  onClick={() => handleDelete(word.id)}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-medium leading-none text-white transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 active:scale-95"
                >
                  ×
                </button>
              </div>
            </div>
            <p className="text-sm text-zinc-700">{word.meaning ?? "No meaning yet"}</p>
            <p className="text-xs text-zinc-500">{formatAddedAt(word.createdAt)}</p>
        </li>

  );
};