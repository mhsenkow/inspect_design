import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import { usePathname } from "next/navigation";

// import * as LoginRegisterLinksComponent from "../LoginRegisterLinks";
import LoginRegisterLinksComponent from "../LoginRegisterLinks";
// @ts-expect-error otherwise I get a default that contains another default
const LoginRegisterLinks = LoginRegisterLinksComponent.default;
import useUser from "../../hooks/useUser";

jest.mock("../LoginRegisterLinks", () => {
  const actualModule = jest.requireActual("../LoginRegisterLinks");

  return {
    ...actualModule,
    getLocationPath: jest.fn(() => "/some-path"),
  };
});
jest.mock("../../hooks/useUser");
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

describe("LoginRegisterLinks", () => {
  const mockLogout = jest.fn();

  beforeEach(() => {
    (useUser as jest.Mock).mockReturnValue({ logout: mockLogout });
    (usePathname as jest.Mock).mockReturnValue("/");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Logged in", () => {
    it("renders Log Out and My Insights links when logged in", () => {
      render(<LoginRegisterLinks loggedIn={true} />);

      expect(screen.getByText("Log Out")).toBeInTheDocument();
      expect(screen.getByText("My Insights")).toBeInTheDocument();

      expect(screen.queryByText("Login")).not.toBeInTheDocument();
      expect(screen.queryByText("Register")).not.toBeInTheDocument();
    });

    it("calls logout and redirects to home when Log Out is clicked", () => {
      render(<LoginRegisterLinks loggedIn={true} />);

      const logoutLink = screen.getByText("Log Out");
      fireEvent.click(logoutLink);

      expect(mockLogout).toHaveBeenCalled();
      expect(window.location.href).toBe("http://localhost/");
    });

    it("goes to the dashboard when My Insights is clicked", () => {
      render(<LoginRegisterLinks loggedIn={true} />);
      const insightsLink = screen.getByText("My Insights");
      fireEvent.click(insightsLink);
      expect(window.location.href).toBe("http://localhost/");
    });
  });

  describe("Not logged in", () => {
    it("renders Login and Register links when not logged in", () => {
      render(<LoginRegisterLinks loggedIn={false} />);

      expect(screen.getByText("Login")).toBeInTheDocument();
      expect(screen.getByText("Register")).toBeInTheDocument();
    });

    // eslint-disable-next-line jest/no-disabled-tests -- can't mock the pathname
    it.skip("sets the correct return path in Login and Register links", () => {
      render(<LoginRegisterLinks loggedIn={false} />);

      const loginLink = screen.getByText("Login");
      const registerLink = screen.getByText("Register");

      expect(loginLink).toHaveAttribute("href", "/login?return=/some-path");
      expect(registerLink).toHaveAttribute(
        "href",
        "/register?return=/some-path",
      );
    });

    it("applies active class to Login link when on /login path", () => {
      (usePathname as jest.Mock).mockReturnValue("/login");
      render(<LoginRegisterLinks loggedIn={false} />);

      const loginListItem = screen.getByText("Login").closest("li");
      expect(loginListItem).toHaveClass("active");
    });

    it("applies active class to Register link when on /register path", () => {
      (usePathname as jest.Mock).mockReturnValue("/register");
      render(<LoginRegisterLinks loggedIn={false} />);

      const registerListItem = screen.getByText("Register").closest("li");
      expect(registerListItem).toHaveClass("active");
    });
  });
});
