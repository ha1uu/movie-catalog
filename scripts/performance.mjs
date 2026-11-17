import { chromium } from "@playwright/test";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const results = [];
try {
  for (const path of ["/", "/movies/free-guy", "/people/ryan-reynolds"]) {
    const context = await browser.newContext({
      viewport: { width: 1365, height: 900 },
    });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 150,
      downloadThroughput: 200000,
      uploadThroughput: 93750,
      connectionType: "cellular3g",
    });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.addInitScript(() => {
      window.__metrics = { cls: 0, shifts: [], lcp: 0 };
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          if (!entry.hadRecentInput) {
            window.__metrics.cls += entry.value;
            window.__metrics.shifts.push({
              value: entry.value,
              sources: entry.sources?.map((source) => source.node?.className),
            });
          }
      }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((list) => {
        window.__metrics.lcp = list.getEntries().at(-1)?.startTime || 0;
      }).observe({ type: "largest-contentful-paint", buffered: true });
    });
    await page.goto(base + path, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    const metrics = await page.evaluate(() => ({
      ...window.__metrics,
      fcp: performance.getEntriesByName("first-contentful-paint")[0]?.startTime,
      ttfb: performance.getEntriesByType("navigation")[0]?.responseStart,
    }));
    results.push({ path, ...metrics });
    await context.close();
  }
  console.log(
    JSON.stringify(
      {
        conditions:
          "Chromium, cold cache, 1.6 Mbps down / 150 ms latency, 4x CPU slowdown, local production server",
        results,
      },
      null,
      2,
    ),
  );
  if (results.some((r) => !r.fcp || r.fcp >= 1500 || r.cls > 0.01))
    process.exitCode = 1;
} finally {
  await browser.close();
}
