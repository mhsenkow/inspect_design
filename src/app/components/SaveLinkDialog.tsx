"use client";

import React, { useCallback, useEffect, useState } from "react";

import { Fact, Insight } from "../types";
import FactsTable from "./FactsTable";
import { getPageTitle } from "../hooks/functions";
import useLinks from "../hooks/useLinks";
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

// need to create a schema here
// because processing of it to get the insights is necessary before createInsights() is called
export type ServerFunctionInputSchemaForSavedLinks = {
  url: string;
  selectedInsights: Insight[];
  newInsightName: string;
};

const SaveLinkDialog = ({
  id,
  isOpen,
  onClose,
  potentialInsightsFromServer,
  setServerFunctionInput,
  setActiveServerFunction,
}: {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  potentialInsightsFromServer: Insight[];
  setServerFunctionInput: (
    value: ServerFunctionInputSchemaForSavedLinks | undefined,
  ) => void;
  setActiveServerFunction: (value: undefined) => void;
}): React.JSX.Element => {
  const [linkUrl, setLinkUrl] = useState<string>("");
  const [linkUrlError, setLinkUrlError] = useState<string>("");
  const [dataFilter, setDataFilter] = useState<string>("");
  const [selectedInsights, setSelectedInsights] = useState<Insight[]>([]);
  const [newInsightName, setNewInsightName] = useState<string>("");
  const [pageTitle, setPageTitle] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [potentialInsights, setPotentialInsights] = useState<Insight[]>(
    potentialInsightsFromServer,
  );
  const [urlValidationTimeout, setUrlValidationTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

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

  const resetStateValues = useCallback(() => {
    setSelectedInsights([]);
    setLinkUrl("");
    setNewInsightName("");
    setDataFilter("");
    setLinkUrlError("");
    setPageTitle("");
    setLoading(false);
    if (urlValidationTimeout) {
      clearTimeout(urlValidationTimeout);
      setUrlValidationTimeout(null);
    }
  }, [urlValidationTimeout]);

  const handleClose = useCallback(() => {
    setServerFunctionInput(undefined);
    setActiveServerFunction(undefined);
    resetStateValues();
    onClose();
  }, [
    setActiveServerFunction,
    setServerFunctionInput,
    resetStateValues,
    onClose,
  ]);

  const handleSubmit = useCallback(() => {
    // Validate URL before submitting
    try {
      new URL(linkUrl);
    } catch {
      setLinkUrlError("Invalid URL format");
      return;
    }

    setServerFunctionInput({
      url: linkUrl,
      selectedInsights: [...selectedInsights],
      newInsightName,
    });
    resetStateValues();
    onClose();
  }, [
    linkUrl,
    selectedInsights,
    newInsightName,
    setServerFunctionInput,
    resetStateValues,
    onClose,
  ]);

  useEffect(() => {
    if (linkUrl && !pageTitle && !loading && !linkUrlError) {
      // Only fetch if URL looks valid and complete
      const isValidCompleteUrl =
        linkUrl.match(/^https?:\/\/[^\s]+$/) && linkUrl.length > 10;

      if (isValidCompleteUrl) {
        setLoading(true);
        setLinkUrlError("");

        getPageTitle(linkUrl)
          .then((title) => {
            setPageTitle(title);
            setLoading(false);
          })
          .catch((error) => {
            console.error("Error fetching page title:", error);
            setLoading(false);

            // Check if it's a blocking error (403, 429, etc.)
            if (
              error.message.includes("403") ||
              error.message.includes("blocked") ||
              error.message.includes("Forbidden")
            ) {
              setLinkUrlError(
                "Website blocks automated access - you can still save the link",
              );
            } else {
              setLinkUrlError(
                "Could not get page title - you can still save the link",
              );
            }
          });
      }
    }
  }, [linkUrl, pageTitle, loading, linkUrlError]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (urlValidationTimeout) {
        clearTimeout(urlValidationTimeout);
      }
    };
  }, [urlValidationTimeout]);

  return (
    <Modal
      id={id}
      title="Save Link to Inspect"
      isOpen={isOpen}
      onClose={handleClose}
      size="large"
    >
      <ModalBody>
        <ModalContentSection title="Enter the URL">
          <FormGroup>
            <FormInput
              type="text"
              placeholder="Link URL..."
              value={linkUrl}
              onChange={(event) => {
                const text = event.target.value;
                setLinkUrl(text);

                // Clear any existing timeout
                if (urlValidationTimeout) {
                  clearTimeout(urlValidationTimeout);
                }

                // Reset states immediately
                setPageTitle("");
                setLinkUrlError("");
                setLoading(false);

                // Only validate and fetch if the URL looks complete
                if (text && text.length > 5) {
                  const isValidUrl =
                    text.match(/^https?:\/\/[^\s]+$/) ||
                    text.match(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/);

                  if (isValidUrl) {
                    // Debounce the URL validation to prevent rapid requests
                    const timeout = setTimeout(() => {
                      const fullUrl = text.startsWith("http")
                        ? text
                        : `https://${text}`;
                      setLinkUrl(fullUrl);
                    }, 1000); // Wait 1 second after user stops typing

                    setUrlValidationTimeout(timeout);
                  }
                }
              }}
              error={linkUrlError}
            />
          </FormGroup>
          {loading && <ModalLoadingState message="Fetching page title..." />}
          {!loading && pageTitle && (
            <div style={{ fontWeight: "bold", marginTop: "var(--spacing-2)" }}>
              {pageTitle}
            </div>
          )}
        </ModalContentSection>

        <ModalContentSection title="Then: choose one or more existing insight" className="flex-grow">
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
                  name: "Updated",
                  dataColumn: "updated_at",
                  display: (insight: Fact | Insight): React.JSX.Element => (
                    <span className="text-sm text-secondary font-mono">
                      {insight.updated_at
                        ? new Date(insight.updated_at).toLocaleDateString("en-US", {
                            month: "2-digit",
                            day: "2-digit",
                            year: "numeric",
                          })
                        : "---"}
                    </span>
                  ),
                },
                {
                  name: "Title",
                  dataColumn: "title",
                  display: (insight: Fact | Insight): React.JSX.Element => (
                    <span className="text-sm text-primary font-medium">
                      {insight.title || "Untitled"}
                    </span>
                  ),
                },
              ]}
            />
        </ModalContentSection>

        <ModalContentSection title="Or: create a new insight to contain them">
          <FormGroup>
            <FormInput
              type="text"
              placeholder="New insight name"
              value={newInsightName}
              onChange={(event) => setNewInsightName(event.target.value)}
            />
          </FormGroup>
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
            !linkUrl || !(selectedInsights.length > 0 || newInsightName)
          }
        >
          Submit
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
};

export default SaveLinkDialog;
