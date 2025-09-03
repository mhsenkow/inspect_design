"use client";

import React, { useCallback, useEffect, useState } from "react";

import { Fact, Insight } from "../types";
import FactsTable from "./FactsTable";
import { getPageTitle } from "../hooks/functions";
import useLinks from "../hooks/useLinks";

// need to create a schema here
// because processing of it to get the insights is necessary before createInsights() is called
export type ServerFunctionInputSchemaForSavedLinks = {
  url: string;
  selectedInsights: Insight[];
  newInsightName: string;
};

const SaveLinkDialog = ({
  id,
  potentialInsightsFromServer,
  setServerFunctionInput,
  setActiveServerFunction,
}: {
  id: string;
  potentialInsightsFromServer: Insight[];
  setServerFunctionInput: (
    value: ServerFunctionInputSchemaForSavedLinks | undefined,
  ) => void;
  setActiveServerFunction: (value: undefined) => void;
}): React.JSX.Element => {
  // TODO: put common dialog functions into an HOC or shared functions.js file
  // TODO: consider changing output to use returnValue directly: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog

  const [linkUrl, setLinkUrl] = useState("");
  const [linkUrlError, setLinkUrlError] = useState("");
  const [dataFilter, setDataFilter] = useState("");
  const [selectedInsights, setSelectedInsights] = useState<Insight[]>([]);
  const [newInsightName, setNewInsightName] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [potentialInsights, setPotentialInsights] = useState<Insight[]>(
    potentialInsightsFromServer,
  );

  // TODO: improve the logic here
  const useLinksReturn = useLinks({
    offset: 0,
    limit: 1,
    query: (linkUrlError || !linkUrl ? null : `url=${linkUrl}`) as string,
  });
  const existingLinks = useLinksReturn[0];
  useEffect(() => {
    if (!linkUrlError && existingLinks && existingLinks.length > 0) {
      setLinkUrlError("Link already exists");
    }
  }, [existingLinks, existingLinks?.length, linkUrlError]);

  const resetStateValues = () => {
    setSelectedInsights([]);
    setLinkUrl("");
    setNewInsightName("");
    setDataFilter("");
    setLinkUrlError("");
    setPageTitle("");
    setLoading(false);
  };

  const resetAndCloseDialog = useCallback(() => {
    resetStateValues();
    (document.getElementById("saveLinkDialog") as HTMLDialogElement).close();
  }, []);

  const cancelDialog = useCallback(() => {
    setServerFunctionInput(undefined);
    setActiveServerFunction(undefined);
    resetAndCloseDialog();
  }, [resetAndCloseDialog, setActiveServerFunction, setServerFunctionInput]);

  useEffect(() => {
    const d = document.getElementById("saveLinkDialog");
    if (d) {
      d.addEventListener("click", (event) => {
        if (event.target == event.currentTarget) {
          cancelDialog();
        }
      });
      d.addEventListener("keydown", (event) => {
        if (event.key == "Escape") {
          cancelDialog();
        }
      });
    } else {
      throw new Error(`Dialog not found with id: ${id}`);
    }
  }, [cancelDialog, id]);

  useEffect(() => {
    if (linkUrl && !pageTitle) {
      getPageTitle(linkUrl)
        .then((title) => {
          setPageTitle(title);
          setLoading(false);
        })
        .catch((error) => {
          setLinkUrlError("Could not get page title");
          setLoading(false);
          console.error("Error fetching page title:", error);
        });
    }
  }, [pageTitle, linkUrl]);

  return (
    <dialog
      id={id}
      style={{
        width: "80%",
        height: "80%",
      }}
      onClose={() => {
        resetStateValues();
      }}
    >
      <h2>Save Link to Inspect</h2>
      <div style={{ margin: "5px 0" }}>
        <h3>Enter the URL</h3>

        <input
          type="text"
          placeholder="Link URL..."
          value={linkUrl}
          onChange={(event) => {
            const text = event.target.value;
            if (text && text.match(/https?:\/\/[^ ]+/)) {
              setLinkUrl(text);
              setLoading(true);
            } else {
              setPageTitle("");
              setLinkUrlError("");
              setLoading(false);
            }
          }}
        />
        {loading && <div style={{ fontWeight: "bold" }}>Title loading...</div>}
        {!loading && pageTitle && (
          <div style={{ fontWeight: "bold" }}>{pageTitle}</div>
        )}
        {linkUrlError && <div style={{ color: "red" }}>{linkUrlError}</div>}
      </div>
      <div style={{ margin: "5px 0" }}>
        <div
          className="potentialInsights"
          style={{
            padding: "5px",
            height: "200px",
            overflowY: "scroll",
          }}
        >
          <h3>Then: choose one or more existing insight</h3>
          <FactsTable
            factName="potentialInsight"
            data={potentialInsights}
            setData={
              setPotentialInsights as React.Dispatch<
                React.SetStateAction<Fact[] | undefined>
              >
            }
            selectedFacts={selectedInsights}
            setSelectedFacts={
              setSelectedInsights as React.Dispatch<
                React.SetStateAction<Fact[]>
              >
            }
            dataFilter={dataFilter}
            setDataFilter={setDataFilter}
            selectRows={true}
            queryFunction={async (query) => {
              const response = await fetch(
                `/api/insights?query=${query}&limit=20`,
              );
              if (!response.ok) {
                throw new Error(response.statusText);
              }
              return response.json();
            }}
            columns={[
              {
                name: "Citations",
                display: (insight: Fact | Insight): React.JSX.Element => (
                  <span className="badge text-bg-danger">
                    {insight.evidence?.length || 0}
                  </span>
                ),
              },
            ]}
          />
        </div>
        <div style={{ padding: "5px" }}>
          <h3>Or: create a new insight</h3>
          {/* TODO: scrolling right to create a new insight should keep cancel/submit buttons visible  */}
          <input
            type="text"
            placeholder="New insight name"
            value={newInsightName}
            onChange={(event) => {
              setNewInsightName(event.target.value);
            }}
          />{" "}
        </div>
      </div>
      <div
        id="dialogFooter"
        style={{
          position: "sticky",
          bottom: 0,
          float: "right",
          display: "inline",
        }}
      >
        <button
                          className="btn btn-danger"
          onClick={() => {
            cancelDialog();
          }}
        >
          Cancel
        </button>
        &nbsp;
        <button
          className="btn btn-primary"
          onClick={async () => {
            setServerFunctionInput({
              url: linkUrl,
              selectedInsights: [...selectedInsights],
              newInsightName,
            });
            resetAndCloseDialog();
          }}
          disabled={
            !linkUrl ||
            !!linkUrlError ||
            !(selectedInsights.length > 0 || newInsightName)
          }
        >
          Submit
        </button>
      </div>
    </dialog>
  );
};

export default SaveLinkDialog;
