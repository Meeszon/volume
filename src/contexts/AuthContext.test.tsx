import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { AuthProvider } from "./AuthContext";
import { useAuth } from "./useAuth";

const { mockGetSession, mockOnAuthStateChange, mockSignOut, mockUnsubscribe } = vi.hoisted(
  () => ({
    mockGetSession: vi.fn(),
    mockOnAuthStateChange: vi.fn(),
    mockSignOut: vi.fn(),
    mockUnsubscribe: vi.fn(),
  }),
);

vi.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signOut: mockSignOut,
    },
  },
}));

function TestConsumer() {
  const { session, loading, signOut } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="session">{session ? "active" : "none"}</span>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });
    mockSignOut.mockResolvedValue({ error: null });
  });

  it("starts in loading state and resolves to no session", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await act(() => Promise.resolve());

    expect(screen.getByTestId("loading").textContent).toBe("false");
    expect(screen.getByTestId("session").textContent).toBe("none");
  });

  it("provides active session when getSession returns one", async () => {
    const fakeSession = { user: { id: "user-1" }, access_token: "tok" };
    mockGetSession.mockResolvedValue({ data: { session: fakeSession } });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await act(() => Promise.resolve());

    expect(screen.getByTestId("session").textContent).toBe("active");
  });

  it("updates session when auth state changes", async () => {
    let authCallback: (event: string, session: unknown) => void;
    mockOnAuthStateChange.mockImplementation(
      (cb: (event: string, session: unknown) => void) => {
        authCallback = cb;
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
      },
    );

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await act(() => Promise.resolve());
    expect(screen.getByTestId("session").textContent).toBe("none");

    const fakeSession = { user: { id: "user-1" }, access_token: "tok" };
    await act(() => {
      authCallback("SIGNED_IN", fakeSession);
    });

    expect(screen.getByTestId("session").textContent).toBe("active");
  });

  it("calls supabase signOut", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await act(() => Promise.resolve());
    await act(() => {
      screen.getByText("Sign Out").click();
    });

    expect(mockSignOut).toHaveBeenCalled();
  });

  it("throws when useAuth is used outside AuthProvider", () => {
    expect(() => render(<TestConsumer />)).toThrow(
      "useAuth must be used within AuthProvider",
    );
  });
});
