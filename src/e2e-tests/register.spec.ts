import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import Database from "better-sqlite3";
import path from "node:path";
import pg from "pg";
const Client = pg.Client;

let client: pg.Client;
const registerEmail = `e2e-register-${Date.now()}@example.com`;
const registerUsername = `E2EReg${Date.now().toString(36).slice(-6)}`;

test.beforeAll(async () => {
  dotenv.config({ path: "./.env", quiet: true });
  client = new Client({
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    database: "inspect",
  });
  await client.connect();
});

test.afterAll(async () => {
  try {
    await client?.query("delete from users where email = $1::text", [
      registerEmail,
    ]);
  } catch (error) {
    console.error(
      "Failed to clean up registration test user in Postgres",
      error,
    );
  }

  try {
    const db = new Database(path.join(process.cwd(), "fieldnotes.db"));
    db.prepare("delete from users where email = ?").run(registerEmail);
    db.close();
  } catch (error) {
    console.error("Failed to clean up registration test user in SQLite", error);
  }

  try {
    await client?.end();
  } catch (error) {
    console.error("Failed to close registration test DB client", error);
  }
});

test("click on register link", async ({ page }) => {
  await page.goto("http://localhost:3000");

  await expect(page).toHaveURL("http://localhost:3000/insights");
  await expect(
    page.getByRole("heading", { name: "My Insights" }),
  ).toBeVisible();

  await expect(page.getByRole("link", { name: "Register" })).toBeVisible();
  await page.getByRole("link", { name: "Register" }).click();

  await expect(page).toHaveURL(/\/register\?return=/);
});

test("do registration", async ({ page }) => {
  await page.goto("http://localhost:3000/register?return=/insights");

  await expect(
    page.getByRole("heading", { name: "Create account" }),
  ).toBeVisible();

  const registerButton = page.getByRole("button", { name: "Create account" });
  await expect(registerButton).toBeVisible();
  await expect(registerButton).toBeDisabled();

  await expect(page.getByLabel("Email")).toBeVisible();
  await page.getByLabel("Email").fill(registerEmail);

  await expect(registerButton).toBeDisabled();

  await expect(page.getByLabel("Username")).toBeVisible();
  await page.getByLabel("Username").fill(registerUsername);

  await expect(registerButton).toBeDisabled();

  const passwordInput = page.locator("#register-password");
  await expect(passwordInput).toBeVisible();
  await passwordInput.fill("asdf12");

  await expect(registerButton).toBeEnabled();
  await registerButton.click();

  await expect(page).toHaveURL("http://localhost:3000/insights", {
    timeout: 30000,
  });
});
