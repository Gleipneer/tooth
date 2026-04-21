import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSession } from "../app/session";
import { AIAssistPanel } from "../components/AIAssistPanel";
import { textareaEditorAdapter } from "../editor/adapter";
import {
  createProject,
  createDraft,
  createRawText,
  freezeDraft,
  getDraft,
  importRawTextFile,
  listDraftVersions,
  listDrafts,
  listProjects,
  listRawTexts,
  saveDraftVersion,
} from "../lib/api";

export function WriterModeScreen() {
  const { token } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const selectedProjectId = searchParams.get("project");
  const selectedRawTextId = searchParams.get("raw");
  const selectedDraftId = searchParams.get("draft");

  const [draftEditContent, setDraftEditContent] = useState("");
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [quickPaste, setQuickPaste] = useState("");
  const [showNewPage, setShowNewPage] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [versionTitle, setVersionTitle] = useState("");
  const [autoCreateError, setAutoCreateError] = useState<string | null>(null);

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => listProjects(token!),
    enabled: Boolean(token),
  });
  const rawTextsQuery = useQuery({
    queryKey: ["rawTexts", selectedProjectId],
    queryFn: () => listRawTexts(selectedProjectId!, token!),
    enabled: Boolean(token && selectedProjectId),
  });
  const draftDetailQuery = useQuery({
    queryKey: ["draftDetail", selectedDraftId],
    queryFn: () => getDraft(selectedDraftId!, token!),
    enabled: Boolean(token && selectedDraftId),
  });
  const versionsQuery = useQuery({
    queryKey: ["draftVersions", selectedDraftId],
    queryFn: () => listDraftVersions(selectedDraftId!, token!),
    enabled: Boolean(token && selectedDraftId),
  });

  useEffect(() => {
    if (!selectedProjectId && (projectsQuery.data ?? []).length > 0) {
      setSearchParams({ project: projectsQuery.data![0].id });
    }
  }, [projectsQuery.data, selectedProjectId, setSearchParams]);

  useEffect(() => {
    setDraftEditContent(draftDetailQuery.data?.content ?? "");
  }, [draftDetailQuery.data?.id]);

  const createRawMutation = useMutation({
    mutationFn: ({ title, content }: { title: string; content: string }) =>
      createRawText(selectedProjectId!, { title, content }, token!),
  });
  const createProjectMutation = useMutation({
    mutationFn: (name: string) => createProject({ name }, token!),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setSearchParams({ project: created.id });
      setNewProjectName("");
    },
  });
  const importRawMutation = useMutation({
    mutationFn: (file: File) => importRawTextFile(selectedProjectId!, file, token!),
  });
  const saveVersionMutation = useMutation({
    mutationFn: ({ title }: { title?: string | null }) =>
      saveDraftVersion(selectedDraftId!, { content: draftEditContent, title: title || undefined }, token!),
    onSuccess: (saved) => {
      setSearchParams({ project: selectedProjectId!, raw: selectedRawTextId!, draft: saved.id });
      setVersionTitle("");
      queryClient.invalidateQueries({ queryKey: ["draftDetail", saved.id] });
      queryClient.invalidateQueries({ queryKey: ["draftVersions", saved.id] });
    },
  });
  const freezeMutation = useMutation({
    mutationFn: () => freezeDraft(selectedDraftId!, token!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["draftDetail", selectedDraftId] }),
  });

  async function ensureWorkingDraft(rawTextId: string, preferredTitle: string): Promise<string> {
    const existingDrafts = await listDrafts(selectedProjectId!, token!, { rawTextId });
    if (existingDrafts.length > 0) {
      return existingDrafts[0].id;
    }
    const createdDraft = await createDraft(rawTextId, { title: `${preferredTitle} draft`, branch_name: "main" }, token!);
    return createdDraft.id;
  }

  async function openPage(rawTextId: string, preferredTitle: string) {
    try {
      setAutoCreateError(null);
      const draftId = await ensureWorkingDraft(rawTextId, preferredTitle);
      setSearchParams({ project: selectedProjectId!, raw: rawTextId, draft: draftId });
    } catch (error) {
      setAutoCreateError(error instanceof Error ? error.message : "Could not open page");
    }
  }

  useEffect(() => {
    if (!token || !selectedProjectId || !selectedRawTextId || selectedDraftId) return;
    void openPage(selectedRawTextId, "Selected page");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedProjectId, selectedRawTextId, selectedDraftId]);

  const activePageTitle = useMemo(
    () => rawTextsQuery.data?.find((p) => p.id === selectedRawTextId)?.title ?? "Untitled page",
    [rawTextsQuery.data, selectedRawTextId],
  );

  const createPagePending = createRawMutation.isPending || importRawMutation.isPending;
  const frozen = draftDetailQuery.data?.status === "frozen";
  const hasPages = (rawTextsQuery.data ?? []).length > 0;

  return (
    <section className="writer-mode-grid">
      <aside className="panel writer-left">
        <h2>Pages</h2>
        <div className="inline-form">
          <input
            placeholder="New project"
            value={newProjectName}
            onChange={(event) => setNewProjectName(event.target.value)}
            disabled={createProjectMutation.isPending}
          />
          <button
            type="button"
            disabled={!newProjectName.trim() || createProjectMutation.isPending}
            onClick={() => createProjectMutation.mutate(newProjectName.trim())}
          >
            {createProjectMutation.isPending ? "Creating..." : "Create"}
          </button>
        </div>
        <select
          value={selectedProjectId ?? ""}
          onChange={(event) => {
            const project = event.target.value;
            setSearchParams(project ? { project } : {});
          }}
        >
          <option value="">Select project</option>
          {(projectsQuery.data ?? []).map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        {createProjectMutation.error instanceof Error ? (
          <p className="form-error">{createProjectMutation.error.message}</p>
        ) : null}
        <div className="studio-links">
          <Link to={`/books${selectedProjectId ? `?project=${selectedProjectId}` : ""}`}>Books</Link>
          <Link to={`/search${selectedProjectId ? `?project=${selectedProjectId}` : ""}`}>Search</Link>
          <Link to={`/ingest${selectedProjectId ? `?project=${selectedProjectId}` : ""}`}>Inbox / Fragments</Link>
        </div>
        <div className="inline-form">
          <button type="button" onClick={() => setShowNewPage((v) => !v)} disabled={!selectedProjectId}>
            New page
          </button>
          <button type="button" onClick={() => setShowPaste((v) => !v)} disabled={!selectedProjectId}>
            Paste text
          </button>
        </div>
        <input
          type="file"
          accept=".txt,.md,text/plain,text/markdown"
          aria-label="Import file"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file || !selectedProjectId) return;
            try {
              const created = await importRawMutation.mutateAsync(file);
              const draftId = await ensureWorkingDraft(created.id, created.title);
              setSearchParams({ project: selectedProjectId, raw: created.id, draft: draftId });
              queryClient.invalidateQueries({ queryKey: ["rawTexts", selectedProjectId] });
            } catch (error) {
              setAutoCreateError(error instanceof Error ? error.message : "Could not import text");
            } finally {
              event.target.value = "";
            }
          }}
        />
        <div className="page-list">
          {(rawTextsQuery.data ?? []).map((rawText) => (
            <button
              key={rawText.id}
              type="button"
              className={rawText.id === selectedRawTextId ? "page-chip is-active" : "page-chip"}
              onClick={() => openPage(rawText.id, rawText.title)}
            >
              {rawText.title}
            </button>
          ))}
          {!rawTextsQuery.isLoading && !hasPages ? <p className="muted">No pages yet.</p> : null}
        </div>
      </aside>

      <section className="panel writer-center">
        <header className="writer-page-header">
          <div>
            <p className="muted">Current page</p>
            <h2>{selectedDraftId ? activePageTitle : "Start writing"}</h2>
          </div>
          {selectedDraftId ? (
            <div className="inline-form">
              <input
                placeholder="Checkpoint title (optional)"
                value={versionTitle}
                onChange={(event) => setVersionTitle(event.target.value)}
                disabled={saveVersionMutation.isPending || frozen}
              />
              <button
                type="button"
                disabled={saveVersionMutation.isPending || frozen}
                onClick={() => saveVersionMutation.mutate({ title: versionTitle || null })}
              >
                {saveVersionMutation.isPending ? "Saving..." : "Save"}
              </button>
              <button type="button" disabled={freezeMutation.isPending || frozen} onClick={() => freezeMutation.mutate()}>
                {freezeMutation.isPending ? "Freezing..." : "Freeze"}
              </button>
            </div>
          ) : null}
        </header>

        {!selectedProjectId ? <p className="muted">Select a project to enter Writer Mode.</p> : null}

        {selectedProjectId && !hasPages ? (
          <section className="writer-empty-state">
            <h3>Start writing</h3>
            <p className="muted">Create a page, paste your source text, or import a file to begin.</p>
            <div className="inline-form">
              <button type="button" onClick={() => setShowNewPage(true)}>
                Start writing
              </button>
              <button type="button" onClick={() => setShowPaste(true)}>
                Paste text
              </button>
            </div>
          </section>
        ) : null}

        {showNewPage ? (
          <div className="stack-form">
            <div className="inline-form">
              <input
                placeholder="Page title"
                value={newPageTitle}
                onChange={(event) => setNewPageTitle(event.target.value)}
                disabled={!selectedProjectId || createPagePending}
              />
              <button
                type="button"
                disabled={!selectedProjectId || !newPageTitle.trim() || createPagePending}
                onClick={async () => {
                  try {
                    setAutoCreateError(null);
                    const created = await createRawMutation.mutateAsync({
                      title: newPageTitle.trim(),
                      content: "Start writing...",
                    });
                    const draftId = await ensureWorkingDraft(created.id, created.title);
                    setSearchParams({ project: selectedProjectId!, raw: created.id, draft: draftId });
                    setNewPageTitle("");
                    setShowNewPage(false);
                    queryClient.invalidateQueries({ queryKey: ["rawTexts", selectedProjectId] });
                  } catch (error) {
                    setAutoCreateError(error instanceof Error ? error.message : "Could not create page");
                  }
                }}
              >
                Create page
              </button>
            </div>
          </div>
        ) : null}

        {showPaste ? (
          <div className="stack-form">
            <textarea
              placeholder="Paste text to create a writable page..."
              value={quickPaste}
              onChange={(event) => setQuickPaste(event.target.value)}
              disabled={!selectedProjectId || createPagePending}
            />
            <div className="inline-form">
              <button
                type="button"
                disabled={!selectedProjectId || !quickPaste.trim() || createPagePending}
                onClick={async () => {
                  try {
                    setAutoCreateError(null);
                    const created = await createRawMutation.mutateAsync({
                      title: "Pasted page",
                      content: quickPaste.trim(),
                    });
                    const draftId = await ensureWorkingDraft(created.id, created.title);
                    setSearchParams({ project: selectedProjectId!, raw: created.id, draft: draftId });
                    setQuickPaste("");
                    setShowPaste(false);
                    queryClient.invalidateQueries({ queryKey: ["rawTexts", selectedProjectId] });
                  } catch (error) {
                    setAutoCreateError(error instanceof Error ? error.message : "Could not create page from paste");
                  }
                }}
              >
                Create page from paste
              </button>
            </div>
          </div>
        ) : null}

        {autoCreateError ? <p className="form-error">{autoCreateError}</p> : null}

        {selectedDraftId ? (
          <textareaEditorAdapter.Component value={draftEditContent} onChange={setDraftEditContent} disabled={frozen} />
        ) : (
          <p className="muted">Continue writing by opening a page from the left.</p>
        )}

        {selectedDraftId ? (
          <p className="muted">Versions: {(versionsQuery.data ?? []).length} · Drafts and versions are managed automatically.</p>
        ) : null}
      </section>

      <aside className="panel writer-right">
        <h2>Ask AI about this page</h2>
        {selectedProjectId && selectedDraftId ? (
          <AIAssistPanel token={token!} projectId={selectedProjectId} draftId={selectedDraftId} />
        ) : (
          <p className="muted">Open a page to attach chat context to the current writing.</p>
        )}
      </aside>
    </section>
  );
}
