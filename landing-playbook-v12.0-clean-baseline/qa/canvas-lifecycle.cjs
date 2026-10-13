const { chromium } = require("playwright"),
  fs = require("node:fs"),
  path = require("node:path");
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const p = await b.newPage({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.addInitScript(() => {
    window.__draws = 0;
    const request = requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback) =>
      request((time) => {
        if (callback.name === "drawDots") __draws++;
        callback(time);
      });
  });
  await p.goto(process.env.APP_URL || "http://127.0.0.1:8765/");
  await p.waitForTimeout(500);
  const started = await p.evaluate(() => __draws);
  await p.evaluate(() => scrollTo({ top: 1e8, behavior: "instant" }));
  await p.waitForTimeout(200);
  const stopped = await p.evaluate(() => __draws);
  await p.waitForTimeout(300);
  const stoppedLater = await p.evaluate(() => __draws);
  await p.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await p.waitForTimeout(300);
  const resumed = await p.evaluate(() => __draws);
  await p.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      value: true,
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const hidden = await p.evaluate(() => __draws);
  await p.waitForTimeout(300);
  const hiddenLater = await p.evaluate(() => __draws);
  await p.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      value: false,
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await p.waitForTimeout(300);
  const restored = await p.evaluate(() => __draws);
  const pass =
    started > 0 &&
    stopped === stoppedLater &&
    resumed > stoppedLater &&
    hidden === hiddenLater &&
    restored > hiddenLater &&
    !errors.length;
  const result = {
    started,
    stopped,
    stoppedLater,
    resumed,
    hidden,
    hiddenLater,
    restored,
    errors,
    pass,
  };
  console.log(result);
  const out = process.env.QA_OUTPUT_DIR || path.join(__dirname, "results");
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(
    path.join(out, "canvas-lifecycle.json"),
    JSON.stringify(result, null, 2),
  );
  await b.close();
  if (!pass) process.exitCode = 1;
})();
