import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import pg from "pg";
const Client = pg.Client;
import { Insight, User } from "../app/types";
import { encodeStringURI } from "../app/hooks/functions";
import { email, password } from "./constants";

let client: pg.Client;
let user: User;
let token: string;
const createdInsightTitles: string[] = [];
const savedLinkUrls: string[] = [];

const uniqueSuffix = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const openActions = async (page: import("@playwright/test").Page) => {
  await page.getByRole("button", { name: "Open actions" }).click();
};

test.describe("Insights page", () => {
  test.beforeAll(async ({ request }) => {
    dotenv.config({ path: "./.env", quiet: true });
    client = new Client({
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT!),
      database: "inspect",
    });
    await client.connect();

    user = await client
      .query({
        text: "select * from users where email = $1::text",
        values: [email],
      })
      .then((result) => result.rows[0]);
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
        domain: "localhost",
        path: "/",
      },
    ]);
    await page.goto("http://localhost:3000/insights");
    await page.waitForURL("http://localhost:3000/insights");
    await expect(
      page.getByRole("heading", { name: "My Insights" }),
    ).toBeVisible();
  });

  test.afterEach(async ({ context }) => {
    await context.clearCookies();
    if (savedLinkUrls.length > 0) {
      await client.query(
        `delete from evidence
          where summary_id in (
            select id from summaries where url = any($1::text[])
          )`,
        [savedLinkUrls],
      );
      await client.query("delete from summaries where url = any($1::text[])", [
        savedLinkUrls.splice(0),
      ]);
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

  test("shows insights as cards that navigate to detail pages", async ({
    page,
  }) => {
    const title = `E2E card insight ${uniqueSuffix()}`;
    const uid = `e2ecard${uniqueSuffix()}`.slice(0, 24);
    createdInsightTitles.push(title);

    const insight = (await client
      .query({
        text: `insert into insights (title, user_id, uid)
          values ($1::text, $2::integer, $3::text)
          returning *`,
        values: [title, user.id, uid],
      })
      .then((result: pg.QueryResult<Insight>) => result.rows[0])) as Insight;

    await page.reload();

    const cardLink = page.getByRole("link", { name: new RegExp(title) });
    await expect(cardLink.getByRole("heading", { name: title })).toBeVisible();
    await cardLink.click();

    await expect(page).toHaveURL(
      `http://localhost:3000/insights/${insight.uid}`,
    );
    await expect(page.getByRole("button", { name: "Edit title" })).toHaveText(
      title,
    );
  });

  test("creates an insight from the FAB", async ({ page }) => {
    const title = `E2E created insight ${uniqueSuffix()}`;
    createdInsightTitles.push(title);

    await openActions(page);
    await page.getByRole("menuitem", { name: "Create insight" }).click();

    const dialog = page.getByRole("dialog", { name: "Create new insight" });
    await expect(dialog).toBeVisible();
    await dialog.getByPlaceholder("What are you inspecting?").fill(title);
    await dialog.getByRole("button", { name: "Create" }).click();

    await expect(page).toHaveURL(/\/insights\/[a-z0-9]+$/);
    await expect(page.getByRole("button", { name: "Edit title" })).toHaveText(
      title,
    );
  });

  test("saves a link into a new insight from the FAB", async ({ page }) => {
    const title = `E2E saved-link insight ${uniqueSuffix()}`;
    const url = `https://example.com/e2e-${uniqueSuffix()}`;
    createdInsightTitles.push(title);
    savedLinkUrls.push(url);

    await openActions(page);
    await page.getByRole("menuitem", { name: "Save link" }).click();

    const dialog = page.locator("#save-link-dialog");
    await expect(
      dialog.getByRole("dialog", { name: "Save link" }),
    ).toBeVisible();
    await dialog.getByPlaceholder("https://example.com/article").fill(url);
    await dialog.getByPlaceholder("Name for a new insight").fill(title);
    await dialog.getByRole("button", { name: "Save link" }).click();

    await expect(dialog).toBeHidden();
    const cardLink = page.getByRole("link", { name: new RegExp(title) });
    await expect(cardLink).toBeVisible();
    await expect(cardLink).toContainText("1 citation");
  });

  test("saves a link into an existing insight from the FAB", async ({
    page,
  }) => {
    const title = `E2E existing insight ${uniqueSuffix()}`;
    const uid = `e2eexist${uniqueSuffix()}`.slice(0, 24);
    const url = `https://example.com/e2e-existing-${uniqueSuffix()}`;
    createdInsightTitles.push(title);
    savedLinkUrls.push(url);

    await client.query({
      text: `insert into insights (title, user_id, uid)
        values ($1::text, $2::integer, $3::text)`,
      values: [title, user.id, uid],
    });
    await page.reload();

    await openActions(page);
    await page.getByRole("menuitem", { name: "Save link" }).click();

    const dialog = page.locator("#save-link-dialog");
    await expect(
      dialog.getByRole("dialog", { name: "Save link" }),
    ).toBeVisible();
    await dialog.getByPlaceholder("https://example.com/article").fill(url);

    const row = dialog.locator("tbody > tr").filter({ hasText: title }).first();
    await expect(row).toBeVisible();
    await row.locator("input[name='selectedFact']").click();
    await dialog.getByRole("button", { name: "Save link" }).click();

    await expect(dialog).toBeHidden();
    await page.reload();
    const cardLink = page.getByRole("link", { name: new RegExp(title) });
    await expect(cardLink).toBeVisible();
    await expect(cardLink).toContainText(/1 citation/);
  });
});
