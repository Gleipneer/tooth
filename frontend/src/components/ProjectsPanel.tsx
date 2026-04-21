import { type FormEvent, useState } from "react";
import type { ProjectResponse } from "../lib/api";

type ProjectsPanelProps = {
  projects: ProjectResponse[];
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (name: string, description: string | null) => Promise<void>;
  createPending: boolean;
  createError: string | null;
};

export function ProjectsPanel({
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateProject,
  createPending,
  createError,
}: ProjectsPanelProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    const desc = description.trim();
    await onCreateProject(trimmed, desc ? desc : null);
    setName("");
    setDescription("");
  }

  return (
    <section className="panel" aria-label="Projects">
      <h2>Projects</h2>
      {projects.length === 0 ? (
        <p className="muted">No projects yet. Create one below.</p>
      ) : (
        <ul className="select-list">
          {projects.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className={`select-list-item${selectedProjectId === p.id ? " is-selected" : ""}`}
                onClick={() => {
                  onSelectProject(p.id);
                }}
              >
                {p.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      <form className="stack-form" onSubmit={handleCreate}>
        <h3 className="subheading">New project</h3>
        <div className="form-field">
          <label htmlFor="project-name">Name</label>
          <input
            id="project-name"
            name="name"
            value={name}
            onChange={(ev) => {
              setName(ev.target.value);
            }}
            required
            minLength={1}
            maxLength={200}
          />
        </div>
        <div className="form-field">
          <label htmlFor="project-desc">Description (optional)</label>
          <input
            id="project-desc"
            name="description"
            value={description}
            onChange={(ev) => {
              setDescription(ev.target.value);
            }}
            maxLength={2000}
          />
        </div>
        <button type="submit" disabled={createPending}>
          {createPending ? "Creating…" : "Create project"}
        </button>
        {createError ? (
          <p className="form-error" role="alert">
            {createError}
          </p>
        ) : null}
      </form>
    </section>
  );
}
