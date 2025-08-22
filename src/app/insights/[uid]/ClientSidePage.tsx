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
  ] = useState<any>();

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
          function: ServerFunction<
            | addCitationsToInsightAPISchema
            | doAddCitationsToOtherInsightsSchema
            | doDeleteInsightCitationsSchema
          >;
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
    { function: ServerFunction<doAddParentInsightsSchema> } | undefined
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
    <div id="body">
      {(loggedIn || insight.parents.length > 0) && (
        <div
          className={`alert alert-${insight.parents!.length > 0 ? "success" : "warning"}`}
          style={{ margin: "5px" }}
        >
          <p>⬆️🤔 This insight is important because:</p>
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
              setServerFunctionInput={setServerFunctionInputForParentInsights}
              activeServerFunction={activeServerFunctionForParentInsights}
              setActiveServerFunction={setActiveServerFunctionForParentInsights}
              selectedFacts={selectedParentInsights}
              setSelectedFacts={
                setSelectedParentInsights as React.Dispatch<
                  React.SetStateAction<Fact[]>
                >
              }
              hideHead={true}
              selectedActions={[
                {
                  className: "btn btn-danger",
                  text: "Remove",
                  enabled: currentUser?.id == insight.user_id,
                  handleOnClick: getShowConfirmationFunction<InsightLink[]>(((
                    parentInsightLinksToDelete: InsightLink[],
                  ) => {
                    if (parentInsightLinksToDelete) {
                      setServerFunctionInputForParentInsights(
                        parentInsightLinksToDelete,
                      );
                    }
                  }) as React.Dispatch<
                    React.SetStateAction<InsightLink[] | undefined>
                  >),
                  serverFunction: (
                    parentInsightLinksToDelete: InsightLink[],
                  ) => {
                    if (token) {
                      return doDeleteParentInsights(
                        parentInsightLinksToDelete,
                        token,
                      );
                    }
                    return Promise.resolve([] as FLVResponse[]);
                  },
                },
              ]}
              unselectedActions={[
                {
                  className: "btn bg-warning",
                  text: "Add a Parent Insight",
                  handleOnClick: showAddParentInsightsDialog,
                  enabled: currentUser?.id == insight.user_id,
                  serverFunction: async ({
                    childInsight,
                    newParentInsights,
                    newInsightName,
                  }: doAddParentInsightsSchema) => {
                    if (token) {
                      return doAddParentInsights(
                        { childInsight, newParentInsights, newInsightName },
                        token,
                      );
                    }
                    return Promise.resolve([]);
                  },
                },
              ]}
            />
          </FactsDataContext.Provider>
        </div>
      )}
      {currentUser && insight.user_id == currentUser.id && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            margin: "10px",
          }}
        >
          {!insight.is_public && (
            <div style={{ padding: "2px" }}>
              <button
                className="btn btn-primary"
                aria-label="Publish Insight"
                onClick={async () => {
                  if (token && confirm("Are you sure?")) {
                    await publishInsights({ insights: [insight] }, token);
                    setInsight({ ...insight, is_public: true });
                  }
                }}
              >
                Publish Insight
              </button>
            </div>
          )}
          <div style={{ padding: "2px" }}>
            <button
              className="btn btn-danger"
              aria-label="Delete Insight"
              onClick={async () => {
                if (token && confirm("Are you sure?")) {
                  await deleteInsights({ insights: [insight] }, token);
                  window.location.href = "/";
                }
              }}
            >
              Delete Insight
            </button>
          </div>
        </div>
      )}
      <CurrentUserContext.Provider value={currentUser}>
        <div id="source">
          <div style={{ display: "flex" }}>
            {insightReactions?.map((r) => r.reaction).join("") || (
              <span>😲 (no reactions)</span>
            )}
          </div>
          <div id="created_at">
            <p>{createdOrUpdated}</p>
          </div>
          <div style={{ height: "60px" }}>
            <SourceLogo fact={insight} />
          </div>
        </div>
        <div
          style={{
            width: "100%",
            border: "1px black solid",
            borderRadius: "5px",
            backgroundColor: "white",
          }}
        >
          <div
            className="alert alert-secondary"
            style={{
              marginBlockEnd: "0.83em",
              width: "100%",
              textAlign: "center",
            }}
          >
            <EditableTitle insight={insight} apiRoot="/api/insights" />
          </div>
          <h3 style={{ textAlign: "center" }}>
            📄 {liveSnippetData.length ?? 0}
          </h3>
          <div id="childInsights">
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
                setServerFunctionInput={setServerFunctionInputForChildInsights}
                serverFunctionInput={serverFunctionInputForChildInsights}
                selectedFacts={selectedChildInsights}
                setSelectedFacts={
                  setSelectedChildInsights as React.Dispatch<
                    React.SetStateAction<Fact[]>
                  >
                }
                unselectedActions={[
                  {
                    text: "Add Child Insight",
                    className: "btn btn-primary",
                    enabled: currentUser?.id == insight.user_id,
                    handleOnClick: showAddChildInsightsDialog,
                    serverFunction: async ({
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
                          setServerFunctionInputForChildInsights(undefined);
                        });
                      }
                      return Promise.resolve([]);
                    },
                  },
                ]}
                selectedActions={[
                  {
                    text: "Remove",
                    className: "btn btn-danger",
                    enabled: currentUser?.id == insight.user_id,
                    handleOnClick: getShowConfirmationFunction<InsightLink[]>(((
                      selectedChildren: InsightLink[] | undefined,
                    ) => {
                      if (selectedChildren) {
                        return setServerFunctionInputForChildInsights(
                          selectedChildren,
                        );
                      }
                    }) as React.Dispatch<
                      React.SetStateAction<InsightLink[] | undefined>
                    >),
                    serverFunction: (
                      childInsightLinksToDelete: InsightLink[],
                    ) => {
                      if (token) {
                        doDeleteInsightChildren(
                          childInsightLinksToDelete,
                          token,
                        ).then(() => {
                          if (!insight.children) {
                            insight.children = [];
                          }
                          setInsight({
                            ...insight,
                            children: insight.children.filter(
                              (c) =>
                                !childInsightLinksToDelete
                                  .map((l) => l.child_id)
                                  .includes(c.child_id),
                            ),
                          });
                        });
                      }
                      return Promise.resolve([]);
                    },
                  },
                ]}
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
                        {/* {insightLink.childInsight.evidence!.length} */}
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
                    r.user_id == currentUser?.id && r.insight_id == insight.id,
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
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-around",
            width: "100%",
            margin: "10px",
          }}
        >
          <FeedbackLink
            actionVerb="React"
            icon="😲"
            setOnClickFunction={() =>
              currentUser ? setIsEditingReaction(true) : confirmAndRegister()
            }
          />
          <FeedbackLink
            actionVerb="Comment"
            icon="💬"
            setOnClickFunction={() =>
              currentUser ? setIsEditingComment(true) : confirmAndRegister()
            }
          />
        </div>

        {insightComments && (
          <div className="comments">
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
        <h3>📄 Evidence ({liveSnippetData.length || 0})</h3>
        <InfiniteScrollLoader
          data={liveSnippetData}
          setData={
            setLiveSnippetData as React.Dispatch<
              React.SetStateAction<Fact[] | undefined>
            >
          }
          limit={20}
          getDataFunctionParams={{ insightUid: insight.uid ?? "" }}
          getDataFunction={async (offset, token, getDataFunctionParams) => {
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
              setSelectedCitations as Dispatch<SetStateAction<Fact[]>>
            }
            enableFeedback={true}
            columns={[
              {
                name: "Source",
                dataColumn: "source_baseurl",
                display: (fact: Fact) => <SourceLogo fact={fact} />,
              },
            ]}
            selectedActions={[
              {
                className: "btn btn-primary",
                text: "Add to Other Insight(s)",
                handleOnClick: openAddCitationsToOtherInsightsDialog,
                enabled: !!currentUser,
                serverFunction: ({
                  selectedCitations,
                  citationsToRemove,
                  selectedInsights,
                  newInsightName,
                }: doAddCitationsToOtherInsightsSchema) => {
                  if (token) {
                    return doAddCitationsToOtherInsights(
                      {
                        selectedCitations,
                        citationsToRemove,
                        selectedInsights,
                        newInsightName,
                      },
                      token,
                    );
                  }
                  return Promise.resolve([]);
                },
              },
              {
                className: "btn btn-danger",
                text: "Remove",
                handleOnClick: getShowConfirmationFunction<InsightEvidence[]>(((
                  input: InsightEvidence[],
                ) => {
                  if (input) {
                    return setServerFunctionInputForSnippets({
                      citations: input,
                    } as doDeleteInsightCitationsSchema);
                  }
                }) as React.Dispatch<
                  React.SetStateAction<InsightEvidence[] | undefined>
                >),
                enabled: currentUser?.id == insight.user_id,
                serverFunction: ({
                  citations,
                }: doDeleteInsightCitationsSchema) => {
                  if (token) {
                    return doDeleteInsightCitations({ citations }, token);
                  }
                  return Promise.resolve([]);
                },
              },
            ]}
            // TODO: consider saving new links on Add Evidence? or split that into 2 unelected actions
            unselectedActions={[
              {
                className: "btn btn-primary",
                text: "Add Evidence",
                enabled: currentUser?.id == insight.user_id,
                handleOnClick: showAddLinksAsEvidenceDialog,
                serverFunction: async ({
                  insight,
                  evidence,
                  newLinkUrl,
                }: addCitationsToInsightAPISchema) => {
                  if (token) {
                    const flvResponse = await addCitationsToInsight(
                      { insight, evidence, newLinkUrl },
                      token,
                    );
                    if (!insight.evidence) {
                      insight.evidence = [];
                    }
                    if (insight.evidence) {
                      const newEvidence =
                        (flvResponse.facts as InsightEvidence[]).filter(
                          (c: InsightEvidence) =>
                            !insight.evidence?.some(
                              (c2: InsightEvidence) =>
                                c2.summary_id == c.summary_id,
                            ),
                        ) ?? [];

                      // setInsight() instead of returning an FlvResponse bc insight.evidence needs to stay up-to-date
                      setInsight({
                        ...insight,
                        evidence: [...newEvidence, ...insight.evidence],
                      });
                    }
                  }
                  return Promise.resolve([]);
                },
              },
            ]}
          />
        </InfiniteScrollLoader>
        {currentUser && (
          <AddCitationsToOtherInsightsDialog
            id={ADD_CITATIONS_TO_OTHER_INSIGHTS_DIALOG_ID}
            // potentialInsightsInput={potentialInsightsToModify}
            selectedCitations={selectedCitations}
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
        )}
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
            <AddChildInsightsDialog
              id={ADD_CHILD_INSIGHTS_DIALOG_ID}
              insight={insight}
              setServerFunctionInput={setServerFunctionInputForChildInsights}
              setActiveServerFunction={() => {}}
            />
            <AddParentInsightsDialog
              id={"addParentInsightsDialog"}
              insight={insight}
              setServerFunctionInput={setServerFunctionInputForParentInsights}
              setActiveServerFunction={setActiveServerFunctionForParentInsights}
            />
          </>
        )}
      </CurrentUserContext.Provider>
    </div>
  );
};

export default ClientSidePage;
