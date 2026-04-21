import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useSession } from "../app/session";
import { BooksPanel } from "../components/BooksPanel";
import { ProjectScopePicker } from "../components/ProjectScopePicker";
import { listRawTexts } from "../lib/api";

export function BooksScreen() {
  const { token } = useSession();
  const [params] = useSearchParams();
  const projectId = params.get("project");
  const rawTextsQ = useQuery({
    queryKey: ["rawTexts", projectId],
    queryFn: () => listRawTexts(projectId!, token!),
    enabled: Boolean(projectId && token),
  });

  return (
    <section className="page-stack">
      <section className="panel">
        <h2>Manuscript workspace</h2>
        <p className="muted">
          Build structure from your pages, keep hierarchy readable, and export only when it looks right.
        </p>
      </section>
      <ProjectScopePicker />
      <BooksPanel token={token!} projectId={projectId} rawTexts={rawTextsQ.data ?? []} />
    </section>
  );
}
