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