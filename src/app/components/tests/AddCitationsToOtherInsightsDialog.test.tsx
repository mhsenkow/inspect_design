import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { Insight, InsightEvidence, ServerFunction } from "../../types";

import { ADD_CITATIONS_TO_OTHER_INSIGHTS_DIALOG_ID } from "../../insights/[uid]/ClientSidePage";
import AddCitationsToOtherInsightsDialog from "../AddCitationsToOtherInsightsDialog";
import { doAddCitationsToOtherInsightsSchema } from "../../insights/[uid]/functions";

const mockPotentialInsights = [
  {
    id: 1,
    title: "Insight 1",
    uid: "1",
    evidence: [],
    reactions: [],
    comments: [],
  },
  {
    id: 2,
    title: "Insight 2",
    uid: "2",
    evidence: [],
    reactions: [],
    comments: [],
  },
] as unknown as Insight[];

const mockSelectedCitations = [
  { id: 1, summary_id: 1, title: "Link 1", comments: [], reactions: [] },
  { id: 2, summary_id: 2, title: "Link 2", comments: [], reactions: [] },
];

describe("AddCitationsToOtherInsightsDialog", () => {
  let setServerFunctionInput: jest.Mock<doAddCitationsToOtherInsightsSchema>;
  let setActiveServerFunction: jest.Mock<
    ServerFunction<doAddCitationsToOtherInsightsSchema>
  >;

  beforeEach(() => {
    setServerFunctionInput = jest.fn();
    setActiveServerFunction = jest.fn();
    document.body.innerHTML = '<div id="root"></div>';

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
      json: () => Promise.resolve(mockPotentialInsights),
    });
  });

  it("renders without crashing", async () => {
    await act(async () => {
      render(
        <AddCitationsToOtherInsightsDialog
          id={ADD_CITATIONS_TO_OTHER_INSIGHTS_DIALOG_ID}
          isOpen={true}
          onClose={jest.fn()}
          selectedCitations={
            mockSelectedCitations as unknown as InsightEvidence[]
          }
          setServerFunctionInput={setServerFunctionInput}
          setActiveServerFunction={jest.fn()}
        />,
        { container: document.getElementById("root")! },
      );
    });

    // Check that the main sections exist
    expect(screen.getByText("First: select citations to remove from this insight")).toBeInTheDocument();
    expect(screen.getByText("Then: select other insights to add them to")).toBeInTheDocument();
    
    // Check that the second table has content
    await waitFor(() => {
      expect(screen.getByText("Insight 1")).toBeInTheDocument();
      expect(screen.getByText("Insight 2")).toBeInTheDocument();
    });
  });

  it("resets state values and closes dialog on cancel", async () => {
    await act(async () => {
      render(
        <AddCitationsToOtherInsightsDialog
          id={ADD_CITATIONS_TO_OTHER_INSIGHTS_DIALOG_ID}
          isOpen={true}
          onClose={jest.fn()}
          selectedCitations={
            mockSelectedCitations as unknown as InsightEvidence[]
          }
          setServerFunctionInput={setServerFunctionInput}
          setActiveServerFunction={setActiveServerFunction}
        />,
        { container: document.getElementById("root")! },
      );
    });

    await waitFor(() =>
      expect(
        screen.queryByText(mockPotentialInsights[0].title!),
      ).toBeInTheDocument(),
    );
    const insightTitleElement = screen.getByText(
      mockPotentialInsights[0].title!,
    );
    const checkboxInput = insightTitleElement
      .closest("tr")!
      .querySelector("input[type='checkbox']") as HTMLInputElement;
    await userEvent.click(insightTitleElement!);
    expect(checkboxInput.checked).toBeTruthy();

    await userEvent.click(screen.getByText("Cancel"));

    expect(checkboxInput.checked).toBeFalsy();
    expect(setServerFunctionInput).toHaveBeenCalledWith(undefined);
    expect(setActiveServerFunction).toHaveBeenCalledWith(undefined);
  });

  it("correctly renders disabled insights", async () => {
    const mockPotentialInsightsWithCitations = [
      {
        id: 1,
        title: "Insight 1",
        uid: "1",
        evidence: [{ summary_id: 1, title: "Link 1" }],
        comments: [],
        reactions: [],
      },
      {
        id: 2,
        title: "Insight 2",
        uid: "2",
        evidence: [],
        comments: [],
        reactions: [],
      },
    ];
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPotentialInsightsWithCitations),
    });

    await act(async () => {
      render(
        <AddCitationsToOtherInsightsDialog
          id={ADD_CITATIONS_TO_OTHER_INSIGHTS_DIALOG_ID}
          isOpen={true}
          onClose={jest.fn()}
          selectedCitations={
            mockSelectedCitations as unknown as InsightEvidence[]
          }
          setActiveServerFunction={jest.fn()}
          setServerFunctionInput={jest.fn()}
        />,
        { container: document.getElementById("root")! },
      );
    });

    await waitFor(() =>
      expect(screen.queryByText("Insight 1")).toBeInTheDocument(),
    );

    const disabledInsight = screen
      .getByText("Insight 1")
      .closest("tr")!
      .querySelector("input[type='checkbox']");
    expect(disabledInsight).toBeDisabled();

    const enabledInsight = screen
      .getByText("Insight 2")!
      .closest("tr")!
      .querySelector("input[type='checkbox']");
    await expect(enabledInsight).toBeEnabled();
  });

  it("should not show buttons for deleting comments", async () => {
    await act(async () => {
      render(
        <AddCitationsToOtherInsightsDialog
          id={ADD_CITATIONS_TO_OTHER_INSIGHTS_DIALOG_ID}
          isOpen={true}
          onClose={jest.fn()}
          selectedCitations={
            mockSelectedCitations as unknown as InsightEvidence[]
          }
          setServerFunctionInput={jest.fn()}
          setActiveServerFunction={jest.fn()}
        />,
        { container: document.getElementById("root")! },
      );
    });

    expect(screen.queryByText("X")).not.toBeInTheDocument();
  });

  it("should have citation count as a column", async () => {
    await act(async () => {
      render(
        <AddCitationsToOtherInsightsDialog
          id={ADD_CITATIONS_TO_OTHER_INSIGHTS_DIALOG_ID}
          isOpen={true}
          onClose={jest.fn()}
          selectedCitations={
            mockSelectedCitations as unknown as InsightEvidence[]
          }
          setActiveServerFunction={jest.fn()}
          setServerFunctionInput={jest.fn()}
        />,
        { container: document.getElementById("root")! },
      );
    });

    const citationCountHeader = screen.getByText("Citations");
    expect(citationCountHeader).toBeInTheDocument();

    await waitFor(() =>
      expect(
        screen.queryByText(mockPotentialInsights[0].title!),
      ).toBeInTheDocument(),
    );

    mockPotentialInsights.forEach((mockPotentialInsight) => {
      const row = screen.getByText(mockPotentialInsight.title!).closest("tr")!;
      const citationTd = row.querySelector("td:last-child") as HTMLTableCellElement;
      const span = citationTd.children[0];
      expect(span.tagName.toLowerCase()).toBe("span");
      expect(span).toHaveAttribute("class", "badge text-bg-danger");
      expect(span).toHaveTextContent(
        `${mockPotentialInsight.evidence!.length}`,
      );
    });
  });
});
