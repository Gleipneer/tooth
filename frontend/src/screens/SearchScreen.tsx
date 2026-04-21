import { useNavigate, useSearchParams } from "react-router-dom";
import { useSession } from "../app/session";
import { ProjectScopePicker } from "../components/ProjectScopePicker";
import { SearchPanel } from "../components/SearchPanel";

export function SearchScreen() {
  const { token } = useSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const projectId = params.get("project");

  return (
    <section className="page-stack">
      <section className="panel">
        <h2>Resurface writing</h2>
        <p className="muted">
          Find the right page quickly, then jump straight back into editing with AI attached to that context.
        </p>
      </section>
      <ProjectScopePicker />
      <SearchPanel
        token={token!}
        projectId={projectId}
        onOpenRawText={(rawTextId) => {
          if (!projectId) return;
          navigate(`/write?project=${projectId}&raw=${rawTextId}`);
        }}
      />
    </section>
  );
}
