"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import useUser from "../hooks/useUser";
import styles from "../../styles/components/editable-text.module.css";

import { Insight } from "../types";

const EditableText = ({
  insight,
  apiRoot,
  fieldName,
  initialValue,
  as: Component = "h2",
  isTextarea = false,
  placeholder = "",
  canEdit,
  className = "",
}: {
  insight: Insight;
  apiRoot?: string;
  fieldName: "title" | "description";
  initialValue?: string;
  as?: React.ElementType;
  isTextarea?: boolean;
  placeholder?: string;
  canEdit?: boolean;
  className?: string;
}): React.JSX.Element => {
  const { token, user_id } = useUser();
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const insightOwnerId =
    (insight as Insight & { userId?: number }).user_id ??
    (insight as Insight & { userId?: number }).userId;
  const editable =
    typeof canEdit === "boolean" ? canEdit : user_id == insightOwnerId;
  const valueFromInsight =
    fieldName === "title" ? insight.title : insight.description;
  const [text, setText] = useState(initialValue ?? valueFromInsight ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setText(initialValue ?? valueFromInsight ?? "");
  }, [initialValue, valueFromInsight]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      const el = inputRef.current;
      const len = el.value.length;
      el.setSelectionRange?.(len, len);
    }
  }, [isEditing]);

  const updateText = useCallback(
    async (newValue: string, accessToken: string): Promise<void> => {
      const response = await fetch(`${apiRoot}/${insight.uid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": accessToken,
        },
        body: JSON.stringify({ [fieldName]: newValue }),
      });
      const text = await response.text();
      let body: { statusText?: string; message?: string } = {};
      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          /* ignore */
        }
      }
      if (!response.ok) {
        throw new Error(
          body.message ||
            body.statusText ||
            response.statusText ||
            `Unable to save ${fieldName}`,
        );
      }
    },
    [apiRoot, insight.uid, fieldName],
  );

  const cancelEditing = () => {
    setText(initialValue ?? valueFromInsight ?? "");
    setIsEditing(false);
  };

  const saveEditing = async () => {
    if (!token) return;
    const nextValue = fieldName === "title" ? text.trim() : text;
    const previous = (initialValue ?? valueFromInsight ?? "").trim();
    if (fieldName === "title" && !nextValue) return;
    if (nextValue.trim() === previous) {
      setText(fieldName === "title" ? nextValue : text);
      setIsEditing(false);
      return;
    }
    setSaving(true);
    try {
      await updateText(nextValue, token);
      setText(nextValue);
      setIsEditing(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : `Unable to save ${fieldName}`;
      console.error(`EditableText save failed (${fieldName}):`, message);
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className={`${styles.editor} ${className}`}>
        {isTextarea ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            className={styles.textarea}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder={placeholder}
            disabled={saving}
            aria-label={fieldName}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                void saveEditing();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                cancelEditing();
              }
            }}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            className={styles.input}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            disabled={saving}
            aria-label={fieldName}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void saveEditing();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                cancelEditing();
              }
            }}
          />
        )}
        <div className={styles.editorActions}>
          <button
            type="button"
            className={styles.saveButton}
            onClick={() => void saveEditing()}
            disabled={saving || (fieldName === "title" && !text.trim())}
          >
            Save
          </button>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={cancelEditing}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <Component className={`${styles.display} ${className}`}>
      {editable ? (
        <button
          type="button"
          className={`${styles.textButton} ${!text ? styles.placeholder : ""}`}
          onClick={() => setIsEditing(true)}
          aria-label={`Edit ${fieldName}`}
        >
          {text || placeholder}
        </button>
      ) : (
        <span className={!text ? styles.placeholder : undefined}>
          {text || placeholder}
        </span>
      )}
    </Component>
  );
};

export default EditableText;
