"use client";

import styles from "../../../styles/components/client-side-page.module.css";
import cardStyles from "../../../styles/components/card.module.css";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import moment from "moment";
import Link from "next/link";

import {
  Fact,
  FactComment,
  FactReaction,
  Insight,
  InsightEvidence,
  InsightLink,
  ServerFunction,
  User,
} from "../../types";

import FeedbackInputElement from "../../components/FeedbackInputElement";
import ReactionButton from "../../components/ReactionButton";
import { submitComment, submitReaction } from "../../functions";
import FeedbackItem from "../../components/FeedbackItem";
import ReactionIcon from "../../components/ReactionIcon";
import SourceLogo from "../../components/SourceLogo";
import useUser from "../../hooks/useUser";
import EditableTitle from "../../components/EditableTitle";
import AddLinksAsEvidenceDialog from "./AddLinksAsEvidenceDialog";
import InfiniteScrollLoader from "../../components/InfiniteScrollLoader";
import FactsListView from "../../components/FactsListView";
import AddCitationsToOtherInsightsDialog from "../../components/AddCitationsToOtherInsightsDialog";
import CurrentUserContext from "../../contexts/CurrentUserContext";
import AddChildInsightsDialog, {
  ServerFunctionInputSchemaForChildInsights,
} from "./AddChildInsightsDialog";
import FactsDataContext from "../../contexts/FactsDataContext";
import AddParentInsightsDialog from "./AddParentInsightsDialog";
import {
  doAddCitationsToOtherInsights,
  doAddCitationsToOtherInsightsSchema,
  doAddParentInsights,
  doAddParentInsightsSchema,
  doDeleteInsightChildren,
  doDeleteInsightCitations,
  doDeleteInsightCitationsSchema,
  doDeleteParentInsights,
} from "./functions";
import {
  addChildrenToInsight,
  addCitationsToInsight,
  addCitationsToInsightAPISchema,
} from "../../components/SelectedCitationsAPI";
import Comment from "../../components/Comment";
import { deleteInsights, publishInsights } from "../../components/InsightsAPI";

export const ADD_LINKS_AS_EVIDENCE_DIALOG_ID = "addLinksAsEvidenceDialog";
export const ADD_CHILD_INSIGHTS_DIALOG_ID = "addChildInsightsDialog";
export const ADD_CITATIONS_TO_OTHER_INSIGHTS_DIALOG_ID =
  "addCitationsToOtherInsightsDialog";
export const ADD_PARENT_INSIGHTS_DIALOG_ID = "addParentInsightsDialog";

interface Props {
  insightInput: Insight;
  currentUser: User | null;
}

const ClientSidePage = ({
  insightInput,
  currentUser,
}: Props): React.JSX.Element => {
  const { token, loggedIn } = useUser();
  const [isClient, setIsClient] = useState(false);

  const [returnPath, setReturnPath] = useState<string>();
  useEffect(() => {
    setIsClient(true);
    setReturnPath(window.location.pathname);
  }, []);

  const [insight, setInsight] = useState(insightInput);
  const [insightComments, setInsightComments] = useState<FactComment[]>();
  useEffect(() => {
    if (insight.comments) {
      setInsightComments(
        insight.comments.filter(
          (c) => c.insight_id == insight.id && !c.summary_id,
        ),
      );
    }
  }, [insight]);
  const [insightReactions, setInsightReactions] = useState<FactReaction[]>();
  useEffect(() => {
    if (insight.reactions) {
      setInsightReactions(
        insight.reactions.filter(
          (r) => r.insight_id == insight.id && !r.summary_id,
        ),
      );
    }
  }, [insight, setInsightReactions]);

  const [selectedCitations, setSelectedCitations] = useState(
    [] as InsightEvidence[],
  );
  const [selectedParentInsights, setSelectedParentInsights] = useState<
    InsightLink[]
  >([]);
  const [selectedChildInsights, setSelectedChildInsights] = useState<
    InsightLink[]
  >([]);
  const [liveSnippetData, setLiveSnippetData] = useState<InsightEvidence[]>([]);
  useEffect(() => {
    if (insight.evidence) {
      setLiveSnippetData(
        insight.evidence.map((e: InsightEvidence) => ({
          ...e,
          summary_id: e.summary_id!,
          summary: e.summary,
          updated_at: e.summary.updated_at,
          title: e.summary.title,
          uid: e.summary.uid,
          comments: e.comments ?? e.summary.comments,
          reactions: e.reactions ?? e.summary.reactions,
          source_baseurl: e.summary.source.baseurl,
          logo_uri: e.summary.source.logo_uri,
        })),
      );
    }
  }, [insight.evidence]);
  const [isEditingComment, setIsEditingComment] = useState(false);

  // Modal states
  const [isAddLinksAsEvidenceDialogOpen, setIsAddLinksAsEvidenceDialogOpen] =
    useState(false);
  const [
    isAddCitationsToOtherInsightsDialogOpen,
    setIsAddCitationsToOtherInsightsDialogOpen,
  ] = useState(false);
  const [isAddChildInsightsDialogOpen, setIsAddChildInsightsDialogOpen] =
    useState(false);
  const [isAddParentInsightsDialogOpen, setIsAddParentInsightsDialogOpen] =
    useState(false);

  // shared functions for child insights
  const [
    serverFunctionInputForChildInsights,
    setServerFunctionInputForChildInsights,
  ] = useState<ServerFunctionInputSchemaForChildInsights | InsightLink[]>();
  const [
    activeServerFunctionForChildInsights,
    setActiveServerFunctionForChildInsights,
  ] = useState<
    | { function: ServerFunction<ServerFunctionInputSchemaForChildInsights> }
    | { function: ServerFunction<InsightLink[]> }
    | undefined
  >();

  // shared functions for snippets
  const [serverFunctionInputForSnippets, setServerFunctionInputForSnippets] =
    useState<
      | addCitationsToInsightAPISchema
      | doAddCitationsToOtherInsightsSchema
      | doDeleteInsightCitationsSchema
    >();
  const [activeServerFunctionForSnippets, setActiveServerFunctionForSnippets] =
    useState<
      | {
          function: ServerFunction<addCitationsToInsightAPISchema>;
        }
      | {
          function: ServerFunction<doAddCitationsToOtherInsightsSchema>;
        }
      | {
          function: ServerFunction<doDeleteInsightCitationsSchema>;
        }
      | undefined
    >();

  // shared functions for parent insights
  const [
    serverFunctionInputForParentInsights,
    setServerFunctionInputForParentInsights,
  ] = useState<doAddParentInsightsSchema | InsightLink[]>();
  const [
    activeServerFunctionForParentInsights,
    setActiveServerFunctionForParentInsights,
  ] = useState<
    | { function: ServerFunction<doAddParentInsightsSchema> }
    | { function: ServerFunction<InsightLink[]> }
    | undefined
  >();

  const createdOrUpdated = useMemo(() => {
    if (insight) {
      if (insight.created_at == insight.updated_at) {
        return `Created ${moment(insight.created_at).fromNow()}`;
      }
      // FIXME: show the time between created and updated?
      return `Updated ${moment(insight.updated_at).fromNow()}`;
    }
    return "";
  }, [insight]);

  const confirmAndRegister = useCallback(() => {
    if (
      confirm("This action requires a logged-in user. Go to the register page?")
    ) {
      window.location.href = `/register?return=${returnPath}`;
    }
  }, [returnPath]);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.mainContent}>
        <CurrentUserContext.Provider value={currentUser}>
          {/* Single Paper Container */}
          <div className={`${cardStyles.card} insight-page-card`}>
            {/* Parent Insights Section */}
            {(isClient
              ? loggedIn || insight.parents.length > 0
              : insight.parents.length > 0) && (
              <div
                className={cardStyles.cardBody}
                style={{ borderTop: "1px solid var(--color-border-primary)" }}
              >
                <div className={cardStyles.contentCardHeader}>
                  <div className={cardStyles.hierarchyIndicator}>
                    <span className={cardStyles.hierarchyIcon}>⬆️</span>
                    Parent Insights
                  </div>
                  <div className={cardStyles.sectionHeader}>
                    <h3 className={cardStyles.sectionTitle}>
                      This insight is important because:
                    </h3>
                    {isClient && currentUser?.id == insight.user_id && (
                      <div className={cardStyles.sectionActions}>
                        <button
                          onClick={() => {
                            setIsAddParentInsightsDialogOpen(true);
                            // Set the active server function so it gets called when the dialog submits
                            setActiveServerFunctionForParentInsights({
                              function: async ({
                                childInsight,
                                newParentInsights,
                                newInsightName,
                              }: doAddParentInsightsSchema) => {
                                if (token) {
                                  return doAddParentInsights(
                                    {
                                      childInsight,
                                      newParentInsights,
                                      newInsightName,
                                    },
                                    token,
                                  );
                                }
                                return Promise.resolve([]);
                              },
                            });
                          }}
                          className={cardStyles.addButton}
                          aria-label="Add Parent Insight"
                          title="Add Parent Insight"
                        >
                          <span className={cardStyles.addButtonIcon}>+</span>
                          <span className={cardStyles.addButtonText}>Add</span>
                        </button>
                        {selectedParentInsights.length > 0 && (
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  "Are you sure you want to remove these parent relationships?",
                                )
                              ) {
                                setServerFunctionInputForParentInsights(
                                  selectedParentInsights,
                                );
                                setActiveServerFunctionForParentInsights({
                                  function: async (
                                    parentLinksToDelete: InsightLink[],
                                    token: string,
                                  ) => {
                                    if (token) {
                                      return doDeleteParentInsights(
                                        parentLinksToDelete,
                                        token,
                                      );
                                    }
                                    return Promise.resolve();
                                  },
                                });
                              }
                            }}
                            className={`${cardStyles.addButton} ${cardStyles.removeButton}`}
                            aria-label="Remove Selected Parent Insights"
                            title="Remove Selected Parent Insights"
                          >
                            <span className={cardStyles.addButtonIcon}>🗑️</span>
                            <span className={cardStyles.addButtonText}>
                              Remove
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className={cardStyles.sectionSubtitle}>
                    {insight.parents.length > 0
                      ? `${insight.parents.length} parent insight${insight.parents.length !== 1 ? "s" : ""}`
                      : "No parent insights yet"}
                  </div>
                </div>
                <div className={`${cardStyles.contentCardBody} ${cardStyles.contentCardBodyFlushTop}`}>
                  <FactsDataContext.Provider
                    value={{
                      data:
                        insight.parents.map((p) => ({
                          ...p.parentInsight,
                          ...p,
                        })) ?? [],
                      setData: (setStateActionOrFacts) => {
                        if (typeof setStateActionOrFacts == "function") {
                          setInsight({
                            ...insight,
                            parents: setStateActionOrFacts(
                              insight.parents,
                            ) as InsightLink[],
                          });
                        } else {
                          setInsight({
                            ...insight,
                            parents: setStateActionOrFacts as InsightLink[],
                          });
                        }
                      },
                    }}
                  >
                    <FactsListView
                      factName="parentInsights"
                      serverFunctionInput={serverFunctionInputForParentInsights}
                      setServerFunctionInput={
                        setServerFunctionInputForParentInsights
                      }
                      activeServerFunction={
                        activeServerFunctionForParentInsights
                      }
                      setActiveServerFunction={
                        setActiveServerFunctionForParentInsights
                      }
                      selectedFacts={selectedParentInsights}
                      setSelectedFacts={
                        setSelectedParentInsights as React.Dispatch<
                          React.SetStateAction<Fact[]>
                        >
                      }
                      selectedActions={[]}
                      enableReactionIcons={false}
                      columns={[
                        {
                          name: "Updated",
                          dataColumn: "updated_at",
                          display: (insight: Fact): React.JSX.Element => (
                            <span className="text-sm text-secondary font-mono">
                              {insight.updated_at
                                ? new Date(insight.updated_at).toLocaleDateString("en-US", {
                                    month: "2-digit",
                                    day: "2-digit",
                                    year: "numeric",
                                  })
                                : "---"}
                            </span>
                          ),
                        },
                        {
                          name: "Title",
                          dataColumn: "title",
                          display: (insight: Fact): React.JSX.Element => {
                            // Handle different data structures for links
                            let titleToShow = insight.title;
                            let uidToUse = insight.uid;

                            if ((insight as any).childInsight?.title && (insight as any).childInsight?.uid) {
                              titleToShow = (insight as any).childInsight.title;
                              uidToUse = (insight as any).childInsight.uid;
                            } else if ((insight as any).parentInsight?.title && (insight as any).parentInsight?.uid) {
                              titleToShow = (insight as any).parentInsight.title;
                              uidToUse = (insight as any).parentInsight.uid;
                            } else if ((insight as any).snippet?.title && (insight as any).snippet?.uid) {
                              titleToShow = (insight as any).snippet.title;
                              uidToUse = (insight as any).snippet.uid;
                            }

                            if (titleToShow && uidToUse) {
                              return (
                                <Link
                                  href={`/insights/${uidToUse}`}
                                  className="text-sm text-primary font-medium hover:text-primary-600 transition-colors duration-200"
                                >
                                  {titleToShow || "Untitled"}
                                </Link>
                              );
                            }

                            return (
                              <span className="text-sm text-primary font-medium">
                                {titleToShow || "Untitled"}
                              </span>
                            );
                          },
                        },
                      ]}
                    />
                  </FactsDataContext.Provider>
                </div>
              </div>
            )}

            {/* Paper Header */}
            <div className="insight-header-container">
              <div
                className={cardStyles.cardHeader}
                style={{ paddingRight: 0 }}
              >
                <div className={styles.headerTop}>
                  <div className={styles.headerLeft}>
                    <div className={styles.sourceLogoContainer}>
                      <SourceLogo fact={insight} />
                    </div>
                    <div className={styles.headerInfo}>
                      <EditableTitle
                        insight={insight}
                        apiRoot="/api/insights"
                      />
                      <div className={styles.headerSubtitle}>
                        {createdOrUpdated}
                      </div>
                    </div>
                  </div>
                  <div className={styles.headerRight}>
                    <ReactionIcon
                      reactions={insightReactions || []}
                      currentUserId={currentUser?.id}
                      onReactionSubmit={async (reaction) => {
                        if (token) {
                          const result = await submitReaction(
                            { reaction, insight_id: insight.id },
                            token,
                          );
                          if (result) {
                            // Remove any existing reaction from this user for this insight
                            const existingReactions =
                              insight.reactions?.filter(
                                (r) => r.user_id !== currentUser?.id,
                              ) || [];
                            setInsight({
                              ...insight,
                              reactions: [
                                ...existingReactions,
                                result as FactReaction,
                              ],
                            });
                          }
                        }
                      }}
                      className="header-item-reaction-icon reaction-icon-solid"
                    />
                    <div className="insights-icon-stack">
                      {/* Parent insights count */}
                      {(insight.parents?.length || 0) > 0 && (
                        <span className="icon-small" title={`${insight.parents?.length || 0} parent insights`}>
                          👨‍👩‍👧‍👦<span className="icon-count">{insight.parents?.length || 0}</span>
                        </span>
                      )}
                      {/* Aggregated reactions */}
                      {(() => {
                        const reactionCounts: { [key: string]: number } = {};
                        
                        // Add reactions from the insight itself
                        if (insight.reactions) {
                          insight.reactions.forEach(reaction => {
                            reactionCounts[reaction.reaction] = (reactionCounts[reaction.reaction] || 0) + 1;
                          });
                        }
                        
                        // Add reactions from parent insights
                        if (insight.parents) {
                          insight.parents.forEach(parentLink => {
                            if (parentLink.parentInsight?.reactions) {
                              parentLink.parentInsight.reactions.forEach(reaction => {
                                reactionCounts[reaction.reaction] = (reactionCounts[reaction.reaction] || 0) + 1;
                              });
                            }
                          });
                        }
                        
                        // Add reactions from child insights
                        if (insight.children) {
                          insight.children.forEach(childLink => {
                            if (childLink.childInsight?.reactions) {
                              childLink.childInsight.reactions.forEach(reaction => {
                                reactionCounts[reaction.reaction] = (reactionCounts[reaction.reaction] || 0) + 1;
                              });
                            }
                          });
                        }
                        
                        // Add reactions from evidence
                        if (insight.evidence) {
                          insight.evidence.forEach(evidence => {
                            if (evidence.summary?.reactions) {
                              evidence.summary.reactions.forEach(reaction => {
                                reactionCounts[reaction.reaction] = (reactionCounts[reaction.reaction] || 0) + 1;
                              });
                            }
                          });
                        }
                        
                        return Object.keys(reactionCounts).length > 0 ? (
                          <span className="icon-main" title="All reactions from parents, children, evidence, and this insight">
                            {Object.entries(reactionCounts).map(([reaction, count]) => (
                              <span key={reaction} className="inline-block mr-1">
                                {reaction}{count > 1 ? count : ''}
                              </span>
                            ))}
                          </span>
                        ) : null;
                      })()}
                      {/* Child insights count */}
                      {(insight.children?.length || 0) > 0 && (
                        <span className="icon-small" title={`${insight.children?.length || 0} child insights`}>
                          👶<span className="icon-count">{insight.children?.length || 0}</span>
                        </span>
                      )}
                      {/* Evidence count */}
                      {(liveSnippetData.length || 0) > 0 && (
                        <span className="icon-small" title={`${liveSnippetData.length || 0} evidence items`}>
                          📄<span className="icon-count">{liveSnippetData.length || 0}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Half on/Half off Bottom Edge */}
              {isClient && currentUser && insight.user_id == currentUser.id && (
                <div className="insight-header-actions">
                  {!insight.is_public && (
                    <button
                      className="insight-action-button insight-action-button-publish"
                      aria-label="Publish Insight"
                      title="Publish Insight"
                      onClick={async () => {
                        if (token && confirm("Are you sure?")) {
                          await publishInsights({ insights: [insight] }, token);
                          setInsight({ ...insight, is_public: true });
                        }
                      }}
                    >
                      <span className="insight-action-icon">🌎</span>
                      <span className="insight-action-label">Publish</span>
                    </button>
                  )}
                  <button
                    className="insight-action-button insight-action-button-delete"
                    aria-label="Delete Insight"
                    title="Delete Insight"
                    onClick={async () => {
                      if (token && confirm("Are you sure?")) {
                        await deleteInsights({ insights: [insight] }, token);
                        window.location.href = "/";
                      }
                    }}
                  >
                    <span className="insight-action-icon">🗑️</span>
                    <span className="insight-action-label">Delete</span>
                  </button>
                </div>
              )}
            </div>

            {/* Child Insights Section */}
            <div
              className={cardStyles.cardBody}
              style={{ borderTop: "1px solid var(--color-border-primary)" }}
            >
              <div className={cardStyles.contentCardHeader}>
                <div className={cardStyles.hierarchyIndicator}>
                  <span className={cardStyles.hierarchyIcon}>📋</span>
                  Child Insights
                </div>
                <div className={cardStyles.sectionHeader}>
                  <h3 className={cardStyles.sectionTitle}>
                    Insights that build upon this one:
                  </h3>
                  {isClient && currentUser?.id == insight.user_id && (
                    <div className={cardStyles.sectionActions}>
                      <button
                        onClick={() => {
                          setIsAddChildInsightsDialogOpen(true);
                          // Set the active server function so it gets called when the dialog submits
                          setActiveServerFunctionForChildInsights({
                            function: async ({
                              insight,
                              children,
                              newInsightName,
                            }: ServerFunctionInputSchemaForChildInsights) => {
                              if (token) {
                                addChildrenToInsight(
                                  {
                                    parentInsight: insight,
                                    children,
                                    newChildInsightName: newInsightName,
                                  },
                                  token,
                                ).then((flvResponse) => {
                                  if (
                                    flvResponse.facts &&
                                    flvResponse.facts.length > 0
                                  ) {
                                    const newChildren =
                                      flvResponse.facts as InsightLink[];
                                    setInsight({
                                      ...insight,
                                      children: [
                                        ...newChildren,
                                        ...(insight.children ?? []),
                                      ],
                                    });
                                  }
                                  setServerFunctionInputForChildInsights(
                                    undefined,
                                  );
                                });
                              }
                              return Promise.resolve([]);
                            },
                          });
                        }}
                        className={cardStyles.addButton}
                        aria-label="Add Child Insight"
                        title="Add Child Insight"
                      >
                        <span className={cardStyles.addButtonIcon}>+</span>
                        <span className={cardStyles.addButtonText}>Add</span>
                      </button>
                      {selectedChildInsights.length > 0 && (
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                "Are you sure you want to remove these child relationships?",
                              )
                            ) {
                              setServerFunctionInputForChildInsights(
                                selectedChildInsights,
                              );
                              setActiveServerFunctionForChildInsights({
                                function: async (
                                  childLinksToDelete: InsightLink[],
                                  token: string,
                                ) => {
                                  if (token) {
                                    return doDeleteInsightChildren(
                                      childLinksToDelete,
                                      token,
                                    );
                                  }
                                  return Promise.resolve();
                                },
                              });
                            }
                          }}
                          className={`${cardStyles.addButton} ${cardStyles.removeButton}`}
                          aria-label="Remove Selected Child Insights"
                          title="Remove Selected Child Insights"
                        >
                          <span className={cardStyles.addButtonIcon}>🗑️</span>
                          <span className={cardStyles.addButtonText}>
                            Remove
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className={cardStyles.sectionSubtitle}>
                  {insight.children.length > 0
                    ? `${insight.children.length} child insight${insight.children.length !== 1 ? "s" : ""}`
                    : "No child insights yet"}
                </div>
              </div>
              <div className={`${cardStyles.contentCardBody} ${cardStyles.contentCardBodyFlushTop}`}>
                <FactsDataContext.Provider
                  value={{
                    data: insight.children.map((c) => ({
                      ...c.childInsight,
                      ...c,
                    })),
                    setData: (setStateActionOrFacts) => {
                      if (typeof setStateActionOrFacts == "function") {
                        setInsight({
                          ...insight,
                          children: setStateActionOrFacts(
                            insight.children,
                          ) as InsightLink[],
                        });
                      } else {
                        setInsight({
                          ...insight,
                          children: setStateActionOrFacts as InsightLink[],
                        });
                      }
                    },
                  }}
                >
                  <FactsListView
                    factName="childInsights"
                    setServerFunctionInput={
                      setServerFunctionInputForChildInsights
                    }
                    serverFunctionInput={serverFunctionInputForChildInsights}
                    selectedFacts={selectedChildInsights}
                    setSelectedFacts={
                      setSelectedChildInsights as React.Dispatch<
                        React.SetStateAction<Fact[]>
                      >
                    }
                    setActiveServerFunction={
                      setActiveServerFunctionForChildInsights
                    }
                    activeServerFunction={activeServerFunctionForChildInsights}
                    selectedActions={[]}
                    enableReactionIcons={false}
                    columns={[
                      {
                        name: "Updated",
                        dataColumn: "updated_at",
                        display: (insight: Fact): React.JSX.Element => (
                          <span className="text-sm text-secondary font-mono">
                            {insight.updated_at
                              ? new Date(insight.updated_at).toLocaleDateString("en-US", {
                                  month: "2-digit",
                                  day: "2-digit",
                                  year: "numeric",
                                })
                              : "---"}
                          </span>
                        ),
                      },
                      {
                        name: "Title",
                        dataColumn: "title",
                        display: (insight: Fact): React.JSX.Element => {
                          // Handle different data structures for links
                          let titleToShow = insight.title;
                          let uidToUse = insight.uid;

                          if ((insight as any).childInsight?.title && (insight as any).childInsight?.uid) {
                            titleToShow = (insight as any).childInsight.title;
                            uidToUse = (insight as any).childInsight.uid;
                          } else if ((insight as any).parentInsight?.title && (insight as any).parentInsight?.uid) {
                            titleToShow = (insight as any).parentInsight.title;
                            uidToUse = (insight as any).parentInsight.uid;
                          } else if ((insight as any).snippet?.title && (insight as any).snippet?.uid) {
                            titleToShow = (insight as any).snippet.title;
                            uidToUse = (insight as any).snippet.uid;
                          }

                          if (titleToShow && uidToUse) {
                            return (
                              <Link
                                href={`/insights/${uidToUse}`}
                                className="text-sm text-primary font-medium hover:text-primary-600 transition-colors duration-200"
                              >
                                {titleToShow || "Untitled"}
                              </Link>
                            );
                          }

                          return (
                            <span className="text-sm text-primary font-medium">
                              {titleToShow || "Untitled"}
                            </span>
                          );
                        },
                      },
                    ]}
                  />
                </FactsDataContext.Provider>
              </div>
            </div>

            {/* Evidence Section */}
            <div
              className={cardStyles.cardBody}
              style={{ borderTop: "1px solid var(--color-border-primary)" }}
            >
              <div className={cardStyles.contentCardHeader}>
                <div className={cardStyles.hierarchyIndicator}>
                  <span className={cardStyles.hierarchyIcon}>📄</span>
                  Evidence
                </div>
                <div className={cardStyles.sectionHeader}>
                  <h3 className={cardStyles.sectionTitle}>
                    Supporting evidence and citations:
                  </h3>
                  {isClient && currentUser?.id == insight.user_id && (
                    <div className={cardStyles.sectionActions}>
                      <button
                        onClick={() => {
                          setIsAddLinksAsEvidenceDialogOpen(true);
                          // Set the active server function so it gets called when the dialog submits
                          setActiveServerFunctionForSnippets({
                            function: async ({
                              insight,
                              evidence,
                              newLinkUrl,
                            }: addCitationsToInsightAPISchema) => {
                              if (token) {
                                return addCitationsToInsight(
                                  { insight, evidence, newLinkUrl },
                                  token,
                                );
                              }
                              return Promise.resolve();
                            },
                          });
                        }}
                        className={cardStyles.addButton}
                        aria-label="Add Evidence"
                        title="Add Evidence"
                      >
                        <span className={cardStyles.addButtonIcon}>+</span>
                        <span className={cardStyles.addButtonText}>Add</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsAddCitationsToOtherInsightsDialogOpen(true);
                          // Set the active server function so it gets called when the dialog submits
                          setActiveServerFunctionForSnippets({
                            function: async (
                              input: doAddCitationsToOtherInsightsSchema,
                            ) => {
                              if (token) {
                                return doAddCitationsToOtherInsights(
                                  input,
                                  token,
                                );
                              }
                              return Promise.resolve();
                            },
                          });
                        }}
                        className={cardStyles.addButton}
                        aria-label="Move Citations"
                        title="Move Citations"
                      >
                        <span className={cardStyles.addButtonIcon}>🔄</span>
                        <span className={cardStyles.addButtonText}>Move</span>
                      </button>
                      {selectedCitations.length > 0 && (
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                "Are you sure you want to remove these citations?",
                              )
                            ) {
                              setServerFunctionInputForSnippets({
                                citations: selectedCitations,
                              });
                              setActiveServerFunctionForSnippets({
                                function: async (
                                  input: doDeleteInsightCitationsSchema,
                                  token: string,
                                ) => {
                                  if (token) {
                                    return doDeleteInsightCitations(
                                      input,
                                      token,
                                    );
                                  }
                                  return Promise.resolve();
                                },
                              });
                            }
                          }}
                          className={`${cardStyles.addButton} ${cardStyles.removeButton}`}
                          aria-label="Remove Selected Citations"
                          title="Remove Selected Citations"
                        >
                          <span className={cardStyles.addButtonIcon}>🗑️</span>
                          <span className={cardStyles.addButtonText}>
                            Remove
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className={cardStyles.sectionSubtitle}>
                  {liveSnippetData.length > 0
                    ? `${liveSnippetData.length} citation${liveSnippetData.length !== 1 ? "s" : ""}`
                    : "No evidence yet"}
                </div>
              </div>
              <div className={`${cardStyles.contentCardBody} ${cardStyles.contentCardBodyFlushTop}`}>
                <InfiniteScrollLoader
                  data={liveSnippetData}
                  setData={
                    setLiveSnippetData as React.Dispatch<
                      React.SetStateAction<Fact[] | undefined>
                    >
                  }
                  limit={20}
                  getDataFunctionParams={{ insightUid: insight.uid ?? "" }}
                  getDataFunction={async (
                    offset,
                    token,
                    getDataFunctionParams,
                  ) => {
                    if (getDataFunctionParams) {
                      const response = await fetch(
                        `/api/insights/${getDataFunctionParams.insightUid}?offset=${offset}`,
                        {
                          method: "GET",
                          headers: {
                            "Content-Type": "application/json",
                            "x-access-token": token,
                          },
                        },
                      );
                      const json = (await response.json()) as Insight;
                      return await json.citations;
                    }
                    return Promise.resolve([]);
                  }}
                >
                  <FactsListView
                    factName="snippet"
                    serverFunctionInput={serverFunctionInputForSnippets}
                    setServerFunctionInput={setServerFunctionInputForSnippets}
                    activeServerFunction={activeServerFunctionForSnippets}
                    setActiveServerFunction={setActiveServerFunctionForSnippets}
                    selectedFacts={selectedCitations}
                    setSelectedFacts={
                      setSelectedCitations as React.Dispatch<
                        React.SetStateAction<Fact[]>
                      >
                    }
                    selectedActions={[]}
                    enableReactionIcons={false}
                    columns={[
                      {
                        name: "Updated",
                        dataColumn: "updated_at",
                        display: (citation: Fact): React.JSX.Element => (
                          <span className="text-sm text-secondary font-mono">
                            {citation.updated_at
                              ? new Date(citation.updated_at).toLocaleDateString("en-US", {
                                  month: "2-digit",
                                  day: "2-digit",
                                  year: "numeric",
                                })
                              : "---"}
                          </span>
                        ),
                      },
                      {
                        name: "Title",
                        dataColumn: "title",
                        display: (citation: Fact): React.JSX.Element => {
                          // Handle different data structures for links
                          let titleToShow = citation.title;
                          let uidToUse = citation.uid;

                          if ((citation as any).childInsight?.title && (citation as any).childInsight?.uid) {
                            titleToShow = (citation as any).childInsight.title;
                            uidToUse = (citation as any).childInsight.uid;
                          } else if ((citation as any).parentInsight?.title && (citation as any).parentInsight?.uid) {
                            titleToShow = (citation as any).parentInsight.title;
                            uidToUse = (citation as any).parentInsight.uid;
                          } else if ((citation as any).snippet?.title && (citation as any).snippet?.uid) {
                            titleToShow = (citation as any).snippet.title;
                            uidToUse = (citation as any).snippet.uid;
                          }

                          if (titleToShow && uidToUse) {
                            return (
                              <Link
                                href={`/links/${uidToUse}`}
                                className="text-sm text-primary font-medium hover:text-primary-600 transition-colors duration-200"
                              >
                                {titleToShow || "Untitled"}
                              </Link>
                            );
                          }

                          return (
                            <span className="text-sm text-primary font-medium">
                              {titleToShow || "Untitled"}
                            </span>
                          );
                        },
                      },
                    ]}
                  />
                </InfiniteScrollLoader>
              </div>
            </div>

            {/* Feedback Section */}
            <div
              className={`${cardStyles.cardBody} ${cardStyles.feedbackSectionHalfOff}`}
              style={{ borderTop: "1px solid var(--color-border-primary)" }}
            >
              <div className={cardStyles.contentCardHeader}>
                <div className={cardStyles.hierarchyIndicator}>
                  <span className={cardStyles.hierarchyIcon}>💬</span>
                  Feedback
                </div>
                {/* Action Buttons */}
                <div className="insight-feedback-actions">
                  <button
                    className="insight-feedback-button insight-feedback-button-comment"
                    onClick={() =>
                      currentUser
                        ? setIsEditingComment(true)
                        : confirmAndRegister()
                    }
                  >
                    <span className="insight-feedback-icon">💬</span>
                    <span className="insight-feedback-label">Comment</span>
                  </button>
                </div>
              </div>
              <div className={cardStyles.contentCardBody}>
                {/* Comment Input - In-page */}
                {isClient && currentUser && isEditingComment && (
                  <FeedbackInputElement
                    actionType="comment"
                    submitFunc={(comment) => {
                      if (token) {
                        return submitComment(
                          { comment, insight_id: insight.id },
                          token,
                        );
                      }
                      return Promise.resolve();
                    }}
                    directions="Enter a text comment"
                    afterSubmit={(newObject) => {
                      if (newObject) {
                        setInsight({
                          ...insight,
                          comments: [...(insight.comments ?? []), newObject],
                        });
                      }
                    }}
                    closeFunc={() => setIsEditingComment(false)}
                  />
                )}
                
                {/* Comments */}
                {insightComments && insightComments.length > 0 && (
                  <div className="space-y-3">
                    {insightComments.map((comment) => (
                      <FeedbackItem
                        key={`Insight Comment #${comment.id}`}
                        reactions={comment.reactions || []}
                        currentUserId={currentUser?.id}
                        onReactionSubmit={async (reaction) => {
                          if (token) {
                            const result = await submitReaction(
                              { reaction, insight_id: insight.id },
                              token,
                            );
                            if (result) {
                              // Remove any existing reaction from this user for this comment
                              const existingReactions =
                                comment.reactions?.filter(
                                  (r) => r.user_id !== result.user_id,
                                ) || [];
                              comment.reactions = [
                                ...existingReactions,
                                result as FactReaction,
                              ];
                              setInsight({ ...insight });
                            }
                          }
                        }}
                      >
                        <Comment
                          comment={comment}
                          removeCommentFunc={(id) => {
                            setInsight({
                              ...insight,
                              comments:
                                insight.comments?.filter((c) => c.id !== id) ??
                                [],
                            });
                          }}
                        />
                      </FeedbackItem>
                    ))}
                  </div>
                )}
                {(!insightComments || insightComments.length === 0) && !isEditingComment && (
                  <p className="text-text-tertiary text-center py-4">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                )}
              </div>
            </div>
          </div>


          {/* Dialogs - Child Level */}
          {isClient && currentUser && insight.user_id == currentUser.id && (
            <>
              <AddLinksAsEvidenceDialog
                id={ADD_LINKS_AS_EVIDENCE_DIALOG_ID}
                isOpen={isAddLinksAsEvidenceDialogOpen}
                onClose={() => setIsAddLinksAsEvidenceDialogOpen(false)}
                insight={insight}
                setServerFunctionInput={
                  setServerFunctionInputForSnippets as React.Dispatch<
                    React.SetStateAction<
                      addCitationsToInsightAPISchema | undefined
                    >
                  >
                }
                setActiveServerFunction={
                  setActiveServerFunctionForSnippets as React.Dispatch<
                    | {
                        function: ServerFunction<addCitationsToInsightAPISchema>;
                      }
                    | undefined
                  >
                }
              />
              <AddCitationsToOtherInsightsDialog
                id={ADD_CITATIONS_TO_OTHER_INSIGHTS_DIALOG_ID}
                isOpen={isAddCitationsToOtherInsightsDialogOpen}
                onClose={() =>
                  setIsAddCitationsToOtherInsightsDialogOpen(false)
                }
                selectedCitations={liveSnippetData}
                setServerFunctionInput={
                  setServerFunctionInputForSnippets as React.Dispatch<
                    React.SetStateAction<
                      doAddCitationsToOtherInsightsSchema | undefined
                    >
                  >
                }
                setActiveServerFunction={
                  setActiveServerFunctionForSnippets as React.Dispatch<
                    | {
                        function: ServerFunction<doAddCitationsToOtherInsightsSchema>;
                      }
                    | undefined
                  >
                }
              />
              <AddChildInsightsDialog
                id={ADD_CHILD_INSIGHTS_DIALOG_ID}
                isOpen={isAddChildInsightsDialogOpen}
                onClose={() => setIsAddChildInsightsDialogOpen(false)}
                insight={insight}
                setServerFunctionInput={setServerFunctionInputForChildInsights}
                setActiveServerFunction={(value) => {
                  if (value) {
                    setActiveServerFunctionForChildInsights({
                      function: async (
                        input: ServerFunctionInputSchemaForChildInsights,
                      ) => {
                        if (token) {
                          addChildrenToInsight(
                            {
                              parentInsight: input.insight,
                              children: input.children,
                              newChildInsightName: input.newInsightName,
                            },
                            token,
                          ).then((flvResponse) => {
                            if (
                              flvResponse.facts &&
                              flvResponse.facts.length > 0
                            ) {
                              const newChildren =
                                flvResponse.facts as InsightLink[];
                              setInsight({
                                ...insight,
                                children: [
                                  ...newChildren,
                                  ...(insight.children ?? []),
                                ],
                              });
                            }
                            setServerFunctionInputForChildInsights(undefined);
                          });
                        }
                        return Promise.resolve([]);
                      },
                    });
                  } else {
                    setActiveServerFunctionForChildInsights(undefined);
                  }
                }}
              />
              <AddParentInsightsDialog
                id={ADD_PARENT_INSIGHTS_DIALOG_ID}
                isOpen={isAddParentInsightsDialogOpen}
                onClose={() => setIsAddParentInsightsDialogOpen(false)}
                insight={insight}
                setServerFunctionInput={setServerFunctionInputForParentInsights}
                setActiveServerFunction={
                  setActiveServerFunctionForParentInsights
                }
              />
            </>
          )}
        </CurrentUserContext.Provider>
      </div>
    </div>
  );
};

export default ClientSidePage;
