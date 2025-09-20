"use client";

import React, { useCallback, useEffect, useState } from "react";

import { Fact, FLVResponse, Insight } from "../../types";
import FactsTable from "../../components/FactsTable";
import {
  doAddParentInsightsSchema,
  potentialInsightsWithoutLoops,
} from "./functions";
import { GetInsightsRouteResponse } from "../../api/insights/route";
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
} from "../../components/Modal";

interface Props {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  insight: Insight;
  setServerFunctionInput: (
    value: doAddParentInsightsSchema | undefined,
  ) => void;
  setActiveServerFunction: (
    value:
      | {
          function: (
            input: doAddParentInsightsSchema,
          ) => Promise<FLVResponse | FLVResponse[]>;
        }
      | undefined,
  ) => void;
}

const AddParentInsightsDialog = ({
  id,
  isOpen,
  onClose,
  insight,
  setServerFunctionInput,
  setActiveServerFunction,
}: Props): React.JSX.Element => {
  const [dataFilter, setDataFilter] = useState<string>("");
  const [insights, setInsights] = useState<Insight[] | undefined>();
  const [selectedParentInsights, setSelectedParentInsights] = useState<
    Insight[]
  >([]);
  const [newInsightName, setNewInsightName] = useState<string>("");

  useEffect(() => {
    fetch("/api/insights?offset=0&limit=20&parents=true&children=true")
      .then(async (response: Response | GetInsightsRouteResponse) => {
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        return response.json();
      })
      .then((insights) => {
        setInsights(potentialInsightsWithoutLoops(insight, insights));
      });
  }, [insight]);

  const resetStateValues = () => {
    setSelectedParentInsights([]);
    setDataFilter("");
    setNewInsightName("");
  };

  const handleClose = useCallback(() => {
    setServerFunctionInput(undefined);
    setActiveServerFunction(undefined);
    resetStateValues();
    onClose();
  }, [setActiveServerFunction, setServerFunctionInput, onClose]);

  const handleSubmit = useCallback(() => {
    setServerFunctionInput({
      childInsight: insight,
      newParentInsights: selectedParentInsights,
      newInsightName,
    });
    resetStateValues();
    onClose();
  }, [
    insight,
    selectedParentInsights,
    newInsightName,
    setServerFunctionInput,
    onClose,
  ]);

  const queryFunctionForAddParentInsightsDialog = async (search: string) => {
    const response = await fetch(
      `/api/insights?&query=${search}&offset=0&limit=20&parents=true&children=true`,
    );
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const data = await response.json();
    return potentialInsightsWithoutLoops(insight, data);
  };

  return (
    <Modal
      id={id}
      title={`Add Parent Insights to Insight: ${insight.title}`}
      isOpen={isOpen}
      onClose={handleClose}
      size="large"
    >
      <ModalBody>
        <ModalContentSection title="Then: choose one or more existing insight" className="flex-grow">
          <FactsTable
            data={insights}
            setData={
              setInsights as React.Dispatch<
                React.SetStateAction<Fact[] | undefined>
              >
            }
            factName="insight"
            selectedFacts={selectedParentInsights}
            setSelectedFacts={
              setSelectedParentInsights as React.Dispatch<
                React.SetStateAction<Fact[]>
              >
            }
            queryFunction={queryFunctionForAddParentInsightsDialog}
            dataFilter={dataFilter}
            setDataFilter={setDataFilter}
            selectRows={true}
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
              onChange={(event) => setNewInsightName(event.target.value || "")}
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
          disabled={!newInsightName && selectedParentInsights.length === 0}
        >
          Submit
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
};

export default AddParentInsightsDialog;
