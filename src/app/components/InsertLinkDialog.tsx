import React, { useCallback, useEffect, useState } from "react";
import FactsTable from "./FactsTable";
import { Fact, Insight, Link } from "../types";
import { GetInsightsRouteResponse } from "../api/insights/route";
import { GetLinksResponse } from "../api/links/route";
import { getPageTitle } from "../hooks/functions";
import {
  Modal,
  ModalBody,
  ModalFooter,
  FormGroup,
  FormInput,
  ModalButton,
  ModalContentSection,
  ModalLoadingState,
} from "./Modal";

interface Props {
  html: string;
  setHtml: React.Dispatch<React.SetStateAction<string>>;
}

const InsertLinkDialog = ({ html, setHtml }: Props) => {
  const [existingItemType, setExistingItemType] = useState<string>("");
  const [existingInsights, setExistingInsights] = useState<Insight[]>();
  const [existingLinks, setExistingLinks] = useState<Link[]>();
  const [linkUrlInput, setLinkUrlInput] = useState<string>("");
  const [linkTitle, setLinkTitle] = useState<string>("");
  const [linkTitleLoading, setLinkTitleLoading] = useState(false);
  const [linkUrlError, setLinkUrlError] = useState<string>("");
  const [chosenInsights, setChosenInsights] = useState<Insight[]>([]);
  const [chosenLinks, setChosenLinks] = useState<Link[]>([]);
  const [insightFilter, setInsightFilter] = useState<string>("");
  const [linkFilter, setLinkFilter] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

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
    setLinkUrlError("");
    setLinkTitleLoading(false);
  };

  const handleClose = useCallback(() => {
    resetStateValues();
    setIsOpen(false);
  }, []);

  const handleSubmit = useCallback(() => {
    if (linkUrlInput && linkTitle) {
      const newHtml = `${html}<a href="${linkUrlInput}" target="_blank">${linkTitle}</a>`;
      setHtml(newHtml);
      handleClose();
    } else if (chosenInsights.length > 0) {
      const newHtml = chosenInsights.reduce((html, insight) => {
        return `${html}Insight: <a href="/insights/${insight.uid}" target="_blank">${insight.title}</a>`;
      }, "");
      setHtml(newHtml);
      handleClose();
    } else if (chosenLinks.length > 0) {
      const newHtml = chosenLinks.reduce((html, link) => {
        return `${html}Link: <a href="/links/${link.uid}" target="_blank">${link.title}</a>`;
      }, "");
      setHtml(newHtml);
      handleClose();
    }
  }, [html, setHtml, linkUrlInput, linkTitle, chosenInsights, chosenLinks, handleClose]);

  // Listen for dialog open events
  useEffect(() => {
    const dialog = document.getElementById("insertLinkDialog") as HTMLDialogElement;
    if (dialog) {
      const handleOpen = () => setIsOpen(true);
      dialog.addEventListener("show", handleOpen);
      return () => dialog.removeEventListener("show", handleOpen);
    }
  }, []);

  return (
    <>
      <dialog id="insertLinkDialog" style={{ display: "none" }} />
      <Modal
        id="insertLinkDialog"
        title="Insert a Link into Comment"
        isOpen={isOpen}
        onClose={handleClose}
        size="large"
      >
        <ModalBody>
          <ModalContentSection title="Specify an external link">
            <FormGroup>
              <FormInput
                type="text"
                placeholder="Paste URL"
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
                error={linkUrlError}
              />
            </FormGroup>
            {linkTitleLoading && <ModalLoadingState message="Loading link title..." />}
            {!linkTitleLoading && linkTitle && (
              <div style={{ fontWeight: "bold", marginTop: "var(--spacing-2)" }}>
                {linkTitle}
              </div>
            )}
          </ModalContentSection>

          <ModalContentSection title="Or: Choose an existing link or insight">
            <div style={{ marginBottom: "var(--spacing-4)" }}>
              <label style={{ display: "flex", gap: "var(--spacing-4)", marginBottom: "var(--spacing-3)" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2)" }}>
                  <input
                    type="radio"
                    name="existingItemType"
                    value="insight"
                    checked={existingItemType == "insight"}
                    onChange={() => setExistingItemType("insight")}
                  />
                  Insight
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2)" }}>
                  <input
                    type="radio"
                    name="existingItemType"
                    value="link"
                    checked={existingItemType == "link"}
                    onChange={() => setExistingItemType("link")}
                  />
                  Link
                </label>
              </label>
            </div>
            <div style={{ height: "200px", overflow: "scroll" }}>
              {existingItemType == "insight" && !existingInsights && (
                <ModalLoadingState message="Loading insights..." />
              )}
              {existingItemType == "insight" && existingInsights && (
                <FactsTable
                  data={existingInsights}
                  factName="insight"
                  setData={setExistingInsights as React.Dispatch<React.SetStateAction<Fact[] | undefined>>}
                  selectedFacts={chosenInsights}
                  setSelectedFacts={setChosenInsights as React.Dispatch<React.SetStateAction<Fact[]>>}
                  dataFilter={insightFilter}
                  setDataFilter={setInsightFilter}
                />
              )}
              {existingItemType == "link" && !existingLinks && (
                <ModalLoadingState message="Loading links..." />
              )}
              {existingItemType == "link" && existingLinks && (
                <FactsTable
                  data={existingLinks}
                  factName="link"
                  setData={setExistingLinks as React.Dispatch<React.SetStateAction<Fact[] | undefined>>}
                  selectedFacts={chosenLinks}
                  setSelectedFacts={setChosenLinks as React.Dispatch<React.SetStateAction<Fact[]>>}
                  dataFilter={linkFilter}
                  setDataFilter={setLinkFilter}
                />
              )}
            </div>
          </ModalContentSection>
        </ModalBody>
        <ModalFooter>
          <ModalButton variant="secondary" onClick={handleClose}>
            Cancel
          </ModalButton>
          <ModalButton
            variant="primary"
            onClick={handleSubmit}
            disabled={
              !linkUrlInput &&
              chosenInsights.length == 0 &&
              chosenLinks.length == 0
            }
          >
            Submit
          </ModalButton>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default InsertLinkDialog;
