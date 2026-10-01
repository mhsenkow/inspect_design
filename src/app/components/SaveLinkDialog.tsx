"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

import { Fact, Insight } from "../types";
import FactsTable from "./FactsTable";
import { getPageTitle } from "../hooks/functions";
import useLinks from "../hooks/useLinks";
import {
  Modal,
  ModalBody,
  ModalFooter,
  FormGroup,
  FormLabel,
  FormInput,
  ModalButton,
  ModalContentSection,
  ModalLoadingState,
} from "./Modal";

export type ServerFunctionInputSchemaForSavedLinks = {
  url?: string;
  selectedInsights?: Insight[];
  newInsightName?: string;
};

const SaveLinkDialog = ({
  id,
  isOpen,
  onClose,
  potentialInsightsFromServer,
  onSubmit,
}: {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  potentialInsightsFromServer: Insight[];
  onSubmit?: (input: ServerFunctionInputSchemaForSavedLinks) => Promise<void>;
}): React.JSX.Element => {
  const [linkUrl, setLinkUrl] = useState("");
  const [dataFilter, setDataFilter] = useState("");
  const [selectedInsights, setSelectedInsights] = useState<Insight[]>([]);
  const [newInsightName, setNewInsightName] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [potentialInsights, setPotentialInsights] = useState<Insight[]>(
    potentialInsightsFromServer,
  );
  const useLinksReturn = useLinks({
    offset: 0,
    limit: 1,
    query: linkUrl ? (`url=${linkUrl}` as string) : null,
  });
  const existingLinks = useLinksReturn[0];
  const [linkUrlError, setLinkUrlError] = useState("");
  const urlValidationTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    if (isOpen) {
      setPotentialInsights(potentialInsightsFromServer);
    }
  }, [isOpen, potentialInsightsFromServer]);

  const resetStateValues = useCallback(() => {
    setSelectedInsights([]);
    setLinkUrl("");
    setNewInsightName("");
    setDataFilter("");
    setLinkUrlError("");
    setPageTitle("");
    setLoading(false);
    setSubmitting(false);
    setSubmitError("");
    if (urlValidationTimeout.current) {
      clearTimeout(urlValidationTimeout.current);
      urlValidationTimeout.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    if (submitting) return;
    resetStateValues();
    onClose();
  }, [resetStateValues, onClose, submitting]);

  const normalizeUrl = (raw: string): string => {
    const trimmed = raw.trim();
    return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
  };

  const handleSubmit = useCallback(async () => {
    const fullUrl = normalizeUrl(linkUrl);
    try {
      new URL(fullUrl);
    } catch {
      setLinkUrlError("Invalid URL format");
      return;
    }

    if (!(selectedInsights.length > 0 || newInsightName.trim())) {
      setSubmitError("Pick an existing insight or name a new one.");
      return;
    }

    if (!onSubmit) {
      setSubmitError("Save handler is not configured.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      await onSubmit({
        url: fullUrl,
        selectedInsights: [...selectedInsights],
        newInsightName: newInsightName.trim(),
      });
      resetStateValues();
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to save link.",
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    linkUrl,
    selectedInsights,
    newInsightName,
    onSubmit,
    resetStateValues,
    onClose,
  ]);

  useEffect(() => {
    return () => {
      if (urlValidationTimeout.current) {
        clearTimeout(urlValidationTimeout.current);
      }
    };
  }, []);

  const fetchPageTitle = useCallback((urlToFetch: string) => {
    setLoading(true);
    setLinkUrlError("");

    getPageTitle(urlToFetch)
      .then((title) => {
        setPageTitle(title);
      })
      .catch((error: Error) => {
        console.error("Error fetching page title:", error);
        if (
          error.message.includes("403") ||
          error.message.includes("blocked") ||
          error.message.includes("Forbidden")
        ) {
          setLinkUrlError(
            "Website blocks automated access — you can still save the link",
          );
        } else {
          setLinkUrlError(
            "Could not get page title — you can still save the link",
          );
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const linkExistsError =
    existingLinks && existingLinks.length > 0 ? "Link already exists" : "";
  const displayError = linkUrlError || linkExistsError;
  const canSubmit =
    Boolean(linkUrl.trim()) &&
    (selectedInsights.length > 0 || Boolean(newInsightName.trim())) &&
    !submitting;

  return (
    <Modal
      id={id}
      title="Save link"
      isOpen={isOpen}
      onClose={handleClose}
      size="large"
      closeOnBackdropClick={!submitting}
      closeOnEscape={!submitting}
    >
      <ModalBody>
        <ModalContentSection
          title="Link URL"
          subtitle="Paste a URL to save into Inspect."
        >
          <FormGroup>
            <FormLabel htmlFor="save-link-url">URL</FormLabel>
            <FormInput
              id="save-link-url"
              type="url"
              inputMode="url"
              placeholder="https://example.com/article"
              value={linkUrl}
              autoComplete="url"
              disabled={submitting}
              onChange={(event) => {
                const text = event.target.value;
                setLinkUrl(text);
                setSubmitError("");

                if (urlValidationTimeout.current) {
                  clearTimeout(urlValidationTimeout.current);
                }

                setPageTitle("");
                setLinkUrlError("");
                setLoading(false);

                const isValidUrl =
                  text.match(/^https?:\/\/[^\s]+$/) ||
                  text.match(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/);

                if (isValidUrl) {
                  urlValidationTimeout.current = setTimeout(() => {
                    fetchPageTitle(normalizeUrl(text));
                  }, 600);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && canSubmit) {
                  event.preventDefault();
                  void handleSubmit();
                }
              }}
              error={displayError}
            />
          </FormGroup>
          {loading && <ModalLoadingState message="Fetching page title…" />}
          {!loading && pageTitle && (
            <p className="modal-page-title-preview">{pageTitle}</p>
          )}
        </ModalContentSection>

        <ModalContentSection
          title="Add to existing insight"
          subtitle="Optional — select one or more insights."
        >
          <div className="modal-insights-picker">
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
        </ModalContentSection>

        <ModalContentSection
          title="Or create a new insight"
          subtitle="Use this if the link doesn’t belong to an existing insight yet."
        >
          <FormGroup>
            <FormLabel htmlFor="save-link-new-insight">
              New insight name
            </FormLabel>
            <FormInput
              id="save-link-new-insight"
              type="text"
              placeholder="Name for a new insight"
              value={newInsightName}
              disabled={submitting}
              onChange={(event) => {
                setNewInsightName(event.target.value);
                setSubmitError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && canSubmit) {
                  event.preventDefault();
                  void handleSubmit();
                }
              }}
            />
          </FormGroup>
        </ModalContentSection>
        {submitError && <div className="modal-inline-error">{submitError}</div>}
      </ModalBody>
      <ModalFooter>
        <ModalButton
          variant="secondary"
          onClick={handleClose}
          disabled={submitting}
        >
          Cancel
        </ModalButton>
        <ModalButton
          variant="primary"
          onClick={() => void handleSubmit()}
          disabled={!canSubmit}
        >
          {submitting ? "Saving…" : "Save link"}
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
};

export default SaveLinkDialog;
