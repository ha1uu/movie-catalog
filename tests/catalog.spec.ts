import { test, expect } from "@playwright/test";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { execFile } from "node:child_process";

async function runDoctor(
  contents?: string,
  overrides: Record<string, string> = {},
) {
  const cwd = await mkdtemp(join(tmpdir(), "kadr-doctor-"));
  try {
    if (contents !== undefined)
      await writeFile(join(cwd, ".env"), contents, { mode: 0o600 });
    const env: Record<string, string | undefined> = {
      ...process.env,
      NUXT_TMDB_API_BASE: "http://127.0.0.1:4010/3",
    };
    delete env.NUXT_TMDB_READ_TOKEN;
    Object.assign(env, overrides);
    return await new Promise<{ code: string | number; output: string }>(
      (done) => {
        execFile(
          process.execPath,
          [resolve("scripts/doctor.mjs")],
          { cwd, env },
          (error, stdout, stderr) =>
            done({ code: error?.code || 0, output: stdout + stderr }),
        );
      },
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
}

test("SSR renders catalog, film and person without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator(".movie-card:not(.skeleton-card)")).toHaveCount(12);
  await page.goto("/movies/550988");
  await expect(page.locator("h1")).toHaveText("Главный герой");
  await expect(page.locator(".detail-description")).toContainText(
    "персонаж видеоигры",
  );
  await expect(page).toHaveTitle(/Главный герой \(2021\)/);
  await page.goto("/people/10859");
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
  await expect(page.locator(".movie-card:not(.skeleton-card)")).toHaveCount(12);
  await expect(page.locator(".skeleton-card")).toHaveCount(12);
  await page.locator(".load-area").scrollIntoViewIfNeeded();
  await expect
    .poll(() => page.locator(".movie-card:not(.skeleton-card)").count())
    .toBeGreaterThanOrEqual(24);
  await page.locator(".load-area").scrollIntoViewIfNeeded();
  await expect(page.locator(".movie-card:not(.skeleton-card)")).toHaveCount(31);
  await expect(page.locator(".skeleton-card")).toHaveCount(0);
  await expect(page.locator(".end-message")).toBeVisible();
  const urls = await page
    .locator(".movie-title")
    .evaluateAll((links) =>
      links.map((a) => (a as HTMLAnchorElement).pathname),
    );
  expect(new Set(urls).size).toBe(31);
});

test("favorites persist on reload and can be removed", async ({ page }) => {
  await page.goto("/movies/550988");
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

test("server forwards filters to TMDB, bridges 20-result pages without duplicates, and keeps token private", async ({
  request,
}) => {
  const one = await (await request.get("/api/movies")).json();
  const two = await (await request.get("/api/movies?page=2")).json();
  const three = await (await request.get("/api/movies?page=3")).json();
  expect([one.items.length, two.items.length, three.items.length]).toEqual([
    12, 12, 7,
  ]);
  expect(
    new Set(
      [...one.items, ...two.items, ...three.items].map((movie) => movie.id),
    ).size,
  ).toBe(31);
  expect(three.hasMore).toBe(false);
  await request.get(
    "/api/movies?genre=" +
      encodeURIComponent("Драма") +
      "&year=2022&sort=rating",
  );
  const calls = await (
    await request.get("http://127.0.0.1:4010/__requests")
  ).json();
  expect(
    calls.some(
      (call: { path: string; query: Record<string, string> }) =>
        call.path === "/3/discover/movie" &&
        call.query.with_genres === "18" &&
        call.query.primary_release_year === "2022" &&
        call.query.sort_by === "vote_average.desc" &&
        call.query["vote_count.gte"] === "300",
    ),
  ).toBe(true);
  const html = await (await request.get("/movies/550988")).text();
  expect(html).not.toContain("tmdb-fixture-only");
  expect(html).not.toContain("tmdbReadToken");
  expect(html).toContain("Рейтинг TMDB");
});

test("provider authentication, rate limits and outages are not disguised as 404", async ({
  request,
}) => {
  for (const [id, status] of [
    [990401, 502],
    [990429, 503],
    [990500, 502],
    [999999, 404],
  ]) {
    expect((await request.get(`/api/movies/${id}`)).status()).toBe(status);
    expect((await request.get(`/movies/${id}`)).status()).toBe(status);
  }
  expect((await request.get("/api/movies?page=NaN")).status()).toBe(400);
  expect((await request.get("/api/movies?page=835")).status()).toBe(400);
  expect((await request.get("/api/movies?q=hero&genre=18")).status()).toBe(400);
});

test("missing configuration returns 503 instead of static fallback", async ({
  request,
}) => {
  const response = await request.get("http://127.0.0.1:3101/api/movies");
  expect(response.status()).toBe(503);
  expect((await response.json()).data.code).toBe("CATALOG_NOT_CONFIGURED");
  const html = await (await request.get("http://127.0.0.1:3101/")).text();
  expect(html).not.toContain("Главный герой");
  expect(html).toContain("Не удалось загрузить фильмы");
  expect(
    (await request.get("http://127.0.0.1:3101/movies/550988")).status(),
  ).toBe(503);
});

test("old saved slugs migrate to TMDB IDs", async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "kadr-saved",
      JSON.stringify(["free-guy", "the-adam-project"]),
    ),
  );
  await page.goto("/saved");
  await expect(page.locator(".movie-title")).toHaveCount(2);
  await expect(page.locator(".movie-title").first()).toHaveAttribute(
    "href",
    "/movies/550988",
  );
});

test("changing filters cancels an obsolete in-flight page", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  let release: () => void = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/movies?*page=2*", async (route) => {
    await held;
    try {
      await route.continue();
    } catch {
      /* The filter change cancels this request. */
    }
  });
  await page.goto("/");
  const request = page.waitForRequest(
    (request) =>
      request.url().includes("/api/movies?") &&
      request.url().includes("page=2"),
  );
  await page.locator(".load-area").scrollIntoViewIfNeeded();
  await request;
  await page.getByRole("button", { name: "Драма", exact: true }).click();
  release();
  await expect(page.locator(".movie-card:not(.skeleton-card)")).toHaveCount(3);
  await expect(page.locator(".movie-title")).not.toContainText([
    "Главный герой",
  ]);
});

test("person filmography is deduplicated and paginated", async ({
  page,
  request,
}) => {
  const first = await (await request.get("/api/people/900001")).json();
  const second = await (await request.get("/api/people/900001?page=2")).json();
  expect(first.totalMovies).toBe(31);
  expect(first.movies).toHaveLength(24);
  expect(second.movies).toHaveLength(7);
  expect(second.hasMore).toBe(false);
  await page.goto("/people/900001");
  await expect(page.locator(".movie-card")).toHaveCount(24);
  await page.getByRole("button", { name: "Ещё фильмы", exact: true }).click();
  await expect(page.locator(".movie-card")).toHaveCount(31);
});

test("doctor reads .env and respects injected runtime credentials without printing them", async () => {
  const fromFile = await runDoctor("NUXT_TMDB_READ_TOKEN=tmdb-fixture-only");
  expect(fromFile.code).toBe(0);
  expect(fromFile.output).toContain("каталог получен");
  expect(fromFile.output).not.toContain("tmdb-fixture-only");
  const fromProcess = await runDoctor("NUXT_TMDB_READ_TOKEN=wrong-file-token", {
    NUXT_TMDB_READ_TOKEN: "tmdb-fixture-only",
  });
  expect(fromProcess.code).toBe(0);
  expect(fromProcess.output).not.toContain("tmdb-fixture-only");
  expect(fromProcess.output).not.toContain("wrong-file-token");
});

test("doctor explains a rejected or incorrectly pasted token", async () => {
  const rejected = await runDoctor("NUXT_TMDB_READ_TOKEN=wrong-fixture-token");
  expect(rejected.code).toBe(1);
  expect(rejected.output).toContain("HTTP 401");
  expect(rejected.output).not.toContain("wrong-fixture-token");
  const prefixed = await runDoctor(
    'NUXT_TMDB_READ_TOKEN="Bearer wrong-fixture-token"',
  );
  expect(prefixed.code).toBe(1);
  expect(prefixed.output).toContain("без префикса Bearer");
  expect(prefixed.output).not.toContain("wrong-fixture-token");
});

test("doctor distinguishes missing configuration and connectivity failure", async () => {
  const missing = await runDoctor();
  expect(missing.code).toBe(1);
  expect(missing.output).toContain("Не задан NUXT_TMDB_READ_TOKEN");
  const unreachable = await runDoctor(
    "NUXT_TMDB_READ_TOKEN=tmdb-fixture-only",
    { NUXT_TMDB_API_BASE: "http://127.0.0.1:0/3" },
  );
  expect(unreachable.code).toBe(1);
  expect(unreachable.output).toContain("Не удалось соединиться с TMDB");
  expect(unreachable.output).not.toContain("tmdb-fixture-only");
});

test("local development shows setup instructions while production keeps a general error", async ({
  page,
  request,
}) => {
  await page.goto("http://127.0.0.1:3102/");
  await expect(
    page.getByRole("complementary", {
      name: "Диагностика для локального запуска",
    }),
  ).toBeVisible();
  await expect(page.locator(".catalog-setup-hint")).toContainText(
    "NUXT_TMDB_READ_TOKEN",
  );
  await expect(page.locator(".catalog-setup-hint")).toContainText(
    "npm run doctor",
  );
  const html = await (await request.get("http://127.0.0.1:3101/")).text();
  expect(html).not.toContain("Создайте .env рядом с package.json");
});
