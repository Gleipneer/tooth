import { type FormEvent, useCallback, useEffect, useState } from "react";
import {
  listAiOperations,
  postAiAssist,
  type AIAssistResponse,
  type AIOperationListItem,
} from "../lib/api";

type AIAssistPanelProps = {
  token: string;
  projectId: string | null;
  draftId: string | null;
};

export function AIAssistPanel({ token, projectId, draftId }: AIAssistPanelProps) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIAssistResponse | null>(null);
  const [history, setHistory] = useState<AIOperationListItem[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [dismissedSuggestionIds, setDismissedSuggestionIds] = useState<Set<string>>(new Set());
  const [copyFeedbackId, setCopyFeedbackId] = useState<string | null>(null);
  const [useRetrieval, setUseRetrieval] = useState(false);
  const [retrievalQuery, setRetrievalQuery] = useState("");

  useEffect(() => {
    if (!token || !projectId) {
      setHistory([]);
      setHistoryError(null);
      return;
    }
    let cancelled = false;
    setHistoryError(null);
    listAiOperations(projectId, token, 15)
      .then((rows) => {
        if (!cancelled) {
          setHistory(rows);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setHistoryError(err instanceof Error ? err.message : "Failed to load AI history");
          setHistory([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token, projectId, result?.operation_id]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!projectId || !message.trim()) {
      return;
    }
    setError(null);
    setPending(true);
    try {
      const res = await postAiAssist(
        {
          project_id: projectId,
          draft_id: draftId,
          message: message.trim(),
          use_retrieval: useRetrieval,
          retrieval_query: retrievalQuery.trim() ? retrievalQuery.trim() : null,
        },
        token,
      );
      setResult(res);
      setDismissedSuggestionIds(new Set());
    } catch (err: unknown) {
      setResult(null);
      setError(err instanceof Error ? err.message : "AI assist failed");
    } finally {
      setPending(false);
    }
  }

  const disabled = !projectId || pending;

  const copySuggestionBody = useCallback(async (id: string, body: string) => {
    try {
      await navigator.clipboard.writeText(body);
      setCopyFeedbackId(id);
      window.setTimeout(() => {
        setCopyFeedbackId((cur) => (cur === id ? null : cur));
      }, 2000);
    } catch {
      setCopyFeedbackId(null);
    }
  }, []);

  return (
    <section className="panel" aria-label="AI assist" data-testid="ai-assist-panel">
      <h2>AI assist</h2>
      <p className="muted ai-assist-hint">
        Suggestions are not applied automatically. The server uses a cheap routing pass first and escalates
        only when needed. Requires <code>OPENAI_API_KEY</code> on the API.
      </p>
      {!projectId ? <p className="muted">Select a project to run assist.</p> : null}
      <form className="stack-form" onSubmit={(ev) => void handleSubmit(ev)}>
        <div className="form-field form-field-inline">
          <label>
            <input
              type="checkbox"
              checked={useRetrieval}
              onChange={(ev) => {
                setUseRetrieval(ev.target.checked);
              }}
              disabled={disabled}
            />{" "}
            Include project FTS snippets (bounded; see context bundle)
          </label>
        </div>
        {useRetrieval ? (
          <div className="form-field">
            <label htmlFor="ai-retrieval-query">Retrieval query (optional)</label>
            <input
              id="ai-retrieval-query"
              type="text"
              value={retrievalQuery}
              onChange={(ev) => {
                setRetrievalQuery(ev.target.value);
              }}
              maxLength={500}
              disabled={disabled}
              placeholder="Leave empty to use your message as the query"
            />
          </div>
        ) : null}
        <div className="form-field">
          <label htmlFor="ai-assist-message">Message</label>
          <textarea
            id="ai-assist-message"
            name="ai_message"
            value={message}
            onChange={(ev) => {
              setMessage(ev.target.value);
            }}
            rows={4}
            maxLength={4000}
            disabled={disabled}
            placeholder="Ask for notes, a light edit idea, or a summary…"
          />
        </div>
        <button type="submit" disabled={disabled || !message.trim()}>
          {pending ? "Running…" : "Run assist"}
        </button>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
      </form>

      {result ? (
        <div className="ai-assist-result">
          <div className="ai-result-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setResult(null);
                setDismissedSuggestionIds(new Set());
              }}
            >
              Clear result
            </button>
          </div>
          <h3 className="subheading">Last result</h3>
          <dl className="detail-meta ai-route-meta">
            <div>
              <dt>Route</dt>
              <dd>{result.route_final}</dd>
            </div>
            <div>
              <dt>Escalated</dt>
              <dd>{result.escalated ? "yes" : "no"}</dd>
            </div>
            <div>
              <dt>Cheap rounds</dt>
              <dd>{result.cheap_rounds}</dd>
            </div>
            <div>
              <dt>Task class</dt>
              <dd>{result.task_class}</dd>
            </div>
            <div>
              <dt>Confidence</dt>
              <dd>{result.confidence.toFixed(2)}</dd>
            </div>
          </dl>
          {result.planner_reason ? (
            <p className="muted">
              <strong>Planner:</strong> {result.planner_reason}
            </p>
          ) : null}
          <details className="ai-context-details">
            <summary>Context bundle (bounded, audited)</summary>
            <pre className="detail-pre">{JSON.stringify(result.context_bundle, null, 2)}</pre>
          </details>
          <p className="muted">
            <strong>Tokens:</strong> {JSON.stringify(result.token_usage)}
          </p>
          <h4 className="subheading">Suggestions</h4>
          <p className="muted ai-apply-hint">
            Nothing is written to your draft automatically. Use <strong>Copy</strong> to paste into the editor, or{" "}
            <strong>Ignore</strong> to hide a suggestion here (reversible via Clear result).
          </p>
          {result.suggestions.length === 0 ? <p className="muted">No structured suggestions returned.</p> : null}
          <ul className="ai-suggestion-list">
            {result.suggestions.map((s) =>
              dismissedSuggestionIds.has(s.id) ? null : (
                <li key={s.id}>
                  <div className="ai-suggestion-toolbar">
                    <strong>{s.title}</strong>
                    <span className="item-meta"> ({s.apply_kind})</span>
                    <span className="ai-suggestion-actions">
                      <button
                        type="button"
                        onClick={() => {
                          void copySuggestionBody(s.id, s.body);
                        }}
                      >
                        {copyFeedbackId === s.id ? "Copied" : "Copy"}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          setDismissedSuggestionIds((prev) => new Set(prev).add(s.id));
                        }}
                      >
                        Ignore
                      </button>
                    </span>
                  </div>
                  <pre className="detail-pre ai-suggestion-body">{s.body}</pre>
                </li>
              ),
            )}
          </ul>
        </div>
      ) : null}

      <h3 className="subheading">Recent operations</h3>
      {historyError ? (
        <p className="status-fail" role="alert">
          {historyError}
        </p>
      ) : null}
      {history.length === 0 && !historyError ? <p className="muted">No operations yet for this project.</p> : null}
      {history.length > 0 ? (
        <ul className="select-list ai-op-list">
          {history.map((op) => (
            <li key={op.id}>
              <span className="ai-op-line">
                {op.created_at} — {op.route_final}
                {op.escalated ? " (escalated)" : ""} — {op.cheap_rounds} cheap round(s)
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
