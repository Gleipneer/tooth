import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";

describe("Gate 2 shell", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url.endsWith("/api/v1/healthz")) {
          return Response.json({ status: "ok", app_name: "Tooth API" });
        }
        if (url.includes("/api/v1/auth/login") && init?.method === "POST") {
          return Response.json({ access_token: "test-token", token_type: "bearer" });
        }
        if (url.endsWith("/api/v1/auth/me")) {
          return Response.json({
            id: "11111111-1111-1111-1111-111111111111",
            email: "alice@example.com",
            is_active: true,
          });
        }
        if (url.endsWith("/api/v1/projects")) {
          return Response.json([]);
        }
        return new Response("not found", { status: 404 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads session and shows user email after login", async () => {
    render(<App />);
    expect(await screen.findByText(/API healthy/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "alice@example.com" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "password12" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/alice@example.com/i)).toBeInTheDocument();

    await waitFor(() => {
      const fetchMock = vi.mocked(globalThis.fetch);
      const meCalls = fetchMock.mock.calls.filter(([u]) => u.toString().endsWith("/api/v1/auth/me"));
      expect(meCalls.length).toBeGreaterThanOrEqual(1);
    });
  });
});
