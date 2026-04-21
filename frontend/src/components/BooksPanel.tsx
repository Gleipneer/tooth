import { type FormEvent, useCallback, useEffect, useState } from "react";
import type { RawTextListItem } from "../lib/api";
import {
  createBook,
  createBookAssignment,
  createOutlineNode,
  fetchBookExportBlob,
  listBookAssignments,
  listBooks,
  listOutlineNodes,
  type BookAssignmentResponse,
  type BookResponse,
  type OutlineNodeResponse,
} from "../lib/api";

type BooksPanelProps = {
  token: string;
  projectId: string | null;
  rawTexts: RawTextListItem[];
};

export function BooksPanel({ token, projectId, rawTexts }: BooksPanelProps) {
  const [books, setBooks] = useState<BookResponse[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<OutlineNodeResponse[]>([]);
  const [assignments, setAssignments] = useState<BookAssignmentResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newBookTitle, setNewBookTitle] = useState("");
  const [newNodeTitle, setNewNodeTitle] = useState("");
  const [assignNodeId, setAssignNodeId] = useState("");
  const [assignRawId, setAssignRawId] = useState("");
  const [createPending, setCreatePending] = useState(false);
  const rawTextTitleById = new Map(rawTexts.map((r) => [r.id, r.title]));
  const nodeTitleById = new Map(nodes.map((n) => [n.id, n.title]));

  const refreshBooks = useCallback(() => {
    if (!token || !projectId) {
      setBooks([]);
      return;
    }
    listBooks(projectId, token)
      .then(setBooks)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to list books");
        setBooks([]);
      });
  }, [token, projectId]);

  useEffect(() => {
    setError(null);
    refreshBooks();
  }, [refreshBooks, projectId]);

  const refreshOutline = useCallback(() => {
    if (!token || !selectedBookId) {
      setNodes([]);
      setAssignments([]);
      return;
    }
    Promise.all([listOutlineNodes(selectedBookId, token), listBookAssignments(selectedBookId, token)])
      .then(([n, a]) => {
        setNodes(n);
        setAssignments(a);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load outline");
      });
  }, [token, selectedBookId]);

  useEffect(() => {
    refreshOutline();
  }, [refreshOutline, selectedBookId]);

  async function handleCreateBook(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!projectId || !newBookTitle.trim()) {
      return;
    }
    setCreatePending(true);
    setError(null);
    try {
      const b = await createBook(projectId, newBookTitle.trim(), token);
      setBooks((prev) => [...prev, b]);
      setSelectedBookId(b.id);
      setNewBookTitle("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Create book failed");
    } finally {
      setCreatePending(false);
    }
  }

  async function handleAddNode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedBookId || !newNodeTitle.trim()) {
      return;
    }
    setError(null);
    try {
      await createOutlineNode(selectedBookId, { title: newNodeTitle.trim(), sort_order: 0 }, token);
      setNewNodeTitle("");
      refreshOutline();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Add section failed");
    }
  }

  async function handleAssign(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedBookId || !assignNodeId || !assignRawId) {
      return;
    }
    setError(null);
    try {
      await createBookAssignment(
        selectedBookId,
        { outline_node_id: assignNodeId, raw_text_id: assignRawId, sort_order: 0 },
        token,
      );
      setAssignRawId("");
      refreshOutline();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Assign failed");
    }
  }

  async function handleDownloadExport() {
    if (!selectedBookId) {
      return;
    }
    setError(null);
    try {
      const blob = await fetchBookExportBlob(selectedBookId, token);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `book-${selectedBookId}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Export failed");
    }
  }

  const assignmentsByNodeId = new Map<string, BookAssignmentResponse[]>();
  for (const assignment of assignments) {
    const existing = assignmentsByNodeId.get(assignment.outline_node_id) ?? [];
    existing.push(assignment);
    assignmentsByNodeId.set(assignment.outline_node_id, existing);
  }

  const sortedNodes = [...nodes].sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at));

  return (
    <section className="panel" aria-label="Books" data-testid="books-panel">
      <h2>Shape your manuscript</h2>
      <p className="muted">
        Organize pages into a manuscript outline, then export intentionally. Export never mutates source writing.
      </p>
      {!projectId ? <p className="muted">Select a project.</p> : null}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <form className="stack-form" onSubmit={(ev) => void handleCreateBook(ev)}>
        <h3 className="subheading">New manuscript</h3>
        <div className="form-field">
          <label htmlFor="new-book-title">Title</label>
          <input
            id="new-book-title"
            value={newBookTitle}
            onChange={(ev) => {
              setNewBookTitle(ev.target.value);
            }}
            maxLength={200}
            disabled={!projectId || createPending}
          />
        </div>
        <button type="submit" disabled={!projectId || createPending || !newBookTitle.trim()}>
          {createPending ? "Creating..." : "Create manuscript"}
        </button>
      </form>

      {books.length > 0 ? (
        <div className="book-picker">
          <h3 className="subheading">Active manuscript</h3>
          <select
            value={selectedBookId ?? ""}
            onChange={(ev) => {
              setSelectedBookId(ev.target.value || null);
            }}
          >
            <option value="">—</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {selectedBookId ? (
        <>
          <form className="stack-form" onSubmit={(ev) => void handleAddNode(ev)}>
            <h3 className="subheading">Add chapter/section</h3>
            <div className="form-field">
              <label htmlFor="new-node-title">Section title</label>
              <input
                id="new-node-title"
                value={newNodeTitle}
                onChange={(ev) => {
                  setNewNodeTitle(ev.target.value);
                }}
                maxLength={255}
              />
            </div>
            <button type="submit" disabled={!newNodeTitle.trim()}>
              Add section
            </button>
          </form>

          <form className="stack-form" onSubmit={(ev) => void handleAssign(ev)}>
            <h3 className="subheading">Place a page into structure</h3>
            <div className="form-field">
              <label htmlFor="assign-node">Chapter/section</label>
              <select
                id="assign-node"
                value={assignNodeId}
                onChange={(ev) => {
                  setAssignNodeId(ev.target.value);
                }}
              >
                <option value="">—</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="assign-raw">Page</label>
              <select
                id="assign-raw"
                value={assignRawId}
                onChange={(ev) => {
                  setAssignRawId(ev.target.value);
                }}
              >
                <option value="">—</option>
                {rawTexts.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={!assignNodeId || !assignRawId}>
              Place in manuscript
            </button>
          </form>

          <div className="stack-form">
            <h3 className="subheading">Manuscript structure</h3>
            {sortedNodes.length === 0 ? <p className="muted">No sections yet. Add your first chapter/section.</p> : null}
            <ul className="select-list">
              {sortedNodes.map((node) => {
                const nodeAssignments = assignmentsByNodeId.get(node.id) ?? [];
                return (
                  <li key={node.id} className="search-hit">
                    <strong>{node.title}</strong>
                    {nodeAssignments.length === 0 ? (
                      <p className="muted-inline">No pages placed here yet.</p>
                    ) : (
                      <ul className="book-assignments-nested">
                        {nodeAssignments.map((assignment) => (
                          <li key={assignment.id}>
                            {rawTextTitleById.get(assignment.raw_text_id) ?? "Untitled page"}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="book-export-actions">
            <button type="button" onClick={() => void handleDownloadExport()}>
              Export manuscript (Markdown)
            </button>
          </div>

          <h3 className="subheading">Placed pages</h3>
          {assignments.length === 0 ? <p className="muted">No pages placed yet.</p> : null}
          <ul className="select-list">
            {assignments.map((a) => (
              <li key={a.id}>
                <strong>{nodeTitleById.get(a.outline_node_id) ?? "Untitled section"}</strong>
                <span className="item-meta"> → {rawTextTitleById.get(a.raw_text_id) ?? "Untitled page"}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
