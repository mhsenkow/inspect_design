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

  await expect(page).toHaveURL(
    "http://localhost:3000/register?return=/insights",
  );
});

test("do registration", async ({ page }) => {
  await page.goto("http://localhost:3000/register?return=/insights");

  await expect(
    page.getByRole("heading", {
      name: "Register for Inspect by Datagotchi Labs",
    }),
  ).toBeVisible();

  const registerButton = page.getByRole("button", { name: "Register" });
  await expect(registerButton).toBeVisible();
  await expect(registerButton).toBeDisabled();

  // const emailField = page.getByRole("textbox", { name: "Email:" });
  const emailLabel = page.locator("label").filter({ hasText: "Email:" });
  await expect(emailLabel).toHaveText("Email:");
  const emailField = emailLabel.locator("input");
  await expect(emailField).toBeEmpty();
  await emailField.fill("test@test.com");
  await expect(emailField).toHaveValue("test@test.com");

  await expect(registerButton).toBeDisabled();

  // const usernameField = page.getByRole("textbox", { name: "Username:" });
  const usernameLabel = page.locator("label").filter({ hasText: "Username:" });
  await expect(usernameLabel).toHaveText("Username:");
  const usernameField = usernameLabel.locator("input");
  await expect(usernameField).toBeEmpty();
  await usernameField.fill("Test3");
  await expect(usernameField).toHaveValue("Test3");

  await expect(registerButton).toBeDisabled();

  // const passwordField = page.getByRole("textbox", { name: "Password:" });
  const passwordLabel = page.locator("label").filter({ hasText: "Password:" });
  await expect(passwordLabel).toHaveText("Password:");
  const passwordField = passwordLabel.locator("input");
  await expect(passwordField).toBeEmpty();
  await passwordField.fill("asdf");
  await expect(passwordField).toHaveValue("asdf");

  await expect(registerButton).toBeEnabled();
  await registerButton.click();

  await expect(page).toHaveURL("http://localhost:3000/insights", {
    timeout: 30000,
  });
});

// uncomment this test after enabling the follow page
// test("follow top authors", async ({ page }) => {
//   // await page.goto("http://localhost:3000/follow");

//   await expect(
//     page.getByRole("heading", { name: "Follow Summary Authors" }),
//   ).toBeVisible();

//   // ...
// });
