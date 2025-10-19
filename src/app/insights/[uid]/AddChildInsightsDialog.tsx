"use client";

import React, { useCallback, useEffect, useState } from "react";

import { Fact, Insight } from "../../types";
import FactsTable from "../../components/FactsTable";
import { potentialInsightsWithoutLoops } from "./functions";
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

export type ServerFunctionInputSchemaForChildInsights = {
  insight: Insight;
  children: Insight[];
  newInsightName: string;
};

interface Props {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  insight: Insight;
  setServerFunctionInput: (
    value: ServerFunctionInputSchemaForChildInsights | undefined,
  ) => void;
  setActiveServerFunction: (
    value:
      | {
          function: ServerFunctionInputSchemaForChildInsights;
        }
      | undefined,
  ) => void;
}

const AddChildInsightsDialog = ({
  id,
  isOpen,
  onClose,
  insight,
  setServerFunctionInput,
  setActiveServerFunction,
}: Props): React.JSX.Element => {
  const [dataFilter, setDataFilter] = useState<string>("");
  const [childInsights, setChildInsights] = useState<Insight[] | undefined>();
  const [selectedChildInsights, setSelectedChildInsights] = useState<Insight[]>(
    [],
  );
  const [newInsightName, setNewInsightName] = useState<string>("");
  const [activeTab, setActiveTab] = useState("existing");

  useEffect(() => {
    fetch(
      "/api/insights?offset=0&limit=20&children=true&parents=true&evidence=true",
    )
      .then(async (response: Response | GetInsightsRouteResponse) => {
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        return response.json();
      })
      .then((insights: Insight[]) => {
        setChildInsights(potentialInsightsWithoutLoops(insight, insights));
      });
  }, [insight]);

  const resetStateValues = () => {
    setSelectedChildInsights([]);
    setDataFilter("");
    setNewInsightName("");
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
      children: selectedChildInsights,
      newInsightName,
    });
    resetStateValues();
    onClose();
  }, [
    insight,
    selectedChildInsights,
    newInsightName,
    setServerFunctionInput,
    onClose,
  ]);

  const queryFunctionForAddChildInsightDialog = async (search: string) => {
    const response = await fetch(
      `/api/insights?&query=${search}&offset=0&limit=20&parents=true&children=true&evidence=true`,
    );
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const data = await response.json();
    return potentialInsightsWithoutLoops(insight, data);
  };

  const tabs = [
    {
      id: "existing",
      label: "Existing insights",
      content: (
        <ModalContentSection>
          <FactsTable
            data={childInsights}
            setData={
              setChildInsights as React.Dispatch<
                React.SetStateAction<Fact[] | undefined>
              >
            }
            factName="insight"
            selectedFacts={selectedChildInsights}
            setSelectedFacts={
              setSelectedChildInsights as React.Dispatch<
                React.SetStateAction<Fact[]>
              >
            }
            queryFunction={queryFunctionForAddChildInsightDialog}
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
                      ? new Date(insight.updated_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "2-digit",
                            day: "2-digit",
                            year: "numeric",
                          },
                        )
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
      ),
    },
    {
      id: "new",
      label: "Create new",
      content: (
        <ModalContentSection>
          <FormGroup>
            <FormInput
              type="text"
              placeholder="New insight name"
              value={newInsightName}
              onChange={(event) => setNewInsightName(event.target.value)}
            />
          </FormGroup>
        </ModalContentSection>
      ),
    },
  ];

  return (
    <Modal
      id={id}
      title={`Add Child Insights to Insight: ${insight.title}`}
      isOpen={isOpen}
      onClose={handleClose}
      size="large"
    >
      <ModalBody>
        <TabNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        {tabs.map((tab) => (
          <TabContent key={tab.id} tabId={tab.id} activeTab={activeTab}>
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
          disabled={selectedChildInsights.length === 0 && !newInsightName}
        >
          Add
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
};

export default AddChildInsightsDialog;
