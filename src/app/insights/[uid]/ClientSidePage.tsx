"use client";

import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
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
import FeedbackLink from "../../components/FeedbackLink";
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
  getShowConfirmationFunction,
  openAddCitationsToOtherInsightsDialog,
  showAddChildInsightsDialog,
  showAddLinksAsEvidenceDialog,
  showAddParentInsightsDialog,
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

  const [returnPath, setReturnPath] = useState<string>();
  useEffect(() => setReturnPath(window.location.pathname), []);

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
  const [isEditingReaction, setIsEditingReaction] = useState(false);
  const [isEditingComment, setIsEditingComment] = useState(false);

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
    <div className="min-h-screen bg-background-secondary">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
        <CurrentUserContext.Provider value={currentUser}>
          {/* Page Header - Overall Page Level */}
          <div className="content-card space-main">
            <div className="content-card-header">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16">
                    <SourceLogo fact={insight} />
                  </div>
                  <div>
                    <EditableTitle insight={insight} apiRoot="/api/insights" />
                    <div className="text-sm text-text-tertiary mt-1">
                      {createdOrUpdated}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {insightReactions?.map((r) => r.reaction).join("") || (
                      <span className="text-text-tertiary">
                        😲 (no reactions)
                      </span>
                    )}
                  </div>
                  <div className="text-lg text-text-secondary">
                    📄 {liveSnippetData.length ?? 0} citations
                  </div>
                </div>
              </div>

              {/* Big Actions */}
              {currentUser && insight.user_id == currentUser.id && (
                <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border-primary">
                  {!insight.is_public && (
                    <button
                      className="btn btn-sm btn-ghost text-text-secondary hover:text-text-primary hover:bg-background-secondary flex items-center gap-1"
                      aria-label="Publish Insight"
                      title="Publish Insight"
                      onClick={async () => {
                        if (token && confirm("Are you sure?")) {
                          await publishInsights({ insights: [insight] }, token);
                          setInsight({ ...insight, is_public: true });
                        }
                      }}
                    >
                      <span>🌎</span>
                      <span className="text-xs">Publish</span>
                    </button>
                  )}
                  <button
                    className="btn btn-sm btn-ghost text-text-secondary hover:text-text-primary hover:bg-background-secondary flex items-center gap-1"
                    aria-label="Delete Insight"
                    title="Delete Insight"
                    onClick={async () => {
                      if (token && confirm("Are you sure?")) {
                        await deleteInsights({ insights: [insight] }, token);
                        window.location.href = "/";
                      }
                    }}
                  >
                    <span>🗑️</span>
                    <span className="text-xs">Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Parent Insights Section */}
          {(loggedIn || insight.parents.length > 0) && (
            <div className="content-card space-main">
              <div className="content-card-header">
                <div className="hierarchy-indicator parent">
                  Parent Insights
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="section-header parent">
                    This insight is important because:
                  </h3>
                  {currentUser?.id == insight.user_id && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          showAddParentInsightsDialog();
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
                        className="btn btn-sm btn-ghost text-text-secondary hover:text-text-primary hover:bg-background-secondary flex items-center gap-1"
                        aria-label="Add Parent Insight"
                        title="Add Parent Insight"
                      >
                        <span>➕</span>
                        <span className="text-xs">Add</span>
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-text-secondary">
                    {insight.parents.length > 0
                      ? `${insight.parents.length} parent insight${insight.parents.length !== 1 ? "s" : ""}`
                      : "No parent insights yet"}
                  </p>
                </div>
              </div>
              <div className="content-card-body">
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
                    activeServerFunction={activeServerFunctionForParentInsights}
                    setActiveServerFunction={
                      setActiveServerFunctionForParentInsights
                    }
                    selectedFacts={selectedParentInsights}
                    setSelectedFacts={
                      setSelectedParentInsights as React.Dispatch<
                        React.SetStateAction<Fact[]>
                      >
                    }
                    hideHead={true}
                  />
                </FactsDataContext.Provider>
              </div>
            </div>
          )}

          {/* Child Insights Section */}
          <div className="content-card space-main">
            <div className="content-card-header">
              <div className="hierarchy-indicator main">Child Insights</div>
              <div className="flex items-center justify-between">
                <h3 className="section-header main">
                  Insights that build upon this one:
                </h3>
                {currentUser?.id == insight.user_id && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        showAddChildInsightsDialog();
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
                      className="btn btn-sm btn-ghost text-text-secondary hover:text-text-primary hover:bg-background-secondary flex items-center gap-1"
                      aria-label="Add Child Insight"
                      title="Add Child Insight"
                    >
                      <span>➕</span>
                      <span className="text-xs">Add</span>
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-text-secondary">
                  {insight.children.length > 0
                    ? `${insight.children.length} child insight${insight.children.length !== 1 ? "s" : ""}`
                    : "No child insights yet"}
                </p>
              </div>
            </div>
            <div className="content-card-body">
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
                  columns={[
                    {
                      name: "📄",
                      dataColumn: "childInsight.evidence",
                      display: (insightLink: Fact | InsightLink) => (
                        <span className="badge text-bg-danger">
                          {insightLink.childInsight.directEvidenceCount ?? 0}
                        </span>
                      ),
                    },
                    {
                      name: "🌎",
                      dataColumn: "childInsight.is_public",
                      display: (insight: Fact | Insight) => (
                        <span>{insight.is_public ? "✅" : ""}</span>
                      ),
                    },
                  ]}
                />
              </FactsDataContext.Provider>
            </div>
          </div>

          {/* Evidence Section */}
          <div className="content-card space-main">
            <div className="content-card-header">
              <div className="hierarchy-indicator child">Evidence</div>
              <div className="flex items-center justify-between">
                <h3 className="section-header child">
                  Supporting evidence and citations:
                </h3>
                {currentUser?.id == insight.user_id && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        showAddLinksAsEvidenceDialog();
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
                      className="btn btn-sm btn-ghost text-text-secondary hover:text-text-primary hover:bg-background-secondary flex items-center gap-1"
                      aria-label="Add Evidence"
                      title="Add Evidence"
                    >
                      <span>➕</span>
                      <span className="text-xs">Add</span>
                    </button>
                    <button
                      onClick={() => {
                        openAddCitationsToOtherInsightsDialog();
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
                      className="btn btn-sm btn-ghost text-text-secondary hover:text-text-primary hover:bg-background-secondary flex items-center gap-1"
                      aria-label="Move Citations"
                      title="Move Citations"
                    >
                      <span>🔄</span>
                      <span className="text-xs">Move</span>
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-text-secondary">
                  {liveSnippetData.length > 0
                    ? `${liveSnippetData.length} citation${liveSnippetData.length !== 1 ? "s" : ""}`
                    : "No evidence yet"}
                </p>
              </div>
            </div>
            <div className="content-card-body">
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
                />
              </InfiniteScrollLoader>
            </div>
          </div>

          {/* Feedback Section */}
          <div className="content-card space-main">
            <div className="content-card-header">
              <div className="hierarchy-indicator child">Feedback</div>
              <h3 className="section-header child">Reactions and comments:</h3>
              <div className="flex items-center justify-center space-x-8">
                <FeedbackLink
                  actionVerb="React"
                  icon="😲"
                  setOnClickFunction={() =>
                    currentUser
                      ? setIsEditingReaction(true)
                      : confirmAndRegister()
                  }
                />
                <FeedbackLink
                  actionVerb="Comment"
                  icon="💬"
                  setOnClickFunction={() =>
                    currentUser
                      ? setIsEditingComment(true)
                      : confirmAndRegister()
                  }
                />
              </div>
            </div>
            <div className="content-card-body">
              {/* Comments */}
              {insightComments && insightComments.length > 0 && (
                <div className="space-y-3">
                  {insightComments.map((comment) => (
                    <Comment
                      key={`Insight Comment #${comment.id}`}
                      comment={comment}
                      removeCommentFunc={(id) => {
                        setInsight({
                          ...insight,
                          comments:
                            insight.comments?.filter((c) => c.id !== id) ?? [],
                        });
                      }}
                    />
                  ))}
                </div>
              )}
              {(!insightComments || insightComments.length === 0) && (
                <p className="text-text-tertiary text-center py-4">
                  No comments yet. Be the first to share your thoughts!
                </p>
              )}
            </div>
          </div>

          {/* Feedback Input Elements */}
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
              directions="Select an emoji character"
              afterSubmit={(newObject) => {
                if (newObject) {
                  const existingReaction = insight.reactions?.find(
                    (r) =>
                      r.user_id == currentUser?.id &&
                      r.insight_id == insight.id,
                  );
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

          {/* Dialogs - Child Level */}
          {currentUser && insight.user_id == currentUser.id && (
            <>
              <AddLinksAsEvidenceDialog
                id={ADD_LINKS_AS_EVIDENCE_DIALOG_ID}
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
