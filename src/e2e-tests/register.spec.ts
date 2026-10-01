import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import pg from "pg";
const Client = pg.Client;

let client: pg.Client;

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
  await client.query("delete from users where username = 'Test3'");
  await client.end();
});

test("click on register link", async ({ page }) => {
  await page.goto("http://localhost:3000");

  await expect(page).toHaveURL("http://localhost:3000/insights");
  await expect(
    page.getByRole("heading", { name: /My Insights \([0-9]+\)/ }),
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
  await page.getByLabel("Email").fill("test@test.com");

  await expect(registerButton).toBeDisabled();

  await expect(page.getByLabel("Username")).toBeVisible();
  await page.getByLabel("Username").fill("Test3");

  await expect(registerButton).toBeDisabled();

  await expect(page.getByLabel("Password")).toBeVisible();
  await page.getByLabel("Password").fill("asdf12");

  await expect(registerButton).toBeEnabled();
  await registerButton.click();

  await expect(page).toHaveURL("http://localhost:3000/insights", {
    timeout: 30000,
  });
});
