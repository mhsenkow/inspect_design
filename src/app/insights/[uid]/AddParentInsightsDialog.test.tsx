import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import AddParentInsightsDialog from "./AddParentInsightsDialog";
import { Insight } from "../../types";

const mockInsight: Insight = {
  id: 1,
  title: "Test Insight",
  // add other required fields as needed
} as Insight;

const mockPotentialInsights: Insight[] = [
  { id: 2, title: "Potential 1" } as Insight,
  { id: 3, title: "Potential 2" } as Insight,
];

describe("AddParentInsightsDialog", () => {
  let setServerFunctionInput: jest.Mock;
  let setActiveServerFunction: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setServerFunctionInput = jest.fn();
    setActiveServerFunction = jest.fn();
    // Create a dialog element in the DOM for dialog API
    const dialog = document.createElement("dialog");
    dialog.setAttribute("id", "test-dialog");
    document.body.appendChild(dialog);

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

  afterEach(() => {
    document.body.innerHTML = "";
    jest.clearAllMocks();
  });

  function renderDialog() {
    return render(
      <AddParentInsightsDialog
        id="test-dialog"
        isOpen={true}
        onClose={jest.fn()}
        insight={mockInsight}
        setServerFunctionInput={setServerFunctionInput}
        setActiveServerFunction={setActiveServerFunction}
      />,
    );
  }

  it("renders dialog with correct title", () => {
    renderDialog();
    expect(
      screen.getByText(/Add Parent Insights to Insight: Test Insight/i),
    ).toBeInTheDocument();
  });

  it("renders tabs for existing and new insights", () => {
    renderDialog();
    expect(screen.getByText("Existing insights")).toBeInTheDocument();
    expect(screen.getByText("New insight")).toBeInTheDocument();
  });

  it("calls cancelDialog when Cancel button is clicked", () => {
    renderDialog();
    const cancelBtn = screen.getByText("Cancel");
    fireEvent.click(cancelBtn);
    expect(setServerFunctionInput).toHaveBeenCalledWith(undefined);
    expect(setActiveServerFunction).toHaveBeenCalledWith(undefined);
  });

  it("disables Submit button when nothing is selected or entered", () => {
    renderDialog();
    const submitBtn = screen.getByRole("button", {
      name: /Add parent insights/i,
      hidden: true,
    });
    expect(submitBtn).toBeDisabled();
  });

  it("enables Submit button when new insight name is entered", () => {
    renderDialog();
    const input = screen.getByPlaceholderText("New insight name");
    fireEvent.change(input, { target: { value: "My New Insight" } });
    const submitBtn = screen.getByRole("button", {
      name: /Add parent insights/i,
      hidden: true,
    });
    expect(submitBtn).not.toBeDisabled();
  });

  it("calls setServerFunctionInput and closes dialog on submit", () => {
    renderDialog();
    const input = screen.getByPlaceholderText("New insight name");
    fireEvent.change(input, { target: { value: "My New Insight" } });
    const submitBtn = screen.getByRole("button", {
      name: /Add parent insights/i,
      hidden: true,
    });
    fireEvent.click(submitBtn);
    expect(setServerFunctionInput).toHaveBeenCalledWith({
      childInsight: mockInsight,
      newParentInsights: [],
      newInsightName: "My New Insight",
    });
  });

  it("closes dialog on Escape keydown", () => {
    renderDialog();
    const dialog = document.getElementById("test-dialog") as HTMLDialogElement;
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(setServerFunctionInput).toHaveBeenCalledWith(undefined);
    expect(setActiveServerFunction).toHaveBeenCalledWith(undefined);
  });

  it("closes dialog on click outside dialog content", () => {
    renderDialog();
    const dialog = document.getElementById("test-dialog") as HTMLDialogElement;
    fireEvent.click(dialog, { target: dialog, currentTarget: dialog });
    expect(setServerFunctionInput).toHaveBeenCalledWith(undefined);
    expect(setActiveServerFunction).toHaveBeenCalledWith(undefined);
  });
});
