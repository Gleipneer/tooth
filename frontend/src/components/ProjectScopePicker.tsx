import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { useSession } from "../app/session";
import { listProjects } from "../lib/api";

export function ProjectScopePicker() {
  const { token } = useSession();
  const [params, setParams] = useSearchParams();
  const selectedProjectId = params.get("project") ?? "";
  const projectsQ = useQuery({
    queryKey: ["projects"],
    queryFn: () => listProjects(token!),
    enabled: Boolean(token),
  });

  return (
    <section className="panel">
      <h2>Writing context</h2>
      <div className="form-field">
        <label htmlFor="scope-project">Active project</label>
        <select
          id="scope-project"
          value={selectedProjectId}
          onChange={(ev) => {
            const next = ev.target.value;
            if (!next) {
              setParams({});
            } else {
              setParams({ project: next });
            }
          }}
        >
          <option value="">Select project</option>
          {(projectsQ.data ?? []).map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>
      {selectedProjectId ? (
        <p className="muted-inline">
          Continue writing in Writer Mode: <Link to={`/write?project=${selectedProjectId}`}>open Writer Mode</Link>
        </p>
      ) : null}
    </section>
  );
}
