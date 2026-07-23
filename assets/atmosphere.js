/* Energy Plus · atmosphere layer (preview)
   Injects the slow energy field (and a soft top light) behind the marked
   sections. Progressive enhancement: if it does not run, the grounds and the
   .cinema text treatment still stand on their own. */
(function () {
  "use strict";
  var TAU = Math.PI * 2;
  var X0 = -220, X1 = 1620, STEP = 10;

  function wavePath(yMid, amp, wl, phase) {
    var y0 = yMid + amp * Math.sin((X0 / wl) * TAU + phase);
    var d = "M" + X0 + " " + y0.toFixed(1) + " ";
    for (var x = X0 + STEP; x <= X1; x += STEP) {
      var y = yMid + amp * Math.sin((x / wl) * TAU + phase);
      d += "L" + x + " " + y.toFixed(1) + " ";
    }
    return d.trim();
  }

  // [yMid, amp, wavelength, phase, tint, drift(a|b), durationSeconds]
  var CLEAN = [
    [150, 34, 320, 0.0, "verd", "a", 26],
    [250, 26, 240, 1.2, "verd", "b", 34],
    [335, 40, 380, 2.4, "verd", "a", 41],
    [415, 22, 210, 0.6, "verd", "b", 30]
  ];
  var WASTE = [
    [140, 30, 260, 0.0, "cool", "a", 19],
    [230, 40, 320, 1.1, "cool", "b", 27],
    [300, 24, 200, 2.2, "heat", "a", 23],
    [382, 34, 300, 0.6, "heat", "b", 31],
    [446, 20, 180, 3.0, "cool", "a", 34]
  ];

  function buildField(section, spec) {
    // soft top light
    var glow = document.createElement("div");
    glow.className = "atmo-glow";
    section.insertBefore(glow, section.firstChild);

    // the drifting field
    var host = document.createElement("div");
    host.className = "energy-field";
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 1200 500");
    svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
    svg.setAttribute("aria-hidden", "true");
    spec.forEach(function (w) {
      var p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", wavePath(w[0], w[1], w[2], w[3]));
      p.setAttribute("class", "w " + w[4] + " ef-drift-" + w[5]);
      p.style.animationDuration = w[6] + "s";
      svg.appendChild(p);
    });
    host.appendChild(svg);
    section.insertBefore(host, section.firstChild);
  }

  document.querySelectorAll(".atmo-field-waste").forEach(function (s) { buildField(s, WASTE); });
  document.querySelectorAll(".atmo-field-clean").forEach(function (s) { buildField(s, CLEAN); });
})();
