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

  return (
    <section className="panel" aria-label="Books" data-testid="books-panel">
      <h2>Books &amp; export</h2>
      <p className="muted">
        Outline sections and assignments reference existing raw texts. Export builds Markdown from files — it
        does not modify sources.
      </p>
      {!projectId ? <p className="muted">Select a project.</p> : null}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <form className="stack-form" onSubmit={(ev) => void handleCreateBook(ev)}>
        <h3 className="subheading">New book</h3>
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
          {createPending ? "Creating…" : "Create book"}
        </button>
      </form>

      {books.length > 0 ? (
        <div className="book-picker">
          <h3 className="subheading">Select book</h3>
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
            <h3 className="subheading">Add section</h3>
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
            <h3 className="subheading">Assign raw text to section</h3>
            <div className="form-field">
              <label htmlFor="assign-node">Section</label>
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
              <label htmlFor="assign-raw">Raw text</label>
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
              Assign
            </button>
          </form>

          <div className="book-export-actions">
            <button type="button" onClick={() => void handleDownloadExport()}>
              Download Markdown export
            </button>
          </div>

          <h3 className="subheading">Assignments</h3>
          {assignments.length === 0 ? <p className="muted">No assignments yet.</p> : null}
          <ul className="select-list">
            {assignments.map((a) => (
              <li key={a.id}>
                node {a.outline_node_id.slice(0, 8)}… → raw {a.raw_text_id.slice(0, 8)}…
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
