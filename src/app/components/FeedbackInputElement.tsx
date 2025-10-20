"use client";
import React, { useCallback, useEffect, useState } from "react";
import RichTextEditor from "./RichTextEditor";
import { FactComment, FactReaction } from "../types";
import cardStyles from "../../styles/components/card.module.css";

const FeedbackInputElement = ({
  actionType,
  submitFunc,
  closeFunc,
  afterSubmit,
}: {
  actionType: "reaction" | "comment";
  submitFunc?: (token: string) => Promise<FactComment | FactReaction | void>;
  closeFunc: () => void;
  afterSubmit: (response?: FactComment | FactReaction | void) => void;
}): React.JSX.Element => {
  const [html, setHtml] = useState<string>("");

  // Use the same emoji set as ReactionPicker for consistency
  const commonEmojis = [
    "❤️",
    "😮",
    "🙌",
    "😟",
    "😡",
    "😕",
    "🎯",
    "😊",
    "😎",
    "🤔",
    "🌱",
    "👏",
    "👍",
    "😂",
    "😢",
    "😤",
    "💕",
    "🤕",
    "😦",
    "😍",
    "🤓",
    "😖",
    "😱",
    "😯",
    "🤭",
  ];

  const reactOptions = commonEmojis.map((char) => (
    <option value={char} key={`ReactOptions: ${char}`}>
      {char}
    </option>
  ));

  useEffect(() => {
    if (!html && actionType == "reaction") {
      setHtml("❤️");
    }
  }, [actionType, reactOptions, html]);

  const closeFeedbackInputElement = useCallback(() => {
    setHtml("");
    closeFunc();
  }, [closeFunc]);

  return (
    <div className={cardStyles.feedbackInputContainer}>
      <div className={cardStyles.feedbackInputContent}>
        {actionType == "reaction" && (
          <select
            className={cardStyles.feedbackReactionSelect}
            value={html}
            onChange={(event) => setHtml(event.target.value)}
            aria-label="Select Reaction"
          >
            {reactOptions}
          </select>
        )}
        {actionType == "comment" && (
          <RichTextEditor html={html} setHtml={setHtml} />
        )}
      </div>
      <div className={cardStyles.feedbackInputActions}>
        <button
          type="button"
          onClick={closeFeedbackInputElement}
          className={cardStyles.feedbackInputButton}
        >
          Cancel
        </button>
        <button
          type="submit"
          aria-label={`Submit ${actionType.charAt(0).toUpperCase() + actionType.slice(1)}`}
          onClick={async () => {
            if (submitFunc) {
              const response = await submitFunc(html);
              if (response) {
                afterSubmit(response);
                closeFeedbackInputElement();
              }
            }
          }}
          className={`${cardStyles.feedbackInputButton} ${cardStyles.feedbackInputButtonPrimary}`}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default FeedbackInputElement;
