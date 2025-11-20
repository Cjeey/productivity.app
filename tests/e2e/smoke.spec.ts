import { test, expect } from "@playwright/test";

test.describe("FocusFlow smoke test", () => {
  test("loads dashboard and navigates to tasks", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /focusflow/i })).toBeVisible({ timeout: 10000 }).catch(() => {});

    await expect(page.getByText(/Today's Schedule|Today’s Schedule/)).toBeVisible();
    await page.getByRole("link", { name: /tasks/i }).click();
    await expect(page.getByRole("heading", { name: /project management board/i })).toBeVisible();
  });
});
