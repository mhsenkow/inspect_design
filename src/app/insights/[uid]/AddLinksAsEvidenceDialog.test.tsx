/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import AddLinksAsEvidenceDialog from "./AddLinksAsEvidenceDialog";
import useUser from "../../hooks/useUser";
import { getUnreadSummariesForCurrentUser, debounce } from "../../functions";
import { Insight } from "../../types";
import ServerActionContext from "../../contexts/ServerActionContext";

jest.mock("../../hooks/useUser");
jest.mock("../../hooks/useLinks");
jest.mock("../../components/SelectedCitationsAPI");
jest.mock("../../functions");

describe("AddLinksAsEvidenceDialog", () => {
  const mockInsight = {
    uid: "1",
    title: "Test Insight",
    evidence: [],
    comments: [],
    reactions: [],
  } as unknown as Insight;

  const mockToken = "mockToken";
  const mockLinks = [
    {
      id: 1,
      uid: "1",
      title: "Link 1",
      url: "http://link1.com",
      updated_at: "2023-01-01",
      comments: [],
      reactions: [],
    },
    {
      id: 2,
      uid: "2",
      title: "Link 2",
      url: "http://link2.com",
      updated_at: "2023-01-02",
      comments: [],
      reactions: [],
    },
  ];

  const mockSetServerFunctionInput = jest.fn();
  const mockSetActiveServerFunction = jest.fn();
  const executeAction = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    (useUser as jest.Mock).mockReturnValue({ token: mockToken });
    executeAction.mockClear();
    (getUnreadSummariesForCurrentUser as jest.Mock).mockResolvedValue(
      mockLinks,
    );
    (debounce as jest.Mock).mockImplementation(({ func }) => func());
    window.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockLinks),
    });

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
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockLinks),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the dialog with the correct title", async () => {
    render(
      <AddLinksAsEvidenceDialog
        id="test-dialog"
        isOpen={true}
        onClose={jest.fn()}
        insight={mockInsight}
        // setServerFunctionInput={mockSetServerFunctionInput}
        // setActiveServerFunction={mockSetActiveServerFunction}
      />,
    );
    await waitFor(() => {
      expect(
        screen.getByText("Add evidence"),
      ).toBeInTheDocument();
    });
  });

  it("fetches and displays links", async () => {
    render(
      <ServerActionContext.Provider value={{ executeAction }}>
        <AddLinksAsEvidenceDialog
          id="test-dialog"
          isOpen={true}
          onClose={jest.fn()}
          insight={mockInsight}
        />
      </ServerActionContext.Provider>,
    );
    await waitFor(() => {
      expect(screen.getByText("Link 1")).toBeInTheDocument();
      expect(screen.getByText("Link 2")).toBeInTheDocument();
    });
  });

  it("searches the server for links based on query", async () => {
    render(
      <AddLinksAsEvidenceDialog
        id="test-dialog"
        isOpen={true}
        onClose={jest.fn()}
        insight={mockInsight}
        // setServerFunctionInput={mockSetServerFunctionInput}
        // setActiveServerFunction={mockSetActiveServerFunction}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByPlaceholderText("Search the titles..."),
      ).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByPlaceholderText("Search the titles..."), {
      target: { value: "Link 1" },
    });

    await waitFor(() =>
      expect(window.fetch).toHaveBeenCalledWith(
        `/api/links?offset=0&limit=50&query=Link%201`,
      ),
    );
  });

  it("selects and deselects links", async () => {
    render(
      <AddLinksAsEvidenceDialog
        id="test-dialog"
        isOpen={true}
        onClose={jest.fn()}
        insight={mockInsight}
        // setServerFunctionInput={mockSetServerFunctionInput}
        // setActiveServerFunction={mockSetActiveServerFunction}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText("Link 1")).toBeInTheDocument();
    });

    const link1 = screen.getByText("Link 1");
    const checkbox = link1
      .closest("tr")!
      .querySelector("input[type='checkbox']");
    await userEvent.click(link1);
    expect((checkbox as HTMLInputElement).checked).toBe(true);

    await userEvent.click(link1);
    expect((checkbox as HTMLInputElement).checked).toBe(false);
  });

  it("calls setServerFunctionInput on Add button click", async () => {
    window.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([mockLinks.find((l) => l.title == "Link 1")]),
    });

    render(
      <ServerActionContext.Provider value={{ executeAction }}>
        <AddLinksAsEvidenceDialog
          id="test-dialog"
          isOpen={true}
          onClose={jest.fn()}
          insight={mockInsight}
        />
      </ServerActionContext.Provider>,
    );
    const addButton = screen.getByText("Add");
    expect(addButton).toBeDisabled();

    await waitFor(() => expect(screen.getByText("Link 1")).toBeInTheDocument());
    const checkbox = screen
      .getByText("Link 1")
      .closest("tr")!
      .querySelector("input[type='checkbox']") as HTMLInputElement;
    await userEvent.click(checkbox);

    expect(addButton).toBeEnabled();
    await userEvent.click(addButton);

    await waitFor(() => {
      expect(executeAction).toHaveBeenCalledWith(expect.any(Function), {
        insight: mockInsight,
        evidence: [
          {
            id: 1,
            summary_id: mockLinks[0].id,
            title: mockLinks[0].title,
            uid: mockLinks[0].uid,
            updated_at: mockLinks[0].updated_at,
          },
        ],
        newLinkUrl: "",
      });
    });
  });

  it("closes and resets user values on Cancel button click", async () => {
    const onClose = jest.fn();
    window.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([mockLinks.find((l) => l.title == "Link 1")]),
    });

    render(
      <AddLinksAsEvidenceDialog
        id="test-dialog"
        isOpen={true}
        onClose={onClose}
        insight={mockInsight}
        // setServerFunctionInput={mockSetServerFunctionInput}
        // setActiveServerFunction={mockSetActiveServerFunction}
      />,
    );

    await waitFor(() => expect(screen.getByText("Link 1")).toBeInTheDocument());
    const link1 = screen.getByText("Link 1");
    const checkbox = link1
      .closest("tr")!
      .querySelector("input[type='checkbox']") as HTMLInputElement;
    expect(checkbox.tagName.toLowerCase()).toBe("input");
    expect(checkbox.type).toBe("checkbox");

    fireEvent.change(screen.getByPlaceholderText("Search the titles..."), {
      target: { value: "Link 1" },
    });

    expect(checkbox).not.toBeChecked();
    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    const cancelButton = screen.getByText("Cancel");
    await userEvent.click(cancelButton);

    await waitFor(() => {
      const link1b = screen.getByText("Link 1");
      expect(link1b).toBeInTheDocument();
      const checkboxAfterReset = link1b
        .closest("tr")!
        .querySelector("input[type='checkbox']") as HTMLInputElement;
      expect(checkboxAfterReset).not.toBeChecked();
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("should not show buttons for deleting comments", () => {
    render(
      <AddLinksAsEvidenceDialog
        id="test-dialog"
        isOpen={true}
        onClose={jest.fn()}
        insight={mockInsight}
        // setServerFunctionInput={mockSetServerFunctionInput}
        // setActiveServerFunction={mockSetActiveServerFunction}
      />,
    );

    expect(screen.queryByText("X")).not.toBeInTheDocument();
  });
});
