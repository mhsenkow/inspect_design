import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
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
    const { getByText } = render(
      <FeedbackInputElement
        actionType="reaction"
        submitFunc={mockSubmitFunc}
        closeFunc={mockCloseFunc}
        directions="Please provide your feedback"
        afterSubmit={mockAfterSubmit}
      />,
    );
    expect(getByText("Please provide your feedback")).toBeInTheDocument();
  });

  it("renders reaction options when actionType is 'reaction'", () => {
    const { getByRole } = render(
      <FeedbackInputElement
        actionType="reaction"
        submitFunc={mockSubmitFunc}
        closeFunc={mockCloseFunc}
        directions="Please provide your feedback"
        afterSubmit={mockAfterSubmit}
      />,
    );
    expect(getByRole("combobox")).toBeInTheDocument();
  });

  it("renders a conteneditable div when actionType is 'comment'", () => {
    const { getByRole } = render(
      <FeedbackInputElement
        actionType="comment"
        submitFunc={mockSubmitFunc}
        closeFunc={mockCloseFunc}
        directions="Please provide your feedback"
        afterSubmit={mockAfterSubmit}
      />,
    );
    expect(getByRole("textbox")).toBeInTheDocument();
  });

  it("calls closeFunc when Cancel button is clicked", () => {
    const { getByText } = render(
      <FeedbackInputElement
        actionType="reaction"
        submitFunc={mockSubmitFunc}
        closeFunc={mockCloseFunc}
        directions="Please provide your feedback"
        afterSubmit={mockAfterSubmit}
      />,
    );
    fireEvent.click(getByText("Cancel"));
    expect(mockCloseFunc).toHaveBeenCalled();
  });

  it("calls submitFunc and afterSubmit when Submit button is clicked", async () => {
    mockSubmitFunc.mockResolvedValueOnce("response");
    const { getByText, getByRole } = render(
      <FeedbackInputElement
        actionType="reaction"
        submitFunc={mockSubmitFunc}
        closeFunc={mockCloseFunc}
        directions="Please provide your feedback"
        afterSubmit={mockAfterSubmit}
      />,
    );

    fireEvent.change(getByRole("combobox"), { target: { value: "😀" } });

    fireEvent.click(getByText("Submit"));

    await waitFor(() => {
      expect(mockSubmitFunc).toHaveBeenCalledWith("😀");
      expect(mockSubmitFunc).toHaveBeenCalled();
      expect(mockAfterSubmit).toHaveBeenCalledWith("response");
    });
  });
});
