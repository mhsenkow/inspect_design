import { Insight, InsightEvidence } from "../../types";
import { createInsights, modifyInsight } from "../InsightsAPI";
import {
  addChildrenToInsight,
  addCitationsToInsight,
  createInsightFromCitations,
} from "../SelectedCitationsAPI";

jest.mock("../../components/InsightsAPI");

describe("SelectedCitationsAPI", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create an insight from summaries", async () => {
    const summaries = [{ summary_id: "1" }, { summary_id: "2" }];
    const token = "test-token";
    const insightTitle = "Test Insight";
    const mockCreateInsight = createInsights as jest.Mock;
    mockCreateInsight.mockResolvedValue([
      {
        action: 1,
        facts: [{ title: insightTitle }],
      },
    ]);

    const result = await createInsightFromCitations(
      insightTitle,
      summaries as unknown as InsightEvidence[],
      token,
    );

    expect(mockCreateInsight).toHaveBeenCalledWith(
      {
        insights: [
          {
            title: insightTitle,
            evidence: [{ summary_id: "1" }, { summary_id: "2" }],
          },
        ],
      },
      token,
    );
    expect(result).toEqual({ action: 1, facts: [{ title: insightTitle }] });
  });

  it("should add links to an existing insight", async () => {
    const snippets = [
      { summary_id: 1 },
      { summary_id: 2 },
    ] as InsightEvidence[];
    const token = "test-token";
    const insight = { uid: "insight-uid" } as Insight;
    const mockModifyInsight = modifyInsight as jest.Mock;
    mockModifyInsight.mockResolvedValue({ action: 0, facts: [insight] });
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(snippets),
    });

    const result = await addCitationsToInsight(
      { insight, evidence: snippets },
      token,
    );

    expect(global.fetch).toHaveBeenCalledWith("/api/evidence", {
      body: JSON.stringify({
        evidence: [{ summary_id: 1 }, { summary_id: 2 }],
      }),
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      method: "POST",
    });
    expect(result).toEqual({ action: 1, facts: snippets });
  });

  it("should add children to an existing insight", async () => {
    const token = "test-token";
    const insight = { uid: "insight-uid", title: "Parent Insight" } as Insight;
    const childrenInsights = [
      { id: 1, title: "Child Insight 1" },
      { id: 2, title: "Child Insight 2" },
    ] as Insight[];
    const mockModifyInsight = modifyInsight as jest.Mock;
    mockModifyInsight.mockResolvedValue({ action: 0, facts: [insight] });
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve(
          childrenInsights.map((c) => ({
            childInsight: c,
          })),
        ),
    });

    const result = await addChildrenToInsight(
      { parentInsight: insight, children: childrenInsights },
      token,
    );
    expect(global.fetch).toHaveBeenCalledWith("/api/children", {
      body: JSON.stringify({
        children: [{ child_id: 1 }, { child_id: 2 }],
      }),
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      method: "POST",
    });
    expect(result).toEqual({
      action: 1,
      facts: childrenInsights.map((i) => ({ childInsight: i })),
    });
  });
});
