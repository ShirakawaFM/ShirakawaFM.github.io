/* ==========================================================================
   ShirakawaFM — motion.js
   Shared, dependency-free motion layer. Loaded on every page AFTER the
   page's own script. Purely additive: it injects SVG stages/ornaments and
   observes scroll; it never removes or replaces existing behaviour.
   ========================================================================== */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var page = root.getAttribute("data-page") || (doc.querySelector(".hero") ? "home" : "sub");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(tag, cls, html) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function svg(tag, attrs) {
    var n = doc.createElementNS("http://www.w3.org/2000/svg", tag);
    if (attrs) for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    return n;
  }

  /* ---------------------------------------------------------------- ribbon */
  var RIBBON_WORDS = [
    "Browser extensions", "Video tools", "Minecraft mods", "Minimal permissions",
    "No trackers", "Hand-written", "No framework", "UTC+8"
  ];

  function buildRibbonGroup() {
    var g = el("div", "sfx-ribbon__group");
    RIBBON_WORDS.forEach(function (w) {
      var s = el("span", null, w);
      g.appendChild(s);
      var st = svg("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false" });
      var p = svg("path", { d: "M12 1.4c1.1 6.6 3.9 9.4 10.5 10.6-6.6 1.2-9.4 4-10.5 10.6-1.1-6.6-3.9-9.4-10.5-10.6C8.1 10.8 10.9 8 12 1.4Z" });
      st.appendChild(p);
      g.appendChild(st);
    });
    return g;
  }

  function injectRibbon(after) {
    if (!after || !after.parentNode) return;
    var box = el("div", "sfx-ribbon sfx-reveal");
    box.setAttribute("aria-hidden", "true");
    var track = el("div", "sfx-ribbon__track");
    track.appendChild(buildRibbonGroup());
    track.appendChild(buildRibbonGroup());
    box.appendChild(track);
    after.parentNode.insertBefore(box, after.nextSibling);
    observeReveal(box);
  }

  /* -------------------------------------------------------------- divider */
  function buildDivider(flip) {
    var s = svg("svg", {
      class: "sfx-divider",
      viewBox: "0 0 1200 80",
      preserveAspectRatio: "none",
      "aria-hidden": "true",
      focusable: "false"
    });
    // baseline zig / wave
    var base = svg("path", { d: "M0 46 Q 60 18 120 46 T 240 46 T 360 46 T 480 46 T 600 46 T 720 46 T 840 46 T 960 46 T 1080 46 T 1200 46" });
    s.appendChild(base);
    // tick marks
    for (var x = 40; x < 1200; x += 80) {
      s.appendChild(svg("line", { x1: x, y1: 58, x2: x, y2: 66, stroke: "currentColor", "stroke-width": 1, opacity: 0.4 }));
    }
    // drawn accent
    var draw = svg("path", {
      class: "sfx-divider__draw",
      pathLength: "1",
      d: flip
        ? "M0 40 C 150 4 300 76 450 40 S 750 4 900 40 S 1120 70 1200 34"
        : "M0 40 C 150 76 300 4 450 40 S 750 76 900 40 S 1120 6 1200 44"
    });
    s.appendChild(draw);
    return s;
  }

  /* ---------------------------------------------------------- band ornament */
  function buildBandOrnament() {
    var s = svg("svg", { class: "sfx-band-orn", viewBox: "0 0 200 200", "aria-hidden": "true", focusable: "false" });
    s.appendChild(svg("circle", { class: "sfx-orn-ring", cx: 100, cy: 100, r: 92 }));
    s.appendChild(svg("circle", { cx: 100, cy: 100, r: 64 }));
    s.appendChild(svg("circle", { cx: 100, cy: 100, r: 36, "stroke-dasharray": "2 5" }));
    s.appendChild(svg("line", { x1: 8, y1: 100, x2: 46, y2: 100 }));
    s.appendChild(svg("line", { x1: 154, y1: 100, x2: 192, y2: 100 }));
    s.appendChild(svg("line", { x1: 100, y1: 8, x2: 100, y2: 46 }));
    s.appendChild(svg("line", { x1: 100, y1: 154, x2: 100, y2: 192 }));
    var star = svg("path", {
      class: "sfx-orn-star",
      d: "M100 70c2.6 15.4 9.1 21.9 24.5 24.5-15.4 2.6-21.9 9.1-24.5 24.5-2.6-15.4-9.1-21.9-24.5-24.5C90.9 91.9 97.4 85.4 100 70Z"
    });
    s.appendChild(star);
    return s;
  }

  /* ------------------------------------------------------------- underline */
  function buildUnderline() {
    var s = svg("svg", {
      class: "sfx-underline",
      viewBox: "0 0 600 26",
      preserveAspectRatio: "none",
      "aria-hidden": "true",
      focusable: "false"
    });
    var p = svg("path", {
      pathLength: "1",
      d: "M4 16 C 90 6 170 24 262 14 S 430 4 596 15"
    });
    s.appendChild(p);
    return s;
  }

  /* --------------------------------------------------------- hero ornament */
  function buildHeroOrnament() {
    var s = svg("svg", { class: "sfx-hero-orn", viewBox: "0 0 1600 900", preserveAspectRatio: "xMidYMid slice", "aria-hidden": "true", focusable: "false" });
    var g = svg("g", { transform: "translate(1240 250)" });
    g.appendChild(svg("circle", { cx: 0, cy: 0, r: 190, fill: "none", stroke: "rgba(18,0,1,0.22)", "stroke-dasharray": "2 9" }));
    g.appendChild(svg("circle", { cx: 0, cy: 0, r: 128, fill: "none", stroke: "rgba(18,0,1,0.16)", "stroke-dasharray": "1 7" }));
    g.appendChild(svg("circle", { cx: 0, cy: 0, r: 66, fill: "none", stroke: "rgba(18,0,1,0.3)" }));
    var st = svg("path", { d: "M0 -34c2.4 14.6 8.6 20.8 23.2 23.2C8.6 -8.4 2.4 -2.2 0 12.4-2.4-2.2-8.6-8.4-23.2-10.8-8.6-13.2-2.4-19.4 0-34Z", fill: "#120001", opacity: 0.85 });
    g.appendChild(st);
    s.appendChild(g);
    // scattered twinkles
    var pts = [[160, 150], [340, 640], [520, 210], [980, 720], [1440, 120], [1520, 640], [760, 120]];
    pts.forEach(function (p, i) {
      var c = svg("circle", { cx: p[0], cy: p[1], r: 2.4, fill: "#120001", opacity: 0.5 });
      c.style.animation = "sfx-twinkle " + (5 + i) + "s ease-in-out " + (i * 0.6) + "s infinite";
      c.style.transformBox = "fill-box";
      c.style.transformOrigin = "center";
      s.appendChild(c);
    });
    return s;
  }

  /* -------------------------------------------------------------- bg stage */
  function injectBg() {
    if (doc.querySelector(".sfx-bg")) return;
    var box = el("div", "sfx-bg");
    box.setAttribute("aria-hidden", "true");
    var s = svg("svg", { viewBox: "0 0 1600 1000", preserveAspectRatio: "xMidYMid slice", focusable: "false" });

    var rings = svg("g", { class: "sfx-rings" });
    [[820, 360, 260], [820, 360, 380], [820, 360, 520]].forEach(function (r) {
      rings.appendChild(svg("circle", { cx: r[0], cy: r[1], r: r[2] }));
    });
    s.appendChild(rings);

    // sparse constellation
    var pts = [];
    for (var i = 0; i < 26; i++) {
      var x = (i * 613) % 1560 + 20;
      var y = (i * 977) % 960 + 20;
      pts.push([x, y]);
    }
    pts.forEach(function (p, i) {
      if (i > 0 && i % 2 === 0) {
        s.appendChild(svg("line", { class: "sfx-line", x1: pts[i - 1][0], y1: pts[i - 1][1], x2: p[0], y2: p[1] }));
      }
    });
    pts.forEach(function (p, i) {
      var c = svg("circle", { class: "sfx-star", cx: p[0], cy: p[1], r: i % 5 === 0 ? 2.6 : 1.7 });
      c.style.setProperty("--tw", (4 + (i % 6)) + "s");
      c.style.setProperty("--td", (i * 0.35) + "s");
      s.appendChild(c);
    });
    box.appendChild(s);

    var scan = el("div", "sfx-scan");
    var grain = el("div", "sfx-grain");
    box.appendChild(scan);
    box.appendChild(grain);
    doc.body.insertBefore(box, doc.body.firstChild);
  }

  /* ------------------------------------------------------------- reveals */
  var revealObserver = null;
  function observeReveal(node) {
    if (reduce) { node.classList.add("is-in"); return; }
    if (!("IntersectionObserver" in window)) { node.classList.add("is-in"); return; }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("is-in");
            if (en.target.classList.contains("sfx-divider")) en.target.classList.add("is-drawn");
            if (en.target.classList.contains("sfx-underline")) en.target.classList.add("is-drawn");
            revealObserver.unobserve(en.target);
          }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    }
    revealObserver.observe(node);
  }

  /* ---------------------------------------------------------------- tilt */
  function bindTilt(node, max) {
    if (reduce || !window.matchMedia("(hover: hover)").matches) return;
    var raf = null, tx = 0, ty = 0;
    node.classList.add("sfx-tilt");
    node.addEventListener("pointermove", function (e) {
      var r = node.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      tx = (-py * max).toFixed(2) + "deg";
      ty = (px * max).toFixed(2) + "deg";
      if (!raf) raf = requestAnimationFrame(function () {
        node.style.transform = "perspective(900px) rotateX(" + tx + ") rotateY(" + ty + ")";
        raf = null;
      });
    });
    node.addEventListener("pointerleave", function () {
      node.style.transform = "";
    });
  }

  /* ------------------------------------------------------------- progress */
  function mountProgress() {
    if (doc.querySelector(".sfx-progress")) return;
    var bar = el("div", "sfx-progress");
    doc.body.appendChild(bar);
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var h = doc.documentElement.scrollHeight - window.innerHeight;
        var p = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
        bar.style.transform = "scaleX(" + p + ")";
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();
  }

  /* --------------------------------------------------------- section draw */
  function drawDividers() {
    doc.querySelectorAll(".sfx-divider").forEach(function (s) { observeReveal(s); });
    doc.querySelectorAll(".sfx-underline").forEach(function (s) { observeReveal(s); });
  }

  /* --------------------------------------------------------- corner frames */
  function cornerSvg(cls) {
    var s = svg("svg", { class: "sfx-corner " + cls, width: 18, height: 18, viewBox: "0 0 18 18", "aria-hidden": "true", focusable: "false" });
    s.appendChild(svg("path", { d: "M1 17 L1 1 L17 1", pathLength: "1" }));
    return s;
  }

  function decorateFrame(node) {
    if (!node || node.dataset.sfxFramed) return;
    node.dataset.sfxFramed = "1";
    node.classList.add("sfx-frame");
    var box = el("div", "sfx-corners");
    box.setAttribute("aria-hidden", "true");
    ["tl", "tr", "bl", "br"].forEach(function (c) { box.appendChild(cornerSvg("sfx-corner--" + c)); });
    node.appendChild(box);
    observeReveal(node);
  }

  /* ----------------------------------------------------------------- init */
  function init() {
    if (page === "sub") root.removeAttribute("data-theme");
    if (page !== "home") {
      injectBg();
      var band = doc.querySelector(".page-head") || doc.querySelector(".article-hero");
      if (band && !band.querySelector(".sfx-band-orn")) band.appendChild(buildBandOrnament());
      injectRibbon(band);

      // underline under the big title
      var title = doc.querySelector(".page-title") || doc.querySelector(".article-title");
      if (title) {
        var u = buildUnderline();
        var host = title.closest(".shell") || title.parentNode;
        host.appendChild(u);
      }

      // corner-bracket frames on cards
      doc.querySelectorAll(".about-body > section, .about-id, .prose, .toc").forEach(decorateFrame);

      // cards tilt
      doc.querySelectorAll(".about-body > section, .about-id").forEach(function (n) { bindTilt(n, 2.2); });

      // divider before footer
      var footer = doc.querySelector(".site-footer");
      if (footer && footer.parentNode) {
        var d = buildDivider(true);
        footer.parentNode.insertBefore(d, footer);
      }
    } else {
      // homepage: hero ornament + ribbon + section dividers
      var hero = doc.querySelector(".hero");
      if (hero && !hero.querySelector(".sfx-hero-orn")) {
        var orn = buildHeroOrnament();
        hero.insertBefore(orn, hero.firstChild);
      }
      if (hero) injectRibbon(hero);

      var ticker = doc.querySelector(".ticker");
      if (ticker && ticker.parentNode && !(ticker.previousElementSibling && ticker.previousElementSibling.classList.contains("sfx-divider"))) {
        ticker.parentNode.insertBefore(buildDivider(false), ticker);
      }
      var contact = doc.querySelector(".contact");
      if (contact && contact.parentNode && !(contact.previousElementSibling && contact.previousElementSibling.classList.contains("sfx-divider"))) {
        contact.parentNode.insertBefore(buildDivider(true), contact);
      }

      // letter card corners
      doc.querySelectorAll(".letter__card").forEach(decorateFrame);

      // project cards: sweep + tilt
      doc.querySelectorAll(".project__link").forEach(function (n) {
        if (!n.querySelector(".sfx-sweep")) n.appendChild(el("span", "sfx-sweep"));
        bindTilt(n, 1.6);
      });
    }

    drawDividers();
    mountProgress();

    // observe existing reveal nodes too (harmless if another script also does)
    doc.querySelectorAll("[data-reveal]").forEach(function (n) { observeReveal(n); });
  }

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
