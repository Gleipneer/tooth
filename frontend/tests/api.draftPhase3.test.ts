import { afterEach, describe, expect, it, vi } from "vitest";
import {
  branchDraft,
  freezeDraft,
  getDraftDiff,
  listDraftVersions,
  saveDraftVersion,
  unfreezeDraft,
} from "../src/lib/api";

const token = "test-token";
const draftId = "550e8400-e29b-41d4-a716-446655440000";

describe("draft phase 3 API helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("listDraftVersions requests GET with bearer auth", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json([
        {
          id: draftId,
          raw_text_id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
          parent_draft_id: null,
          title: "v1",
          branch_name: "main",
          status: "in_progress",
          archived: false,
          created_at: "2026-01-01T00:00:00Z",
        },
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);
    const rows = await listDraftVersions(draftId, token);
    expect(fetchMock).toHaveBeenCalledWith(`/api/v1/drafts/${draftId}/versions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].branch_name).toBe("main");
  });

  it("saveDraftVersion POSTs JSON body", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        id: draftId,
        raw_text_id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
        parent_draft_id: null,
        title: "t",
        branch_name: "main",
        status: "in_progress",
        archived: false,
        created_at: "2026-01-01T00:00:00Z",
        content: "hello",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await saveDraftVersion(draftId, { content: "hello", title: "New title" }, token);
    expect(fetchMock).toHaveBeenCalledWith(`/api/v1/drafts/${draftId}/save_version`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ content: "hello", title: "New title" }),
    });
  });

  it("branchDraft POSTs JSON body", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        id: draftId,
        raw_text_id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
        parent_draft_id: null,
        title: "b",
        branch_name: "alt",
        status: "in_progress",
        archived: false,
        created_at: "2026-01-01T00:00:00Z",
        content: "x",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await branchDraft(draftId, { title: "b", branch_name: "alt", content: "x" }, token);
    expect(fetchMock).toHaveBeenCalledWith(`/api/v1/drafts/${draftId}/branch`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "b", branch_name: "alt", content: "x" }),
    });
  });

  it("freezeDraft and unfreezeDraft POST without JSON body", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        id: draftId,
        raw_text_id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
        parent_draft_id: null,
        title: "t",
        branch_name: "main",
        status: "frozen",
        archived: false,
        created_at: "2026-01-01T00:00:00Z",
        content: "",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await freezeDraft(draftId, token);
    expect(fetchMock).toHaveBeenLastCalledWith(`/api/v1/drafts/${draftId}/freeze`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    await unfreezeDraft(draftId, token);
    expect(fetchMock).toHaveBeenLastCalledWith(`/api/v1/drafts/${draftId}/unfreeze`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  });

  it("getDraftDiff GETs diff URL", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        draft_id: draftId,
        parent_draft_id: null,
        baseline_type: "raw_text",
        diff: "--- x\n+++ y\n",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const diff = await getDraftDiff(draftId, token);
    expect(fetchMock).toHaveBeenCalledWith(`/api/v1/drafts/${draftId}/diff`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(diff.baseline_type).toBe("raw_text");
  });
});
