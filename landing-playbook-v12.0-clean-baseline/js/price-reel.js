let initialized = false;

export function initPriceReel() {
  if (initialized) return;
  initialized = true;
  const price = document.querySelector("[data-ofr-price]");
  const amount = document.querySelector("[data-ofr-amount]");
  const fig = amount && amount.querySelector(".ofr-fig");
  const num = fig && fig.querySelector(".ofr-num");
  if (!price || !amount || !fig || !num) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const canAnimate =
    typeof Element.prototype.animate === "function" &&
    "IntersectionObserver" in window;

  const value = 349;
  const anchorValue = 999;
  const currency = "$";

  const intPart = (n) => String(Math.floor(n));
  const finalDigits = intPart(value).split("");
  const startDigits = intPart(anchorValue).split("");
  const curEl = fig.querySelector(".ofr-cur");
  const centsEl = fig.querySelector(".ofr-cents");
  const sr = amount.querySelector(".ofr-sr");

  if (curEl) curEl.setAttribute("data-t", currency);
  if (centsEl) {
    centsEl.setAttribute("data-t", "");
    centsEl.hidden = true;
  }
  if (sr) sr.textContent = "$349 MXN";

  const reelHTML = (d) =>
    `<span class="ofr-reel" data-d="${d}"><span class="ofr-strip"><span class="ofr-cell" data-d="${d}"></span></span></span>`;

  num.innerHTML = finalDigits.map(reelHTML).join("");
  const reels = num.querySelectorAll(":scope > .ofr-reel");

  if (!canAnimate) return;

  const run = (from, count) =>
    Array.from({ length: count }, (_, i) =>
      String((((from - i) % 10) + 10) % 10),
    );

  const cell = (d) => {
    const c = document.createElement("span");
    c.className = "ofr-cell";
    c.setAttribute("data-d", d || " ");
    return c;
  };

  const turnsAt = (p) => (p === 0 ? 3 : p === 1 ? 2 : 1);
  const durAt = (p) => (p === 0 ? 1950 : p === 1 ? 1450 : 1000);

  const mk = (reel, seq, fin, p) => ({
    reel,
    strip: reel.querySelector(".ofr-strip"),
    seq,
    fin,
    k: seq.length - 1,
    dur: durAt(p),
  });

  const all = [];
  const total = startDigits.length;

  for (let i = 0; i < total; i++) {
    const p = total - 1 - i;
    const s = Number(startDigits[i]);

    const fd = finalDigits[i];
    const steps = ((s - Number(fd) + 10) % 10) + 10 * turnsAt(p);
    all.push(mk(reels[i], [String(s), ...run(s - 1, steps)], fd, p));
  }

  const longest = Math.max(...all.map((r) => r.dur));

  function fill(r) {
    r.strip.textContent = "";
    for (let i = r.seq.length - 1; i >= 0; i--) {
      r.strip.appendChild(cell(r.seq[i]));
    }
  }

  function collapse(r) {
    r.strip.textContent = "";
    if (r.fin) r.strip.appendChild(cell(r.fin));
    r.strip.style.transform = "";
  }

  let state = "idle";
  let inView = false;
  let timers = [];
  let anims = [];

  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const pos = (r, p) => `translateY(${(p - r.k).toFixed(3)}em)`;

  function clearAll() {
    timers.forEach(clearTimeout);
    timers = [];
    anims.forEach((a) => a.cancel());
    anims = [];
  }

  function spin(r, dur, delay, blurPx) {
    const wind = 0.16;
    const tail = 3;
    const slope = 1.45 / 0.2;
    const tw = 150;
    const lead = r.k - tail + wind;
    const rest = dur - tw;
    const ta = rest / (1 + (slope * tail) / (2 * lead));
    const tb = rest - ta;

    anims.push(
      r.strip.animate(
        [
          { transform: pos(r, 0), easing: "cubic-bezier(.3,0,.5,1)" },
          {
            transform: pos(r, -wind),
            offset: tw / dur,
            easing: "cubic-bezier(.5,0,1,1)",
          },
          {
            transform: pos(r, r.k - tail),
            offset: (tw + ta) / dur,
            easing: "cubic-bezier(.2,1.45,.5,1)",
          },
          { transform: pos(r, r.k) },
        ],
        {
          duration: dur,
          delay,
          fill: "both",
        },
      ),
    );

    anims.push(
      r.reel.animate(
        [
          { filter: "blur(0px)" },
          { filter: `blur(${blurPx}px)`, offset: (tw + ta * 0.3) / dur },
          { filter: `blur(${blurPx}px)`, offset: (tw + ta) / dur },
          {
            filter: "blur(0px)",
            offset: Math.min(1, (tw + ta + tb * 0.45) / dur),
          },
          { filter: "blur(0px)" },
        ],
        {
          duration: dur,
          delay,
        },
      ),
    );
  }

  function arm() {
    clearAll();

    amount.classList.remove("is-hit");

    all.forEach((r) => {
      fill(r);
      r.strip.style.transform = pos(r, 0);
    });

    void fig.offsetWidth;
    state = "armed";
  }

  function finish() {
    clearAll();
    all.forEach(collapse);
  }

  function play() {
    if (state !== "armed") return;

    state = "running";
    io.disconnect();

    const blur = Math.max(
      2,
      parseFloat(getComputedStyle(amount).fontSize) * 0.028,
    );
    const delay = 260;

    all.forEach((r) => spin(r, r.dur, delay, blur));

    later(
      () => {
        amount.classList.remove("is-hit");
        void amount.offsetWidth;
        amount.classList.add("is-hit");
      },
      delay + longest - 60,
    );

    later(
      () => {
        finish();
        state = "done";
      },
      delay + longest + 1350,
    );
  }

  const io = new IntersectionObserver(
    (entries) => {
      const e = entries[entries.length - 1];
      inView = e.isIntersecting;

      if (reduce.matches) return;

      if (
        e.isIntersecting &&
        e.intersectionRatio >= 0.55 &&
        state === "armed"
      ) {
        play();
      }
    },
    {
      threshold: [0, 0.55, 1],
    },
  );

  function setMode() {
    if (reduce.matches) {
      finish();
      amount.classList.remove("is-hit");
      state = "static";
    } else if (state === "static" || state === "idle") {
      if (inView && state === "static") {
        state = "done";
      } else {
        arm();
      }
    }
  }

  setMode();
  io.observe(price);

  if (reduce.addEventListener) {
    reduce.addEventListener("change", setMode);
  } else if (reduce.addListener) {
    reduce.addListener(setMode);
  }
}
