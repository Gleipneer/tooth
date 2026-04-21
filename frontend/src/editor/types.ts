import type { ReactElement } from "react";

export type EditorAdapterProps = {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
};

export type EditorAdapter = {
  id: string;
  label: string;
  Component: (props: EditorAdapterProps) => ReactElement;
};
