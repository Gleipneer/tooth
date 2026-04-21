import { TextareaEditor } from "./TextareaEditor";
import type { EditorAdapter } from "./types";

export const textareaEditorAdapter: EditorAdapter = {
  id: "textarea-baseline",
  label: "Textarea baseline",
  Component: TextareaEditor,
};
