"use client";
import React, { useCallback, useEffect, useState } from "react";
import RichTextEditor from "./RichTextEditor";
import { FactComment, FactReaction } from "../types";

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
  const [html, setHtml] = useState("");

  const firstEmojiCode = "😀".codePointAt(0);
  const reactOptions = Array.from({ length: 80 }, (_, i) => i)
    .map((i) => (firstEmojiCode ?? 0) + i)
    .map((i) => String.fromCodePoint(i))
    .map((char) => (
      <option value={char} key={`ReactOptions: ${char}`}>
        {char}
      </option>
    ));

  useEffect(() => {
    if (!html && actionType == "reaction") {
      setHtml("😀");
    }
  }, [actionType, reactOptions, html]);

  const closeFeedbackInputElement = useCallback(() => {
    setHtml("");
    closeFunc();
  }, [closeFunc]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        textAlign: "center",
        width: "100%",
      }}
    >
      <p>{directions}</p>
      <div>
        {actionType == "reaction" && (
          <select
            style={{ fontSize: 50 }}
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
      <div>
        <button type="button" onClick={closeFeedbackInputElement}>
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
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default FeedbackInputElement;
