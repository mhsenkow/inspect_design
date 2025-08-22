import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import InsertLinkDialog from "../InsertLinkDialog";
import { getPageTitle } from "../../hooks/functions";

jest.mock("../../hooks/functions");

describe("InsertLinkDialog", () => {
  const setHtmlMock = jest.fn();
  const mockFetch = jest.fn();
  global.fetch = mockFetch;

  beforeEach(() => {
    // setHtmlMock.mockClear();
    jest.clearAllMocks();
    // HTMLDialogElement not supported in jsdom
    // solution from: https://github.com/jsdom/jsdom/issues/3294#issuecomment-2499134049
    if (!HTMLDialogElement.prototype.showModal) {
      HTMLDialogElement.prototype.showModal = function () {
        this.open = true;
      };
    }
    if (!HTMLDialogElement.prototype.close) {
      HTMLDialogElement.prototype.close = function (returnValue: any) {
        this.open = false;
        this.returnValue = returnValue;
      };
    }
    (getPageTitle as jest.Mock).mockResolvedValue("Example Page");
  });

  it("renders the dialog with default state", () => {
    render(<InsertLinkDialog html="" setHtml={setHtmlMock} />);
    expect(screen.getByText("Insert a Link into Comment")).toBeInTheDocument();
    expect(screen.getByText("Specify an external link")).toBeInTheDocument();
    expect(
      screen.getByText("Or: Choose an existing link or insight"),
    ).toBeInTheDocument();
  });

  it("updates link URL input and fetches title", async () => {
    render(<InsertLinkDialog html="" setHtml={setHtmlMock} />);
    const input = screen.getByPlaceholderText("Paste URL");

    fireEvent.change(input, { target: { value: "https://example.com" } });
    expect(input).toHaveValue("https://example.com");

    await waitFor(() =>
      expect(screen.getByText("Loading link title...")).toBeInTheDocument(),
    );
  });

  it("displays error when fetching link title fails", async () => {
    (getPageTitle as jest.Mock).mockRejectedValueOnce(
      new Error("Network error"),
    );

    render(<InsertLinkDialog html="" setHtml={setHtmlMock} />);
    const input = screen.getByPlaceholderText("Paste URL");

    fireEvent.change(input, { target: { value: "https://example.com" } });

    await waitFor(() =>
      expect(
        screen.getByText("Could not get page title: Network error"),
      ).toBeInTheDocument(),
    );
    jest.restoreAllMocks();
  });

  it("closes the dialog when cancel is clicked", () => {
    render(<InsertLinkDialog html="" setHtml={setHtmlMock} />);
    const cancelButton = screen.getByText("Cancel");

    fireEvent.click(cancelButton);

    const dialog = document.getElementById(
      "insertLinkDialog",
    ) as HTMLDialogElement;
    expect(dialog.open).toBe(false);
  });

  it("allows entering a link URL", async () => {
    render(<InsertLinkDialog html="" setHtml={setHtmlMock} />);

    const urlInput = screen.getByPlaceholderText("Paste URL");
    fireEvent.change(urlInput, { target: { value: "https://example.com" } });
    expect(urlInput).toHaveValue("https://example.com");

    await waitFor(() =>
      expect(screen.getByText("Loading link title...")).toBeInTheDocument(),
    );

    await waitFor(() =>
      expect(screen.getByText("Example Page")).toBeInTheDocument(),
    );

    const submitButton = screen.getByText("Submit");
    expect(submitButton).toBeEnabled();
    fireEvent.click(submitButton);

    expect(setHtmlMock).toHaveBeenCalledWith(
      expect.stringMatching(/<a href="https:\/\/example.com.+"/i),
    );

    jest.restoreAllMocks();
  });

  it("allows selecting an existing insight", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () =>
        Promise.resolve([{ id: 1, title: "Insight 1", uid: "asdf" }]),
    });

    render(<InsertLinkDialog html="" setHtml={setHtmlMock} />);
    const insightRadio = screen.getByLabelText("Insight");

    fireEvent.click(insightRadio);

    expect(screen.getByText("Loading insights...")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("Insight 1")).toBeInTheDocument(),
    );

    const insightOption = screen.getByText("Insight 1").closest("tr");
    const checkbox = insightOption!.querySelector("input[type='checkbox']");
    fireEvent.click(checkbox!);

    const submitButton = screen.getByText("Submit");
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
      fireEvent.click(submitButton);
    });

    expect(setHtmlMock).toHaveBeenCalledWith(
      expect.stringMatching(/Insight: <a href="\/insights\/asdf".+/i),
    );
  });

  it("allows selecting an existing links", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () =>
        Promise.resolve([
          { id: 1, title: "Link 1", url: "https://link1.com", uid: "asdf2" },
        ]),
    });

    render(<InsertLinkDialog html="" setHtml={setHtmlMock} />);

    const linkRadio = screen.getByLabelText("Link");
    fireEvent.click(linkRadio);

    await waitFor(() =>
      expect(screen.getByText("Loading links...")).toBeInTheDocument(),
    );
    await waitFor(() => expect(screen.getByText("Link 1")).toBeInTheDocument());

    const linkOption = screen.getByText("Link 1").closest("tr");
    fireEvent.click(linkOption!.querySelector("input[type='checkbox']")!);

    const submitButton = screen.getByText("Submit");
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
      fireEvent.click(submitButton);
    });

    expect(setHtmlMock).toHaveBeenCalledWith(
      expect.stringMatching(/Link: <a href="\/links\/asdf2".+/i),
    );
  });
});
