import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import RegisterPage from "./RegisterPage";

vi.mock("../hooks/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("../api/client", () => ({ auth: { register: vi.fn() } }));

const mockedUseAuth = vi.mocked(useAuth);
const login = vi.fn();

function Destination() {
  const location = useLocation();
  return <p>arrived at {location.pathname}</p>;
}

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Destination />} />
      </Routes>
    </MemoryRouter>,
  );
}

async function completeStepOne() {
  await userEvent.type(
    screen.getByPlaceholderText("Jane Smith"),
    "Ada Lovelace",
  );
  await userEvent.type(
    screen.getByPlaceholderText("jane@example.com"),
    "ada@example.com",
  );
  await userEvent.click(screen.getByRole("button", { name: /Continue/ }));
}

async function completeStepTwo({
  password = "secret123",
  confirm = password,
} = {}) {
  await userEvent.type(
    screen.getByPlaceholderText("Min. 8 characters"),
    password,
  );
  await userEvent.type(screen.getByPlaceholderText("Repeat password"), confirm);
  await userEvent.click(screen.getByRole("button", { name: /Create Account/ }));
}

describe("RegisterPage", () => {
  beforeEach(() => {
    login.mockReset();
    auth.register.mockReset();
    mockedUseAuth.mockReset();
    mockedUseAuth.mockReturnValue({ login });
  });

  describe("step 1", () => {
    it("asks for the basic details first", () => {
      renderRegister();

      expect(
        screen.getByRole("heading", { name: "Create your account" }),
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Jane Smith")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("jane@example.com"),
      ).toBeInTheDocument();
      expect(
        screen.queryByPlaceholderText("Min. 8 characters"),
      ).not.toBeInTheDocument();
    });

    it("defaults to the United States and US dollars", () => {
      renderRegister();

      const [country, currency] = screen.getAllByRole("combobox");
      expect(country).toHaveValue("US");
      expect(currency).toHaveValue("USD");
    });

    it("moves to the password step once name and email are given", async () => {
      renderRegister();

      await completeStepOne();

      expect(
        screen.getByRole("heading", { name: "Set your password" }),
      ).toBeInTheDocument();
    });

    it("keeps the entered details when going back", async () => {
      renderRegister();
      await completeStepOne();

      await userEvent.click(screen.getByRole("button", { name: "Back" }));

      expect(screen.getByPlaceholderText("Jane Smith")).toHaveValue(
        "Ada Lovelace",
      );
      expect(screen.getByPlaceholderText("jane@example.com")).toHaveValue(
        "ada@example.com",
      );
    });
  });

  describe("step 2", () => {
    it("rejects mismatched passwords without calling the API", async () => {
      renderRegister();
      await completeStepOne();

      await completeStepTwo({ password: "secret123", confirm: "different1" });

      expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
      expect(auth.register).not.toHaveBeenCalled();
    });

    it("registers, signs in and opens the dashboard", async () => {
      auth.register.mockResolvedValue({});
      login.mockResolvedValue({});
      renderRegister();
      await completeStepOne();

      await completeStepTwo();

      expect(auth.register).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "ada@example.com",
          full_name: "Ada Lovelace",
          password: "secret123",
          password2: "secret123",
          country: "US",
          currency: "USD",
        }),
      );
      expect(login).toHaveBeenCalledWith("ada@example.com", "secret123");
      expect(
        await screen.findByText("arrived at /dashboard"),
      ).toBeInTheDocument();
    });

    it("shows the server's detail message and stays on the page", async () => {
      auth.register.mockRejectedValue({
        data: { detail: "Registration is closed." },
      });
      renderRegister();
      await completeStepOne();

      await completeStepTwo();

      expect(
        await screen.findByText("Registration is closed."),
      ).toBeInTheDocument();
      expect(screen.queryByText(/arrived at/)).not.toBeInTheDocument();
    });

    it("shows a server error for a password field under that field", async () => {
      auth.register.mockRejectedValue({
        data: { password: ["This password is too common."] },
      });
      renderRegister();
      await completeStepOne();

      await completeStepTwo();

      expect(
        await screen.findByText("This password is too common."),
      ).toBeInTheDocument();
    });

    // Known defect: an error without details (a network failure, for example)
    // leaves err.data empty, so the field-errors branch wins and the generic
    // "Registration failed." message is never reached. The user sees nothing.
    // it.fails flips to a failure once that is fixed, as a cue to make this a
    // normal test.
    it.fails(
      "falls back to a generic message when the error has no details",
      async () => {
        auth.register.mockRejectedValue(new Error("network down"));
        renderRegister();
        await completeStepOne();

        await completeStepTwo();

        expect(
          await screen.findByText("Registration failed."),
        ).toBeInTheDocument();
      },
    );

    // Known defect: the email and name inputs live on step 1, but a server error
    // for them arrives while the user is on step 2, where nothing renders it.
    // The user sees a failed submit with no explanation until they click Back.
    // it.fails flips to a failure once that is fixed, as a cue to make this a
    // normal test.
    it.fails("shows a server error about the email address", async () => {
      auth.register.mockRejectedValue({
        data: { email: ["A user with this email already exists."] },
      });
      renderRegister();
      await completeStepOne();

      await completeStepTwo();

      expect(
        await screen.findByText("A user with this email already exists."),
      ).toBeInTheDocument();
    });

    it("does show the email error after going back to step 1", async () => {
      auth.register.mockRejectedValue({
        data: { email: ["A user with this email already exists."] },
      });
      renderRegister();
      await completeStepOne();
      await completeStepTwo();

      await userEvent.click(
        await screen.findByRole("button", { name: "Back" }),
      );

      expect(
        screen.getByText("A user with this email already exists."),
      ).toBeInTheDocument();
    });
  });
});
