import { useState } from "react";
import { useParams } from "react-router-dom";
import { textareaEditorAdapter } from "../editor/adapter";

export function DraftIntegratedChatWorkspace() {
  const { projectId, draftId } = useParams();
  const [draftContent, setDraftContent] = useState("");
  const Editor = textareaEditorAdapter.Component;

  return (
    <section className="panel">
      <h2>Draft Workspace (Split View)</h2>
      <p className="muted">
        Project: <code>{projectId ?? "unknown"}</code> | Draft: <code>{draftId ?? "unknown"}</code>
      </p>
      <p className="muted-inline">
        This route establishes draft-integrated chat placement and the editor adapter boundary.
      </p>
      <div className="draft-split-view">
        <article className="draft-pane panel-muted">
          <h3 className="subheading">Editor Pane</h3>
          <p className="muted-inline">Adapter: {textareaEditorAdapter.label}</p>
          <Editor value={draftContent} onChange={setDraftContent} />
        </article>
        <article className="chat-pane panel-muted">
          <h3 className="subheading">Chat Pane</h3>
          <p className="muted-inline">
            Draft-scoped chat surface is intentionally scaffolded here before full AI/draft wiring.
          </p>
        </article>
      </div>
    </section>
  );
}
