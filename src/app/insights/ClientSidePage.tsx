"use client";

import React, { useState } from "react";

import {
  Fact,
  FLVResponse,
  Insight,
  InsightEvidence,
  ServerFunction,
  User,
} from "../types";
import useUser from "../hooks/useUser";
import InfiniteScrollLoader from "../components/InfiniteScrollLoader";
import FactsListView from "../components/FactsListView";
import SaveLinkDialog, {
  ServerFunctionInputSchemaForSavedLinks,
} from "../components/SaveLinkDialog";
import CurrentUserContext from "../contexts/CurrentUserContext";
import { createLink } from "../hooks/functions";
import {
  createInsights,
  deleteInsights,
  publishInsights,
  InsightsAPISchema,
} from "../components/InsightsAPI";
import {
  addCitationsToInsight,
  createInsightFromCitations,
} from "../components/SelectedCitationsAPI";

export const SAVE_LINK_DIALOG_ID = "saveLinkDialog";

const ClientSidePage = ({
  insights,
  currentUser,
}: {
  insights: Insight[];
  currentUser: User | null;
}): React.JSX.Element => {
  const { token } = useUser();
  const [liveData, setLiveData] = useState(insights);
  const [selectedInsights, setSelectedInsights] = useState<Insight[]>([]);

  const [
    serverFunctionInputForInsightsList,
    setServerFunctionInputForInsightsList,
  ] = useState<InsightsAPISchema | ServerFunctionInputSchemaForSavedLinks>();
  const [
    activeServerFunctionForInsightsList,
    setActiveServerFunctionForInsightsList,
  ] = useState<
    | {
        function: ServerFunction<InsightsAPISchema>;
      }
    | undefined
  >();

  const promptForNewInsightName = () => {
    const title = prompt("New insight:");
    if (title) {
      setServerFunctionInputForInsightsList({
        insights: [{ title, citations: [] }] as unknown as Insight[],
      });
    }
  };

  const showConfirmation = () => {
    if (
      selectedInsights &&
      selectedInsights.length > 0 &&
      confirm("Are you sure?")
    ) {
      setServerFunctionInputForInsightsList({ insights: selectedInsights });
    }
  };

  const createLinkAndAddToInsights = async ({
    url,
    selectedInsights,
    newInsightName,
  }: {
    url: string;
    selectedInsights: Insight[];
    newInsightName: string;
  }): Promise<FLVResponse[]> => {
    const responses: FLVResponse[] = [];
    if (token) {
      const link = await createLink(url, token);
      if (newInsightName) {
        const response = await createInsightFromCitations(
          newInsightName,
          [{ summary_id: link.id } as InsightEvidence],
          token,
        );
        responses.push(response);
      }
      await Promise.all(
        selectedInsights.map(async (insight) => {
          await addCitationsToInsight(
            {
              insight,
              evidence: [{ summary_id: link.id } as InsightEvidence],
            },
            token,
          );
          // FIXME: does not update the insight in prod
          responses.push({ action: 0, facts: [insight] });
        }),
      );
    }
    return responses;
  };

  const LIMIT = 20;
  const loggedIn = !!currentUser;
  return (
    <div className="min-h-screen bg-background-secondary">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
        {/* Page Header - Overall Page Level */}
        <div className="content-card space-main">
          <div className="content-card-header">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-text-primary">
                  My Insights
                </h1>
                <p className="text-text-secondary mt-1">
                  {liveData.length > 0
                    ? `${liveData.length} insight${liveData.length !== 1 ? "s" : ""}`
                    : "No insights yet"}
                </p>
              </div>
            </div>

            {/* Big Actions */}
            {loggedIn && (
              <div className="flex items-center justify-center space-x-4 pt-4 border-t border-border-primary">
                <button
                  className="btn btn-primary"
                  onClick={promptForNewInsightName}
                >
                  Create New Insight
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    (
                      document.getElementById(
                        SAVE_LINK_DIALOG_ID,
                      ) as HTMLDialogElement
                    ).showModal();
                  }}
                >
                  Save Link
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Main Level */}
        <CurrentUserContext.Provider value={currentUser}>
          <div className="content-card space-main">
            <div className="content-card-header">
              <div className="hierarchy-indicator main">Insights List</div>
              <h3 className="section-header main">
                Your insights and research:
              </h3>
              <div className="flex items-center justify-between">
                <p className="text-text-secondary">
                  Manage and organize your insights
                </p>
                {loggedIn && (
                  <div className="flex space-x-2">
                    <button
                      className="btn btn-success"
                      onClick={() => {
                        setServerFunctionInputForInsightsList({
                          insights: selectedInsights,
                        });
                      }}
                      disabled={selectedInsights.length === 0}
                    >
                      Publish Selected
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={showConfirmation}
                      disabled={selectedInsights.length === 0}
                    >
                      Delete Selected
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="content-card-body">
              <InfiniteScrollLoader
                data={liveData}
                setData={
                  setLiveData as React.Dispatch<
                    React.SetStateAction<Fact[] | undefined>
                  >
                }
                limit={LIMIT}
                getDataFunction={async (offset, token) => {
                  const queryParams = new URLSearchParams(
                    `offset=${offset}&limit=${LIMIT}&parents=true&children=true&evidence=true`,
                  );
                  queryParams.sort();
                  const response = await fetch(
                    `/api/insights?${queryParams.toString()}`,
                    {
                      method: "GET",
                      headers: {
                        "Content-Type": "application/json",
                        "x-access-token": token,
                      },
                    },
                  );
                  const json = (await response.json()) as Insight[];
                  return json;
                }}
              >
                {/* FIXME: create selectedActions to /insights table to add parent/children to selected insights  */}
                {/* FIXME: be a landing page for anonymous users with top insights */}
                {/* FIXME: sort by citation count desc by default (here & the route) */}
                <FactsListView
                  factName="insight"
                  serverFunctionInput={serverFunctionInputForInsightsList}
                  setServerFunctionInput={setServerFunctionInputForInsightsList}
                  activeServerFunction={activeServerFunctionForInsightsList}
                  setActiveServerFunction={
                    setActiveServerFunctionForInsightsList
                  }
                  selectedFacts={selectedInsights}
                  setSelectedFacts={
                    setSelectedInsights as React.Dispatch<
                      React.SetStateAction<Fact[]>
                    >
                  }
                  unselectedActions={[]}
                  selectedActions={[]}
                  columns={[
                    {
                      name: "📄",
                      dataColumn: "evidence",
                      display: (insight: Fact | Insight) => (
                        <span className="badge text-bg-danger">
                          {insight.evidence?.length || 0}
                        </span>
                      ),
                    },
                    {
                      name: "🌎",
                      dataColumn: "is_public",
                      display: (insight: Fact | Insight) => (
                        <span>{insight.is_public ? "✅" : ""}</span>
                      ),
                    },
                  ]}
                />
              </InfiniteScrollLoader>
            </div>
          </div>

          {/* Child Level - Dialogs */}
          <SaveLinkDialog
            id={SAVE_LINK_DIALOG_ID}
            potentialInsightsFromServer={liveData.filter(
              (insight) => insight.user_id == currentUser?.id,
            )}
            setServerFunctionInput={setServerFunctionInputForInsightsList}
            setActiveServerFunction={setActiveServerFunctionForInsightsList}
          />
        </CurrentUserContext.Provider>
      </div>
    </div>
  );
};

export default ClientSidePage;
