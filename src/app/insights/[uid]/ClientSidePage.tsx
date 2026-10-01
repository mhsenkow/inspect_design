"use client";

import styles from "../../../styles/components/client-side-page.module.css";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import moment from "moment";

import {
  Fact,
  FactComment,
  FactReaction,
  FLVResponse,
  Insight,
  InsightEvidence,
  InsightLink,
  ServerFunction,
  User,
} from "../../types";

import FeedbackInputElement from "../../components/FeedbackInputElement";
import { submitComment, submitReaction } from "../../functions";
import useUser from "../../hooks/useUser";
import EditableText from "../../components/EditableText";
import AddLinksAsEvidenceDialog from "./AddLinksAsEvidenceDialog";
import InfiniteScrollLoader from "../../components/InfiniteScrollLoader";
import FactsListView from "../../components/FactsListView";
import AddCitationsToOtherInsightsDialog from "../../components/AddCitationsToOtherInsightsDialog";
import CurrentUserContext from "../../contexts/CurrentUserContext";
import AddChildInsightsDialog from "./AddChildInsightsDialog";
import FactsDataContext from "../../contexts/FactsDataContext";
import AddParentInsightsDialog from "./AddParentInsightsDialog";
import ServerActionContext from "../../contexts/ServerActionContext";
import { prop } from "../../lib/prop";
import {
  // doAddCitationsToOtherInsightsSchema,
  // doAddParentInsights,
  // doAddParentInsightsSchema,
  doDeleteInsightChildren,
  doDeleteInsightCitations,
  // doDeleteInsightCitationsSchema,
  doDeleteParentInsights,
} from "./functions";
import {} from // addChildrenToInsight,
// addCitationsToInsight,
// addCitationsToInsightAPISchema,
"../../components/SelectedCitationsAPI";
import Comment from "../../components/Comment";
import { deleteInsights, publishInsights } from "../../components/InsightsAPI";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalButton,
} from "../../components/Modal";

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

  const [returnPath, setReturnPath] = useState<string>();
  useEffect(() => setReturnPath(window.location.pathname), []);

  const [insight, setInsight] = useState(insightInput);
  const insightOwnerId = prop<number>(insight, "user_id", "userId");
  const isOwner = Boolean(currentUser && insightOwnerId == currentUser.id);
  const [insightComments, setInsightComments] = useState<FactComment[]>();
  useEffect(() => {
    if (insight.comments) {
      setInsightComments(
        insight.comments.filter((c) => {
          const insightId = prop<number>(c, "insight_id", "insightId");
          const summaryId = prop<number>(c, "summary_id", "summaryId");
          return insightId == insight.id && !summaryId;
        }),
      );
    }
  }, [insight]);
  const [insightReactions, setInsightReactions] = useState<FactReaction[]>();
  useEffect(() => {
    if (insight.reactions) {
      setInsightReactions(
        insight.reactions.filter((r) => {
          const insightId = prop<number>(r, "insight_id", "insightId");
          const summaryId = prop<number>(r, "summary_id", "summaryId");
          return insightId == insight.id && !summaryId;
        }),
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
  const [isEditingReaction, setIsEditingReaction] = useState(false);
  const [isEditingComment, setIsEditingComment] = useState(false);

  // Modal states
  const [isAddLinksAsEvidenceDialogOpen, setIsAddLinksAsEvidenceDialogOpen] =
    useState(false);
  const [
    isAddCitationsToOtherInsightsDialogOpen,
    setIsAddCitationsToOtherInsightsDialogOpen,
  ] = useState(false);
  const [isAddParentInsightsDialogOpen, setIsAddParentInsightsDialogOpen] =
    useState(false);
  const [isAddChildInsightsDialogOpen, setIsAddChildInsightsDialogOpen] =
    useState(false);
  const [isDeleteInsightDialogOpen, setIsDeleteInsightDialogOpen] =
    useState(false);
  const [isDeletingInsight, setIsDeletingInsight] = useState(false);

  const createdOrUpdated = useMemo(() => {
    if (insight) {
      if (insight.created_at == insight.updated_at) {
        return `Created ${moment(insight.created_at).fromNow()}`;
      }
      // TODO: show the time between created and updated?
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

  const handleConfirmDeleteInsight = useCallback(async () => {
    if (!token || isDeletingInsight) return;
    setIsDeletingInsight(true);
    try {
      await deleteInsights({ insights: [insight] }, token);
      window.location.href = "/insights";
    } catch (error) {
      console.error("Failed to delete insight", error);
      setIsDeletingInsight(false);
    }
  }, [token, isDeletingInsight, insight]);

  const executeAction = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (func: ServerFunction<any>, input: any) => {
      if (!token) {
        console.error("No token available for server action");
        return;
      }
      try {
        const response = await func(input, token);
        if (!response) return;

        const responses = Array.isArray(response) ? response : [response];
        const currentInsightId = insight.id;

        const linkId = (link: InsightLink | Fact) =>
          prop<number>(link, "id", "id");
        const linkChildId = (link: InsightLink | Fact) =>
          prop<number>(link, "child_id", "childId");
        const linkParentId = (link: InsightLink | Fact) =>
          prop<number>(link, "parent_id", "parentId");
        const evidenceId = (item: InsightEvidence | Fact) =>
          prop<number>(item, "id", "id") ??
          prop<number>(item, "summary_id", "summaryId");

        setInsight((prev) => {
          let nextParents: InsightLink[] = prev.parents ?? [];
          let nextChildren: InsightLink[] = prev.children ?? [];
          let nextEvidence: InsightEvidence[] =
            (prev.evidence as InsightEvidence[] | undefined) ?? [];

          for (const res of responses) {
            if (res.action === -1) {
              const idsToDelete = new Set(
                res.facts
                  .map((f) => linkId(f) ?? evidenceId(f as InsightEvidence))
                  .filter((id): id is number => typeof id === "number"),
              );
              nextParents = nextParents.filter(
                (p) => !idsToDelete.has(linkId(p) as number),
              );
              nextChildren = nextChildren.filter(
                (c) => !idsToDelete.has(linkId(c) as number),
              );
              nextEvidence = nextEvidence.filter(
                (e) => !idsToDelete.has(evidenceId(e) as number),
              );
              continue;
            }

            if (res.action !== 1 || !res.facts?.length) continue;

            const childLinks: InsightLink[] = [];
            const parentLinks: InsightLink[] = [];
            const evidenceItems: InsightEvidence[] = [];

            for (const fact of res.facts) {
              const childId = linkChildId(fact);
              const parentId = linkParentId(fact);
              const summaryId = prop<number>(fact, "summary_id", "summaryId");

              if (
                typeof parentId === "number" &&
                typeof childId === "number" &&
                parentId === currentInsightId
              ) {
                childLinks.push(fact as InsightLink);
              } else if (
                typeof parentId === "number" &&
                typeof childId === "number" &&
                childId === currentInsightId
              ) {
                parentLinks.push(fact as InsightLink);
              } else if (typeof summaryId === "number") {
                evidenceItems.push(fact as InsightEvidence);
              } else if (
                typeof parentId === "number" &&
                typeof childId === "number"
              ) {
                // Fallback: treat as child link if shape matches
                childLinks.push(fact as InsightLink);
              }
            }

            if (childLinks.length) {
              const existing = new Set(
                nextChildren
                  .map((c) => linkId(c) ?? `${linkParentId(c)}-${linkChildId(c)}`)
                  .filter(Boolean),
              );
              nextChildren = [
                ...nextChildren,
                ...childLinks.filter((link) => {
                  const key =
                    linkId(link) ?? `${linkParentId(link)}-${linkChildId(link)}`;
                  return key != null && !existing.has(key);
                }),
              ];
            }

            if (parentLinks.length) {
              const existing = new Set(
                nextParents
                  .map((p) => linkId(p) ?? `${linkParentId(p)}-${linkChildId(p)}`)
                  .filter(Boolean),
              );
              nextParents = [
                ...nextParents,
                ...parentLinks.filter((link) => {
                  const key =
                    linkId(link) ?? `${linkParentId(link)}-${linkChildId(link)}`;
                  return key != null && !existing.has(key);
                }),
              ];
            }

            if (evidenceItems.length) {
              const existing = new Set(
                nextEvidence
                  .map((e) => evidenceId(e))
                  .filter((id): id is number => typeof id === "number"),
              );
              nextEvidence = [
                ...evidenceItems.filter((item) => {
                  const id = evidenceId(item);
                  return typeof id === "number" && !existing.has(id);
                }),
                ...nextEvidence,
              ];
            }
          }

          return {
            ...prev,
            parents: nextParents,
            children: nextChildren,
            evidence: nextEvidence,
          };
        });
      } catch (error: unknown) {
        let message = "Action failed";
        if (error instanceof Error && error.message) {
          message = error.message;
        } else if (typeof Response !== "undefined" && error instanceof Response) {
          message = `Request failed (${error.status})`;
        } else if (typeof error === "string" && error) {
          message = error;
        }
        console.error("Error executing server action:", message, error);
        alert(message);
      }
    },
    [token, insight.id],
  );

  return (
    <div
      className={`${styles.pageContainer} ${
        isOwner
          ? styles.pageContainerOwner
          : ""
      }`}
    >
      <div className={styles.mainContent}>
        <CurrentUserContext.Provider value={currentUser}>
          <ServerActionContext.Provider value={{ executeAction }}>
            <div className={styles.stickyHeader}>
              <a href="/insights" className={styles.backLink}>
                Insights
              </a>
              <header className={styles.pageHeader}>
                <div className={styles.titleRow}>
                  <EditableText
                    insight={insight}
                    apiRoot="/api/insights"
                    fieldName="title"
                    initialValue={insight.title}
                    as="h1"
                    canEdit={isOwner}
                    className={styles.titleEditable}
                  />
                  {insightReactions && insightReactions.length > 0 && (
                    <div
                      className={styles.titleReactions}
                      aria-label="Reactions"
                    >
                      {insightReactions.map((r) => (
                        <span
                          key={`reaction-${r.id ?? r.reaction}`}
                          className={styles.titleReaction}
                          aria-hidden
                        >
                          {r.reaction}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <EditableText
                  insight={insight}
                  apiRoot="/api/insights"
                  fieldName="description"
                  initialValue={insight.description}
                  as="p"
                  isTextarea={true}
                  placeholder="Add a description"
                  canEdit={isOwner}
                  className={styles.descriptionEditable}
                />
                <p className={styles.headerMeta}>
                  {liveSnippetData.length ?? 0} citations
                  {" · "}
                  {prop<boolean>(insight, "is_public", "isPublic")
                    ? "Public"
                    : "Private"}
                  {" · "}
                  {createdOrUpdated}
                </p>
                {isOwner && (
                  <div className={styles.actionsSection}>
                    {!prop<boolean>(insight, "is_public", "isPublic") && (
                      <button
                        type="button"
                        className={styles.textAction}
                        onClick={async () => {
                          if (token && confirm("Publish this insight?")) {
                            await publishInsights({ insights: [insight] }, token);
                            setInsight({ ...insight, is_public: true });
                          }
                        }}
                      >
                        Publish
                      </button>
                    )}
                    <button
                      type="button"
                      className={`${styles.textAction} ${styles.textActionDanger} ${styles.deleteAction}`}
                      onClick={() => setIsDeleteInsightDialogOpen(true)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </header>
            </div>

            <div className={styles.scrollBody}>
            {/* Parent Insights Section */}
            {(loggedIn || insight.parents.length > 0) && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionHeaderRow}>
                    <div>
                      <h2 className={styles.sectionTitle}>Parents</h2>
                      <p className={styles.sectionSubtitle}>
                        {insight.parents.length > 0
                          ? `${insight.parents.length}`
                          : "None"}
                      </p>
                    </div>
                    {isOwner && (
                      <div className={styles.sectionActions}>
                        <button
                          onClick={() => {
                            setIsAddParentInsightsDialogOpen(true);
                          }}
                          className={styles.addButton}
                          aria-label="Add Parent Insight"
                          title="Add Parent Insight"
                        >
                          <span className={styles.addButtonIcon}>+</span>
                          <span className={styles.addButtonText}>Add</span>
                        </button>
                        {selectedParentInsights.length > 0 && (
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  "Are you sure you want to remove these parent relationships?",
                                )
                              ) {
                                executeAction(
                                  doDeleteParentInsights,
                                  selectedParentInsights,
                                );
                              }
                            }}
                            className={styles.removeButton}
                            aria-label="Remove Selected Parent Insights"
                            title="Remove Selected Parent Insights"
                          >
                            <span className={styles.addButtonText}>Remove</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div
                  className={`${styles.sectionBody} ${
                    insight.parents.length > 0 ? styles.sectionBodyScrollable : ""
                  }`}
                >
                  {insight.parents.length > 0 ? (
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
                        selectedFacts={selectedParentInsights}
                        setSelectedFacts={
                          setSelectedParentInsights as React.Dispatch<
                            React.SetStateAction<Fact[]>
                          >
                        }
                        selectedActions={[]}
                        hideHead={true}
                      />
                    </FactsDataContext.Provider>
                  ) : (
                    <p className={styles.sectionBodyEmpty}>No parent insights</p>
                  )}
                </div>
              </section>
            )}

            {/* Child Insights Section */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderRow}>
                  <div>
                    <h2 className={styles.sectionTitle}>Children</h2>
                    <p className={styles.sectionSubtitle}>
                      {insight.children.length > 0
                        ? `${insight.children.length}`
                        : "None"}
                    </p>
                  </div>
                  {isOwner && (
                    <div className={styles.sectionActions}>
                      <button
                        onClick={() => {
                          setIsAddChildInsightsDialogOpen(true);
                        }}
                        className={styles.addButton}
                        aria-label="Add Child Insight"
                        title="Add Child Insight"
                      >
                        <span className={styles.addButtonIcon}>+</span>
                        <span className={styles.addButtonText}>Add</span>
                      </button>
                      {selectedChildInsights.length > 0 && (
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                "Are you sure you want to remove these child relationships?",
                              )
                            ) {
                              executeAction(
                                doDeleteInsightChildren,
                                selectedChildInsights,
                              );
                            }
                          }}
                          className={styles.removeButton}
                          aria-label="Remove Selected Child Insights"
                          title="Remove Selected Child Insights"
                        >
                          <span className={styles.addButtonText}>Remove</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div
                className={`${styles.sectionBody} ${
                  insight.children.length > 0 ? styles.sectionBodyScrollable : ""
                }`}
              >
                {insight.children.length > 0 ? (
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
                      selectedFacts={selectedChildInsights}
                      setSelectedFacts={
                        setSelectedChildInsights as React.Dispatch<
                          React.SetStateAction<Fact[]>
                        >
                      }
                      selectedActions={[]}
                      columns={[
                        {
                          name: "Citations",
                          dataColumn: "childInsight.evidence",
                          display: (insightLink: Fact | InsightLink) => (
                            <span className={styles.metaChip}>
                              {insightLink.childInsight.directEvidenceCount ?? 0}
                            </span>
                          ),
                        },
                        {
                          name: "Public",
                          dataColumn: "childInsight.is_public",
                          display: (insightRow: Fact | Insight) => (
                            <span>
                              {prop<boolean>(insightRow, "is_public", "isPublic")
                                ? "Yes"
                                : ""}
                            </span>
                          ),
                        },
                      ]}
                    />
                  </FactsDataContext.Provider>
                ) : (
                  <p className={styles.sectionBodyEmpty}>No child insights</p>
                )}
              </div>
            </section>

            {/* Evidence Section */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderRow}>
                  <div>
                    <h2 className={styles.sectionTitle}>Evidence</h2>
                    <p className={styles.sectionSubtitle}>
                      {liveSnippetData.length > 0
                        ? `${liveSnippetData.length}`
                        : "None"}
                    </p>
                  </div>
                  {isOwner && (
                    <div className={styles.sectionActions}>
                      <button
                        onClick={() => {
                          setIsAddLinksAsEvidenceDialogOpen(true);
                        }}
                        className={styles.addButton}
                        aria-label="Add Evidence"
                        title="Add Evidence"
                      >
                        <span className={styles.addButtonIcon}>+</span>
                        <span className={styles.addButtonText}>Add</span>
                      </button>
                      {selectedCitations.length > 0 && (
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                "Are you sure you want to remove these citations?",
                              )
                            ) {
                              executeAction(doDeleteInsightCitations, {
                                citations: selectedCitations,
                              });
                            }
                          }}
                          className={styles.removeButton}
                          aria-label="Remove Selected Citations"
                          title="Remove Selected Citations"
                        >
                          <span className={styles.addButtonText}>Remove</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div
                className={`${styles.sectionBody} ${
                  liveSnippetData.length > 0 ? styles.sectionBodyScrollable : ""
                }`}
              >
                {liveSnippetData.length > 0 ? (
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
                      selectedFacts={selectedCitations}
                      setSelectedFacts={
                        setSelectedCitations as React.Dispatch<
                          React.SetStateAction<Fact[]>
                        >
                      }
                      selectedActions={[]}
                    />
                  </InfiniteScrollLoader>
                ) : (
                  <p className={styles.sectionBodyEmpty}>No evidence yet</p>
                )}
              </div>
            </section>

            {/* Feedback Section */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionHeaderRow}>
                  <div>
                    <h2 className={styles.sectionTitle}>Feedback</h2>
                  </div>
                  <div className={styles.sectionActions}>
                    <button
                      type="button"
                      className={styles.addButton}
                      aria-label="React"
                      title="React"
                      onClick={() =>
                        currentUser
                          ? setIsEditingReaction(true)
                          : confirmAndRegister()
                      }
                    >
                      <span className={styles.addButtonIcon} aria-hidden>
                        😲
                      </span>
                      <span className={styles.addButtonText}>React</span>
                    </button>
                    <button
                      type="button"
                      className={styles.addButton}
                      aria-label="Comment"
                      title="Comment"
                      onClick={() =>
                        currentUser
                          ? setIsEditingComment(true)
                          : confirmAndRegister()
                      }
                    >
                      <span className={styles.addButtonIcon} aria-hidden>
                        💬
                      </span>
                      <span className={styles.addButtonText}>Comment</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className={`${styles.sectionBody} ${styles.sectionBodyScrollable}`}>
                {currentUser && isEditingReaction && (
                  <FeedbackInputElement
                    actionType="reaction"
                    submitFunc={(reaction) => {
                      if (token) {
                        return submitReaction(
                          { reaction, insight_id: insight.id },
                          token,
                        );
                      }
                      return Promise.resolve();
                    }}
                    directions="Pick a reaction"
                    afterSubmit={(newObject) => {
                      if (newObject) {
                        const existingReaction = insight.reactions?.find((r) => {
                          const userId = prop<number>(r, "user_id", "userId");
                          const insightId = prop<number>(
                            r,
                            "insight_id",
                            "insightId",
                          );
                          return (
                            userId == currentUser?.id && insightId == insight.id
                          );
                        });
                        const existingReactions = insight.reactions?.filter(
                          (r) => r.id !== existingReaction?.id,
                        );
                        setInsight({
                          ...insight,
                          reactions: [
                            ...(existingReactions ?? []),
                            newObject as FactReaction,
                          ],
                        });
                      }
                    }}
                    closeFunc={() => setIsEditingReaction(false)}
                  />
                )}
                {currentUser && isEditingComment && (
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
                    directions="Write a short comment"
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
                {insightComments && insightComments.length > 0 ? (
                  <div className={styles.commentsList}>
                    {insightComments.map((comment) => (
                      <Comment
                        key={`Insight Comment #${comment.id}`}
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
                    ))}
                  </div>
                ) : (
                  !isEditingReaction &&
                  !isEditingComment && (
                    <p className={styles.sectionBodyEmpty}>
                      No comments yet. Be the first to share your thoughts.
                    </p>
                  )
                )}
              </div>
            </section>
            </div>

            {isOwner && (
              <div className={styles.mobileActionsDock}>
                <button
                  type="button"
                  className={`${styles.textAction} ${styles.textActionDanger} ${styles.deleteAction}`}
                  onClick={() => setIsDeleteInsightDialogOpen(true)}
                >
                  Delete
                </button>
                {!prop<boolean>(insight, "is_public", "isPublic") && (
                  <button
                    type="button"
                    className={styles.textAction}
                    onClick={async () => {
                      if (token && confirm("Publish this insight?")) {
                        await publishInsights({ insights: [insight] }, token);
                        setInsight({ ...insight, is_public: true });
                      }
                    }}
                  >
                    Publish
                  </button>
                )}
              </div>
            )}

            {/* Dialogs - Child Level */}
            {isOwner && (
              <>
                <AddLinksAsEvidenceDialog
                  id={ADD_LINKS_AS_EVIDENCE_DIALOG_ID}
                  isOpen={isAddLinksAsEvidenceDialogOpen}
                  onClose={() => setIsAddLinksAsEvidenceDialogOpen(false)}
                  insight={insight}
                />
                <AddCitationsToOtherInsightsDialog
                  id={ADD_CITATIONS_TO_OTHER_INSIGHTS_DIALOG_ID}
                  isOpen={isAddCitationsToOtherInsightsDialogOpen}
                  onClose={() =>
                    setIsAddCitationsToOtherInsightsDialogOpen(false)
                  }
                  selectedCitations={liveSnippetData}
                />
                <AddChildInsightsDialog
                  id={ADD_CHILD_INSIGHTS_DIALOG_ID}
                  isOpen={isAddChildInsightsDialogOpen}
                  onClose={() => setIsAddChildInsightsDialogOpen(false)}
                  insight={insight}
                />
                <AddParentInsightsDialog
                  id={ADD_PARENT_INSIGHTS_DIALOG_ID}
                  isOpen={isAddParentInsightsDialogOpen}
                  onClose={() => setIsAddParentInsightsDialogOpen(false)}
                  insight={insight}
                />
                <Modal
                  id="deleteInsightDialog"
                  title="Delete insight?"
                  isOpen={isDeleteInsightDialogOpen}
                  onClose={() => {
                    if (!isDeletingInsight) {
                      setIsDeleteInsightDialogOpen(false);
                    }
                  }}
                  size="small"
                  closeOnBackdropClick={!isDeletingInsight}
                  closeOnEscape={!isDeletingInsight}
                >
                  <ModalBody>
                    <p className={styles.deleteConfirmCopy}>
                      This permanently deletes{" "}
                      <strong>{insight.title || "this insight"}</strong> and
                      cannot be undone.
                    </p>
                  </ModalBody>
                  <ModalFooter>
                    <ModalButton
                      variant="secondary"
                      onClick={() => setIsDeleteInsightDialogOpen(false)}
                      disabled={isDeletingInsight}
                    >
                      Cancel
                    </ModalButton>
                    <ModalButton
                      variant="danger"
                      onClick={handleConfirmDeleteInsight}
                      disabled={isDeletingInsight}
                    >
                      {isDeletingInsight ? "Deleting…" : "Delete permanently"}
                    </ModalButton>
                  </ModalFooter>
                </Modal>
              </>
            )}
          </ServerActionContext.Provider>
        </CurrentUserContext.Provider>
      </div>
    </div>
  );
};

export default ClientSidePage;
