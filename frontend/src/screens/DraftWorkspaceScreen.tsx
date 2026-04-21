import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useSession } from "../app/session";
import { AIAssistPanel } from "../components/AIAssistPanel";
import { DetailPanels } from "../components/DetailPanels";
import { getDraft, getDraftDiff, getRawText, listDraftVersions } from "../lib/api";
import { useState } from "react";

export function DraftWorkspaceScreen() {
  const { token } = useSession();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project");
  const rawId = searchParams.get("raw");
  const draftId = searchParams.get("draft");
  const [draftEditContent, setDraftEditContent] = useState("");

  const rawQ = useQuery({
    queryKey: ["rawDetail", rawId],
    queryFn: () => getRawText(rawId!, token!),
    enabled: Boolean(token && rawId),
  });
  const draftQ = useQuery({
    queryKey: ["draftDetail", draftId],
    queryFn: () => getDraft(draftId!, token!),
    enabled: Boolean(token && draftId),
  });
  const versionsQ = useQuery({
    queryKey: ["draftVersions", draftId],
    queryFn: () => listDraftVersions(draftId!, token!),
    enabled: Boolean(token && draftId),
  });
  const diffQ = useQuery({
    queryKey: ["draftDiff", draftId],
    queryFn: () => getDraftDiff(draftId!, token!),
    enabled: Boolean(token && draftId),
  });

  return (
    <section className="draft-workspace-split">
      <div className="draft-pane">
        <DetailPanels
          rawText={rawQ.data ?? null}
          rawTextLoading={rawQ.isLoading}
          rawTextError={rawQ.error instanceof Error ? rawQ.error.message : null}
          draft={draftQ.data ?? null}
          draftLoading={draftQ.isLoading}
          draftError={draftQ.error instanceof Error ? draftQ.error.message : null}
          selectedDraftId={draftId}
          draftEditContent={draftEditContent || draftQ.data?.content || ""}
          onDraftEditContentChange={setDraftEditContent}
          onSaveDraftVersion={async () => {}}
          saveVersionPending={false}
          saveVersionError={null}
          draftVersions={versionsQ.data ?? []}
          draftVersionsLoading={versionsQ.isLoading}
          draftVersionsError={versionsQ.error instanceof Error ? versionsQ.error.message : null}
          onSelectVersionDraft={() => {}}
          draftDiff={diffQ.data ?? null}
          draftDiffLoading={diffQ.isLoading}
          onBranchDraft={async () => {}}
          branchPending={false}
          branchError={null}
          onFreezeDraft={async () => {}}
          onUnfreezeDraft={async () => {}}
          freezePending={false}
          unfreezePending={false}
          freezeUnfreezeError={null}
        />
      </div>
      <div className="chat-pane">
        <AIAssistPanel token={token!} projectId={projectId} draftId={draftId} />
      </div>
    </section>
  );
}
