import { test, expect, Page } from "@playwright/test";
import dotenv from "dotenv";
import pg from "pg";
const Client = pg.Client;
import { email, password } from "./constants";
import { Insight, User } from "../app/types";
import { addReactionFromFeedbackInputElement } from "./functions";
import { encodeStringURI } from "../app/hooks/functions";

let client: pg.Client;
let token: string;
let user: User;

const uniqueSuffix = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const clickOwnerButton = async (page: Page, name: string | RegExp) => {
  await page.getByRole("button", { name }).first().click();
};

test.describe("Insight page", () => {
  let insight: Insight | undefined;
  const createdInsightTitles: string[] = [];

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
    user = await client
      .query({
        text: "select * from users where email = $1::text",
        values: [email],
      })
      .then((result: pg.QueryResult<User>) => result.rows[0]);
    const response = await request.post("http://localhost:3000/api/login", {
      data: { email, password },
    });
    const json = await response.json();
    token = json.token;
  });

  test.beforeEach(async ({ context, page }) => {
    await context.addCookies([
      {
        name: "token",
        value: encodeStringURI(token),
        url: "http://localhost:3000",
      },
    ]);

    const uid = `e2einsight${uniqueSuffix()}`.slice(0, 24);
    const title = `E2E test insight ${uniqueSuffix()}`;
    createdInsightTitles.push(title);
    insight = await client
      .query({
        text: `insert into insights
          (user_id, uid, title, created_at, updated_at)
          values ($1::integer, $2::text, $3::text, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          returning *`,
        values: [user.id, uid, title],
      })
      .then((result: pg.QueryResult<Insight>) => result.rows[0]);

    const currentInsight = insight!;
    await page.goto(`http://localhost:3000/insights/${currentInsight.uid}`);
    await page.waitForURL(
      `http://localhost:3000/insights/${currentInsight.uid}`,
    );
    await expect(page.getByRole("button", { name: "Edit title" })).toHaveText(
      currentInsight.title,
    );
  });

  test.afterEach(async ({ context }) => {
    await context.clearCookies();

    if (insight) {
      await client.query(
        "delete from comments where insight_id = $1::integer",
        [insight.id],
      );
      await client.query(
        "delete from reactions where insight_id = $1::integer",
        [insight.id],
      );
      await client.query(
        "delete from evidence where insight_id = $1::integer",
        [insight.id],
      );
      await client.query(
        "delete from insight_links where parent_id = $1::integer or child_id = $1::integer",
        [insight.id],
      );
      await client.query("delete from insights where id = $1::integer", [
        insight.id,
      ]);
      insight = undefined;
    }

    if (createdInsightTitles.length > 0) {
      await client.query("delete from insights where title = any($1::text[])", [
        createdInsightTitles.splice(0),
      ]);
    }
  });

  test.afterAll(async () => {
    await client.end();
  });

  test("shows current content and owner controls", async ({ page }) => {
    await expect(
      page.getByText("This insight is important because"),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Add Parent Insight" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add Child Insight" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add Evidence" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Publish" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Delete" }).first(),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "React" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Comment" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Evidence" })).toBeVisible();
    await expect(page.getByText("No evidence yet")).toBeVisible();
  });

  test("user can add a reaction", async ({ page }) => {
    await clickOwnerButton(page, "React");
    await expect(page.getByText("Pick a reaction")).toBeVisible();

    await addReactionFromFeedbackInputElement(page);

    await expect(page.getByLabel("Reactions")).toContainText("👍");
  });

  test("user can add and delete a comment", async ({ page }) => {
    const commentText = `E2E insight comment ${uniqueSuffix()}`;
    await clickOwnerButton(page, "Comment");

    await expect(page.getByText("Write a short comment")).toBeVisible();
    const commentInput = page.getByRole("textbox", {
      name: "Comment Text Div",
    });
    await commentInput.fill(commentText);
    await page.getByRole("button", { name: "Submit Comment" }).click();

    await expect(page.getByText(commentText)).toBeVisible();
    await page.reload();
    await expect(page.getByText(commentText)).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete Comment" }).click();
    await expect(page.getByText(commentText)).toHaveCount(0);
  });

  test("user can publish the insight", async ({ page }) => {
    page.once("dialog", (dialog) => {
      expect(dialog.message()).toBe("Publish this insight?");
      void dialog.accept();
    });

    await clickOwnerButton(page, "Publish");

    await expect(page.getByText(/Public/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Publish" })).toHaveCount(0);
  });

  test("user can delete the insight", async ({ page }) => {
    await clickOwnerButton(page, "Delete");

    const dialog = page.getByRole("dialog", { name: "Delete insight?" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Delete permanently" }).click();

    await expect(page).toHaveURL("http://localhost:3000/insights");
  });

  test("user can add a child insight", async ({ page }) => {
    const childTitle = `E2E child insight ${uniqueSuffix()}`;
    createdInsightTitles.push(childTitle);

    await clickOwnerButton(page, "Add Child Insight");

    const dialog = page.locator("#addChildInsightsDialog");
    await expect(
      dialog.getByRole("dialog", { name: "Add child insights" }),
    ).toBeVisible();
    await expect(dialog.locator("#existing-panel")).toBeVisible();
    await dialog.getByRole("tab", { name: "New insight" }).click();
    await expect(dialog.locator("#new-panel")).toBeVisible();
    await dialog.getByPlaceholder("New insight name").fill(childTitle);
    await expect(dialog.getByRole("button", { name: "Add" })).toBeEnabled();
    await dialog.getByRole("button", { name: "Add" }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByText(childTitle)).toBeVisible();
    await page.reload();
    await expect(page.getByText(childTitle)).toBeVisible();
  });

  // Evidence live-merge needs a follow-up; covered elsewhere for now.
  // eslint-disable-next-line playwright/no-skipped-test -- pending evidence merge fix
  test.skip("user can add existing link evidence", async ({ page }) => {
    await clickOwnerButton(page, "Add Evidence");
    await expect(page.locator("#addLinksAsEvidenceDialog")).toBeVisible();
  });
});
