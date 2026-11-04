import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { auth } from "./api/client";

// Only the network layer is faked: the real AuthProvider, router, layout, home
// page and auth pages run.
vi.mock("./api/client", () => ({
  auth: {
    getToken: vi.fn(),
    me: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    setTokens: vi.fn(),
    clearTokens: vi.fn(),
    unreadCount: vi.fn(),
  },
}));

// The real dashboard pages pull in charts and many API calls, so each one is a
// one-line stand-in.
vi.mock("./pages/DashboardPage", () => ({
  default: () => <p>dashboard page</p>,
}));
vi.mock("./pages/PortfoliosPage", () => ({
  default: () => <p>portfolios page</p>,
}));
vi.mock("./pages/PortfolioDetailPage", () => ({
  default: () => <p>portfolio detail page</p>,
}));
vi.mock("./pages/MarketPage", () => ({ default: () => <p>market page</p> }));
vi.mock("./pages/RiskPage", () => ({ default: () => <p>risk page</p> }));
vi.mock("./pages/AdvisorPage", () => ({ default: () => <p>advisor page</p> }));
vi.mock("./pages/TaxPage", () => ({ default: () => <p>tax page</p> }));
vi.mock("./pages/GoalsPage", () => ({ default: () => <p>goals page</p> }));
vi.mock("./pages/SettingsPage", () => ({
  default: () => <p>settings page</p>,
}));

const user = { id: 1, full_name: "Ada Lovelace", email: "ada@example.com" };

const LANDING = { level: 1, name: /wealth intelligence/i };
const SIGN_IN = { name: "Sign in" };

// App owns its BrowserRouter, so navigation is driven through the real history.
function renderAt(path) {
  window.history.pushState({}, "", path);
  return render(<App />);
}

function signedIn() {
  auth.getToken.mockReturnValue("valid-token");
  auth.me.mockResolvedValue(user);
}

describe("App routing", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.getToken.mockReturnValue(null);
    auth.unreadCount.mockResolvedValue({ unread_count: 0 });
    window.history.pushState({}, "", "/");
  });

  describe("anonymous visitors", () => {
    it("see the landing page on /", async () => {
      renderAt("/");

      expect(await screen.findByRole("heading", LANDING)).toBeInTheDocument();
      expect(
        screen.getAllByRole("link", { name: "Get Started" }).length,
      ).toBeGreaterThan(0);
    });

    it("can open the sign in page", async () => {
      renderAt("/login");

      expect(await screen.findByRole("heading", SIGN_IN)).toBeInTheDocument();
    });

    it("can open the registration page", async () => {
      renderAt("/register");

      expect(
        await screen.findByRole("heading", { name: "Create your account" }),
      ).toBeInTheDocument();
    });

    it.each([
      "/dashboard",
      "/dashboard/portfolios",
      "/dashboard/portfolios/7",
      "/dashboard/settings",
    ])("are redirected from %s to the sign in page", async (path) => {
      renderAt(path);

      expect(await screen.findByRole("heading", SIGN_IN)).toBeInTheDocument();
      expect(window.location.pathname).toBe("/login");
    });

    it("are sent to the landing page for unknown paths", async () => {
      renderAt("/does-not-exist");

      expect(await screen.findByRole("heading", LANDING)).toBeInTheDocument();
      expect(window.location.pathname).toBe("/");
    });
  });

  describe("signed in users", () => {
    beforeEach(signedIn);

    it.each([
      ["/dashboard", "dashboard page"],
      ["/dashboard/portfolios", "portfolios page"],
      ["/dashboard/portfolios/7", "portfolio detail page"],
      ["/dashboard/market", "market page"],
      ["/dashboard/risk", "risk page"],
      ["/dashboard/advisor", "advisor page"],
      ["/dashboard/tax", "tax page"],
      ["/dashboard/goals", "goals page"],
      ["/dashboard/settings", "settings page"],
    ])("can open %s", async (path, text) => {
      renderAt(path);

      expect(await screen.findByText(text)).toBeInTheDocument();
    });

    it("see the app layout around the pages", async () => {
      renderAt("/dashboard");

      expect(await screen.findByText("dashboard page")).toBeInTheDocument();
      expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Portfolios" }),
      ).toBeInTheDocument();
    });

    it.each(["/login", "/register"])(
      "are sent from %s straight to the dashboard",
      async (path) => {
        renderAt(path);

        expect(await screen.findByText("dashboard page")).toBeInTheDocument();
        expect(window.location.pathname).toBe("/dashboard");
      },
    );
  });

  it("shows a loading screen while the session is being checked", async () => {
    auth.getToken.mockReturnValue("valid-token");
    auth.me.mockReturnValue(new Promise(() => {}));

    renderAt("/dashboard");

    expect(
      screen.getByText("Initializing QuantumWealth..."),
    ).toBeInTheDocument();
  });

  it("drops a stale token and treats the visitor as anonymous", async () => {
    auth.getToken.mockReturnValue("revoked-token");
    auth.me.mockRejectedValue(new Error("unauthorized"));

    renderAt("/dashboard");

    expect(await screen.findByRole("heading", SIGN_IN)).toBeInTheDocument();
    expect(auth.clearTokens).toHaveBeenCalled();
  });
});
