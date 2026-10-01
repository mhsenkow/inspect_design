import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import pg from "pg";
const Client = pg.Client;

import { encodeStringURI } from "../app/hooks/functions";
import { email, password } from "./constants";
import { Link } from "../app/types";
import {
  addReactionFromFeedbackInputElement,
  addRemoveComment,
} from "./functions";

let client: pg.Client;
let token: string;
let link: Link;

test.describe("Link page", () => {
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

    const response = await request.post("http://localhost:3000/api/login", {
      data: { email, password },
    });
    const json = await response.json();
    token = json.token;

    link = await client
      .query({
        text: `INSERT INTO summaries (uid, title, url, created_at, updated_at)
               VALUES ($1, $2, $3, NOW(), NOW())
               ON CONFLICT (uid) DO UPDATE
                 SET title = EXCLUDED.title,
                     url = EXCLUDED.url
               RETURNING *`,
        values: [
          "e2elinksafe",
          "E2E Safe Link",
          "https://example.com/e2e-safe-link",
        ],
      })
      .then((result) => result.rows[0]);
  });

  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      {
        name: "token",
        value: encodeStringURI(token),
        url: "http://localhost:3000",
      },
    ]);
  });

  test.afterEach(async ({ context }) => {
    await context.clearCookies();
    await client.query("delete from comments where summary_id = $1::integer", [
      link.id,
    ]);
    await client.query("delete from reactions where summary_id = $1::integer", [
      link.id,
    ]);
  });

  test.afterAll(async () => {
    await client.query("delete from summaries where uid = $1::text", [
      "e2elinksafe",
    ]);
    await client.end();
  });

  test("should load the link page and display the correct content", async ({
    page,
  }) => {
    await page.goto(`http://localhost:3000/links/${link.uid}`);
    await expect(page.getByRole("heading", { name: link.title })).toBeVisible();
  });

  test("should navigate to a valid url", async ({ page }) => {
    await page.goto(`http://localhost:3000/links/${link.uid}`);

    const heading = page.getByRole("heading", { name: link.title });
    await expect(heading).toBeVisible();

    const newTabPromise = page.waitForEvent("popup");
    await heading.getByRole("link").click();
    const newTab = await newTabPromise;
    await expect(newTab).toHaveURL(link.url!);
  });

  test("should display 404 for an invalid link page", async ({ page }) => {
    await page.goto("http://localhost:3000/links/does-not-exist-e2e");
    await expect(page.getByText("No link with this UID")).toBeVisible();
  });

  test.describe("Comments/reactions", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`http://localhost:3000/links/${link.uid}`);
      await expect(
        page.getByRole("heading", { name: link.title }),
      ).toBeVisible();
    });

    test("should allow adding a comment to the link", async ({ page }) => {
      await page.getByText("💬 Comment").first().click();
      await addRemoveComment(page);
    });

    test("should allow reacting to the post", async ({ page }) => {
      await page.getByText("😲 React").first().click();
      await addReactionFromFeedbackInputElement(page);
      await expect(page.locator("#source")).toContainText("👍");
    });
  });
});
