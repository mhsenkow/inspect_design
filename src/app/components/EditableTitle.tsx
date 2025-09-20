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
        <div style={{ position: 'relative' }}>
          <textarea
            id="titleBeingEdited"
            style={{
              margin: "0 auto",
              width: "100%",
              border: "2px solid var(--color-base-500)",
              borderRadius: "var(--radius-md)",
              padding: "var(--spacing-2)",
              paddingRight: "4rem",
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
          <div style={{ 
            position: 'absolute', 
            right: '0.5rem', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            display: 'flex', 
            gap: '0.25rem' 
          }}>
            <button
              onClick={() => {
                setTitle(insight.title);
                setEditingTitle(false);
              }}
              style={{
                padding: '0.25rem',
                color: 'var(--color-text-tertiary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'color var(--transition-base)'
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--color-text-secondary)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--color-text-tertiary)'}
              title="Cancel"
            >
              ✕
            </button>
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
                padding: '0.25rem',
                color: 'var(--color-base-500)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'color var(--transition-base)',
                opacity: !title ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!e.target.disabled) {
                  e.target.style.color = 'var(--color-base-600)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.target.disabled) {
                  e.target.style.color = 'var(--color-base-500)';
                }
              }}
              title="Save"
            >
              ✓
            </button>
          </div>
        </div>
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
    </h2>
  );
};

export default EditableTitle;
