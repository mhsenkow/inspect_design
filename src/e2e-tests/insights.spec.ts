import { test, expect, Locator } from "@playwright/test";
import dotenv from "dotenv";
import pg from "pg";
const Client = pg.Client;
import { getInsightUid } from "./functions";
import { Insight, User } from "../app/types";
import { encodeStringURI } from "../app/hooks/functions";
import { email, password } from "./constants";

let client: pg.Client;
let user: User;
let token: string;

test.describe("Insights page", () => {
  // TODO: perform tests as me, Test, and anonymous
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
  });

  test.afterAll(async () => {
    await client.end();
  });

  test.afterEach(async ({ context }) => {
    await context.clearCookies();
  });

  test.describe("Unselected actions", () => {
    test.describe("Save Link in Insight(s) button", () => {
      let dialog: Locator;
      let submitButton: Locator;

      test.beforeEach(async ({ page }) => {
        const saveLinkButton = page.getByRole("button", {
          name: "Save Link in Insight(s)",
        });
        await expect(saveLinkButton).toBeVisible();
        await saveLinkButton.click();

        dialog = page.locator("#saveLinkDialog");
        await expect(dialog).toBeVisible();

        const input = dialog.getByPlaceholder("Link URL...");
        const NEW_URL = "https://datagotchi.net";
        await input.fill(NEW_URL);
        await expect(input).toHaveValue(NEW_URL);

        submitButton = dialog.getByRole("button", { name: "Submit Dialog" });
        await expect(submitButton).toBeDisabled();
      });

      test.afterEach(async () => {
        await client.query("delete from summaries where url = $1::text", [
          "https://datagotchi.net",
        ]);
        await client.query("delete from insights where title like $1::text", [
          "Test insight%",
        ]);
      });

      test("when selecting potential insights", async ({ page }) => {
        const insight = (await client
          .query({
            text: `insert into insights (title, user_id, uid) 
              values ('Test insight 1', $1::integer, $2::text) 
              returning *`,
            values: [user.id, "asdf1"],
          })
          .then((result) => result.rows[0])) as Insight;
        const potentialInsightsTable = dialog.getByRole("table");
        const potentialInsightsTableTr = potentialInsightsTable
          .locator("tbody > tr")
          .first();
        const potentialInsightTitle = await potentialInsightsTableTr
          .locator("td")
          .nth(2)
          .innerText();
        const potentialInsightsTableCitationsCell = potentialInsightsTableTr
          .locator("td")
          .nth(3);
        const originalCitationCount = parseInt(
          await potentialInsightsTableCitationsCell.innerText(),
        );

        await potentialInsightsTableTr.locator("td > input").click();

        await submitButton.click();

        await expect(dialog).toBeHidden();

        const tr = page
          .locator("tr")
          .filter({ hasText: potentialInsightTitle })
          .first();
        await expect(tr.locator("td").nth(3)).toHaveText(
          String(originalCitationCount + 1),
        );

        await client.query("delete from insights where id = $1::integer", [
          insight.id,
        ]);
      });

      test("when creating a new insight by name", async ({ page }) => {
        const input = page.getByPlaceholder("New insight name");
        const NEW_INSIGHT_NAME = "Test insight 2";
        await input.fill(NEW_INSIGHT_NAME);

        await expect(submitButton).toBeEnabled();

        await submitButton.click();

        await expect(dialog).toBeHidden();

        const tr = page
          .locator("tr")
          .filter({ hasText: NEW_INSIGHT_NAME })
          .first();
        await expect(tr).toBeVisible();
        expect(parseInt(await tr.locator("td").nth(3).innerText())).not.toBe(
          NaN,
        );
      });
    });

    test("Create Insight button", async ({ page }) => {
      const NEW_INSIGHT_NAME = "Test insight 3";

      page.on("dialog", (dialog) => dialog.accept(NEW_INSIGHT_NAME));
      await page.getByRole("button", { name: "Create Insight" }).click();

      const mainTable = page.getByRole("table").first();

      await expect(
        mainTable.locator("tbody > tr").filter({ hasText: NEW_INSIGHT_NAME }),
      ).toBeVisible();

      await page.reload();

      await expect(
        mainTable.locator("tr").filter({ hasText: NEW_INSIGHT_NAME }),
      ).toBeVisible();

      await client.query("delete from insights where title = $1::text", [
        NEW_INSIGHT_NAME,
      ]);
    });
  });

  test.describe("In the insights table", () => {
    let insightsTable: Locator;
    let firstRow: Locator;
    let insight: Insight;

    test.beforeEach(async ({ page }) => {
      insightsTable = page.getByRole("table").first();
      firstRow = insightsTable.locator("tbody > tr").first();
      const uid = await getInsightUid(firstRow);
      insight = await client
        .query({
          text: "select * from insights where uid = $1::text",
          values: [uid],
        })
        .then((result) => result.rows[0]);
    });

    test("load an insight by clicking on it", async ({ page }) => {
      await firstRow.locator("td").nth(2).locator("a").click();

      await expect(page).toHaveURL(
        `http://localhost:3000/insights/${insight.uid}`,
      );

      await expect(
        page.getByRole("heading", { name: insight.title }),
      ).toBeVisible();
    });

    test.describe("Selected actions", () => {
      let bodyTable: Locator;
      let testRow: Locator;

      test.beforeEach(async ({ page }) => {
        await client.query({
          text: `insert into insights (title, user_id, uid) 
            values ('Test insight 4', $1::integer, $2::text) 
            returning *`,
          values: [user.id, "asdf4"],
        });
        await page.reload();

        bodyTable = page.getByRole("table").first();
        testRow = bodyTable
          .locator("tbody > tr")
          .filter({ hasText: "Test insight 4" });
        await testRow.locator("td > input").click();
      });

      test.afterEach(async () => {
        await client.query({
          text: "delete from insights where title = $1::text",
          values: ["Test insight 4"],
        });
      });

      test("Publish button", async ({ page }) => {
        const publishButton = page.getByRole("button", { name: "Publish" });
        page.on("dialog", (dialog) => dialog.accept());
        await publishButton.click();

        await expect(testRow.locator("td").nth(4)).toHaveText("✅");
        await page.reload();
        await expect(testRow.locator("td").nth(4)).toHaveText("✅");
      });

      test("Delete button", async ({ page }) => {
        const deleteButton = page.getByRole("button", {
          name: "Delete Insights",
        });
        await expect(deleteButton).toBeVisible();
        page.on("dialog", (dialog) => dialog.accept());
        await deleteButton.click();

        await expect(testRow).toHaveCount(0);
        await page.reload();
        await expect(testRow).toHaveCount(0);
      });
    });
  });
});
