"use client";

import React, { useCallback, useState } from "react";
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
  const { token, user_id } = useUser();
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
          style={{ margin: "0 auto", width: "100%" }}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          rows={4}
        />
      )}
      {!editingTitle && (
        <span>
          {title}
          {user_id == insight.user_id && (
            <span
              style={{ cursor: "pointer" }}
              onClick={() => {
                setEditingTitle(true);
              }}
            >
              🖊
            </span>
          )}
        </span>
      )}
      {editingTitle && (
        <p>
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
          >
            Submit
          </button>
          <button
            onClick={() => {
              setTitle(insight.title);
              setEditingTitle(false);
            }}
          >
            Cancel
          </button>
        </p>
      )}
    </h2>
  );
};

export default EditableTitle;
