const { chromium } = require("playwright"),
  fs = require("node:fs"),
  path = require("node:path");
const out = process.env.QA_OUTPUT_DIR || path.join(__dirname, "results");
const sizes = [
  [360, 800],
  [390, 844],
  [430, 932],
  [768, 1024],
  [1024, 768],
  [1366, 768],
  [1440, 900],
  [1920, 1080],
  [320, 568],
  [844, 390],
  [390, 280],
];
function scan() {
  const hidden = [...document.querySelectorAll("[data-reveal]")]
    .filter(
      (e) =>
        e.getBoundingClientRect().height > 0 &&
        Number(getComputedStyle(e).opacity) < 0.01,
    )
    .map((e) => e.className);
  const clipped = [];
  for (const e of document.querySelectorAll(
    "main p,main h1,main h2,main h3,main summary",
  )) {
    if (
      !e.getBoundingClientRect().height ||
      e.closest("[hidden]") ||
      (e.closest("details:not([open])") && !e.matches("summary"))
    )
      continue;
    const range = document.createRange();
    range.selectNodeContents(e);
    for (const rect of range.getClientRects()) {
      if (rect.left < -2 || rect.right > innerWidth + 2) {
        clipped.push({ text: e.textContent.slice(0, 90), cause: "viewport" });
        break;
      }
      let parent = e;
      while (parent && parent !== document.body) {
        const s = getComputedStyle(parent),
          b = parent.getBoundingClientRect();
        if (
          (["hidden", "clip"].includes(s.overflowX) &&
            (rect.left < b.left - 2 || rect.right > b.right + 2)) ||
          (["hidden", "clip"].includes(s.overflowY) &&
            (rect.top < b.top - 2 || rect.bottom > b.bottom + 2))
        ) {
          clipped.push({
            text: e.textContent.slice(0, 90),
            cause: parent.className,
          });
          break;
        }
        parent = parent.parentElement;
      }
    }
  }
  const row = document
    .querySelector(".payment-methods")
    .getBoundingClientRect();
  const paymentFit = [
    ...document.querySelectorAll(".payment-badge:not([hidden])"),
  ].every((e) => {
    const r = e.getBoundingClientRect();
    return r.left >= row.left - 1 && r.right <= row.right + 1;
  });
  return {
    hidden,
    clipped,
    paymentFit,
    height: document.documentElement.scrollHeight,
    overflow: document.documentElement.scrollWidth > innerWidth,
    brokenImages: [...document.images]
      .filter((e) => !e.complete || !e.naturalWidth)
      .map((e) => e.src),
  };
}
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const results = [];
  for (const [width, height] of sizes) {
    const page = await b.newPage({
      viewport: { width, height },
      isMobile: width <= 640,
      hasTouch: width <= 640,
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (e) => {
      if (e.type() === "error") errors.push(e.text());
    });
    await page.goto(process.env.APP_URL || "http://127.0.0.1:8765/");
    await page.waitForTimeout(1700);
    const initialHeight = await page.evaluate(
      () => document.documentElement.scrollHeight,
    );
    let hiddenDuring = [];
    for (let y = 0; y < initialHeight; y += height * 0.6) {
      await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), y);
      await page.waitForTimeout(35);
      hiddenDuring.push(
        ...(await page.evaluate(() =>
          [...document.querySelectorAll("[data-reveal]")]
            .filter((e) => {
              const r = e.getBoundingClientRect();
              return (
                r.height &&
                r.top < innerHeight &&
                r.bottom > 0 &&
                Number(getComputedStyle(e).opacity) < 0.01
              );
            })
            .map((e) => e.className),
        )),
      );
    }
    await page.locator("#ancla-precio").scrollIntoViewIfNeeded();
    await page.waitForTimeout(3100);
    await page.locator("[data-ofr-price]").scrollIntoViewIfNeeded();
    await page.waitForTimeout(3800);
    for (const summary of await page.locator(".purchase-faq summary").all()) {
      await summary.click();
      await page.waitForTimeout(250);
    }
    await page.waitForFunction(() =>
      [...document.querySelectorAll(".faq-answer")].every(
        (e) =>
          !e.getAnimations().some((a) => a.playState === "running") &&
          e.style.height === "",
      ),
    );
    const normal = await page.evaluate(scan);
    await page.evaluate(() =>
      document
        .querySelectorAll("[data-reveal]")
        .forEach((e) => e.getAnimations().forEach((a) => a.cancel())),
    );
    const cancelled = await page.evaluate(scan);
    let stable = [];
    for (let i = 0; i < 15; i++) {
      await page.evaluate(() => scrollTo({ top: 1e8, behavior: "instant" }));
      await page.waitForTimeout(30);
      stable.push(
        await page.evaluate(() => document.documentElement.scrollHeight),
      );
    }
    let resized = null;
    if (width <= 640) {
      await page.setViewportSize({ width: 844, height: 390 });
      await page.waitForTimeout(450);
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(450);
      resized = await page.evaluate(scan);
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForTimeout(50);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.waitForTimeout(450);
    const motion = await page.evaluate(scan);
    const pass =
      !errors.length &&
      !hiddenDuring.length &&
      [normal, cancelled, motion, ...(resized ? [resized] : [])].every(
        (r) =>
          !r.hidden.length &&
          !r.clipped.length &&
          r.paymentFit &&
          !r.overflow &&
          !r.brokenImages.length,
      ) &&
      new Set(stable).size === 1;
    results.push({
      width,
      height,
      errors,
      hiddenDuring,
      normal,
      cancelled,
      resized,
      motion,
      stable,
      pass,
    });
    console.log(pass ? "PASS" : "FAIL", width, height);
    if (!pass) console.log(JSON.stringify(results.at(-1)));
    await page.close();
  }
  const page = await b.newPage({ viewport: { width: 390, height: 280 } });
  await page.addInitScript(() =>
    document.addEventListener(
      "DOMContentLoaded",
      () => (document.documentElement.style.fontSize = "48px"),
    ),
  );
  await page.goto(process.env.APP_URL || "http://127.0.0.1:8765/");
  await page.locator(".purchase-card").scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  const tall = await page.locator(".purchase-card").evaluate((e) => ({
    height: e.getBoundingClientRect().height,
    opacity: Number(getComputedStyle(e).opacity),
    revealed: e.classList.contains("is-visible"),
  }));
  results.push({
    scenario: "tall-card-300-percent-text",
    ...tall,
    pass: tall.height > 2000 && tall.opacity === 1 && tall.revealed,
  });
  console.log(
    tall.opacity === 1 && tall.revealed ? "PASS tall card" : "FAIL tall card",
  );
  await page.close();
  await b.close();
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(
    path.join(out, "scroll-audit.json"),
    JSON.stringify(results, null, 2),
  );
  if (results.some((r) => !r.pass)) process.exitCode = 1;
})();
