"use client";

import { FormEvent, useEffect, useState } from "react";

import { getListRepository, type ListWithWordCount } from "@/data/list-repository";

type ListItemProps = {
  item: ListWithWordCount;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

function ListItem({ item, onRename, onDelete }: ListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(item.name);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setNameDraft(item.name);
  }, [item.name]);

  async function handleRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextName = nameDraft.trim();
    if (!nextName || nextName === item.name) {
      setIsEditing(false);
      setNameDraft(item.name);
      return;
    }

    setPending(true);
    try {
      await onRename(item.id, nextName);
      setIsEditing(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <li className="rounded-md border border-zinc-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        {isEditing ? (
          <form onSubmit={handleRename} className="flex flex-1 items-center gap-2">
            <input
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm"
              autoFocus
            />
            <button
              type="submit"
              disabled={pending || nameDraft.trim().length === 0}
              className="rounded-md border border-zinc-300 px-2 py-1 text-sm hover:bg-zinc-50 disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setIsEditing(false);
                setNameDraft(item.name);
              }}
              className="rounded-md border border-zinc-300 px-2 py-1 text-sm hover:bg-zinc-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </form>
        ) : (
          <>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-900">{item.name}</p>
              <p className="text-xs text-zinc-600">
                {item.wordCount} {item.wordCount === 1 ? "word" : "words"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded-md border border-zinc-300 px-2 py-1 text-sm hover:bg-zinc-50"
              >
                Rename
              </button>
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="rounded-md border border-red-200 px-2 py-1 text-sm text-red-700 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </li>
  );
}

export default function ListsPage() {
  const [lists, setLists] = useState<ListWithWordCount[]>([]);
  const [newListName, setNewListName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getListRepository()
      .list()
      .then((items) => {
        setLists(items);
        setError(null);
      })
      .catch(() => setError("Could not load lists. Please refresh."))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newListName.trim();
    if (!name) return;

    setCreating(true);
    try {
      const created = await getListRepository().create(name);
      const createdWithCount: ListWithWordCount = { ...created, wordCount: 0 };
      setLists((prev) => [createdWithCount, ...prev]);
      setNewListName("");
      setError(null);
    } catch {
      setError("Could not create list. If the name already exists, pick another one.");
    } finally {
      setCreating(false);
    }
  }

  async function handleRename(id: string, name: string) {
    const updated = await getListRepository().rename(id, name);
    if (!updated) {
      setError("Could not rename list.");
      return;
    }

    setLists((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name: updated.name, updatedAt: updated.updatedAt } : item)),
    );
    setError(null);
  }

  async function handleDelete(id: string) {
    try {
      await getListRepository().remove(id);
      setLists((prev) => prev.filter((item) => item.id !== id));
      setError(null);
    } catch {
      setError("Could not delete list.");
    }
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Lists</h1>

      <form onSubmit={handleCreate} className="flex gap-2 rounded-lg border border-zinc-200 bg-white p-3">
        <input
          value={newListName}
          onChange={(event) => setNewListName(event.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          placeholder="Add a new list (e.g. Business English)"
        />
        <button
          type="submit"
          disabled={creating || newListName.trim().length === 0}
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {creating ? "Adding..." : "Add"}
        </button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-zinc-600">Loading lists...</p>
      ) : error ? null : lists.length === 0 ? (
        <p className="text-sm text-zinc-600">No lists yet.</p>
      ) : (
        <ul className="space-y-2">
          {lists.map((item) => (
            <ListItem key={item.id} item={item} onRename={handleRename} onDelete={handleDelete} />
          ))}
        </ul>
      )}
    </section>
  );
}
