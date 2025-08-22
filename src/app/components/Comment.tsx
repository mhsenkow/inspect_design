import React from "react";
import Image from "next/image";
import parse from "html-react-parser";

import { FactComment } from "../types";
import useUser from "../hooks/useUser";
import { deleteComment } from "../functions";
import { TRASH_ICON } from "../constants";

interface Props {
  comment: FactComment;
  removeCommentFunc: (id: number) => void;
}

const Comment = ({ comment, removeCommentFunc }: Props) => {
  const { loggedIn, token, user_id } = useUser();

  return (
    <div
      className="comment"
      key={`Comment #${comment.id}`}
      data-id={comment.id}
    >
      <div
        style={{
          border: "1px black dotted",
          textAlign: "center",
          backgroundColor: "#ddd",
        }}
      >
        {comment.user!.avatar_uri && (
          <Image
            src={comment.user!.avatar_uri}
            alt="Comment user avatar"
            width="20"
            height="20"
          />
        )}
        {!comment.user!.avatar_uri &&
          comment.user!.username &&
          comment.user!.username}
      </div>
      <div className="commenttext">{parse(comment.comment!)}</div>
      {loggedIn && user_id == comment.user_id && (
        <button
          className="delete-comment"
          onClick={() => {
            if (token && confirm("Are you sure?")) {
              deleteComment(comment, token).then(() => {
                removeCommentFunc(comment.id!);
              });
            }
          }}
          style={{ float: "right" }}
          aria-label="Delete Comment"
        >
          {TRASH_ICON}
        </button>
      )}
    </div>
  );
};

export default Comment;
