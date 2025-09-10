"use client";

import styles from "../../styles/components/main-insights-page.module.css";
import cardStyles from "../../styles/components/card.module.css";
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
  const [isSaveLinkDialogOpen, setIsSaveLinkDialogOpen] = useState(false);

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
      setActiveServerFunctionForInsightsList({
        function: async (input: InsightsAPISchema, token: string) => {
          if (token) {
            return createInsights(input, token);
          }
          return Promise.resolve([]);
        },
      });
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
    <div className={styles.pageContainer}>
      <div className={styles.mainContent}>
        {/* Page Header - Overall Page Level */}
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderContent}>
            <div className={styles.headerTop}>
              <div className={styles.headerInfo}>
                <h1 className={styles.headerTitle}>
                  My Insights
                </h1>
                <p className={styles.headerSubtitle}>
                  {liveData.length > 0
                    ? `${liveData.length} insight${liveData.length !== 1 ? "s" : ""}`
                    : "No insights yet"}
                </p>
              </div>
              {loggedIn && (
                <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                  <button
                    onClick={promptForNewInsightName}
                    className={cardStyles.addButton}
                    aria-label="Create New Insight"
                    title="Create New Insight"
                  >
                    <span className={cardStyles.addButtonIcon}>+</span>
                    <span className={cardStyles.addButtonText}>Create New Insight</span>
                  </button>
                  <button
                    onClick={() => setIsSaveLinkDialogOpen(true)}
                    className={cardStyles.addButton}
                    aria-label="Save Link"
                    title="Save Link"
                  >
                    <span className={cardStyles.addButtonIcon}>🔗</span>
                    <span className={cardStyles.addButtonText}>Save Link</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content - Main Level */}
        <CurrentUserContext.Provider value={currentUser}>
          <div className={cardStyles.contentCard}>
            <div className={cardStyles.contentCardHeader}>
              <div className={cardStyles.hierarchyIndicator}>
                <span className={cardStyles.hierarchyIcon}>📋</span>
                Insights List
              </div>
              <div className={cardStyles.sectionHeader}>
                <h3 className={cardStyles.sectionTitle}>
                  Your insights and research:
                </h3>
                {loggedIn && (
                  <div className={cardStyles.sectionActions}>
                    {selectedInsights.length === 0 ? (
                      <>
                        <button
                          onClick={promptForNewInsightName}
                          className={cardStyles.addButton}
                          aria-label="Create New Insight"
                          title="Create New Insight"
                        >
                          <span className={cardStyles.addButtonIcon}>+</span>
                          <span className={cardStyles.addButtonText}>Create</span>
                        </button>
                        <button
                          onClick={() => setIsSaveLinkDialogOpen(true)}
                          className={cardStyles.addButton}
                          aria-label="Save Link"
                          title="Save Link"
                        >
                          <span className={cardStyles.addButtonIcon}>🔗</span>
                          <span className={cardStyles.addButtonText}>Save Link</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setServerFunctionInputForInsightsList({
                              insights: selectedInsights,
                            });
                            setActiveServerFunctionForInsightsList({
                              function: async (input: InsightsAPISchema, token: string) => {
                                if (token) {
                                  return publishInsights(input, token);
                                }
                                return Promise.resolve([]);
                              },
                            });
                          }}
                          className={cardStyles.addButton}
                          aria-label="Publish Selected"
                          title="Publish Selected"
                        >
                          <span className={cardStyles.addButtonIcon}>📢</span>
                          <span className={cardStyles.addButtonText}>Publish</span>
                        </button>
                        <button
                          onClick={() => {
                            if (
                              selectedInsights &&
                              selectedInsights.length > 0 &&
                              confirm("Are you sure?")
                            ) {
                              setServerFunctionInputForInsightsList({ insights: selectedInsights });
                              setActiveServerFunctionForInsightsList({
                                function: async (input: InsightsAPISchema, token: string) => {
                                  if (token) {
                                    return deleteInsights(input, token);
                                  }
                                  return Promise.resolve([]);
                                },
                              });
                            }
                          }}
                          className={cardStyles.addButton}
                          aria-label="Delete Selected"
                          title="Delete Selected"
                        >
                          <span className={cardStyles.addButtonIcon}>🗑️</span>
                          <span className={cardStyles.addButtonText}>Delete</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className={cardStyles.sectionSubtitle}>
                Manage and organize your insights
              </div>
            </div>
            <div className={cardStyles.contentCardBody}>
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
            isOpen={isSaveLinkDialogOpen}
            onClose={() => setIsSaveLinkDialogOpen(false)}
            potentialInsightsFromServer={liveData.filter(
              (insight) => insight.user_id == currentUser?.id,
            )}
            setServerFunctionInput={(input) => {
              if (input) {
                // When SaveLinkDialog submits, trigger createLinkAndAddToInsights
                createLinkAndAddToInsights(input).then((responses) => {
                  // Update the live data with the responses
                  responses.forEach((response) => {
                    if (response.action === 1) {
                      setLiveData([...(response.facts as Insight[]), ...liveData]);
                    } else if (response.action === 0) {
                      // Update existing insights
                      const updatedData = liveData.map(insight => {
                        const updatedInsight = response.facts.find(f => f.uid === insight.uid) as Insight;
                        return updatedInsight ? { ...insight, ...updatedInsight } : insight;
                      });
                      setLiveData(updatedData);
                    }
                  });
                });
              }
            }}
            setActiveServerFunction={() => {}} // Not needed since we handle it above
          />
        </CurrentUserContext.Provider>
      </div>
    </div>
  );
};

export default ClientSidePage;
