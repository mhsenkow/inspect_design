import { test, expect, Locator } from "@playwright/test";
import { INSERT_LINK_DIALOG_ID } from "../app/constants";
import dotenv from "dotenv";
import pg from "pg";
const Client = pg.Client;
import { password, email } from "./constants";
import { Insight, Link } from "../app/types";
import {
  addReactionFromFeedbackInputElement,
  // getInsightUid,
  getLinkUid,
  insightPageHasCitation,
  selectCitationToRemove,
  // selectFirstEnabledPotentialInsight,
  selectTableRow,
  verifyNewInsightExists,
} from "./functions";
import { encodeStringURI } from "../app/hooks/functions";

let client: pg.Client;
let token: string;

// FIXME: get e2e tests working, starting with single insight page
test.describe("Insight page", () => {
  // TODO: perform tests as me, Test, and anonymous
  test.beforeAll(async ({ request }) => {
    dotenv.config({ path: "./.env", quiet: true });
    client = new Client({
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      database: "inspect",
    });
    await client.connect();
    const response = await request.post("http://localhost:3000/api/login", {
      data: { email, password },
    });
    const json = await response.json();
    token = json.token;
  });

  let insight: Insight | undefined;

  test.beforeEach(async ({ context, page }) => {
    await context.addCookies([
      {
        name: "token",
        value: encodeStringURI(token),
        url: "http://localhost:3000",
      },
    ]);

    const uid = Date.now().toString(36);
    insight = await client
      .query({
        text: `insert into insights
          (user_id, uid, title, created_at, updated_at)
          values ($1::integer, $2::text, $3::text, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          returning *`,
        values: [2, uid, "E2E test insight"],
      })
      .then((result: pg.QueryResult<Insight>) => result.rows[0]);

    await page.goto(`http://localhost:3000/insights/${insight!.uid}`);
    await page.waitForURL(`http://localhost:3000/insights/${insight!.uid}`);
    await expect(
      page.getByRole("heading", { name: insight!.title }),
    ).toBeVisible();
  });

  test.afterEach(async ({ context }) => {
    await context.clearCookies();
    await client.query(
      "delete from summaries where url = 'https://www.google.com'",
    );
    if (insight) {
      await client.query({
        text: "delete from insights where id = $1::integer",
        values: [insight!.id],
      });
      insight = undefined;
    }
  });

  test.describe("At the top of the insight", () => {
    test("user should see all of the content", async ({ page }) => {
      // alert
      const alert = page.locator(".alert").first();
      await expect(alert).toBeVisible();
      const possibleTextValuesRegex = /This insight is important because:/;
      await expect(alert).toContainText(possibleTextValuesRegex);
      const addParentButton = page.getByRole("button", {
        name: "Add a Parent Insight",
      });
      await expect(addParentButton).toBeVisible();

      // emoji && created ___ && insight 💭
      const sourceDiv = page.locator("#source");
      const emojiDiv = sourceDiv.locator("div").nth(0);
      await expect(emojiDiv).toBeVisible();
      await expect(emojiDiv).toHaveText("😲 (no reactions)");
      const createdDiv = sourceDiv.locator("div").nth(1);
      await expect(createdDiv).toBeVisible();
      await expect(createdDiv).toHaveText(
        /^Created|Updated [0-9] weeks|months|years ago/,
      );
      const logoDiv = sourceDiv.locator("div").nth(2);
      await expect(logoDiv).toBeVisible();
      await expect(logoDiv).toHaveText("💭 Insight");

      // {title}
      const titleHeader = page.getByText(insight!.title!).first();
      await expect(titleHeader).toBeVisible();

      // Children Insights (none)

      // 💬 12 💭 0 📄 51
      const titleFooter = page
        .getByRole("heading", { name: /📄 [0-9]+/ })
        .first();
      await expect(titleFooter).toBeVisible();

      // 😲 React
      const reactLink = page.getByText("😲 React").first();
      await expect(reactLink).toBeVisible();
      const reactLinkTagName = await reactLink.evaluate((el) => el.tagName);
      expect(reactLinkTagName.toLowerCase()).toBe("a");

      // 💬 Comment
      const commentLink = page.getByText("💬 Comment").first();
      await expect(commentLink).toBeVisible();
      const commentLinkTagName = await commentLink.evaluate((el) => el.tagName);
      expect(commentLinkTagName.toLowerCase()).toBe("a");

      // Comments (none)

      //  Evidence
      const evidenceHeader = page.getByText(/📄 Evidence \([0-9]+/);
      await expect(evidenceHeader).toBeVisible();
      const addEvidenceButton = page.getByRole("button", {
        name: "Add Evidence",
      });
      await expect(addEvidenceButton).toBeVisible();
      await expect(addEvidenceButton).toBeEnabled();
    });

    test("user can add a reaction", async ({ page }) => {
      const reactLink = page.getByText(/😲 React/).first();
      await expect(reactLink).toBeVisible();
      await reactLink.click();

      await addReactionFromFeedbackInputElement(page);

      const reactionsDiv = page.locator("div#source").locator("div").first();
      await expect(reactionsDiv).toHaveText(/😀$/);
    });

    test("user can add/remove a comment", async ({ page }) => {
      const commentLink = page.getByText(/💬 Comment/).first();
      await expect(commentLink).toBeVisible();
      await commentLink.click();

      // TODO: get the addRemoveComment function working
      // addRemoveComment(page);

      const COMMENT_TEXT = "Test comment for add/remove comment";
      const directionsP = page.getByText("Enter a text comment");
      expect(await directionsP.evaluate((el) => el.tagName)).toBe("P");
      await expect(directionsP).toBeVisible();
      const commentInput = page.getByRole("textbox", {
        name: "Comment Text Div",
      });
      await expect(commentInput).toBeVisible();
      await expect(commentInput).toBeEnabled();
      await expect(commentInput).toBeEditable();
      await commentInput.fill(COMMENT_TEXT);
      await expect(commentInput).toHaveText(COMMENT_TEXT);

      const submitButton = page.getByRole("button", {
        name: "Submit Comment",
      });
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeEnabled();
      await submitButton.click();

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

      const deleteButtonLocator = comments2
        .first()
        .locator("button[aria-label='Delete Comment']");
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
    });

    test("user can publish the insight", async ({ page }) => {
      const publishButton = page.getByRole("button", {
        name: "Publish Insight",
      });
      await expect(publishButton).toBeVisible();
      await expect(publishButton).toBeEnabled();
      page.on("dialog", (dialog) => dialog.accept());
      await publishButton.click();

      const logoDiv = page.locator("#source").locator("div").nth(2);
      await expect(logoDiv).toBeVisible();
      await expect(logoDiv).toHaveText(/🌎$/);

      await page.reload();
      await expect(logoDiv).toHaveText(/🌎$/);
    });

    test("user can delete the insight", async ({ page }) => {
      const deleteButton = page.getByRole("button", { name: "Delete Insight" });
      await expect(deleteButton).toBeVisible();
      await expect(deleteButton).toBeEnabled();
      page.on("dialog", (dialog) => dialog.accept());
      await deleteButton.click();

      await expect(page).toHaveURL(/(\/$|\/insights$)/);
    });

    test("user can add child insights", async ({ page }) => {
      const addChildButton = page.getByRole("button", {
        name: "Add Child Insight",
      });
      await expect(addChildButton).toBeVisible();

      const dialog = page.locator("#addChildInsightsDialog");
      await expect(dialog).toBeHidden();

      await addChildButton.click();
      await expect(dialog).toBeVisible();

      const dialogSubmitButton = dialog.getByRole("button", {
        name: "Add child insights",
      });
      await expect(dialogSubmitButton).toBeVisible();
      await expect(dialogSubmitButton).toBeDisabled();

      const existingInsightsTab = dialog.getByRole("tab", {
        name: "Existing insights",
      });
      await existingInsightsTab.click();
      await expect(existingInsightsTab).toHaveClass(/active/);

      const existingInsightsTabContent = dialog.locator("#existing-insights");
      await expect(existingInsightsTabContent).toBeVisible();
      const existingInsightsTable =
        existingInsightsTabContent.getByRole("table");
      await expect(existingInsightsTable).toBeVisible();
      const firstRow = existingInsightsTable.locator("tbody > tr").first();
      await expect(firstRow).toBeVisible();
      await expect(firstRow.locator("td")).toHaveCount(3); // checkbox > date > title
      const firstRowCheckbox = firstRow.locator("td").first().locator("input");
      const selectedInsightTitle = await firstRow
        .locator("td")
        .nth(2)
        .innerText();
      await firstRowCheckbox.click();

      await expect(dialogSubmitButton).toBeEnabled();

      const newInsightTab = dialog.getByRole("tab", {
        name: "New insight",
      });
      await newInsightTab.click();
      await expect(newInsightTab).toHaveClass(/active/);

      const newInsightTabContent = dialog.locator("#new-insight");
      const newInsightInput =
        newInsightTabContent.getByPlaceholder("New insight name");
      await expect(newInsightInput).toBeVisible();
      await expect(newInsightInput).toBeEnabled();
      await expect(newInsightInput).toBeEditable();
      const newInsightName = "Test Child Insight";
      await newInsightInput.fill(newInsightName);

      await expect(dialogSubmitButton).toBeEnabled();
      await dialogSubmitButton.click();
      await expect(dialog).toBeHidden();

      const childrenSection = page.locator("#childInsights");
      await expect(childrenSection).toBeVisible();

      const foundSelectedListItem =
        childrenSection.getByText(selectedInsightTitle);
      await expect(foundSelectedListItem).toBeVisible();

      await page.reload();
      await expect(foundSelectedListItem).toBeVisible();
    });
  });

  test.describe("In the citations table", () => {
    let citationsTable: Locator;
    let citationsTableFirstRow: Locator;
    let citationLink: Link;

    test.beforeEach(async ({ page }) => {
      await client.query({
        text: `insert into evidence
          (summary_id, insight_id) 
          values ((
            select s.id from summaries s where not exists (
              select id from evidence where insight_id = $1::integer and summary_id = s.id
            ) limit 1
          ), $1::integer)`,
        values: [insight!.id],
      });

      await page.reload();

      citationsTable = page.getByRole("table").nth(0);
      citationsTableFirstRow = citationsTable.locator("tbody > tr").first();
      const linkUid = await getLinkUid(citationsTableFirstRow);
      citationLink = await client
        .query({
          text: "select * from summaries where uid = $1::text",
          values: [linkUid],
        })
        .then((result: pg.QueryResult<Link>) => result.rows[0]);
    });

    test("load a link by clicking on it", async ({ page }) => {
      await expect(citationsTableFirstRow.locator("td")).toHaveCount(3); // checkbox > date > title
      await citationsTableFirstRow.locator("td").nth(2).click();

      await page.goto(
        `https://inspect.datagotchi.net/links/${citationLink.uid}`,
      );
      await page.waitForURL(
        `https://inspect.datagotchi.net/links/${citationLink.uid}`,
      );
      await expect(page).toHaveURL(
        `https://inspect.datagotchi.net/links/${citationLink.uid}`,
      );

      await expect(
        page.getByRole("heading", { name: citationLink.title }),
      ).toBeVisible();
    });

    test.describe("Unselected actions", () => {
      test(`user can add evidence`, async ({ page }) => {
        const addEvidenceButton = page.getByRole("button", {
          name: "Add Evidence",
        });
        await expect(addEvidenceButton).toBeVisible();

        const dialog = page.locator("#addLinksAsEvidenceDialog");
        await expect(dialog).toBeHidden();

        await expect(addEvidenceButton).toBeEnabled();
        await addEvidenceButton.click();
        await expect(dialog).toBeVisible();

        const dialogSubmitButton = dialog.getByRole("button", {
          name: "Add evidence links",
        });
        await expect(dialogSubmitButton).toBeVisible();
        await expect(dialogSubmitButton).toHaveText("Add");
        await expect(dialogSubmitButton).toBeDisabled();

        const existingLinksTab = dialog.getByRole("tab", {
          name: "Existing links",
        });
        await existingLinksTab.click();
        await expect(existingLinksTab).toHaveClass(/active/);
        const existingLinksTabContent = dialog.locator("#existing-links");
        await expect(existingLinksTabContent).toBeVisible();
        const existingLinksTable = existingLinksTabContent.getByRole("table");
        await expect(existingLinksTable).toBeVisible();
        const firstRow = existingLinksTable.locator("tbody > tr").first();
        await expect(firstRow).toBeVisible();
        await expect(firstRow.locator("td")).toHaveCount(3); // checkbox > date > title
        const firstRowCheckbox = firstRow
          .locator("td")
          .first()
          .locator("input");
        const selectedInsightTitle = await firstRow
          .locator("td")
          .nth(2)
          .innerText();
        await firstRowCheckbox.click();

        const saveLinkTab = dialog.getByRole("tab", {
          name: "Save link",
        });
        await saveLinkTab.click();
        await expect(saveLinkTab).toHaveClass(/active/);
        const saveLinkTabContent = dialog.locator("#save-link");
        await expect(saveLinkTabContent).toBeVisible();
        const newLinkInput =
          saveLinkTabContent.getByPlaceholder("New link URL");
        await expect(newLinkInput).toBeVisible();
        await expect(newLinkInput).toBeEnabled();
        await expect(newLinkInput).toBeEditable();
        const newLinkUrl = "https://www.google.com";
        await newLinkInput.fill(newLinkUrl);

        await expect(dialogSubmitButton).toBeEnabled();
        await dialogSubmitButton.click();
        await expect(dialog).toBeHidden();

        const evidenceTable = page.locator("table").first();
        await expect(evidenceTable).toBeVisible();
        const foundNewRow = evidenceTable
          .locator("tbody > tr a")
          .filter({ hasText: /^Google$/ });
        await expect(foundNewRow).toBeVisible();

        await expect(evidenceTable).toBeVisible();
        const foundRow = evidenceTable
          .locator("tbody > tr")
          .filter({ hasText: selectedInsightTitle });
        await expect(foundRow).toBeVisible();

        await page.reload();
        await expect(foundRow).toBeVisible();
      });
    });

    test.describe("Selected actions", () => {
      let selectedCitationTitle: string;

      test.beforeEach(async () => {
        selectedCitationTitle = await selectTableRow(citationsTableFirstRow);
      });

      test.describe("Add to Other Insight(s) button", () => {
        let dialog: Locator;

        test.beforeEach(async ({ page }) => {
          const addToOtherInsightsButton = page.getByRole("button", {
            name: "Add to Other Insight(s)",
          });
          await expect(addToOtherInsightsButton).toBeVisible();
          dialog = page.locator("#addCitationsToOtherInsightsDialog");
          await expect(dialog).toBeHidden();

          await addToOtherInsightsButton.click();

          await expect(dialog).toBeVisible();

          const submitDialogButton = dialog.getByRole("button", {
            name: "Submit Dialog",
          });
          await expect(submitDialogButton).toBeVisible();
          await expect(submitDialogButton).toBeDisabled();
        });

        test.describe("Selecting from potential insights", () => {
          let selectedInsight: Insight;

          test.beforeEach(async () => {
            await expect(dialog.getByRole("table")).toHaveCount(2);
            // the 1st one is citations to remove
            const dialogTableOfOtherInsights = dialog.getByRole("table").nth(1);
            // FIXME: duplicate key value violates unique constraint "u_sid_iid"
            // selectedInsight = await selectFirstEnabledPotentialInsight(
            //   dialogTableOfOtherInsights,
            // );
          });

          // test("when selecting the citation to be removed", async ({
          //   page,
          // }) => {
          //   await selectCitationToRemove(dialog, selectedCitationTitle);

          //   const submitDialogButton = dialog.getByRole("button", {
          //     name: "Submit Dialog",
          //   });
          //   await expect(submitDialogButton).toBeEnabled();
          //   await submitDialogButton.click();

          //   await expect(
          //     citationsTable
          //       .locator("tbody > tr")
          //       .filter({ hasText: selectedCitationTitle }),
          //   ).toHaveCount(0);

          //   expect(
          //     await insightPageHasCitation(
          //       page,
          //       selectedInsight.title!,
          //       selectedCitationTitle,
          //     ),
          //   ).toBe(true);
          // });

          // test("when NOT selecting the citation to be removed", async ({
          //   page,
          // }) => {
          //   await expect(
          //     dialog.getByRole("button", { name: "Submit Dialog" }),
          //   ).toBeEnabled();
          //   await dialog.getByRole("button", { name: "Submit Dialog" }).click();

          //   await expect(
          //     citationsTable
          //       .locator("tr")
          //       .filter({ hasText: selectedCitationTitle }),
          //   ).toHaveCount(1);

          //   expect(
          //     await insightPageHasCitation(
          //       page,
          //       selectedInsight.title!,
          //       selectedCitationTitle,
          //     ),
          //   ).toBe(true);
          // });
        });

        test.describe("Creating a new insight by name", () => {
          const NEW_INSIGHT_NAME = "New Insight";

          test.beforeEach(async () => {
            await dialog
              .getByPlaceholder("New insight name")
              .fill(NEW_INSIGHT_NAME);

            await expect(
              dialog.getByRole("button", {
                name: "Submit Dialog",
              }),
            ).toBeEnabled();
          });

          test.afterEach(async () => {
            await client.query({
              text: "delete from insights where title = $1::text",
              values: [NEW_INSIGHT_NAME],
            });
          });

          test("when selecting the citation to be removed", async ({
            page,
          }) => {
            await selectCitationToRemove(dialog, selectedCitationTitle);

            await dialog
              .getByRole("button", {
                name: "Submit Dialog",
              })
              .click();

            await expect(
              citationsTable
                .locator("tbody > tr")
                .filter({ hasText: selectedCitationTitle }),
            ).toHaveCount(0);

            await verifyNewInsightExists(page, NEW_INSIGHT_NAME);
          });

          test("when NOT selecting the citation to be removed", async ({
            page,
          }) => {
            await dialog
              .getByRole("button", {
                name: "Submit Dialog",
              })
              .click();

            await expect(
              citationsTable
                .locator("tr")
                .filter({ hasText: selectedCitationTitle }),
            ).toHaveCount(1);

            await verifyNewInsightExists(page, NEW_INSIGHT_NAME);
          });
        });
      });

      test("user can remove citations from the insight", async ({ page }) => {
        page.on("dialog", (dialog) => dialog.accept());

        await page.locator("button").filter({ hasText: "Remove" }).click();

        await expect(
          citationsTable
            .locator("tr")
            .filter({ hasText: selectedCitationTitle }),
        ).toHaveCount(0);

        await page.reload();

        await expect(
          citationsTable
            .locator("tr")
            .filter({ hasText: selectedCitationTitle }),
        ).toHaveCount(0);
      });
    });

    test.describe("Table rows below fact for feedback", () => {
      let firstFeedbackRow: Locator;
      let link: Link;

      test.beforeEach(async () => {
        firstFeedbackRow = citationsTableFirstRow.locator(
          "//following-sibling::tr",
        );
        link = await client
          .query({
            text: "select * from summaries where uid = $1::text",
            values: [await getLinkUid(citationsTableFirstRow)],
          })
          .then((result) => result.rows[0]);
      });

      test("add reaction", async ({ page }) => {
        const reactLink = firstFeedbackRow.getByText(/😲 React/).first();
        await expect(reactLink).toBeVisible();
        await reactLink.click();

        await addReactionFromFeedbackInputElement(page);

        const citationTitle = citationsTableFirstRow.locator("td").nth(2);
        await expect(citationTitle).toHaveText(/😀$/);

        await client.query({
          text: "delete from reactions where summary_id = $1::integer",
          values: [link.id],
        });
      });

      test("add/remove comment", async ({ page }) => {
        const commentLink = firstFeedbackRow.getByText(/💬 Comment/).first();
        await expect(commentLink).toBeVisible();
        await commentLink.click();

        // TODO: get the addRemoveComment function working
        // addRemoveComment(page);

        const COMMENT_TEXT = "Test comment";
        const directionsP = page.getByText("Enter a text comment");
        expect(await directionsP.evaluate((el) => el.tagName)).toBe("P");
        await expect(directionsP).toBeVisible();
        await expect(page.getByRole("textbox")).toHaveCount(2); // the search input and the comment input
        const commentInput = page.getByRole("textbox").last();
        expect(await commentInput.evaluate((el) => el.tagName)).toBe("DIV");
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

        const secondFeedbackRow = firstFeedbackRow.locator(
          "//following-sibling::tr",
        );

        const comments = secondFeedbackRow
          .locator(".comment")
          .filter({ hasText: COMMENT_TEXT });
        await expect(comments).toHaveCount(1);
        await page.reload();
        expect(await comments.count()).toBe(1);

        const deleteButtonLocator = comments.locator(
          "button[aria-label='Delete Comment']",
        );
        await expect(deleteButtonLocator).toHaveCount(1);
        const deleteButton = deleteButtonLocator.first();
        await expect(deleteButton).toBeVisible();
        await expect(deleteButton).toBeEnabled();
        page.on("dialog", (dialog) => dialog.accept());
        await deleteButton.click();

        await expect(comments).toHaveCount(0);
        await page.reload();
        await expect(comments).toHaveCount(0);
      });

      test("add/remove comment by inserting external link from the toolbar", async ({
        page,
      }) => {
        const commentLink = firstFeedbackRow.getByText(/💬 Comment/).first();
        await expect(commentLink).toBeVisible();
        await commentLink.click();

        const COMMENT_TEXT = "Comment with external links and insights";
        const directionsP = page.getByText("Enter a text comment");
        expect(await directionsP.evaluate((el) => el.tagName)).toBe("P");
        await expect(directionsP).toBeVisible();
        await expect(page.getByRole("textbox")).toHaveCount(2); // the search input and the comment input
        const commentInput = page.getByRole("textbox").last();
        expect(await commentInput.evaluate((el) => el.tagName)).toBe("DIV");
        await expect(commentInput).toBeVisible();
        await expect(commentInput).toBeEnabled();
        await expect(commentInput).toBeEditable();
        await commentInput.fill(COMMENT_TEXT);

        // Use toolbar & dialog to insert an external link, then an existing insight, then an existing link
        const linkButton = page.getByRole("button", { name: "Insert Link" });
        await expect(linkButton).toBeVisible();
        await linkButton.click();
        const dialog = page.locator(`#${INSERT_LINK_DIALOG_ID}`);
        await expect(dialog).toBeVisible();
        const linkInput = dialog.getByPlaceholder("Paste URL");
        await expect(linkInput).toBeVisible();
        await linkInput.fill("http://google.com");
        const linkSubmitButton = dialog.getByRole("button", {
          name: "Submit Dialog",
        });
        await expect(linkSubmitButton).toBeVisible();
        await linkSubmitButton.click();
        await expect(dialog).toBeHidden();

        const pageSubmitButton = page.getByRole("button", {
          name: "Submit Comment",
        });
        await expect(pageSubmitButton).toBeVisible();
        await expect(pageSubmitButton).toBeEnabled();
        await pageSubmitButton.click();

        const secondFeedbackRow = firstFeedbackRow.locator(
          "//following-sibling::tr",
        );

        const comments = secondFeedbackRow
          .locator(".comment")
          .filter({ hasText: COMMENT_TEXT });
        await expect(comments).toHaveCount(1);
        await page.reload();
        expect(await comments.count()).toBe(1);

        const deleteButtonLocator = comments.locator(
          "button[aria-label='Delete Comment']",
        );
        await expect(deleteButtonLocator).toHaveCount(1);
        const deleteButton = deleteButtonLocator.first();
        await expect(deleteButton).toBeVisible();
        await expect(deleteButton).toBeEnabled();
        page.on("dialog", (dialog) => dialog.accept());
        await deleteButton.click();

        await expect(comments).toHaveCount(0);
        await page.reload();
        await expect(comments).toHaveCount(0);
      });

      test("add/remove comment by inserting existing insight from the toolbar", async ({
        page,
      }) => {
        const commentLink = firstFeedbackRow.getByText(/💬 Comment/).first();
        await expect(commentLink).toBeVisible();
        await commentLink.click();

        const COMMENT_TEXT = "Comment with existing insight";
        const directionsP = page.getByText("Enter a text comment");
        expect(await directionsP.evaluate((el) => el.tagName)).toBe("P");
        await expect(directionsP).toBeVisible();
        await expect(page.getByRole("textbox")).toHaveCount(2); // the search input and the comment input
        const commentInput = page.getByRole("textbox").last();
        expect(await commentInput.evaluate((el) => el.tagName)).toBe("DIV");
        await expect(commentInput).toBeVisible();
        await expect(commentInput).toBeEnabled();
        await expect(commentInput).toBeEditable();
        await commentInput.fill(COMMENT_TEXT);

        // Use toolbar & dialog to insert an existing insight
        const insightButton = page.getByRole("button", {
          name: "Insert Link",
        });
        await expect(insightButton).toBeVisible();
        await insightButton.click();
        const dialog = page.locator(`#${INSERT_LINK_DIALOG_ID}`);
        await expect(dialog).toBeVisible();
        const insightRadioButton = dialog.getByRole("radio", {
          name: "insight",
        });
        await expect(insightRadioButton).toBeVisible();
        await insightRadioButton.click();
        const loadingText = dialog.getByText("Loading insights...");
        await expect(loadingText).toBeVisible();

        const insightsTable = dialog.locator("#factsTable-insight");
        await expect(insightsTable).toBeVisible();
        await expect(insightsTable).toHaveCount(1);
        const firstInsight = insightsTable.locator("tbody > tr").first();
        await expect(firstInsight).toBeVisible();
        const insightTitle = await firstInsight
          .locator("td")
          .nth(2)
          .locator("a")
          .innerText();
        await firstInsight.locator("td input[type='checkbox']").click();

        const dialogSubmitButton = dialog.getByRole("button", {
          name: "Submit Dialog",
        });
        await expect(dialogSubmitButton).toBeVisible();
        await expect(dialogSubmitButton).toBeEnabled();
        await dialogSubmitButton.click();
        await expect(dialog).toBeHidden();

        const pageSubmitButton = page.getByRole("button", {
          name: "Submit Comment",
        });
        await expect(pageSubmitButton).toBeVisible();
        await expect(pageSubmitButton).toBeEnabled();
        await pageSubmitButton.click();

        const secondFeedbackRow = firstFeedbackRow.locator(
          "//following-sibling::tr",
        );

        const comments = secondFeedbackRow
          .locator(".comments")
          .locator(".comment")
          .filter({ hasText: `Insight: ${insightTitle}` });
        await expect(comments).toHaveCount(1);
        await page.reload();
        expect(await comments.count()).toBe(1);

        const deleteButtonLocator = comments.locator(
          "button[aria-label='Delete Comment']",
        );
        await expect(deleteButtonLocator).toHaveCount(1);
        const deleteButton = deleteButtonLocator.first();
        await expect(deleteButton).toBeVisible();
        await expect(deleteButton).toBeEnabled();
        page.on("dialog", (dialog) => dialog.accept());
        await deleteButton.click();

        await expect(comments).toHaveCount(0);
        await page.reload();
        await expect(comments).toHaveCount(0);
      });

      test("add/remove comment by inserting existing link from the toolbar", async ({
        page,
      }) => {
        const commentLink = firstFeedbackRow.getByText(/💬 Comment/).first();
        await expect(commentLink).toBeVisible();
        await commentLink.click();

        const COMMENT_TEXT = "Comment with existing link";
        const directionsP = page.getByText("Enter a text comment");
        expect(await directionsP.evaluate((el) => el.tagName)).toBe("P");
        await expect(directionsP).toBeVisible();
        await expect(page.getByRole("textbox")).toHaveCount(2); // the search input and the comment input
        const commentInput = page.getByRole("textbox").last();
        expect(await commentInput.evaluate((el) => el.tagName)).toBe("DIV");
        await expect(commentInput).toBeVisible();
        await expect(commentInput).toBeEnabled();
        await expect(commentInput).toBeEditable();
        await commentInput.fill(COMMENT_TEXT);

        // Use toolbar & dialog to insert an existing link
        const linkButton = page.getByRole("button", { name: "Insert Link" });
        await expect(linkButton).toBeVisible();
        await linkButton.click();
        const dialog = page.locator(`#${INSERT_LINK_DIALOG_ID}`);
        await expect(dialog).toBeVisible();
        const linkRadioButton = dialog.getByRole("radio", { name: "link" });
        await expect(linkRadioButton).toBeVisible();
        await linkRadioButton.click();
        const loadingText = dialog.getByText("Loading links...");
        await expect(loadingText).toBeVisible();

        const linksTable = dialog.locator("#factsTable-link");
        await expect(linksTable).toBeVisible();
        await expect(linksTable).toHaveCount(1);
        const firstLink = linksTable.locator("tbody > tr").first();
        await expect(firstLink).toBeVisible();
        const linkTitle = await firstLink
          .locator("td")
          .nth(2)
          .locator("a")
          .innerText();
        await firstLink.locator("td input[type='checkbox']").click();

        const dialogSubmitButton = dialog.getByRole("button", {
          name: "Submit Dialog",
        });
        await expect(dialogSubmitButton).toBeVisible();
        await expect(dialogSubmitButton).toBeEnabled();
        await dialogSubmitButton.click();
        await expect(dialog).toBeHidden();

        const pageSubmitButton = page.getByRole("button", {
          name: "Submit Comment",
        });
        await expect(pageSubmitButton).toBeVisible();
        await expect(pageSubmitButton).toBeEnabled();
        await pageSubmitButton.click();

        const secondFeedbackRow = firstFeedbackRow.locator(
          "//following-sibling::tr",
        );

        const comments = secondFeedbackRow
          .locator(".comments")
          .locator(".comment")
          .filter({ hasText: `Link: ${linkTitle}` });
        await expect(comments).toHaveCount(1);
        await page.reload();
        expect(await comments.count()).toBe(1);

        const deleteButtonLocator = comments.locator(
          "button[aria-label='Delete Comment']",
        );
        await expect(deleteButtonLocator).toHaveCount(1);
        const deleteButton = deleteButtonLocator.first();
        await expect(deleteButton).toBeVisible();
        await expect(deleteButton).toBeEnabled();
        page.on("dialog", (dialog) => dialog.accept());
        await deleteButton.click();

        await expect(comments).toHaveCount(0);
        await page.reload();
        await expect(comments).toHaveCount(0);
      });
    });
  });
});
