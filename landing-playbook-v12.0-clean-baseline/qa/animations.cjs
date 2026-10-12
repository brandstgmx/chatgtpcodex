const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
const URL = process.env.APP_URL || "http://127.0.0.1:8765/";
const OUT = process.env.QA_OUTPUT_DIR || path.join(__dirname, "results");
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const results = [];
  for (const [width, height] of [
    [360, 800],
    [390, 844],
    [430, 932],
    [768, 1024],
    [1024, 768],
    [1366, 768],
    [1440, 900],
    [1920, 1080],
  ]) {
    const p = await b.newPage({
      viewport: { width, height },
      reducedMotion: "no-preference",
    });
    const errors = [],
      scripts = [];
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("request", (r) => {
      if (r.resourceType() === "script") scripts.push(r.url());
    });
    await p.goto(URL);
    await p.waitForTimeout(500);
    await p.evaluate(() => scrollTo({ top: 200, behavior: "instant" }));
    await p.waitForTimeout(350);
    const sticky = await p
      .locator("[data-mobile-offer-bar]")
      .evaluate((e) => e.classList.contains("is-visible"));
    await p
      .locator("#ancla-precio")
      .evaluate((e) =>
        scrollTo({
          top: e.getBoundingClientRect().top + scrollY - innerHeight * 0.35,
          behavior: "instant",
        }),
      );
    const samples = [];
    for (let i = 0; i < 32; i++) {
      await p.waitForTimeout(100);
      samples.push(
        await p
          .locator("[data-money-counter]")
          .evaluateAll((es) =>
            es.map((e) => Number(e.textContent.replace(/,/g, ""))),
          ),
      );
    }
    const priceCountersMove =
      samples.some((s) => s[0] > 0 && s[0] < 150000) &&
      samples.some((s) => s[1] > 0 && s[1] < 1000000);
    const countersEnd =
      samples.at(-1)[0] === 150000 && samples.at(-1)[1] === 1000000;
    await p.locator("[data-ofr-price]").scrollIntoViewIfNeeded();
    await p.waitForTimeout(380);
    const reel = await p.locator(".ofr-num").evaluate((e) => ({
      cells: e.querySelectorAll(".ofr-cell").length,
      animations: e
        .getAnimations({ subtree: true })
        .filter((a) => a.effect.getTiming().iterations === 1)
        .map((a) => ({
          duration: a.effect.getTiming().duration,
          delay: a.effect.getTiming().delay,
          state: a.playState,
        })),
    }));
    if (width === 390)
      await p.screenshot({ path: path.join(OUT, "restored-390-reel.png") });
    await p.waitForTimeout(3700);
    const digits = await p
      .locator(".ofr-cell")
      .evaluateAll((es) => es.map((e) => e.dataset.d).join(""));
    const firstTime = await p.locator("[data-offer-countdown]").textContent();
    await p.waitForTimeout(1100);
    const timerMoves =
      firstTime.trim() !==
      (await p.locator("[data-offer-countdown]").textContent()).trim();
    const sharedTimer = await p.evaluate(
      () =>
        document.querySelector("[data-offer-countdown]").textContent.trim() ===
        document
          .querySelector("[data-mobile-offer-countdown]")
          .textContent.trim(),
    );
    const pulse = await p
      .locator("[data-offer-countdown-seconds]")
      .evaluate(
        (e) =>
          e.classList.contains("is-pulsing") &&
          getComputedStyle(e).animationName === "countdownTickV45",
      );
    const singleScript =
      scripts.length === 1 && scripts[0].endsWith("/js/app.js");
    const pass =
      priceCountersMove &&
      countersEnd &&
      reel.cells > 3 &&
      [1000, 1450, 1950].every((ms) =>
        reel.animations.some(
          (a) => a.duration === ms && a.delay === 260 && a.state === "running",
        ),
      ) &&
      digits === "179" &&
      timerMoves &&
      sharedTimer &&
      pulse &&
      sticky === width <= 640 &&
      singleScript &&
      errors.length === 0;
    results.push({
      width,
      height,
      pass,
      priceCountersMove,
      countersEnd,
      reel,
      digits,
      timerMoves,
      sharedTimer,
      pulse,
      sticky,
      singleScript,
      errors,
      samples,
    });
    console.log("animations", width, pass);
    await p.close();
  }
  await b.close();
  fs.writeFileSync(
    path.join(OUT, "animations.json"),
    JSON.stringify(results, null, 2),
  );
  if (results.some((r) => !r.pass)) process.exitCode = 1;
})();
