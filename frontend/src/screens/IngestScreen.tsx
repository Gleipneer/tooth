import { useNavigate, useSearchParams } from "react-router-dom";
import { useSession } from "../app/session";
import { PasteIngestPanel } from "../components/PasteIngestPanel";
import { ProjectScopePicker } from "../components/ProjectScopePicker";

export function IngestScreen() {
  const { token } = useSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const projectId = params.get("project");

  return (
    <section className="page-stack">
      <section className="panel">
        <h2>Fragments to pages</h2>
        <p className="muted">
          Bring external text into Tooth, review what was detected, and move accepted material back into your writing flow.
        </p>
      </section>
      <ProjectScopePicker />
      <PasteIngestPanel
        token={token!}
        projectId={projectId}
        onIngestAccepted={(rawTextId) => {
          if (!projectId) return;
          if (rawTextId) {
            navigate(`/write?project=${projectId}&raw=${rawTextId}`);
            return;
          }
          navigate(`/write?project=${projectId}`);
        }}
      />
    </section>
  );
}
