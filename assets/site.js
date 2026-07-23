/* Energy Plus · master template behavior.
   Everything here enhances a page that already works without it. */
(() => {
  "use strict";
  /* ?static=1 renders the finished stills with no choreography: QA, screenshots,
     and archival captures see the page exactly as it rests. */
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches
    || new URLSearchParams(location.search).has("static");

  /* ---------- header: the mark alone over the hero ---------- */
  const head = document.getElementById("head");
  const hero = document.querySelector(".hero");
  if (head && hero) {
    const sync = () => head.classList.toggle("is-clear", window.scrollY < hero.offsetHeight - 64);
    sync();
    addEventListener("scroll", sync, { passive: true });
    addEventListener("resize", sync, { passive: true });
  }

  /* ---------- reveals: armed only when frames are actually painting ---------- */
  if (!reduced && "IntersectionObserver" in window) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.documentElement.classList.add("anim-ready");
      const targets = document.querySelectorAll(".beat > .wrap, .close__in, .fig, .readout, .floor, .record, .monument, .kit");
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
      targets.forEach((el) => io.observe(el));
      const catchUp = () => targets.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < innerHeight && r.bottom > 0) el.classList.add("is-in");
      });
      setTimeout(catchUp, 1500);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) targets.forEach((el) => el.classList.add("is-in"));
      });
    }));
  }

  /* ---------- text-the-founder panels ---------- */
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (/Mac/.test(navigator.userAgent) && "ontouchend" in document);
  const buildSms = (panel) => {
    const msg = panel.querySelector("textarea");
    const send = panel.querySelector(".js-sms-send");
    if (msg && send) send.href = "sms:" + (send.getAttribute("data-phone") || "") + (isIOS ? "&" : "?") + "body=" + encodeURIComponent(msg.value);
  };
  document.querySelectorAll(".js-sms-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const panel = btn.closest("section, .hero__in, .close__in").querySelector(".sms");
      if (!panel) return;
      const open = panel.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(open));
      if (open) { buildSms(panel); panel.querySelector("textarea").focus(); }
    });
  });
  document.addEventListener("input", (e) => {
    if (e.target.matches(".sms textarea")) buildSms(e.target.closest(".sms"));
  });

  /* ---------- Cal.com: load once, open from any [data-book] ---------- */
  let calReady = false;
  const ensureCal = () => {
    if (calReady) return;
    calReady = true;
    (function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if (typeof namespace === "string") { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ["initNamespace", namespace]); } else p(cal, ar); return; } p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
    window.Cal("init", "15min", { origin: "https://app.cal.com" });
    window.Cal.ns["15min"]("ui", { hideEventTypeDetails: false, layout: "month_view", theme: "light", cssVarsPerTheme: { light: { "cal-brand": "#2a7f79" } } });
  };
  document.querySelectorAll("[data-book]").forEach((btn) => {
    btn.setAttribute("data-cal-namespace", "15min");
    btn.setAttribute("data-cal-link", "dan-knows-a-gut/15min");
    btn.setAttribute("data-cal-config", '{"layout":"month_view","theme":"light"}');
  });
  if (document.readyState === "complete") setTimeout(ensureCal, 800);
  else addEventListener("load", () => setTimeout(ensureCal, 800));
  ["pointerdown", "keydown", "scroll"].forEach((ev) => addEventListener(ev, ensureCal, { once: true, passive: true }));

  /* ---------- the gate: estimator + worksheet for an email ----------
     Progressive: without JS the estimator is simply open. With JS, the gate
     shows until an email is given once; a capture-service outage never blocks
     the visitor (we unlock regardless and fail quietly). */
  const gateEl = document.getElementById("calc-gate");
  const gateCalc = document.querySelector("[data-calc]");
  const gateDl = document.getElementById("gate-download");
  if (gateEl && gateCalc) {
    const unlock = () => { gateEl.hidden = true; gateCalc.hidden = false; };
    if (localStorage.getItem("ep-unlocked")) {
      unlock();
    } else {
      gateCalc.hidden = true;
      gateEl.hidden = false;
      const form = document.getElementById("gate-form");
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = form.querySelector('input[type="email"]');
        const email = input.value.trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { input.focus(); return; }
        const btn = form.querySelector("button");
        btn.disabled = true; btn.textContent = "Unlocking…";
        const finish = () => {
          try { localStorage.setItem("ep-unlocked", "1"); } catch (err) {}
          unlock();
          if (gateDl) gateDl.hidden = false;
        };
        fetch("https://formsubmit.co/ajax/dan@yourenergyplus.com", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({ email, _subject: "Estimator unlock (new lead)", page: "energy-plus-landing", _template: "table" }),
        }).then(finish, finish);
      });
    }
  }

  /* ---------- calculator: height messages + loading state ---------- */
  const calcFrame = document.getElementById("calc-frame");
  const calcWrap = document.querySelector("[data-calc]");
  if (calcFrame) {
    calcFrame.addEventListener("load", () => {
      const l = calcWrap && calcWrap.querySelector(".calc__loading");
      if (l) l.remove();
    });
    addEventListener("message", (e) => {
      if (!/danknowsaguy-web\.github\.io$/.test(new URL(e.origin || "https://x.invalid").hostname)) return;
      let h = null;
      if (typeof e.data === "number") h = e.data;
      else if (e.data && typeof e.data === "object" && typeof e.data.height === "number") h = e.data.height;
      if (h && h > 300 && h < 4000) calcFrame.style.height = h + "px";
    });
  }

  /* ---------- the full record ---------- */
  /* [figure, site, context, method]; measured at the named sites under their own
     conditions; attribution and limits are covered by notes 1 and 9. */
  const RECORD = [
    { t: "Whole building examples", c: 3, rows: [
      ["49.2%", "AZ Ford Dealership", "Auto dealership · Arizona", "Documented project total (power quality + HVAC + lighting)"],
      ["27% avg", "City of Rainsville", "Municipal · Alabama", "First-year monitored, power conditioning + LED"],
      ["+50% / +2%", "Commercial Bottling Plant", "Manufacturing · Upper Midwest", "Growth-adjusted net cost study (50% more output, 2% more cost)"]
    ]},
    { t: "HVAC examples", c: 67, rows: [
      ["33%", "Durham College", "Education / research · Oshawa, ON", "16,851 data points; ANOVA / t-test"],
      ["27.75% avg", "City of Windsor", "Municipal · Windsor, ON", "Enwin Utilities verified; OPA approved"],
      ["23.6%", "NASA Jet Propulsion Lab", "Government · Pasadena, CA", "7-day before/after, Caltech / Emcor"],
      ["21.1% kWh", "Simon Property Group", "Retail, Jersey Gardens mall · Elizabeth, NJ", "IPMVP; $41,473/yr, 12-mo payback"],
      ["19.2% RTU", "Anheuser-Busch (Mitchell Distributing)", "Distribution · United States", "20-mo payback; 904% lifetime ROI"],
      ["20–35%", "Trebor International", "Manufacturing · Windsor, ON", "P.E. licensed in 6 jurisdictions"],
      ["21–32%", "Kenya program", "Lab + field · Kenya Bureau of Standards; LECOL Mombasa", "KEBS lab test vs BS EN 60335-1"],
      ["27–30%", "Lebanon program", "2 sites · DALFA Beirut · HSZ Zgharta", "ENISCOPE data, witnessed and co-signed"],
      ["47.6% ΔT", "Electrolux", "Lab / OEM · United States", "Tri-S ECM thermal report"],
      ["284% ROI", "Men's Wearhouse (Tailored Brands)", "Retail · United States", "Dual-RTU, 12.5-mo payback"],
      ["24%+ / yr", "McDonald's franchisee", "Quick-serve · United States", "Annual study"],
      ["20% avg", "Bangladesh Ministry of Power", "Government pilot · Dhaka", "Official certification issued"],
      ["20% avg", "AT&T Mobility / SDG&E", "Telecom, 9 cell sites · San Diego, CA", "HOBO loggers; utility-engineer co-authored"],
      ["19.5–21.6%", "Verizon Network Services", "Telecom · Dallas, TX", "P.E.-authored; approved for deployment"],
      ["~21%", "DOE FEMP demonstration", "Government, gymnasium RTUs · United States", "U.S. DOE / ORNL controlled study"],
      ["22%", "Bashas' Supermarket", "Grocery · Gold Canyon, AZ", "Grocery vertical study"],
      ["19.4% / yr", "Domino's Store 6711", "Quick-serve · United States", "2-year study"],
      ["12–27%", "UAE program", "14 institutions · Sheraton Jumeirah · Sharjah FZ · Jotun · Flora Grand", "14-institution deployment"],
      ["15–39%", "Multi-country program", "South Africa · Pakistan · Indonesia · Puerto Rico", "Field studies per country"],
      ["15–21%", "Bangladesh enterprise", "56 units · GraphicPeople (WPP) · BEXIMCO · IDLC Finance", "Enterprise deployment"],
      ["15% eff.", "DHL (ammonia refrigeration)", "Logistics · United States", "Compressor study, 13.8-mo payback"],
      ["200 sites", "Airtel Bangladesh", "Telecom, 200 BTS sites · Nationwide", "3-month pilot, no performance issues"],
      ["5-mo payback", "Italgas Toscana", "Utility, heat pump · Italy", "Field efficiency trial"],
      ["50%", "General Electric", "Voltas · 1.5 ton", "India · HVAC Optimizer field test"],
      ["45%", "IIT, Mumbai", "Voltas · 1.5 ton", "India · HVAC Optimizer field test"],
      ["44%", "Merrill Lynch", "Carrier · 2.0 ton", "India · HVAC Optimizer field test"],
      ["39%", "GTL", "Carrier · 1.5 ton", "India · HVAC Optimizer field test"],
      ["39%", "Premier Energy Transmission", "Commander · 1.5 ton", "India · HVAC Optimizer field test"],
      ["35%", "Reliance Communication", "Daikin · 2.0 ton", "India · HVAC Optimizer field test"],
      ["35%", "EPIC Energy", "LG · 1.5 ton", "India · HVAC Optimizer field test"],
      ["34%", "CTV", "National · 1.5 ton", "India · HVAC Optimizer field test"],
      ["33%", "Airtel", "Carrier · 8.5 ton", "India · HVAC Optimizer field test"],
      ["30%", "The Association Building Company (TATA)", "Voltas · 1.5 ton", "India · HVAC Optimizer field test"],
      ["29%", "Reliance Energy", "Videocon · 1.5 ton", "India · HVAC Optimizer field test"],
      ["28%", "Larsen & Toubro", "Voltas · 1.5 ton", "India · HVAC Optimizer field test"],
      ["28%", "Agility Logistics", "LG · 1.5 ton", "India · HVAC Optimizer field test"],
      ["27%", "Indian School of Business", "Hitachi · 1.5 ton", "India · HVAC Optimizer field test"],
      ["27%", "ENAM Securities", "Videocon · 1.5 ton", "India · HVAC Optimizer field test"],
      ["27%", "India Independent Strategy and Research", "Mitsubishi · 2.0 ton", "India · HVAC Optimizer field test"],
      ["26%", "TATA Consultancy Services", "Blue Star · 11 ton", "India · HVAC Optimizer field test"],
      ["26%", "Hero Moto Corp", "Carrier · 2.0 ton", "India · HVAC Optimizer field test"],
      ["26%", "CCI Club, Mumbai", "O General · 2.0 ton", "India · HVAC Optimizer field test"],
      ["25%", "Daikin", "Daikin · 2.0 ton", "India · HVAC Optimizer field test"],
      ["25%", "Godrej", "Godrej · 2.0 ton", "India · HVAC Optimizer field test"],
      ["25%", "Infosys", "Toshiba · 1.8 ton", "India · HVAC Optimizer field test"],
      ["25%", "ICICI", "Videocon · 1.5 ton", "India · HVAC Optimizer field test"],
      ["25%", "ISPAT", "LG · 1.5 ton", "India · HVAC Optimizer field test"],
      ["25%", "Vinergy", "Mitsubishi · 1.0 ton", "India · HVAC Optimizer field test"],
      ["25%", "Raj Bhavan", "LG · 2.0 ton", "India · HVAC Optimizer field test"],
      ["25%", "Diners Business Service", "LG · 1.5 ton", "India · HVAC Optimizer field test"],
      ["25%", "Great Eastern Shipping Company", "Daikin · 2.0 ton", "India · HVAC Optimizer field test"],
      ["24%", "Blue Star", "Blue Star · 2.0 ton", "India · HVAC Optimizer field test"],
      ["24%", "TATA Tele", "Voltas · 2.0 ton", "India · HVAC Optimizer field test"],
      ["23%", "Reliance Web World", "Carrier · 1.5 ton", "India · HVAC Optimizer field test"],
      ["23%", "Tech Mahindra", "LG · 1.5 ton", "India · HVAC Optimizer field test"],
      ["23%", "Raymond Industries", "LG · 1.5 ton", "India · HVAC Optimizer field test"],
      ["22%", "Siemens", "Panasonic · 1.5 ton", "India · HVAC Optimizer field test"],
      ["21%", "TATA Motors", "Voltas · 1.5 ton", "India · HVAC Optimizer field test"],
      ["21%", "KPMG", "Carrier · 17 ton", "India · HVAC Optimizer field test"],
      ["20%", "Viom", "SpaceMaker · 3.5 ton", "India · HVAC Optimizer field test"],
      ["20%", "AT&T Mobility", "LG · 2.0 ton", "India · HVAC Optimizer field test"],
      ["20%", "Veritas", "LG · 1.0 ton", "India · HVAC Optimizer field test"],
      ["20%", "Vitz Hotel", "Voltas · 3.0 ton", "India · HVAC Optimizer field test"],
      ["19%", "Mahindra & Mahindra", "Blue Star · 2.0 ton", "India · HVAC Optimizer field test"],
      ["19%", "MTNL", "Voltas · 2.0 ton", "India · HVAC Optimizer field test"],
      ["19%", "Naval Dockyard", "Videocon · 1.5 ton", "India · HVAC Optimizer field test"],
      ["18%", "TATA Power", "Carrier · 8.5 ton", "India · HVAC Optimizer field test"]
    ]},
    { t: "Power conditioning examples (a later-phase upgrade)", c: 25, rows: [
      ["24.0%", "Edward Hospital", "Hospital · Naperville, IL", "Power factor + voltage conditioning + line reactors; metered, beat projection, $84,270 / 9 mo"],
      ["20% avg", "Starnes Quarter Horses", "Agriculture · Alabama", "Monthly bill comparison"],
      ["16% kWh", "Team Wow (Domino's)", "Quick-serve · El Paso, TX", "Weather-adjusted, U.S. DOE standards"],
      ["15.0% kWh", "Buffalo Rock", "Manufacturing · Birmingham, AL", "Noesis, 12-month study"],
      ["15% kWh", "Henkel", "Manufacturing · Richmond, VA", "Exceeded corporate sustainability goal"],
      ["15% kWh", "Cowabunga (Domino's)", "Quick-serve · Georgia", "Third-party metering, 7-store install"],
      ["14.8% kWh", "Corey Center", "Office + warehouse · Atlanta, GA", "Noesis, 4-year average"],
      ["14% kWh", "Caribe Resort", "Hospitality · Orange Beach, AL", "Facilities-director measured"],
      ["up to 14%", "Serra Mazda", "Retail / auto · Trussville, AL", "CHI Energy, 12-month study"],
      ["13.5% kWh", "Hilton Garden Inn", "Hospitality · Marietta, GA", "ABRAXAS, 12-month study"],
      ["13.0% kWh", "Planet Fitness", "Fitness · Birmingham, AL", "CHI Energy"],
      ["12.9% kWh", "Hi-Noon (Sinclair)", "C-store / fuel · Missoula, MT", "Verified by NorthWestern Energy"],
      ["12.5% kWh", "RPM Pizza (Domino's)", "Quick-serve, 170+ stores · MS · LA · AL · IN · MI", "Normalized; >$100k/yr projected"],
      ["12.5% kWh", "Wheeling University", "Education · Wheeling, WV", "Engineering capstone study"],
      ["12% kWh", "Pinnacle Center 4 (J&J HQ)", "Office · Rogers, AR", "Occupancy-adjusted baseline"],
      ["9–19%", "The Massey Building", "Office (historic) · Birmingham, AL", "Per-floor metering"],
      ["9% kWh", "Popeyes", "Quick-serve, 25 locations · GA · AL · LA · MS · TN", "ABRAXAS"],
      ["9.7% delta", "Krystal", "Quick-serve · Georgia", "Noesis, vs. control store"],
      ["8.59% kW", "Las Vegas Hotel & Casino", "Hospitality · Las Vegas, NV", "Independent panel metering"],
      ["~1 yr payback", "Pacific Steel", "Manufacturing · Montana", "PE-sealed technoeconomic analysis"],
      ["18% panel", "Haven Health", "Medical · United States", "Industria Energy independent study"],
      ["40% motor", "Sequoyah Elementary", "Education · Tennessee", "Data-logged 14 days, 9.5-mo ROI"],
      ["15.4% amps", "Arnie's Gas & Tire", "C-store / fuel · Ronan, MT", "Verified by electrical engineer"],
      ["~$1,500 / store", "C-Store program (TeamSledd / Liberty)", "C-store / fuel, 12 stores · OH · WV · PA", "3-year year-over-year study"],
      ["THD −30 / −45%", "Off-grid solar residence", "Power-quality test · South Carolina", "PowerSight 5000 metering"]
    ]}
  ];

  const sheet = document.getElementById("record-sheet");
  const openBtn = document.getElementById("record-open");
  const closeBtn = document.getElementById("record-close");
  if (sheet && openBtn && closeBtn) {
    let rendered = false;
    const render = () => {
      if (rendered) return;
      rendered = true;
      const body = document.getElementById("record-body");
      const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      body.innerHTML = RECORD.map((g) =>
        '<section class="rec-group"><h3>' + esc(g.t) + "<span>" + g.c + "</span></h3><ul>" +
        g.rows.map((r) =>
          '<li><span class="r">' + esc(r[0]) + '</span><span class="n"><b>' + esc(r[1]) + "</b><span>" + esc(r[2]) + '</span></span><span class="b">' + esc(r[3]) + "</span></li>"
        ).join("") + "</ul></section>"
      ).join("");
    };
    openBtn.addEventListener("click", () => { render(); sheet.showModal(); });
    closeBtn.addEventListener("click", () => sheet.close());
    sheet.addEventListener("click", (e) => { if (e.target === sheet) sheet.close(); });
  }

  /* ---------- the living ledger: three columns of the record, drifting ---------- */
  const ledger = document.getElementById("ledger");
  if (ledger) {
    const flat = [];
    RECORD.forEach((g) => g.rows.forEach((r) => flat.push(r)));
    /* food retail first: a grocery reader should meet their own vertical before anyone else's */
    const rank = (r) => {
      const s = r[1] + " " + r[2] + " " + r[3];
      if (/grocer|supermarket|refrigerat/i.test(s)) return 0;
      if (/c-store|quick-serve|food|retail/i.test(s)) return 1;
      return 2;
    };
    flat.sort((a, b) => rank(a) - rank(b));
    const cols = Array.from(ledger.querySelectorAll(".ledger__col"));
    const escL = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const card = (r) => '<div class="ledger__card"><span class="r">' + escL(r[0]) + '</span><span class="n">' + escL(r[1]) + '</span><span class="w">' + escL(r[2]) + "</span></div>";
    cols.forEach((col, i) => {
      const rows = flat.filter((_, j) => j % cols.length === i);
      const html = rows.map(card).join("");
      col.innerHTML = html + html; /* doubled: the -50% drift loops seamlessly */
    });
    ledger.addEventListener("click", () => { const b = document.getElementById("record-open"); if (b) b.click(); });
  }

  /* ---------- selected work: the workfile exhibit, advancing on its own ---------- */
  const wf = document.querySelector("[data-workfile]");
  if (wf) {
    const track = wf.querySelector("[data-wf-track]");
    const count = track.children.length;
    const dotsWrap = wf.querySelector("[data-wf-dots]");
    const nEl = wf.querySelector("[data-wf-n]");
    const AUTO = 12000, HOLD = 30000;
    let index = 0, timer = 0, paused = false, inView = false;
    const arm = (ms) => { clearTimeout(timer); if (reduced || paused || !inView) return; timer = setTimeout(() => go(index + 1, false), ms); };
    const go = (i, manual) => {
      index = (i + count) % count;
      track.style.transform = "translateX(" + (-index * 100) + "%)";
      Array.from(dotsWrap.children).forEach((d, j) => d.classList.toggle("is-active", j === index));
      if (nEl) nEl.textContent = String(index + 1);
      arm(manual ? HOLD : AUTO);
    };
    for (let i = 0; i < count; i++) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "workfile__dot";
      b.setAttribute("aria-label", "Go to project " + (i + 1));
      b.addEventListener("click", () => go(i, true));
      dotsWrap.appendChild(b);
    }
    wf.querySelector("[data-wf-prev]").addEventListener("click", () => go(index - 1, true));
    wf.querySelector("[data-wf-next]").addEventListener("click", () => go(index + 1, true));
    wf.addEventListener("mouseenter", () => { paused = true; clearTimeout(timer); });
    wf.addEventListener("mouseleave", () => { if (!wf.contains(document.activeElement)) { paused = false; arm(AUTO); } });
    wf.addEventListener("focusin", () => { paused = true; clearTimeout(timer); });
    wf.addEventListener("focusout", (e) => { if (!wf.contains(e.relatedTarget)) { paused = false; arm(AUTO); } });
    wf.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") go(index - 1, true);
      else if (e.key === "ArrowRight") go(index + 1, true);
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((es) => es.forEach((e) => { inView = e.isIntersecting; if (inView) arm(AUTO); else clearTimeout(timer); }), { threshold: 0.3 }).observe(wf);
    } else { inView = true; }
    go(0, false);
  }

  /* ---------- the SunCore turntable: rotates only while on stage ----------
     The file is baked forward-then-reverse (no browser can play video
     backwards), so the loop seam is invisible; half speed stretches the
     8s rotation into a ~32s sweep. */
  const turn = document.querySelector(".kit__flag video");
  if (turn && !reduced && "IntersectionObserver" in window) {
    turn.playbackRate = 0.5;
    new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { const p = turn.play(); if (p) p.catch(() => {}); }
      else turn.pause();
    }), { threshold: 0.25 }).observe(turn);
  }

  /* ---------- the film: the facade becomes the player, in place ---------- */
  const filmFacade = document.querySelector("[data-film-inline]");
  if (filmFacade) {
    filmFacade.addEventListener("click", () => {
      const holder = filmFacade.closest(".film-inline");
      const f = document.createElement("iframe");
      f.src = "https://fast.wistia.net/embed/iframe/n765rk6v4z?autoPlay=true&playbar=true&dnt=true";
      f.allow = "autoplay; fullscreen";
      f.title = "Energy Plus: how we cut your energy bill, 6 minutes";
      holder.classList.add("is-playing");
      holder.replaceChildren(f);
    });
  }

  /* ---------- the listen test: the waste, out loud ----------
     Synthesized, not sampled: a fan bed plus a compressor hum whose envelope
     is the entire lesson. Healthy cycles; wasteful never rests. */
  const listenWrap = document.querySelector(".listen");
  if (listenWrap && (window.AudioContext || window.webkitAudioContext)) {
    document.querySelectorAll(".listen__meter").forEach((m) => {
      for (let i = 0; i < 28; i++) m.appendChild(document.createElement("i"));
    });
    let ctx = null;
    let live = null;
    const makeNoise = () => {
      const len = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      return src;
    };
    const stop = () => {
      if (!live) return;
      const l = live; live = null;
      l.btn.setAttribute("aria-pressed", "false");
      l.card.classList.remove("is-live");
      clearInterval(l.timer); cancelAnimationFrame(l.raf);
      l.bars.forEach((b) => { b.style.height = "12%"; });
      const t = ctx.currentTime;
      l.master.gain.cancelScheduledValues(t);
      l.master.gain.setValueAtTime(l.master.gain.value, t);
      l.master.gain.linearRampToValueAtTime(0.0001, t + 0.25);
      setTimeout(() => l.nodes.forEach((n) => { try { n.stop(); } catch (e) {} }), 350);
    };
    const start = (mode, btn) => {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
      const card = btn.closest(".listen__card");
      const bars = Array.from(card.querySelectorAll(".listen__meter i"));
      const t0 = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, t0);
      master.gain.linearRampToValueAtTime(0.5, t0 + 0.4);
      master.connect(ctx.destination);
      /* fan bed: broadband air, always on */
      const fan = makeNoise();
      const fanLP = ctx.createBiquadFilter(); fanLP.type = "lowpass"; fanLP.frequency.value = 900;
      const fanG = ctx.createGain(); fanG.gain.value = 0.28;
      fan.connect(fanLP); fanLP.connect(fanG); fanG.connect(master);
      /* compressor: low mechanical hum behind its own envelope */
      const comp = ctx.createGain(); comp.gain.value = mode === "wasteful" ? 1 : 0; comp.connect(master);
      const o1 = ctx.createOscillator(); o1.type = "sawtooth"; o1.frequency.value = 57;
      const o2 = ctx.createOscillator(); o2.type = "sawtooth"; o2.frequency.value = 114; o2.detune.value = 7;
      const oLP = ctx.createBiquadFilter(); oLP.type = "lowpass"; oLP.frequency.value = 210; oLP.Q.value = 1.1;
      const oG = ctx.createGain(); oG.gain.value = 0.5;
      o1.connect(oLP); o2.connect(oLP); oLP.connect(oG); oG.connect(comp);
      const rumble = makeNoise();
      const rBP = ctx.createBiquadFilter(); rBP.type = "bandpass"; rBP.frequency.value = 150; rBP.Q.value = 0.7;
      const rG = ctx.createGain(); rG.gain.value = 0.5;
      rumble.connect(rBP); rBP.connect(rG); rG.connect(comp);
      [fan, o1, o2, rumble].forEach((n) => n.start());
      btn.setAttribute("aria-pressed", "true");
      card.classList.add("is-live");
      live = { mode, master, btn, card, bars, env: mode === "wasteful" ? 1 : 0, timer: 0, raf: 0, nodes: [fan, o1, o2, rumble] };
      if (mode === "healthy") {
        let on = false;
        const cycle = () => {
          if (!live || live.card !== card) return;
          on = !on;
          const t = ctx.currentTime;
          comp.gain.cancelScheduledValues(t);
          comp.gain.setValueAtTime(comp.gain.value, t);
          comp.gain.linearRampToValueAtTime(on ? 1 : 0, t + (on ? 0.5 : 0.9));
          live.env = on ? 1 : 0;
        };
        cycle();
        live.timer = setInterval(cycle, 3400);
      }
      let smooth = 0;
      const draw = () => {
        if (!live || live.card !== card) return;
        smooth += ((live.env * 0.75 + 0.25) - smooth) * 0.06;
        live.bars.forEach((b, i) => {
          const j = 0.6 + 0.4 * Math.sin(Date.now() / (90 + i * 7) + i * 1.7) * Math.random();
          b.style.height = Math.max(8, Math.min(100, smooth * j * 100)) + "%";
        });
        live.raf = requestAnimationFrame(draw);
      };
      live.raf = requestAnimationFrame(draw);
    };
    document.querySelectorAll("[data-listen]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.getAttribute("data-listen");
        const same = live && live.mode === mode;
        stop();
        if (!same) start(mode, btn);
      });
    });
    document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting) stop(); }), { threshold: 0 }).observe(listenWrap);
    }
  }

  /* ---------- print: nothing ships collapsed ---------- */
  addEventListener("beforeprint", () => {
    document.querySelectorAll("details:not([open])").forEach((d) => { d.setAttribute("data-print-opened", ""); d.setAttribute("open", ""); });
  });
  addEventListener("afterprint", () => {
    document.querySelectorAll("details[data-print-opened]").forEach((d) => { d.removeAttribute("open"); d.removeAttribute("data-print-opened"); });
  });
})();
