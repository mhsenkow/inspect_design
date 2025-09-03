"use client";

import React, { useCallback, useEffect, useState } from "react";

import { Fact, Insight } from "../../types";
import FactsTable from "../../components/FactsTable";
import { potentialInsightsWithoutLoops } from "./functions";
import { GetInsightsRouteResponse } from "../../api/insights/route";

export type ServerFunctionInputSchemaForChildInsights = {
  insight: Insight;
  children: Insight[];
  newInsightName: string;
};

interface Props {
  id: string;
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
  insight,
  setServerFunctionInput,
  setActiveServerFunction,
}: Props): React.JSX.Element => {
  const [dataFilter, setDataFilter] = useState("");
  const [childInsights, setChildInsights] = useState<Insight[] | undefined>();
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
  const [selectedChildInsights, setSelectedChildInsights] = useState<Insight[]>(
    [],
  );
  const [newInsightName, setNewInsightName] = useState("");

  const resetStateValues = () => {
    setSelectedChildInsights([]);
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

  return (
    <dialog id={id} className="large-dialog">
      <h3>Add Child Insights to Insight: {insight.title}</h3>
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
          >
            New insight
          </button>
        </li>
      </ul>
      <div className="tab-content">
        <div
          className="tab-pane fade show active"
          id="existing-insights"
          role="tabpanel"
          aria-labelledby="existing-insights-tab"
        >
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
                    {/* FIXME: insight.evidence is not defined */}
                    {insight.evidence?.length ?? 0}
                  </span>
                ),
              },
            ]}
          />
        </div>
        <div
          className="tab-pane fade"
          id="new-insight"
          role="tabpanel"
          style={{ padding: "1rem" }}
        >
          <input
            type="text"
            placeholder="New insight name"
            value={newInsightName}
            onChange={(event) => {
              setNewInsightName(event.target.value);
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
          aria-label="Add child insights"
          onClick={async () => {
            setServerFunctionInput({
              insight,
              children: selectedChildInsights,
              newInsightName,
            });
            resetAndCloseDialog();
          }}
          disabled={selectedChildInsights.length == 0 && !newInsightName.trim()}
        >
          Add
        </button>
      </div>
    </dialog>
  );
};

export default AddChildInsightsDialog;
