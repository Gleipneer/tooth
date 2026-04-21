import { useEffect, useState } from "react";
import type { HealthResponse } from "../lib/api";
import { fetchHealth } from "../lib/api";

type HealthState =
  | { kind: "loading" }
  | { kind: "ok"; data: HealthResponse }
  | { kind: "error"; message: string };

export function HealthPanel() {
  const [state, setState] = useState<HealthState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetchHealth()
      .then((data) => {
        if (!cancelled) {
          setState({ kind: "ok", data });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Health check failed";
          setState({ kind: "error", message });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === "loading") {
    return (
      <section className="panel" aria-label="API health" aria-busy="true">
        <p>Checking API health…</p>
      </section>
    );
  }

  if (state.kind === "error") {
    return (
      <section className="panel" aria-label="API health">
        <p className="status-fail">Health check failed: {state.message}</p>
      </section>
    );
  }

  return (
    <section className="panel" aria-label="API health">
      <p className="status-ok">
        API healthy ({state.data.status}) — {state.data.app_name}
      </p>
    </section>
  );
}
