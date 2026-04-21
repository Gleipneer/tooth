import { type FormEvent, useState } from "react";
import type { DraftListItem } from "../lib/api";

type DraftsPanelProps = {
  disabled: boolean;
  drafts: DraftListItem[];
  selectedDraftId: string | null;
  onSelectDraft: (draftId: string) => void;
  onCreateDraft: (title: string, branchName: string) => Promise<void>;
  createPending: boolean;
  createError: string | null;
};

export function DraftsPanel({
  disabled,
  drafts,
  selectedDraftId,
  onSelectDraft,
  onCreateDraft,
  createPending,
  createError,
}: DraftsPanelProps) {
  const [title, setTitle] = useState("");
  const [branchName, setBranchName] = useState("main");

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const t = title.trim();
    const b = branchName.trim() || "main";
    if (!t) {
      return;
    }
    await onCreateDraft(t, b);
    setTitle("");
    setBranchName("main");
  }

  if (disabled) {
    return (
      <section className="panel panel-muted" aria-label="Drafts">
        <h2>Drafts</h2>
        <p className="muted">Select a raw text to list and create drafts.</p>
      </section>
    );
  }

  return (
    <section className="panel" aria-label="Drafts">
      <h2>Drafts</h2>
      {drafts.length === 0 ? (
        <p className="muted">No drafts for this raw text yet.</p>
      ) : (
        <ul className="select-list">
          {drafts.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                className={`select-list-item${selectedDraftId === d.id ? " is-selected" : ""}`}
                onClick={() => {
                  onSelectDraft(d.id);
                }}
              >
                {d.title}
                <span className="item-meta">
                  {" "}
                  ({d.branch_name})
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <form className="stack-form" onSubmit={handleCreate}>
        <h3 className="subheading">New draft</h3>
        <div className="form-field">
          <label htmlFor="draft-title">Title</label>
          <input
            id="draft-title"
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
          <label htmlFor="draft-branch">Branch</label>
          <input
            id="draft-branch"
            name="branch"
            value={branchName}
            onChange={(ev) => {
              setBranchName(ev.target.value);
            }}
            required
            minLength={1}
            maxLength={120}
          />
        </div>
        <button type="submit" disabled={createPending}>
          {createPending ? "Creating…" : "Create draft"}
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
