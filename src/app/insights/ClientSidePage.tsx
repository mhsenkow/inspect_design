"use client";

import styles from "../../styles/components/main-insights-page.module.css";
import cardStyles from "../../styles/components/card.module.css";
import React, { useState, useEffect } from "react";
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
  const [dataFilter, setDataFilter] = useState<string>("");

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

  // Handle server function execution when FactsListView is not mounted (empty state)
  useEffect(() => {
    if (
      liveData.length === 0 &&
      serverFunctionInputForInsightsList &&
      activeServerFunctionForInsightsList &&
      token
    ) {
      // Check if it's an InsightsAPISchema (has 'insights' property)
      if ("insights" in serverFunctionInputForInsightsList) {
        activeServerFunctionForInsightsList
          .function(
            serverFunctionInputForInsightsList as InsightsAPISchema,
            token,
          )
          .then((response: FLVResponse | FLVResponse[] | void) => {
            if (Array.isArray(response)) {
              const newInsights = response.flatMap((r) => r.facts as Insight[]);
              setLiveData([...liveData, ...newInsights]);
            } else if (response) {
              setLiveData([...liveData, ...(response.facts as Insight[])]);
            }
          });
        setServerFunctionInputForInsightsList(undefined);
        setActiveServerFunctionForInsightsList(undefined);
      }
    }
  }, [
    liveData,
    serverFunctionInputForInsightsList,
    activeServerFunctionForInsightsList,
    token,
  ]);

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
            <div
              style={{
                display: "flex",
                gap: "var(--spacing-2)",
                alignItems: "center",
                flex: 1,
                justifyContent: "flex-end",
              }}
            >
              {/* Search Input */}
              <div
                className="search-container"
                style={{
                  position: "relative",
                  flex: 1,
                  marginLeft: "var(--spacing-4)",
                }}
              >
                <input
                  type="text"
                  placeholder="Search insights..."
                  value={dataFilter}
                  onChange={(e) => setDataFilter(e.target.value)}
                  className="search-input"
                  style={{
                    backgroundColor: "var(--color-background-primary)",
                    borderColor: "var(--color-border-primary)",
                    color: "var(--color-text-primary)",
                    padding: "var(--spacing-2) var(--spacing-3)",
                    border: "1px solid var(--color-border-primary)",
                    borderRadius: "var(--radius-lg)",
                    fontSize: "var(--font-size-sm)",
                    width: "100%",
                  }}
                />
                {dataFilter && (
                  <button
                    type="button"
                    onClick={() => setDataFilter("")}
                    className="search-clear"
                    style={{
                      position: "absolute",
                      right: "var(--spacing-2)",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--color-text-tertiary)",
                    }}
                    aria-label="Clear search"
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              {loggedIn && (
                <>
                  <button
                    onClick={promptForNewInsightName}
                    className={cardStyles.addButton}
                    aria-label="Create New Insight"
                    title="Create New Insight"
                  >
                    <span className={cardStyles.addButtonIcon}>+</span>
                    <span className={cardStyles.addButtonText}>
                      New Insight
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
                </>
              )}
            </div>
          </div>

          {/* Flat Insights List Section */}
          <div className="flatInsightsList">
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
                    `offset=${offset}&limit=${LIMIT}&parents=true&children=true&evidence=true&comments=true`,
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
                {liveData.length > 0 ? (
                  <FactsListView
                    factName="insight"
                    serverFunctionInput={serverFunctionInputForInsightsList}
                    setServerFunctionInput={
                      setServerFunctionInputForInsightsList
                    }
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
                    enableReactionIcons={false}
                    dataFilter={dataFilter}
                    setDataFilter={setDataFilter}
                    columns={[
                      {
                        name: "Updated",
                        dataColumn: "updated_at",
                        display: (insight: Fact | Insight) => {
                          const dateStr = insight.updated_at
                            ? new Date(insight.updated_at).toLocaleDateString(
                                "en-US",
                                {
                                  month: "2-digit",
                                  day: "2-digit",
                                  year: "numeric",
                                },
                              )
                            : "---";
                          return (
                            <span className="text-sm text-secondary font-mono">
                              {dateStr}
                            </span>
                          );
                        },
                      },
                      {
                        name: "Title",
                        dataColumn: "title",
                        display: (insight: Fact | Insight) => {
                          return (
                            <Link
                              href={`/insights/${insight.uid}`}
                              className="text-primary hover:text-primary-600 transition-colors duration-200 text-left"
                            >
                              {insight.title}
                            </Link>
                          );
                        },
                      },
                      {
                        name: "🌍",
                        dataColumn: "is_public",
                        display: (insight: Fact | Insight) => {
                          const isPublished = (insight as Insight).is_public;
                          return (
                            <span
                              className={`icon-small ${isPublished ? "text-success" : "text-muted"}`}
                              title={
                                isPublished
                                  ? "Published (Global)"
                                  : "Not Published"
                              }
                            >
                              {isPublished ? "🌍" : "📝"}
                            </span>
                          );
                        },
                      },
                      {
                        name: "👨‍👩‍👧‍👦",
                        dataColumn: "parents",
                        display: (insight: Fact | Insight) => {
                          const count = insight.parents?.length || 0;
                          return (
                            <span
                              className="icon-small"
                              title={`${count} parent insights`}
                            >
                              👨‍👩‍👧‍👦<span className="icon-count">{count}</span>
                            </span>
                          );
                        },
                      },
                      {
                        name: "👶",
                        dataColumn: "children",
                        display: (insight: Fact | Insight) => {
                          const count = insight.children?.length || 0;
                          return (
                            <span
                              className="icon-small"
                              title={`${count} child insights`}
                            >
                              👶<span className="icon-count">{count}</span>
                            </span>
                          );
                        },
                      },
                      {
                        name: "📄",
                        dataColumn: "evidence",
                        display: (insight: Fact | Insight) => {
                          const count = insight.evidence?.length || 0;
                          return (
                            <span
                              className="icon-small"
                              title={`${count} evidence items`}
                            >
                              📄<span className="icon-count">{count}</span>
                            </span>
                          );
                        },
                      },
                      {
                        name: "💬",
                        dataColumn: "comments",
                        display: (insight: Fact | Insight) => {
                          const count = insight.comments?.length || 0;
                          return (
                            <span
                              className="icon-small"
                              title={`${count} comments`}
                            >
                              💬<span className="icon-count">{count}</span>
                            </span>
                          );
                        },
                      },
                      {
                        name: "❤️",
                        dataColumn: "reactions",
                        display: (insight: Fact | Insight) => {
                          // Show reactions from insight, comments, and evidence
                          const reactionCounts: { [key: string]: number } = {};

                          // Add reactions from the insight itself
                          if (insight.reactions) {
                            insight.reactions.forEach((reaction) => {
                              reactionCounts[reaction.reaction] =
                                (reactionCounts[reaction.reaction] || 0) + 1;
                            });
                          }

                          // Add reactions from comments
                          if (insight.comments) {
                            insight.comments.forEach((comment) => {
                              if (comment.reactions) {
                                comment.reactions.forEach((reaction) => {
                                  reactionCounts[reaction.reaction] =
                                    (reactionCounts[reaction.reaction] || 0) +
                                    1;
                                });
                              }
                            });
                          }

                          // Add reactions from evidence/summaries
                          if (insight.evidence) {
                            insight.evidence.forEach((evidence) => {
                              const insightEvidence =
                                evidence as InsightEvidence;
                              if (insightEvidence.summary?.reactions) {
                                insightEvidence.summary.reactions.forEach(
                                  (reaction) => {
                                    reactionCounts[reaction.reaction] =
                                      (reactionCounts[reaction.reaction] || 0) +
                                      1;
                                  },
                                );
                              }
                            });
                          }

                          const totalReactions = Object.values(
                            reactionCounts,
                          ).reduce((sum, count) => sum + count, 0);

                          // Create detailed tooltip text for accessibility
                          const tooltipText =
                            totalReactions > 0
                              ? Object.entries(reactionCounts)
                                  .map(
                                    ([emoji, count]) =>
                                      `${emoji}: ${count} reaction${count !== 1 ? "s" : ""}`,
                                  )
                                  .join(", ")
                              : "No reactions";

                          return (
                            <span
                              className="icon-main"
                              title={tooltipText}
                              aria-label={tooltipText}
                            >
                              {totalReactions > 0 ? (
                                Object.entries(reactionCounts).map(
                                  ([reaction, count]) => {
                                    // Helper function to get size class based on count
                                    const getSizeClass = (
                                      count: number,
                                    ): string => {
                                      if (count <= 5) {
                                        return `reaction-size-${count}`;
                                      }
                                      return "reaction-size-5";
                                    };

                                    // Helper function to get dot size class for counts above 5
                                    const getDotSizeClass = (
                                      count: number,
                                    ): string => {
                                      if (count <= 5) return "";
                                      const dotLevel = Math.min(
                                        Math.ceil((count - 5) / 5),
                                        5,
                                      );
                                      return `reaction-dot-size-${dotLevel}`;
                                    };

                                    // Helper function to render dots for counts above 5
                                    const renderDots = (
                                      count: number,
                                    ): React.JSX.Element[] => {
                                      if (count <= 5) return [];

                                      const dots = [];
                                      const dotCount = Math.min(count - 5, 5); // Max 5 dots
                                      const dotSizeClass =
                                        getDotSizeClass(count);

                                      for (let i = 0; i < dotCount; i++) {
                                        dots.push(
                                          <span
                                            key={i}
                                            className={`reaction-dot ${dotSizeClass}`}
                                          />,
                                        );
                                      }

                                      return dots;
                                    };

                                    return (
                                      <span
                                        key={reaction}
                                        className="inline-block mr-1"
                                        title={`${reaction}: ${count} reaction${count !== 1 ? "s" : ""}`}
                                        aria-label={`${reaction}: ${count} reaction${count !== 1 ? "s" : ""}`}
                                      >
                                        <span
                                          className={`reaction-emoji ${getSizeClass(count)}`}
                                        >
                                          {reaction}
                                        </span>
                                        {renderDots(count)}
                                      </span>
                                    );
                                  },
                                )
                              ) : (
                                <span className="text-muted">0</span>
                              )}
                            </span>
                          );
                        },
                      },
                    ]}
                  />
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-content">
                      <div className="empty-state-icon">📝</div>
                      <h3 className="empty-state-title">No insights yet</h3>
                      <p className="empty-state-description">
                        Create your first insight to get started organizing your
                        thoughts and research.
                      </p>
                      {loggedIn && (
                        <button
                          onClick={promptForNewInsightName}
                          className={cardStyles.actionButtonPrimary}
                          style={{
                            fontSize: "var(--font-size-base)",
                            padding: "var(--spacing-3) var(--spacing-6)",
                            marginTop: "var(--spacing-2)",
                          }}
                          aria-label="Create Your First Insight"
                          title="Create Your First Insight"
                        >
                          <span style={{ fontSize: "var(--font-size-lg)" }}>
                            +
                          </span>
                          <span>Create Your First Insight</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
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
