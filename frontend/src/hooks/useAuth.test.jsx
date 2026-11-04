import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "../api/client";
import { AuthProvider, useAuth } from "./useAuth";

// The hook talks to the network only through ../api/client, so fake that module.
vi.mock("../api/client", () => ({
  auth: {
    getToken: vi.fn(),
    me: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    setTokens: vi.fn(),
    clearTokens: vi.fn(),
  },
}));

const user = { id: 1, full_name: "Ada Lovelace", email: "ada@example.com" };

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

async function renderAuth() {
  const hook = renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.getToken.mockReturnValue(null);
    auth.logout.mockResolvedValue({});
  });

  describe("restoring a session", () => {
    it("is signed out when there is no stored token", async () => {
      const { result } = await renderAuth();

      expect(result.current.user).toBeNull();
      expect(auth.me).not.toHaveBeenCalled();
    });

    it("loads the user for a stored token", async () => {
      auth.getToken.mockReturnValue("stored-token");
      auth.me.mockResolvedValue(user);

      const { result } = await renderAuth();

      expect(result.current.user).toEqual(user);
    });

    it("discards a token the server rejects", async () => {
      auth.getToken.mockReturnValue("revoked-token");
      auth.me.mockRejectedValue(new Error("unauthorized"));

      const { result } = await renderAuth();

      expect(result.current.user).toBeNull();
      expect(auth.clearTokens).toHaveBeenCalled();
    });

    it("keeps loading until the token check has finished", async () => {
      auth.getToken.mockReturnValue("stored-token");
      let finish = () => {};
      auth.me.mockReturnValue(
        new Promise((resolve) => {
          finish = () => resolve(user);
        }),
      );

      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.loading).toBe(true);

      await act(async () => finish());

      expect(result.current.loading).toBe(false);
      expect(result.current.user).toEqual(user);
    });
  });

  describe("login", () => {
    it("stores both tokens and signs the user in", async () => {
      const response = { access: "a1", refresh: "r1", user };
      auth.login.mockResolvedValue(response);
      const { result } = await renderAuth();

      let returned;
      await act(async () => {
        returned = await result.current.login("ada@example.com", "secret123");
      });

      expect(auth.login).toHaveBeenCalledWith("ada@example.com", "secret123");
      expect(auth.setTokens).toHaveBeenCalledWith("a1", "r1");
      expect(returned).toEqual(response);
      expect(result.current.user).toEqual(user);
    });

    it("stays signed out and rethrows when the login fails", async () => {
      auth.login.mockRejectedValue(new Error("bad credentials"));
      const { result } = await renderAuth();

      await expect(
        act(async () => {
          await result.current.login("ada@example.com", "wrong");
        }),
      ).rejects.toThrow("bad credentials");

      expect(result.current.user).toBeNull();
      expect(auth.setTokens).not.toHaveBeenCalled();
    });
  });

  describe("logout", () => {
    async function renderSignedIn() {
      auth.getToken.mockReturnValue("stored-token");
      auth.me.mockResolvedValue(user);
      localStorage.setItem("qw_refresh_token", "r1");
      return renderAuth();
    }

    it("revokes the refresh token and clears the session", async () => {
      const { result } = await renderSignedIn();

      await act(async () => {
        await result.current.logout();
      });

      expect(auth.logout).toHaveBeenCalledWith("r1");
      expect(auth.clearTokens).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
    });

    it("still signs the user out when the server cannot be reached", async () => {
      auth.logout.mockRejectedValue(new Error("network down"));
      const { result } = await renderSignedIn();

      await act(async () => {
        await result.current.logout();
      });

      expect(auth.clearTokens).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
    });
  });

  it("lets a page replace the user, for example after a profile edit", async () => {
    const { result } = await renderAuth();

    act(() => result.current.setUser(user));

    expect(result.current.user).toEqual(user);
  });
});

describe("useAuth", () => {
  it("returns nothing outside an AuthProvider", () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current).toBeNull();
  });
});
