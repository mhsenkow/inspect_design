"use client";

import React from "react";
import Image from "next/image";
import parse from "html-react-parser";

import { FactComment } from "../types";
import useUser from "../hooks/useUser";
import { deleteComment } from "../functions";
import { TRASH_ICON } from "../constants";
import { prop } from "../lib/prop";
import styles from "../../styles/components/comment.module.css";

interface Props {
  comment: FactComment;
  removeCommentFunc: (id: number) => void;
}

function initialsFromName(name?: string | null): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
}

const Comment = ({ comment, removeCommentFunc }: Props) => {
  const { loggedIn, token, user_id } = useUser();
  const authorId = prop<number>(comment, "user_id", "userId");
  const username = comment.user?.username?.trim() || "Someone";
  const avatarUri = comment.user?.avatar_uri;
  const canDelete = loggedIn && user_id == authorId;

  return (
    <article className={styles.comment} data-id={comment.id}>
      <div className={styles.avatar} aria-hidden={!avatarUri}>
        {avatarUri ? (
          <Image
            src={avatarUri}
            alt="Comment user avatar"
            width={30}
            height={30}
            className={styles.avatarImage}
          />
        ) : (
          <span>{initialsFromName(username)}</span>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.meta}>
          <p className={styles.username}>{username}</p>
        </div>
        <div className={styles.text}>{parse(comment.comment!)}</div>
      </div>

      {canDelete && (
        <button
          type="button"
          className={styles.deleteButton}
          onClick={() => {
            if (token && confirm("Delete this comment?")) {
              deleteComment(
                {
                  ...comment,
                  id: String(comment.id),
                },
                token,
              ).then(() => {
                removeCommentFunc(comment.id!);
              });
            }
          }}
          aria-label="Delete Comment"
          title="Delete comment"
        >
          {TRASH_ICON}
        </button>
      )}
    </article>
  );
};

export default Comment;
