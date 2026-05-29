"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";

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

const wordFormSchema = z.object({
  text: z.string().trim().min(1, "Word is required."),
  meaning: z.string().trim().min(1, "Meaning is required."),
  example: z.string(),
  tags: z.array(z.string()),
});

function TagBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
  const isMust = label.toLowerCase() === "must";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border py-0.5 ps-2 pe-1 text-xs font-bold ${
        isMust
          ? "border-amber-200 bg-vocca-must-bg text-vocca-must-text"
          : "border-vocca-border bg-vocca-bg text-vocca-primary"
      }`}
    >
      <span>{label}</span>
      <button
        type="button"
        className="inline-flex items-center rounded-full bg-transparent p-0.5 hover:bg-black/5"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onRemove}
        aria-label={`Remove tag ${label}`}
      >
        <svg className="h-3 w-3" aria-hidden xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 17.94 6M18 18 6.06 6" />
        </svg>
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
  const canSubmit = values.text.trim().length > 0 && values.meaning.trim().length > 0;

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

    clearTagDebounce();
    const draft = tagDraft.trim();
    const tagsForSubmit = draft && !tags.includes(draft) ? [...tags, draft] : tags;

    const parsed = wordFormSchema.safeParse({ ...values, tags: tagsForSubmit });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please fix the form and try again.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await onSubmit(parsed.data);
    } catch {
      setError("Could not save word. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="vocca-card space-y-4 p-4 sm:p-5">
      <div>
        <label htmlFor="text" className="mb-1.5 block text-sm font-bold text-vocca-ink">
          Word *
        </label>
        <input
          id="text"
          autoFocus
          value={values.text}
          onChange={(event) => setValues((current) => ({ ...current, text: event.target.value }))}
          className="vocca-input font-display text-lg"
          placeholder="e.g. meticulous"
        />
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-bold text-vocca-ink">Tags</span>
        <div className="flex min-h-[44px] w-full flex-wrap items-center gap-2 rounded-xl border-2 border-vocca-border bg-white px-2 py-2 focus-within:border-vocca-primary focus-within:ring-2 focus-within:ring-vocca-primary/20">
          {tags.map((tag) => (
            <TagBadge key={tag} label={tag} onRemove={() => setTags((prev) => prev.filter((t) => t !== tag))} />
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
            className="min-w-[8rem] flex-1 border-0 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-vocca-ink-muted/60"
            placeholder="Type a tag — try must"
            autoComplete="off"
          />
        </div>
      </div>

      <div>
        <label htmlFor="meaning" className="mb-1.5 block text-sm font-bold text-vocca-ink">
          Meaning *
        </label>
        <textarea
          id="meaning"
          value={values.meaning}
          onChange={(event) => setValues((current) => ({ ...current, meaning: event.target.value }))}
          className="vocca-input"
          rows={3}
          placeholder="What does it mean?"
        />
      </div>

      <div>
        <label htmlFor="example" className="mb-1.5 block text-sm font-bold text-vocca-ink">
          Example sentence
        </label>
        <textarea
          id="example"
          value={values.example}
          onChange={(event) => setValues((current) => ({ ...current, example: event.target.value }))}
          className="vocca-input"
          rows={3}
          placeholder="Use it in a sentence..."
        />
      </div>

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

      <button type="submit" disabled={submitting || !canSubmit} className="vocca-btn-primary w-full sm:w-auto">
        {submitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
