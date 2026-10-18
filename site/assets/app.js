(function () {
'use strict';
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
function f(n) { return Math.round(n * 10) / 10; }
var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
var phone = matchMedia('(max-width: 760px)');
var smooth = still ? 'auto' : 'smooth';
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

/* ---------------- data ---------------- */
var GD = JSON.parse($('#gdata').textContent);
var DATA = GD.items, PREVIEW = !!GD.preview;
var CATS = { helm: 'Helms & displays', blackout: 'Black panels', fab: 'Fabrication', wiring: 'Wiring', radar: 'Radar, cameras & comms', av: 'Audio & TV', boats: 'Boats', shop: 'In the shop' };
var ALT = { helm: 'Finished boat helm with flush-mounted displays', blackout: 'Black Starboard helm panel', fab: 'Helm panel fabrication in progress', wiring: 'Clean, labeled console wiring', radar: 'Radar, camera or antenna install on a hardtop', av: 'Onboard TV or audio install', boats: 'Customer boat', shop: 'UME crew at work' };
function P(d, size) { if (PREVIEW) size = 't'; return 'images/g/' + (size ? size + '/' : '') + d.i + '.webp'; }
function capOf(d) { return d.cap || CATS[d.c] || ''; }
$$('[data-total]').forEach(function (el) { el.textContent = DATA.length; });

/* ---------------- one scroll loop for every scroll-driven effect ---------------- */
var scrubbers = [], ticking = false;
function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; scrubbers.forEach(function (fn) { fn(); }); }); } }
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll);
function progress(el) { var r = el.getBoundingClientRect(), span = r.height - innerHeight; return span > 0 ? clamp(-r.top / span, 0, 1) : (r.top < 0 ? 1 : 0); }

/* ---------------- hero: slideshow (desktop) or helm video (phones) ---------------- */
(function () {
  var media = $('#heroMedia'), slides = $$('.slide', media), dots = $('#heroDots'), cap = $('#heroCap'), i = 0, timer = null;
  if (phone.matches && !still) {
    var v = document.createElement('video');
    v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
    v.poster = 'images/hero-phone.webp'; v.preload = 'auto';
    v.innerHTML = '<source src="media/hero-phone.mp4" type="video/mp4">';
    media.appendChild(v); slides.forEach(function (s) { s.style.display = 'none'; });
    var p = v.play(); if (p && p.catch) p.catch(function () {});
    cap.textContent = 'Our work · Glass helm walkaround';
    return;
  }
  if (phone.matches) { slides[0].querySelector('img').src = 'images/hero-phone.webp'; }
  function load(s) { var im = s.querySelector('img'); if (im.dataset.src) { im.src = im.dataset.src; im.removeAttribute('data-src'); } }
  dots.innerHTML = slides.map(function (s, k) { return '<button type="button" aria-label="Show photo ' + (k + 1) + '"' + (k ? '' : ' aria-current="true"') + '></button>'; }).join('');
  function go(k) {
    slides[i].classList.remove('on'); i = (k + slides.length) % slides.length;
    load(slides[i]); load(slides[(i + 1) % slides.length]);
    var im = slides[i].querySelector('img'); im.style.animation = 'none'; void im.offsetWidth; im.style.animation = '';
    slides[i].classList.add('on'); cap.textContent = 'Our work · ' + slides[i].dataset.cap;
    $$('button', dots).forEach(function (b, j) { b.setAttribute('aria-current', j === i); });
  }
  function play() { if (still) return; clearInterval(timer); timer = setInterval(function () { go(i + 1); }, 6500); }
  dots.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { go($$('button', dots).indexOf(b)); play(); } });
  document.addEventListener('visibilitychange', function () { document.hidden ? clearInterval(timer) : play(); });
  setTimeout(function () { load(slides[1]); }, 1500);
  play();
})();

/* ---------------- statement: words light up as you scroll ---------------- */
(function () {
  var el = $('#bigWords'); var HL = { thousand: 1, labeled: 1, flush: 1, family: 1 };
  el.innerHTML = el.textContent.split(' ').map(function (w) { return '<span class="w' + (HL[w.replace(/[^a-z]/gi, '').toLowerCase()] ? ' hl' : '') + '">' + w + '</span>'; }).join(' ');
  var ws = $$('.w', el);
  if (still) { ws.forEach(function (w) { w.classList.add('lit'); }); return; }
  scrubbers.push(function () {
    var r = el.getBoundingClientRect(), p = clamp((innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35), 0, 1), n = Math.round(p * ws.length);
    ws.forEach(function (w, k) { w.classList.toggle('lit', k < n); });
  });
})();

/* ---------------- before/after: the wipe follows the scroll ---------------- */
(function () {
  var sec = $('#before-after'), stage = $('#wipe');
  if (still) { document.documentElement.classList.add('no-scrub'); stage.style.setProperty('--p', '50%'); return; }
  scrubbers.push(function () {
    var p = progress(sec), e = clamp((p - 0.12) / 0.7, 0, 1);
    e = e < .5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2;
    stage.style.setProperty('--p', (100 - e * 100).toFixed(2) + '%');
  });
})();

/* ---------------- lightbox ---------------- */
var lb = $('#lightbox'), lbImg = $('#lbImg'), lbList = [], lbI = 0, lastFocus = null;
function lbShow(first) {
  var it = lbList[lbI];
  var set = function () { lbImg.src = it.f; lbImg.alt = it.cap || ''; };
  if (first) set(); else { lbImg.classList.add('swap'); setTimeout(set, 120); }
  lbImg.onload = function () { lbImg.classList.remove('swap'); };
  $('#lbCap').textContent = it.cap || '';
  $('#lbCount').textContent = lbList.length > 1 ? (lbI + 1) + ' / ' + lbList.length : '';
  $('#lbPrev').hidden = $('#lbNext').hidden = lbList.length < 2;
  [lbI - 1, lbI + 1].forEach(function (k) { var n = lbList[(k + lbList.length) % lbList.length]; if (n) (new Image()).src = n.f; });
}
function openLb(list, i) {
  lbList = list; lbI = i || 0; lastFocus = document.activeElement;
  lb.hidden = false; document.documentElement.style.overflow = 'hidden'; lbShow(true);
  requestAnimationFrame(function () { lb.classList.add('open'); });
  $('#lbClose').focus();
}
function closeLb() { lb.classList.remove('open'); document.documentElement.style.overflow = ''; setTimeout(function () { lb.hidden = true; }, still ? 0 : 260); if (lastFocus) lastFocus.focus(); }
function step(d) { lbI = (lbI + d + lbList.length) % lbList.length; lbShow(false); }
$('#lbClose').addEventListener('click', closeLb);
$('#lbPrev').addEventListener('click', function () { step(-1); });
$('#lbNext').addEventListener('click', function () { step(1); });
$('#lbStage').addEventListener('click', function (e) { if (e.target.id === 'lbStage') closeLb(); });
document.addEventListener('keydown', function (e) {
  if (lb.hidden) return;
  if (e.key === 'Escape') closeLb(); else if (e.key === 'ArrowLeft') step(-1); else if (e.key === 'ArrowRight') step(1);
  else if (e.key === 'Tab') { var fs = $$('#lightbox button:not([hidden])'), k = fs.indexOf(document.activeElement); if (e.shiftKey && k <= 0) { e.preventDefault(); fs[fs.length - 1].focus(); } else if (!e.shiftKey && k === fs.length - 1) { e.preventDefault(); fs[0].focus(); } }
});
(function () { var x0 = null, st = $('#lbStage');
  st.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  st.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 45) step(dx < 0 ? 1 : -1); x0 = null; });
})();

/* ---------------- drag-to-compare slider ---------------- */
var BA = [
  ['P4', 'Empty dash to twin chartplotters', 'Cut, wired and finished with two flush displays'],
  ['P1', 'Open frame to blacked-out glass', 'One black face, two displays behind it'],
  ['P7', 'Raw housing to radar & camera helm', 'Fiberglass shell finished in black, systems live'],
  ['P2', 'Bare panel to twin engine displays', 'Flush-mounted above the switch bank'],
  ['P8', 'Taped cutouts to a full helm', 'Openings laid out, cut and filled'],
  ['P6', 'Template to finished switch panel', 'Displays and switches fitted to the layout']
];
(function () {
  var box = $('#ba'), rng = $('#baRange'), cur = -1, drag = false, touched = false;
  function setPos(p) { p = clamp(p, 0, 100); box.style.setProperty('--pos', p + '%'); rng.value = Math.round(p); }
  function show(i) {
    if (i === cur) return; cur = i; var k = BA[i][0], n = 0;
    box.classList.add('loading');
    var done = function () { if (++n === 2) box.classList.remove('loading'); };
    $('#baBefore').onload = done; $('#baAfter').onload = done;
    $('#baBefore').src = 'images/ba/' + k + '-before.webp'; $('#baAfter').src = 'images/ba/' + k + '-after.webp';
    $('#baBefore').alt = 'Before: ' + BA[i][1]; $('#baAfter').alt = 'After: ' + BA[i][1];
    $('#baTitle').textContent = BA[i][1]; $('#baSub').textContent = BA[i][2];
    $$('#baPicks .ba-pick').forEach(function (b, j) { b.setAttribute('aria-pressed', j === i); });
    setPos(50);
  }
  $('#baPicks').innerHTML = BA.map(function (b, i) {
    return '<button type="button" class="ba-pick" aria-pressed="false" data-i="' + i + '"><img src="images/ba/' + b[0] + '-after-s.webp" alt="" loading="lazy" decoding="async"><span><small>Job 0' + (i + 1) + '</small><b>' + b[1] + '</b></span></button>';
  }).join('');
  $('#baPicks').addEventListener('click', function (e) { var b = e.target.closest('.ba-pick'); if (b) show(+b.getAttribute('data-i')); });
  function fromX(x) { var r = box.getBoundingClientRect(); setPos((x - r.left) / r.width * 100); }
  box.addEventListener('pointerdown', function (e) { drag = touched = true; box.setPointerCapture(e.pointerId); fromX(e.clientX); rng.focus({ preventScroll: true }); });
  box.addEventListener('pointermove', function (e) { if (drag) fromX(e.clientX); });
  box.addEventListener('pointerup', function () { drag = false; });
  box.addEventListener('pointercancel', function () { drag = false; });
  rng.addEventListener('input', function () { touched = true; setPos(+rng.value); });
  show(0);
  if (!still && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return; io.disconnect();
      var t0 = null; requestAnimationFrame(function a(now) {
        if (touched) return; if (!t0) t0 = now; var k = (now - t0) / 2000; if (k > 1) { setPos(50); return; }
        setPos(50 + Math.sin(k * Math.PI * 2) * 26); requestAnimationFrame(a);
      });
    }, { threshold: 0.55 });
    io.observe(box);
  }
})();

/* ---------------- build stories: vertical scroll moves the strip sideways (desktop) ---------------- */
var STORIES = [
  ['Glass helm', [['fab-03', 'Old face stripped', 'Down to bare fiberglass'], ['fab-04', 'Prep', 'Ground and cleaned for new glass'], ['fab-05', 'Shaping', 'Frame built up and faired'], ['fab-06', 'Taped & faired', 'Edges masked for the finish'], ['blackout-01', 'Black face fitted', 'Panel set into the frame'], ['blackout-02', 'Bench check', 'Fit and finish before it goes back'], ['blackout-03', 'Ready', 'Finished panel off the bench'], ['fab-07', 'On the boat', 'Frame mounted at the helm'], ['blackout-04', 'Displays in', 'Glass bonded and wired'], ['blackout-05', 'Finished', 'One black face, factory everywhere else']]],
  ['Black housing', [['fab-19', 'Template', 'Layout drawn from the dash'], ['fab-21', 'Housing built', 'Glassed and shaped'], ['fab-22', 'Fitting', 'Trimmed to the console'], ['blackout-11', 'Black face', 'Panel bonded to the housing'], ['blackout-13', 'Polished', 'Edges and face finished by hand'], ['fab-23', 'Mounted', 'Housing set on the helm'], ['blackout-15', 'Finished', 'Displays live: camera and radar']]],
  ['Twin display', [['blackout-07', 'New glass', 'Displays prepped for the panel'], ['fab-12', 'Old face out', 'Opening cleared'], ['fab-13', 'Opening trued', 'Squared up for the new panel'], ['fab-15', 'Dry fit', 'Panel test-fitted from behind'], ['blackout-08', 'Finished', 'Charts up, flush and clean']]]
];
(function () {
  var sec = $('#story'), track = $('#storyTrack'), strip = $('#storyStrip'), bar = $('#storyBar'), cur = 0;
  var pinned = !still && matchMedia('(min-width: 901px)').matches;
  function dist() { return Math.max(0, strip.scrollWidth - innerWidth); }
  function size() { if (pinned) { sec.style.height = (innerHeight + dist()) + 'px'; } }
  function render(i) {
    cur = i; var steps = STORIES[i][1];
    strip.innerHTML = steps.map(function (s, k) { return '<figure><button type="button" data-k="' + k + '" aria-label="Step ' + (k + 1) + ', ' + s[1] + ': view full size"><img src="images/g/t/' + s[0] + '.webp" alt="' + s[1] + ': ' + s[2] + '" loading="lazy" decoding="async"></button><figcaption><b>' + s[1] + '</b>' + s[2] + '</figcaption></figure>'; }).join('');
    $$('#storyTabs .chip').forEach(function (c, j) { c.setAttribute('aria-pressed', j === i); });
    if (pinned) { size(); var top = sec.getBoundingClientRect().top + scrollY; if (scrollY > top) scrollTo(0, top); onScroll(); } else { track.scrollLeft = 0; upd(); }
  }
  function upd() { var m = track.scrollWidth - track.clientWidth; bar.style.width = (m > 0 ? track.scrollLeft / m * 100 : 0) + '%'; }
  $('#storyTabs').innerHTML = STORIES.map(function (s, i) { return '<button class="chip" aria-pressed="false" data-i="' + i + '">Build 0' + (i + 1) + ' · ' + s[0] + ' <span class="n">' + s[1].length + ' steps</span></button>'; }).join('');
  $('#storyTabs').addEventListener('click', function (e) { var c = e.target.closest('.chip'); if (c) render(+c.getAttribute('data-i')); });
  strip.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    openLb(STORIES[cur][1].map(function (s, k) { return { f: P({ i: s[0] }), cap: 'Step ' + (k + 1) + ' · ' + s[1] + ': ' + s[2] }; }), +b.getAttribute('data-k'));
  });
  function nudge(d) {
    if (pinned) { var top = sec.getBoundingClientRect().top + scrollY, p = progress(sec), n = STORIES[cur][1].length; scrollTo({ top: top + clamp(p + d / Math.max(1, n - 3), 0, 1) * dist(), behavior: smooth }); }
    else track.scrollBy({ left: d * track.clientWidth * 0.8, behavior: smooth });
  }
  $('#stPrev').addEventListener('click', function () { nudge(-1); });
  $('#stNext').addEventListener('click', function () { nudge(1); });
  if (pinned) {
    document.documentElement.classList.add('pin-story');
    scrubbers.push(function () { var p = progress(sec); strip.style.transform = 'translate3d(' + (-p * dist()).toFixed(1) + 'px,0,0)'; bar.style.width = (p * 100) + '%'; });
    addEventListener('resize', size);
    addEventListener('load', size);
  } else track.addEventListener('scroll', upd, { passive: true });
  render(0);
})();

/* ---------------- parallax on full-bleed photos ---------------- */
if (!still) {
  var pars = $$('.par');
  scrubbers.push(function () {
    pars.forEach(function (el) { var r = el.parentNode.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; var p = (r.top + r.height / 2 - innerHeight / 2) / (innerHeight + r.height); el.style.transform = 'translate3d(0,' + (p * -14).toFixed(2) + '%,0)'; });
  });
}

/* ---------------- gallery wall ---------------- */
var gFilter = 'all', gShown = 0, gList = [], gCols = [], gH = [], gN = 0;
function page() { return innerWidth < 760 ? 14 : 30; }
function nCols() { var w = innerWidth; return w < 560 ? 2 : w < 900 ? 3 : w < 1400 ? 4 : 5; }
function tileHtml(d, i) {
  return '<button type="button" class="tile" data-i="' + i + '" style="background:' + d.k + '"><img src="' + P(d, 't') + '" srcset="' + P(d, 's') + ' 480w, ' + P(d, 't') + ' 720w" sizes="(max-width: 560px) 50vw, (max-width: 900px) 33vw, (max-width: 1400px) 25vw, 20vw" width="' + d.w + '" height="' + d.h + '" alt="' + (d.alt || ALT[d.c]) + '" loading="lazy" decoding="async"><span class="cat">' + capOf(d) + '</span></button>';
}
function gPlace(from, to) {
  for (var i = from; i < to; i++) {
    var d = gList[i], c = 0; for (var k = 1; k < gN; k++) if (gH[k] < gH[c] - 0.01) c = k;
    gCols[c].insertAdjacentHTML('beforeend', tileHtml(d, i)); gH[c] += d.h / d.w;
  }
}
function gLayout() {
  var g = $('#gallery'); gN = nCols(); g.innerHTML = ''; gCols = []; gH = [];
  for (var k = 0; k < gN; k++) { var col = document.createElement('div'); col.className = 'mcol'; g.appendChild(col); gCols.push(col); gH.push(0); }
  gPlace(0, gShown);
}
function gRender(more) {
  if (!more) { gList = DATA.filter(function (d) { return gFilter === 'all' || d.c === gFilter; }); gShown = Math.min(gList.length, page()); gLayout(); }
  else { var to = Math.min(gList.length, gShown + page()); gPlace(gShown, to); gShown = to; }
  gHook();
}
function gHook() {
  $$('#gallery .tile img:not(.in)').forEach(function (img) {
    if (img.complete && img.naturalWidth) img.classList.add('in'); else img.addEventListener('load', function () { img.classList.add('in'); });
    img.addEventListener('error', function () { var t = img.closest('.tile'); if (t) t.remove(); });
  });
  var left = gList.length - gShown, mb = $('#gMore');
  mb.hidden = left <= 0; mb.textContent = 'Show ' + Math.min(left, page()) + ' more';
  $('#gCount').textContent = 'Showing ' + gShown + ' of ' + gList.length;
}
addEventListener('resize', function () { if (gN && nCols() !== gN) { gLayout(); gHook(); } });
(function () {
  var counts = {}; DATA.forEach(function (d) { counts[d.c] = (counts[d.c] || 0) + 1; });
  $('#gFilters').innerHTML = '<button class="chip" data-f="all" aria-pressed="true">All work <span class="n">' + DATA.length + '</span></button>' +
    Object.keys(CATS).filter(function (c) { return counts[c]; }).map(function (c) { return '<button class="chip" data-f="' + c + '" aria-pressed="false">' + CATS[c] + ' <span class="n">' + counts[c] + '</span></button>'; }).join('');
})();
function setFilter(f) {
  gFilter = f;
  $$('#gFilters .chip').forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-f') === f); });
  gRender(false);
}
$('#gFilters').addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (b) setFilter(b.getAttribute('data-f')); });
$('#gMore').addEventListener('click', function () { gRender(true); });
$('#gallery').addEventListener('click', function (e) {
  var t = e.target.closest('.tile'); if (!t) return;
  openLb(gList.map(function (d) { return { f: P(d), cap: capOf(d) }; }), +t.getAttribute('data-i'));
});
$$('.row-go').forEach(function (b) { b.addEventListener('click', function () { setFilter(b.getAttribute('data-go')); $('#work').scrollIntoView({ behavior: smooth }); }); });
gRender(false);

/* ---------------- hull marquee: duplicate for a seamless loop ---------------- */
(function () { var t = $('#hullTrack'); t.innerHTML += t.innerHTML.replace(/<span/g, '<span aria-hidden="true"'); })();

/* ---------------- reviews (real ones only, from source/gallery/reviews.json) ---------------- */
(function () {
  var R = GD.reviews || []; if (!R.length) return;
  var el = $('#reviews'); el.hidden = false;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  el.innerHTML = R.map(function (r, i) { return '<figure class="review rv" style="--d:' + i + '"><span class="stars" aria-label="' + (r.stars || 5) + ' out of 5 stars">' + '★★★★★'.slice(0, r.stars || 5) + '</span><blockquote style="margin:0">' + esc(r.text) + '</blockquote><figcaption>' + esc(r.name) + (r.source ? ' · ' + esc(r.source) : '') + '</figcaption></figure>'; }).join('');
})();

/* ---------------- contact ---------------- */
function copyText(text, btn) {
  var done = function () { var t = btn.textContent; btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = t; }, 1600); };
  var fallback = function () { var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { btn.textContent = 'Select & copy'; } document.body.removeChild(ta); };
  try { navigator.clipboard.writeText(text).then(done, fallback); } catch (e) { fallback(); }
}
$$('.copy').forEach(function (b) { b.addEventListener('click', function () { copyText(b.getAttribute('data-copy'), b); }); });
$('#qPhoto').addEventListener('change', function (e) {
  var file = e.target.files[0], lab = $('#fileLabel');
  if (!file) { lab.textContent = 'Add a photo of your helm (optional)'; return; }
  if (file.size > 8 * 1024 * 1024) { lab.textContent = 'That photo is over 8 MB. Please pick a smaller one.'; e.target.value = ''; return; }
  lab.textContent = 'Attached: ' + file.name;
});
$('#quote').addEventListener('submit', function (e) {
  e.preventDefault();
  var form = e.target, status = $('#formStatus');
  var live = /universalmarinefl\.com$|netlify\.app$/.test(location.hostname);
  if (!live) { status.className = 'form-status'; status.textContent = 'This preview can’t send messages. On the live site this goes straight to the shop. For now, call or text (786) 325-5690.'; return; }
  status.className = 'form-status'; status.textContent = 'Sending…';
  fetch('/', { method: 'POST', body: new FormData(form) })
    .then(function (r) { if (!r.ok) throw 0; status.className = 'form-status ok'; status.textContent = 'Got it. We’ll call you back, usually the same day.'; form.reset(); $('#fileLabel').textContent = 'Add a photo of your helm (optional)'; })
    .catch(function () { status.className = 'form-status'; status.textContent = 'That didn’t go through. Call or text (786) 325-5690 and we’ll take it from there.'; });
});

/* ---------------- nav, sticky bar, reveals ---------------- */
var nav = $('#nav'), menuBtn = $('#menuBtn'), links = $('#navLinks');
menuBtn.addEventListener('click', function () { var o = links.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', o); nav.classList.toggle('solid', o || scrollY > 60); });
links.addEventListener('click', function (e) { if (e.target.tagName === 'A') { links.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); } });
scrubbers.push(function () { nav.classList.toggle('solid', scrollY > 60 || links.classList.contains('open')); });
$('#yr').textContent = new Date().getFullYear();
if ('IntersectionObserver' in window) {
  var navMap = {}; $$('#navLinks a').forEach(function (a) { navMap[a.getAttribute('href').slice(1)] = a; });
  var spy = new IntersectionObserver(function (es) { es.forEach(function (e) { var a = navMap[e.target.id]; if (a && e.isIntersecting) $$('#navLinks a').forEach(function (x) { x.classList.toggle('on', x === a); }); }); }, { rootMargin: '-45% 0px -50% 0px' });
  Object.keys(navMap).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  var mbar = $('#mbar'), heroOut = false, contactIn = false;
  var upd = function () { mbar.classList.toggle('show', heroOut && !contactIn); };
  new IntersectionObserver(function (es) { heroOut = !es[0].isIntersecting; upd(); }, { threshold: 0.1 }).observe($('#home'));
  new IntersectionObserver(function (es) { contactIn = es[0].isIntersecting; upd(); }, { threshold: 0.15 }).observe($('#contact'));
  var rv = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rv.unobserve(e.target); } }); }, { rootMargin: '0px 0px -10% 0px' });
  var watch = function () { $$('.rv:not(.in), .row:not(.in)').forEach(function (el) { rv.observe(el); }); };
  watch(); new MutationObserver(watch).observe(document.body, { childList: true, subtree: true });
} else { $$('.rv, .row').forEach(function (el) { el.classList.add('in'); }); }

/* ---------------- counters ---------------- */
(function () {
  var els = $$('[data-count]'); if (!els.length || still || !('IntersectionObserver' in window)) return;
  els.forEach(function (el) { el.dataset.final = el.textContent; el.textContent = '0' + (el.getAttribute('data-suffix') || ''); });
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return; io.unobserve(e.target); var el = e.target, end = +el.getAttribute('data-count'), suf = el.getAttribute('data-suffix') || '', t0 = null;
      requestAnimationFrame(function stepc(now) { if (!t0) t0 = now; var k = Math.min(1, (now - t0) / 1600), v = Math.round(end * (1 - Math.pow(1 - k, 3))); el.textContent = v.toLocaleString() + suf; if (k < 1) requestAnimationFrame(stepc); });
    });
  }, { threshold: 0.6 });
  els.forEach(function (el) { io.observe(el); });
})();

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

onScroll();
})();
