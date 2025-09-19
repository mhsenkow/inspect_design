"use client";

import styles from "../../styles/components/main-insights-page.module.css";
import cardStyles from "../../styles/components/card.module.css";
import React, { useState } from "react";
import Link from "next/link";

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

  const createLinkAndAddToInsights = async (
    {
      url,
      selectedInsights,
      newInsightName,
    }: {
      url: string;
      selectedInsights: Insight[];
      newInsightName: string;
    },
    token: string,
  ): Promise<FLVResponse[]> => {
    const responses: FLVResponse[] = [];
    if (!token) {
      throw new Error("Authentication token is required");
    }

    try {
      const link = await createLink(url, token);

      if (newInsightName) {
        const response = await createInsightFromCitations(
          newInsightName,
          [{ summary_id: link.id } as InsightEvidence],
          token,
        );
        responses.push(response);
      }

      if (selectedInsights.length > 0) {
        await Promise.all(
          selectedInsights.map(async (insight) => {
            try {
              await addCitationsToInsight(
                {
                  insight,
                  evidence: [{ summary_id: link.id } as InsightEvidence],
                },
                token,
              );
              // FIXME: does not update the insight in prod
              responses.push({ action: 0, facts: [insight] });
            } catch (error) {
              console.error(
                `Failed to add citation to insight ${insight.uid}:`,
                error,
              );
              throw error;
            }
          }),
        );
      }
    } catch (error) {
      console.error("Error in createLinkAndAddToInsights:", error);
      throw error;
    }

    return responses;
  };

  const LIMIT = 20;
  const loggedIn = !!currentUser;
  return (
    <div className={styles.pageContainer}>
      <div className={styles.mainContent}>
        {/* Main Page Card - Single container with rounded corners and shadow */}
        <div className={cardStyles.contentCard}>
          {/* Flat Header Section */}
          <div className="flatHeader">
            <div className="headerInfo">
              <h1 className="headerTitle">My Insights</h1>
              <p className="headerSubtitle">
                {liveData.length > 0
                  ? `${liveData.length} insight${liveData.length !== 1 ? "s" : ""}`
                  : "No insights yet"}
              </p>
            </div>
            {loggedIn && (
              <div style={{ display: "flex", gap: "var(--spacing-2)" }}>
                <button
                  onClick={promptForNewInsightName}
                  className={cardStyles.addButton}
                  aria-label="Create New Insight"
                  title="Create New Insight"
                >
                  <span className={cardStyles.addButtonIcon}>+</span>
                  <span className={cardStyles.addButtonText}>
                    Create New Insight
                  </span>
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
                {selectedInsights.length > 0 && (
                  <button
                    onClick={async () => {
                      if (
                        token &&
                        selectedInsights.length > 0 &&
                        confirm(
                          `Are you sure you want to delete ${selectedInsights.length} insight${
                            selectedInsights.length !== 1 ? "s" : ""
                          }?`,
                        )
                      ) {
                        await deleteInsights(
                          { insights: selectedInsights },
                          token,
                        );
                        // Refresh the page to show updated data
                        window.location.reload();
                      }
                    }}
                    className={`${cardStyles.addButton} ${cardStyles.removeButton}`}
                    aria-label="Delete Selected Insights"
                    title="Delete Selected Insights"
                  >
                    <span className={cardStyles.addButtonIcon}>🗑️</span>
                    <span className={cardStyles.addButtonText}>
                      Delete ({selectedInsights.length})
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Flat Insights List Section */}
          <div className="flatInsightsList">
            <div className="sectionHeader">
              <span className="sectionIcon">📋</span>
              Insights List
            </div>

            <CurrentUserContext.Provider value={currentUser}>
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
                  enableReactionIcons={true}
                  columns={[
                    {
                      name: "Updated",
                      dataColumn: "updated_at",
                      display: (insight: Fact | Insight) => (
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
                      display: (insight: Fact | Insight) => (
                        <Link
                          href={`/insights/${insight.uid}`}
                          className="text-primary hover:text-primary-600 transition-colors duration-200"
                        >
                          {insight.title}
                        </Link>
                      ),
                    },
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
                      name: "👶",
                      dataColumn: "children",
                      display: (insight: Fact | Insight) => (
                        <span className="badge text-bg-info">
                          {insight.children?.length || 0}
                        </span>
                      ),
                    },
                    {
                      name: "👨‍👩‍👧‍👦",
                      dataColumn: "parents",
                      display: (insight: Fact | Insight) => (
                        <span className="badge text-bg-warning">
                          {insight.parents?.length || 0}
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
            </CurrentUserContext.Provider>
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
              if (input && token) {
                console.log("Creating link and adding to insights:", input);
                // When SaveLinkDialog submits, trigger createLinkAndAddToInsights
                createLinkAndAddToInsights(input, token)
                  .then((responses) => {
                    console.log(
                      "Successfully created link and added to insights:",
                      responses,
                    );
                    // Update the live data with the responses
                    responses.forEach((response) => {
                      if (response.action === 1) {
                        setLiveData([
                          ...(response.facts as Insight[]),
                          ...liveData,
                        ]);
                      } else if (response.action === 0) {
                        // Update existing insights
                        const updatedData = liveData.map((insight) => {
                          const updatedInsight = response.facts.find(
                            (f) => f.uid === insight.uid,
                          ) as Insight;
                          return updatedInsight
                            ? { ...insight, ...updatedInsight }
                            : insight;
                        });
                        setLiveData(updatedData);
                      }
                    });
                    // Show success message
                    alert("Link saved successfully!");
                  })
                  .catch((error) => {
                    console.error(
                      "Error creating link and adding to insights:",
                      error,
                    );
                    // Show user-friendly error message
                    alert(
                      `Failed to save link: ${error.message || "Unknown error"}`,
                    );
                  });
              } else {
                console.error("Missing input or token:", {
                  input,
                  token: !!token,
                });
                alert("Authentication required to save links");
              }
            }}
            setActiveServerFunction={() => {}} // Not needed since we handle it above
          ></SaveLinkDialog>
        </div>
      </div>
    </div>
  );
};

export default ClientSidePage;
