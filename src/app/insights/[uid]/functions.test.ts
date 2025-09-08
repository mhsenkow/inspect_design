import {
  createInsightFromCitations,
  addCitationsToInsight,
} from "../../components/SelectedCitationsAPI";
import { addChildrenToInsight } from "../../components/SelectedCitationsAPI";
import { createInsights } from "../../components/InsightsAPI";

import {
  showAddLinksAsEvidenceDialog,
  showAddChildInsightsDialog,
  openAddCitationsToOtherInsightsDialog,
  getShowConfirmationFunction,
  doDeleteInsightCitations,
  doAddCitationsToOtherInsights,
  doDeleteInsightChildren,
  showAddParentInsightsDialog,
  doAddParentInsights,
  doDeleteParentInsights,
  potentialInsightsWithoutLoops,
  doAddCitationsToOtherInsightsSchema,
  doAddParentInsightsSchema,
} from "./functions";
import {
  ADD_CITATIONS_TO_OTHER_INSIGHTS_DIALOG_ID,
  ADD_LINKS_AS_EVIDENCE_DIALOG_ID,
  ADD_PARENT_INSIGHTS_DIALOG_ID,
} from "./ClientSidePage";
import { Insight, InsightEvidence, InsightLink } from "../../types";

jest.mock("../../components/SelectedCitationsAPI", () => ({
  addChildrenToInsight: jest.fn(),
  addCitationsToInsight: jest.fn(),
  createInsightFromCitations: jest.fn(),
}));
jest.mock("../../components/InsightsAPI", () => ({
  createInsights: jest.fn(),
}));

describe("Dialog functions", () => {
  beforeEach(() => {
    document.body.innerHTML = `
    <dialog id="${ADD_LINKS_AS_EVIDENCE_DIALOG_ID}"></dialog>
    <dialog id="addChildInsightsDialog"></dialog>
    <dialog id="${ADD_CITATIONS_TO_OTHER_INSIGHTS_DIALOG_ID}"></dialog>
    <dialog id="${ADD_PARENT_INSIGHTS_DIALOG_ID}"></dialog>
  `;
    HTMLDialogElement.prototype.showModal = jest.fn();
  });

  it("showAddLinksAsEvidenceDialog shows the dialog", () => {
    showAddLinksAsEvidenceDialog();
    expect(
      (
        document.getElementById(
          ADD_LINKS_AS_EVIDENCE_DIALOG_ID,
        ) as HTMLDialogElement
      ).showModal,
    ).toHaveBeenCalled();
  });

  it("showAddChildInsightsDialog shows the dialog", () => {
    showAddChildInsightsDialog();
    expect(
      (document.getElementById("addChildInsightsDialog") as HTMLDialogElement)
        .showModal,
    ).toHaveBeenCalled();
  });

  it("openAddCitationsToOtherInsightsDialog shows the dialog", () => {
    openAddCitationsToOtherInsightsDialog();
    expect(
      (
        document.getElementById(
          ADD_CITATIONS_TO_OTHER_INSIGHTS_DIALOG_ID,
        ) as HTMLDialogElement
      ).showModal,
    ).toHaveBeenCalled();
  });

  it("showAddParentInsightsDialog shows the dialog", () => {
    showAddParentInsightsDialog();
    expect(
      (
        document.getElementById(
          ADD_PARENT_INSIGHTS_DIALOG_ID,
        ) as HTMLDialogElement
      ).showModal,
    ).toHaveBeenCalled();
  });
});

describe("getShowConfirmationFunction", () => {
  it("calls setServerFunctionInput if confirmed", () => {
    global.confirm = jest.fn(() => true);
    const setServerFunctionInput = jest.fn();
    const fn = getShowConfirmationFunction(setServerFunctionInput);
    const selectedLinks = [{ id: 1 }];
    fn(selectedLinks as any);
    expect(setServerFunctionInput).toHaveBeenCalledWith(selectedLinks);
  });

  it("does not call setServerFunctionInput if not confirmed", () => {
    global.confirm = jest.fn(() => false);
    const setServerFunctionInput = jest.fn();
    const fn = getShowConfirmationFunction(setServerFunctionInput);
    fn([{ id: 1 }] as any);
    expect(setServerFunctionInput).not.toHaveBeenCalled();
  });
});

describe("doDeleteInsightCitationSnippets", () => {
  beforeEach(() => {
    global.fetch = jest.fn(() => Promise.resolve({})) as any;
  });

  it("calls fetch for each snippet and returns FLVResponse", async () => {
    const citations = [{ id: "a" }, { id: "b" }] as any;
    const token = "tok";
    const res = await doDeleteInsightCitations({ citations }, token);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(res).toEqual({ action: -1, facts: citations });
  });
});

describe("doAddCitationsToOtherInsights", () => {
  beforeEach(() => {
    (createInsightFromCitations as jest.Mock).mockResolvedValue({});
    (addCitationsToInsight as jest.Mock).mockResolvedValue({});
    global.fetch = jest.fn(() => Promise.resolve({})) as any;
  });

  it("creates new insight if newInsightName is provided", async () => {
    const params = {
      selectedCitations: [{ id: 1 }] as InsightEvidence[],
      citationsToRemove: [],
      selectedInsights: [],
      newInsightName: "New",
    };
    await doAddCitationsToOtherInsights(params, "tok");
    expect(createInsightFromCitations).toHaveBeenCalledWith(
      "New",
      params.selectedCitations,
      "tok",
    );
  });

  it("adds citations to selected insights", async () => {
    const params = {
      selectedCitations: [{ id: 1 }] as InsightEvidence[],
      citationsToRemove: [],
      selectedInsights: [{ id: 1 }],
      newInsightName: "",
    } as unknown as doAddCitationsToOtherInsightsSchema;
    await doAddCitationsToOtherInsights(params, "tok");
    expect(addCitationsToInsight).toHaveBeenCalledWith(
      {
        insight: params.selectedInsights[0],
        evidence: params.selectedCitations,
      },
      "tok",
    );
  });
});

describe("doDeleteInsightChildren", () => {
  beforeEach(() => {
    global.fetch = jest.fn(() => Promise.resolve({})) as any;
  });

  it("calls fetch and returns FLVResponse", async () => {
    const childrenInsights = [{ id: 1 }, { id: 2 }];
    const childrenLinks = childrenInsights.map((c, i) => ({
      id: i,
      child_id: c.id,
      parent_id: 1000,
    }));
    const token = "tok";
    const res = await doDeleteInsightChildren(childrenLinks, token);
    expect(global.fetch).toHaveBeenCalled();
    expect(res).toEqual({ action: -1, facts: childrenLinks });
  });
});

describe("doAddParentInsights", () => {
  beforeEach(() => {
    (addChildrenToInsight as jest.Mock).mockResolvedValue({});
    (createInsights as jest.Mock).mockResolvedValue([
      {
        facts: [{ id: 5 }],
      },
    ]);
  });

  it("adds children to existing insights", async () => {
    const params = {
      childInsight: { id: 1 },
      newParentInsights: [{ id: 2 }],
      newInsightName: "",
    } as unknown as doAddParentInsightsSchema;
    const mockReturnFlvFacts = [
      {
        child_id: 1,
        childInsight: { id: 1 },
        parent_id: 2,
        parentInsight: { id: 2 },
      },
    ];
    (addChildrenToInsight as jest.Mock).mockResolvedValueOnce({
      action: -1,
      facts: mockReturnFlvFacts,
    });

    const res = await doAddParentInsights(params, "tok");

    expect(addChildrenToInsight).toHaveBeenCalledWith(
      {
        parentInsight: params.newParentInsights[0],
        children: [params.childInsight],
      },
      "tok",
    );
    expect(res).toEqual([
      {
        action: 1,
        facts: mockReturnFlvFacts,
      },
    ]);
  });

  it("creates new parent insight if newInsightName is provided", async () => {
    const params = {
      childInsight: { id: 1 },
      newParentInsights: [],
      newInsightName: "Parent",
    } as unknown as doAddParentInsightsSchema;
    const mockReturnFlvFacts = [
      {
        child_id: 1,
        childInsight: { id: 1 },
        parent_id: 5,
        parentInsight: { id: 5 },
      },
    ] as InsightLink[];
    (addChildrenToInsight as jest.Mock).mockResolvedValueOnce({
      action: -1,
      facts: mockReturnFlvFacts,
    });

    const res = await doAddParentInsights(params, "tok");

    expect(createInsights).toHaveBeenCalledWith(
      { insights: [{ title: "Parent" }] },
      "tok",
    );
    expect(addChildrenToInsight).toHaveBeenCalledWith(
      { parentInsight: { id: 5 }, children: [params.childInsight] },
      "tok",
    );
    expect(res).toEqual([{ action: 1, facts: mockReturnFlvFacts }]);
  });
});

describe("doDeleteParentInsights", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
  });

  it("calls fetch for each parent insight and returns FLVResponse", async () => {
    const parentInsights = [{ id: 1 }, { id: 2 }] as Insight[];
    const parentLinks = parentInsights.map((i) => ({
      parentInsight: i,
    })) as InsightLink[];

    const token = "tok";
    const res = await doDeleteParentInsights(parentLinks, token);

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(res).toEqual({ action: -1, facts: parentInsights });
  });
});

describe("potentialInsightsWithoutLoops", () => {
  const insight = { id: 1 } as Insight;

  beforeEach(() => {
    insight.children = [];
  });

  it("filters out the specified insight", async () => {
    const potentialInsights = [{ id: 1 }] as unknown as Insight[];
    const result = potentialInsightsWithoutLoops(insight, potentialInsights);

    // Should exclude i1
    expect(result.map((i: any) => i.uid)).toEqual([]);
  });

  it("filters out insights that are children of the specified insight", async () => {
    const potentialInsights = [{ id: 2 }, { id: 3 }] as unknown as Insight[];
    insight.children = [
      {
        child_id: 2,
        parent_id: 0,
      },
    ];

    const resultingInsights = potentialInsightsWithoutLoops(
      insight,
      potentialInsights,
    );

    // Should exclude 2
    expect(resultingInsights).toEqual([{ id: 3 }]);
  });

  it("filter out insights that are parents of the specified insight", () => {
    const potentialInsights = [
      {
        id: 2,
        children: [{ child_id: 1, parent_id: 0 }],
      },
      { id: 3 },
    ] as unknown as Insight[];

    const result = potentialInsightsWithoutLoops(insight, potentialInsights);

    // Should exclude 2
    expect(result.map((i: any) => i.id)).toEqual([3]);
  });

  it("filters out insights that are parents of the specified insight's children", async () => {
    insight.children = [
      { child_id: 0, parent_id: 0, childInsight: { id: 3 } },
    ] as unknown as InsightLink[];
    const potentialInsights = [
      {
        id: 2,
        children: [{ child_id: 0, parent_id: 0, childInsight: { id: 3 } }],
      },
      { id: 3 },
    ] as unknown as Insight[];

    const result = potentialInsightsWithoutLoops(insight, potentialInsights);

    // Should exclude i2, i3
    expect(result.map((i: any) => i.uid)).toEqual([]);
  });
});
