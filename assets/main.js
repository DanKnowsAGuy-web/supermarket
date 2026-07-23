/* Energy Plus · Main Template
   Choreography: everything animates once, settles, and never fidgets. */
(() => {
  "use strict";
  document.documentElement.classList.add("js");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Arm the reveal choreography only once the renderer proves it is painting
     frames (two consecutive animation frames). In paused, hidden, or headless
     renderers rAF never fires, the class never lands, and the page stays fully
     visible with zero animation. Runs pre-paint on normal visits, so there is
     no flash. */
  if (!reduced) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.documentElement.classList.add("anim-ready");
      startSignal();
    }));
  }

  /* ---------- reveals ---------- */
  /* Failsafe first: content must never stay hidden if observers can't run
     (hidden tab, headless renderer, throttled background). After 1600ms any
     unrevealed element above the fold reveals itself; on first scroll or
     visibility change, everything already past is caught up. */
  const revealAll = () => document.querySelectorAll(".reveal:not(.is-in)").forEach((el) => el.classList.add("is-in"));
  if (!reduced && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    setTimeout(() => {
      document.querySelectorAll(".reveal:not(.is-in)").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < innerHeight && r.bottom > 0) el.classList.add("is-in");
      });
    }, 1600);
    document.addEventListener("visibilitychange", () => { if (document.hidden) revealAll(); });
    addEventListener("pagehide", revealAll);
  } else {
    revealAll();
  }

  /* ---------- count-up monuments (once, then lock) ---------- */
  const counters = document.querySelectorAll("[data-countup]");
  if (counters.length && !reduced && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        const el = e.target;
        const target = parseFloat(el.getAttribute("data-countup")) || 0;
        const decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
        const prefix = el.getAttribute("data-prefix") || "";
        const suffix = el.getAttribute("data-suffix") || "";
        const t0 = performance.now(), dur = 1100;
        const easeOut = (t) => 1 - Math.pow(1 - t, 4);
        const tick = (now) => {
          const p = Math.min((now - t0) / dur, 1);
          el.textContent = prefix + (easeOut(p) * target).toFixed(decimals) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.6 });
    counters.forEach((el) => io.observe(el));
  }

  /* ---------- hero signal line: dirty resolves to clean, once ----------
     Only called from the anim-ready gate; the static default (both paths
     drawn, dirty prominent) is a designed still in its own right. */
  function startSignal() {
    // choreo.js owns the hero signal when GSAP is active; avoid double-driving it.
    if (document.documentElement.classList.contains("choreo-ready")) return;
    const sig = document.querySelector(".hero__signal");
    if (!sig) return;
    const clean = sig.querySelector(".sig-clean");
    const dirty = sig.querySelector(".sig-dirty");
    if (!clean || !dirty) return;
    clean.style.clipPath = "inset(0 100% 0 0)";
    dirty.style.transition = "opacity 1400ms cubic-bezier(0.22,1,0.36,1)";
    clean.style.transition = "clip-path 1600ms cubic-bezier(0.22,1,0.36,1)";
    setTimeout(() => {
      clean.style.clipPath = "inset(0 0% 0 0)";
      dirty.style.opacity = "0.25";
    }, 500);
  }

  /* ---------- method choreography ---------- */
  const stage = document.getElementById("method-stage");
  const layers = Array.from(document.querySelectorAll(".layer"));
  const readoutName = document.getElementById("readout-name");
  const readoutVal = document.getElementById("readout-val");
  if (stage && layers.length && "IntersectionObserver" in window) {
    const setStep = (i) => {
      stage.setAttribute("data-step", String(i + 1));
      layers.forEach((l, j) => l.classList.toggle("is-active", i === j));
      if (readoutName) readoutName.textContent = layers[i].getAttribute("data-name") || "";
      if (readoutVal) readoutVal.textContent = layers[i].getAttribute("data-fig") || "";
    };
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) setStep(layers.indexOf(e.target));
      }
    }, { rootMargin: "-40% 0px -45% 0px", threshold: 0 });
    layers.forEach((l) => io.observe(l));
    setStep(0);
  }

  /* ---------- inline film: the facade becomes the player, in place ---------- */
  const filmPlayer = document.querySelector(".film-player");
  const filmFacade = filmPlayer && filmPlayer.querySelector("[data-film-play]");
  if (filmPlayer && filmFacade) {
    filmFacade.addEventListener("click", () => {
      const embed = document.createElement("div");
      embed.className = "film-player__embed";
      const f = document.createElement("iframe");
      f.src = "https://fast.wistia.net/embed/iframe/n765rk6v4z?autoPlay=true&playbar=true&dnt=true";
      f.allow = "autoplay; fullscreen";
      f.title = "Energy Plus: how we cut your energy bill, 6 minutes";
      embed.appendChild(f);
      filmPlayer.replaceChildren(embed);
      filmPlayer.classList.add("is-playing");
    });
  }

  /* ---------- gate open: bloom the portraits from black-and-white to colour ----------
     Add the class on the next frame so the grayscale state paints first and the
     filter actually transitions, rather than appearing already in colour. */
  document.querySelectorAll("details.gate").forEach((d) => {
    d.addEventListener("toggle", () => {
      if (d.open) requestAnimationFrame(() => d.classList.add("gate--shown"));
      else d.classList.remove("gate--shown");
    });
  });

  /* ---------- text-the-founder panels ---------- */
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (/Mac/.test(navigator.userAgent) && "ontouchend" in document);
  document.querySelectorAll(".js-tf-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const wrap = btn.closest(".cta-block");
      const panel = wrap.querySelector(".tf-panel");
      const willOpen = !panel.classList.contains("is-open");
      panel.classList.toggle("is-open", willOpen);
      btn.setAttribute("aria-expanded", String(willOpen));
      if (willOpen) {
        const msg = panel.querySelector("textarea");
        msg.style.height = "auto";
        msg.style.height = msg.scrollHeight + "px";
        buildSms(panel);
        msg.focus();
      }
    });
  });
  function buildSms(panel) {
    const msg = panel.querySelector("textarea");
    const send = panel.querySelector(".js-tf-send");
    if (!msg || !send) return;
    send.href = "sms:" + (send.getAttribute("data-phone") || "") + (isIOS ? "&" : "?") + "body=" + encodeURIComponent(msg.value);
  }
  document.addEventListener("input", (e) => {
    if (e.target.matches(".tf-panel textarea")) {
      buildSms(e.target.closest(".tf-panel"));
      e.target.style.height = "auto";
      e.target.style.height = e.target.scrollHeight + "px";
    }
  });

  /* ---------- Cal.com: load once, bind to booking buttons ---------- */
  let calReady = false;
  const ensureCal = () => {
    if (calReady) return;
    calReady = true;
    (function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if (typeof namespace === "string") { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ["initNamespace", namespace]); } else p(cal, ar); return; } p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
    window.Cal("init", "15min", { origin: "https://app.cal.com" });
    window.Cal.ns["15min"]("ui", { hideEventTypeDetails: false, layout: "month_view", theme: "light", cssVarsPerTheme: { light: { "cal-brand": "#2a7f79" } } });
  };
  if (document.readyState === "complete") setTimeout(ensureCal, 900);
  else addEventListener("load", () => setTimeout(ensureCal, 900));
  ["pointerdown", "keydown", "scroll"].forEach((ev) => addEventListener(ev, ensureCal, { once: true, passive: true }));

  /* ---------- print: open all disclosures so nothing prints collapsed ---------- */
  addEventListener("beforeprint", () => {
    document.querySelectorAll("details:not([open])").forEach((d) => {
      d.setAttribute("data-print-opened", "");
      d.setAttribute("open", "");
    });
  });
  addEventListener("afterprint", () => {
    document.querySelectorAll("details[data-print-opened]").forEach((d) => {
      d.removeAttribute("open");
      d.removeAttribute("data-print-opened");
    });
  });

  /* ---------- calculator iframe height ---------- */
  addEventListener("message", (e) => {
    if (!/danknowsaguy-web\.github\.io$/.test(new URL(e.origin || "https://x.invalid").hostname)) return;
    const frame = document.getElementById("ep-calc-frame");
    if (!frame) return;
    let h = null;
    if (typeof e.data === "number") h = e.data;
    else if (e.data && typeof e.data === "object" && typeof e.data.height === "number") h = e.data.height;
    if (h && h > 300 && h < 4000) frame.style.height = h + "px";
  });

  /* ---------- carousel: auto-advancing project cards ----------
     Left on its own it advances every 5s. The moment the visitor takes the
     wheel (an arrow or a dot), it holds the slide they landed on for 15s, then
     falls back to the 5s cadence. Autoplay only runs while the enclosing gate
     is open, and never under reduced motion. */
  document.querySelectorAll("[data-carousel]").forEach((root) => {
    const track = root.querySelector("[data-carousel-track]");
    const slides = Array.from(root.querySelectorAll(".carousel__slide"));
    const dotsWrap = root.querySelector("[data-carousel-dots]");
    const prevBtn = root.querySelector("[data-carousel-prev]");
    const nextBtn = root.querySelector("[data-carousel-next]");
    if (!track || slides.length < 2) return;
    const AUTO = 5000, DWELL = 15000;
    let index = 0, timer = null;

    const dots = slides.map((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "carousel__dot";
      b.setAttribute("aria-label", "Go to project " + (i + 1));
      b.addEventListener("click", () => { go(i); bump(); });
      if (dotsWrap) dotsWrap.appendChild(b);
      return b;
    });

    const render = () => {
      track.style.transform = "translateX(" + (-index * 100) + "%)";
      slides.forEach((s, i) => s.setAttribute("aria-hidden", String(i !== index)));
      dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
    };
    const go = (i) => { index = (i + slides.length) % slides.length; render(); };
    const schedule = (delay) => {
      clearTimeout(timer);
      if (reduced) return;
      timer = setTimeout(() => { go(index + 1); schedule(AUTO); }, delay);
    };
    const bump = () => schedule(DWELL); // a manual touch buys a longer read

    if (prevBtn) prevBtn.addEventListener("click", () => { go(index - 1); bump(); });
    if (nextBtn) nextBtn.addEventListener("click", () => { go(index + 1); bump(); });
    root.addEventListener("mouseenter", () => clearTimeout(timer));
    root.addEventListener("mouseleave", () => schedule(AUTO));
    root.addEventListener("focusin", () => clearTimeout(timer));
    root.addEventListener("focusout", () => schedule(AUTO));

    render();
    const gate = root.closest("details.gate");
    if (gate) {
      gate.addEventListener("toggle", () => { if (gate.open) schedule(AUTO); else clearTimeout(timer); });
      if (gate.open) schedule(AUTO);
    } else {
      schedule(AUTO);
    }
  });

  /* ---------- proof: the full-record sheet ---------- */
  (() => {
    const btn = document.getElementById("proof-seeall");
    const sheet = document.getElementById("proof-sheet");
    const closeBtn = document.getElementById("proof-sheet-close");
    if (!btn || !sheet || !closeBtn) return;
    const sheetBody = sheet.querySelector(".proof-sheet__body");
    let lastFocus = null;

    const open = () => {
      lastFocus = document.activeElement;
      sheet.hidden = false;
      void sheet.offsetWidth; // reflow so the opacity transition runs (rAF is paused when hidden)
      sheet.classList.add("is-open");
      document.documentElement.classList.add("proof-sheet-open");
      btn.setAttribute("aria-expanded", "true");
      if (sheetBody) sheetBody.scrollTop = 0;
      closeBtn.focus();
    };
    const close = () => {
      sheet.classList.remove("is-open");
      document.documentElement.classList.remove("proof-sheet-open");
      btn.setAttribute("aria-expanded", "false");
      const finish = () => { sheet.hidden = true; };
      if (reduced) finish();
      else {
        let done = false;
        const onEnd = () => { if (done) return; done = true; sheet.removeEventListener("transitionend", onEnd); finish(); };
        sheet.addEventListener("transitionend", onEnd);
        setTimeout(onEnd, 400);
      }
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };

    btn.addEventListener("click", open);
    closeBtn.addEventListener("click", close);
    sheet.addEventListener("click", (e) => { if (e.target === sheet) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !sheet.hidden) close(); });
    sheet.addEventListener("keydown", (e) => {
      if (e.key !== "Tab") return;
      const f = sheet.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  })();
})();
