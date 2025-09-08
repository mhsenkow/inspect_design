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

  const handleClose = useCallback(() => {
    setServerFunctionInput(undefined);
    setActiveServerFunction(undefined);
    resetStateValues();
    onClose();
  }, [setActiveServerFunction, setServerFunctionInput, onClose]);

  const handleSubmit = useCallback(() => {
    setServerFunctionInput({
      url: linkUrl,
      selectedInsights: [...selectedInsights],
      newInsightName,
    });
    resetStateValues();
    onClose();
  }, [linkUrl, selectedInsights, newInsightName, setServerFunctionInput, onClose]);

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
                  
                  if (text && (text.match(/https?:\/\/[^ ]+/) || text.match(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}.*$/))) {
                    // If it doesn't start with http/https, add https://
                    const fullUrl = text.startsWith('http') ? text : `https://${text}`;
                    setLinkUrl(fullUrl);
                    setLoading(true);
                    setLinkUrlError("");
                  } else {
                    setLinkUrl(text);
                    setPageTitle("");
                    setLinkUrlError("");
                    setLoading(false);
                  }
                }}
                error={linkUrlError}
              />
            </FormGroup>
            {loading && <ModalLoadingState message="Title loading..." />}
            {!loading && pageTitle && (
              <div style={{ fontWeight: "bold", marginTop: "var(--spacing-2)" }}>
                {pageTitle}
              </div>
            )}
          </ModalContentSection>

          <ModalContentSection title="Then: choose one or more existing insight">
            <div style={{ height: "200px", overflowY: "scroll" }}>
              <FactsTable
                factName="potentialInsight"
                data={potentialInsights}
                setData={setPotentialInsights as React.Dispatch<React.SetStateAction<Fact[] | undefined>>}
                selectedFacts={selectedInsights}
                setSelectedFacts={setSelectedInsights as React.Dispatch<React.SetStateAction<Fact[]>>}
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
              !linkUrl ||
              !!linkUrlError ||
              !(selectedInsights.length > 0 || newInsightName)
            }
          >
            Submit
          </ModalButton>
        </ModalFooter>
      </Modal>
  );
};

export default SaveLinkDialog;
