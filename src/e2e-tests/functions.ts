import { expect, Locator, Page } from "@playwright/test";
// import { Insight } from "../app/types";

const getRowUid = async (tableRow: Locator, urlPrefix: string) => {
  const href =
    (await tableRow.getAttribute("href")) ??
    (await tableRow.locator("a").first().getAttribute("href"));
  const regex = new RegExp(`/${urlPrefix}/([a-z0-9]+)`);
  if (href) {
    const match = href.match(regex);
    if (match) {
      return match[1];
    }
  }
};

const getLinkUid = async (tableRow: Locator) => getRowUid(tableRow, "links");
const getInsightUid = async (tableRow: Locator) =>
  getRowUid(tableRow, "insights");

const addReactionFromFeedbackInputElement = async (page: Page) => {
  await expect(
    page.getByText(/^(Pick a reaction|Select an emoji character)$/),
  ).toBeVisible();

  const submitButton = page.getByRole("button", { name: "Submit Reaction" });
  await expect(submitButton).toBeVisible();
  await expect(submitButton).toHaveCount(1);
  expect(await submitButton.evaluate((el) => el.tagName)).toBe("BUTTON");
  await expect(submitButton).toBeEnabled();
  await submitButton.click();
  await expect(submitButton).toBeHidden();
};

const addRemoveComment = async (page: Page) => {
  const COMMENT_TEXT = "Test comment";
  const directionsP = page.getByText(
    /^(Write a short comment|Enter a text comment)$/,
  );
  expect(await directionsP.evaluate((el) => el.tagName)).toBe("P");
  await expect(directionsP).toBeVisible();
  const commentInput = page.getByRole("textbox", {
    name: "Comment Text Div",
  });
  await expect(commentInput).toBeVisible();
  await expect(commentInput).toBeEnabled();
  await expect(commentInput).toBeEditable();
  await commentInput.fill(COMMENT_TEXT);

  const submitButton = page.getByRole("button", {
    name: "Submit Comment",
  });
  await expect(submitButton).toBeVisible();
  await expect(submitButton).toBeEnabled();
  await submitButton.click();

  await expect(page.getByText(COMMENT_TEXT)).toBeVisible();

  await page.reload();

  await expect(page.getByText(COMMENT_TEXT)).toBeVisible();

  const deleteButton = page.getByRole("button", {
    name: "Delete Comment",
  });
  await expect(deleteButton).toBeVisible();
  await expect(deleteButton).toBeEnabled();
  page.on("dialog", (dialog) => dialog.accept());
  await deleteButton.click();

  await expect(page.getByText(COMMENT_TEXT)).toHaveCount(0);
};

const insightPageHasCitation = async (
  page: Page,
  insightTitle: string,
  citationTitle: string,
) => {
  await page.goto("http://localhost:3000/insights");
  await page.waitForURL("http://localhost:3000/insights");
  const insightsTable = page.getByRole("table").first();
  const insightRow = insightsTable
    .locator("tbody > tr")
    .filter({ hasText: insightTitle });
  await insightRow.locator("td").nth(2).locator("a").click();

  await page.waitForURL(/http:\/\/localhost:3000\/insights\/[a-z0-9]+/);

  await expect(page.getByRole("heading", { name: insightTitle })).toBeVisible();

  const citationsTable: Locator = page.locator("#body > table.facts-table");
  // TODO: works in debug, not otherwise -- wait or something?
  await expect(citationsTable).toBeVisible();
  const bodyTableRow = citationsTable
    .locator("tbody > tr")
    .filter({ hasText: citationTitle });
  return await bodyTableRow.isVisible();
};

const selectCitationToRemove = async (
  dialog: Locator,
  citationTitle: string,
) => {
  const dialogTableToRemoveSelections = dialog.getByRole("table").first();
  const removeSelectionsRow = dialogTableToRemoveSelections
    .locator("tr")
    .filter({ hasText: citationTitle });
  await removeSelectionsRow.locator("td").first().locator("input").click();
};

// const selectFirstEnabledPotentialInsight = async (
//   potentialInsightsTable: Locator,
// ): Promise<Insight> => {
//   let n = 0;
//   let isDisabled = false;
//   let row: Locator;
//   do {
//     row = potentialInsightsTable.locator("tbody > tr").nth(n);
//     isDisabled =
//       (await row.locator("td").first().locator("input").count()) == 0 ||
//       (await row.locator("td").first().locator("input").isDisabled());
//     n++;
//   } while (isDisabled);
//   await row.locator("td").first().locator("input").click();
//   const selectedInsight = {
//     title: (await row.locator("td").nth(2).innerText()).replace(
//       /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
//       "",
//     ), // https://edvins.io/how-to-strip-emojis-from-string-in-java-script
//     citationCount: parseInt(await row.locator("td").nth(3).innerText()),
//   } as Insight;
//   return selectedInsight;
// };

const selectTableRow = async (tableRow: Locator) => {
  await expect(tableRow.locator("td")).toHaveCount(3); // checkbox > date > title
  await tableRow.locator("td").nth(0).locator("input").click();
  return await tableRow.locator("td").nth(2).innerText();
};

const verifyNewInsightExists = async (page: Page, newInsightName: string) => {
  await page.goto("http://localhost:3000/insights");
  await page.waitForURL("http://localhost:3000/insights");

  const insightLink = page.getByRole("link", { name: newInsightName });
  await expect(insightLink).toBeVisible();
  await expect(insightLink).toContainText("1 citation");
};

export {
  getLinkUid,
  getInsightUid,
  addReactionFromFeedbackInputElement,
  addRemoveComment,
  insightPageHasCitation,
  selectCitationToRemove,
  // selectFirstEnabledPotentialInsight,
  selectTableRow,
  verifyNewInsightExists,
};
