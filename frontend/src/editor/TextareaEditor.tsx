import type { EditorAdapterProps } from "./types";

export function TextareaEditor({ value, onChange, disabled }: EditorAdapterProps) {
  return (
    <textarea
      className="draft-editor"
      value={value}
      onChange={(event) => {
        onChange(event.target.value);
      }}
      disabled={disabled}
      placeholder="Draft content"
    />
  );
}
