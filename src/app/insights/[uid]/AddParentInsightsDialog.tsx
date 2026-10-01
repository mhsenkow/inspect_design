"use client";

import React, { useCallback, useContext, useEffect, useState } from "react";

import { Fact, Insight } from "../../types";
import FactsTable from "../../components/FactsTable";
import {
  doAddParentInsights,
  // doAddParentInsightsSchema,
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
import ServerActionContext from "../../contexts/ServerActionContext";

interface Props {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  insight: Insight;
}

const AddParentInsightsDialog = ({
  id,
  isOpen,
  onClose,
  insight,
}: Props): React.JSX.Element => {
  const [dataFilter, setDataFilter] = useState<string>("");
  const [insights, setInsights] = useState<Insight[] | undefined>();
  const [selectedParentInsights, setSelectedParentInsights] = useState<
    Insight[]
  >([]);
  const [newInsightName, setNewInsightName] = useState<string>("");
  const [activeTab, setActiveTab] = useState("existing");
  const serverActionContext = useContext(ServerActionContext);

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

  const resetStateValues = useCallback(() => {
    setSelectedParentInsights([]);
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
        .executeAction(doAddParentInsights, {
          childInsight: insight,
          newParentInsights: selectedParentInsights,
          newInsightName,
        })
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
    selectedParentInsights,
    newInsightName,
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

  const tabs = [
    {
      id: "existing",
      label: "Existing insights",
      content: (
        <ModalContentSection>
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
              onChange={(event) => setNewInsightName(event.target.value || "")}
            />
          </FormGroup>
        </ModalContentSection>
      ),
    },
  ];

  return (
    <Modal
      id={id}
      title="Add parent insights"
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
          disabled={!newInsightName && selectedParentInsights.length === 0}
        >
          Submit
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
};

export default AddParentInsightsDialog;
