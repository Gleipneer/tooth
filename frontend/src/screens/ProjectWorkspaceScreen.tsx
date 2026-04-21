import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSession } from "../app/session";
import { AIAssistPanel } from "../components/AIAssistPanel";
import {
  createDraft,
  createProject,
  createRawText,
  freezeDraft,
  getDraft,
  importRawTextFile,
  listDrafts,
  listDraftVersions,
  listProjects,
  listRawTexts,
  saveDraftVersion,
  unfreezeDraft,
} from "../lib/api";
import { textareaEditorAdapter } from "../editor/adapter";

export function ProjectWorkspaceScreen() {
  const { token } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const selectedProjectId = searchParams.get("project");
  const selectedRawTextId = searchParams.get("raw");
  const selectedDraftId = searchParams.get("draft");

  const [draftEditContent, setDraftEditContent] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageContent, setNewPageContent] = useState("");
  const [autoCreateError, setAutoCreateError] = useState<string | null>(null);
  const [versionTitle, setVersionTitle] = useState("");

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
    setDraftEditContent(draftDetailQuery.data?.content ?? "");
  }, [draftDetailQuery.data?.id]);

  const createProjectMutation = useMutation({
    mutationFn: (name: string) => createProject({ name }, token!),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setSearchParams({ project: created.id, raw: "", draft: "" });
      setNewProjectName("");
    },
  });
  const createRawMutation = useMutation({
    mutationFn: ({ title, content }: { title: string; content: string }) =>
      createRawText(selectedProjectId!, { title, content }, token!),
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
      queryClient.invalidateQueries({ queryKey: ["drafts", selectedProjectId, selectedRawTextId] });
      queryClient.invalidateQueries({ queryKey: ["draftDetail", saved.id] });
      queryClient.invalidateQueries({ queryKey: ["draftVersions", saved.id] });
    },
  });
  const freezeMutation = useMutation({
    mutationFn: () => freezeDraft(selectedDraftId!, token!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["draftDetail", selectedDraftId] }),
  });
  const unfreezeMutation = useMutation({
    mutationFn: () => unfreezeDraft(selectedDraftId!, token!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["draftDetail", selectedDraftId] }),
  });

  async function ensureWorkingDraft(rawTextId: string, preferredTitle: string): Promise<string> {
    const existingDrafts = await listDrafts(selectedProjectId!, token!, { rawTextId });
    if (existingDrafts.length > 0) {
      return existingDrafts[0].id;
    }
    const createdDraft = await createDraft(
      rawTextId,
      { title: `${preferredTitle} draft`, branch_name: "main" },
      token!,
    );
    return createdDraft.id;
  }

  useEffect(() => {
    if (!token || !selectedProjectId || !selectedRawTextId || selectedDraftId) {
      return;
    }
    void openPage(selectedRawTextId, "Selected page");
    // Intentionally depends on route selection state only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedProjectId, selectedRawTextId, selectedDraftId]);

  async function openPage(rawTextId: string, preferredTitle: string) {
    try {
      setAutoCreateError(null);
      const draftId = await ensureWorkingDraft(rawTextId, preferredTitle);
      setSearchParams({ project: selectedProjectId!, raw: rawTextId, draft: draftId });
      queryClient.invalidateQueries({ queryKey: ["drafts", selectedProjectId, rawTextId] });
    } catch (error) {
      setAutoCreateError(error instanceof Error ? error.message : "Could not open page");
    }
  }

  const draftError = useMemo(
    () =>
      saveVersionMutation.error instanceof Error
        ? saveVersionMutation.error.message
        : freezeMutation.error instanceof Error
          ? freezeMutation.error.message
          : unfreezeMutation.error instanceof Error
            ? unfreezeMutation.error.message
              : null,
    [freezeMutation.error, saveVersionMutation.error, unfreezeMutation.error],
  );

  const createPagePending = createRawMutation.isPending || importRawMutation.isPending;

  return (
    <section className="writing-studio-grid">
      <aside className="panel studio-left">
        <h2>Projects</h2>
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
        <div className="inline-form">
          <input
            placeholder="New project name"
            value={newProjectName}
            onChange={(event) => setNewProjectName(event.target.value)}
          />
          <button
            type="button"
            disabled={!newProjectName.trim() || createProjectMutation.isPending}
            onClick={() => createProjectMutation.mutate(newProjectName.trim())}
          >
            {createProjectMutation.isPending ? "Creating..." : "Create project"}
          </button>
        </div>
        {createProjectMutation.error instanceof Error ? <p className="form-error">{createProjectMutation.error.message}</p> : null}
        <hr />
        <h2>Pages</h2>
        <p className="muted">Select a page and keep writing. Drafts are managed automatically.</p>
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
          {!rawTextsQuery.isLoading && (rawTextsQuery.data ?? []).length === 0 ? (
            <p className="muted">No pages yet. Use New page or Paste text.</p>
          ) : null}
        </div>
        <div className="studio-links">
          <Link to={`/books${selectedProjectId ? `?project=${selectedProjectId}` : ""}`}>Open books workspace</Link>
          <Link to={`/ingest${selectedProjectId ? `?project=${selectedProjectId}` : ""}`}>Open fragments review</Link>
        </div>
      </aside>

      <section className="panel studio-center">
        <h2>Page canvas</h2>
        {!selectedProjectId ? <p className="muted">Select a project to start writing.</p> : null}
        <div className="inline-form">
          <input
            placeholder="New page title"
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
                  content: newPageContent.trim() || "Start writing...",
                });
                const draftId = await ensureWorkingDraft(created.id, created.title);
                setSearchParams({ project: selectedProjectId!, raw: created.id, draft: draftId });
                setNewPageTitle("");
                setNewPageContent("");
                queryClient.invalidateQueries({ queryKey: ["rawTexts", selectedProjectId] });
              } catch (error) {
                setAutoCreateError(error instanceof Error ? error.message : "Could not create page");
              }
            }}
          >
            {createPagePending ? "Creating..." : "New page"}
          </button>
        </div>
        <textarea
          placeholder="Optional opening text..."
          value={newPageContent}
          onChange={(event) => setNewPageContent(event.target.value)}
          disabled={!selectedProjectId || createPagePending}
        />
        <div className="inline-form">
          <input
            type="file"
            accept=".txt,.md,text/plain,text/markdown"
            disabled={!selectedProjectId || createPagePending}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file || !selectedProjectId) return;
              try {
                setAutoCreateError(null);
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
        </div>
        {autoCreateError ? <p className="form-error">{autoCreateError}</p> : null}

        <hr />
        {selectedDraftId ? (
          <>
            <p className="muted">
              Editing with <strong>{textareaEditorAdapter.label}</strong>. Internal draft/version objects are preserved.
            </p>
            <textareaEditorAdapter.Component
              value={draftEditContent}
              onChange={setDraftEditContent}
              disabled={draftDetailQuery.data?.status === "frozen"}
            />
            <div className="inline-form">
              <input
                placeholder="Version title (optional)"
                value={versionTitle}
                onChange={(event) => setVersionTitle(event.target.value)}
                disabled={saveVersionMutation.isPending || draftDetailQuery.data?.status === "frozen"}
              />
              <button
                type="button"
                disabled={saveVersionMutation.isPending || draftDetailQuery.data?.status === "frozen"}
                onClick={() => saveVersionMutation.mutate({ title: versionTitle || null })}
              >
                {saveVersionMutation.isPending ? "Saving..." : "Save version"}
              </button>
              <button
                type="button"
                disabled={freezeMutation.isPending || draftDetailQuery.data?.status === "frozen"}
                onClick={() => freezeMutation.mutate()}
              >
                Freeze
              </button>
              <button
                type="button"
                disabled={unfreezeMutation.isPending || draftDetailQuery.data?.status !== "frozen"}
                onClick={() => unfreezeMutation.mutate()}
              >
                Unfreeze
              </button>
            </div>
            {draftError ? <p className="form-error">{draftError}</p> : null}
            <div className="next-actions">
              <h3>Next actions</h3>
              <p className="muted">Ask AI for revision suggestions, save a checkpoint, or continue writing directly.</p>
              <p className="muted">
                Versions on this page: {(versionsQuery.data ?? []).length}
              </p>
            </div>
          </>
        ) : (
          <p className="muted">Pick or create a page to open a working draft automatically.</p>
        )}
      </section>

      <aside className="panel studio-right">
        <h2>AI assistant</h2>
        {selectedProjectId && selectedDraftId ? (
          <AIAssistPanel token={token!} projectId={selectedProjectId} draftId={selectedDraftId} />
        ) : (
          <p className="muted">Select a page to attach AI chat to its current writing context.</p>
        )}
        <div className="studio-links">
          <Link to={`/search${selectedProjectId ? `?project=${selectedProjectId}` : ""}`}>Search project references</Link>
          <Link to={`/ingest${selectedProjectId ? `?project=${selectedProjectId}` : ""}`}>Review pasted fragments</Link>
        </div>
      </aside>
    </section>
  );
}
