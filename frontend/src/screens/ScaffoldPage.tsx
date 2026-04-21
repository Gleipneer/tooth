import { Link } from "react-router-dom";

type ScaffoldPageProps = {
  title: string;
};

export function ScaffoldPage({ title }: ScaffoldPageProps) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      <p className="muted">Scaffold only. Full domain rebuild is intentionally deferred to the next pass.</p>
      <p className="muted-inline">
        Draft-integrated chat route scaffold:{" "}
        <Link to="/projects/demo-project/drafts/demo-draft">/projects/:projectId/drafts/:draftId</Link>
      </p>
    </section>
  );
}
