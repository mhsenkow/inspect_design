import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import AppHeader from "../AppHeader";
import { cleanUrl } from "../../hooks/functions";

describe("AppHeader", () => {
  it("should render a clickable INSPECT logo", () => {
    window.location = { origin: "http://localhost", assign: jest.fn() } as any;

    render(<AppHeader />);
    const logo = screen.getByAltText("Inspect logo");
    expect(logo.tagName.toLowerCase()).toBe("img");
    expect(logo).toBeInTheDocument();
    expect(logo.closest("div")).toHaveTextContent("INSPECT");

    window.open = jest.fn();
    fireEvent.click(logo.closest("div")!);
    expect(window.open).toHaveBeenCalledWith("http://localhost", "_self");
  });

  it("should render a clickable Patreon logo", () => {
    render(<AppHeader />);
    const patreonLogo = screen.getByAltText("Become a patron at Patreon!");
    expect(patreonLogo).toBeInTheDocument();
    expect(cleanUrl(patreonLogo.closest("a")!.getAttribute("href")!)).toBe(
      "https://www.patreon.com/datagotchi",
    );
  });

  it("should render a description of the Patreon link", () => {
    render(<AppHeader />);
    const patreonDescription = screen.getByText(
      "Help me incubate Inspect and other DG projects to empower people with information!",
    );
    expect(patreonDescription).toBeInTheDocument();
    expect(patreonDescription.tagName.toLowerCase()).toBe("p");
  });

  it("should render a clickable Datagotchi Labs logo", async () => {
    render(<AppHeader />);
    const datagotchiLogo = screen.getByAltText("Datagotchi Labs logo");
    expect(datagotchiLogo).toBeInTheDocument();
    await expect(datagotchiLogo.closest("a")).toHaveAttribute(
      "href",
      "https://datagotchi.net",
    );
  });
});
