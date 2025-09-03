"use client";

import React, { useCallback, useEffect, useState } from "react";

import { Fact, FLVResponse, Insight } from "../../types";
import FactsTable from "../../components/FactsTable";
import {
  doAddParentInsightsSchema,
  potentialInsightsWithoutLoops,
} from "./functions";
import { GetInsightsRouteResponse } from "../../api/insights/route";

interface Props {
  id: string;
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
  insight,
  setServerFunctionInput,
  setActiveServerFunction,
}: Props): React.JSX.Element => {
  const [dataFilter, setDataFilter] = useState("");
  const [insights, setInsights] = useState<Insight[] | undefined>();
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
  const [selectedParentInsights, setSelectedParentInsights] = useState<
    Insight[]
  >([]);
  const [newInsightName, setNewInsightName] = useState("");

  const [existingInsightsPaneClasses, setExistingInsightsPaneClasses] =
    useState("show active");
  const [newInsightPaneClasses, setNewInsightPaneClasses] = useState("");

  const resetStateValues = () => {
    setSelectedParentInsights([]);
    setDataFilter("");
    setNewInsightName("");
  };

  const resetAndCloseDialog = useCallback(() => {
    resetStateValues();
    // don't use `dialog` bc a call to this function below is before it is set
    (document.getElementById(id) as HTMLDialogElement).close();
  }, [id]);

  const cancelDialog = useCallback(() => {
    setServerFunctionInput(undefined);
    setActiveServerFunction(undefined);
    resetStateValues();
    const dialog = document.getElementById(id) as HTMLDialogElement;
    dialog.close();
  }, [id, setActiveServerFunction, setServerFunctionInput]);

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
    <dialog id={id} className="large-dialog">
      <h3>Add Parent Insights to Insight: {insight.title}</h3>
      <ul className="nav nav-tabs">
        <li className="nav-item">
          <button
            className="nav-link active"
            type="button"
            role="tab"
            data-bs-toggle="tab"
            data-bs-target="#existing-insights"
            aria-controls="existing insights"
            aria-selected="true"
            onClick={() => {
              // TODO: pressing this tab does not show its content
              // -- does not set the tab-pane class to 'show active'
              // -- and I did a `diff` with the add child dialog and don't see anything
              // so, for now, manually change the tab here

              // change classes state variables
              setExistingInsightsPaneClasses("show active");
              setNewInsightPaneClasses("");
            }}
          >
            Existing insights
          </button>
        </li>
        <li className="nav-item">
          <button
            className="nav-link"
            type="button"
            role="tab"
            data-bs-toggle="tab"
            data-bs-target="#new-insight"
            aria-controls="new insight"
            aria-selected="false"
            onClick={() => {
              // TODO: pressing this tab does not show its content
              // -- does not set the tab-pane class to 'show active'
              // -- and I did a `diff` with the add child dialog and don't see anything
              // so, for now, manually change the tab here

              // change classes state variables
              setExistingInsightsPaneClasses("");
              setNewInsightPaneClasses("show active");
            }}
          >
            New insight
          </button>
        </li>
      </ul>
      <div className="tab-content">
        <div
          className={`tab-pane fade ${existingInsightsPaneClasses}`}
          id="existing-insights"
          role="tabpanel"
          aria-labelledby="existing-insights-tab"
        >
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
        </div>
        <div
          className={`tab-pane fade ${newInsightPaneClasses}`}
          id="new-insight"
          role="tabpanel"
          style={{ padding: "1rem" }}
        >
          <input
            type="text"
            placeholder="New insight name"
            value={newInsightName}
            onChange={(event) => {
              setNewInsightName(event.target.value || "");
            }}
          />
        </div>
      </div>
      <div className="sticky bottom right">
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
          aria-label="Add parent insights"
          onClick={async () => {
            setServerFunctionInput({
              childInsight: insight,
              newParentInsights: selectedParentInsights,
              newInsightName,
            });
            resetAndCloseDialog();
          }}
          disabled={!newInsightName && selectedParentInsights.length == 0}
        >
          Submit
        </button>
      </div>
    </dialog>
  );
};

export default AddParentInsightsDialog;
