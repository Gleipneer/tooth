import { type FormEvent, useState } from "react";
import { projectSearch, type SearchHit, type SearchResponse } from "../lib/api";

type SearchPanelProps = {
  token: string;
  projectId: string | null;
};

export function SearchPanel({ token, projectId }: SearchPanelProps) {
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<"fts" | "semantic" | "hybrid">("fts");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResponse | null>(null);

  async function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!projectId || !q.trim()) {
      return;
    }
    setError(null);
    setPending(true);
    try {
      const res = await projectSearch(projectId, token, q.trim(), mode);
      setResult(res);
    } catch (err: unknown) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="panel" aria-label="Project search" data-testid="search-panel">
      <h2>Search raw texts</h2>
      <p className="muted">
        Project-scoped full-text (FTS). Semantic and hybrid need <code>OPENAI_API_KEY</code> for embeddings.
      </p>
      {!projectId ? <p className="muted">Select a project.</p> : null}
      <form className="stack-form" onSubmit={(ev) => void handleSearch(ev)}>
        <div className="form-field search-mode-row">
          <label htmlFor="search-mode">Mode</label>
          <select
            id="search-mode"
            value={mode}
            onChange={(ev) => {
              setMode(ev.target.value as "fts" | "semantic" | "hybrid");
            }}
            disabled={!projectId || pending}
          >
            <option value="fts">Full-text (FTS)</option>
            <option value="semantic">Semantic (embeddings)</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="search-q">Query</label>
          <input
            id="search-q"
            value={q}
            onChange={(ev) => {
              setQ(ev.target.value);
            }}
            maxLength={500}
            disabled={!projectId || pending}
            placeholder="Words or phrases in imported raw texts…"
          />
        </div>
        <button type="submit" disabled={!projectId || pending || !q.trim()}>
          {pending ? "Searching…" : "Search"}
        </button>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
      </form>
      {result ? (
        <div className="search-results">
          <h3 className="subheading">
            Results ({result.hits.length}) — {result.mode}
          </h3>
          {result.hits.length === 0 ? <p className="muted">No matches.</p> : null}
          <ul className="select-list">
            {result.hits.map((h: SearchHit) => (
              <li key={h.raw_text_id} className="search-hit">
                <strong>{h.title}</strong>
                <span className="item-meta">
                  {" "}
                  score {h.score.toFixed(4)} · {h.rank_kind}
                </span>
              </li>
            ))}
          </ul>
          {Object.keys(result.meta).length > 0 ? (
            <details className="ai-context-details">
              <summary>Search meta</summary>
              <pre className="detail-pre">{JSON.stringify(result.meta, null, 2)}</pre>
            </details>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
