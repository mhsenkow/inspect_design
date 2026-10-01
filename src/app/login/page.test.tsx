import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import LoginForm from "./LoginForm";
import { handleLogin } from "./LoginPageFunctions";

const replace = jest.fn();

jest.mock("./LoginPageFunctions");
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace }),
  useSearchParams: () => new URLSearchParams("return=/insights"),
}));
jest.mock("../hooks/useUser", () => () => ({
  loggedIn: false,
  setLoggedIn: jest.fn(),
  setToken: jest.fn(),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders login form", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/^Email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("handles login successfully", async () => {
    const user = { token: "fake-token" };
    const mockHandleLogin = handleLogin as jest.Mock;
    mockHandleLogin.mockResolvedValueOnce(user);

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/^Email$/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(mockHandleLogin).toHaveBeenCalledTimes(1);
    });
    expect(mockHandleLogin).toHaveBeenCalledWith(
      "test@example.com",
      "password",
    );
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/insights");
    });
  });
});
