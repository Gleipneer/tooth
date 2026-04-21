import { type FormEvent, useState } from "react";
import type { DraftDiffResponse, DraftListItem, DraftResponse, RawTextImportResponse } from "../lib/api";

type DetailPanelsProps = {
  rawText: RawTextImportResponse | null;
  rawTextLoading: boolean;
  rawTextError: string | null;
  draft: DraftResponse | null;
  draftLoading: boolean;
  draftError: string | null;
  selectedDraftId: string | null;
  draftEditContent: string;
  onDraftEditContentChange: (value: string) => void;
  onSaveDraftVersion: (opts?: { title?: string | null }) => Promise<void>;
  saveVersionPending: boolean;
  saveVersionError: string | null;
  draftVersions: DraftListItem[];
  draftVersionsLoading: boolean;
  draftVersionsError: string | null;
  onSelectVersionDraft: (draftId: string) => void;
  draftDiff: DraftDiffResponse | null;
  draftDiffLoading: boolean;
  onBranchDraft: (title: string, branchName: string) => Promise<void>;
  branchPending: boolean;
  branchError: string | null;
  onFreezeDraft: () => Promise<void>;
  onUnfreezeDraft: () => Promise<void>;
  freezePending: boolean;
  unfreezePending: boolean;
  freezeUnfreezeError: string | null;
};

export function DetailPanels({
  rawText,
  rawTextLoading,
  rawTextError,
  draft,
  draftLoading,
  draftError,
  selectedDraftId,
  draftEditContent,
  onDraftEditContentChange,
  onSaveDraftVersion,
  saveVersionPending,
  saveVersionError,
  draftVersions,
  draftVersionsLoading,
  draftVersionsError,
  onSelectVersionDraft,
  draftDiff,
  draftDiffLoading,
  onBranchDraft,
  branchPending,
  branchError,
  onFreezeDraft,
  onUnfreezeDraft,
  freezePending,
  unfreezePending,
  freezeUnfreezeError,
}: DetailPanelsProps) {
  const [saveTitle, setSaveTitle] = useState("");
  const [branchTitle, setBranchTitle] = useState("");
  const [branchName, setBranchName] = useState("");

  const frozen = draft?.status === "frozen";
  const editorDisabled = !draft || draftLoading || Boolean(draftError) || frozen;

  async function handleSaveVersion(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const t = saveTitle.trim();
    await onSaveDraftVersion({ title: t.length > 0 ? t : undefined });
    setSaveTitle("");
  }

  async function handleBranch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const t = branchTitle.trim();
    const b = branchName.trim();
    if (!t || !b) {
      return;
    }
    await onBranchDraft(t, b);
    setBranchTitle("");
    setBranchName("");
  }

  return (
    <div className="detail-grid">
      <section className="panel" aria-label="Raw text detail">
        <h2>Raw text detail</h2>
        {rawTextLoading ? <p aria-busy="true">Loading…</p> : null}
        {rawTextError ? (
          <p className="status-fail" role="alert">
            {rawTextError}
          </p>
        ) : null}
        {!rawTextLoading && !rawTextError && !rawText ? (
          <p className="muted">Select a raw text to view its content.</p>
        ) : null}
        {rawText ? (
          <div className="detail-block">
            <dl className="detail-meta">
              <div>
                <dt>Title</dt>
                <dd>{rawText.title}</dd>
              </div>
              <div>
                <dt>Origin</dt>
                <dd>{rawText.origin}</dd>
              </div>
              <div>
                <dt>Media type</dt>
                <dd>{rawText.media_type}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{rawText.created_at}</dd>
              </div>
            </dl>
            <h3 className="subheading">Content</h3>
            <pre className="detail-pre">{rawText.content}</pre>
          </div>
        ) : null}
      </section>
      <section className="panel" aria-label="Draft detail">
        <h2>Draft detail</h2>
        {draftLoading ? <p aria-busy="true">Loading…</p> : null}
        {draftError ? (
          <p className="status-fail" role="alert">
            {draftError}
          </p>
        ) : null}
        {!draftLoading && !draftError && !draft ? (
          <p className="muted">Select or create a draft to view its content.</p>
        ) : null}
        {draft ? (
          <div className="detail-block">
            <dl className="detail-meta">
              <div>
                <dt>Title</dt>
                <dd>{draft.title}</dd>
              </div>
              <div>
                <dt>Branch</dt>
                <dd>{draft.branch_name}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{draft.status}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{draft.created_at}</dd>
              </div>
            </dl>

            <div className="draft-actions">
              <button type="button" disabled={freezePending || frozen} onClick={() => void onFreezeDraft()}>
                {freezePending ? "Freezing…" : "Freeze"}
              </button>
              <button
                type="button"
                disabled={unfreezePending || !frozen}
                onClick={() => void onUnfreezeDraft()}
              >
                {unfreezePending ? "Unfreezing…" : "Unfreeze"}
              </button>
            </div>
            {freezeUnfreezeError ? (
              <p className="form-error" role="alert">
                {freezeUnfreezeError}
              </p>
            ) : null}
            {frozen ? (
              <p className="muted draft-frozen-note">This draft is frozen; editing and new versions are disabled.</p>
            ) : null}

            <h3 className="subheading">Edit content</h3>
            <textarea
              className="draft-editor"
              aria-label="Draft content"
              value={draftEditContent}
              onChange={(ev) => {
                onDraftEditContentChange(ev.target.value);
              }}
              disabled={editorDisabled}
              rows={12}
            />

            <form className="stack-form" onSubmit={(e) => void handleSaveVersion(e)}>
              <h3 className="subheading">Save new version</h3>
              <div className="form-field">
                <label htmlFor="save-version-title">Version title (optional)</label>
                <input
                  id="save-version-title"
                  name="save_version_title"
                  value={saveTitle}
                  onChange={(ev) => {
                    setSaveTitle(ev.target.value);
                  }}
                  maxLength={255}
                  disabled={editorDisabled || saveVersionPending}
                />
              </div>
              <button
                type="submit"
                disabled={editorDisabled || saveVersionPending || !draftEditContent.trim()}
              >
                {saveVersionPending ? "Saving…" : "Save version"}
              </button>
              {saveVersionError ? (
                <p className="form-error" role="alert">
                  {saveVersionError}
                </p>
              ) : null}
            </form>

            <h3 className="subheading">Versions on this branch</h3>
            {draftVersionsLoading ? <p aria-busy="true">Loading history…</p> : null}
            {draftVersionsError ? (
              <p className="status-fail" role="alert">
                {draftVersionsError}
              </p>
            ) : null}
            {!draftVersionsLoading && !draftVersionsError && draftVersions.length === 0 ? (
              <p className="muted">No versions listed.</p>
            ) : null}
            {draftVersions.length > 0 ? (
              <ul className="select-list draft-version-list">
                {draftVersions.map((v) => (
                  <li key={v.id}>
                    <button
                      type="button"
                      className={`select-list-item${selectedDraftId === v.id ? " is-selected" : ""}`}
                      onClick={() => {
                        onSelectVersionDraft(v.id);
                      }}
                    >
                      {v.title}
                      <span className="item-meta">
                        {" "}
                        ({v.status}) · {v.created_at}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <h3 className="subheading">Diff vs baseline</h3>
            <p className="muted diff-hint">Unified diff for the saved draft on the server (not unsaved edits).</p>
            {draftDiffLoading ? <p aria-busy="true">Loading diff…</p> : null}
            {draftDiff ? (
              <div className="diff-meta">
                <span>Baseline: {draftDiff.baseline_type}</span>
              </div>
            ) : null}
            {!draftDiffLoading && draftDiff && draftDiff.diff.length === 0 ? (
              <p className="muted">No differences (empty diff).</p>
            ) : null}
            {draftDiff && draftDiff.diff.length > 0 ? (
              <pre className="detail-pre diff-pre" aria-label="Draft unified diff">
                {draftDiff.diff}
              </pre>
            ) : null}

            <form className="stack-form" onSubmit={(e) => void handleBranch(e)}>
              <h3 className="subheading">New branch from this draft</h3>
              <p className="muted branch-hint">
              When the editor has text, that content is sent; otherwise the server copies from the saved draft file.
            </p>
              <div className="form-field">
                <label htmlFor="branch-draft-title">Title</label>
                <input
                  id="branch-draft-title"
                  name="branch_title"
                  value={branchTitle}
                  onChange={(ev) => {
                    setBranchTitle(ev.target.value);
                  }}
                  required
                  minLength={1}
                  maxLength={255}
                  disabled={draftLoading || Boolean(draftError) || branchPending}
                />
              </div>
              <div className="form-field">
                <label htmlFor="branch-draft-name">Branch name</label>
                <input
                  id="branch-draft-name"
                  name="branch_name"
                  value={branchName}
                  onChange={(ev) => {
                    setBranchName(ev.target.value);
                  }}
                  required
                  minLength={1}
                  maxLength={120}
                  disabled={draftLoading || Boolean(draftError) || branchPending}
                />
              </div>
              <button type="submit" disabled={draftLoading || Boolean(draftError) || branchPending}>
                {branchPending ? "Creating…" : "Create branch"}
              </button>
              {branchError ? (
                <p className="form-error" role="alert">
                  {branchError}
                </p>
              ) : null}
            </form>
          </div>
        ) : null}
      </section>
    </div>
  );
}
