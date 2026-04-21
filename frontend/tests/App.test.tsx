import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";

describe("App", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url.endsWith("/api/v1/healthz")) {
          return Response.json({ status: "ok", app_name: "Tooth API" });
        }
        return new Response("not found", { status: 404 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the app title", async () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1, name: /tooth gate 2/i })).toBeInTheDocument();
    expect(await screen.findByText(/API healthy/i)).toBeInTheDocument();
  });
});
