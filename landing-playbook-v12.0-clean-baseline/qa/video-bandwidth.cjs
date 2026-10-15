// Functional bandwidth checks with a 45-second HLS fixture; never requests Bunny.
const { chromium } = require("playwright");
const fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vsl-bounded-"));
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
  "45",
  "-c:v",
  "libx264",
  "-preset",
  "ultrafast",
  "-b:v",
  "400k",
  "-maxrate",
  "400k",
  "-bufsize",
  "800k",
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
  path.join(dir, "media.m3u8"),
]);
const base = process.env.APP_URL || "http://127.0.0.1:8783/";
const site = path.resolve(__dirname, "..");
const oldApp = execFileSync(
  "git",
  [
    "show",
    "7abb21a2da0ecf021fdbaa51b54917b07d510096:landing-playbook-v12.0-clean-baseline/js/app.js",
  ],
  { cwd: path.resolve(site, "..") },
);
const results = [];
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    for (const mode of [
      "previous",
      "bounded",
      "save-data",
      "native-only",
      "initially-hidden",
    ]) {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      });
      await context.addInitScript(
        ({ saving, hidden }) => {
          window.__hidden = hidden;
          Object.defineProperty(document, "hidden", {
            get: () => window.__hidden,
          });
          if (saving)
            Object.defineProperty(navigator, "connection", {
              value: { saveData: true, effectiveType: "4g" },
            });
        },
        { saving: mode === "save-data", hidden: mode === "initially-hidden" },
      );
      const page = await context.newPage();
      const errors = [],
        requests = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      if (mode === "previous")
        await page.route("**/js/app*.js", (r) =>
          r.fulfill({ contentType: "text/javascript", body: oldApp }),
        );
      else
        await page.route("**/hls-stream-optimized.js", (r) => {
          let body = fs.readFileSync(
            path.join(site, "js/vendor/hls-stream-optimized.js"),
            "utf8",
          );
          const match = body.match(/(\w+) as default/);
          body =
            body.replace(match[0], "ObservedHls as default") +
            `\nclass ObservedHls extends ${match[1]} { static isSupported(){return ${mode !== "native-only"} && super.isSupported();} constructor(config){super(config);window.__engine=this;} }`;
          return r.fulfill({ contentType: "text/javascript", body });
        });
      await page.route("https://vz-d4744015-b5b.b-cdn.net/**", (r) => {
        const url = new URL(r.request().url()),
          name = url.pathname.split("/").pop();
        const body =
          name === "playlist.m3u8"
            ? Buffer.from(
                "#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=600000,RESOLUTION=640x360\n360/media.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=1000000,RESOLUTION=854x480\n480/media.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=1280x720\n720/media.m3u8\n",
              )
            : fs.readFileSync(path.join(dir, name));
        requests.push({
          path: url.pathname,
          bytes: body.length,
          segment: name.endsWith(".ts"),
        });
        return r.fulfill({
          headers: { "Access-Control-Allow-Origin": "*" },
          contentType: name.endsWith(".m3u8")
            ? "application/vnd.apple.mpegurl"
            : "video/mp2t",
          body,
        });
      });
      await page.goto(base);
      await page.waitForTimeout(350);
      assert.equal(requests.length, 0, "No Bunny request before viewport");
      const height = await page.evaluate(
        () => document.documentElement.scrollHeight,
      );
      if (mode !== "previous" && mode !== "initially-hidden") {
        await page.locator("[data-video-frame]").scrollIntoViewIfNeeded();
        await page.waitForTimeout(60);
        await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
        await page.waitForTimeout(400);
        assert.equal(
          requests.length,
          0,
          "Passing through the frame does not fetch Bunny media",
        );
      }
      await page.locator("[data-video-frame]").scrollIntoViewIfNeeded();
      if (mode === "initially-hidden") {
        await page.waitForTimeout(350);
        assert.equal(requests.length, 0);
        await page.evaluate(() => {
          window.__hidden = false;
          document.dispatchEvent(new Event("visibilitychange"));
        });
      }
      if (mode === "native-only") {
        await page.waitForFunction(
          () =>
            document.querySelector(".vsl-audio-card strong").textContent ===
            "Reproducir video",
        );
        assert.equal(
          requests.length,
          0,
          "Native-only fallback does not fetch a silent full video",
        );
        await page.locator(".vsl-audio-gate").click();
        await page.waitForFunction(() => {
          const v = document.querySelector("video");
          return (
            !v.muted && !v.paused && v.readyState >= 2 && v.currentTime < 1
          );
        });
        results.push({ mode, passed: true, beforeClickBytes: 0 });
      } else {
        await page.waitForFunction(() => {
          const v = document.querySelector("video");
          return !v.paused && v.currentTime > 0.5;
        });
        if (mode !== "previous")
          await page.locator("video").evaluate((v) => {
            window.__loops = 0;
            v.addEventListener("seeking", () => {
              if (v.currentTime < 0.2) window.__loops++;
            });
          });
        await page.waitForTimeout(7500);
        const preview = requests.filter((r) => r.segment),
          previewBytes = preview.reduce((sum, r) => sum + r.bytes, 0);
        if (mode === "previous")
          results.push({
            mode,
            passed: true,
            previewBytes,
            previewSegmentRequests: preview.length,
          });
        else {
          assert.ok(
            await page.evaluate(() => window.__loops >= 2),
            "Preview loops without downloading further segments",
          );
          assert.equal(
            preview.length,
            1,
            "Only one encoded video segment is requested for the silent preview",
          );
          assert.ok(
            preview[0].path.includes("/360/"),
            "Preview remains on lowest available rendition",
          );
          const beforeAudio = requests.length,
            first = preview[0].path;
          const previewDuration = await page
            .locator("video")
            .evaluate((v) => v.duration);
          assert.ok(previewDuration <= 2.1);
          await page.locator(".vsl-audio-gate").click();
          await page.waitForFunction(() => {
            const v = document.querySelector("video");
            return (
              !v.muted &&
              !v.paused &&
              v.readyState >= 2 &&
              v.currentTime < 0.8 &&
              v.duration > 44
            );
          });
          assert.equal(
            requests.filter((r) => r.path === first).length,
            1,
            "Audio restart reuses preview bytes even with browser HTTP cache disabled by routing",
          );
          await page.waitForFunction(
            () => document.querySelector("video").currentTime > 2.5,
          );
          const quality = await page.evaluate(() => ({
            cap: window.__engine.autoLevelCapping,
            levels: window.__engine.levels.map((l) => l.height),
            buffer: window.__engine.config.maxMaxBufferLength,
          }));
          assert.ok(
            quality.levels[quality.cap] <= (mode === "save-data" ? 360 : 480),
          );
          assert.ok(quality.buffer <= 6);
          await page.evaluate(() => {
            window.__hidden = true;
            document.dispatchEvent(new Event("visibilitychange"));
          });
          await page.waitForFunction(
            () => document.querySelector("video").paused,
          );
          await page.waitForTimeout(200);
          const stopped = requests.length;
          await page.waitForTimeout(500);
          assert.equal(requests.length, stopped);
          await page.evaluate(() => {
            window.__hidden = false;
            document.dispatchEvent(new Event("visibilitychange"));
          });
          await page.waitForFunction(
            () => !document.querySelector("video").paused,
          );
          await page.locator(".vsl-play-pause").click();
          await page.evaluate(() => {
            window.__hidden = true;
            document.dispatchEvent(new Event("visibilitychange"));
            window.__hidden = false;
            document.dispatchEvent(new Event("visibilitychange"));
          });
          assert.ok(await page.locator("video").evaluate((v) => v.paused));
          results.push({
            mode,
            passed: true,
            previewBytes,
            previewSegmentRequests: preview.length,
            loops: await page.evaluate(() => window.__loops),
            audioRestartUsesCachedFirstSegment: true,
            previewDuration,
            quality,
          });
        }
      }
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollHeight),
        height,
      );
      assert.deepEqual(errors, []);
      console.log("PASS", mode, JSON.stringify(results.at(-1)));
      await context.close();
    }
    const baseline = results.find((r) => r.mode === "previous"),
      updated = results.find((r) => r.mode === "bounded");
    assert.ok(
      updated.previewBytes < baseline.previewBytes,
      "Bounded preview uses fewer fixture bytes than the previous implementation",
    );
    fs.writeFileSync(
      path.join(__dirname, "video-bandwidth-results.json"),
      JSON.stringify(
        {
          fixture:
            "45s H264/AAC, 2s segments, local responses; no live Bunny access",
          results,
          previewReductionPercent:
            100 * (1 - updated.previewBytes / baseline.previewBytes),
        },
        null,
        2,
      ) + "\n",
    );
  } finally {
    await browser.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
