/* Energy Plus · pinned bill chapter (marriage preview)
   Drives the #money pinned sequence: builds the energy field, scrubs the five
   beats and the bill states on scroll. Progressive enhancement, scoped to
   #money; if it doesn't run, the CSS reduced-motion fallback shows the payoff
   still. Nothing here affects the rest of the page. */
(function () {
  "use strict";
  var stage = document.getElementById("ms-stage");
  if (!stage) return;
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* energy field (clean, verdigris) */
  var field = document.querySelector("#money .ms-field");
  if (field) {
    var TAU = Math.PI * 2, X0 = -220, X1 = 1620, STEP = 10;
    function wave(y, a, wl, ph) {
      var d = "M" + X0 + " " + (y + a * Math.sin((X0 / wl) * TAU + ph)).toFixed(1) + " ";
      for (var x = X0 + STEP; x <= X1; x += STEP) d += "L" + x + " " + (y + a * Math.sin((x / wl) * TAU + ph)).toFixed(1) + " ";
      return d.trim();
    }
    var spec = [[150, 34, 320, 0, "verd", 26], [250, 26, 240, 1.2, "verd", 34], [335, 40, 380, 2.4, "verd", 41], [415, 22, 210, 0.6, "heat", 30]];
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 1200 500");
    svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
    svg.setAttribute("aria-hidden", "true");
    spec.forEach(function (w, i) {
      var p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", wave(w[0], w[1], w[2], w[3]));
      p.setAttribute("class", "w " + w[4]);
      if (!reduced) { p.style.animation = "drift-" + (i % 2 ? "b" : "a") + " " + w[5] + "s linear infinite"; }
      svg.appendChild(p);
    });
    field.appendChild(svg);
  }

  var beats = [].slice.call(document.querySelectorAll("#money .ms-beat"));
  var bill = document.getElementById("ms-bill");
  var L = {};
  document.querySelectorAll("#money .msb-line").forEach(function (l) { L[l.getAttribute("data-line")] = l; });
  var total = document.getElementById("msb-total");
  var upct = document.getElementById("msb-upct");
  var unote = document.getElementById("msb-unote");
  var usaved = document.getElementById("msb-usaved");

  var WIN = [[0, 0.15], [0.15, 0.36], [0.36, 0.54], [0.54, 0.76], [0.76, 1.01]];
  function ab(p) { for (var i = WIN.length - 1; i >= 0; i--) { if (p >= WIN[i][0]) return i; } return 0; }
  function render(p) {
    var b = ab(p);
    beats.forEach(function (el, i) { el.classList.toggle("on", i === b); });
    bill.classList.toggle("lit", b >= 1);
    L.demand.classList.toggle("flag", b === 2);
    var cut = b >= 3;
    L.energy.classList.toggle("cutx", cut);
    L.demand.classList.toggle("cutx", cut);
    if (cut) L.demand.classList.remove("flag");
    bill.classList.toggle("after", cut);
    total.textContent = cut ? "$15,300" : "$18,000";
    upct.innerHTML = cut ? "<b>HVAC 35%</b>" : "<b>HVAC 50%</b>";
    usaved.textContent = cut ? "−$2,700" : "";
    unote.textContent = cut ? "−15% off the whole bill, carved out of HVAC." : "Heating and cooling is about half the load.";
  }

  if (reduced) {
    beats.forEach(function (el) { el.classList.add("on"); });
    L.energy.classList.add("cutx"); L.demand.classList.add("cutx");
    bill.classList.add("lit", "after");
    total.textContent = "$15,300"; upct.innerHTML = "<b>HVAC 35%</b>";
    usaved.textContent = "−$2,700"; unote.textContent = "−15% off the whole bill, carved out of HVAC.";
    return;
  }

  var tick = false;
  function prog() { var r = stage.getBoundingClientRect(); var t = r.height - window.innerHeight; return t > 0 ? Math.max(0, Math.min(1, (-r.top) / t)) : 0; }
  function onScroll() { if (tick) return; tick = true; requestAnimationFrame(function () { render(prog()); tick = false; }); }
  render(0);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
})();
