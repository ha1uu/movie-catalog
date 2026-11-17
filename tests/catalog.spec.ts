import { test, expect } from "@playwright/test";

test("SSR renders catalog, film and person without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator(".movie-card:not(.skeleton-card)")).toHaveCount(6);
  await page.goto("/movies/free-guy");
  await expect(page.locator("h1")).toHaveText("Главный герой");
  await expect(page.locator(".detail-description")).toContainText(
    "персонаж видеоигры",
  );
  await expect(page).toHaveTitle(/Главный герой \(2021\)/);
  await page.goto("/people/ryan-reynolds");
  await expect(page.locator("h1")).toHaveText("Райан Рейнольдс");
  await expect(page.locator(".movie-card")).toHaveCount(2);
  await context.close();
});

test("filters survive reload, combine and reset; sorting works", async ({
  page,
}) => {
  await page.goto("/movies");
  await page.getByRole("button", { name: "Драма", exact: true }).click();
  await expect(page).toHaveURL(/genre=/);
  await expect(page.locator(".movie-card:not(.skeleton-card)")).toHaveCount(3);
  await page.getByLabel("Год выпуска").selectOption("2021");
  await expect(page.getByText("Пока ни одного совпадения")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Год выпуска")).toHaveValue("2021");
  await expect(page.getByText("Пока ни одного совпадения")).toBeVisible();
  await page.getByRole("button", { name: "Сбросить", exact: true }).click();
  await expect(page).toHaveURL(/\/movies$/);
  await page.getByLabel("Сортировка").selectOption("rating");
  await expect(page.locator(".movie-title").first()).toHaveText("Бэтмен");
  await page.getByLabel("Год выпуска").selectOption("2021");
  await expect(page.locator(".movie-card:not(.skeleton-card)")).toHaveCount(2);
});

test("search, movie details and person links form a working flow", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("searchbox", { name: "Найти фильм" })
    .fill("Главный герой");
  await page.getByRole("searchbox", { name: "Найти фильм" }).press("Enter");
  await expect(page.locator(".movie-card:not(.skeleton-card)")).toHaveCount(1);
  await page.locator(".movie-title").click();
  await expect(page.locator("h1")).toHaveText("Главный герой");
  await page.getByRole("link", { name: "Шон Леви", exact: true }).click();
  await expect(page.locator("h1")).toHaveText("Шон Леви");
  await expect(page.locator(".movie-card")).toHaveCount(2);
});

test("infinite scrolling shows skeletons and loads unique movies to the end", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.route("**/api/movies?*page=2*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.continue();
  });
  await page.goto("/");
  await expect(page.locator(".movie-card:not(.skeleton-card)")).toHaveCount(6);
  await expect(page.locator(".skeleton-card")).toHaveCount(6);
  await page.locator(".load-area").scrollIntoViewIfNeeded();
  await expect(page.locator(".movie-card:not(.skeleton-card)")).toHaveCount(12);
  await expect(page.locator(".skeleton-card")).toHaveCount(0);
  await expect(page.locator(".end-message")).toBeVisible();
  const urls = await page
    .locator(".movie-title")
    .evaluateAll((links) =>
      links.map((a) => (a as HTMLAnchorElement).pathname),
    );
  expect(new Set(urls).size).toBe(12);
});

test("favorites persist on reload and can be removed", async ({ page }) => {
  await page.goto("/movies/free-guy");
  await page
    .getByRole("button", { name: "Буду смотреть", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "В избранном", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("link", { name: "Избранное", exact: true }).click();
  await expect(page.locator(".movie-card")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".movie-title")).toHaveText("Главный герой");
  await page
    .getByRole("button", { name: "Убрать из избранного: Главный герой" })
    .click();
  await expect(page.getByText("Здесь начнётся ваша коллекция")).toBeVisible();
});

test("mobile layout has no horizontal overflow and navigation works", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Открыть меню" }).click();
  await page
    .getByRole("navigation", { name: "Мобильная навигация" })
    .getByRole("link", { name: "Персоны" })
    .click();
  await expect(page.locator("h1")).toContainText("Люди, которые создают кино");
  await expect(
    page.getByRole("navigation", { name: "Мобильная навигация" }),
  ).toHaveCount(0);
  await page.locator(".person-card").first().click();
  await expect(page.locator("h1")).toHaveText("Райан Рейнольдс");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});

test("unknown routes return 404 and provide recovery", async ({ page }) => {
  const response = await page.goto("/movies/missing-film");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("Этот кадр потерялся")).toBeVisible();
  await page.getByRole("button", { name: "На главную" }).click();
  await expect(page.locator("h1")).toContainText("Каждый кадр");
});

test("catalog has a retry state after a failed filter request", async ({
  page,
}) => {
  await page.goto("/movies");
  await page.route("**/api/movies?**", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: '{"message":"Temporarily unavailable"}',
    }),
  );
  await page.getByRole("button", { name: "Детектив", exact: true }).click();
  await expect(page.getByText("Не удалось загрузить фильмы")).toBeVisible();
  await page.unroute("**/api/movies?**");
  await page.getByRole("button", { name: "Попробовать снова" }).click();
  await expect(page.locator(".movie-card:not(.skeleton-card)")).toHaveCount(2);
});
