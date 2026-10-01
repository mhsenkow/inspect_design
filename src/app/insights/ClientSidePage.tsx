"use client";

import styles from "../../styles/components/main-insights-page.module.css";
import React, { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  FLVResponse,
  Insight,
  InsightEvidence,
  User,
} from "../types";
import useUser from "../hooks/useUser";
import SaveLinkDialog, {
  ServerFunctionInputSchemaForSavedLinks,
} from "../components/SaveLinkDialog";
import CreateInsightDialog from "../components/CreateInsightDialog";
import FloatingActionMenu from "../components/FloatingActionMenu";
import CurrentUserContext from "../contexts/CurrentUserContext";
import { createLink } from "../hooks/functions";
import { createInsights } from "../components/InsightsAPI";
import {
  addCitationsToInsight,
  createInsightFromCitations,
} from "../components/SelectedCitationsAPI";
import HybridRadialNetwork from "../components/HybridRadialNetwork";

type ViewMode = "list" | "network";

const ClientSidePage = ({
  insights,
  currentUser,
}: {
  insights: Insight[];
  currentUser: User | null;
}): React.JSX.Element => {
  const router = useRouter();
  const { token } = useUser();
  const [liveData, setLiveData] = useState(insights);
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSaveLinkDialogOpen, setIsSaveLinkDialogOpen] = useState(false);

  const handleCreateInsight = useCallback(
    async (title: string) => {
      if (!token) {
        throw new Error("Please log in to create an insight.");
      }

      const responses = await createInsights(
        {
          insights: [{ title, citations: [] } as unknown as Insight],
        },
        token,
      );
      const newInsights = responses.flatMap((r) => r.facts as Insight[]);
      setLiveData((prev) => [...newInsights, ...prev]);

      const created = newInsights[0];
      if (created?.uid) {
        router.push(`/insights/${created.uid}`);
        return;
      }

      router.refresh();
    },
    [token, router],
  );

  const createLinkAndAddToInsights = useCallback(
    async (input: ServerFunctionInputSchemaForSavedLinks): Promise<void> => {
      if (!token) {
        throw new Error("Authentication token is required");
      }

      const responses: FLVResponse[] = [];
      const link = await createLink(input.url!, token);

      if (input.newInsightName) {
        const response = await createInsightFromCitations(
          input.newInsightName,
          [{ summary_id: link.id } as InsightEvidence],
          token,
        );
        responses.push(response);
      }

      if (input.selectedInsights && input.selectedInsights.length > 0) {
        await Promise.all(
          input.selectedInsights.map(async (insight) => {
            await addCitationsToInsight(
              {
                insight,
                evidence: [{ summary_id: link.id } as InsightEvidence],
              },
              token,
            );
            responses.push({ action: 0, facts: [insight] });
          }),
        );
      }

      responses.forEach((response) => {
        if (response.action === 1) {
          setLiveData((prev) => [...(response.facts as Insight[]), ...prev]);
        } else if (response.action === 0) {
          setLiveData((prev) =>
            prev.map((insight) => {
              const updated = response.facts.find(
                (f) => f.uid === insight.uid,
              ) as Insight | undefined;
              return updated ? { ...insight, ...updated } : insight;
            }),
          );
        }
      });

      router.refresh();
    },
    [token, router],
  );

  const filteredInsights = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return liveData;
    return liveData.filter((insight) =>
      (insight.title || "").toLowerCase().includes(q),
    );
  }, [liveData, query]);

  const loggedIn = !!currentUser;

  return (
    <div
      className={`${styles.pageContainer} ${
        viewMode === "network" ? styles.pageContainerNetwork : ""
      }`}
    >
      <div className={styles.mainContent}>
        <header className={styles.pageIntro}>
          <div className={styles.pageIntroText}>
            <p className={styles.pageEyebrow}>Workspace</p>
            <h1 className={styles.pageTitle}>My Insights</h1>
            <p className={styles.pageSubtitle}>
              {liveData.length === 0
                ? "Capture ideas, links, and evidence in one place."
                : `${liveData.length} insight${liveData.length === 1 ? "" : "s"} ready to explore.`}
            </p>
          </div>

          <div className={styles.toolbar}>
            <div
              className={styles.viewToggle}
              role="group"
              aria-label="View mode"
            >
              <button
                type="button"
                className={`${styles.viewToggleBtn} ${viewMode === "list" ? styles.viewToggleBtnActive : ""}`}
                onClick={() => setViewMode("list")}
                aria-pressed={viewMode === "list"}
              >
                List
              </button>
              <button
                type="button"
                className={`${styles.viewToggleBtn} ${viewMode === "network" ? styles.viewToggleBtnActive : ""}`}
                onClick={() => setViewMode("network")}
                aria-pressed={viewMode === "network"}
              >
                Network
              </button>
            </div>

            <div className={styles.toolbarSearchRow}>
              <label className={styles.searchField}>
                <span className={styles.srOnly}>Search insights</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search insights…"
                  className={styles.searchInput}
                />
              </label>
            </div>
          </div>
        </header>

        <CurrentUserContext.Provider value={currentUser}>
          {viewMode === "list" ? (
            <section className={styles.listSection} aria-label="Insights list">
              {filteredInsights.length === 0 ? (
                <div className={styles.emptyState}>
                  <h2 className={styles.emptyTitle}>
                    {query ? "No matches" : "No insights yet"}
                  </h2>
                  <p className={styles.emptyCopy}>
                    {query
                      ? "Try a different search, or clear the filter."
                      : loggedIn
                        ? "Tap + to create an insight or save a link."
                        : "Log in to start building your insight network."}
                  </p>
                  {query && (
                    <button
                      type="button"
                      className={styles.emptyAction}
                      onClick={() => setQuery("")}
                    >
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                <ul className={styles.insightGrid}>
                  {filteredInsights.map((insight) => {
                    const citationCount = insight.evidence?.length ?? 0;
                    const childCount = insight.children?.length ?? 0;
                    return (
                      <li key={insight.uid || insight.id} className={styles.insightCard}>
                        <Link
                          href={`/insights/${insight.uid}`}
                          className={styles.insightCardLink}
                        >
                          <div className={styles.insightCardBody}>
                            <h2 className={styles.insightCardTitle}>
                              {insight.title || "Untitled insight"}
                            </h2>
                            {insight.description && (
                              <p className={styles.insightCardDesc}>
                                {insight.description}
                              </p>
                            )}
                          </div>
                          <div className={styles.insightCardMeta}>
                            <span>
                              {`${citationCount} citation${citationCount === 1 ? "" : "s"}`}
                            </span>
                            <span>
                              {`${childCount} child${childCount === 1 ? "" : "ren"}`}
                            </span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ) : (
            <section className={styles.networkSection} aria-label="Insights network">
              <HybridRadialNetwork
                data={filteredInsights}
                crossLinks={[]}
              />
            </section>
          )}

          {loggedIn && (
            <FloatingActionMenu
              actions={[
                {
                  id: "create",
                  label: "Create insight",
                  icon: (
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path
                        d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z"
                        fill="currentColor"
                      />
                    </svg>
                  ),
                  onClick: () => setIsCreateDialogOpen(true),
                },
                {
                  id: "save-link",
                  label: "Save link",
                  icon: (
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path
                        d="M10 13a5 5 0 0 0 7.54.54l1.92-1.92a5 5 0 0 0-7.07-7.07L10.7 6.2"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M14 11a5 5 0 0 0-7.54-.54L4.54 12.38a5 5 0 0 0 7.07 7.07L13.3 17.8"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ),
                  onClick: () => setIsSaveLinkDialogOpen(true),
                },
              ]}
            />
          )}

          <CreateInsightDialog
            isOpen={isCreateDialogOpen}
            onClose={() => setIsCreateDialogOpen(false)}
            onCreate={handleCreateInsight}
          />

          <SaveLinkDialog
            id="save-link-dialog"
            isOpen={isSaveLinkDialogOpen}
            onClose={() => setIsSaveLinkDialogOpen(false)}
            potentialInsightsFromServer={liveData.filter((insight) => {
              const ownerId =
                insight.user_id ??
                (insight as Insight & { userId?: number }).userId;
              return ownerId === currentUser?.id;
            })}
            onSubmit={createLinkAndAddToInsights}
          />
        </CurrentUserContext.Provider>
      </div>
    </div>
  );
};

export default ClientSidePage;
