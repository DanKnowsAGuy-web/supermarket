/* Energy Plus · choreography layer (GSAP + ScrollTrigger)
   Progressive enhancement on top of main.js. If GSAP is absent or the user
   prefers reduced motion, this file no-ops and the page keeps its clean
   static/reveal fallback. Nothing here is required for the page to read. */
(() => {
  "use strict";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const gsap = window.gsap;
  if (reduced || !gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(window.ScrollTrigger);
  const ease = "power3.out";

  document.documentElement.classList.add("choreo-ready");

  /* ---------- page-load overture ----------
     The inline head script added .overture-on before paint (first visit only,
     never with reduced motion). Animate the mark in, hold, lift the curtain,
     then remove it. A failsafe clears it no matter what, so it can never
     trap the page behind a covered screen. */
  const overture = document.querySelector(".overture");
  if (document.documentElement.classList.contains("overture-on") && overture) {
    const mark = overture.querySelector(".overture__mark");
    const clear = () => {
      overture.style.display = "none";
      document.documentElement.classList.remove("overture-on");
    };
    const tl = gsap.timeline({ onComplete: clear });
    tl.fromTo(mark, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.75, ease })
      .to(overture, { yPercent: -100, duration: 0.9, ease: "power4.inOut" }, "+=0.55");
    setTimeout(clear, 3200);
  } else if (overture) {
    overture.style.display = "none";
  }

  /* ---------- hero: split the H1 into clip-masked rising words ---------- */
  const h1 = document.querySelector(".hero h1[data-split]");
  if (h1) {
    const words = h1.textContent.trim().split(/\s+/);
    h1.textContent = "";
    words.forEach((word, i) => {
      const w = document.createElement("span");
      w.className = "w";
      const wi = document.createElement("span");
      wi.className = "wi";
      wi.textContent = word;
      w.appendChild(wi);
      h1.appendChild(w);
      if (i < words.length - 1) h1.appendChild(document.createTextNode(" "));
    });
  }

  // Hidden initial states, set through GSAP so the same transform channel that
  // hides them reveals them (a CSS `transform` initial does NOT get overridden
  // by GSAP's yPercent tweens). Runs synchronously before first paint.
  gsap.set(".hero h1 .wi", { yPercent: 112 });
  gsap.set(".hero [data-rise]", { opacity: 0, y: 22 });
  gsap.set(".hero__cue", { opacity: 0 });
  gsap.set("#hero-plate", { scale: 1.08 });

  let heroTl = null;
  let heroForced = false;
  // Hero signal: a spiky demand trace (the building working too hard) that
  // settles into a calm, flattened load line as it resolves, its stroke
  // shifting heat -> verdigris. Deliberately a bill-legible metaphor (usage
  // and demand), not a power-quality waveform. Built from two point arrays
  // sampled across the viewBox, so we can interpolate a true morph without
  // the paid MorphSVG plugin.
  const dirtyLine = document.querySelector(".hero .sig-dirty");
  const cleanLine = document.querySelector(".hero .sig-clean");
  let setSignal = null;
  if (dirtyLine) {
    if (cleanLine) gsap.set(cleanLine, { opacity: 0 }); // choreo drives the one path
    const N = 96, W = 1200, MID = 23, AMP = 15;
    const hash = (i) => { const s = Math.sin(i * 12.9898) * 43758.5453; return (s - Math.floor(s)) * 2 - 1; };
    const xs = [], dirty = [], clean = [];
    for (let i = 0; i <= N; i++) {
      xs.push((i / N) * W);
      dirty.push(Math.max(6, Math.min(40, MID + AMP * hash(i))));
      // settled state: a low, gently breathing load line — daily rhythm, no spikes
      clean.push(MID + 5 + 3.5 * Math.sin((i / N) * Math.PI * 2 * 2.5));
    }
    const buildD = (t) => {
      let d = "";
      for (let i = 0; i <= N; i++) {
        const y = dirty[i] + (clean[i] - dirty[i]) * t;
        d += (i === 0 ? "M" : "L") + xs[i].toFixed(1) + " " + y.toFixed(2) + " ";
      }
      return d.trim();
    };
    setSignal = (t) => dirtyLine.setAttribute("d", buildD(t));
    setSignal(0); // hero opens distorted
  }

  const startHero = () => {
    if (heroTl || heroForced) return;
    heroTl = gsap.timeline({ defaults: { ease } });
    const p = document.getElementById("hero-plate");
    if (p) heroTl.to(p, { scale: 1, duration: 2.4, ease: "power2.out" }, 0);
    heroTl.to(".hero h1 .wi", { yPercent: 0, duration: 1.05, stagger: 0.07 }, 0.15);
    if (setSignal) {
      dirtyLine.classList.add("is-cleaning"); // CSS transitions the stroke heat -> verd
      heroTl.to({ t: 0 }, { t: 1, duration: 1.8, ease: "power2.inOut",
        onUpdate: function () { setSignal(this.targets()[0].t); } }, 0.5);
    }
    heroTl.to(".hero [data-rise]", { opacity: 1, y: 0, duration: 0.9, stagger: 0.12 }, 0.55)
      .to(".hero__cue", { opacity: 1, duration: 0.8 }, 1.6);
  };

  // Failsafe: GSAP's ticker pauses while the tab is hidden/occluded, so the
  // timeline can stall part-way (or never start). This fires regardless and
  // snaps the hero to its finished, fully-visible state. It always runs, even
  // if a stalled timeline already exists, so content is never gated on motion.
  const forceHero = () => {
    heroForced = true;
    if (heroTl) { heroTl.progress(1); return; }
    gsap.set(".hero h1 .wi", { yPercent: 0 });
    gsap.set(".hero [data-rise]", { opacity: 1, y: 0 });
    gsap.set(".hero__cue", { opacity: 1 });
    gsap.set("#hero-plate", { scale: 1 });
    if (setSignal) { setSignal(1); dirtyLine.classList.add("is-cleaning"); }
  };
  setTimeout(forceHero, 2600);
  if (document.visibilityState === "visible") {
    requestAnimationFrame(() => requestAnimationFrame(startHero));
  } else {
    document.addEventListener("visibilitychange", function once() {
      if (document.visibilityState === "visible" && !heroForced) {
        document.removeEventListener("visibilitychange", once);
        startHero();
      }
    });
  }

  /* ---------- hero plate parallax + header clear over the hero ---------- */
  const plate = document.getElementById("hero-plate");
  if (plate) {
    gsap.to(plate, {
      yPercent: 12, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
  }
  // Header sits clear over the dark hero, solid over the light page below.
  // Driven by a plain scroll listener (not ScrollTrigger) so it is always
  // correct the instant the user scrolls, even if the rAF ticker was paused.
  const head = document.querySelector(".site-head");
  const heroEl = document.querySelector(".hero");
  if (head && heroEl) {
    const syncHead = () => {
      const clear = window.scrollY < heroEl.offsetHeight - 72;
      head.classList.toggle("is-clear", clear);
    };
    syncHead();
    addEventListener("scroll", syncHead, { passive: true });
    addEventListener("resize", syncHead, { passive: true });
  }

  /* ---------- method: progress fill scrubbed across the seven layers ---------- */
  const fill = document.getElementById("method-progress");
  const list = document.querySelector(".method__list");
  if (fill && list) {
    gsap.to(fill, {
      scaleX: 1, ease: "none",
      scrollTrigger: { trigger: list, start: "top 65%", end: "bottom 55%", scrub: 0.4 },
    });
  }

  /* ---------- monuments: settle up with a touch of depth as they enter ---------- */
  gsap.utils.toArray(".monument").forEach((el) => {
    gsap.from(el, {
      yPercent: 8, opacity: 0.25, filter: "blur(6px)", duration: 1,
      ease, scrollTrigger: { trigger: el, start: "top 88%" },
    });
  });

  /* ---------- proof wall: columns drift with the visitor's own scroll ----------
     No idle animation: the wall moves only while the page moves (each column at
     its own rate), and rests as a designed still the moment scrolling stops. */
  gsap.utils.toArray(".proof-wall__col").forEach((col, i) => {
    const track = col.querySelector(".proof-wall__track");
    if (!track) return;
    gsap.fromTo(track,
      { yPercent: i === 1 ? -12 : 0 },
      {
        yPercent: [-30, -34, -36][i % 3], ease: "none",
        scrollTrigger: { trigger: ".proof-wall", start: "top bottom", end: "bottom top", scrub: 0.6 },
      });
  });

  /* ---------- stakes: heat underline draws under each replacement cost ---------- */
  gsap.utils.toArray(".ledger__row .cost").forEach((el) => {
    gsap.to(el, {
      backgroundSize: "100% 1px", duration: 0.9, ease,
      scrollTrigger: { trigger: el, start: "top 82%" },
    });
  });

  /* ---------- signature set piece: the animated bill ---------- */
  const bill = document.querySelector(".bill");
  if (bill) {
    const wasteLines = bill.querySelectorAll(".bill__line[data-waste]");
    const after = bill.querySelector(".bill__after");
    let played = false;
    const play = () => {
      if (played) return;
      played = true;
      // Each waste line flags in sequence and reveals its own dollar cut, so the
      // eye reads cause then effect at the line level. The after-total then
      // settles in at its final value. No count-up ticker: that is an
      // anti-reference (numbers arrive at a designed still, they do not spin).
      wasteLines.forEach((l, i) => setTimeout(() => l.classList.add("is-flagged"), 300 + i * 380));
      setTimeout(() => { if (after) after.classList.add("is-in"); }, 300 + wasteLines.length * 380 + 320);
    };
    // Plays when the bill scrolls into view (real user, ticker running). The bill's
    // line items and total are fully visible without this; the flagging and the
    // after-chip are enhancement, so no blind failsafe (which would fire off-screen).
    window.ScrollTrigger.create({ trigger: bill, start: "top 72%", once: true, onEnter: play });
  }

  /* ---------- magnetic CTAs (fine pointers only) ---------- */
  if (matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll(".pill").forEach((btn) => {
      const strength = 0.28;
      const xTo = gsap.quickTo(btn, "x", { duration: 0.5, ease });
      const yTo = gsap.quickTo(btn, "y", { duration: 0.5, ease });
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * strength);
        yTo((e.clientY - (r.top + r.height / 2)) * strength);
      });
      btn.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
    });
  }

  // Recalculate after fonts/layout settle so triggers land accurately.
  window.addEventListener("load", () => window.ScrollTrigger.refresh());
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => window.ScrollTrigger.refresh());
  }
})();
