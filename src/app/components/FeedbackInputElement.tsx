"use client";

import React, { useCallback, useState } from "react";

import RichTextEditor from "./RichTextEditor";
import { FactComment, FactReaction } from "../types";
import styles from "../../styles/components/feedback-input.module.css";

const REACTION_OPTIONS = [
  "👍",
  "👎",
  "❤️",
  "😂",
  "😮",
  "😢",
  "🔥",
  "👏",
  "🤔",
  "✨",
  "💯",
  "🙌",
  "😀",
  "🥳",
  "💡",
  "📌",
] as const;

const FeedbackInputElement = ({
  actionType,
  submitFunc,
  closeFunc,
  directions,
  afterSubmit,
}: {
  actionType: "reaction" | "comment";
  submitFunc?: (token: string) => Promise<FactComment | FactReaction | void>;
  closeFunc: () => void;
  directions: string;
  afterSubmit: (response?: FactComment | FactReaction | void) => void;
}): React.JSX.Element => {
  const [html, setHtml] = useState<string>(
    actionType === "reaction" ? "👍" : "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const closeFeedbackInputElement = useCallback(() => {
    setHtml(actionType === "reaction" ? "👍" : "");
    setError("");
    closeFunc();
  }, [closeFunc, actionType]);

  const canSubmit =
    !isSubmitting &&
    (actionType === "reaction"
      ? Boolean(html)
      : Boolean(html.replace(/<[^>]*>/g, "").trim()));

  return (
    <div className={styles.panel}>
      <p className={styles.lead}>{directions}</p>

      {actionType === "reaction" && (
        <>
          <div
            className={styles.emojiGrid}
            role="listbox"
            aria-label="Select Reaction"
          >
            {REACTION_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                role="option"
                aria-selected={html === emoji}
                className={`${styles.emojiOption} ${
                  html === emoji ? styles.emojiOptionSelected : ""
                }`}
                onClick={() => {
                  setHtml(emoji);
                  if (error) setError("");
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
          <p className={styles.selectedPreview}>
            Selected{" "}
            <span className={styles.selectedPreviewEmoji} aria-hidden>
              {html}
            </span>
          </p>
        </>
      )}

      {actionType === "comment" && (
        <div className={styles.editorWrap}>
          <RichTextEditor html={html} setHtml={setHtml} />
        </div>
      )}

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={closeFeedbackInputElement}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="button"
          className={styles.submitButton}
          aria-label={`Submit ${actionType.charAt(0).toUpperCase() + actionType.slice(1)}`}
          disabled={!canSubmit}
          onClick={async () => {
            if (!submitFunc || !canSubmit) return;
            setIsSubmitting(true);
            setError("");
            try {
              const response = await submitFunc(html);
              if (response) {
                afterSubmit(response);
                closeFeedbackInputElement();
              } else {
                setError("Nothing was saved. Please try again.");
              }
            } catch (err) {
              setError(
                err instanceof Error
                  ? err.message
                  : "Something went wrong. Please try again.",
              );
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          {isSubmitting
            ? "Submitting…"
            : actionType === "reaction"
              ? "Add reaction"
              : "Post comment"}
        </button>
      </div>
    </div>
  );
};

export default FeedbackInputElement;
