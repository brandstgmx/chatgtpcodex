// Run against the local site: APP_URL=http://127.0.0.1:8781/ node video-performance.cjs
// Uses a generated HLS fixture: no live Bunny media or billable delivery requests.
const { chromium } = require("playwright");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "vsl-performance-"));
execFileSync("ffmpeg", [
  "-hide_banner",
  "-loglevel",
  "error",
  "-f",
  "lavfi",
  "-i",
  "testsrc2=size=640x360:rate=24",
  "-f",
  "lavfi",
  "-i",
  "sine=frequency=440:sample_rate=44100",
  "-t",
  "18",
  "-c:v",
  "libx264",
  "-preset",
  "ultrafast",
  "-g",
  "48",
  "-pix_fmt",
  "yuv420p",
  "-c:a",
  "aac",
  "-f",
  "hls",
  "-hls_time",
  "2",
  "-hls_playlist_type",
  "vod",
  path.join(fixture, "media.m3u8"),
]);
const site = path.resolve(__dirname, "..");
const base = process.env.APP_URL || "http://127.0.0.1:8781/";
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const results = [];
  try {
    for (const mode of ["native", "mse", "save-data", "initially-hidden"]) {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      });
      await context.addInitScript(
        ({ forceMse, saveData, hidden }) => {
          if (forceMse) {
            const original = HTMLMediaElement.prototype.canPlayType;
            HTMLMediaElement.prototype.canPlayType = function (type) {
              return /mpegurl/i.test(type) ? "" : original.call(this, type);
            };
          }
          if (saveData)
            Object.defineProperty(navigator, "connection", {
              value: { saveData: true, effectiveType: "4g" },
            });
          window.__testHidden = hidden;
          Object.defineProperty(document, "hidden", {
            get: () => window.__testHidden,
          });
        },
        {
          forceMse: mode !== "native",
          saveData: mode === "save-data",
          hidden: mode === "initially-hidden",
        },
      );
      const page = await context.newPage();
      const errors = [],
        requests = [];
      let libraryRequests = 0;
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      await page.route("**/hls-stream-optimized.js", (route) => {
        libraryRequests++;
        let body = fs.readFileSync(
          path.join(site, "js/vendor/hls-stream-optimized.js"),
          "utf8",
        );
        const match = body.match(/(\w+) as default/);
        body =
          body.replace(match[0], "ObservedHls as default") +
          `\nclass ObservedHls extends ${match[1]} { constructor(config) { super(config); window.__testHls = this; } }`;
        return route.fulfill({ contentType: "text/javascript", body });
      });
      await page.route("https://vz-d4744015-b5b.b-cdn.net/**", (route) => {
        const name = new URL(route.request().url()).pathname.split("/").pop();
        requests.push(name);
        if (name === "playlist.m3u8")
          return route.fulfill({
            contentType: "application/vnd.apple.mpegurl",
            headers: { "Access-Control-Allow-Origin": "*" },
            body: "#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=500000,RESOLUTION=854x480\nmedia.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=1000000,RESOLUTION=1280x720\nmedia.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=1920x1080\nmedia.m3u8\n",
          });
        return route.fulfill({
          headers: { "Access-Control-Allow-Origin": "*" },
          contentType: name.endsWith(".m3u8")
            ? "application/vnd.apple.mpegurl"
            : "video/mp2t",
          body: fs.readFileSync(path.join(fixture, name)),
        });
      });
      await page.goto(base);
      await page.waitForTimeout(600);
      assert.equal(
        requests.length,
        0,
        "No media fetched before the video approaches the viewport",
      );
      assert.equal(
        libraryRequests,
        0,
        "No HLS library in the initial page load",
      );
      const documentHeight = await page.evaluate(
        () => document.documentElement.scrollHeight,
      );
      await page.locator("[data-video-frame]").scrollIntoViewIfNeeded();
      if (mode === "initially-hidden") {
        await page.waitForTimeout(400);
        assert.equal(
          requests.length,
          0,
          "Background tabs do not begin downloading",
        );
        await page.evaluate(() => {
          window.__testHidden = false;
          document.dispatchEvent(new Event("visibilitychange"));
        });
      }
      await page.waitForFunction(
        () =>
          document.querySelector("video").currentTime > 1 &&
          !document.querySelector("video").paused,
      );
      assert.equal(libraryRequests, mode === "native" ? 0 : 1);
      if (mode !== "native") {
        const config = await page.evaluate(() => ({
          buffer: window.__testHls.config.maxMaxBufferLength,
          cap: window.__testHls.autoLevelCapping,
          levels: window.__testHls.levels.map((l) => l.height),
        }));
        assert.ok(config.buffer <= 12);
        assert.ok(
          config.levels[config.cap] <= 480,
          "Silent preview capped to 480p",
        );
      }
      await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
      await page.waitForFunction(() => document.querySelector("video").paused);
      await page.waitForTimeout(250);
      const stopped = requests.length;
      await page.waitForTimeout(600);
      if (mode !== "native")
        assert.equal(
          requests.length,
          stopped,
          "MSE stops downloading while preview is offscreen",
        );
      await page.locator("[data-video-frame]").scrollIntoViewIfNeeded();
      await page.waitForFunction(() => !document.querySelector("video").paused);
      await page.locator(".vsl-play-pause").click();
      await page.evaluate(() => {
        window.__testHidden = true;
        document.dispatchEvent(new Event("visibilitychange"));
        window.__testHidden = false;
        document.dispatchEvent(new Event("visibilitychange"));
      });
      await page.waitForTimeout(200);
      assert.ok(
        await page.locator("video").evaluate((v) => v.paused),
        "Manual pause survives tab visibility changes",
      );
      await page.locator(".vsl-audio-gate").click();
      await page.waitForFunction(() => {
        const v = document.querySelector("video");
        return !v.paused && !v.muted && v.readyState >= 2 && v.currentTime < 1;
      });
      if (mode !== "native") {
        const cap = await page.evaluate(
          () =>
            window.__testHls.levels[window.__testHls.autoLevelCapping].height,
        );
        assert.ok(cap <= (mode === "save-data" ? 480 : 720));
      }
      await page.evaluate(() => {
        window.__testHidden = true;
        document.dispatchEvent(new Event("visibilitychange"));
      });
      await page.waitForFunction(() => document.querySelector("video").paused);
      await page.waitForTimeout(250);
      const hiddenRequests = requests.length;
      await page.waitForTimeout(600);
      if (mode !== "native")
        assert.equal(
          requests.length,
          hiddenRequests,
          "MSE stops downloads in background tabs",
        );
      await page.evaluate(() => {
        window.__testHidden = false;
        document.dispatchEvent(new Event("visibilitychange"));
      });
      await page.waitForFunction(() => !document.querySelector("video").paused);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollHeight),
        documentHeight,
      );
      assert.deepEqual(errors, []);
      results.push({
        mode,
        passed: true,
        libraryRequests,
        mediaRequests: requests.length,
      });
      console.log("PASS", mode);
      await context.close();
    }
    fs.writeFileSync(
      path.join(__dirname, "video-performance-results.json"),
      JSON.stringify(results, null, 2) + "\n",
    );
  } finally {
    await browser.close();
    fs.rmSync(fixture, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
