"use client";

import React, { useCallback, useEffect, useState } from "react";

import { Fact, Insight, InsightEvidence, ServerFunction } from "../types";
import FactsTable from "./FactsTable";
import { getDisabledInsightIds } from "../functions";
import { doAddCitationsToOtherInsightsSchema } from "../insights/[uid]/functions";
import { GetLinksResponse } from "../api/links/route";

const AddCitationsToOtherInsightsDialog = ({
  id,
  selectedCitations: selectedCitationsInput,
  setServerFunctionInput,
  setActiveServerFunction,
}: {
  id: string;
  selectedCitations: InsightEvidence[];
  setServerFunctionInput: React.Dispatch<
    React.SetStateAction<doAddCitationsToOtherInsightsSchema | undefined>
  >;
  setActiveServerFunction: React.Dispatch<
    | { function: ServerFunction<doAddCitationsToOtherInsightsSchema> }
    | undefined
  >;
}): React.JSX.Element => {
  // TODO: put common dialog functions into an HOC or shared functions.js file
  // TODO: consider changing output to use returnValue directly: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog

  const [selectedInsights, setSelectedInsights] = useState([]);
  const [dataFilter, setDataFilter] = useState("");
  const [citationsToRemove, setCitationsToRemove] = useState([]);
  const [newInsightName, setNewInsightName] = useState("");
  const [newInsightIsCategory, setNewInsightIsCategory] = useState(false);
  const [potentialInsights, setPotentialInsights] = useState<Insight[]>();
  const [citationsToRemoveDataFilter, setCitationsToRemoveDataFilter] =
    useState("");
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
  };

  const resetAndCloseDialog = useCallback(() => {
    resetStateValues();
    // don't use `dialog` bc a call to this function below is before it is set
    (document.getElementById(id) as HTMLDialogElement).close();
  }, [id]);

  const cancelDialog = useCallback(() => {
    setServerFunctionInput(undefined);
    setActiveServerFunction(undefined);
    resetAndCloseDialog();
  }, [resetAndCloseDialog, setActiveServerFunction, setServerFunctionInput]);

  useEffect(() => {
    const d = document.getElementById(id);
    if (d) {
      d.addEventListener("click", (event) => {
        if (event.target == event.currentTarget) {
          cancelDialog();
        }
      });
      d.addEventListener("keydown", (event) => {
        if (event.key == "Escape") {
          cancelDialog();
        }
      });
    } else {
      throw new Error(`Dialog not found with id: ${id}`);
    }
  }, [cancelDialog, id]);

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
    <dialog
      id={id}
      style={{
        width: "80%",
        height: "80%",
      }}
      onClose={() => {
        resetStateValues();
      }}
    >
      <h2>Add citations to other insights</h2>
      <h4>First: select citations to remove from this insight:</h4>
      <div style={{ padding: "5px" }}>
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
            setCitationsToRemove as React.Dispatch<React.SetStateAction<Fact[]>>
          }
          selectRows={true}
          hideHead={true}
          dataFilter={citationsToRemoveDataFilter}
          setDataFilter={setCitationsToRemoveDataFilter}
          queryFunction={snippetQueryFunction}
        />
      </div>
      <div style={{ display: "flex" }}>
        <div style={{ flex: "50%", padding: "5px" }}>
          <h4>Then: select other insights to add them to</h4>
          <div id="factsTable" style={{ marginBottom: "40px" }}>
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
                    <span className="badge text-bg-danger">
                      {insight.evidence?.length || 0}
                    </span>
                  ),
                },
              ]}
            />
          </div>
        </div>
        <div style={{ flex: "50%", padding: "5px" }}>
          <h4>Or: create a new insight to contain them</h4>
          <input
            type="text"
            placeholder="New insight name"
            value={newInsightName}
            onChange={(event) => {
              setNewInsightName(event.target.value);
            }}
          />{" "}
          <input
            type="checkbox"
            checked={newInsightIsCategory}
            onChange={(event) => {
              // TODO: make categories a special type of insight, not just a prefix
              // -- then put them in their own section in this dialog (and other FactTable usages?)
              setNewInsightIsCategory(event.target.checked);
              if (event.target.checked) {
                setNewInsightName(`Category: ${newInsightName}`);
              } else {
                setNewInsightName(newInsightName.slice(10));
              }
            }}
          />{" "}
          Category
        </div>
      </div>
      <div
        id="dialogFooter"
        className="sticky bottom right"
        style={{
          display: "inline",
        }}
      >
        <button
          className="btn btn-danger"
          onClick={() => {
            cancelDialog();
          }}
        >
          Cancel
        </button>
        &nbsp;
        <button
          className="btn btn-primary"
          aria-label="Submit Dialog"
          onClick={() => {
            setServerFunctionInput({
              selectedCitations,
              citationsToRemove,
              selectedInsights: [...selectedInsights],
              newInsightName,
            });
            resetAndCloseDialog();
          }}
          disabled={selectedInsights.length == 0 && !newInsightName}
        >
          Submit
        </button>
      </div>
    </dialog>
  );
};

export default AddCitationsToOtherInsightsDialog;
