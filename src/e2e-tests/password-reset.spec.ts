import { test, expect } from "@playwright/test";

import { email, password } from "./constants";

const resetPassword = `reset-${Date.now()}!ok`;

test("forgot password → reset → login with new password", async ({
  page,
  context,
}) => {
  await context.clearCookies();

  await page.goto("http://localhost:3000/forgot-password");
  await expect(
    page.getByRole("heading", { name: "Forgot password" }),
  ).toBeVisible();

  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();

  const resetLink = page.getByTestId("local-reset-link");
  await expect(resetLink).toBeVisible({ timeout: 10_000 });
  await resetLink.click();

  await expect(
    page.getByRole("heading", { name: "Choose a new password" }),
  ).toBeVisible();

  await page.getByLabel("New password").fill(resetPassword);
  await page.getByLabel("Confirm password").fill(resetPassword);
  await page.getByRole("button", { name: "Update password" }).click();

  await page.waitForURL(/\/login\?passwordReset=1/, { timeout: 10_000 });
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(
    page.getByText("Your password was updated. Sign in with your new password."),
  ).toBeVisible();

  // Stale cookie must not auto-bounce away from the form.
  await expect(page.getByLabel("Email")).toBeVisible();
  await page.getByLabel("Email").fill(email);
  await page.locator("#password").fill(resetPassword);
  await page.getByRole("button", { name: "Sign in" }).click();

  await page.waitForURL("http://localhost:3000/insights");
  await expect(
    page.getByRole("heading", { name: "My Insights" }),
  ).toBeVisible();

  // Restore the seeded password so later e2e specs keep working.
  await context.clearCookies();
  const forgot = await page.request.post(
    "http://localhost:3000/api/forgot-password",
    {
      data: { email },
      headers: { Origin: "http://localhost:3000" },
    },
  );
  const forgotBody = (await forgot.json()) as { resetPath?: string };
  expect(forgotBody.resetPath).toMatch(/^\/reset-password\?token=/);

  const token = new URL(
    forgotBody.resetPath!,
    "http://localhost:3000",
  ).searchParams.get("token");
  expect(token).toBeTruthy();

  const restore = await page.request.post(
    "http://localhost:3000/api/reset-password",
    {
      data: { token, password },
    },
  );
  expect(restore.ok()).toBeTruthy();

  const login = await page.request.post("http://localhost:3000/api/login", {
    data: { email, password },
  });
  expect(login.ok()).toBeTruthy();
});

test("reset flow still works when a stale auth cookie is present", async ({
  page,
  context,
}) => {
  await context.clearCookies();
  // Simulate a leftover session cookie whose server session was wiped.
  await context.addCookies([
    {
      name: "token",
      value: "stale-invalid-token",
      domain: "localhost",
      path: "/",
    },
  ]);

  const forgot = await page.request.post(
    "http://localhost:3000/api/forgot-password",
    {
      data: { email },
      headers: { Origin: "http://localhost:3000" },
    },
  );
  const { resetPath } = (await forgot.json()) as { resetPath: string };
  const token = new URL(resetPath, "http://localhost:3000").searchParams.get(
    "token",
  );
  const nextPassword = `stale-${Date.now()}!ok`;

  await page.goto(`http://localhost:3000${resetPath}`);
  await page.getByLabel("New password").fill(nextPassword);
  await page.getByLabel("Confirm password").fill(nextPassword);
  await page.getByRole("button", { name: "Update password" }).click();

  await page.waitForURL(/\/login\?passwordReset=1/);
  await expect(page.getByLabel("Email")).toBeVisible();
  await page.getByLabel("Email").fill(email);
  await page.locator("#password").fill(nextPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("http://localhost:3000/insights");

  // Restore seeded password.
  const restoreForgot = await page.request.post(
    "http://localhost:3000/api/forgot-password",
    {
      data: { email },
      headers: { Origin: "http://localhost:3000" },
    },
  );
  const restoreBody = (await restoreForgot.json()) as { resetPath: string };
  const restoreToken = new URL(
    restoreBody.resetPath,
    "http://localhost:3000",
  ).searchParams.get("token");
  await page.request.post("http://localhost:3000/api/reset-password", {
    data: { token: restoreToken, password },
  });

  // token used so TypeScript knows we fetched it above
  expect(token).toBeTruthy();
});
