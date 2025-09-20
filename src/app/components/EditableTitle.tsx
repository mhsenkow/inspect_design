"use client";

import React, { useCallback, useState, useEffect } from "react";
import useUser from "../hooks/useUser";

import { Insight } from "../types";

const EditableTitle = ({
  insight,
  apiRoot,
}: {
  insight: Insight;
  apiRoot?: string;
}): React.JSX.Element => {
  const [title, setTitle] = useState(insight.title);
  const [editingTitle, setEditingTitle] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { token, user_id } = useUser();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const updateTitle = useCallback(
    (newTitle: string, token: string): Promise<Response> =>
      fetch(`${apiRoot}/${insight.uid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        body: JSON.stringify({
          title: newTitle,
        }),
      }),
    [apiRoot, insight.uid],
  );
  return (
    <h2 id="title" style={{ margin: 0 }}>
      {editingTitle && (
        <textarea
          id="titleBeingEdited"
          style={{
            margin: "0 auto",
            width: "100%",
            border: "2px solid var(--color-base-500)",
            borderRadius: "var(--radius-md)",
            padding: "var(--spacing-2)",
            fontSize: "var(--font-size-lg)",
            fontFamily: "inherit",
            resize: "vertical",
            minHeight: "60px",
          }}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && event.ctrlKey) {
              // Ctrl+Enter to save
              if (token && title && title !== insight.title) {
                updateTitle(title, token).then((response) => {
                  if (response.status === 200) {
                    setEditingTitle(false);
                  }
                });
              }
            } else if (event.key === "Escape") {
              // Escape to cancel
              setTitle(insight.title);
              setEditingTitle(false);
            }
          }}
          autoFocus
          rows={2}
        />
      )}
      {!editingTitle && (
        <span
          style={{
            cursor:
              isClient && user_id == insight.user_id ? "pointer" : "default",
            padding: "var(--spacing-1)",
            borderRadius: "var(--radius-sm)",
            transition: "background-color var(--transition-base)",
            display: "inline-block",
            minWidth: "200px",
          }}
          onClick={() => {
            if (isClient && user_id == insight.user_id) {
              setEditingTitle(true);
            }
          }}
          onMouseEnter={(e) => {
            if (isClient && user_id == insight.user_id) {
              e.currentTarget.style.backgroundColor =
                "var(--color-background-secondary)";
            }
          }}
          onMouseLeave={(e) => {
            if (isClient && user_id == insight.user_id) {
              e.currentTarget.style.backgroundColor = "transparent";
            }
          }}
        >
          {title}
          {isClient && user_id == insight.user_id && (
            <span
              style={{
                marginLeft: "var(--spacing-2)",
                opacity: 0.6,
                fontSize: "var(--font-size-sm)",
              }}
            >
              ✏️
            </span>
          )}
        </span>
      )}
      {editingTitle && (
        <div
          style={{
            marginTop: "var(--spacing-2)",
            display: "flex",
            gap: "var(--spacing-2)",
          }}
        >
          <button
            onClick={async () => {
              if (token && title && title !== insight.title) {
                const response = await updateTitle(title, token);
                if (response.status !== 200) {
                  throw response;
                }
                return setEditingTitle(false);
              }
            }}
            disabled={!title}
            style={{
              padding: "var(--spacing-2) var(--spacing-3)",
              backgroundColor: "var(--color-base-500)",
              color: "var(--color-text-inverse)",
              border: "none",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              fontSize: "var(--font-size-sm)",
            }}
          >
            Save
          </button>
          <button
            onClick={() => {
              setTitle(insight.title);
              setEditingTitle(false);
            }}
            style={{
              padding: "var(--spacing-2) var(--spacing-3)",
              backgroundColor: "var(--color-background-secondary)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border-primary)",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              fontSize: "var(--font-size-sm)",
            }}
          >
            Cancel
          </button>
          <span
            style={{
              fontSize: "var(--font-size-xs)",
              color: "var(--color-text-muted)",
              alignSelf: "center",
            }}
          >
            Ctrl+Enter to save, Esc to cancel
          </span>
        </div>
      )}
    </h2>
  );
};

export default EditableTitle;
