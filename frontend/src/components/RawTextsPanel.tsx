import { type FormEvent, useState } from "react";
import type { RawTextListItem } from "../lib/api";

type RawTextsPanelProps = {
  disabled: boolean;
  rawTexts: RawTextListItem[];
  selectedRawTextId: string | null;
  onSelectRawText: (rawTextId: string) => void;
  onCreateRawText: (title: string, content: string) => Promise<void>;
  createPending: boolean;
  createError: string | null;
};

export function RawTextsPanel({
  disabled,
  rawTexts,
  selectedRawTextId,
  onSelectRawText,
  onCreateRawText,
  createPending,
  createError,
}: RawTextsPanelProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const t = title.trim();
    const c = content.trim();
    if (!t || !c) {
      return;
    }
    await onCreateRawText(t, c);
    setTitle("");
    setContent("");
  }

  if (disabled) {
    return (
      <section className="panel panel-muted" aria-label="Raw texts">
        <h2>Raw texts</h2>
        <p className="muted">Select a project to list and create raw texts.</p>
      </section>
    );
  }

  return (
    <section className="panel" aria-label="Raw texts">
      <h2>Raw texts</h2>
      {rawTexts.length === 0 ? (
        <p className="muted">No raw texts in this project yet.</p>
      ) : (
        <ul className="select-list">
          {rawTexts.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className={`select-list-item${selectedRawTextId === r.id ? " is-selected" : ""}`}
                onClick={() => {
                  onSelectRawText(r.id);
                }}
              >
                {r.title}
                <span className="item-meta">
                  {" "}
                  ({r.origin})
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <form className="stack-form" onSubmit={handleCreate}>
        <h3 className="subheading">New raw text</h3>
        <div className="form-field">
          <label htmlFor="raw-title">Title</label>
          <input
            id="raw-title"
            name="title"
            value={title}
            onChange={(ev) => {
              setTitle(ev.target.value);
            }}
            required
            minLength={1}
            maxLength={255}
          />
        </div>
        <div className="form-field">
          <label htmlFor="raw-content">Content</label>
          <textarea
            id="raw-content"
            name="content"
            value={content}
            onChange={(ev) => {
              setContent(ev.target.value);
            }}
            required
            minLength={1}
            rows={6}
          />
        </div>
        <button type="submit" disabled={createPending}>
          {createPending ? "Saving…" : "Create raw text"}
        </button>
        {createError ? (
          <p className="form-error" role="alert">
            {createError}
          </p>
        ) : null}
      </form>
    </section>
  );
}
