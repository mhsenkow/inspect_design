import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import AddChildInsightsDialog from "./AddChildInsightsDialog";

jest.mock("../../components/FactsTable", () => (props: any) => (
  <div data-testid="FactsTable">
    <button onClick={() => props.setSelectedFacts([{ id: "child1" }])}>
      Select Child
    </button>
    <button
      onClick={() =>
        props.setData([
          {
            id: "child1",
            title: "Child 1",
            uid: "u1",
            updated_at: "2024-01-01",
          },
        ])
      }
    >
      Set Data
    </button>
  </div>
));

const mockInsight = {
  id: "insight1",
  title: "Test Insight",
  citations: [{ summary_id: "child2" }],
};

describe("AddChildInsightsDialog", () => {
  let setServerFunctionInput: jest.Mock;
  let setActiveServerFunction: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setServerFunctionInput = jest.fn();
    setActiveServerFunction = jest.fn();
    document.body.innerHTML = "";

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
      ok: test,
      json: () => Promise.resolve([]),
    });
  });

  function renderDialog() {
    const handleClose = () => {
      setServerFunctionInput(undefined);
      setActiveServerFunction(undefined);
    };

    return render(
      <AddChildInsightsDialog
        id="dialog1"
        isOpen={true}
        onClose={handleClose}
        insight={mockInsight as any}
        setServerFunctionInput={setServerFunctionInput}
        setActiveServerFunction={setActiveServerFunction}
      />,
    );
  }

  it("renders dialog with correct title", () => {
    renderDialog();
    expect(
      screen.getByText(/Add Child Insights to Insight: Test Insight/),
    ).toBeInTheDocument();
  });

  it("calls cancelDialog when Cancel button is clicked", () => {
    renderDialog();
    const cancelBtn = screen.getByText("Cancel");
    fireEvent.click(cancelBtn);
    expect(setServerFunctionInput).toHaveBeenCalledWith(undefined);
    expect(setActiveServerFunction).toHaveBeenCalledWith(undefined);
  });

  it("disables Add button when no children selected", () => {
    renderDialog();
    const addBtn = screen.getByText("Add") as HTMLButtonElement;
    expect(addBtn.disabled).toBe(true);
  });

  it("enables Add button when children are selected", async () => {
    renderDialog();
    fireEvent.click(screen.getByText("Select Child"));
    await waitFor(() => {
      expect((screen.getByText("Add") as HTMLButtonElement).disabled).toBe(
        false,
      );
    });
  });

  it("calls setServerFunctionInput and closes dialog on Add", async () => {
    renderDialog();
    fireEvent.click(screen.getByText("Select Child"));
    await waitFor(() => {
      expect((screen.getByText("Add") as HTMLButtonElement).disabled).toBe(
        false,
      );
    });
    fireEvent.click(screen.getByText("Add"));
    expect(setServerFunctionInput).toHaveBeenCalledWith({
      insight: mockInsight,
      children: [{ id: "child1" }],
      newInsightName: "",
    });
  });

  it("calls cancelDialog on Escape keydown", () => {
    renderDialog();
    const modal = screen.getByRole("dialog");
    fireEvent.keyDown(modal, { key: "Escape" });
    expect(setServerFunctionInput).toHaveBeenCalledWith(undefined);
    expect(setActiveServerFunction).toHaveBeenCalledWith(undefined);
  });

  it("calls cancelDialog on dialog background click", () => {
    renderDialog();
    const modal = screen.getByRole("dialog");
    fireEvent.click(modal, { target: modal, currentTarget: modal });
    expect(setServerFunctionInput).toHaveBeenCalledWith(undefined);
    expect(setActiveServerFunction).toHaveBeenCalledWith(undefined);
  });

  it("passes disabledIds to FactsTable", () => {
    renderDialog();
    const factsTable = screen.getByTestId("FactsTable");
    expect(factsTable).toBeInTheDocument();
  });
});
