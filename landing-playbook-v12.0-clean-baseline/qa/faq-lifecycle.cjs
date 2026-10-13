const { chromium } = require("playwright"),
  fs = require("node:fs"),
  path = require("node:path");
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
    const p = await b.newPage({ viewport: { width, height } });
    await p.goto(process.env.APP_URL || "http://127.0.0.1:8765/");
    const summary = p.locator(".purchase-faq summary").nth(1);
    for (let i = 0; i < 5; i++) {
      await summary.click();
      await p.waitForTimeout(35);
    }
    await p.waitForFunction(() => {
      const e = document.querySelectorAll(".purchase-faq details")[1];
      return (
        e.open &&
        e.querySelector(".faq-answer").style.height === "" &&
        !e
          .querySelector(".faq-answer")
          .getAnimations()
          .some((a) => a.playState === "running")
      );
    });
    const opened = await p
      .locator(".purchase-faq details")
      .nth(1)
      .evaluate(
        (e) =>
          e.open &&
          e.querySelector(".faq-answer").clientHeight >=
            e.querySelector("p").getBoundingClientRect().height,
      );
    await summary.click();
    await p.waitForTimeout(20);
    await p.setViewportSize({ width: width + 1, height });
    await p.waitForFunction(
      () => !document.querySelectorAll(".purchase-faq details")[1].open,
    );
    await summary.click();
    await p.waitForTimeout(20);
    await p.evaluate(() => window.dispatchEvent(new Event("pagehide")));
    const recovered = await p
      .locator(".purchase-faq details")
      .nth(1)
      .evaluate(
        (e) =>
          e.open &&
          e.querySelector(".faq-answer").style.height === "" &&
          e.querySelector(".faq-answer").clientHeight > 0,
      );
    results.push({
      width,
      height,
      opened,
      recovered,
      pass: opened && recovered,
    });
    console.log(opened && recovered ? "PASS" : "FAIL", width);
    await p.close();
  }
  await b.close();
  const out = process.env.QA_OUTPUT_DIR || path.join(__dirname, "results");
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(
    path.join(out, "faq-lifecycle.json"),
    JSON.stringify(results, null, 2),
  );
  if (results.some((r) => !r.pass)) process.exitCode = 1;
})();
