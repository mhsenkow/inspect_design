import React, { useCallback, useEffect, useState } from "react";
import FactsTable from "./FactsTable";
import { Fact, Insight, Link } from "../types";
import { GetInsightsRouteResponse } from "../api/insights/route";
import { GetLinksResponse } from "../api/links/route";
import { getPageTitle } from "../hooks/functions";

interface Props {
  html: string;
  setHtml: React.Dispatch<React.SetStateAction<string>>;
}

const InsertLinkDialog = ({ html, setHtml }: Props) => {
  const [existingItemType, setExistingItemType] = useState("");
  const [existingInsights, setExistingInsights] = useState<Insight[]>();
  const [existingLinks, setExistingLinks] = useState<Link[]>();
  const [linkUrlInput, setLinkUrlInput] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkTitleLoading, setLinkTitleLoading] = useState(false);
  const [linkUrlError, setLinkUrlError] = useState("");
  const [chosenInsights, setChosenInsights] = useState<Insight[]>([]);
  const [chosenLinks, setChosenLinks] = useState<Link[]>([]);
  const [insightFilter, setInsightFilter] = useState("");
  const [linkFilter, setLinkFilter] = useState("");

  useEffect(() => {
    if (existingItemType == "insight" && !existingInsights) {
      fetch("/api/insights")
        .then(async (response: Response | GetInsightsRouteResponse) => {
          if (!response.ok) {
            throw new Error(response.statusText);
          }
          return response.json();
        })
        .then((json) => {
          setExistingInsights(json);
        });
    }
    if (existingItemType == "link" && !existingLinks) {
      fetch(`/api/links?offset=0`)
        .then(async (response: Response | GetLinksResponse) => {
          if (!response.ok) {
            throw new Error(response.statusText);
          }
          return response.json();
        })
        .then((json) => {
          setExistingLinks(json);
        });
    }
  }, [existingInsights, existingItemType, existingLinks]);

  useEffect(() => {
    if (linkUrlInput && !linkTitle) {
      getPageTitle(linkUrlInput)
        .then((title) => {
          setLinkTitle(title);
        })
        .catch((error: Error) => {
          setLinkUrlError(`Could not get page title: ${error.message}`);
          console.error("Error fetching page title:", error);
        })
        .finally(() => {
          setLinkTitleLoading(false);
        });
    }
  }, [linkTitle, linkUrlInput]);

  const resetStateValues = () => {
    setExistingInsights(undefined);
    setExistingLinks(undefined);
    setExistingItemType("");
    setLinkUrlInput("");
    setLinkTitle("");
    setChosenInsights([]);
    setChosenLinks([]);
  };

  const resetAndCloseDialog = useCallback(() => {
    resetStateValues();
    (document.getElementById("insertLinkDialog") as HTMLDialogElement).close();
  }, []);

  const cancelDialog = useCallback(() => {
    resetAndCloseDialog();
  }, [resetAndCloseDialog]);

  useEffect(() => {
    const id = "insertLinkDialog";
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
  }, [cancelDialog]);

  return (
    <dialog id="insertLinkDialog" style={{ width: "80%", height: "80%" }}>
      <h1>Insert a Link into Comment</h1>
      <div
        style={{ display: "flex", flexDirection: "column", padding: "10px" }}
      >
        <h2>Specify an external link</h2>
        <label htmlFor="linkUrlInput" style={{ marginBottom: "5px" }}>
          Link URL:
        </label>
        <input
          id="linkUrlInput"
          type="text"
          placeholder="Paste URL"
          style={{ marginBottom: "10px", padding: "5px", width: "100%" }}
          value={linkUrlInput}
          onChange={(event) => {
            const text = event.target.value;
            if (text && text.match(/https?:\/\/[^ ]+/)) {
              setLinkUrlInput(text);
              setLinkTitleLoading(true);
            } else {
              setLinkTitle("");
              setLinkTitleLoading(false);
            }
          }}
        />
        <p>
          {linkTitleLoading && <span>Loading link title...</span>}
          {linkUrlError && <span style={{ color: "red" }}>{linkUrlError}</span>}
          {linkTitle && <strong>{linkTitle}</strong>}
        </p>
      </div>
      <div>
        <h2>Or: Choose an existing link or insight</h2>
        <p>
          <label>
            <input
              type="radio"
              name="existingItemType"
              value="insight"
              checked={existingItemType == "insight"}
              onChange={() => setExistingItemType("insight")}
            />{" "}
            Insight
          </label>{" "}
          <label>
            <input
              type="radio"
              name="existingItemType"
              value="link"
              checked={existingItemType == "link"}
              onChange={() => setExistingItemType("link")}
            />{" "}
            Link
          </label>
        </p>
        <div style={{ height: "200px", overflow: "scroll" }}>
          {existingItemType == "insight" && !existingInsights && (
            <span>Loading insights...</span>
          )}
          {existingItemType == "insight" && existingInsights && (
            <FactsTable
              data={existingInsights}
              factName="insight"
              setData={
                setExistingInsights as React.Dispatch<
                  React.SetStateAction<Fact[] | undefined>
                >
              }
              selectedFacts={chosenInsights}
              setSelectedFacts={
                setChosenInsights as React.Dispatch<
                  React.SetStateAction<Fact[]>
                >
              }
              dataFilter={insightFilter}
              setDataFilter={setInsightFilter}
            />
          )}
          {existingItemType == "link" && !existingLinks && (
            <span>Loading links...</span>
          )}
          {existingItemType == "link" && existingLinks && (
            <FactsTable
              data={existingLinks}
              factName="link"
              setData={
                setExistingLinks as React.Dispatch<
                  React.SetStateAction<Fact[] | undefined>
                >
              }
              selectedFacts={chosenLinks}
              setSelectedFacts={
                setChosenLinks as React.Dispatch<React.SetStateAction<Fact[]>>
              }
              dataFilter={linkFilter}
              setDataFilter={setLinkFilter}
            />
          )}
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
          style={{ padding: "5px 10px" }}
        >
          Cancel
        </button>
        <button
          className="btn btn-primary"
          aria-label="Submit Dialog"
          onClick={() => {
            if (linkUrlInput && linkTitle) {
              const newHtml = `${html}<a href="${linkUrlInput}" target="_blank">${linkTitle}</a>`;
              setHtml(newHtml);
              resetAndCloseDialog();
            } else if (chosenInsights.length > 0) {
              const newHtml = chosenInsights.reduce((html, insight) => {
                return `${html}Insight: <a href="/insights/${insight.uid}" target="_blank">${insight.title}</a>`;
              }, "");
              setHtml(newHtml);
              resetAndCloseDialog();
            } else if (chosenLinks.length > 0) {
              const newHtml = chosenLinks.reduce((html, link) => {
                return `${html}Link: <a href="/links/${link.uid}" target="_blank">${link.title}</a>`;
              }, "");
              setHtml(newHtml);
              resetAndCloseDialog();
            }
          }}
          style={{ padding: "5px 10px" }}
          disabled={
            !linkUrlInput &&
            chosenInsights.length == 0 &&
            chosenLinks.length == 0
          }
        >
          Submit
        </button>
      </div>
    </dialog>
  );
};

export default InsertLinkDialog;
