import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import Comment from "../Comment";
import { FactComment } from "../../types";
import { deleteComment } from "../../functions";

// Mock next/image
jest.mock("next/image", () => (props: any) => {
  return <img {...props} />;
});

// Mock html-react-parser
jest.mock("html-react-parser", () => (html: string) => <span>{html}</span>);

// Mock useUser hook
jest.mock("../../hooks/useUser", () => () => ({
  token: "mock-token",
  loggedIn: true,
  user_id: 2,
}));

// Mock deleteComment function, starting by mocking the entire file
jest.mock("../../functions");

const mockRemoveCommentFunc = jest.fn();

const comment: FactComment = {
  id: 1,
  comment: "<b>Hello</b> world!",
  user_id: 2,
  user: { avatar_uri: undefined, username: "Test" },
};

describe("Comment component", () => {
  const mockDeleteComment = deleteComment as jest.Mock;
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders comment text and avatar", () => {
    const localComment = {
      ...comment,
      user: { ...comment.user, avatar_uri: "asdf" },
    };
    render(
      <Comment
        comment={localComment}
        removeCommentFunc={mockRemoveCommentFunc}
      />,
    );
    expect(screen.getByAltText("Comment user avatar")).toBeInTheDocument();
    expect(screen.getByText(/Hello/)).toBeInTheDocument();
  });

  it("does not show delete button if current user is not the comment author", () => {
    render(
      <Comment
        comment={{ ...comment, user_id: 3 }}
        removeCommentFunc={mockRemoveCommentFunc}
      />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows delete button if current user is the comment author", () => {
    render(
      <Comment comment={comment} removeCommentFunc={mockRemoveCommentFunc} />,
    );
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("calls deleteComment and removeCommentFunc when delete button is clicked", async () => {
    mockDeleteComment.mockResolvedValueOnce({});
    render(
      <Comment comment={comment} removeCommentFunc={mockRemoveCommentFunc} />,
    );
    const button = screen.getByRole("button");
    global.confirm = jest.fn(() => true);
    fireEvent.click(button);

    // Wait for deleteComment to be called
    expect(mockDeleteComment).toHaveBeenCalledWith(comment, "mock-token");

    // Wait for removeCommentFunc to be called after promise resolves
    await Promise.resolve();
    expect(mockRemoveCommentFunc).toHaveBeenCalledWith(comment.id);
  });

  it("renders with null avatar_uri but a username", () => {
    const localCommentNoAvatar = {
      ...comment,
      user: { ...comment.user, avatar_uri: undefined, username: "Test User" },
    };
    render(
      <Comment
        comment={localCommentNoAvatar}
        removeCommentFunc={mockRemoveCommentFunc}
      />,
    );
    expect(
      screen.queryByAltText("Comment user avatar"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Test User")).toBeInTheDocument();
  });
});
