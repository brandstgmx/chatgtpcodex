const fs = require("node:fs"),
  path = require("node:path"),
  { chromium } = require("playwright");
const root = path.resolve(__dirname, ".."),
  OUT = process.env.QA_OUTPUT_DIR || path.join(__dirname, "results");
fs.mkdirSync(OUT, { recursive: true });
let html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const bundle = fs.readFileSync(path.join(root, "js/app.js"), "utf8");
if (/<script[^>]+type=["']module["']/.test(html))
  throw new Error("Runtime still requires a module script");
if (/^\s*(?:import|export)\s/m.test(bundle))
  throw new Error("Runtime still contains ES module declarations");
let css = fs
  .readFileSync(path.join(root, "css/styles.css"), "utf8")
  .replace(/@import url\("([^"]+)"\);/g, (_, name) =>
    fs.readFileSync(path.join(root, "css", name), "utf8"),
  );
html = html.replace(
  '<link rel="stylesheet" href="css/styles.css"/>',
  "<style>" + css + "</style>",
);
html = html.replace(
  /(src|href|xlink:href)="(img\/[^" ]+)"/g,
  (_, attr, name) =>
    attr +
    '="data:image/png;base64,' +
    fs.readFileSync(path.join(root, name)).toString("base64") +
    '"',
);
html = html.replace(
  '<script src="js/app.js" defer></script>',
  "<script>" + bundle + "</script>",
);
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
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.setContent(
      '<style>html,body{margin:0;width:100%;height:100%}iframe{width:100%;height:100%;border:0;display:block}</style><iframe sandbox="allow-scripts"></iframe>',
    );
    await p
      .locator("iframe")
      .evaluate((frame, html) => (frame.srcdoc = html), html);
    const f = p.frames().find((f) => f.parentFrame());
    await f.waitForFunction(() =>
      document.documentElement.classList.contains("js"),
    );
    const origin = await f.evaluate(() => location.origin);
    const storageBlocked = await f.evaluate(() => {
      try {
        localStorage.setItem("probe", "1");
        return false;
      } catch {
        return true;
      }
    });
    await f.evaluate(() => scrollTo({ top: 200, behavior: "instant" }));
    await p.waitForTimeout(350);
    const sticky = await f
      .locator("[data-mobile-offer-bar]")
      .evaluate((e) => e.classList.contains("is-visible"));
    const first = (
      await f.locator("[data-offer-countdown]").textContent()
    ).trim();
    await p.waitForTimeout(1100);
    const ticks =
      first !==
      (await f.locator("[data-offer-countdown]").textContent()).trim();
    await f.locator("[data-ofr-price]").scrollIntoViewIfNeeded();
    await p.waitForTimeout(400);
    const spinning = await f
      .locator(".ofr-num")
      .evaluate(
        (e) =>
          e.querySelectorAll(".ofr-cell").length > 3 &&
          e
            .getAnimations({ subtree: true })
            .some((a) => a.playState === "running"),
      );
    await p.waitForTimeout(3600);
    const final = await f
      .locator(".ofr-cell")
      .evaluateAll((es) => es.map((e) => e.dataset.d).join(""));
    const pass =
      origin === "null" &&
      storageBlocked &&
      ticks &&
      spinning &&
      final === "179" &&
      sticky === width <= 640 &&
      errors.length === 0;
    results.push({
      width,
      height,
      pass,
      origin,
      storageBlocked,
      ticks,
      spinning,
      final,
      sticky,
      errors,
    });
    console.log("opaque-origin classic runtime", width, pass);
    await p.close();
  }
  await b.close();
  fs.writeFileSync(
    path.join(OUT, "local-compatible.json"),
    JSON.stringify(results, null, 2),
  );
  if (results.some((r) => !r.pass)) process.exitCode = 1;
})();
