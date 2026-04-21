import { useCallback, useEffect, useState } from "react";
import { AIAssistPanel } from "./components/AIAssistPanel";
import { BooksPanel } from "./components/BooksPanel";
import { DetailPanels } from "./components/DetailPanels";
import { PasteIngestPanel } from "./components/PasteIngestPanel";
import { SearchPanel } from "./components/SearchPanel";
import { DraftsPanel } from "./components/DraftsPanel";
import { HealthPanel } from "./components/HealthPanel";
import { LoginForm } from "./components/LoginForm";
import { ProjectsPanel } from "./components/ProjectsPanel";
import { RawTextsPanel } from "./components/RawTextsPanel";
import { UserBar } from "./components/UserBar";
import {
  branchDraft,
  createDraft,
  createProject,
  createRawText,
  type DraftDiffResponse,
  type DraftListItem,
  type DraftResponse,
  freezeDraft,
  fetchMe,
  getDraft,
  getDraftDiff,
  getRawText,
  listDrafts,
  listDraftVersions,
  listProjects,
  listRawTexts,
  type ProjectResponse,
  type RawTextImportResponse,
  type RawTextListItem,
  saveDraftVersion,
  type UserResponse,
  unfreezeDraft,
} from "./lib/api";

export default function App() {
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return window.localStorage.getItem("tooth_access_token");
  });

  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);

  const [projectCreatePending, setProjectCreatePending] = useState(false);
  const [projectCreateError, setProjectCreateError] = useState<string | null>(null);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const [rawTexts, setRawTexts] = useState<RawTextListItem[]>([]);
  const [rawTextsLoading, setRawTextsLoading] = useState(false);
  const [rawTextsError, setRawTextsError] = useState<string | null>(null);

  const [rawTextCreatePending, setRawTextCreatePending] = useState(false);
  const [rawTextCreateError, setRawTextCreateError] = useState<string | null>(null);

  const [selectedRawTextId, setSelectedRawTextId] = useState<string | null>(null);

  const [rawTextDetail, setRawTextDetail] = useState<RawTextImportResponse | null>(null);
  const [drafts, setDrafts] = useState<DraftListItem[]>([]);
  const [rawContextLoading, setRawContextLoading] = useState(false);
  const [rawContextError, setRawContextError] = useState<string | null>(null);

  const [draftCreatePending, setDraftCreatePending] = useState(false);
  const [draftCreateError, setDraftCreateError] = useState<string | null>(null);

  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);

  const [draftDetail, setDraftDetail] = useState<DraftResponse | null>(null);
  const [draftDetailLoading, setDraftDetailLoading] = useState(false);
  const [draftDetailError, setDraftDetailError] = useState<string | null>(null);

  const [draftEditContent, setDraftEditContent] = useState("");
  const [draftVersions, setDraftVersions] = useState<DraftListItem[]>([]);
  const [draftDiff, setDraftDiff] = useState<DraftDiffResponse | null>(null);
  const [draftSidecarError, setDraftSidecarError] = useState<string | null>(null);
  const [draftSidecarLoading, setDraftSidecarLoading] = useState(false);

  const [saveVersionPending, setSaveVersionPending] = useState(false);
  const [saveVersionError, setSaveVersionError] = useState<string | null>(null);
  const [branchPending, setBranchPending] = useState(false);
  const [branchError, setBranchError] = useState<string | null>(null);
  const [freezePending, setFreezePending] = useState(false);
  const [unfreezePending, setUnfreezePending] = useState(false);
  const [freezeUnfreezeError, setFreezeUnfreezeError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setUser(null);
      setSessionError(null);
      setSessionLoading(false);
      setProjects([]);
      setSelectedProjectId(null);
      setRawTexts([]);
      setSelectedRawTextId(null);
      setRawTextDetail(null);
      setDrafts([]);
      setSelectedDraftId(null);
      setDraftDetail(null);
      setDraftEditContent("");
      setDraftVersions([]);
      setDraftDiff(null);
      setDraftSidecarError(null);
      setDraftSidecarLoading(false);
      return;
    }

    let cancelled = false;
    setSessionLoading(true);
    setSessionError(null);
    Promise.all([fetchMe(accessToken), listProjects(accessToken)])
      .then(([me, plist]) => {
        if (!cancelled) {
          setUser(me);
          setProjects(plist);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Session load failed";
          setSessionError(message);
          setUser(null);
          setProjects([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSessionLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    setSelectedRawTextId(null);
    setRawTextDetail(null);
    setDrafts([]);
    setSelectedDraftId(null);
    setDraftDetail(null);
    setDraftDetailError(null);
    setDraftEditContent("");
    setDraftVersions([]);
    setDraftDiff(null);
    setDraftSidecarError(null);
    setDraftSidecarLoading(false);
    setRawContextError(null);
  }, [selectedProjectId]);

  useEffect(() => {
    if (!accessToken || !selectedProjectId) {
      setRawTexts([]);
      setRawTextsLoading(false);
      return;
    }

    let cancelled = false;
    setRawTextsLoading(true);
    setRawTextsError(null);
    listRawTexts(selectedProjectId, accessToken)
      .then((list) => {
        if (!cancelled) {
          setRawTexts(list);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load raw texts";
          setRawTextsError(message);
          setRawTexts([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setRawTextsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, selectedProjectId]);

  useEffect(() => {
    if (!accessToken || !selectedRawTextId || !selectedProjectId) {
      setRawTextDetail(null);
      setDrafts([]);
      setRawContextLoading(false);
      setRawContextError(null);
      return;
    }

    let cancelled = false;
    setRawContextLoading(true);
    setRawContextError(null);
    setRawTextDetail(null);
    setDrafts([]);
    Promise.all([
      getRawText(selectedRawTextId, accessToken),
      listDrafts(selectedProjectId, accessToken, { rawTextId: selectedRawTextId }),
    ])
      .then(([detail, draftList]) => {
        if (!cancelled) {
          setRawTextDetail(detail);
          setDrafts(draftList);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load raw text context";
          setRawContextError(message);
          setRawTextDetail(null);
          setDrafts([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setRawContextLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, selectedProjectId, selectedRawTextId]);

  useEffect(() => {
    setSelectedDraftId(null);
    setDraftDetail(null);
    setDraftDetailError(null);
    setDraftEditContent("");
    setDraftVersions([]);
    setDraftDiff(null);
    setDraftSidecarError(null);
    setDraftSidecarLoading(false);
  }, [selectedRawTextId]);

  useEffect(() => {
    if (!draftDetail) {
      setDraftEditContent("");
      return;
    }
    setDraftEditContent(draftDetail.content);
  }, [draftDetail?.id]);

  useEffect(() => {
    setSaveVersionError(null);
    setBranchError(null);
    setFreezeUnfreezeError(null);
  }, [selectedDraftId]);

  useEffect(() => {
    if (!accessToken || !selectedDraftId) {
      setDraftDetail(null);
      setDraftDetailLoading(false);
      setDraftDetailError(null);
      return;
    }

    let cancelled = false;
    setDraftDetailLoading(true);
    setDraftDetailError(null);
    setDraftDetail(null);
    getDraft(selectedDraftId, accessToken)
      .then((d) => {
        if (!cancelled) {
          setDraftDetail(d);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load draft";
          setDraftDetailError(message);
          setDraftDetail(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDraftDetailLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, selectedDraftId]);

  useEffect(() => {
    if (!accessToken || !selectedDraftId) {
      setDraftVersions([]);
      setDraftDiff(null);
      setDraftSidecarError(null);
      setDraftSidecarLoading(false);
      return;
    }

    let cancelled = false;
    setDraftSidecarLoading(true);
    setDraftSidecarError(null);
    setDraftVersions([]);
    setDraftDiff(null);

    Promise.all([listDraftVersions(selectedDraftId, accessToken), getDraftDiff(selectedDraftId, accessToken)])
      .then(([versions, diff]) => {
        if (!cancelled) {
          setDraftVersions(versions);
          setDraftDiff(diff);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Failed to load version history or diff";
          setDraftSidecarError(message);
          setDraftVersions([]);
          setDraftDiff(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDraftSidecarLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, selectedDraftId]);

  const handleLogout = useCallback(() => {
    window.localStorage.removeItem("tooth_access_token");
    setAccessToken(null);
  }, []);

  const handleCreateProject = useCallback(
    async (name: string, description: string | null) => {
      if (!accessToken) {
        return;
      }
      setProjectCreateError(null);
      setProjectCreatePending(true);
      try {
        const p = await createProject({ name, description: description ?? undefined }, accessToken);
        setProjects((prev) => [...prev, p]);
        setSelectedProjectId(p.id);
      } catch (err: unknown) {
        setProjectCreateError(err instanceof Error ? err.message : "Create project failed");
      } finally {
        setProjectCreatePending(false);
      }
    },
    [accessToken],
  );

  const handleCreateRawText = useCallback(
    async (title: string, content: string) => {
      if (!accessToken || !selectedProjectId) {
        return;
      }
      setRawTextCreateError(null);
      setRawTextCreatePending(true);
      try {
        const r = await createRawText(selectedProjectId, { title, content }, accessToken);
        const item: RawTextListItem = {
          id: r.id,
          title: r.title,
          media_type: r.media_type,
          origin: r.origin,
          archived: r.archived,
          created_at: r.created_at,
        };
        setRawTexts((prev) => [...prev, item]);
        setSelectedRawTextId(r.id);
        setRawTextDetail(r);
        setDrafts([]);
        setSelectedDraftId(null);
        setDraftDetail(null);
      } catch (err: unknown) {
        setRawTextCreateError(err instanceof Error ? err.message : "Create raw text failed");
      } finally {
        setRawTextCreatePending(false);
      }
    },
    [accessToken, selectedProjectId],
  );

  const handleCreateDraft = useCallback(
    async (title: string, branchName: string) => {
      if (!accessToken || !selectedRawTextId) {
        return;
      }
      setDraftCreateError(null);
      setDraftCreatePending(true);
      try {
        const d = await createDraft(selectedRawTextId, { title, branch_name: branchName }, accessToken);
        const item: DraftListItem = {
          id: d.id,
          raw_text_id: d.raw_text_id,
          parent_draft_id: d.parent_draft_id,
          title: d.title,
          branch_name: d.branch_name,
          status: d.status,
          archived: d.archived,
          created_at: d.created_at,
        };
        setDrafts((prev) => [...prev, item]);
        setSelectedDraftId(d.id);
      } catch (err: unknown) {
        setDraftCreateError(err instanceof Error ? err.message : "Create draft failed");
      } finally {
        setDraftCreatePending(false);
      }
    },
    [accessToken, selectedRawTextId],
  );

  const handleSaveDraftVersion = useCallback(
    async (opts?: { title?: string | null }) => {
      if (!accessToken || !selectedDraftId || !selectedProjectId || !selectedRawTextId) {
        return;
      }
      if (draftDetail?.status === "frozen") {
        return;
      }
      setSaveVersionError(null);
      setSaveVersionPending(true);
      try {
        const d = await saveDraftVersion(
          selectedDraftId,
          { content: draftEditContent, title: opts?.title },
          accessToken,
        );
        const refreshed = await listDrafts(selectedProjectId, accessToken, {
          rawTextId: selectedRawTextId,
        });
        setDrafts(refreshed);
        setDraftDetail(d);
        setSelectedDraftId(d.id);
      } catch (err: unknown) {
        setSaveVersionError(err instanceof Error ? err.message : "Save version failed");
      } finally {
        setSaveVersionPending(false);
      }
    },
    [
      accessToken,
      selectedDraftId,
      selectedProjectId,
      selectedRawTextId,
      draftEditContent,
      draftDetail?.status,
    ],
  );

  const handleBranchDraft = useCallback(
    async (title: string, branchName: string) => {
      if (!accessToken || !selectedDraftId || !selectedProjectId || !selectedRawTextId) {
        return;
      }
      setBranchError(null);
      setBranchPending(true);
      try {
        const branchBody: { title: string; branch_name: string; content?: string } = {
          title,
          branch_name: branchName,
        };
        if (draftEditContent.length > 0) {
          branchBody.content = draftEditContent;
        }
        const d = await branchDraft(selectedDraftId, branchBody, accessToken);
        const refreshed = await listDrafts(selectedProjectId, accessToken, {
          rawTextId: selectedRawTextId,
        });
        setDrafts(refreshed);
        setDraftDetail(d);
        setSelectedDraftId(d.id);
      } catch (err: unknown) {
        setBranchError(err instanceof Error ? err.message : "Branch draft failed");
      } finally {
        setBranchPending(false);
      }
    },
    [accessToken, selectedDraftId, selectedProjectId, selectedRawTextId, draftEditContent],
  );

  const handleFreezeDraft = useCallback(async () => {
    if (!accessToken || !selectedDraftId) {
      return;
    }
    setFreezeUnfreezeError(null);
    setFreezePending(true);
    try {
      const d = await freezeDraft(selectedDraftId, accessToken);
      setDraftDetail(d);
      setDrafts((prev) => prev.map((row) => (row.id === d.id ? { ...row, status: d.status } : row)));
    } catch (err: unknown) {
      setFreezeUnfreezeError(err instanceof Error ? err.message : "Freeze draft failed");
    } finally {
      setFreezePending(false);
    }
  }, [accessToken, selectedDraftId]);

  const refreshRawTextsForProject = useCallback(async () => {
    if (!accessToken || !selectedProjectId) {
      return;
    }
    try {
      const list = await listRawTexts(selectedProjectId, accessToken);
      setRawTexts(list);
    } catch {
      /* ignore refresh errors */
    }
  }, [accessToken, selectedProjectId]);

  const handleUnfreezeDraft = useCallback(async () => {
    if (!accessToken || !selectedDraftId) {
      return;
    }
    setFreezeUnfreezeError(null);
    setUnfreezePending(true);
    try {
      const d = await unfreezeDraft(selectedDraftId, accessToken);
      setDraftDetail(d);
      setDrafts((prev) => prev.map((row) => (row.id === d.id ? { ...row, status: d.status } : row)));
    } catch (err: unknown) {
      setFreezeUnfreezeError(err instanceof Error ? err.message : "Unfreeze draft failed");
    } finally {
      setUnfreezePending(false);
    }
  }, [accessToken, selectedDraftId]);

  return (
    <main className="app">
      <h1>Tooth Gate 2</h1>
      <HealthPanel />
      <section className="panel" aria-label="Authentication">
        {accessToken ? (
          sessionLoading ? (
            <p aria-busy="true">Loading session…</p>
          ) : sessionError ? (
            <div>
              <p className="status-fail" role="alert">
                {sessionError}
              </p>
              <button type="button" className="btn-secondary" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          ) : user ? (
            <div className="auth-shell">
              <UserBar email={user.email} onLogout={handleLogout} />
              <div className="workspace">
                <ProjectsPanel
                  projects={projects}
                  selectedProjectId={selectedProjectId}
                  onSelectProject={setSelectedProjectId}
                  onCreateProject={handleCreateProject}
                  createPending={projectCreatePending}
                  createError={projectCreateError}
                />
                <RawTextsPanel
                  disabled={!selectedProjectId}
                  rawTexts={rawTexts}
                  selectedRawTextId={selectedRawTextId}
                  onSelectRawText={setSelectedRawTextId}
                  onCreateRawText={handleCreateRawText}
                  createPending={rawTextCreatePending}
                  createError={rawTextCreateError}
                />
                {rawTextsLoading ? (
                  <p className="panel muted-inline" aria-busy="true">
                    Loading raw texts…
                  </p>
                ) : rawTextsError ? (
                  <p className="panel status-fail" role="alert">
                    {rawTextsError}
                  </p>
                ) : null}
                <DraftsPanel
                  disabled={!selectedRawTextId}
                  drafts={drafts}
                  selectedDraftId={selectedDraftId}
                  onSelectDraft={setSelectedDraftId}
                  onCreateDraft={handleCreateDraft}
                  createPending={draftCreatePending}
                  createError={draftCreateError}
                />
                {rawContextLoading ? (
                  <p className="panel muted-inline" aria-busy="true">
                    Loading raw text and drafts…
                  </p>
                ) : rawContextError ? (
                  <p className="panel status-fail" role="alert">
                    {rawContextError}
                  </p>
                ) : null}
                <DetailPanels
                  rawText={rawTextDetail}
                  rawTextLoading={Boolean(selectedRawTextId) && rawContextLoading}
                  rawTextError={rawContextError}
                  draft={draftDetail}
                  draftLoading={Boolean(selectedDraftId) && draftDetailLoading}
                  draftError={draftDetailError}
                  selectedDraftId={selectedDraftId}
                  draftEditContent={draftEditContent}
                  onDraftEditContentChange={setDraftEditContent}
                  onSaveDraftVersion={handleSaveDraftVersion}
                  saveVersionPending={saveVersionPending}
                  saveVersionError={saveVersionError}
                  draftVersions={draftVersions}
                  draftVersionsLoading={draftSidecarLoading}
                  draftVersionsError={draftSidecarError}
                  onSelectVersionDraft={setSelectedDraftId}
                  draftDiff={draftDiff}
                  draftDiffLoading={draftSidecarLoading}
                  onBranchDraft={handleBranchDraft}
                  branchPending={branchPending}
                  branchError={branchError}
                  onFreezeDraft={handleFreezeDraft}
                  onUnfreezeDraft={handleUnfreezeDraft}
                  freezePending={freezePending}
                  unfreezePending={unfreezePending}
                  freezeUnfreezeError={freezeUnfreezeError}
                />
                {accessToken ? (
                  <AIAssistPanel token={accessToken} projectId={selectedProjectId} draftId={selectedDraftId} />
                ) : null}
                {accessToken ? (
                  <SearchPanel token={accessToken} projectId={selectedProjectId} />
                ) : null}
                {accessToken ? (
                  <PasteIngestPanel
                    token={accessToken}
                    projectId={selectedProjectId}
                    onIngestAccepted={() => {
                      void refreshRawTextsForProject();
                    }}
                  />
                ) : null}
                {accessToken ? (
                  <BooksPanel
                    token={accessToken}
                    projectId={selectedProjectId}
                    rawTexts={rawTexts}
                  />
                ) : null}
              </div>
            </div>
          ) : null
        ) : (
          <LoginForm
            onLoggedIn={(token) => {
              window.localStorage.setItem("tooth_access_token", token);
              setAccessToken(token);
            }}
          />
        )}
      </section>
    </main>
  );
}
