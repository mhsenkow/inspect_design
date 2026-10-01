import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import FeedbackInputElement from "../FeedbackInputElement";

describe("FeedbackInputElement", () => {
  const mockSubmitFunc = jest.fn();
  const mockCloseFunc = jest.fn();
  const mockAfterSubmit = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders directions", () => {
    render(
      <FeedbackInputElement
        actionType="reaction"
        submitFunc={mockSubmitFunc}
        closeFunc={mockCloseFunc}
        directions="Please provide your feedback"
        afterSubmit={mockAfterSubmit}
      />,
    );
    expect(
      screen.getByText("Please provide your feedback"),
    ).toBeInTheDocument();
  });

  it("renders reaction options when actionType is 'reaction'", () => {
    render(
      <FeedbackInputElement
        actionType="reaction"
        submitFunc={mockSubmitFunc}
        closeFunc={mockCloseFunc}
        directions="Please provide your feedback"
        afterSubmit={mockAfterSubmit}
      />,
    );
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "👍" })).toBeInTheDocument();
  });

  it("renders a contenteditable div when actionType is 'comment'", () => {
    render(
      <FeedbackInputElement
        actionType="comment"
        submitFunc={mockSubmitFunc}
        closeFunc={mockCloseFunc}
        directions="Please provide your feedback"
        afterSubmit={mockAfterSubmit}
      />,
    );
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("calls closeFunc when Cancel button is clicked", () => {
    render(
      <FeedbackInputElement
        actionType="reaction"
        submitFunc={mockSubmitFunc}
        closeFunc={mockCloseFunc}
        directions="Please provide your feedback"
        afterSubmit={mockAfterSubmit}
      />,
    );
    fireEvent.click(screen.getByText("Cancel"));
    expect(mockCloseFunc).toHaveBeenCalled();
  });

  it("calls submitFunc and afterSubmit when Submit button is clicked", async () => {
    mockSubmitFunc.mockResolvedValueOnce("response");
    render(
      <FeedbackInputElement
        actionType="reaction"
        submitFunc={mockSubmitFunc}
        closeFunc={mockCloseFunc}
        directions="Please provide your feedback"
        afterSubmit={mockAfterSubmit}
      />,
    );

    fireEvent.click(screen.getByRole("option", { name: "😀" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit Reaction" }));

    await waitFor(() => {
      expect(mockSubmitFunc).toHaveBeenCalledWith("😀");
      expect(mockAfterSubmit).toHaveBeenCalledWith("response");
    });
  });
});
