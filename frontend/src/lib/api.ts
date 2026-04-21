const API_PREFIX = "/api/v1";

export type HealthResponse = {
  status: string;
  app_name: string;
};

export type LoginRequestBody = {
  email: string;
  password: string;
};

export type SignupRequestBody = {
  email: string;
  password: string;
};

export type TokenResponse = {
  access_token: string;
  token_type?: string;
};

export type UserResponse = {
  id: string;
  email: string;
  is_active: boolean;
};

export type ProjectCreateBody = {
  name: string;
  description?: string | null;
};

export type ProjectResponse = {
  id: string;
  name: string;
  description: string | null;
  archived: boolean;
  created_at: string;
};

export type RawTextListItem = {
  id: string;
  title: string;
  media_type: string;
  origin: string;
  archived: boolean;
  created_at: string;
};

export type RawTextCreateBody = {
  title: string;
  content: string;
  media_type?: string;
  origin?: string;
};

export type RawTextImportResponse = RawTextListItem & {
  content: string;
};

export type DraftListItem = {
  id: string;
  raw_text_id: string;
  parent_draft_id: string | null;
  title: string;
  branch_name: string;
  status: string;
  archived: boolean;
  created_at: string;
};

export type DraftCreateBody = {
  title: string;
  branch_name?: string;
};

export type DraftResponse = DraftListItem & {
  content: string;
};

export type DraftVersionSaveBody = {
  content: string;
  title?: string | null;
};

export type DraftBranchCreateBody = {
  title: string;
  branch_name: string;
  content?: string | null;
};

export type DraftDiffResponse = {
  draft_id: string;
  parent_draft_id: string | null;
  baseline_type: string;
  diff: string;
};

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

async function readErrorMessage(res: Response): Promise<string> {
  const text = await res.text();
  if (!text) {
    return `Request failed (${res.status})`;
  }
  try {
    const parsed: unknown = JSON.parse(text);
    if (parsed && typeof parsed === "object" && "detail" in parsed) {
      const detail = (parsed as { detail?: unknown }).detail;
      if (typeof detail === "string") {
        return detail;
      }
    }
  } catch {
    /* use raw text */
  }
  return text;
}

async function parseJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_PREFIX}/healthz`);
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<HealthResponse>(res);
}

export async function login(body: LoginRequestBody): Promise<TokenResponse> {
  const res = await fetch(`${API_PREFIX}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<TokenResponse>(res);
}

export async function signup(body: SignupRequestBody): Promise<UserResponse> {
  const res = await fetch(`${API_PREFIX}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<UserResponse>(res);
}

export async function fetchMe(token: string): Promise<UserResponse> {
  const res = await fetch(`${API_PREFIX}/auth/me`, { headers: authHeaders(token) });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<UserResponse>(res);
}

export async function listProjects(token: string): Promise<ProjectResponse[]> {
  const res = await fetch(`${API_PREFIX}/projects`, { headers: authHeaders(token) });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<ProjectResponse[]>(res);
}

export async function createProject(body: ProjectCreateBody, token: string): Promise<ProjectResponse> {
  const res = await fetch(`${API_PREFIX}/projects`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<ProjectResponse>(res);
}

export async function getProject(projectId: string, token: string): Promise<ProjectResponse> {
  const res = await fetch(`${API_PREFIX}/projects/${projectId}`, { headers: authHeaders(token) });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<ProjectResponse>(res);
}

export async function listRawTexts(projectId: string, token: string): Promise<RawTextListItem[]> {
  const res = await fetch(`${API_PREFIX}/projects/${projectId}/rawtexts`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<RawTextListItem[]>(res);
}

export async function createRawText(
  projectId: string,
  body: RawTextCreateBody,
  token: string,
): Promise<RawTextImportResponse> {
  const res = await fetch(`${API_PREFIX}/projects/${projectId}/rawtexts`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<RawTextImportResponse>(res);
}

export async function importRawTextFile(
  projectId: string,
  file: File,
  token: string,
): Promise<RawTextImportResponse> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_PREFIX}/projects/${projectId}/rawtexts/import`, {
    method: "POST",
    headers: authHeaders(token),
    body: form,
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<RawTextImportResponse>(res);
}

export async function getRawText(rawTextId: string, token: string): Promise<RawTextImportResponse> {
  const res = await fetch(`${API_PREFIX}/rawtexts/${rawTextId}`, { headers: authHeaders(token) });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<RawTextImportResponse>(res);
}

export async function listDrafts(
  projectId: string,
  token: string,
  options?: { rawTextId?: string },
): Promise<DraftListItem[]> {
  const params = new URLSearchParams();
  if (options?.rawTextId) {
    params.set("raw_text_id", options.rawTextId);
  }
  const qs = params.toString();
  const url = `${API_PREFIX}/projects/${projectId}/drafts${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, { headers: authHeaders(token) });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<DraftListItem[]>(res);
}

export async function createDraft(
  rawTextId: string,
  body: DraftCreateBody,
  token: string,
): Promise<DraftResponse> {
  const res = await fetch(`${API_PREFIX}/rawtexts/${rawTextId}/drafts`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<DraftResponse>(res);
}

export async function getDraft(draftId: string, token: string): Promise<DraftResponse> {
  const res = await fetch(`${API_PREFIX}/drafts/${draftId}`, { headers: authHeaders(token) });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<DraftResponse>(res);
}

export async function listDraftVersions(draftId: string, token: string): Promise<DraftListItem[]> {
  const res = await fetch(`${API_PREFIX}/drafts/${draftId}/versions`, { headers: authHeaders(token) });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<DraftListItem[]>(res);
}

export async function saveDraftVersion(
  draftId: string,
  body: DraftVersionSaveBody,
  token: string,
): Promise<DraftResponse> {
  const res = await fetch(`${API_PREFIX}/drafts/${draftId}/save_version`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<DraftResponse>(res);
}

export async function branchDraft(
  draftId: string,
  body: DraftBranchCreateBody,
  token: string,
): Promise<DraftResponse> {
  const res = await fetch(`${API_PREFIX}/drafts/${draftId}/branch`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<DraftResponse>(res);
}

export async function freezeDraft(draftId: string, token: string): Promise<DraftResponse> {
  const res = await fetch(`${API_PREFIX}/drafts/${draftId}/freeze`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<DraftResponse>(res);
}

export async function unfreezeDraft(draftId: string, token: string): Promise<DraftResponse> {
  const res = await fetch(`${API_PREFIX}/drafts/${draftId}/unfreeze`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<DraftResponse>(res);
}

export async function getDraftDiff(draftId: string, token: string): Promise<DraftDiffResponse> {
  const res = await fetch(`${API_PREFIX}/drafts/${draftId}/diff`, { headers: authHeaders(token) });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<DraftDiffResponse>(res);
}

export type AIAssistRequestBody = {
  project_id: string;
  draft_id?: string | null;
  message: string;
  use_retrieval?: boolean;
  retrieval_query?: string | null;
};

export type AISuggestionItem = {
  id: string;
  title: string;
  body: string;
  apply_kind: string;
};

export type AIAssistResponse = {
  operation_id: string;
  task_class: string;
  route_final: string;
  escalated: boolean;
  cheap_rounds: number;
  planner_reason: string | null;
  context_bundle: Record<string, unknown>;
  suggestions: AISuggestionItem[];
  confidence: number;
  token_usage: Record<string, number>;
};

export type AIOperationListItem = {
  id: string;
  project_id: string;
  draft_id: string | null;
  task_class: string;
  route_final: string;
  escalated: boolean;
  cheap_rounds: number;
  created_at: string;
};

export async function postAiAssist(body: AIAssistRequestBody, token: string): Promise<AIAssistResponse> {
  const res = await fetch(`${API_PREFIX}/ai/assist`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({
      project_id: body.project_id,
      draft_id: body.draft_id ?? null,
      message: body.message,
      use_retrieval: body.use_retrieval ?? false,
      retrieval_query: body.retrieval_query ?? null,
    }),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<AIAssistResponse>(res);
}

export async function listAiOperations(
  projectId: string,
  token: string,
  limit = 50,
): Promise<AIOperationListItem[]> {
  const params = new URLSearchParams({ project_id: projectId, limit: String(limit) });
  const res = await fetch(`${API_PREFIX}/ai/operations?${params.toString()}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<AIOperationListItem[]>(res);
}

export type SearchHit = {
  raw_text_id: string;
  title: string;
  score: number;
  rank_kind: string;
};

export type SearchResponse = {
  query: string;
  mode: string;
  hits: SearchHit[];
  meta: Record<string, unknown>;
};

export async function projectSearch(
  projectId: string,
  token: string,
  q: string,
  mode: "fts" | "semantic" | "hybrid" = "fts",
): Promise<SearchResponse> {
  const params = new URLSearchParams({ q, mode });
  const res = await fetch(`${API_PREFIX}/projects/${projectId}/search?${params.toString()}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<SearchResponse>(res);
}

export type PasteAnalyzeResponse = {
  operation_id: string;
  review_item_id: string;
  analysis: Record<string, unknown>;
  token_usage: Record<string, number>;
};

export async function postPasteAnalyze(
  projectId: string,
  pastedText: string,
  token: string,
): Promise<PasteAnalyzeResponse> {
  const res = await fetch(`${API_PREFIX}/ai/paste-analyze`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ project_id: projectId, pasted_text: pastedText }),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<PasteAnalyzeResponse>(res);
}

export type IngestReviewListItem = {
  id: string;
  project_id: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export async function listIngestCandidates(
  projectId: string,
  token: string,
): Promise<IngestReviewListItem[]> {
  const res = await fetch(`${API_PREFIX}/projects/${projectId}/ingest-candidates`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<IngestReviewListItem[]>(res);
}

export type IngestAcceptResponse = {
  review_item_id: string;
  created_raw_text_ids: string[];
  status: string;
};

export async function acceptIngestReview(itemId: string, token: string): Promise<IngestAcceptResponse> {
  const res = await fetch(`${API_PREFIX}/ingest-review/${itemId}/accept`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<IngestAcceptResponse>(res);
}

export async function rejectIngestReview(itemId: string, token: string): Promise<IngestReviewListItem> {
  const res = await fetch(`${API_PREFIX}/ingest-review/${itemId}/reject`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<IngestReviewListItem>(res);
}

export async function deferIngestReview(itemId: string, token: string): Promise<IngestReviewListItem> {
  const res = await fetch(`${API_PREFIX}/ingest-review/${itemId}/defer`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<IngestReviewListItem>(res);
}

export type BookResponse = {
  id: string;
  project_id: string;
  title: string;
  archived: boolean;
  created_at: string;
};

export type OutlineNodeResponse = {
  id: string;
  book_id: string;
  parent_id: string | null;
  title: string;
  sort_order: number;
  created_at: string;
};

export type BookAssignmentResponse = {
  id: string;
  book_id: string;
  outline_node_id: string;
  raw_text_id: string;
  sort_order: number;
  created_at: string;
};

export async function listBooks(projectId: string, token: string): Promise<BookResponse[]> {
  const res = await fetch(`${API_PREFIX}/projects/${projectId}/books`, { headers: authHeaders(token) });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<BookResponse[]>(res);
}

export async function createBook(projectId: string, title: string, token: string): Promise<BookResponse> {
  const res = await fetch(`${API_PREFIX}/projects/${projectId}/books`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<BookResponse>(res);
}

export async function createOutlineNode(
  bookId: string,
  body: { title: string; parent_id?: string | null; sort_order?: number },
  token: string,
): Promise<OutlineNodeResponse> {
  const res = await fetch(`${API_PREFIX}/books/${bookId}/nodes`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<OutlineNodeResponse>(res);
}

export async function listOutlineNodes(bookId: string, token: string): Promise<OutlineNodeResponse[]> {
  const res = await fetch(`${API_PREFIX}/books/${bookId}/nodes`, { headers: authHeaders(token) });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<OutlineNodeResponse[]>(res);
}

export async function listBookAssignments(
  bookId: string,
  token: string,
): Promise<BookAssignmentResponse[]> {
  const res = await fetch(`${API_PREFIX}/books/${bookId}/assignments`, { headers: authHeaders(token) });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<BookAssignmentResponse[]>(res);
}

export async function createBookAssignment(
  bookId: string,
  body: { outline_node_id: string; raw_text_id: string; sort_order?: number },
  token: string,
): Promise<BookAssignmentResponse> {
  const res = await fetch(`${API_PREFIX}/books/${bookId}/assignments`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<BookAssignmentResponse>(res);
}

export async function fetchBookExportBlob(bookId: string, token: string): Promise<Blob> {
  const res = await fetch(`${API_PREFIX}/books/${bookId}/export`, { headers: authHeaders(token) });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return res.blob();
}
