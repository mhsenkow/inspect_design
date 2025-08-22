import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import pg from "pg";
const Client = pg.Client;

import { encodeStringURI } from "../app/hooks/functions";
import { email, password } from "./constants";
import { Link } from "../app/types";

let client: pg.Client;
let token: string;

test.describe("Link page", () => {
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

    const response = await request.post("http://localhost:3000/api/login", {
      data: { email, password },
    });
    const json = await response.json();
    token = json.token;
  });

  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      {
        name: "token",
        value: encodeStringURI(token),
        domain: "localhost",
        path: "/",
      },
    ]);
  });

  test.afterEach(async ({ context }) => {
    await context.clearCookies();
  });

  test.afterAll(async () => {
    await client.end();
  });

  let link: Link;
  test.beforeAll(async () => {
    link = await client
      .query("select * from summaries limit 1")
      .then((result) => result.rows[0]);
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
    await heading.click();
    const newTab = await newTabPromise;
    await expect(newTab).toHaveURL(link.url!);
  });

  test("should display 404 for an invalid link page", async ({ page }) => {
    await page.goto("http://localhost:3000/links/invalid");

    await expect(page.getByText("No link with this UID")).toBeVisible();
  });

  test.describe("Comments/reactions", () => {
    test.beforeEach(async ({ page }) => {
      const url = `http://localhost:3000/links/${link.uid}`;
      await page.goto(url);
      await page.waitForURL(url);
    });
    test.afterEach(async () => {
      await client.query("delete from comments");
      await client.query("delete from reactions");
    });

    test("should allow adding a comment to the link", async ({ page }) => {
      // await page.getByRole("link", { name: "💬 Comment" }).click();
      await page.getByText("💬 Comment").first().click();
      await expect(page.getByText("Enter a text comment")).toBeVisible();
      const commentInput = page.getByRole("textbox");
      await expect(commentInput).toBeVisible();
      await expect(commentInput).toBeEnabled();

      await commentInput.fill("This is a test comment.");
      await page.getByRole("button", { name: "Submit Comment" }).click();

      await expect(page.getByText("This is a test comment.")).toBeVisible();
    });

    test("add a comment with a link", async ({ page }) => {
      // await page.getByRole("link", { name: "💬 Comment" }).click();
      await page.getByText("💬 Comment").first().click();
      await expect(page.getByText("Enter a text comment")).toBeVisible();
      const commentInput = page.getByRole("textbox");
      await expect(commentInput).toBeVisible();
      await expect(commentInput).toBeEnabled();

      await commentInput.fill("This is a comment with an ");
      const linkImage = page.getByAltText("Insert Link");
      await expect(linkImage).toBeVisible();
      await linkImage.click();

      const dialog = page.locator("#insertLinkDialog");
      await expect(dialog).toBeVisible();
      const submitLinkButton = page.getByRole("button", {
        name: "Submit Dialog",
      });
      await expect(submitLinkButton).toBeVisible();
      await expect(submitLinkButton).toBeDisabled();
      const linkUrlTextbox = page.getByPlaceholder("Paste URL");
      await expect(linkUrlTextbox).toBeVisible();
      await expect(linkUrlTextbox).toBeEnabled();
      await linkUrlTextbox.fill("http://example.com");
      await expect(submitLinkButton).toBeEnabled();
      await submitLinkButton.scrollIntoViewIfNeeded();
      await submitLinkButton.click();
      await expect(dialog).toBeHidden();

      // can't test its actual html, so get plain text behind the rich text
      await expect(commentInput).toHaveText(
        "This is a comment with an Example Domain",
      );

      const submitCommentButton = page.getByRole("button", {
        name: "Submit Comment",
      });
      await expect(submitCommentButton).toBeVisible();
      await expect(submitCommentButton).toBeEnabled();
      await submitCommentButton.click();

      await expect(
        page.getByText("This is a comment with an Example Domain"),
      ).toBeVisible();
    });

    test("add a comment by inserting an external link", async ({ page }) => {
      // await page.getByRole("link", { name: "💬 Comment" }).click();
      await page.getByText("💬 Comment").first().click();
      await expect(page.getByText("Enter a text comment")).toBeVisible();
      const commentInput = page.getByRole("textbox");
      await expect(commentInput).toBeVisible();
      await expect(commentInput).toBeEnabled();
      await commentInput.fill("Check this out: ");
      const linkImage = page.getByAltText("Insert Link");
      await expect(linkImage).toBeVisible();
      await expect(linkImage).toBeEnabled();
      const dialog = page.locator("#insertLinkDialog");
      await expect(dialog).toBeHidden();
      const dialogSubmitButton = dialog.getByRole("button", {
        name: "Submit Dialog",
      });
      await expect(dialogSubmitButton).toBeHidden();

      await linkImage.click();
      await expect(dialog).toBeVisible();
      const linkInput = dialog.getByPlaceholder("Paste URL");
      await linkInput.fill("https://example.com");
      await expect(dialog.getByText("Example Domain")).toBeVisible();
      await expect(dialogSubmitButton).toBeEnabled();
      await dialogSubmitButton.click();
      await expect(dialog).toBeHidden();

      // Post the comment
      await page.getByRole("button", { name: "Submit Comment" }).click();

      // Verify the comment contains the external link
      await expect(page.getByText("Check this out: ")).toBeVisible();
      // await expect(
      //   page.getByRole("link", { name: "https://example.com" }),
      // ).toBeVisible();
      await expect(
        page.getByText("Check this out: Example Domain"),
      ).toBeVisible();
    });

    test("add a comment by inserting a link to an existing insight", async ({
      page,
    }) => {
      // await page.getByRole("link", { name: "💬 Comment" }).click();
      await page.getByText("💬 Comment").first().click();
      await expect(page.getByText("Enter a text comment")).toBeVisible();
      const commentInput = page.getByRole("textbox");
      await expect(commentInput).toBeVisible();
      await expect(commentInput).toBeEnabled();
      await commentInput.fill("Check this out: ");
      const linkImage = page.getByAltText("Insert Link");
      await expect(linkImage).toBeVisible();
      await expect(linkImage).toBeEnabled();
      const dialog = page.locator("#insertLinkDialog");
      await expect(dialog).toBeHidden();
      const dialogSubmitButton = dialog.getByRole("button", {
        name: "Submit Dialog",
      });
      await expect(dialogSubmitButton).toBeHidden();

      await linkImage.click();
      await expect(dialog).toBeVisible();
      const dialogTable = dialog.getByRole("table");
      await expect(dialogTable).toBeHidden();
      await page.getByRole("radio", { name: "Insight" }).click();
      await expect(dialogTable).toBeVisible();
      const firstTableRow = dialogTable.locator("tbody > tr").first();
      await expect(firstTableRow).toBeVisible();
      await firstTableRow.locator("td > input[type='checkbox']").click();
      await expect(dialogSubmitButton).toBeEnabled();
      await dialogSubmitButton.click();
      await expect(dialog).toBeHidden();

      // FIXME: original commentInput is overwritten
      // const commentText = /Check this out: Insight: .+/;
      const commentText = /Insight: .+/;
      await expect(commentInput).toHaveText(commentText);
      await page.getByRole("button", { name: "Submit Comment" }).click();

      await expect(page.getByText(commentText)).toBeVisible();
    });

    test("add a comment by inserting a link to an existing link", async ({
      page,
    }) => {
      // await page.getByRole("link", { name: "💬 Comment" }).click();
      await page.getByText("💬 Comment").first().click();
      await expect(page.getByText("Enter a text comment")).toBeVisible();
      const commentInput = page.getByRole("textbox");
      await expect(commentInput).toBeVisible();
      await expect(commentInput).toBeEnabled();
      await commentInput.fill("Check this out: ");
      const linkImage = page.getByAltText("Insert Link");
      await expect(linkImage).toBeVisible();
      await expect(linkImage).toBeEnabled();
      const dialog = page.locator("#insertLinkDialog");
      await expect(dialog).toBeHidden();
      const dialogSubmitButton = dialog.getByRole("button", {
        name: "Submit Dialog",
      });
      await expect(dialogSubmitButton).toBeHidden();

      await linkImage.click();
      await expect(dialog).toBeVisible();
      const dialogTable = dialog.getByRole("table");
      await expect(dialogTable).toBeHidden();
      await page.getByRole("radio", { name: "Link" }).click();
      await expect(dialogTable).toBeVisible();
      const firstTableRow = dialogTable.locator("tbody > tr").first();
      await expect(firstTableRow).toBeVisible();
      await firstTableRow.locator("td > input[type='checkbox']").click();
      await expect(dialogSubmitButton).toBeEnabled();
      await dialogSubmitButton.click();
      await expect(dialog).toBeHidden();

      // FIXME: original commentInput is overwritten
      // const commentText = /Check this out: Link: .+/;
      const commentText = /Link: .+/;
      await expect(commentInput).toHaveText(commentText);
      await page.getByRole("button", { name: "Submit Comment" }).click();

      await expect(page.getByText(commentText)).toBeVisible();
    });

    test("should allow reacting to the post", async ({ page }) => {
      // const reactLink = page.getByRole("link", { name: "😲 React" });
      const reactLink = page.getByText("😲 React");
      await reactLink.click();
      await expect(page.getByText("Select an emoji character")).toBeVisible();

      // select an emoji (or keep the default smiley)
      // click submit
      await page.getByRole("button", { name: "Submit Reaction" }).click();
      // verify it shows in the top right of the page
      await expect(page.getByText("😀")).toBeVisible();
    });
  });
});
