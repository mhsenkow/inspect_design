"use client";

import React, { useCallback, useContext, useEffect, useState } from "react";

import { Fact, Insight, ServerFunction } from "../../types";
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
import ServerActionContext from "../../contexts/ServerActionContext";
import { addChildrenToInsight } from "../../components/SelectedCitationsAPI";

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
}

const AddChildInsightsDialog = ({
  id,
  isOpen,
  onClose,
  insight,
}: Props): React.JSX.Element => {
  const [dataFilter, setDataFilter] = useState<string>("");
  const [childInsights, setChildInsights] = useState<Insight[] | undefined>();
  const [selectedChildInsights, setSelectedChildInsights] = useState<Insight[]>(
    [],
  );
  const [newInsightName, setNewInsightName] = useState<string>("");
  const [activeTab, setActiveTab] = useState("existing");
  const serverActionContext = useContext(ServerActionContext);

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

  const resetStateValues = useCallback(() => {
    setSelectedChildInsights([]);
    setDataFilter("");
    setNewInsightName("");
    setActiveTab("existing");
  }, []);

  const handleClose = useCallback(() => {
    resetStateValues();
    onClose();
  }, [resetStateValues, onClose]);

  const handleSubmit = useCallback(() => {
    if (serverActionContext) {
      void serverActionContext
        .executeAction(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          addChildrenToInsight as ServerFunction<any>,
          {
            parentInsight: insight,
            children: selectedChildInsights,
            newChildInsightName: newInsightName,
          },
        )
        .then(() => {
          resetStateValues();
          onClose();
        });
      return;
    }
    resetStateValues();
    onClose();
  }, [
    serverActionContext,
    resetStateValues,
    onClose,
    insight,
    selectedChildInsights,
    newInsightName,
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
                name: "📄",
                dataColumn: "evidence",
                display: (insight: Fact | Insight): React.JSX.Element => (
                  <span className="badge text-bg-danger">
                    {insight.evidence?.length ?? 0}
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
      label: "New insight",
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
      title="Add child insights"
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
          disabled={
            selectedChildInsights.length === 0 && !newInsightName.trim()
          }
        >
          Add
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
};

export default AddChildInsightsDialog;
