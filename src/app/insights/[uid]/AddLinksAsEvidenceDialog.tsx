"use client";

import React, { useCallback, useEffect, useState } from "react";

import {
  Fact,
  Insight,
  InsightEvidence,
  Link,
  ServerFunction,
} from "../../types";
import FactsTable from "../../components/FactsTable";
import { getPageTitle } from "../../hooks/functions";
import useUser from "../../hooks/useUser";
import { addCitationsToInsightAPISchema } from "../../components/SelectedCitationsAPI";
import { GetLinksResponse } from "../../api/links/route";

interface Props {
  id: string;
  insight: Insight;
  setServerFunctionInput: React.Dispatch<
    React.SetStateAction<addCitationsToInsightAPISchema | undefined>
  >;
  setActiveServerFunction: React.Dispatch<
    { function: ServerFunction<addCitationsToInsightAPISchema> } | undefined
  >;
}

const AddLinksAsEvidenceDialog = ({
  id,
  insight,
  setServerFunctionInput,
  setActiveServerFunction,
}: Props): React.JSX.Element => {
  // TODO: consider changing output to use returnValue directly: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog

  const [dataFilter, setDataFilter] = useState("");
  const [selectedCitations, setSelectedCitations] = useState<InsightEvidence[]>(
    [],
  );
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkUrlError, setLinkUrlError] = useState("");

  const { token } = useUser();
  const notExistingCitation = useCallback(
    (link: Link) => !insight.evidence?.some((e) => e.summary_id == link.id),
    [insight.evidence],
  );

  const [linksToShow, setLinksToShow] = useState<Link[]>();
  useEffect(() => {
    if (!linksToShow) {
      fetch("/api/links?offset=0&limit=10")
        .then(async (response: Response | GetLinksResponse) => {
          if (!response.ok) {
            throw new Error(response.statusText);
          }
          return response.json();
        })
        .then((links: Link[]) => {
          setLinksToShow(links.filter(notExistingCitation));
        });
    }
  }, [linksToShow, notExistingCitation]);

  useEffect(() => {
    if (
      !linkUrlError &&
      linksToShow &&
      linksToShow.find((l) => l.url == newLinkUrl)
    ) {
      setLinkUrlError("Link already exists");
    }
  }, [linksToShow, linksToShow?.length, linkUrlError, newLinkUrl]);

  const resetStateValues = () => {
    setSelectedCitations([]);
    setDataFilter("");
    setNewLinkUrl("");
    setLoading(false);
    setLinkUrlError("");
    setPageTitle("");
  };

  const resetAndCloseDialog = useCallback(() => {
    resetStateValues();
    // don't use `dialog` bc a call to this function below is before it is set
    (document.getElementById(id) as HTMLDialogElement).close();
  }, [id]);

  const cancelDialog = useCallback(() => {
    setServerFunctionInput(undefined);
    setActiveServerFunction(undefined);
    resetStateValues();
    (document.getElementById(id) as HTMLDialogElement).close();
  }, [id, setActiveServerFunction, setServerFunctionInput]);

  useEffect(() => {
    const d = document.getElementById(id);
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
    if (newLinkUrl && !pageTitle) {
      getPageTitle(newLinkUrl)
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
    // TODO: warn about paywalls that don't show content after clicking through
  }, [pageTitle, newLinkUrl, linkUrlError, token]);

  const queryFunctionForAddLinksAsEvidenceDialog = async (search: string) => {
    const response = await fetch(
      `/api/links?offset=0&limit=50&query=${search}`,
    );
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const data = await response.json();
    return data.filter(notExistingCitation);
  };

  return (
    <dialog id={id} className="large-dialog">
      <h3>Add Links to Insight: {insight.title}</h3>
      <ul className="nav nav-tabs">
        <li className="nav-item">
          <button
            className="nav-link active"
            type="button"
            role="tab"
            data-bs-toggle="tab"
            data-bs-target="#existing-links"
            aria-controls="existing links"
            aria-selected="true"
          >
            Existing links
          </button>
        </li>
        <li className="nav-item">
          <button
            className="nav-link"
            type="button"
            role="tab"
            data-bs-toggle="tab"
            data-bs-target="#save-link"
            aria-controls="save link"
            aria-selected="false"
          >
            Save link
          </button>
        </li>
      </ul>
      <div className="tab-content">
        <div
          className="tab-pane fade show active"
          id="existing-links"
          role="tabpanel"
        >
          <FactsTable
            data={
              (linksToShow?.map((link, index) => ({
                id: index + 1,
                summary_id: link.id,
                title: link.title,
                uid: link.uid,
                updated_at: link.updated_at,
              })) ?? []) as unknown as InsightEvidence[]
            }
            setData={
              setLinksToShow as React.Dispatch<
                React.SetStateAction<Fact[] | undefined>
              >
            }
            factName="snippet"
            selectedFacts={selectedCitations}
            setSelectedFacts={
              setSelectedCitations as React.Dispatch<
                React.SetStateAction<Fact[]>
              >
            }
            queryFunction={queryFunctionForAddLinksAsEvidenceDialog}
            dataFilter={dataFilter}
            setDataFilter={setDataFilter}
            selectRows={true}
          />
        </div>
        <div
          className="tab-pane fade"
          id="save-link"
          role="tabpanel"
          style={{ padding: "1rem" }}
        >
          <input
            type="text"
            placeholder="New link URL"
            value={newLinkUrl}
            onChange={(event) => {
              const text = event.target.value;
              if (text && text.match(/https?:\/\/[^ ]+/)) {
                setNewLinkUrl(event.target.value);
                setLoading(true);
              } else {
                setPageTitle("");
                setLinkUrlError("");
                setLoading(false);
              }
            }}
          />
          {loading && (
            <div style={{ fontWeight: "bold" }}>Title loading...</div>
          )}
          {!loading && pageTitle && (
            <div style={{ fontWeight: "bold" }}>{pageTitle}</div>
          )}
          {linkUrlError && <div style={{ color: "red" }}>{linkUrlError}</div>}
        </div>
      </div>

      <div className="sticky bottom right">
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
          aria-label="Add evidence links"
          onClick={async () => {
            setServerFunctionInput({
              insight,
              evidence: selectedCitations,
              newLinkUrl,
            });
            resetAndCloseDialog();
          }}
          disabled={!newLinkUrl && selectedCitations.length == 0}
        >
          Add
        </button>
      </div>
    </dialog>
  );
};

export default AddLinksAsEvidenceDialog;
