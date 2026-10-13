let initialized = false;

export function initPriceAnchor() {
  if (initialized) return;
  initialized = true;
  /* ---------------- Money counters for price anchor ----------------
     La animación NO inicia al cargar la página.
     Sólo se dispara una vez cuando el usuario llega a esta sección.
     Secuencia:
     1) aparece y cuenta $150,000
     2) aparece "a"
     3) aparece y cuenta $1,000,000
  */
  const moneyCounterElements = [
    ...document.querySelectorAll("[data-money-counter]"),
  ];
  const moneySeparator = document.querySelector("[data-money-separator]");
  const moneyFigures = [...document.querySelectorAll(".money-figure")];
  const prefersReducedMotionForCounters = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  function formatMoneyCounter(value) {
    return Number(value).toLocaleString("es-MX");
  }

  function animateMoneyCounter(element, duration = 1050) {
    return new Promise((resolve) => {
      if (!element || element.dataset.counterDone === "true") {
        resolve();
        return;
      }

      const target = Number(element.dataset.moneyCounter || "0");

      if (
        !Number.isFinite(target) ||
        target <= 0 ||
        prefersReducedMotionForCounters
      ) {
        element.textContent = formatMoneyCounter(target || 0);
        element.dataset.counterDone = "true";
        resolve();
        return;
      }

      const startedAt = performance.now();

      const frame = (now) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = formatMoneyCounter(Math.round(target * eased));

        if (progress < 1) {
          requestAnimationFrame(frame);
        } else {
          element.textContent = formatMoneyCounter(target);
          element.dataset.counterDone = "true";
          resolve();
        }
      };

      requestAnimationFrame(frame);
    });
  }

  function revealMoneyNode(node) {
    if (!node) return;
    node.classList.add("is-money-visible");
  }

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  async function runMoneySequence() {
    const [firstCounter, secondCounter] = moneyCounterElements;
    const [firstFigure, secondFigure] = moneyFigures;

    if (!firstCounter || !secondCounter || !firstFigure || !secondFigure)
      return;
    if (firstCounter.dataset.sequencePlayed === "true") return;

    firstCounter.dataset.sequencePlayed = "true";

    if (prefersReducedMotionForCounters) {
      moneyFigures.forEach(revealMoneyNode);
      revealMoneyNode(moneySeparator);
      moneyCounterElements.forEach((element) => {
        element.textContent = formatMoneyCounter(
          Number(element.dataset.moneyCounter || "0"),
        );
        element.dataset.counterDone = "true";
      });
      return;
    }

    /* 1. Primer monto */
    firstCounter.textContent = "0";
    revealMoneyNode(firstFigure);
    await animateMoneyCounter(firstCounter, 1100);

    /* Pequeña pausa para que el ojo lea el primer rango */
    await wait(180);

    /* 2. Separador */
    revealMoneyNode(moneySeparator);
    await wait(260);

    /* 3. Segundo monto */
    secondCounter.textContent = "0";
    revealMoneyNode(secondFigure);
    await animateMoneyCounter(secondCounter, 1250);
  }

  function initMoneyCounters() {
    if (moneyCounterElements.length < 2) return;

    /* Keep the final HTML values readable until the animation actually starts. */
    if (prefersReducedMotionForCounters) {
      runMoneySequence();
      return;
    }

    const anchorSection = document.getElementById("ancla-precio");
    if (!anchorSection) return;

    if (!("IntersectionObserver" in window)) {
      runMoneySequence();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;

        /* Observe the figures, not the potentially tall text section. */
        runMoneySequence();
        observer.disconnect();
      },
      {
        threshold: 0,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    observer.observe(moneyFigures[0] || anchorSection);
  }

  initMoneyCounters();
}
