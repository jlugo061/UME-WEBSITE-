(function () {
'use strict';
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
function f(n) { return Math.round(n * 10) / 10; }
var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
var smooth = still ? 'auto' : 'smooth';

/* ---------------- data ---------------- */
var GD = JSON.parse($('#gdata').textContent);
var DATA = GD.items, PREVIEW = !!GD.preview;
var CATS = { helm: 'Helms & displays', blackout: 'Black panels', fab: 'Fabrication', wiring: 'Wiring', radar: 'Radar, cameras & comms', av: 'Audio & TV', boats: 'Boats', shop: 'In the shop' };
var ALT = { helm: 'Finished boat helm with flush-mounted displays', blackout: 'Black Starboard helm panel', fab: 'Helm panel fabrication in progress', wiring: 'Clean, labeled console wiring', radar: 'Radar, camera or antenna install on a hardtop', av: 'Onboard TV or audio install', boats: 'Customer boat', shop: 'UME crew at work' };
function P(d, size) { if (PREVIEW) size = 't'; return 'images/g/' + (size ? size + '/' : '') + d.i + '.webp'; }   // the Claude preview ships one size only
function capOf(d) { return d.cap || CATS[d.c] || ''; }
$$('[data-total]').forEach(function (el) { el.textContent = DATA.length; });

/* ---------------- lightbox ---------------- */
var lb = $('#lightbox'), lbImg = $('#lbImg'), lbList = [], lbI = 0, lastFocus = null;
function lbShow(first) {
  var it = lbList[lbI];
  var set = function () { lbImg.src = it.f; lbImg.alt = it.cap || ''; };
  if (first) set(); else { lbImg.classList.add('swap'); setTimeout(function () { set(); }, 120); }
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
function closeLb() { lb.classList.remove('open'); document.documentElement.style.overflow = ''; setTimeout(function () { lb.hidden = true; }, still ? 0 : 220); if (lastFocus) lastFocus.focus(); }
function step(d) { lbI = (lbI + d + lbList.length) % lbList.length; lbShow(false); }
$('#lbClose').addEventListener('click', closeLb);
$('#lbPrev').addEventListener('click', function () { step(-1); });
$('#lbNext').addEventListener('click', function () { step(1); });
$('#lbStage').addEventListener('click', function (e) { if (e.target.id === 'lbStage') closeLb(); });
document.addEventListener('keydown', function (e) {
  if (lb.hidden) return;
  if (e.key === 'Escape') closeLb(); else if (e.key === 'ArrowLeft') step(-1); else if (e.key === 'ArrowRight') step(1);
  else if (e.key === 'Tab') { var fs = $$('#lightbox button:not([hidden])'); var i = fs.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); fs[fs.length - 1].focus(); } else if (!e.shiftKey && i === fs.length - 1) { e.preventDefault(); fs[0].focus(); } }
});
(function () { var x0 = null, st = $('#lbStage');
  st.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  st.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 45) step(dx < 0 ? 1 : -1); x0 = null; });
})();
function bindSingles(sel) {
  var bs = $$(sel); var list = bs.map(function (b) { return { f: PREVIEW ? b.querySelector('img').src : b.getAttribute('data-full'), cap: b.getAttribute('data-cap') }; });
  bs.forEach(function (b, i) { b.addEventListener('click', function () { openLb(list, i); }); });
}
bindSingles('.bp-photo button'); bindSingles('#crew button');

/* ---------------- reel: finished work only ---------------- */
(function () {
  var pick = DATA.filter(function (d) { return d.feat && d.c !== 'wiring' && d.c !== 'fab'; }).slice(0, 20);
  var list = pick.map(function (d) { return { f: P(d), cap: capOf(d) }; });
  var html = pick.map(function (d, i) { return '<button type="button" data-i="' + i + '" aria-label="View photo: ' + capOf(d) + '" style="background:' + d.k + '"><img src="' + P(d, 's') + '" alt="" width="' + d.w + '" height="' + d.h + '" loading="lazy" decoding="async"></button>'; }).join('');
  var tr = $('#reelTrack'); tr.innerHTML = html + html.replace(/<button /g, '<button tabindex="-1" aria-hidden="true" ');
  tr.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) openLb(list, +b.getAttribute('data-i')); });
})();

/* ---------------- before / after ---------------- */
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
  function setPos(p) { p = Math.max(0, Math.min(100, p)); box.style.setProperty('--pos', p + '%'); rng.value = Math.round(p); }
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
    return '<button type="button" class="ba-pick" aria-pressed="false" data-i="' + i + '"><span class="th"><img src="images/ba/' + b[0] + '-after.webp" alt="" loading="lazy" decoding="async"></span><small>' + b[1] + '</small></button>';
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
        setPos(50 + Math.sin(k * Math.PI * 2) * 24); requestAnimationFrame(a);
      });
    }, { threshold: 0.55 });
    io.observe(box);
  }
  var DUOS = [['S1', 'Taped and cut, then twin displays', 'Same boat, same day'], ['S2', 'Open dash to glowing charts', 'Old face out, black panel in'], ['S3', 'Behind the dash to a finished helm', 'Rewired, then closed up clean']];
  $('#duos').innerHTML = DUOS.map(function (d, i) {
    return '<figure class="duo rv" style="--d:' + i + '"><div class="duo-pair"><button type="button" data-i="' + i + '" data-k="0"><img src="images/ba/' + d[0] + '-before.webp" alt="Before: ' + d[1] + '" loading="lazy" decoding="async"><span class="ba-tag b">Before</span></button>' +
      '<button type="button" data-i="' + i + '" data-k="1"><img src="images/ba/' + d[0] + '-after.webp" alt="After: ' + d[1] + '" loading="lazy" decoding="async"><span class="ba-tag a">After</span></button></div><figcaption><b>' + d[1] + '</b><span>' + d[2] + '</span></figcaption></figure>';
  }).join('');
  $('#duos').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return; var d = DUOS[+b.getAttribute('data-i')];
    openLb([{ f: 'images/ba/' + d[0] + '-before.webp', cap: 'Before · ' + d[1] }, { f: 'images/ba/' + d[0] + '-after.webp', cap: 'After · ' + d[1] }], +b.getAttribute('data-k'));
  });
})();

/* ---------------- build stories ---------------- */
var STORIES = [
  ['Glass helm', [['fab-03', 'Old face stripped', 'Down to bare fiberglass'], ['fab-04', 'Prep', 'Ground and cleaned for new glass'], ['fab-05', 'Shaping', 'Frame built up and faired'], ['fab-06', 'Taped & faired', 'Edges masked for the finish'], ['blackout-01', 'Black face fitted', 'Panel set into the frame'], ['blackout-02', 'Bench check', 'Fit and finish before it goes back'], ['blackout-03', 'Ready', 'Finished panel off the bench'], ['fab-07', 'On the boat', 'Frame mounted at the helm'], ['blackout-04', 'Displays in', 'Glass bonded and wired'], ['blackout-05', 'Finished', 'One black face, factory everywhere else']]],
  ['Black housing', [['fab-19', 'Template', 'Layout drawn from the dash'], ['fab-21', 'Housing built', 'Glassed and shaped'], ['fab-22', 'Fitting', 'Trimmed to the console'], ['blackout-11', 'Black face', 'Panel bonded to the housing'], ['blackout-13', 'Polished', 'Edges and face finished by hand'], ['fab-23', 'Mounted', 'Housing set on the helm'], ['blackout-15', 'Finished', 'Displays live: camera and radar']]],
  ['Twin display', [['blackout-07', 'New glass', 'Displays prepped for the panel'], ['fab-12', 'Old face out', 'Opening cleared'], ['fab-13', 'Opening trued', 'Squared up for the new panel'], ['fab-15', 'Dry fit', 'Panel test-fitted from behind'], ['blackout-08', 'Finished', 'Charts up, flush and clean']]]
];
(function () {
  var strip = $('#storyStrip'), cur = 0;
  function render(i) {
    cur = i; var steps = STORIES[i][1];
    strip.innerHTML = steps.map(function (s, k) { return '<figure><button type="button" data-k="' + k + '" aria-label="Step ' + (k + 1) + ', ' + s[1] + ': view full size"><img src="images/g/t/' + s[0] + '.webp" alt="' + s[1] + ': ' + s[2] + '" loading="lazy" decoding="async"></button><figcaption><b>' + s[1] + '</b>' + s[2] + '</figcaption></figure>'; }).join('');
    strip.scrollLeft = 0;
    $$('#storyTabs .chip').forEach(function (c, j) { c.setAttribute('aria-pressed', j === i); });
  }
  $('#storyTabs').innerHTML = STORIES.map(function (s, i) { return '<button class="chip" aria-pressed="false" data-i="' + i + '">Build 0' + (i + 1) + ' · ' + s[0] + ' <span class="n">' + s[1].length + ' steps</span></button>'; }).join('');
  $('#storyTabs').addEventListener('click', function (e) { var c = e.target.closest('.chip'); if (c) render(+c.getAttribute('data-i')); });
  strip.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    openLb(STORIES[cur][1].map(function (s, k) { return { f: P({ i: s[0] }), cap: 'Step ' + (k + 1) + ' · ' + s[1] + ': ' + s[2] }; }), +b.getAttribute('data-k'));
  });
  $('#stPrev').addEventListener('click', function () { strip.scrollBy({ left: -strip.clientWidth * 0.8, behavior: smooth }); });
  $('#stNext').addEventListener('click', function () { strip.scrollBy({ left: strip.clientWidth * 0.8, behavior: smooth }); });
  render(0);
})();

/* ---------------- gallery ---------------- */
var gFilter = 'all', gShown = 0, gList = [], gCols = [], gH = [], gN = 0;
function page() { return innerWidth < 760 ? 12 : 24; }
function nCols() { var w = $('#gallery').clientWidth; return w < 560 ? 2 : w < 900 ? 3 : 4; }
function tileHtml(d, i, big) {
  var srcset = P(d, 's') + ' 480w, ' + P(d, 't') + ' 720w' + (big && !PREVIEW ? ', ' + P(d) + ' 1600w' : '');
  var sizes = big ? '(max-width: 760px) 100vw, 66vw' : '(max-width: 560px) 50vw, (max-width: 900px) 33vw, 300px';
  return '<button type="button" class="tile" data-i="' + i + '" style="background:' + d.k + '"><img src="' + P(d, 't') + '" srcset="' + srcset + '" sizes="' + sizes + '" width="' + d.w + '" height="' + d.h + '" alt="' + (d.alt || ALT[d.c]) + '" loading="lazy" decoding="async"><span class="cat">' + capOf(d) + '</span></button>';
}
function gPlace(from, to) {
  for (var i = from; i < to; i++) {
    var d = gList[i], c = 0; for (var k = 1; k < gN; k++) if (gH[k] < gH[c] - 0.01) c = k;
    gCols[c].insertAdjacentHTML('beforeend', tileHtml(d, i, false)); gH[c] += d.h / d.w;
  }
}
function gLayout() {
  var g = $('#gallery'); gN = nCols(); g.innerHTML = ''; gCols = []; gH = [];
  for (var k = 0; k < gN; k++) { var col = document.createElement('div'); col.className = 'mcol'; g.appendChild(col); gCols.push(col); gH.push(0); }
  gPlace(3, gShown);
}
function gRender(more) {
  if (!more) {
    gList = DATA.filter(function (d) { return gFilter === 'all' || d.c === gFilter; });
    $('#gLead').innerHTML = gList.slice(0, 3).map(function (d, i) { return tileHtml(d, i, i === 0); }).join('');
    gShown = Math.min(gList.length, 3 + page()); gLayout();
  } else { var to = Math.min(gList.length, gShown + page()); gPlace(gShown, to); gShown = to; }
  gHook();
}
function gHook() {
  $$('#work .tile img:not(.in)').forEach(function (img) {
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
  $$('#gFilters .chip').forEach(function (x) { var on = x.getAttribute('data-f') === f; x.setAttribute('aria-pressed', on); if (on) x.scrollIntoView({ block: 'nearest', inline: 'center', behavior: smooth }); });
  gRender(false);
}
$('#gFilters').addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (b) setFilter(b.getAttribute('data-f')); });
$('#gMore').addEventListener('click', function () { gRender(true); });
$('#work').addEventListener('click', function (e) {
  var t = e.target.closest('.tile'); if (!t) return;
  openLb(gList.map(function (d) { return { f: P(d), cap: capOf(d) }; }), +t.getAttribute('data-i'));
});
$$('.svc-go').forEach(function (b) { b.addEventListener('click', function () { setFilter(b.getAttribute('data-go')); $('#work').scrollIntoView({ behavior: smooth }); }); });
gRender(false);

/* ---------------- reviews (only real ones, added in source/gallery/reviews.json) ---------------- */
(function () {
  var R = GD.reviews || []; if (!R.length) return;
  var el = $('#reviews'); el.hidden = false;
  el.innerHTML = R.map(function (r, i) {
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    return '<figure class="review rv" style="--d:' + i + '"><span class="stars" aria-label="' + (r.stars || 5) + ' out of 5 stars">' + '★★★★★'.slice(0, r.stars || 5) + '</span><blockquote style="margin:0">' + esc(r.text) + '</blockquote><figcaption>' + esc(r.name) + (r.source ? ' · ' + esc(r.source) : '') + '</figcaption></figure>';
  }).join('');
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
menuBtn.addEventListener('click', function () { var o = links.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', o); });
links.addEventListener('click', function (e) { if (e.target.tagName === 'A') { links.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); } });
addEventListener('scroll', function () { nav.classList.toggle('scrolled', scrollY > 40); }, { passive: true });
$('#yr').textContent = new Date().getFullYear();
if ('IntersectionObserver' in window) {
  var navMap = {}; $$('#navLinks a').forEach(function (a) { navMap[a.getAttribute('href').slice(1)] = a; });
  var spy = new IntersectionObserver(function (es) {
    es.forEach(function (e) { var a = navMap[e.target.id]; if (a && e.isIntersecting) { $$('#navLinks a').forEach(function (x) { x.classList.toggle('on', x === a); }); } });
  }, { rootMargin: '-45% 0px -50% 0px' });
  Object.keys(navMap).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  var mbar = $('#mbar'), heroOut = false, contactIn = false;
  var upd = function () { mbar.classList.toggle('show', heroOut && !contactIn); };
  new IntersectionObserver(function (es) { heroOut = !es[0].isIntersecting; upd(); }, { threshold: 0.15 }).observe($('#home'));
  new IntersectionObserver(function (es) { contactIn = es[0].isIntersecting; upd(); }, { threshold: 0.2 }).observe($('#contact'));
  var rv = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rv.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
  var watch = function () { $$('.rv:not(.in)').forEach(function (el) { rv.observe(el); }); };
  watch(); new MutationObserver(watch).observe(document.body, { childList: true, subtree: true });
} else { $$('.rv').forEach(function (el) { el.classList.add('in'); }); }

/* ---------------- counters ---------------- */
(function () {
  var els = $$('[data-count]'); if (!els.length || still) return;
  els.forEach(function (el) {
    var end = +el.getAttribute('data-count'), suf = el.getAttribute('data-suffix') || '', t0 = null;
    el.textContent = '0' + suf;
    setTimeout(function () { requestAnimationFrame(function stepc(now) { if (!t0) t0 = now; var k = Math.min(1, (now - t0) / 1400), v = Math.round(end * (1 - Math.pow(1 - k, 3))); el.textContent = v.toLocaleString() + suf; if (k < 1) requestAnimationFrame(stepc); }); }, 900);
  });
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
    col.line = '#8fd0ef'; col.route = '#e3529f'; col.light = false;
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

})();
