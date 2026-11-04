import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../hooks/useAuth";
import LoginPage from "./LoginPage";

vi.mock("../hooks/useAuth", () => ({ useAuth: vi.fn() }));

const mockedUseAuth = vi.mocked(useAuth);
const login = vi.fn();

// Stands in for whatever page sign in redirects to.
function Destination() {
  const location = useLocation();
  return <p>arrived at {location.pathname}</p>;
}

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Destination />} />
      </Routes>
    </MemoryRouter>,
  );
}

const email = () => screen.getByPlaceholderText("you@example.com");
const password = () => screen.getByPlaceholderText("••••••••");
const submit = () => screen.getByRole("button", { name: "Sign In" });

async function fillAndSubmit() {
  await userEvent.type(email(), "ada@example.com");
  await userEvent.type(password(), "secret123");
  await userEvent.click(submit());
}

describe("LoginPage", () => {
  beforeEach(() => {
    login.mockReset();
    mockedUseAuth.mockReset();
    mockedUseAuth.mockReturnValue({ login });
  });

  it("renders the sign in form", () => {
    renderLogin();

    expect(
      screen.getByRole("heading", { name: "Sign in" }),
    ).toBeInTheDocument();
    expect(email()).toHaveAttribute("type", "email");
    expect(password()).toHaveAttribute("type", "password");
    expect(screen.getByRole("link", { name: "Create one" })).toHaveAttribute(
      "href",
      "/register",
    );
  });

  it("signs in and opens the dashboard", async () => {
    login.mockResolvedValue({});
    renderLogin();

    await fillAndSubmit();

    expect(login).toHaveBeenCalledWith("ada@example.com", "secret123");
    expect(
      await screen.findByText("arrived at /dashboard"),
    ).toBeInTheDocument();
  });

  it.each([
    [
      "the server's detail message",
      { data: { detail: "Account locked." } },
      "Account locked.",
    ],
    [
      "the first non-field error",
      { data: { non_field_errors: ["Wrong email or password."] } },
      "Wrong email or password.",
    ],
    ["a generic message", new Error("network down"), "Invalid credentials."],
  ])("shows %s when sign in fails", async (_label, failure, message) => {
    login.mockRejectedValue(failure);
    renderLogin();

    await fillAndSubmit();

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.queryByText(/arrived at/)).not.toBeInTheDocument();
  });

  it("clears an earlier error when submitted again", async () => {
    login
      .mockRejectedValueOnce({ data: { detail: "Account locked." } })
      .mockResolvedValueOnce({});
    renderLogin();

    await fillAndSubmit();
    await screen.findByText("Account locked.");
    await userEvent.click(submit());

    expect(
      await screen.findByText("arrived at /dashboard"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Account locked.")).not.toBeInTheDocument();
  });

  it("disables the button while signing in", async () => {
    let finish = () => {};
    login.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const { container } = renderLogin();

    await fillAndSubmit();

    expect(container.querySelector("button[type=submit]")).toBeDisabled();

    finish({});
    expect(
      await screen.findByText("arrived at /dashboard"),
    ).toBeInTheDocument();
  });

  it("toggles password visibility", async () => {
    renderLogin();
    const field = password();
    const toggle = within(field.parentElement).getByRole("button");

    await userEvent.click(toggle);
    expect(field).toHaveAttribute("type", "text");

    await userEvent.click(toggle);
    expect(field).toHaveAttribute("type", "password");
  });
});
