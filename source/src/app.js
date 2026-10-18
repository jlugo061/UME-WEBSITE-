(function () {
'use strict';
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var MONO = "IBM Plex Mono, ui-monospace, monospace";

function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function f(n) { return Math.round(n * 10) / 10; }

/* ---------------- copy helpers ---------------- */
function copyText(text, btn) {
  var done = function () { var t = btn.textContent; btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = t; }, 1600); };
  var fallback = function () {
    var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { btn.textContent = 'Select & copy'; }
    document.body.removeChild(ta);
  };
  try { navigator.clipboard.writeText(text).then(done, fallback); } catch (e) { fallback(); }
}
$$('.copy').forEach(function (b) { b.addEventListener('click', function () { copyText(b.getAttribute('data-copy'), b); }); });

/* ---------------- quote form ---------------- */
$('#quote').addEventListener('submit', function (e) {
  e.preventDefault();
  var form = e.target, status = $('#formStatus');
  var live = /universalmarinefl\.com$|netlify\.app$/.test(location.hostname);
  if (!live) { status.className = 'form-status'; status.textContent = 'This preview can’t send messages. On the live site this goes straight to UME. For now, call or text (786) 325-5690.'; return; }
  var body = new URLSearchParams(new FormData(form)).toString();
  status.className = 'form-status'; status.textContent = 'Sending…';
  fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body })
    .then(function (r) { if (!r.ok) throw 0; status.className = 'form-status ok'; status.textContent = 'Got it. We’ll call you back, usually the same day.'; form.reset(); })
    .catch(function () { status.className = 'form-status'; status.textContent = 'That didn’t go through. Call or text (786) 325-5690 and we’ll take it from there.'; });
});

/* ---------------- gallery ---------------- */
var IMGBASE = '{{IMGBASE}}';
var G = [
  ['hero-garmin-triple.jpg', 'Invincible · triple Garmin', 'Helm build', 'helm', 'w8'],
  ['invincible-triple-mercury.jpg', 'Invincible on the trailer', 'Pickup', 'boat', ''],
  ['blacked-01.jpg', 'Running the inlet', 'Blacked out', 'blacked', ''],
  ['{{IMG:blackpanel-intrepid}}', 'Intrepid · black panel, dual Garmin', 'Blacked out', 'blacked helm', 'w6'],
  ['{{IMG:blackpanel-cobia}}', 'Cobia · switches in the black', 'Blacked out', 'blacked helm', 'w6'],
  ['{{IMG:blackpanel-cut}}', 'Panel cut, wiring ready', 'In progress', 'blacked wiring', 'w6'],
  ['{{IMG:blackpanel-intrepid-angle}}', 'Intrepid · flush panel', 'Blacked out', 'blacked', 'w6'],
  ['blacked-02.jpg', 'Cobia · dual Garmin', 'Blacked out', 'blacked helm', ''],
  ['blacked-03.jpg', 'Intrepid · Fusion dash', 'Audio', 'blacked audio', ''],
  ['blacked-05.jpg', 'Dual plotters + Fusion', 'Blacked out', 'blacked', ''],
  ['blacked-04.jpg', 'Intrepid · clean pod', 'Blacked out', 'blacked helm', 'w6'],
  ['hero-intrepid-helm.jpg', 'Intrepid · full Garmin', 'Helm build', 'blacked helm', 'w6'],
  ['blacked-06.jpg', 'Garmin + FLIR build', 'Night vision', 'blacked', ''],
  ['blacked-07.jpg', 'Helm + radar overlay', 'Blacked out', 'blacked helm', ''],
  ['install-console-wiring.jpg', 'Clean rewire', 'Wiring', 'wiring', ''],
  ['jl-audio-hardtop.jpg', 'JL Audio · hardtop', 'Audio', 'audio', 'w6'],
  ['dashboard-fusion-garmin.jpg', 'Fusion + Garmin dash', 'Audio', 'audio helm', 'w6'],
  ['install-garmin-progress.jpg', 'Triple screen install', 'Install', 'wiring helm', 'w6'],
  ['finished-dual-garmin.jpg', 'Dual Garmin + Fusion', 'Finished', 'helm', 'w6'],
  ['radar-lightbar.jpg', 'Radar + light bar', 'Radar', 'helm', 'w6'],
  ['shop-garmin-radar.jpg', 'Our Davie shop', 'Shop', 'boat', 'w6']
];
$('#gallery').innerHTML = G.map(function (g) {
  return '<figure class="g ' + g[4] + '" data-cats="' + g[3] + '" tabindex="0" style="margin:0">' +
    '<img src="' + (/[/:]/.test(g[0]) ? g[0] : IMGBASE + g[0]) + '" alt="' + g[1] + '" loading="lazy">' +
    '<figcaption><span>' + g[2] + '</span><b>' + g[1] + '</b></figcaption></figure>';
}).join('');
$$('#gallery img').forEach(function (img) {
  var mark = function () { img.closest('.g').classList.add('noimg'); };
  if (img.complete && img.naturalWidth === 0) mark(); else img.addEventListener('error', mark);
});
$$('#gFilters .chip').forEach(function (b) {
  b.addEventListener('click', function () {
    var v = b.getAttribute('data-f');
    $$('#gFilters .chip').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
    $$('#gallery .g').forEach(function (g) { g.hidden = !(v === 'all' || g.getAttribute('data-cats').split(' ').indexOf(v) > -1); });
  });
});
var lb = $('#lightbox');
function openLb(fig) { if (fig.classList.contains('noimg')) return; var img = fig.querySelector('img'); lb.querySelector('img').src = img.src; lb.querySelector('img').alt = img.alt; lb.hidden = false; }
function closeLb() { lb.hidden = true; }
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLb(); });
$('#gallery').addEventListener('click', function (e) { var fig = e.target.closest('.g'); if (fig) openLb(fig); });
$$('.bp-photos figure, .bp-hero').forEach(function (fig) { fig.addEventListener('click', function () { openLb(fig); }); });
$('#gallery').addEventListener('keydown', function (e) { if (e.key === 'Enter') { var fig = e.target.closest('.g'); if (fig) openLb(fig); } });
lb.addEventListener('click', closeLb);

/* ---------------- service-area chart ---------------- */
(function () {
  var K = 240, LON0 = -82.1, LAT0 = 27.3;
  function X(lon) { return (lon - LON0) * K * 0.9; }
  function Y(lat) { return (LAT0 - lat) * K; }
  function pts(a) { return a.map(function (p) { return f(X(p[1])) + ',' + f(Y(p[0])); }).join(' '); }
  var main = [[27.35, -82.5], [27.35, -80.21], [27.2, -80.17], [26.95, -80.07], [26.7, -80.03], [26.45, -80.06], [26.25, -80.08], [26.1, -80.1], [25.95, -80.12], [25.77, -80.13], [25.73, -80.21], [25.6, -80.3], [25.45, -80.33], [25.3, -80.4], [25.2, -80.52], [25.15, -80.75], [25.13, -80.95], [25.17, -81.12], [25.35, -81.15], [25.55, -81.25], [25.85, -81.68], [26.1, -81.8], [26.45, -81.95], [26.7, -82.1], [27.0, -82.25], [27.35, -82.5]];
  var keys = [[25.29, -80.3], [25.1, -80.44], [24.95, -80.6], [24.85, -80.8], [24.73, -81.02], [24.66, -81.25], [24.62, -81.45], [24.56, -81.78]];
  var shoal = [[25.16, -80.7], [25.27, -80.38], [25.1, -80.44], [24.85, -80.8], [24.7, -81.12], [24.9, -81.2], [25.16, -81.1]];
  var c1 = [[27.35, -79.99], [26.7, -79.97], [26.2, -80.03], [25.8, -80.06], [25.4, -80.12], [25.05, -80.3], [24.8, -80.6], [24.55, -81.05], [24.45, -81.8]];
  var c2 = c1.map(function (p) { return [p[0] - 0.08, p[1] + 0.13]; });
  var route = [[27.18, -80.08], [26.7, -79.95], [26.1, -80.03], [25.75, -80.06], [25.3, -80.2], [25.0, -80.42], [24.75, -80.85], [24.6, -81.3], [24.52, -81.78]];
  var o = '';
  for (var la = 24.5; la <= 27; la += 0.5) o += '<line class="grid" x1="0" x2="540" y1="' + f(Y(la)) + '" y2="' + f(Y(la)) + '"/><text class="label" x="6" y="' + f(Y(la) - 4) + '">' + Math.floor(la) + '°' + (la % 1 ? '30′' : '00′') + 'N</text>';
  for (var lo = -81.5; lo <= -80; lo += 0.5) o += '<line class="grid" y1="0" y2="710" x1="' + f(X(lo)) + '" x2="' + f(X(lo)) + '"/><text class="label" x="' + f(X(lo) + 4) + '" y="702">' + Math.abs(Math.ceil(lo)) + '°' + (lo % 1 ? '30′' : '00′') + 'W</text>';
  o += '<polygon class="shoal" points="' + pts(shoal) + '"/>';
  o += '<polyline class="contour" points="' + pts(c1) + '"/><polyline class="contour" points="' + pts(c2) + '"/>';
  o += '<polygon class="land" points="' + pts(main) + '"/>';
  o += '<polyline points="' + pts(keys) + '" fill="none" style="stroke:var(--land)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>';
  o += '<ellipse class="lake" cx="' + f(X(-80.83)) + '" cy="' + f(Y(26.95)) + '" rx="' + f(0.24 * K * 0.9) + '" ry="' + f(0.2 * K) + '"/>';
  o += '<text class="label" x="' + f(X(-80.83)) + '" y="' + f(Y(26.95) + 3) + '" text-anchor="middle">L. OKEECHOBEE</text>';
  o += '<text class="label" transform="translate(' + f(X(-79.8)) + ',' + f(Y(26.4)) + ') rotate(-84)" text-anchor="middle">GULF STREAM</text>';
  o += '<text class="label" x="' + f(X(-81.1)) + '" y="' + f(Y(25.0)) + '" text-anchor="middle">FLORIDA BAY</text>';
  o += '<polyline class="route" points="' + pts(route) + '"/>';
  var towns = [
    ['Stuart', 27.2, -80.25, 'w'], ['Jupiter', 26.93, -80.09, 'w'], ['West Palm', 26.71, -80.05, 'w'],
    ['Fort Lauderdale', 26.12, -80.14, 'n'], ['Miami', 25.77, -80.19, 'w'],
    ['Key Largo', 25.09, -80.44, 'e'], ['Islamorada', 24.92, -80.63, 's'], ['Marathon', 24.71, -81.09, 's'], ['Key West', 24.56, -81.78, 'n2']
  ];
  towns.forEach(function (t) {
    var x = X(t[2]), y = Y(t[1]), tx = x - 9, ty = y + 4, an = 'end';
    if (t[3] === 'e') { tx = x + 9; an = 'start'; }
    if (t[3] === 's') { tx = x; ty = y + 18; an = 'middle'; }
    if (t[3] === 'n') { ty = y - 4; }
    if (t[3] === 'n2') { tx = x; ty = y - 10; an = 'middle'; }
    o += '<circle class="pin" cx="' + f(x) + '" cy="' + f(y) + '" r="5"/><text class="town" x="' + f(tx) + '" y="' + f(ty) + '" text-anchor="' + an + '">' + t[0] + '</text>';
  });
  var dx = X(-80.23), dy = Y(26.06);
  o += '<path class="shop" d="M' + f(dx) + ',' + f(dy - 10) + ' l9,10 l-9,10 l-9,-10z"/><text class="town" x="' + f(dx - 14) + '" y="' + f(dy + 16) + '" text-anchor="end" style="fill:var(--brand)">Davie shop</text>';
  // compass rose + scale
  var rx = 470, ry = 600;
  o += '<circle cx="' + rx + '" cy="' + ry + '" r="30" fill="none" style="stroke:var(--line-strong)"/><circle cx="' + rx + '" cy="' + ry + '" r="22" fill="none" style="stroke:var(--line)"/>';
  o += '<path d="M' + rx + ',' + (ry - 30) + ' l6,30 l-6,30 l-6,-30z" style="fill:var(--route)"/><text class="label" x="' + rx + '" y="' + (ry - 36) + '" text-anchor="middle">N</text>';
  var nm = K / 60 * 20;
  o += '<path d="M360,672 h' + f(nm) + ' M360,667 v10 M' + f(360 + nm) + ',667 v10" style="stroke:var(--fg-dim)"/><text class="label" x="' + f(360 + nm / 2) + '" y="664" text-anchor="middle">20 NM</text>';
  $('#chart').innerHTML = '<svg viewBox="0 0 540 710" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Chart of South Florida from Stuart to Key West, showing the Davie shop and mobile service area">' + o + '</svg>';
})();


/* ---------------- hero: 3D chart sea ---------------- */
(function () {
  var cv = $('#sea3d'); if (!cv || !cv.getContext) return;
  var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = 1, t0 = performance.now(), running = false, visible = true, raf = 0;
  var still = matchMedia('(prefers-reduced-motion: reduce)');
  var mx = 0, my = 0, cx = 0, cy = 0;          // pointer target / eased camera offset
  var COLS = 64, ROWS = 34, X0 = -70, X1 = 70, Z0 = 6, Z1 = 120;
  var col = {};
  function readColors() {
    var cs = getComputedStyle(document.documentElement);
    col.line = cs.getPropertyValue('--sounding').trim() || '#8fd0ef';
    col.route = cs.getPropertyValue('--route').trim() || '#e3529f';
    col.light = cs.getPropertyValue('color-scheme').trim() === 'light';
  }
  function size() {
    var r = cv.getBoundingClientRect(); dpr = Math.min(1.6, window.devicePixelRatio || 1);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function wave(x, z, t) {
    return 1.6 * Math.sin(x * 0.11 + t * 0.7) + 0.9 * Math.sin(z * 0.16 - t * 1.05) + 0.6 * Math.sin((x + z) * 0.06 + t * 0.45) + 0.35 * Math.sin(x * 0.31 - z * 0.12 + t * 1.6);
  }
  function proj(x, y, z) {
    var f = W * 0.6, camY = 12.5 + cy * 1.6, horizon = H * 0.2 + cy * 10;
    var xx = x - cx * 6;
    return [W * 0.56 + xx * f / z, horizon + (camY - y) * f / z];
  }
  function frame(now) {
    var t = (now - t0) / 1000;
    cx += (mx - cx) * 0.04; cy += (my - cy) * 0.04;
    ctx.clearRect(0, 0, W, H);
    var i, j, x, z, p, a, narrow = W < 700, base = (col.light ? 0.42 : 0.6) * (narrow ? 0.55 : 1);
    ctx.lineWidth = 1;
    // rows (constant depth), far to near
    for (j = ROWS - 1; j >= 0; j--) {
      z = Z0 + (Z1 - Z0) * Math.pow(j / (ROWS - 1), 1.6);
      a = base * Math.pow(1 - z / Z1, 1.3) + 0.03;
      ctx.strokeStyle = col.line; ctx.globalAlpha = a; ctx.beginPath();
      for (i = 0; i <= COLS; i++) { x = X0 + (X1 - X0) * i / COLS; p = proj(x, wave(x, z, t), z); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
      ctx.stroke();
    }
    // columns, fainter
    for (i = 0; i <= COLS; i += 2) {
      x = X0 + (X1 - X0) * i / COLS; ctx.globalAlpha = base * 0.32; ctx.beginPath();
      for (j = 0; j < ROWS; j++) { z = Z0 + (Z1 - Z0) * Math.pow(j / (ROWS - 1), 1.6); p = proj(x, wave(x, z, t), z); j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
      ctx.stroke();
    }
    if (narrow) { ctx.globalAlpha = 1; if (running) raf = requestAnimationFrame(frame); return; }
    // the route: a dashed magenta course line riding the swell toward the horizon, with waypoints
    ctx.globalAlpha = col.light ? 0.75 : 0.9; ctx.strokeStyle = col.route; ctx.lineWidth = 2;
    ctx.setLineDash([8, 7]); ctx.lineDashOffset = -t * 22; ctx.beginPath();
    var wps = [];
    for (j = 0; j <= 60; j++) {
      z = 8 + j * 1.8; x = -3.2 + 3 * Math.sin(z * 0.05 + 0.4) + z * 0.05;
      p = proj(x, wave(x, z, t) + 0.25, z); j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
      if (j % 15 === 7) wps.push([p, z]);
    }
    ctx.stroke(); ctx.setLineDash([]);
    wps.forEach(function (w) {
      var r = Math.max(2.5, 70 / w[1]);
      ctx.globalAlpha = col.light ? 0.85 : 1; ctx.beginPath();
      ctx.moveTo(w[0][0], w[0][1] - r); ctx.lineTo(w[0][0] + r, w[0][1]); ctx.lineTo(w[0][0], w[0][1] + r); ctx.lineTo(w[0][0] - r, w[0][1]); ctx.closePath(); ctx.stroke();
    });
    // sonar ping: rings spreading across the surface
    var px = 9, pz = 16;
    for (var k = 0; k < 3; k++) {
      var ph = ((t * 0.32) + k / 3) % 1, rr = 2 + ph * 26, seg = 48;
      ctx.globalAlpha = (1 - ph) * (col.light ? 0.5 : 0.7); ctx.strokeStyle = col.line; ctx.lineWidth = 1.4; ctx.beginPath();
      for (i = 0; i <= seg; i++) {
        var ang = i / seg * Math.PI * 2, rx = px + Math.cos(ang) * rr, rz = pz + Math.sin(ang) * rr * 0.9;
        if (rz < Z0 + 1) rz = Z0 + 1;
        p = proj(rx, wave(rx, rz, t) + 0.15, rz); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
      }
      ctx.stroke();
    }
    p = proj(px, wave(px, pz, t) + 0.15, pz);
    ctx.globalAlpha = 1; ctx.fillStyle = col.line; ctx.beginPath(); ctx.arc(p[0], p[1], 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    if (running) raf = requestAnimationFrame(frame);
  }
  function start() { if (running || still.matches || !visible || document.hidden) return; running = true; raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }
  readColors(); size(); frame(performance.now());
  start();
  addEventListener('resize', function () { size(); if (!running) frame(performance.now()); });
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', function () { readColors(); if (!running) frame(performance.now()); });
  still.addEventListener('change', function () { still.matches ? stop() : start(); });
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; visible ? start() : stop(); }).observe(cv);
  $('.hero').addEventListener('pointermove', function (e) {
    var r = cv.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width * 2 - 1; my = (e.clientY - r.top) / r.height * 2 - 1;
  });
})();

/* ---------------- hero: counting stats ---------------- */
(function () {
  var els = $$('[data-count]'); if (!els.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  els.forEach(function (el) {
    var end = +el.getAttribute('data-count'), suf = el.getAttribute('data-suffix') || '', t0 = null;
    el.textContent = '0' + suf;
    setTimeout(function () {
      requestAnimationFrame(function step(now) {
        if (!t0) t0 = now; var k = Math.min(1, (now - t0) / 1400), v = Math.round(end * (1 - Math.pow(1 - k, 3)));
        el.textContent = v.toLocaleString() + suf; if (k < 1) requestAnimationFrame(step);
      });
    }, 1300);
  });
})();

/* ---------------- nav ---------------- */
var menuBtn = $('#menuBtn'), links = $('#navLinks');
menuBtn.addEventListener('click', function () { var o = links.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', o); });
links.addEventListener('click', function (e) { if (e.target.tagName === 'A') { links.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); } });
$('#yr').textContent = new Date().getFullYear();

})();
