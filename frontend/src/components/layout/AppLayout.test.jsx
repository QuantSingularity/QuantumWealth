import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "../../api/client";
import { useAuth } from "../../hooks/useAuth";
import AppLayout from "./AppLayout";

vi.mock("../../hooks/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("../../api/client", () => ({ auth: { unreadCount: vi.fn() } }));

const mockedUseAuth = vi.mocked(useAuth);
const logout = vi.fn();

const user = { full_name: "Ada Lovelace", email: "ada@example.com" };

function LoginProbe() {
  const location = useLocation();
  return <p>sign in page at {location.pathname}</p>;
}

function renderLayout(path = "/dashboard") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/dashboard" element={<AppLayout />}>
          <Route index element={<p>dashboard content</p>} />
          <Route path="goals" element={<p>goals content</p>} />
        </Route>
        <Route path="/login" element={<LoginProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AppLayout", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedUseAuth.mockReturnValue({ user, logout });
    auth.unreadCount.mockResolvedValue({ unread_count: 0 });
    logout.mockResolvedValue(undefined);
  });

  it("renders the page for the current route inside the layout", () => {
    renderLayout("/dashboard/goals");

    expect(screen.getByText("goals content")).toBeInTheDocument();
    expect(screen.queryByText("dashboard content")).not.toBeInTheDocument();
  });

  it("links to every section of the app", () => {
    renderLayout();

    const expected = {
      Dashboard: "/dashboard",
      Portfolios: "/dashboard/portfolios",
      Markets: "/dashboard/market",
      "Risk Engine": "/dashboard/risk",
      "AI Advisor": "/dashboard/advisor",
      "Tax Center": "/dashboard/tax",
      Goals: "/dashboard/goals",
      Settings: "/dashboard/settings",
    };
    for (const [name, href] of Object.entries(expected)) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
    }
  });

  it("marks the current section as active", () => {
    renderLayout("/dashboard/goals");

    expect(screen.getByRole("link", { name: "Goals" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("shows who is signed in", () => {
    renderLayout();

    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    // The initials appear in the sidebar footer and in the header.
    expect(screen.getAllByText("AL")).toHaveLength(2);
  });

  it("falls back to generic initials and a generic name without a profile", () => {
    mockedUseAuth.mockReturnValue({ user: null, logout });
    renderLayout();

    expect(screen.getAllByText("QW")).toHaveLength(2);
    expect(screen.getByText("User")).toBeInTheDocument();
  });

  describe("unread notifications", () => {
    it("shows no badge when there is nothing unread", async () => {
      renderLayout();

      await waitFor(() => expect(auth.unreadCount).toHaveBeenCalled());
      expect(screen.queryByText("3")).not.toBeInTheDocument();
    });

    it("shows the unread count", async () => {
      auth.unreadCount.mockResolvedValue({ unread_count: 3 });
      renderLayout();

      expect(await screen.findByText("3")).toBeInTheDocument();
    });

    it("caps the badge at 9+", async () => {
      auth.unreadCount.mockResolvedValue({ unread_count: 42 });
      renderLayout();

      expect(await screen.findByText("9+")).toBeInTheDocument();
    });

    it("ignores a failing notification request", async () => {
      auth.unreadCount.mockRejectedValue(new Error("network down"));
      renderLayout();

      await waitFor(() => expect(auth.unreadCount).toHaveBeenCalled());
      expect(screen.getByText("dashboard content")).toBeInTheDocument();
    });
  });

  it("signs out and returns to the login page", async () => {
    renderLayout();

    await userEvent.click(screen.getByTitle("Logout"));

    expect(logout).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText("sign in page at /login"),
    ).toBeInTheDocument();
  });
});
