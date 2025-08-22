import { test, expect } from "@playwright/test";
import { email, password } from "./constants";

test("click on login link", async ({ page }) => {
  await page.goto("http://localhost:3000");
  await page.waitForURL("http://localhost:3000/insights");
  await expect(page).toHaveURL("http://localhost:3000/insights");
  await expect(
    page.getByRole("heading", { name: /My Insights \([0-9]+\)/ }),
  ).toBeVisible();

  await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  await page.getByRole("link", { name: "Login" }).click();

  await expect(page).toHaveURL("http://localhost:3000/login?return=/insights");
});

test("do login", async ({ page }) => {
  await page.goto("http://localhost:3000/login?return=/insights");

  await expect(
    page.getByRole("heading", { name: "Login to Inspect" }),
  ).toBeVisible();

  const loginButton = page.getByRole("button", { name: "Login" });
  await expect(loginButton).toBeVisible();
  await expect(loginButton).toBeDisabled();

  await expect(page.getByRole("textbox", { name: "Email:" })).toBeVisible();
  await page.getByRole("textbox", { name: "Email:" }).fill(email);

  await expect(loginButton).toBeDisabled();

  await expect(page.getByRole("textbox", { name: "Password:" })).toBeVisible();
  await page
    .getByRole("textbox", { name: "Password:" })
    .fill(`${password}-wrong`);

  await expect(loginButton).toBeEnabled();
  await loginButton.click();

  await expect(page.getByText("Invalid credentials")).toBeVisible();

  await page.getByRole("textbox", { name: "Password:" }).fill(password);

  await loginButton.click();

  await page.waitForURL("http://localhost:3000/insights");

  await expect(page).toHaveURL("http://localhost:3000/insights");
});
