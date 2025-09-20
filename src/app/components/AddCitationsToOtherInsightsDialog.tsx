"use client";

import React, { useCallback, useEffect, useState } from "react";

import { Fact, Insight, InsightEvidence, ServerFunction } from "../types";
import FactsTable from "./FactsTable";
import { getDisabledInsightIds } from "../functions";
import { doAddCitationsToOtherInsightsSchema } from "../insights/[uid]/functions";
import { GetLinksResponse } from "../api/links/route";
import {
  Modal,
  ModalBody,
  ModalFooter,
  FormGroup,
  FormInput,
  ModalButton,
  ModalContentSection,
} from "./Modal";

const AddCitationsToOtherInsightsDialog = ({
  id,
  isOpen,
  onClose,
  selectedCitations: selectedCitationsInput,
  setServerFunctionInput,
  setActiveServerFunction,
}: {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  selectedCitations: InsightEvidence[];
  setServerFunctionInput: React.Dispatch<
    React.SetStateAction<doAddCitationsToOtherInsightsSchema | undefined>
  >;
  setActiveServerFunction: React.Dispatch<
    | { function: ServerFunction<doAddCitationsToOtherInsightsSchema> }
    | undefined
  >;
}): React.JSX.Element => {
  const [selectedInsights, setSelectedInsights] = useState([]);
  const [dataFilter, setDataFilter] = useState<string>("");
  const [citationsToRemove, setCitationsToRemove] = useState([]);
  const [newInsightName, setNewInsightName] = useState<string>("");
  const [newInsightIsCategory, setNewInsightIsCategory] = useState(false);
  const [potentialInsights, setPotentialInsights] = useState<Insight[]>();
  const [citationsToRemoveDataFilter, setCitationsToRemoveDataFilter] =
    useState<string>("");
  const [disabledInsightIds, setDisabledInsightIds] = useState<number[]>();
  const [selectedCitations, setSelectedCitations] = useState<InsightEvidence[]>(
    selectedCitationsInput,
  );

  useEffect(() => {
    fetch(`/api/insights?offset=0&limit=10`)
      .then(async (response: Response | GetLinksResponse) => {
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        return response.json();
      })
      .then((json) => {
        setPotentialInsights(json);
      });
  }, []);

  useEffect(() => {
    if (potentialInsights) {
      const disabledInsightIds = getDisabledInsightIds(
        potentialInsights,
        selectedCitations,
      );
      setDisabledInsightIds(disabledInsightIds);
    }
  }, [potentialInsights, selectedCitations]);

  const resetStateValues = () => {
    setSelectedInsights([]);
    setDataFilter("");
    setCitationsToRemove([]);
    setNewInsightName("");
    setNewInsightIsCategory(false);
    setCitationsToRemoveDataFilter("");
  };

  const handleClose = useCallback(() => {
    setServerFunctionInput(undefined);
    setActiveServerFunction(undefined);
    resetStateValues();
    onClose();
  }, [setActiveServerFunction, setServerFunctionInput, onClose]);

  const handleSubmit = useCallback(() => {
    setServerFunctionInput({
      selectedCitations,
      citationsToRemove,
      selectedInsights: [...selectedInsights],
      newInsightName,
    });
    resetStateValues();
    onClose();
  }, [
    selectedCitations,
    citationsToRemove,
    selectedInsights,
    newInsightName,
    setServerFunctionInput,
    onClose,
  ]);

  const snippetQueryFunction = (query: string) =>
    fetch(`/api/links?offset=0&limit=10&query=${query}`).then(
      async (response: Response | GetLinksResponse) => {
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        return response.json();
      },
    );

  return (
    <Modal
      id={id}
      title="Add citations to other insights"
      isOpen={isOpen}
      onClose={handleClose}
      size="large"
    >
      <ModalBody>
        <ModalContentSection title="First: select citations to remove from this insight">
          <FactsTable
            factName="snippet"
            data={selectedCitations}
            setData={
              setSelectedCitations as React.Dispatch<
                React.SetStateAction<Fact[] | undefined>
              >
            }
            selectedFacts={citationsToRemove}
            setSelectedFacts={
              setCitationsToRemove as React.Dispatch<
                React.SetStateAction<Fact[]>
              >
            }
            selectRows={true}
            hideHead={true}
            dataFilter={citationsToRemoveDataFilter}
            setDataFilter={setCitationsToRemoveDataFilter}
            queryFunction={snippetQueryFunction}
          />
        </ModalContentSection>

        <div style={{ display: "flex", gap: "var(--spacing-4)" }}>
          <div style={{ flex: "50%" }}>
            <ModalContentSection title="Then: select other insights to add them to">
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
                disabledIds={disabledInsightIds}
                selectRows={true}
                columns={[
                  {
                    name: "Citations",
                    display: (insight: Fact | Insight): React.JSX.Element => (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-error-100 text-error-800">
                        {insight.evidence?.length || 0}
                      </span>
                    ),
                  },
                ]}
              />
            </ModalContentSection>
          </div>
          <div style={{ flex: "50%" }}>
            <ModalContentSection title="Or: create a new insight to contain them">
              <FormGroup>
                <FormInput
                  type="text"
                  placeholder="New insight name"
                  value={newInsightName}
                  onChange={(event) => setNewInsightName(event.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--spacing-2)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={newInsightIsCategory}
                    onChange={(event) => {
                      setNewInsightIsCategory(event.target.checked);
                      if (event.target.checked) {
                        setNewInsightName(`Category: ${newInsightName}`);
                      } else {
                        setNewInsightName(newInsightName.slice(10));
                      }
                    }}
                  />
                  Category
                </label>
              </FormGroup>
            </ModalContentSection>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <ModalButton variant="secondary" onClick={handleClose}>
          Cancel
        </ModalButton>
        <ModalButton
          variant="primary"
          onClick={handleSubmit}
          disabled={selectedInsights.length === 0 && !newInsightName}
        >
          Submit
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
};

export default AddCitationsToOtherInsightsDialog;
