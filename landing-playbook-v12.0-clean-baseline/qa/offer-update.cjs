const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
const url = process.env.APP_URL || "http://127.0.0.1:8765/";
const output = process.env.QA_OUTPUT_DIR || path.join(__dirname, "results");
(async () => {
  const browser = await chromium.launch({
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
    const page = await browser.newPage({
      viewport: { width, height },
      reducedMotion: "no-preference",
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto(url);
    await page.waitForTimeout(1200);
    const before = await page.evaluate(() => ({
      digits: [...document.querySelectorAll(".ofr-strip")]
        .map((e) => e.lastElementChild.dataset.d)
        .join(""),
      running: document
        .querySelector(".ofr-num")
        .getAnimations({ subtree: true }).length,
      pulses: [
        "[data-offer-countdown-seconds]",
        "[data-mobile-offer-seconds]",
      ].every(
        (s) =>
          getComputedStyle(document.querySelector(s)).animationName ===
          "countdownTickV45",
      ),
      deadline:
        Number(localStorage.getItem("ltf_offer_expires_at_v5")) - Date.now(),
      old: document.querySelector(".regular-price__amount").textContent,
      schema: JSON.parse(
        document.querySelector('script[type="application/ld+json"]')
          .textContent,
      ),
    }));
    await page.locator("[data-ofr-price]").scrollIntoViewIfNeeded();
    await page.waitForTimeout(450);
    const during = await page
      .locator(".ofr-num")
      .evaluate((e) => ({
        running: e
          .getAnimations({ subtree: true })
          .some((a) => a.playState === "running"),
        descending: [...e.querySelectorAll(".ofr-strip")].every((strip) =>
          [...strip.children]
            .reverse()
            .every(
              (c, i, a) =>
                !i ||
                Number(c.dataset.d) === (Number(a[i - 1].dataset.d) + 9) % 10,
            ),
        ),
      }));
    await page.waitForTimeout(3500);
    const after = await page.evaluate(() => ({
      digits: [...document.querySelectorAll(".ofr-cell")]
        .map((e) => e.dataset.d)
        .join(""),
      height: document.documentElement.scrollHeight,
      overflow: document.documentElement.scrollWidth > innerWidth,
    }));
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(150);
    await page.locator("[data-ofr-price]").scrollIntoViewIfNeeded();
    const noReplay = await page
      .locator(".ofr-num")
      .evaluate(
        (e) =>
          !e
            .getAnimations({ subtree: true })
            .some((a) => a.playState === "running"),
      );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForTimeout(1100);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.waitForTimeout(1100);
    const pulsesResume = await page
      .locator("[data-offer-countdown-seconds]")
      .evaluate(
        (e) => getComputedStyle(e).animationName === "countdownTickV45",
      );
    const stableHeight =
      after.height ===
      (await page.evaluate(() => document.documentElement.scrollHeight));
    const pass =
      before.digits === "999" &&
      before.running === 0 &&
      before.pulses &&
      before.deadline > 297000 &&
      before.deadline <= 300000 &&
      before.old === "$999" &&
      during.running &&
      during.descending &&
      after.digits === "349" &&
      !after.overflow &&
      noReplay &&
      pulsesResume &&
      stableHeight &&
      !errors.length;
    results.push({
      width,
      height,
      before,
      during,
      after,
      noReplay,
      pulsesResume,
      stableHeight,
      errors,
      pass,
    });
    console.log(pass ? "PASS" : "FAIL", width, height);
    await page.close();
  }
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(
    path.join(output, "offer-update.json"),
    JSON.stringify(results, null, 2),
  );
  await browser.close();
  if (results.some((r) => !r.pass)) process.exitCode = 1;
})();
