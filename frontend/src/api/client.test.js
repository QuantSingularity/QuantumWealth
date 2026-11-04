import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { advisor, auth, market, portfolio, risk, tax } from "./client";

const ACCESS_KEY = "qw_access_token";
const REFRESH_KEY = "qw_refresh_token";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// A Response body can only be read once, so build a fresh one for every call.
function mockFetch(makeResponse = () => jsonResponse({})) {
  const fetchMock = vi
    .fn()
    .mockImplementation(() => Promise.resolve(makeResponse()));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function call(fetchMock, index = fetchMock.mock.calls.length - 1) {
  const [url, options] = fetchMock.mock.calls[index];
  // The refresh call passes a relative URL, which fetch accepts but URL does not.
  return { url: new URL(url, "http://localhost"), options };
}

// The client redirects with window.location.href, which jsdom cannot navigate.
function stubLocation() {
  const location = { origin: "http://localhost", href: "http://localhost/" };
  vi.stubGlobal("location", location);
  return location;
}

beforeEach(() => {
  stubLocation();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("token helpers", () => {
  it("starts without a token", () => {
    expect(auth.getToken()).toBeNull();
  });

  it("stores the access and refresh tokens", () => {
    auth.setTokens("access-1", "refresh-1");

    expect(auth.getToken()).toBe("access-1");
    expect(localStorage.getItem(REFRESH_KEY)).toBe("refresh-1");
  });

  it("keeps the existing refresh token when none is given", () => {
    auth.setTokens("access-1", "refresh-1");

    auth.setTokens("access-2");

    expect(auth.getToken()).toBe("access-2");
    expect(localStorage.getItem(REFRESH_KEY)).toBe("refresh-1");
  });

  it("clears both tokens", () => {
    auth.setTokens("access-1", "refresh-1");

    auth.clearTokens();

    expect(localStorage.getItem(ACCESS_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull();
  });
});

describe("requests", () => {
  it("calls the versioned API on the current origin", async () => {
    const fetchMock = mockFetch();

    await portfolio.list();

    const { url, options } = call(fetchMock);
    expect(url.origin).toBe("http://localhost");
    expect(url.pathname).toBe("/api/v1/portfolio/");
    expect(options.method).toBe("GET");
    expect(options.body).toBeNull();
  });

  it("sends JSON with no auth header when signed out", async () => {
    const fetchMock = mockFetch();

    await market.sectors();

    expect(call(fetchMock).options.headers).toEqual({
      "Content-Type": "application/json",
    });
  });

  it("attaches the bearer token once one is stored", async () => {
    auth.setTokens("access-1");
    const fetchMock = mockFetch();

    await auth.me();

    expect(call(fetchMock).options.headers.Authorization).toBe(
      "Bearer access-1",
    );
  });

  it("returns the parsed JSON body", async () => {
    mockFetch(() => jsonResponse({ id: 7, name: "Retirement" }));

    await expect(portfolio.get(7)).resolves.toEqual({
      id: 7,
      name: "Retirement",
    });
  });

  it("returns null for an empty 204 response", async () => {
    mockFetch(() => new Response(null, { status: 204 }));

    await expect(portfolio.delete(7)).resolves.toBeNull();
  });

  it("adds query parameters and skips empty ones", async () => {
    const fetchMock = mockFetch();

    await portfolio.transactions(3, { page: 2, type: null, ticker: undefined });

    const { url } = call(fetchMock);
    expect(url.pathname).toBe("/api/v1/portfolio/3/transactions/");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.has("type")).toBe(false);
    expect(url.searchParams.has("ticker")).toBe(false);
  });

  it("serialises request bodies as JSON", async () => {
    const fetchMock = mockFetch();

    await auth.login("ada@example.com", "secret123");

    const { url, options } = call(fetchMock);
    expect(url.pathname).toBe("/api/v1/auth/login/");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({
      email: "ada@example.com",
      password: "secret123",
    });
  });

  it("sends no body for posts without a payload", async () => {
    const fetchMock = mockFetch();

    await auth.markAllRead();

    expect(call(fetchMock).options.body).toBeNull();
  });
});

describe("endpoint shapes", () => {
  it("uses PATCH for updates and DELETE for removals", async () => {
    const fetchMock = mockFetch();

    await portfolio.update(3, { name: "Growth" });
    expect(call(fetchMock).options.method).toBe("PATCH");
    expect(call(fetchMock).url.pathname).toBe("/api/v1/portfolio/3/");

    await auth.deletePriceAlert(9);
    expect(call(fetchMock).options.method).toBe("DELETE");
    expect(call(fetchMock).url.pathname).toBe("/api/v1/auth/price-alerts/9/");
  });

  it("wraps payloads the way the API expects", async () => {
    const fetchMock = mockFetch();

    await auth.riskQuestionnaire([1, 2, 3]);
    expect(JSON.parse(call(fetchMock).options.body)).toEqual({
      answers: [1, 2, 3],
    });

    await market.bulkQuotes(["AAPL", "MSFT"]);
    expect(JSON.parse(call(fetchMock).options.body)).toEqual({
      tickers: ["AAPL", "MSFT"],
    });

    await auth.logout("refresh-1");
    expect(JSON.parse(call(fetchMock).options.body)).toEqual({
      refresh: "refresh-1",
    });
  });

  it("searches markets with a q parameter", async () => {
    const fetchMock = mockFetch();

    await market.search("apple");

    const { url } = call(fetchMock);
    expect(url.pathname).toBe("/api/v1/market/search/");
    expect(url.searchParams.get("q")).toBe("apple");
  });

  it("builds portfolio-scoped paths for risk, advisor and tax", async () => {
    const fetchMock = mockFetch();

    await risk.report(5);
    expect(call(fetchMock).url.pathname).toBe("/api/v1/risk/report/5/");

    await advisor.drift(5);
    expect(call(fetchMock).url.pathname).toBe("/api/v1/advisor/drift/5/");

    await tax.harvest(5, { threshold: 100 });
    expect(call(fetchMock).url.pathname).toBe("/api/v1/tax/harvest/5/");
    expect(call(fetchMock).options.method).toBe("POST");
  });
});

describe("errors", () => {
  it.each([
    [
      "a plain detail string",
      { error: true, code: "invalid", detail: "Wrong password." },
      "Wrong password.",
    ],
    [
      "a nested detail message",
      { detail: { detail: "Account locked." } },
      "Account locked.",
    ],
    [
      "the first non-field error",
      { detail: { non_field_errors: ["Passwords differ."] } },
      "Passwords differ.",
    ],
    ["a generic fallback", { detail: { email: ["Taken."] } }, "Request failed"],
  ])("builds the message from %s", async (_label, body, expected) => {
    mockFetch(() => jsonResponse(body, 400));

    const error = await auth.register({}).catch((e) => e);

    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(400);
    expect(error.message).toBe(expected);
  });

  it("unwraps the original error body into err.data", async () => {
    const wrapped = {
      error: true,
      code: "invalid",
      detail: { email: ["Taken."] },
    };
    mockFetch(() => jsonResponse(wrapped, 400));

    const error = await auth.register({}).catch((e) => e);

    expect(error.data).toEqual({ email: ["Taken."] });
  });

  it("uses the whole body when it has no detail field", async () => {
    mockFetch(() => jsonResponse({ email: ["Taken."] }, 400));

    const error = await auth.register({}).catch((e) => e);

    expect(error.data).toEqual({ email: ["Taken."] });
  });

  it("reports a 401 without a token as an ordinary error", async () => {
    const location = stubLocation();
    mockFetch(() => jsonResponse({ detail: "Invalid credentials." }, 401));

    const error = await auth.login("a@b.com", "wrong").catch((e) => e);

    expect(error.status).toBe(401);
    expect(error.message).toBe("Invalid credentials.");
    expect(location.href).toBe("http://localhost/");
  });

  // Known defect: the client always calls res.json(), so an error response that
  // is not JSON (for example an HTML 502 page from a proxy) rejects with a
  // SyntaxError instead of an error carrying the HTTP status. it.fails flips to
  // a failure once that is fixed, as a cue to make this a normal test.
  it.fails(
    "reports a non-JSON error response with its HTTP status",
    async () => {
      mockFetch(
        () => new Response("<html>Bad Gateway</html>", { status: 502 }),
      );

      const error = await portfolio.list().catch((e) => e);

      expect(error.status).toBe(502);
    },
  );
});

describe("expired sessions", () => {
  it("refreshes the token and retries the request", async () => {
    auth.setTokens("expired", "refresh-1");
    const responses = [
      jsonResponse({ detail: "expired" }, 401),
      jsonResponse({ access: "fresh", refresh: "refresh-2" }),
      jsonResponse({ id: 1, name: "Retirement" }),
    ];
    const fetchMock = mockFetch(() => responses.shift());

    await expect(portfolio.get(1)).resolves.toEqual({
      id: 1,
      name: "Retirement",
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(call(fetchMock, 1).url.pathname).toBe("/api/v1/auth/token/refresh/");
    expect(JSON.parse(call(fetchMock, 1).options.body)).toEqual({
      refresh: "refresh-1",
    });
    expect(call(fetchMock, 2).options.headers.Authorization).toBe(
      "Bearer fresh",
    );
    expect(auth.getToken()).toBe("fresh");
    expect(localStorage.getItem(REFRESH_KEY)).toBe("refresh-2");
  });

  it("signs the user out when the refresh is rejected", async () => {
    const location = stubLocation();
    auth.setTokens("expired", "refresh-1");
    const responses = [
      jsonResponse({ detail: "expired" }, 401),
      jsonResponse({ detail: "refresh expired" }, 401),
    ];
    mockFetch(() => responses.shift());

    const result = await portfolio.list();

    expect(result).toBeUndefined();
    expect(auth.getToken()).toBeNull();
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull();
    expect(location.href).toBe("/login");
  });

  it("signs the user out straight away when there is no refresh token", async () => {
    const location = stubLocation();
    auth.setTokens("expired");
    const fetchMock = mockFetch(() => jsonResponse({ detail: "expired" }, 401));

    await portfolio.list();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(auth.getToken()).toBeNull();
    expect(location.href).toBe("/login");
  });

  it("signs the user out when the refresh request itself fails", async () => {
    const location = stubLocation();
    auth.setTokens("expired", "refresh-1");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ detail: "expired" }, 401))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);

    await portfolio.list();

    expect(auth.getToken()).toBeNull();
    expect(location.href).toBe("/login");
  });
});
