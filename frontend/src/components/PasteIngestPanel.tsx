import { type FormEvent, useCallback, useEffect, useState } from "react";
import {
  acceptIngestReview,
  deferIngestReview,
  listIngestCandidates,
  postPasteAnalyze,
  rejectIngestReview,
  type IngestReviewListItem,
  type PasteAnalyzeResponse,
} from "../lib/api";

type PasteIngestPanelProps = {
  token: string;
  projectId: string | null;
  onIngestAccepted?: () => void;
};

export function PasteIngestPanel({ token, projectId, onIngestAccepted }: PasteIngestPanelProps) {
  const [pasted, setPasted] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<PasteAnalyzeResponse | null>(null);
  const [candidates, setCandidates] = useState<IngestReviewListItem[]>([]);
  const [candidatesError, setCandidatesError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);

  const refreshCandidates = useCallback(() => {
    if (!token || !projectId) {
      setCandidates([]);
      return;
    }
    listIngestCandidates(projectId, token)
      .then(setCandidates)
      .catch((err: unknown) => {
        setCandidatesError(err instanceof Error ? err.message : "Failed to load candidates");
        setCandidates([]);
      });
  }, [token, projectId]);

  useEffect(() => {
    setCandidatesError(null);
    refreshCandidates();
  }, [refreshCandidates, analysis?.review_item_id]);

  async function handleAnalyze(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!projectId || !pasted.trim()) {
      return;
    }
    setError(null);
    setPending(true);
    try {
      const res = await postPasteAnalyze(projectId, pasted.trim(), token);
      setAnalysis(res);
    } catch (err: unknown) {
      setAnalysis(null);
      setError(err instanceof Error ? err.message : "Paste analyze failed");
    } finally {
      setPending(false);
    }
  }

  async function handleAccept(reviewId: string) {
    setActionPending(true);
    setError(null);
    try {
      await acceptIngestReview(reviewId, token);
      setAnalysis(null);
      setPasted("");
      refreshCandidates();
      onIngestAccepted?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Accept failed");
    } finally {
      setActionPending(false);
    }
  }

  async function handleReject(reviewId: string) {
    setActionPending(true);
    setError(null);
    try {
      await rejectIngestReview(reviewId, token);
      setAnalysis(null);
      refreshCandidates();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Reject failed");
    } finally {
      setActionPending(false);
    }
  }

  async function handleDefer(reviewId: string) {
    setActionPending(true);
    setError(null);
    try {
      await deferIngestReview(reviewId, token);
      setAnalysis(null);
      refreshCandidates();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Defer failed");
    } finally {
      setActionPending(false);
    }
  }

  const lastPending = analysis?.review_item_id;

  return (
    <section className="panel" aria-label="Paste ingest" data-testid="paste-ingest-panel">
      <h2>Paste → structured ingest</h2>
      <p className="muted">
        Analyzes pasted text and stages a review item. Raw texts are created only when you choose{" "}
        <strong>Accept staged</strong> (explicit). Book placement hints stay in JSON until a future book phase.
      </p>
      {!projectId ? <p className="muted">Select a project.</p> : null}
      <form className="stack-form" onSubmit={(ev) => void handleAnalyze(ev)}>
        <div className="form-field">
          <label htmlFor="paste-ingest-body">Paste text</label>
          <textarea
            id="paste-ingest-body"
            value={pasted}
            onChange={(ev) => {
              setPasted(ev.target.value);
            }}
            rows={10}
            maxLength={50000}
            disabled={!projectId || pending}
            placeholder="Paste one or more fragments…"
          />
        </div>
        <button type="submit" disabled={!projectId || pending || !pasted.trim()}>
          {pending ? "Analyzing…" : "Analyze paste"}
        </button>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
      </form>

      {analysis ? (
        <div className="paste-analysis-result">
          <h3 className="subheading">Staged analysis</h3>
          <p className="muted">
            Review ID: <code>{analysis.review_item_id}</code>
          </p>
          <details className="ai-context-details">
            <summary>Structured output (inspectable)</summary>
            <pre className="detail-pre">{JSON.stringify(analysis.analysis, null, 2)}</pre>
          </details>
          <div className="ingest-actions">
            <button
              type="button"
              disabled={actionPending}
              onClick={() => {
                void handleAccept(analysis.review_item_id);
              }}
            >
              Accept staged (create raw texts from create_* intents)
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={actionPending}
              onClick={() => {
                void handleReject(analysis.review_item_id);
              }}
            >
              Reject
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={actionPending}
              onClick={() => {
                void handleDefer(analysis.review_item_id);
              }}
            >
              Defer
            </button>
          </div>
        </div>
      ) : null}

      <h3 className="subheading">Ingest candidates</h3>
      {candidatesError ? (
        <p className="status-fail" role="alert">
          {candidatesError}
        </p>
      ) : null}
      {candidates.length === 0 && !candidatesError ? <p className="muted">No staged items.</p> : null}
      <ul className="select-list ingest-candidate-list">
        {candidates.map((c) => (
          <li key={c.id}>
            <span className="ingest-candidate-line">
              {c.status} · {c.created_at}
              {c.id === lastPending ? " (latest)" : ""}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
