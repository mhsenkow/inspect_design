import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import AppHeader from "../AppHeader";
import { cleanUrl } from "../../hooks/functions";

describe("AppHeader", () => {
  it("should render a clickable INSPECT logo", () => {
    // Mock window.location.origin
    delete (window as any).location;
    (window as any).location = { origin: "http://localhost" };

    window.open = jest.fn();

    render(<AppHeader />);
    
    // The component renders a span with emoji and text, not an image
    const inspectText = screen.getByText("INSPECT");
    expect(inspectText).toBeInTheDocument();
    expect(inspectText.tagName.toLowerCase()).toBe("strong");
    
    // Check that the parent div contains the emoji and text
    const logoContainer = inspectText.closest("div");
    expect(logoContainer).toHaveTextContent("INSPECT");
    expect(logoContainer).toHaveTextContent("🔍");

    // Test click functionality - wait for useEffect to set origin
    fireEvent.click(logoContainer!);
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
