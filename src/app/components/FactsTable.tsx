"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import {
  Fact,
  FactReaction,
  InsightEvidence,
  Insight,
  Link as LinkType,
} from "../types";
import { encodeStringURI } from "../hooks/functions";
import {
  debounce,
  getSortFunction,
  submitComment,
  submitReaction,
} from "../functions";
import FeedbackLink from "./FeedbackLink";
import useUser from "../hooks/useUser";
import FeedbackInputElement from "./FeedbackInputElement";
import Comment from "./Comment";
import ReactionIcon from "./ReactionIcon";

export const REACTION_DIRECTIONS = "Select an emoji character";
export const COMMENT_DIRECTIONS = "Enter a text comment";

export interface SortDir {
  column: string;
  dir: string;
}

const FactsTable = ({
  data,
  setData,
  factName,
  selectedFacts,
  setSelectedFacts,
  columns,
  queryFunction,
  dataFilter,
  setDataFilter,
  disabledIds,
  selectRows = false,
  hideHead = false,
  // theadTopCSS = "0px",
  enableFeedback = false,
  cellActions,
  enableReactionIcons = false,
}: {
  data?: Fact[];
  setData: React.Dispatch<React.SetStateAction<Fact[] | undefined>>;
  factName: string;
  selectedFacts?: Fact[];
  setSelectedFacts: React.Dispatch<React.SetStateAction<Fact[]>>;
  columns?: {
    name: string;
    dataColumn?: string;
    display: (fact: Fact) => React.JSX.Element;
  }[];
  queryFunction?: (query: string) => Promise<Fact[]>;
  dataFilter: string | undefined;
  setDataFilter?: React.Dispatch<React.SetStateAction<string>>;
  disabledIds?: number[];
  selectRows?: boolean;
  hideHead?: boolean;
  allowFeedback?: boolean;
  height?: string;
  theadTopCSS?: string;
  enableFeedback?: boolean;
  cellActions?: {
    icon: string;
    label: string;
    onClick: (fact: Fact) => void;
    enabled?: (fact: Fact) => boolean;
  }[];
  enableReactionIcons?: boolean;
}): React.JSX.Element => {
  const { token, loggedIn, user_id } = useUser();
  const [returnPath, setReturnPath] = useState<string>();
  useEffect(() => setReturnPath(window.location.pathname), []);

  // Simple user ID getter - use the user_id from useUser hook
  const getCurrentUserId = useCallback(() => {
    console.log("getCurrentUserId: Using user_id from useUser hook:", user_id);
    return user_id;
  }, [user_id]);

  const [loading, setLoading] = useState(false);
  const [fetchedDataFilter, setFetchedDataFilter] = useState<string>();

  useEffect(() => {
    if (
      queryFunction &&
      dataFilter != undefined &&
      dataFilter != fetchedDataFilter &&
      !loading
    ) {
      setLoading(true);
      debounce({
        func: async () => {
          try {
            const encodedDataFilter = encodeStringURI(dataFilter);
            const localData = await queryFunction(encodedDataFilter);
            setData(localData);
            setFetchedDataFilter(dataFilter);
          } catch (error) {
            console.error("Search error:", error);
          } finally {
            setLoading(false);
          }
        },
        key: queryFunction.name,
        wait: 500, // Longer debounce for better UX
      });
    }
  }, [dataFilter, fetchedDataFilter, loading, queryFunction, setData]);

  const [filteredData, setFilteredData] = useState<Fact[]>();
  useEffect(() => {
    if (data) {
      // Only filter client-side if no queryFunction is provided (server-side search)
      if (!queryFunction) {
        const filtered = data.filter((fact) => {
          if (dataFilter && dataFilter.trim() !== "") {
            // Check multiple possible title fields for complex data structures
            const title =
              fact.title ||
              fact.childInsight?.title ||
              fact.parentInsight?.title ||
              "";
            if (title) {
              return title
                .toLowerCase()
                .includes(dataFilter.toLowerCase().trim());
            }
          }
          return true;
        });
        setFilteredData(filtered);
      } else {
        // For server-side search, just use the data as-is
        setFilteredData(data);
      }
    } else {
      setFilteredData([]);
    }
  }, [data, dataFilter, queryFunction]);

  const toggleSelectedFacts = (...facts: Fact[]) => {
    if (selectedFacts) {
      const newFacts = facts.filter(
        (f) => !selectedFacts.map((sf) => sf.id).includes(f.id),
      );
      const otherExistingFacts = selectedFacts.filter(
        (sf) => !facts.map((f) => f.id).includes(sf.id),
      );
      setSelectedFacts([...otherExistingFacts, ...newFacts]);
    }
  };

  const [sortDir, setSortDir] = useState<SortDir>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const noSort = (a: Fact, b: Fact) => 0;
  const [sortFunction, setSortFunction] = useState<
    (a: Fact, b: Fact) => number
  >(() => noSort);
  useEffect(() => {
    if (sortDir) {
      const func = getSortFunction<Fact>(sortDir);
      setSortFunction(() => func);
    } else {
      setSortFunction(() => noSort);
    }
  }, [sortDir]);

  interface EditingForFact {
    [factIds: number]: boolean;
  }
  const [isEditingReactionForFact, setIsEditingReactionForFact] =
    useState<EditingForFact>({});
  const [isEditingCommentForFact, setIsEditingCommentForFact] =
    useState<EditingForFact>({});

  const confirmAndRegister = useCallback(() => {
    if (
      confirm("This action requires a logged-in user. Go to the register page?")
    ) {
      window.location.href = `/register?return=${returnPath}`;
    }
  }, [returnPath]);

  return (
    <div className="card reaction-table-container">
      <table
        className="w-full"
        id={`factsTable-${factName}`}
        onClick={(event) => {
          const targetElement = event.target as HTMLElement;
          const dataColumn = targetElement.getAttribute("data-column");
          if (
            targetElement.tagName == "TH" &&
            targetElement?.textContent &&
            Array.from(targetElement.classList).includes("sortable")
          ) {
            if (
              targetElement.textContent.slice(-1) != "▲" &&
              targetElement.textContent.slice(-1) != "▼"
            ) {
              const columnText = targetElement.textContent;
              targetElement.textContent = columnText + "▼";
              if (dataColumn || columnText == "Updated") {
                setSortDir({
                  column: dataColumn || "updated_at",
                  dir: "desc",
                });
              }
            } else if (targetElement.textContent.slice(-1) == "▼") {
              const columnText = targetElement.textContent.slice(0, -1);
              targetElement.textContent = columnText + "▲";
              if (dataColumn || columnText == "Updated") {
                setSortDir({
                  column: dataColumn || "updated_at",
                  dir: "asc",
                });
              }
            } else if (targetElement.textContent.slice(-1) == "▲") {
              const columnText = targetElement.textContent.slice(0, -1);
              targetElement.textContent = columnText;
              setSortDir(undefined);
            }
          }
        }}
      >
        {!hideHead && (
          <thead>
            <tr>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-inverse uppercase tracking-wider"
                style={{ width: "40px" }}
              >
                <input
                  type="checkbox"
                  name="selectAllFacts"
                  checked={
                    !!data &&
                    data.length > 0 &&
                    selectedFacts &&
                    selectedFacts.length == data.length
                  }
                  onChange={() => {
                    if (filteredData) {
                      return toggleSelectedFacts(...filteredData);
                    }
                  }}
                  className="rounded border-primary text-primary focus:ring-primary"
                />
              </th>
              {columns &&
                columns.map((column) => {
                  // Set specific widths for common columns
                  let columnWidth = "auto";
                  if (column.name === "Updated") {
                    columnWidth = "120px";
                  } else if (column.name === "Title") {
                    columnWidth = "1fr";
                  } else if (column.name === "🌍") {
                    columnWidth = "80px";
                  } else if (
                    column.name === "👨‍👩‍👧‍👦" ||
                    column.name === "👶" ||
                    column.name === "📄" ||
                    column.name === "💬" ||
                    column.name === "❤️"
                  ) {
                    columnWidth = "80px";
                  }

                  return (
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold text-inverse uppercase tracking-wider sortable cursor-pointer hover:text-secondary transition-colors duration-200"
                      key={`Column: ${column.name}`}
                      data-column={column.dataColumn}
                      style={{ width: columnWidth }}
                    >
                      {column.name}
                    </th>
                  );
                })}
              {/* Add reaction icons header when custom columns are used */}
              {columns && enableReactionIcons && (
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-inverse uppercase tracking-wider"
                  style={{ width: "60px" }}
                >
                  {/* Empty header - reaction icons are self-explanatory */}
                </th>
              )}
            </tr>
          </thead>
        )}
        {!loading && filteredData && (
          <tbody>
            {filteredData.sort(sortFunction).map((fact) => {
              // TODO: think of a better way to combine disabled and category styles
              let trClassName = "hover:bg-secondary";
              if (
                disabledIds?.includes(
                  factName == "snippet"
                    ? (fact as InsightEvidence).summary_id
                    : (fact.id ?? -1),
                )
              ) {
                trClassName += " bg-tertiary opacity-50";
              }
              let trOnClick: React.MouseEventHandler<
                HTMLTableRowElement
              > = (): boolean => true;
              if (
                selectRows &&
                !disabledIds?.includes(
                  factName == "snippet"
                    ? (fact as InsightEvidence).summary_id
                    : (fact.id ?? -1),
                )
              ) {
                /**
                 * Select the row when the <tr> is clicked.
                 */
                trOnClick = () => {
                  toggleSelectedFacts(fact);
                };
              }
              return (
                <React.Fragment key={`${factName} #${fact.id}`}>
                  <tr
                    className={`${trClassName} border-b border-secondary last:border-b-0 hover:bg-secondary transition-colors duration-200 reaction-table-row overflow-visible`}
                    onClick={trOnClick}
                  >
                    <td
                      className="px-4 py-3 whitespace-nowrap"
                      style={{ width: "40px" }}
                    >
                      <input
                        type="checkbox"
                        name="selectedFact"
                        checked={
                          selectedFacts &&
                          selectedFacts.map((f) => f.id).includes(fact.id)
                        }
                        onChange={() => {
                          if (!selectRows) {
                            return toggleSelectedFacts(fact);
                          }
                        }}
                        disabled={disabledIds?.includes(
                          factName == "snippet"
                            ? (fact as InsightEvidence).summary_id
                            : (fact.id ?? -1),
                        )}
                        className="rounded border-primary text-primary focus:ring-primary"
                      />
                    </td>
                    {/* Only show hardcoded columns if no columns prop is provided */}
                    {!columns && (
                      <>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary font-mono">
                          {(() => {
                            // Handle different data structures for different fact types
                            let dateToShow = null;

                            if (fact.updated_at) {
                              dateToShow = fact.updated_at;
                            } else if (
                              (fact as Insight).childInsight?.updated_at
                            ) {
                              dateToShow = (fact as Insight).childInsight
                                .updated_at;
                            } else if (
                              (fact as Insight).parentInsight?.updated_at
                            ) {
                              dateToShow = (fact as Insight).parentInsight
                                .updated_at;
                            } else if ((fact as LinkType).snippet?.updated_at) {
                              dateToShow = (fact as LinkType).snippet
                                .updated_at;
                            }

                            return dateToShow
                              ? new Date(dateToShow).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "2-digit",
                                    day: "2-digit",
                                    year: "numeric",
                                  },
                                )
                              : "---";
                          })()}
                        </td>
                        <td className="px-4 py-3 text-sm text-primary font-medium relative reaction-cell-container">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              {!selectRows &&
                                (() => {
                                  // Handle different data structures for different fact types
                                  let titleToShow = null;
                                  let uidToUse = null;

                                  if (fact.title && fact.uid) {
                                    titleToShow = fact.title;
                                    uidToUse = fact.uid;
                                  } else if (
                                    (fact as Insight).childInsight?.title &&
                                    (fact as Insight).childInsight?.uid
                                  ) {
                                    titleToShow = (fact as Insight).childInsight
                                      .title;
                                    uidToUse = (fact as Insight).childInsight
                                      .uid;
                                  } else if (
                                    (fact as Insight).parentInsight?.title &&
                                    (fact as Insight).parentInsight?.uid
                                  ) {
                                    titleToShow = (fact as Insight)
                                      .parentInsight.title;
                                    uidToUse = (fact as Insight).parentInsight
                                      .uid;
                                  } else if (
                                    (fact as LinkType).snippet?.title &&
                                    (fact as LinkType).snippet?.uid
                                  ) {
                                    titleToShow = (fact as LinkType).snippet
                                      .title;
                                    uidToUse = (fact as LinkType).snippet.uid;
                                  }

                                  if (titleToShow && uidToUse) {
                                    return factName === "snippet" ? (
                                      <Link
                                        href={`/links/${uidToUse}`}
                                        className="text-primary hover:text-primary-600 transition-colors duration-200"
                                      >
                                        {titleToShow}
                                      </Link>
                                    ) : (
                                      <Link
                                        href={`/insights/${uidToUse}`}
                                        className="text-primary hover:text-primary-600 transition-colors duration-200"
                                      >
                                        {titleToShow}
                                      </Link>
                                    );
                                  }
                                  return null;
                                })()}
                              {selectRows &&
                                (() => {
                                  // Handle different data structures for selectRows
                                  if (fact.title) return fact.title;
                                  if ((fact as Insight).childInsight?.title)
                                    return (fact as Insight).childInsight.title;
                                  if ((fact as Insight).parentInsight?.title)
                                    return (fact as Insight).parentInsight
                                      .title;
                                  if ((fact as LinkType).snippet?.title)
                                    return (fact as LinkType).snippet.title;
                                  return null;
                                })()}
                              {/* FIXME: updates several times until reactions is an empty array */}
                              <span className="ml-2 text-muted">
                                {fact.reactions &&
                                  fact.reactions
                                    .map((r) => r.reaction)
                                    .join("")}
                              </span>
                            </div>
                            {cellActions && (
                              <div className="flex items-center space-x-1 ml-2">
                                {cellActions.map((action, index) => {
                                  const isEnabled = action.enabled
                                    ? action.enabled(fact)
                                    : true;
                                  return (
                                    <button
                                      key={`${action.label}-${fact.id}-${index}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (isEnabled) {
                                          action.onClick(fact);
                                        }
                                      }}
                                      className={`btn btn-icon btn-sm ${
                                        isEnabled
                                          ? "btn-ghost text-text-secondary hover:text-text-primary hover:bg-background-secondary"
                                          : "btn-ghost text-text-tertiary opacity-50 cursor-not-allowed"
                                      }`}
                                      disabled={!isEnabled}
                                      aria-label={action.label}
                                      title={action.label}
                                    >
                                      {action.icon}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                            {enableReactionIcons && loggedIn && (
                              <ReactionIcon
                                reactions={fact.reactions || []}
                                currentUserId={getCurrentUserId()}
                                onReactionSubmit={async (reaction) => {
                                  if (token) {
                                    // Handle different data structures
                                    let insightId: number | undefined;
                                    let summaryId: number | undefined;

                                    if (
                                      factName === "childInsights" &&
                                      (fact as Insight).childInsight
                                    ) {
                                      // For child insights, use the childInsight.id
                                      insightId = (fact as Insight).childInsight
                                        .id;
                                      summaryId = undefined; // Child insights don't have summary_id
                                    } else if (
                                      factName === "parentInsights" &&
                                      (fact as Insight).parentInsight
                                    ) {
                                      // For parent insights, use the parentInsight.id
                                      insightId = (fact as Insight)
                                        .parentInsight.id;
                                      summaryId = undefined; // Parent insights don't have summary_id
                                    } else if (factName === "insight") {
                                      // For main page insights, use fact.id as insight_id
                                      insightId = fact.id;
                                      summaryId = undefined; // Main insights don't have summary_id
                                    } else {
                                      // For regular insights and evidence
                                      insightId = fact.insight_id;
                                      summaryId = fact.summary_id;
                                    }

                                    const result = await submitReaction(
                                      {
                                        reaction,
                                        summary_id: summaryId,
                                        insight_id: insightId,
                                      },
                                      token,
                                    );
                                    if (result) {
                                      // Remove any existing reaction from this user for this fact
                                      const existingReactions =
                                        fact.reactions?.filter(
                                          (r) => r.user_id !== result.user_id,
                                        ) || [];
                                      fact.reactions = [
                                        ...existingReactions,
                                        result as FactReaction,
                                      ];
                                      setData([...data!]);
                                    }
                                  }
                                }}
                                className="reaction-icon-cell"
                              />
                            )}
                          </div>
                        </td>
                      </>
                    )}
                    {columns &&
                      columns.map((column) => {
                        // Set specific widths for common columns to match headers
                        let columnWidth = "auto";
                        if (column.name === "Updated") {
                          columnWidth = "120px";
                        } else if (column.name === "Title") {
                          columnWidth = "1fr";
                        } else if (column.name === "🌍") {
                          columnWidth = "80px";
                        } else if (
                          column.name === "👨‍👩‍👧‍👦" ||
                          column.name === "👶" ||
                          column.name === "📄" ||
                          column.name === "💬" ||
                          column.name === "❤️"
                        ) {
                          columnWidth = "80px";
                        }

                        return (
                          <td
                            className={`px-4 py-3 whitespace-nowrap text-sm text-secondary ${
                              column.name === "Title"
                                ? "text-left"
                                : "text-center"
                            }`}
                            key={`Table column: ${column.name}`}
                            style={{ width: columnWidth }}
                          >
                            {column.display && column.display(fact)}
                          </td>
                        );
                      })}
                    {/* Add reaction icons column when custom columns are used */}
                    {columns && enableReactionIcons && loggedIn && (
                      <td
                        className="px-4 py-3 whitespace-nowrap text-sm text-secondary text-center reaction-cell-container"
                        style={{ width: "60px" }}
                      >
                        {(() => {
                          console.log("Rendering reaction column for fact:", {
                            factId: fact.id,
                            factTitle: fact.title,
                            hasReactions: !!fact.reactions,
                            reactionsCount: fact.reactions?.length || 0,
                            reactions: fact.reactions,
                            fullFact: fact,
                          });
                          return null;
                        })()}
                        <ReactionIcon
                          reactions={fact.reactions || []}
                          currentUserId={(() => {
                            const userId = getCurrentUserId();
                            console.log("getCurrentUserId result:", {
                              userId,
                              userIdType: typeof userId,
                              token: token ? "present" : "missing",
                              loggedIn,
                            });
                            return userId;
                          })()}
                          onReactionSubmit={async (reaction) => {
                            if (token) {
                              // Handle different data structures
                              let insightId: number | undefined;
                              let summaryId: number | undefined;

                              if (
                                factName === "childInsights" &&
                                (fact as Insight).childInsight
                              ) {
                                // For child insights, use the childInsight.id
                                insightId = (fact as Insight).childInsight.id;
                                summaryId = undefined; // Child insights don't have summary_id
                              } else if (
                                factName === "parentInsights" &&
                                (fact as Insight).parentInsight
                              ) {
                                // For parent insights, use the parentInsight.id
                                insightId = (fact as Insight).parentInsight.id;
                                summaryId = undefined; // Parent insights don't have summary_id
                              } else if (
                                factName === "snippet" &&
                                (fact as Fact).summary_id
                              ) {
                                // For snippets/evidence, use the summary_id
                                insightId = undefined;
                                summaryId = (fact as Fact).summary_id;
                              } else {
                                // For regular insights, use the fact.id
                                insightId = fact.id;
                                summaryId = undefined;
                                console.log(
                                  "Main page insight reaction submission:",
                                  {
                                    factName,
                                    factId: fact.id,
                                    insightId,
                                    summaryId,
                                    factTitle: fact.title,
                                  },
                                );
                              }

                              try {
                                const response = await fetch("/api/reactions", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                    "x-access-token": token,
                                  },
                                  body: JSON.stringify({
                                    insight_id: insightId,
                                    summary_id: summaryId,
                                    reaction: reaction,
                                  }),
                                });

                                if (response.ok) {
                                  // Refresh the data to show the new reaction
                                  const currentUserId = getCurrentUserId();
                                  if (!currentUserId) return; // Don't update if no user ID

                                  console.log(
                                    "Reaction submitted successfully, updating data:",
                                    {
                                      factId: fact.id,
                                      currentUserId,
                                      reaction,
                                      dataLength: data?.length,
                                    },
                                  );

                                  const updatedData = data?.map((f) => {
                                    console.log("Checking fact for update:", {
                                      factId: f.id,
                                      targetFactId: fact.id,
                                      matches: f.id === fact.id,
                                      factTitle: f.title,
                                      targetFactTitle: fact.title,
                                    });

                                    if (f.id === fact.id) {
                                      // Remove any existing reaction from this user
                                      const existingReactions = (
                                        f.reactions || []
                                      ).filter(
                                        (r) => r.user_id !== currentUserId,
                                      );

                                      const newFact = {
                                        ...f,
                                        reactions: [
                                          ...existingReactions,
                                          {
                                            id: Date.now(), // Temporary ID
                                            reaction: reaction,
                                            user_id: currentUserId,
                                          },
                                        ],
                                      };

                                      console.log("Updated fact:", {
                                        id: newFact.id,
                                        title: newFact.title,
                                        reactions: newFact.reactions,
                                      });

                                      return newFact;
                                    }
                                    return f;
                                  });
                                  setData(updatedData);
                                  console.log(
                                    "Data updated, new length:",
                                    updatedData?.length,
                                  );
                                }
                              } catch (error) {
                                console.error(
                                  "Error submitting reaction:",
                                  error,
                                );
                              }
                            }
                          }}
                        />
                      </td>
                    )}
                  </tr>
                  {enableFeedback && (
                    <>
                      <tr>
                        <td
                          colSpan={columns ? columns.length + 1 : 3}
                          className="bg-secondary text-sm p-2"
                        >
                          <div className="flex justify-around w-full m-4">
                            {!enableReactionIcons && (
                              <FeedbackLink
                                actionVerb="React"
                                icon="😲"
                                setOnClickFunction={() => {
                                  if (loggedIn) {
                                    const newIsEditing = {} as EditingForFact;
                                    newIsEditing[fact.id!] = true;
                                    setIsEditingReactionForFact({
                                      ...isEditingReactionForFact,
                                      ...newIsEditing,
                                    });
                                  } else {
                                    confirmAndRegister();
                                  }
                                }}
                              />
                            )}
                            <FeedbackLink
                              actionVerb="Comment"
                              icon="💬"
                              setOnClickFunction={() => {
                                if (loggedIn) {
                                  const newIsEditing = {} as EditingForFact;
                                  newIsEditing[fact.id!] = true;
                                  setIsEditingCommentForFact({
                                    ...isEditingCommentForFact,
                                    ...newIsEditing,
                                  });
                                } else {
                                  confirmAndRegister();
                                }
                              }}
                            />
                          </div>
                          <div>
                            {!enableReactionIcons &&
                              loggedIn &&
                              isEditingReactionForFact[fact.id!] && (
                                <FeedbackInputElement
                                  actionType="reaction"
                                  submitFunc={(reaction) => {
                                    if (token) {
                                      return submitReaction(
                                        {
                                          reaction,
                                          // FIXME: update this submitReaction logic
                                          summary_id: fact.summary_id,
                                          insight_id: fact.insight_id,
                                        },
                                        token,
                                      );
                                    }
                                    return Promise.resolve();
                                  }}
                                  afterSubmit={(newObject) => {
                                    if (newObject) {
                                      if (!fact.reactions) {
                                        fact.reactions = [];
                                      }
                                      fact.reactions = [
                                        ...fact.reactions.filter(
                                          (r) => r.user_id != newObject.user_id,
                                        ),
                                        newObject as FactReaction,
                                      ];
                                      setData([...data!]);
                                    }
                                  }}
                                  closeFunc={() => {
                                    const newIsEditing = {} as EditingForFact;
                                    newIsEditing[fact.id!] = false;
                                    setIsEditingReactionForFact({
                                      ...isEditingReactionForFact,
                                      ...newIsEditing,
                                    });
                                  }}
                                />
                              )}
                            {loggedIn && isEditingCommentForFact[fact.id!] && (
                              <FeedbackInputElement
                                actionType="comment"
                                submitFunc={(comment) => {
                                  if (token) {
                                    return submitComment(
                                      {
                                        comment,
                                        summary_id: fact.summary_id,
                                        insight_id: fact.insight_id,
                                      },
                                      token,
                                    );
                                  }
                                  return Promise.resolve();
                                }}
                                afterSubmit={(newObject) => {
                                  if (newObject) {
                                    if (!fact.comments) {
                                      fact.comments = [];
                                    }
                                    fact.comments = [
                                      ...fact.comments,
                                      newObject,
                                    ];
                                    setData([...data!]);
                                  }
                                }}
                                closeFunc={() => {
                                  const newIsEditing = {} as EditingForFact;
                                  newIsEditing[fact.id!] = false;
                                  setIsEditingCommentForFact({
                                    ...isEditingCommentForFact,
                                    ...newIsEditing,
                                  });
                                }}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        {fact.comments && fact.comments.length > 0 && (
                          <td
                            colSpan={columns ? columns.length + 1 : 3}
                            className="bg-secondary text-sm"
                          >
                            <div className="p-2">
                              <ul className="m-1 pl-4 list-none">
                                {fact.comments.map((comment, idx) => (
                                  <li key={idx}>
                                    <Comment
                                      comment={comment}
                                      removeCommentFunc={(id) => {
                                        if (!fact.comments) {
                                          fact.comments = [];
                                        }
                                        fact.comments =
                                          fact.comments.filter(
                                            (c) => c.id != id,
                                          ) ?? [];
                                        setData([...data!]);
                                      }}
                                    />
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </td>
                        )}
                      </tr>
                    </>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        )}
        {!filteredData && !loading && (
          <tbody>
            <tr>
              <td
                colSpan={columns ? columns.length + 1 : 3}
                className="px-4 py-12 text-center text-tertiary"
              >
                <strong>Loading data...</strong>
              </td>
            </tr>
          </tbody>
        )}
        {filteredData &&
          filteredData.length === 0 &&
          dataFilter &&
          dataFilter.trim() !== "" && (
            <tbody>
              <tr>
                <td
                  colSpan={columns ? columns.length + 1 : 3}
                  className="px-4 py-12 text-center text-tertiary"
                >
                  <div>
                    <div className="text-lg mb-2">🔍</div>
                    <div>
                      <strong>
                        No results found for &quot;{dataFilter}&quot;
                      </strong>
                    </div>
                    <div className="text-sm mt-1">
                      Try a different search term
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          )}
        {filteredData &&
          filteredData.length === 0 &&
          (!dataFilter || dataFilter.trim() === "") && (
            <tbody>
              <tr>
                <td
                  colSpan={columns ? columns.length + 1 : 3}
                  className="px-4 py-12 text-center text-tertiary"
                >
                  <div>
                    <div className="text-lg mb-2">📝</div>
                    <div>
                      <strong>No items yet</strong>
                    </div>
                    <div className="text-sm mt-1">
                      Add some items to get started
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          )}
      </table>
    </div>
  );
};

export default FactsTable;
