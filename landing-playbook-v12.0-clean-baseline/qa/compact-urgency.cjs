const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
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
    const page = await browser.newPage({ viewport: { width, height } });
    await page.goto(process.env.APP_URL || "http://127.0.0.1:8765/");
    await page.evaluate(() => scrollTo({ top: 200, behavior: "instant" }));
    await page.waitForTimeout(400);
    const sticky = await page.locator(".mobile-offer-bar").evaluate((e) => {
      const r = e.getBoundingClientRect(),
        strip = e.querySelector(".mobile-offer-bar__capsule"),
        s = strip.getBoundingClientRect();
      return {
        mobile: getComputedStyle(e).display !== "none",
        nested: strip.parentElement.classList.contains(
          "mobile-offer-bar__inner",
        ),
        inside: s.top >= r.top && s.bottom <= r.bottom,
        compact: r.height < 140,
        position: getComputedStyle(strip).position,
        price: e.querySelector(".mobile-offer-bar__price-current").textContent,
      };
    });
    await page.locator("[data-ofr-price]").scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const active = await page.locator("[data-offer-active]").evaluate((e) => {
      const r = e.getBoundingClientRect();
      return {
        background: getComputedStyle(e).backgroundColor,
        image: getComputedStyle(e).backgroundImage,
        radius: getComputedStyle(e).borderRadius,
        shadow: getComputedStyle(e).boxShadow,
        fit: [...e.children].every((c) => {
          const b = c.getBoundingClientRect();
          return b.left >= r.left && b.right <= r.right;
        }),
        height: r.height,
      };
    });
    await page.evaluate(() =>
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "ltf_offer_expires_at_v5",
          newValue: String(Date.now() - 1000),
        }),
      ),
    );
    const expired = await page
      .locator("[data-offer-expired]")
      .evaluate((e) => ({
        visible: !e.hidden,
        text: e.textContent.replace(/\s+/g, " ").trim(),
        height: e.getBoundingClientRect().height,
      }));
    const mobileExpired = await page
      .locator("[data-mobile-offer-expired]")
      .evaluate((e) => ({ visible: !e.hidden, text: e.textContent.trim() }));
    const pass =
      sticky.mobile === width <= 640 &&
      sticky.nested &&
      sticky.price === "$349" &&
      (width > 640 ||
        (sticky.inside && sticky.compact && sticky.position === "static")) &&
      active.background === "rgb(255, 245, 233)" &&
      active.image === "none" &&
      active.radius === "10px" &&
      active.shadow === "none" &&
      active.fit &&
      expired.visible &&
      expired.text === "✨ Precio de lanzamiento" &&
      Math.abs(expired.height - active.height) < 1 &&
      mobileExpired.visible &&
      mobileExpired.text === "✨ Precio de lanzamiento";
    results.push({
      width,
      height,
      sticky,
      active,
      expired,
      mobileExpired,
      pass,
    });
    console.log(pass ? "PASS" : "FAIL", width, height);
    await page.close();
  }
  await browser.close();
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(
    path.join(output, "compact-urgency.json"),
    JSON.stringify(results, null, 2),
  );
  if (results.some((r) => !r.pass)) process.exitCode = 1;
})();
