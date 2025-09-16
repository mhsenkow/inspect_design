import { expect, Locator, Page } from "@playwright/test";
// import { Insight } from "../app/types";

const getRowUid = async (tableRow: Locator, urlPrefix: string) => {
  const href = await tableRow
    .locator("td")
    .nth(2)
    .locator("a")
    .getAttribute("href");
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
  await expect(page.getByText("Select an emoji character")).toBeVisible();
  await expect(page.getByText("Select an emoji character")).toHaveCount(1);

  const selectElement = page.locator("select").first();
  await expect(selectElement).toBeVisible();
  await expect(selectElement).toHaveCount(1);
  expect(await selectElement.evaluate((el) => el.tagName)).toBe("SELECT");
  await expect(selectElement).toHaveValue("😀");

  const submitButton = page.getByRole("button", { name: "Submit Reaction" });
  await expect(submitButton).toBeVisible();
  await expect(submitButton).toHaveCount(1);
  expect(await submitButton.evaluate((el) => el.tagName)).toBe("BUTTON");
  await expect(submitButton).toBeEnabled();
  submitButton.click();
  await expect(selectElement).toBeHidden();
};

const addRemoveComment = async (page: Page) => {
  const COMMENT_TEXT = "Test comment";
  const directionsP = page.getByText("Enter a text comment");
  expect(await directionsP.evaluate((el) => el.tagName)).toBe("P");
  await expect(directionsP).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(2); // the comment input and the search input
  const commentInput = page.getByRole("textbox").first();
  expect(await commentInput.evaluate((el) => el.tagName)).toBe("TEXTAREA");
  await expect(commentInput).toBeVisible();
  await expect(commentInput).toBeEnabled();
  await expect(commentInput).toBeEditable();
  await commentInput.fill(COMMENT_TEXT);

  const submitButton = page.getByRole("button", {
    name: "Submit",
  });
  await expect(submitButton).toBeVisible();
  await expect(submitButton).toBeEnabled();
  await submitButton.click();

  await expect(page.getByRole("textbox").filter({ visible: true })).toHaveCount(
    1,
  ); // just the search box

  const comments = page
    .locator(".comments")
    .locator(".comment")
    .filter({ hasText: COMMENT_TEXT, visible: true });
  await expect(comments).toHaveCount(1);

  await page.reload();

  const comments2 = page
    .locator(".comments")
    .locator(".comment")
    .filter({ hasText: COMMENT_TEXT, visible: true });
  expect(await comments2.count()).toBe(1);

  const deleteButtonLocator = comments2.first().locator("button", {
    hasText: "X",
  });
  await expect(deleteButtonLocator).toHaveCount(1);
  const deleteButton = deleteButtonLocator.first();
  await expect(deleteButton).toBeVisible();
  await expect(deleteButton).toBeEnabled();
  page.on("dialog", (dialog) => dialog.accept());
  await deleteButton.click();

  await expect(
    page
      .locator(".comments")
      .locator(".comment")
      .filter({ hasText: COMMENT_TEXT, visible: true }),
  ).toHaveCount(0);
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
  // FIXME: works in debug, not otherwise -- wait or something?
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

  const insightsTable = page.getByRole("table").first();
  const row = insightsTable
    .locator("tbody > tr")
    .filter({ hasText: newInsightName, visible: true }); // there's an invisible copy
  await expect(row).toBeVisible();
  const citationCount = row.locator("td").nth(5); // checkbox > updated > title > parents > children > evidence
  await expect(citationCount).toHaveText("1");
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
