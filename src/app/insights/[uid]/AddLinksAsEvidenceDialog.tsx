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
import {
  Modal,
  ModalBody,
  ModalFooter,
  TabNav,
  TabContent,
  FormGroup,
  FormInput,
  ModalButton,
  ModalContentSection,
  ModalLoadingState,
} from "../../components/Modal";

interface Props {
  id: string;
  isOpen: boolean;
  onClose: () => void;
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
  isOpen,
  onClose,
  insight,
  setServerFunctionInput,
  setActiveServerFunction,
}: Props): React.JSX.Element => {
  const [dataFilter, setDataFilter] = useState<string>("");
  const [selectedCitations, setSelectedCitations] = useState<InsightEvidence[]>([]);
  const [newLinkUrl, setNewLinkUrl] = useState<string>("");
  const [pageTitle, setPageTitle] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [linkUrlError, setLinkUrlError] = useState<string>("");
  const [activeTab, setActiveTab] = useState("existing");

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
    setActiveTab("existing");
  };

  const handleClose = useCallback(() => {
    setServerFunctionInput(undefined);
    setActiveServerFunction(undefined);
    resetStateValues();
    onClose();
  }, [setActiveServerFunction, setServerFunctionInput, onClose]);

  const handleSubmit = useCallback(() => {
    setServerFunctionInput({
      insight,
      evidence: selectedCitations,
      newLinkUrl,
    });
    resetStateValues();
    onClose();
  }, [insight, selectedCitations, newLinkUrl, setServerFunctionInput, onClose]);

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

  const tabs = [
    {
      id: "existing",
      label: "Existing links",
      content: (
        <ModalContentSection>
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
            setData={setLinksToShow as React.Dispatch<React.SetStateAction<Fact[] | undefined>>}
            factName="snippet"
            selectedFacts={selectedCitations}
            setSelectedFacts={setSelectedCitations as React.Dispatch<React.SetStateAction<Fact[]>>}
            queryFunction={queryFunctionForAddLinksAsEvidenceDialog}
            dataFilter={dataFilter}
            setDataFilter={setDataFilter}
            selectRows={true}
          />
        </ModalContentSection>
      ),
    },
    {
      id: "new",
      label: "Save link",
      content: (
        <ModalContentSection>
          <FormGroup>
            <FormInput
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
      ),
    },
  ];

  return (
    <Modal
      id={id}
      title={`Add Links to Insight: ${insight.title}`}
      isOpen={isOpen}
      onClose={handleClose}
      size="large"
    >
        <ModalBody>
          <TabNav
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          {tabs.map((tab) => (
            <TabContent
              key={tab.id}
              tabId={tab.id}
              activeTab={activeTab}
            >
              {tab.content}
            </TabContent>
          ))}
        </ModalBody>
        <ModalFooter>
          <ModalButton variant="secondary" onClick={handleClose}>
            Cancel
          </ModalButton>
          <ModalButton
            variant="primary"
            onClick={handleSubmit}
            disabled={!newLinkUrl && selectedCitations.length === 0}
          >
            Add
          </ModalButton>
        </ModalFooter>
      </Modal>
  );
};

export default AddLinksAsEvidenceDialog;
