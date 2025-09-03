"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { Fact, FactReaction, InsightEvidence } from "../types";
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
  theadTopCSS = "0px",
  enableFeedback = false,
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
  setDataFilter: React.Dispatch<React.SetStateAction<string>>;
  disabledIds?: number[];
  selectRows?: boolean;
  hideHead?: boolean;
  allowFeedback?: boolean;
  height?: string;
  theadTopCSS?: string;
  enableFeedback?: boolean;
}): React.JSX.Element => {
  const { token, loggedIn } = useUser();
  const [returnPath, setReturnPath] = useState<string>();
  useEffect(() => setReturnPath(window.location.pathname), []);

  const [loading, setLoading] = useState(false);
  const [fetchedDataFitler, setFetchedDataFilter] = useState<string>();

  useEffect(() => {
    if (
      queryFunction &&
      dataFilter != undefined &&
      dataFilter != fetchedDataFitler &&
      !loading
    ) {
      setLoading(true);
      debounce({
        func: async () => {
          const encodedDataFilter = encodeStringURI(dataFilter);
          const localData = await queryFunction(encodedDataFilter);
          setData(localData);
          setFetchedDataFilter(dataFilter);
          setLoading(false);
        },
        key: queryFunction.name,
      });
    }
  }, [
    dataFilter,
    fetchedDataFitler,
    loading,
    queryFunction,
    setData,
    setLoading,
  ]);

  const [filteredData, setFilteredData] = useState<Fact[]>();
  useEffect(() => {
    if (data) {
      setFilteredData(
        data.filter((fact) => {
          if (dataFilter != undefined && fact.title) {
            return fact.title // can't put ? here, so using `if` above
              .toLocaleLowerCase()
              .includes(dataFilter.toLocaleLowerCase());
          }
          return true;
        }),
      );
    }
  }, [data, dataFilter]);

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
    <div className="card">
      <div className="card-header">
        <h3 className="card-header-title">Data Table</h3>
      </div>
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
          <thead className="bg-primary border-b border-primary">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-inverse uppercase tracking-wider">
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
                  className="rounded border-inverse text-inverse focus:ring-inverse"
                />
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-inverse uppercase tracking-wider sortable cursor-pointer hover:text-secondary transition-colors duration-200">
                Updated
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-inverse uppercase tracking-wider">
                {/* search */}
                {setDataFilter && (
                  <input
                    type="text"
                    placeholder="Search the titles..."
                    className="w-full px-3 py-2 border border-inverse rounded-md focus:outline-none focus:ring-2 focus:ring-inverse focus:border-transparent text-sm bg-inverse text-primary"
                    value={dataFilter}
                    onChange={async (event) => {
                      setDataFilter(event.target.value.toLocaleLowerCase());
                    }}
                    onFocus={(event) => {
                      // TODO: can I get the ClientSidePage itself or something other than the button title?
                      if (
                        event.relatedTarget &&
                        event.relatedTarget.textContent == "Add Evidence"
                      ) {
                        event.target.blur();
                      }
                    }}
                  />
                )}
                {loading && <span className="text-sm text-tertiary">Loading...</span>}
              </th>
                          {columns &&
                columns.map((column) => (
                  <th
                    className="px-6 py-4 text-left text-xs font-medium text-inverse uppercase tracking-wider sortable cursor-pointer hover:text-secondary transition-colors duration-200"
                    key={`Column: ${column.name}`}
                    data-column={column.dataColumn}
                  >
                    {column.name}
                  </th>
                ))}
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
                <tr className={`${trClassName} border-b border-secondary last:border-b-0 hover:bg-secondary transition-colors duration-200`} onClick={trOnClick}>
                  <td className="px-6 py-4 whitespace-nowrap">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary font-mono">
                    {fact.updated_at &&
                      new Date(fact.updated_at).toLocaleDateString("en-US", {
                        month: "2-digit",
                        day: "2-digit",
                        year: "numeric",
                      })}
                    {!fact.updated_at && "---"}
                  </td>
                  <td className="px-6 py-4 text-sm text-primary font-medium">
                    {!selectRows &&
                      (factName == "snippet" ? (
                        <Link href={`/links/${fact.uid}`} className="text-primary hover:text-primary-600 transition-colors duration-200">{fact.title}</Link>
                      ) : (
                        <Link href={`/insights/${fact.uid}`} className="text-primary hover:text-primary-600 transition-colors duration-200">{fact.title}</Link>
                      ))}
                    {selectRows && fact.title}
                    {/* FIXME: updates several times until reactions is an empty array */}
                    <span className="ml-2 text-muted">
                      {fact.reactions &&
                        fact.reactions.map((r) => r.reaction).join("")}
                    </span>
                  </td>
                  {columns &&
                    columns.map((column) => (
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm text-secondary text-center"
                        key={`Table column: ${column.name}`}
                      >
                        {column.display && column.display(fact)}
                      </td>
                    ))}
                </tr>
                {enableFeedback && (
                  <>
                    <tr>
                      <td
                        colSpan={columns ? columns.length + 3 : 4}
                        className="bg-secondary text-sm p-2"
                      >
                        <div className="flex justify-around w-full m-4">
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
                          {loggedIn && isEditingReactionForFact[fact.id!] && (
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
                              directions="Select an emoji character"
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
                              directions="Enter a text comment"
                              afterSubmit={(newObject) => {
                                if (newObject) {
                                  if (!fact.comments) {
                                    fact.comments = [];
                                  }
                                  fact.comments = [...fact.comments, newObject];
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
                          colSpan={columns ? columns.length + 3 : 4}
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
      {!filteredData && (
        <tbody>
          <tr>
            <td>
              <strong>Loading data...</strong>
            </td>
          </tr>
        </tbody>
      )}
    </table>
    </div>
  );
};

export default FactsTable;
