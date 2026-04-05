"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const TAG_DEBOUNCE_MS = 500;

type WordFormValues = {
  text: string;
  meaning: string;
  example: string;
  tags: string[];
};

type WordFormProps = {
  initialValues?: Partial<WordFormValues>;
  submitLabel: string;
  onSubmit: (values: WordFormValues) => Promise<void>;
};

function TagBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-zinc-100 py-0.5 ps-1.5 pe-0.5 text-xs font-medium text-zinc-900 ring-1 ring-zinc-200 ring-inset">
      <span>{label}</span>
      <button
        type="button"
        className="inline-flex items-center rounded-sm bg-transparent p-0.5 text-sm hover:bg-zinc-200"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onRemove}
        aria-label={`Remove tag ${label}`}
      >
        <svg
          className="h-3 w-3"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18 17.94 6M18 18 6.06 6"
          />
        </svg>
        <span className="sr-only">Remove badge</span>
      </button>
    </span>
  );
}

export function WordForm({ initialValues, submitLabel, onSubmit }: WordFormProps) {
  const defaults = useMemo<WordFormValues>(
    () => ({
      text: initialValues?.text ?? "",
      meaning: initialValues?.meaning ?? "",
      example: initialValues?.example ?? "",
      tags: initialValues?.tags?.length ? [...initialValues.tags] : [],
    }),
    [initialValues],
  );

  const [values, setValues] = useState(defaults);
  const [tags, setTags] = useState<string[]>(defaults.tags);
  const [tagDraft, setTagDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const tagDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTagDebounce() {
    if (tagDebounceRef.current) {
      clearTimeout(tagDebounceRef.current);
      tagDebounceRef.current = null;
    }
  }

  function commitTagText(raw: string) {
    clearTagDebounce();
    const next = raw.trim();
    if (!next) return;
    setTags((prev) => (prev.includes(next) ? prev : [...prev, next]));
    setTagDraft("");
  }

  useEffect(() => {
    const trimmed = tagDraft.trim();
    if (!trimmed) {
      clearTagDebounce();
      return;
    }

    clearTagDebounce();
    tagDebounceRef.current = setTimeout(() => {
      tagDebounceRef.current = null;
      setTags((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
      setTagDraft("");
    }, TAG_DEBOUNCE_MS);

    return clearTagDebounce;
  }, [tagDraft]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.text.trim()) {
      setError("Word is required.");
      return;
    }

    clearTagDebounce();
    const draft = tagDraft.trim();
    const tagsForSubmit =
      draft && !tags.includes(draft) ? [...tags, draft] : tags;

    setError(null);
    setSubmitting(true);

    try {
      await onSubmit({ ...values, tags: tagsForSubmit });
    } catch {
      setError("Could not save word. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4">
      <div>
        <label htmlFor="text" className="mb-1 block text-sm font-medium">
          Word *
        </label>
        <input
          id="text"
          autoFocus
          value={values.text}
          onChange={(event) => setValues((current) => ({ ...current, text: event.target.value }))}
          className="w-full rounded-md border border-zinc-300 px-3 py-2"
          placeholder="e.g. meticulous"
        />
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium">Tags</span>
        <div className="flex min-h-[42px] w-full flex-wrap items-center gap-2 rounded-md border border-zinc-300 bg-white px-2 py-2 focus-within:ring-2 focus-within:ring-zinc-400 focus-within:ring-offset-1">
          {tags.map((tag) => (
            <TagBadge
              key={tag}
              label={tag}
              onRemove={() => setTags((prev) => prev.filter((t) => t !== tag))}
            />
          ))}
          <input
            id="tags"
            type="text"
            value={tagDraft}
            onChange={(event) => setTagDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                clearTagDebounce();
                commitTagText(tagDraft);
                return;
              }
              if (event.key === "Backspace" && !tagDraft && tags.length > 0) {
                event.preventDefault();
                setTags((prev) => prev.slice(0, -1));
              }
            }}
            onBlur={(event) => {
              const t = event.currentTarget.value.trim();
              if (!t) return;
              clearTagDebounce();
              commitTagText(t);
            }}
            className="min-w-[8rem] flex-1 border-0 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-zinc-400"
            placeholder="Type a tag, Enter or pause to add"
            autoComplete="off"
          />
        </div>
      </div>

      <div>
        <label htmlFor="meaning" className="mb-1 block text-sm font-medium">
          Meaning
        </label>
        <textarea
          id="meaning"
          value={values.meaning}
          onChange={(event) => setValues((current) => ({ ...current, meaning: event.target.value }))}
          className="w-full rounded-md border border-zinc-300 px-3 py-2"
          rows={3}
          placeholder="Optional, but recommended for quizzes"
        />
      </div>

      <div>
        <label htmlFor="example" className="mb-1 block text-sm font-medium">
          Example sentence
        </label>
        <textarea
          id="example"
          value={values.example}
          onChange={(event) => setValues((current) => ({ ...current, example: event.target.value }))}
          className="w-full rounded-md border border-zinc-300 px-3 py-2"
          rows={3}
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {submitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
