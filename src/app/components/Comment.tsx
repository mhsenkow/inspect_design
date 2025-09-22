import React from "react";
import Image from "next/image";
import parse from "html-react-parser";
import cardStyles from "../../styles/components/card.module.css";

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
    <div className={cardStyles.commentContainer}>
      <div className={cardStyles.commentAvatar}>
        {comment.user!.avatar_uri && (
          <Image
            src={comment.user!.avatar_uri}
            alt="Comment user avatar"
            width="32"
            height="32"
            className={cardStyles.commentAvatarImage}
          />
        )}
        {!comment.user!.avatar_uri && comment.user!.username && (
          <div className={cardStyles.commentAvatarPlaceholder}>
            {comment.user!.username.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      
      <div className={cardStyles.commentContent}>
        <div className={cardStyles.commentHeader}>
          <span className={cardStyles.commentAuthor}>
            {comment.user!.username || "Anonymous"}
          </span>
        </div>
        <div className={cardStyles.commentText}>
          {parse(comment.comment!)}
        </div>
      </div>

      {loggedIn && user_id == comment.user_id && (
        <div className={cardStyles.commentActions}>
          <button
            className={cardStyles.commentDeleteButton}
            onClick={() => {
              if (token && confirm("Are you sure?")) {
                deleteComment(comment, token).then(() => {
                  removeCommentFunc(comment.id!);
                });
              }
            }}
            aria-label="Delete Comment"
            title="Delete Comment"
          >
            {TRASH_ICON}
          </button>
        </div>
      )}
    </div>
  );
};

export default Comment;
