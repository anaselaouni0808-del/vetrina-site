/* Guy Morice, architecte : rendu 3D réaliste (Three.js r128 + Sky), interface simple */
(function () {
"use strict";
var body = document.body;
var REDUCE = body.classList.contains('reduce');
function $(s, c) { return (c || document).querySelector(s); }
function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
var SMALL = window.innerWidth < 760;

/* ---------- En-tête, menu, barre d'appel, apparitions ---------- */
var hdr = $('#hdr'), burger = $('#burger'), menu = $('#menu');
function hl() { hdr.classList.toggle('line', window.scrollY > 10); }
window.addEventListener('scroll', hl, { passive: true }); hl();
function closeMenu() { body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Ouvrir le menu'); menu.setAttribute('aria-hidden', 'true'); }
burger.addEventListener('click', function () {
  if (body.classList.contains('menu-open')) { closeMenu(); return; }
  body.classList.add('menu-open'); burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', 'Fermer le menu'); menu.setAttribute('aria-hidden', 'false');
});
$$('.menu a').forEach(function (a) { a.addEventListener('click', closeMenu); });
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

if ('IntersectionObserver' in window) {
  var dock = $('#dock'), past = false, inC = false;
  var upd = function () { dock.classList.toggle('show', past && !inC); };
  new IntersectionObserver(function (e) { past = !e[0].isIntersecting; upd(); }).observe($('.hero'));
  new IntersectionObserver(function (e) { inC = e[0].isIntersecting; upd(); }, { threshold: .05 }).observe($('#contact'));
  var rio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
  $$('.rv').forEach(function (el) { rio.observe(el); });
} else $$('.rv').forEach(function (el) { el.classList.add('in'); });

/* ---------- Contact ---------- */
(function () { // années d'expérience, calculées et comptées une fois à l'arrivée
  var el = $('#years'); if (!el) return;
  var n = new Date().getFullYear() - 1982; el.textContent = n;
  if (REDUCE || !('IntersectionObserver' in window)) return;
  el.textContent = '0';
  var io = new IntersectionObserver(function (e) {
    if (!e[0].isIntersecting) return; io.disconnect();
    var t0 = performance.now();
    (function step(t) { var k = Math.min(1, (t - t0) / 1600); el.textContent = Math.round(n * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); })(t0);
  }, { threshold: .5 });
  io.observe(el);
})();
(function () {
  var now; try { now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' })); } catch (e) { now = new Date(); }
  var d = now.getDay(), h = now.getHours() + now.getMinutes() / 60;
  var row = $('#hours tr[data-d="' + d + '"]'); if (row) row.classList.add('today');
  var wk = d >= 1 && d <= 5, open = wk && ((h >= 9 && h < 13) || (h >= 14 && h < 19)), txt;
  if (open) txt = 'Ouvert en ce moment, jusqu’à ' + (h < 13 ? '13 h' : '19 h');
  else if (wk && h < 9) txt = 'Fermé, ouvre aujourd’hui à 9 h';
  else if (wk && h >= 13 && h < 14) txt = 'Pause déjeuner, reprise à 14 h';
  else txt = 'Fermé, ouvre ' + ((d === 5 || d === 6) ? 'lundi' : 'demain') + ' à 9 h';
  $('#status').classList.toggle('open', open); $('#statusTxt').textContent = txt;
  var btn = $('#copy');
  btn.addEventListener('click', function () {
    function ok() { btn.textContent = 'Numéro copié'; setTimeout(function () { btn.textContent = 'Copier le numéro'; }, 2200); }
    function sel() { var r = document.createRange(); r.selectNodeContents($('#telnum')); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    try { navigator.clipboard.writeText('06 09 61 26 41').then(ok, sel); } catch (e) { sel(); }
  });
})();

/* ---------- Réalisations : visionneuse de projet ---------- */
(function () {
  function seq(p, kind, n) { var a = []; for (var i = 1; i <= n; i++) a.push('projets/' + p + '-' + kind + i); return a; }
  var P = {
    ga: { t: 'Villa sous grand toit, avec piscine', m: 'Maison individuelle, vues 3D de l’atelier',
      d: 'Une maison à étage abritée par un grand toit à une pente, porté par de fins poteaux. Le balcon court sur toute la façade, au-dessus des baies du séjour, qui s’ouvrent de plain-pied sur la terrasse en bois et la piscine.',
      f: [['Niveaux', '2'], ['Toiture', 'Une pente, débord sur poteaux'], ['Étage', 'Balcon filant'], ['Extérieurs', 'Terrasse bois et piscine']],
      v: seq('ga', 'v', 2), p: [],
      vn: ['Façade sur la piscine', 'Vue depuis la terrasse'], pn: [] },
    gb: { t: 'Maison aux brise-soleil', m: 'Maison individuelle, vues 3D de l’atelier',
      d: 'Un volume à étage sous un toit à une pente qui déborde largement. Des lames inclinées protègent la façade principale du soleil ; le garage forme un volume à part, au bout de l’allée.',
      f: [['Niveaux', '2'], ['Toiture', 'Une pente, large débord'], ['Façade', 'Lames brise-soleil'], ['Garage', 'Indépendant']],
      v: seq('gb', 'v', 2), p: [],
      vn: ['Façade d’entrée et allée', 'Vue depuis le jardin'], pn: [] },
    gc: { t: 'Maison habillée de bois', m: 'Maison individuelle, vue 3D de l’atelier',
      d: 'Une maison à étage entièrement habillée de bois, avec un balcon filant et un toit à une pente porté par des poteaux. Le garage, plus sombre, forme un volume bas accolé à la maison.',
      f: [['Niveaux', '2'], ['Façades', 'Bardage bois'], ['Toiture', 'Une pente sur poteaux'], ['Garage', 'Accolé']],
      v: seq('gc', 'v', 1), p: [],
      vn: ['Façade principale'], pn: [] },
    gd: { t: 'Les maisons « Bio-Clim »', m: 'Quartier d’habitat, Brax',
      d: 'Un quartier conçu selon la démarche HQE : vingt-cinq maisons avec jardin, desservies par des rues plantées, et deux résidences de huit logements reliées par un passage public, autour d’un espace vert commun.',
      f: [['Maisons', '25'], ['Logements', '16, en 2 résidences'], ['Démarche', 'HQE'], ['Espaces communs', 'Espace vert et passage public']],
      v: seq('gd', 'v', 1), p: seq('gd', 'p', 1),
      vn: ['Résidences B et C, et le passage public'], pn: ['Plan de masse du quartier'] },
    ge: { t: 'Maison bioclimatique', m: 'Esquisses à la main, façades au 1/100',
      d: 'Une maison sous une grande toiture de tuiles. Au sud, le pignon est largement vitré et s’ouvre sur un balcon ; la maison donne sur une terrasse au sud et une autre à l’ouest, avec un abri voitures ouvert à l’écart.',
      f: [['Toiture', 'Tuiles, faîtage à 5,50 m'], ['Façade sud', 'Pignon vitré'], ['Terrasses', 'Sud et ouest'], ['Voitures', 'Abri ouvert']],
      v: seq('ge', 'v', 2), p: seq('ge', 'p', 3), pl: 'Façades', light: true,
      vn: ['Perspective annotée', 'Perspective'], pn: ['Façade sud', 'Façade est', 'Façade ouest'] },
    gf: { t: 'Maisons en bardage bois', m: 'Esquisses à la main',
      d: 'Deux esquisses de maisons habillées de bois. La première, longue et basse, est coiffée de tuiles romanes aux couleurs nuancées, avec des gouttières en alu blanc et des poteaux métalliques. La seconde s’ouvre sur un jardin avec piscine et pergola.',
      f: [['Façades', 'Bardage bois'], ['Toiture', 'Tuiles romanes'], ['Détails', 'Gouttières alu, poteaux métal']],
      v: seq('gf', 'v', 2), p: [], light: true,
      vn: ['Perspective de la façade sud', 'Perspective sur le jardin'], pn: [] }
  };
  var V = $('#viewer'); if (!V) return;
  var img = $('#v-img'), stage = $('#v-stage'), thumbs = $('#v-thumbs'), num = $('#v-num'), full = $('#v-full');
  var tViews = $('#v-t-views'), tPlans = $('#v-t-plans');
  var cur = null, set = 'v', idx = 0, lastFocus = null;
  function list() { return cur[set]; }
  function names() { return set === 'v' ? cur.vn : cur.pn; }
  function show(i) {
    var L = list(); idx = (i + L.length) % L.length;
    var src = L[idx] + '.jpg';
    img.classList.remove('on');
    var pre = new Image();
    pre.onload = function () { img.src = src; img.alt = cur.t + ', ' + names()[idx]; requestAnimationFrame(function () { img.classList.add('on'); }); };
    pre.src = src;
    if (L.length > 1) { var nx = new Image(); nx.src = L[(idx + 1) % L.length] + '.jpg'; }
    num.textContent = names()[idx] + '  ' + (idx + 1) + ' / ' + L.length;
    full.href = src;
    stage.classList.toggle('plan', set === 'p' || !!cur.light);
    $$('button', thumbs).forEach(function (b, k) { b.setAttribute('aria-current', k === idx ? 'true' : 'false'); });
    var on = thumbs.children[idx]; if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest', inline: 'center' });
    $('#v-prev').hidden = $('#v-next').hidden = L.length < 2;
  }
  function useSet(s) {
    set = s; tViews.setAttribute('aria-pressed', s === 'v'); tPlans.setAttribute('aria-pressed', s === 'p');
    thumbs.innerHTML = '';
    list().forEach(function (b, k) {
      var t = document.createElement('button'); t.type = 'button'; t.setAttribute('aria-label', names()[k]);
      t.innerHTML = '<img src="' + b + '-s.jpg" alt="" loading="lazy">';
      t.addEventListener('click', function () { show(k); });
      thumbs.appendChild(t);
    });
    show(0);
  }
  function open(key) {
    cur = P[key]; if (!cur) return;
    lastFocus = document.activeElement;
    $('#v-title').innerHTML = cur.t + '<small>' + cur.m + '</small>';
    $('#v-desc').textContent = cur.d;
    $('#v-facts').innerHTML = cur.f.map(function (x) { return '<div><dt>' + x[0] + '</dt><dd>' + x[1] + '</dd></div>'; }).join('');
    tPlans.hidden = !cur.p.length; tPlans.textContent = cur.pl || 'Plans';
    $('.v-tabs').hidden = !cur.p.length;
    V.hidden = false; body.classList.add('viewing');
    useSet('v');
    $('#v-close').focus();
  }
  function close() { V.hidden = true; body.classList.remove('viewing'); img.removeAttribute('src'); if (lastFocus) lastFocus.focus(); }
  $$('[data-p]').forEach(function (b) { b.addEventListener('click', function () { open(b.getAttribute('data-p')); }); });
  $('#v-close').addEventListener('click', close);
  $('#v-prev').addEventListener('click', function () { show(idx - 1); });
  $('#v-next').addEventListener('click', function () { show(idx + 1); });
  tViews.addEventListener('click', function () { if (set !== 'v') useSet('v'); });
  tPlans.addEventListener('click', function () { if (set !== 'p') useSet('p'); });
  document.addEventListener('keydown', function (e) {
    if (V.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(idx - 1);
    else if (e.key === 'ArrowRight') show(idx + 1);
    else if (e.key === 'Tab') { // garder le focus dans la visionneuse
      var f = $$('button:not([hidden]), a[href]', V).filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  // glisser du doigt pour changer d'image
  var x0 = null, y0 = 0;
  stage.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) show(idx + (dx < 0 ? 1 : -1));
  });
})();

/* =====================================================================
   Rendu 3D réaliste
   ===================================================================== */
var frame = $('#frame'), stage = $('#frame .stage');
var BAKE = /[?&]bake/.test(location.search);
// Sur téléphone et tablette, l'image du rendu (déjà calculée) suffit : aucune attente, aucun calcul.
var LIVE = BAKE || (!SMALL && !matchMedia('(pointer: coarse)').matches && !REDUCE);
function pause() { return new Promise(function (r) { requestAnimationFrame(function () { setTimeout(r, 0); }); }); }
// construction découpée en petites étapes : la page reste fluide pendant que la 3D se prépare
async function start3D() {
if (!window.THREE || !frame || !stage) return;
var T = THREE;

var seed = 7;
function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
function rr(a, b) { return a + rnd() * (b - a); }

/* ---------- Textures dessinées ---------- */
function canvasTex(size, draw, rep) {
  var c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  var t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.encoding = T.sRGBEncoding; t.anisotropy = 8;
  if (rep) t.repeat.set(rep[0], rep[1]);
  return t;
}
function speckle(g, s, base, n, alpha) {
  g.fillStyle = base; g.fillRect(0, 0, s, s);
  for (var i = 0; i < n; i++) {
    g.fillStyle = (rnd() > .5 ? 'rgba(255,255,255,' : 'rgba(0,0,0,') + (rnd() * alpha) + ')';
    g.fillRect(rr(0, s), rr(0, s), rr(1, 2.4), rr(1, 2.4));
  }
}
var TX = {
  render: function (r) { return canvasTex(512, function (g, s) { speckle(g, s, '#EEECE7', 26000, .09); }, r); },
  wood: function (r, b) {
    b = b || [150, 108, 72];
    return canvasTex(512, function (g, s) {
      var n = 12, w = s / n;
      for (var i = 0; i < n; i++) {
        var L = rr(-14, 14);
        g.fillStyle = 'rgb(' + [b[0] + L, b[1] + L * .8, b[2] + L * .6].map(Math.round).join(',') + ')'; g.fillRect(i * w, 0, w, s);
        for (var k = 0; k < 26; k++) {
          g.strokeStyle = 'rgba(70,45,25,' + rr(.05, .18) + ')'; g.lineWidth = rr(.5, 1.6);
          var x = i * w + rr(2, w - 2); g.beginPath(); g.moveTo(x, 0);
          for (var y = 0; y <= s; y += 32) g.lineTo(x + Math.sin(y * .02 + k) * rr(.5, 2.5), y);
          g.stroke();
        }
        g.fillStyle = 'rgba(60,45,30,.45)'; g.fillRect(i * w, 0, 2, s);
      }
    }, r);
  },
  grass: function (r) {
    return canvasTex(512, function (g, s) {
      g.fillStyle = '#56683A'; g.fillRect(0, 0, s, s);
      for (var i = 0; i < 9000; i++) {
        g.strokeStyle = 'rgba(' + [rr(60, 105), rr(80, 125), rr(40, 65)].map(Math.round).join(',') + ',' + rr(.35, .8) + ')'; g.lineWidth = rr(.6, 1.6);
        var x = rr(0, s), y = rr(0, s); g.beginPath(); g.moveTo(x, y); g.lineTo(x + rr(-2, 2), y - rr(3, 8)); g.stroke();
      }
    }, r);
  },
  tiles: function (r) {
    return canvasTex(512, function (g, s) {
      speckle(g, s, '#D9D6CF', 9000, .07);
      g.strokeStyle = 'rgba(120,115,105,.45)'; g.lineWidth = 2;
      for (var i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * s / 4, 0); g.lineTo(i * s / 4, s); g.stroke(); }
      for (i = 0; i <= 2; i++) { g.beginPath(); g.moveTo(0, i * s / 2); g.lineTo(s, i * s / 2); g.stroke(); }
    }, r);
  },
  gravel: function (r) { return canvasTex(512, function (g, s) { speckle(g, s, '#BDB6A8', 40000, .35); }, r); },
  hedge: function (r) {
    return canvasTex(256, function (g, s) {
      g.fillStyle = '#2F4A26'; g.fillRect(0, 0, s, s);
      for (var i = 0; i < 5000; i++) { g.fillStyle = 'rgba(' + [rr(40, 95), rr(70, 120), rr(30, 60)].map(Math.round).join(',') + ',.7)'; g.beginPath(); g.arc(rr(0, s), rr(0, s), rr(1, 3), 0, 7); g.fill(); }
    }, r);
  },
  win: function () { // vitrage : intérieur éclairé et reflet du ciel
    return canvasTex(512, function (g, s) {
      var gr = g.createLinearGradient(0, 0, 0, s); gr.addColorStop(0, '#2B2420'); gr.addColorStop(.55, '#6A4A30'); gr.addColorStop(1, '#3A2C22'); g.fillStyle = gr; g.fillRect(0, 0, s, s);
      for (var i = 0; i < 3; i++) { var x = rr(.15, .85) * s, y = rr(.15, .4) * s, rg = g.createRadialGradient(x, y, 4, x, y, s * .35); rg.addColorStop(0, 'rgba(255,205,140,.95)'); rg.addColorStop(1, 'rgba(255,190,120,0)'); g.fillStyle = rg; g.fillRect(0, 0, s, s); }
      g.fillStyle = 'rgba(25,20,16,.85)'; g.fillRect(s * .1, s * .7, s * .34, s * .14); g.fillRect(s * .58, s * .62, s * .08, s * .3); g.fillRect(s * .7, s * .74, s * .22, s * .1);
      g.fillStyle = 'rgba(240,225,200,.5)'; g.fillRect(s * .12, s * .66, s * .3, s * .05);
      var rf = g.createLinearGradient(0, 0, s, s); rf.addColorStop(0, 'rgba(200,220,235,.38)'); rf.addColorStop(.45, 'rgba(200,220,235,.12)'); rf.addColorStop(.5, 'rgba(255,255,255,.22)'); rf.addColorStop(.56, 'rgba(200,220,235,.06)'); rf.addColorStop(1, 'rgba(200,220,235,.0)');
      g.fillStyle = rf; g.fillRect(0, 0, s, s);
    });
  },
  mosaic: function (r) { // carrelage de piscine, petites tesselles turquoise et reflets de lumière
    return canvasTex(512, function (g, s) {
      var n = 32, w = s / n;
      for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
        g.fillStyle = 'hsl(' + rr(184, 192) + ',' + rr(55, 72) + '%,' + rr(52, 64) + '%)';
        g.fillRect(i * w + 1, j * w + 1, w - 2, w - 2);
      }
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2.2;
      for (var k = 0; k < 26; k++) { g.beginPath(); var x = rr(0, s), y = rr(0, s); g.moveTo(x, y); for (var q = 0; q < 5; q++) { x += rr(-60, 60); y += rr(-60, 60); g.quadraticCurveTo(x + rr(-30, 30), y + rr(-30, 30), x, y); } g.stroke(); }
    }, r);
  },
  pavers: function (r) { // pavés de pierre beige, posés à joints décalés
    return canvasTex(512, function (g, s) {
      g.fillStyle = '#8F8371'; g.fillRect(0, 0, s, s);
      var rows = 8, h = s / rows;
      for (var j = 0; j < rows; j++) {
        var off = (j % 2) * h, x = -off;
        while (x < s) {
          var w = h * 2, L = rr(-10, 10);
          g.fillStyle = 'rgb(' + [208 + L, 192 + L, 166 + L].map(Math.round).join(',') + ')';
          g.fillRect(x + 2, j * h + 2, w - 4, h - 4);
          for (var d = 0; d < 60; d++) { g.fillStyle = 'rgba(90,70,50,' + rr(.03, .09) + ')'; g.fillRect(x + rr(2, w - 4), j * h + rr(2, h - 4), 2, 2); }
          x += w;
        }
      }
    }, r);
  },
  garage: function () { // porte de garage à panneaux en pointe de diamant, comme sur les rendus
    return canvasTex(512, function (g, s) {
      g.fillStyle = '#3E4650'; g.fillRect(0, 0, s, s);
      var cols = 6, rows = 4, w = s / cols, h = s / rows;
      for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) {
        var x = i * w, y = j * h, cx = x + w / 2, cy = y + h / 2;
        [[x, y, x + w, y, '#5B6672'], [x + w, y, x + w, y + h, '#343B44'], [x + w, y + h, x, y + h, '#2A3038'], [x, y + h, x, y, '#4D5763']].forEach(function (t) {
          g.fillStyle = t[4]; g.beginPath(); g.moveTo(t[0], t[1]); g.lineTo(t[2], t[3]); g.lineTo(cx, cy); g.closePath(); g.fill();
        });
      }
    });
  },
  cloud: function () {
    var c = document.createElement('canvas'); c.width = 512; c.height = 256; var g = c.getContext('2d');
    for (var i = 0; i < 70; i++) {
      var x = rr(90, 422), y = rr(95, 175) - Math.sin((x - 90) / 332 * Math.PI) * rr(10, 55), r = rr(26, 62);
      var gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    var sh = g.createLinearGradient(0, 120, 0, 210); sh.addColorStop(0, 'rgba(235,238,244,0)'); sh.addColorStop(1, 'rgba(222,228,238,.35)');
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = sh; g.fillRect(0, 0, 512, 256);
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t;
  },
  ao: function () {
    var c = document.createElement('canvas'); c.width = c.height = 256; var g = c.getContext('2d');
    var gr = g.createRadialGradient(128, 128, 40, 128, 128, 128); gr.addColorStop(0, 'rgba(0,0,0,.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256); return new T.CanvasTexture(c);
  }
};

/* ---------- Moteur ---------- */
var renderer;
try { renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: BAKE }); }
catch (e) { return; }
var DPR = BAKE ? (window.devicePixelRatio || 1) : Math.min(window.devicePixelRatio || 1, 1.75);
renderer.setPixelRatio(DPR);
renderer.outputEncoding = T.sRGBEncoding;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = .5;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;
stage.appendChild(renderer.domElement); renderer.domElement.setAttribute('aria-hidden', 'true');

var scene = new T.Scene();
var camera = new T.PerspectiveCamera(30, 1, .5, 3000);

/* Soleil de fin de journée, venant de l'ouest-sud-ouest (x = est, z = sud) */
var sunDir = new T.Vector3(-.78, .3, .55).normalize();

var sky = null;
if (T.Sky) {
  sky = new T.Sky(); sky.scale.setScalar(4500);
  var u = sky.material.uniforms;
  u.turbidity.value = 7; u.rayleigh.value = 1.6; u.mieCoefficient.value = .006; u.mieDirectionalG.value = .86;
  u.sunPosition.value.copy(sunDir);
  scene.add(sky);
  var pm = new T.PMREMGenerator(renderer), envScene = new T.Scene(), sky2 = new T.Sky();
  sky2.scale.setScalar(4500); sky2.material.uniforms = u; envScene.add(sky2);
  scene.environment = pm.fromScene(envScene).texture;
} else scene.background = new T.Color(0xC9D6E0);
scene.fog = new T.Fog(0xCFCBBE, 180, 900);

var sun = new T.DirectionalLight(0xFFCF98, 3.0);
sun.position.copy(sunDir).multiplyScalar(100);
sun.castShadow = true;
var SM = SMALL ? 2048 : 4096; sun.shadow.mapSize.set(SM, SM);
var sc = sun.shadow.camera; sc.left = -44; sc.right = 44; sc.top = 40; sc.bottom = -40; sc.near = 30; sc.far = 220;
sun.shadow.bias = -.00025; sun.shadow.normalBias = .025;
scene.add(sun); scene.add(sun.target);
scene.add(new T.HemisphereLight(0xBFD3EA, 0x5E5A40, .45));

await pause();
/* ---------- Matériaux ---------- */
var M = {
  render: new T.MeshStandardMaterial({ color: 0xF4F2EE, map: TX.render([2, 2]), roughness: .92, envMapIntensity: .6 }),
  coping: new T.MeshStandardMaterial({ color: 0xDAD8D3, roughness: .7, envMapIntensity: .6 }),
  alu: new T.MeshStandardMaterial({ color: 0x2C2E31, roughness: .42, metalness: .6, envMapIntensity: .9 }),
  glass: new T.MeshStandardMaterial({ color: 0x8FA3B0, roughness: .04, metalness: .2, transparent: true, opacity: .2, envMapIntensity: .45, depthWrite: false }),
  glassSolid: new T.MeshStandardMaterial({ color: 0x14181B, roughness: .06, metalness: .55, envMapIntensity: .7 }),
  balcony: new T.MeshStandardMaterial({ color: 0xCFDCE3, roughness: .02, metalness: .3, transparent: true, opacity: .22, depthWrite: false, envMapIntensity: 1.4 }),
  interior: new T.MeshStandardMaterial({ color: 0x6B5E52, emissive: 0xFFB66A, emissiveIntensity: 1.7, roughness: 1 }),
  interiorDim: new T.MeshStandardMaterial({ color: 0x4A4744, emissive: 0xE8A868, emissiveIntensity: .9, roughness: 1 }),
  floorIn: new T.MeshStandardMaterial({ color: 0x9B8670, emissive: 0x9A6838, emissiveIntensity: .8, roughness: .8 }),
  tiles: new T.MeshStandardMaterial({ color: 0xFFFFFF, map: TX.tiles([6, 3]), roughness: .75 }),
  win: (function () { var t = TX.win(); return new T.MeshStandardMaterial({ color: 0xFFFFFF, map: t, emissive: 0xFFFFFF, emissiveMap: t, emissiveIntensity: .55, roughness: .08, metalness: .25, envMapIntensity: .6 }); })(),
  water: new T.MeshStandardMaterial({ color: 0x46B6C6, roughness: .03, metalness: .1, transparent: true, opacity: .5, depthWrite: false, envMapIntensity: 1.8 }),
  sheet: new T.MeshStandardMaterial({ color: 0x5CC0CD, emissive: 0x1F7C88, emissiveIntensity: .3, roughness: .05, metalness: .1, transparent: true, opacity: .85, envMapIntensity: 1.4 }),
  liner: (function () { var t = TX.mosaic([10, 4]); return new T.MeshStandardMaterial({ color: 0xFFFFFF, map: t, emissive: 0xFFFFFF, emissiveMap: t, emissiveIntensity: .22, roughness: .35, envMapIntensity: .5 }); })(),
  weir: new T.MeshStandardMaterial({ color: 0x7E8C93, roughness: .4, envMapIntensity: .7 }),
  inox: new T.MeshStandardMaterial({ color: 0xDADFE3, roughness: .22, metalness: .95, envMapIntensity: 1.2 }),
  pavers: new T.MeshStandardMaterial({ color: 0xFFFFFF, map: TX.pavers([6, 6]), roughness: .9 }),
  garage: new T.MeshStandardMaterial({ color: 0xFFFFFF, map: TX.garage(), roughness: .5, metalness: .35, envMapIntensity: .7 }),
  grass: new T.MeshStandardMaterial({ color: 0xFFFFFF, map: TX.grass([90, 90]), roughness: 1 }),
  gravel: new T.MeshStandardMaterial({ color: 0xFFFFFF, map: TX.gravel([2, 10]), roughness: 1 }),
  hedge: new T.MeshStandardMaterial({ color: 0xFFFFFF, map: TX.hedge([6, 1]), roughness: 1 }),
  bark: new T.MeshStandardMaterial({ color: 0x5A4A3A, roughness: 1 }),
  roof: new T.MeshStandardMaterial({ color: 0xA9A69F, map: TX.gravel([4, 4]), roughness: 1 })
};
function woodMat(rx, ry) { return new T.MeshStandardMaterial({ color: 0xFFFFFF, map: TX.wood([rx, ry]), roughness: .78, envMapIntensity: .5 }); }

function box(w, h, d, x, y, z, mat, opt) {
  var m = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
  m.position.set(x, y + h / 2, z);
  m.castShadow = !(opt && opt.noCast); m.receiveShadow = true;
  scene.add(m); return m;
}
/* Volume avec ouvertures réelles sur sa face sud (z1) : les baies sont creusées et l'intérieur est éclairé */
function volume(x0, x1, y0, y1, z0, z1, mat, openings, depth) {
  var zb = z1 - depth;
  box(x1 - x0, y1 - y0, zb - z0, (x0 + x1) / 2, y0, (z0 + zb) / 2, mat);
  var xs = [x0]; openings.forEach(function (o) { xs.push(o.x0, o.x1); }); xs.push(x1);
  for (var i = 0; i < xs.length - 1; i++) {
    var a = xs[i], b = xs[i + 1]; if (b - a < 1e-3) continue;
    var o = openings.filter(function (q) { return q.x0 <= a + 1e-3 && q.x1 >= b - 1e-3; })[0], cx = (a + b) / 2, zc = (zb + z1) / 2;
    if (!o) { box(b - a, y1 - y0, depth, cx, y0, zc, mat); continue; }
    if (o.y0 > y0) box(b - a, o.y0 - y0, depth, cx, y0, zc, mat);
    if (o.y1 < y1) box(b - a, y1 - o.y1, depth, cx, o.y1, zc, mat);
    var w = b - a, h = o.y1 - o.y0;
    box(w, h, .03, cx, o.y0, z1 - .16, M.win, { noCast: true });
    var n = Math.max(2, Math.round(w / 1.7));
    for (var k = 0; k <= n; k++) box(.07, h, .1, a + k * (w / n), o.y0, z1 - .12, M.alu);
    box(w, .08, .12, cx, o.y1 - .08, z1 - .12, M.alu); box(w, .06, .12, cx, o.y0, z1 - .12, M.alu);
  }
}

await pause();
/* ---------- Terrain et horizon ----------
   La maison est celle d'une vue 3D de l'atelier : villa à étage sous un grand toit à une pente,
   balcon filant, terrasse en bois et piscine. Façade principale vers +z (le sud), x le long de la façade. */
function sm(t) { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); }
// terrain plat devant la maison, qui remonte en coteau derrière
function groundAt(z) { return 3.2 * sm((-z - 10) / 14); }
(function () {
  var g = new T.PlaneGeometry(1200, 1200, 1, 300); g.rotateX(-Math.PI / 2);
  var p = g.attributes.position;
  for (var i = 0; i < p.count; i++) p.setY(i, groundAt(p.getZ(i)));
  g.computeVertexNormals();
  var m = new T.Mesh(g, M.grass); m.receiveShadow = true; scene.add(m);
})();
(function () { // coteaux lointains
  var g = new T.PlaneGeometry(2200, 2200, 180, 180); g.rotateX(-Math.PI / 2);
  var p = g.attributes.position;
  for (var i = 0; i < p.count; i++) {
    var x = p.getX(i), z = p.getZ(i), d = Math.hypot(x, z);
    var k = Math.min(1, Math.max(0, (d - 170) / 260));
    p.setY(i, (Math.sin(x * .009) * 10 + Math.sin(z * .007 + 1.3) * 14 + Math.sin((x + z) * .018) * 5 + 16) * k - .3 + groundAt(z) * (1 - k));
  }
  g.computeVertexNormals();
  scene.add(new T.Mesh(g, new T.MeshStandardMaterial({ color: 0x6E7A4E, roughness: 1 })));
})();
(function () { // bosquets au loin
  for (var i = 0; i < 80; i++) {
    var a = rr(-1.4, 2.1), d = rr(180, 380), x = Math.sin(a) * d, z = -Math.cos(a) * d;
    var k = Math.min(1, Math.max(0, (d - 170) / 260));
    var s = new T.Mesh(new T.SphereGeometry(rr(4, 8), 12, 8), new T.MeshStandardMaterial({ color: new T.Color().setHSL(rr(.2, .26), .32, rr(.13, .2)), roughness: 1 }));
    s.position.set(x, rr(2, 5) + k * 16, z); s.scale.y = rr(.7, 1); scene.add(s);
  }
})();

await pause();
/* ---------- La villa ---------- */
function B(x0, x1, y0, y1, z0, z1, mat, opt) { return box(x1 - x0, y1 - y0, z1 - z0, (x0 + x1) / 2, y0, (z0 + z1) / 2, mat, opt); }
var MX = {
  grey: new T.MeshStandardMaterial({ color: 0xA7A9AA, map: TX.render([2, 2]), roughness: .92, envMapIntensity: .6 }),
  slab: new T.MeshStandardMaterial({ color: 0x3E4144, roughness: .7, envMapIntensity: .6 }),
  post: new T.MeshStandardMaterial({ color: 0x3A3836, roughness: .5, metalness: .5, envMapIntensity: .8 }),
  soffit: new T.MeshStandardMaterial({ color: 0x5A5D60, roughness: .85, envMapIntensity: .5 }),
  roofTop: new T.MeshStandardMaterial({ color: 0x9A9894, roughness: .9 }),
  deck: new T.MeshStandardMaterial({ color: 0xFFFFFF, map: TX.wood([10, 6], [192, 170, 142]), roughness: .8, envMapIntensity: .5 }),
  cloth: new T.MeshStandardMaterial({ color: 0xF6F5F1, roughness: .85 }),
  wood2: new T.MeshStandardMaterial({ color: 0xB08A5E, roughness: .7 })
};
var X0 = -7, X1 = 7, ZB = -9, ZF = 0, DY = .6;      // volume principal 14 × 9 m, posé sur la terrasse
var RB = -9.8, RF = 3.4, YB = 6.55, YF = 8.35;       // toit : bords arrière et avant, sous-face
function roofY(z) { return YB + (z - RB) * (YF - YB) / (RF - RB); }
// volume principal : profil latéral extrudé sur la longueur, le haut suit la pente du toit
(function () {
  var s = new T.Shape(), y0 = 0;
  s.moveTo(-ZF, y0); s.lineTo(-ZB, y0); s.lineTo(-ZB, roofY(ZB) - .03); s.lineTo(-ZF, roofY(ZF) - .03); s.lineTo(-ZF, y0);
  var g = new T.ExtrudeGeometry(s, { depth: X1 - X0, bevelEnabled: false });
  g.rotateY(Math.PI / 2); g.translate(X0, 0, 0);
  var m = new T.Mesh(g, [MX.grey, M.render]); m.castShadow = m.receiveShadow = true; scene.add(m);
})();
// baies vitrées du rez-de-chaussée, sur la terrasse
function bayF(x0, x1, y0, y1, z) {
  var w = x1 - x0, h = y1 - y0, cx = (x0 + x1) / 2;
  B(x0, x1, y0, y1, z - .02, z + .02, M.win, { noCast: true });
  var n = Math.max(1, Math.round(w / 1.5));
  for (var k = 0; k <= n; k++) B(x0 + k * w / n - .035, x0 + k * w / n + .035, y0, y1, z, z + .06, M.alu, { noCast: true });
  B(x0 - .03, x1 + .03, y1 - .07, y1, z, z + .07, M.alu, { noCast: true });
}
bayF(-4.5, -1.3, DY, DY + 2.3, ZF); bayF(-.6, 2.6, DY, DY + 2.3, ZF); bayF(3.3, 6.4, DY, DY + 2.3, ZF);
// fenêtres de l'étage, sur le balcon
var UF = DY + 2.95;
[[-4.6, -2.5], [-1.3, .7], [1.9, 3.7], [4.6, 6.4]].forEach(function (w) { bayF(w[0], w[1], UF, UF + 2.15, ZF); });
// dalle du balcon, filante, et garde-corps inox
B(X0 - .2, 9.4, DY + 2.55, UF, ZF, 2.0, MX.slab);
(function () {
  var y = UF, h = 1.0;
  B(X0 - .2, 9.4, y + h - .05, y + h, 1.92, 1.98, M.inox, { noCast: true });
  for (var r = 1; r <= 4; r++) B(X0 - .2, 9.4, y + r * .2, y + r * .2 + .025, 1.94, 1.96, M.inox, { noCast: true });
  for (var x = X0 - .2; x <= 9.41; x += 1.6) B(x - .025, x + .025, y, y + h, 1.92, 1.98, M.inox, { noCast: true });
  [X0 - .2, 9.4].forEach(function (x) { B(x - .025, x + .025, y + h - .05, y + h, ZF, 1.98, M.inox, { noCast: true }); for (var r = 1; r <= 4; r++) B(x - .015, x + .015, y + r * .2, y + r * .2 + .025, ZF, 1.98, M.inox, { noCast: true }); });
})();
// grand toit à une pente, en débord sur des poteaux fins
(function () {
  var L = Math.hypot(RF - RB, YF - YB), ang = Math.atan2(YF - YB, RF - RB), t = .24;
  var g = new T.BoxGeometry(X1 - X0 + 4.2, t, L);
  var m = new T.Mesh(g, [M.coping, M.coping, MX.roofTop, MX.soffit, M.coping, M.coping]);
  m.rotation.x = -ang; m.position.set((X0 + X1 + 4.2) / 2 - 1.1 + .0, (YB + YF) / 2 + t / 2 * Math.cos(ang), (RB + RF) / 2);
  m.castShadow = true; m.receiveShadow = true; scene.add(m);
  [-6.2, -1.3, 3.7, 8.7].forEach(function (x) {
    var zp = 2.65, h = roofY(zp) - DY;
    var c = new T.Mesh(new T.CylinderGeometry(.085, .085, h, 10), MX.post);
    c.position.set(x, DY + h / 2, zp); c.castShadow = true; scene.add(c);
  });
})();
// façade latérale ouest : petites fenêtres verticales, porte et escalier extérieur
function winX(z0, z1, y0, y1) { B(X0 - .04, X0 + .01, y0, y1, z0, z1, M.win, { noCast: true }); B(X0 - .07, X0 - .02, y1 - .06, y1, z0 - .03, z1 + .03, M.alu, { noCast: true }); }
winX(-2.2, -1.6, UF + .6, UF + 1.9); winX(-3.6, -3.0, UF + .6, UF + 1.9);
winX(-2.2, -1.6, DY + .9, DY + 2.0); winX(-4.3, -3.4, DY, DY + 2.15);
(function () { // escalier qui monte vers l'arrière, le long du pignon
  var n = 14, z0 = -1.2, run = .42;
  for (var i = 0; i < n; i++) { var y = DY + (i + 1) * (2.6 / n), z = z0 - i * run; B(X0 - 1.3, X0 - .05, Math.max(0, y - .2), y, z - run, z, M.coping); }
  B(X0 - 1.36, X0 - 1.3, DY + 1, DY + 1.04 + 2.6, z0 - n * run, z0, M.alu);
})();

await pause();
// terrasse en bois surélevée, avec la piscine creusée dedans
var PX0 = 0, PX1 = 10, PZ0 = 6.2, PZ1 = 11.2;
B(-9.5, 16.5, 0, DY, ZF, PZ0, MX.deck); B(-9.5, PX0, 0, DY, PZ0, PZ1, MX.deck); B(PX1, 16.5, 0, DY, PZ0, PZ1, MX.deck); B(-9.5, 16.5, 0, DY, PZ1, 13.2, MX.deck);
B(-9.5, 16.5, 0, DY, ZB, ZF, MX.deck, { noCast: true });                     // terrasse sous la maison et sur les côtés
B(PX0, PX1, .02, .06, PZ0, PZ1, M.liner, { noCast: true });
B(PX0, PX0 + .03, .06, DY - .06, PZ0, PZ1, M.liner, { noCast: true }); B(PX1 - .03, PX1, .06, DY - .06, PZ0, PZ1, M.liner, { noCast: true });
B(PX0 + .03, PX1 - .03, .06, DY - .06, PZ0, PZ0 + .03, M.liner, { noCast: true }); B(PX0 + .03, PX1 - .03, .06, DY - .06, PZ1 - .03, PZ1, M.liner, { noCast: true });
B(PX0, PX1, DY - .14, DY - .12, PZ0, PZ1, M.water, { noCast: true });
// margelles
B(PX0 - .3, PX1 + .3, DY, DY + .05, PZ0 - .3, PZ0, M.coping, { noCast: true }); B(PX0 - .3, PX1 + .3, DY, DY + .05, PZ1, PZ1 + .3, M.coping, { noCast: true });
B(PX0 - .3, PX0, DY, DY + .05, PZ0, PZ1, M.coping, { noCast: true }); B(PX1, PX1 + .3, DY, DY + .05, PZ0, PZ1, M.coping, { noCast: true });
// échelle inox
[1.3, 1.8].forEach(function (x) {
  B(x, x + .04, .3, DY + .75, PZ0 + .05, PZ0 + .09, M.inox, { noCast: true });
  B(x, x + .04, DY + .71, DY + .75, PZ0 - .45, PZ0 + .09, M.inox, { noCast: true });
  B(x, x + .04, DY, DY + .75, PZ0 - .45, PZ0 - .41, M.inox, { noCast: true });
});
// transats et table
function lounger(x, z) {
  B(x - .33, x + .33, DY + .32, DY + .38, z - .2, z + 1.1, MX.cloth);
  var b = new T.Mesh(new T.BoxGeometry(.66, .06, .8), MX.cloth); b.position.set(x, DY + .62, z - .5); b.rotation.x = .75; b.castShadow = true; scene.add(b);
  [[-.28, -.15], [.28, -.15], [-.28, 1.0], [.28, 1.0]].forEach(function (l) { B(x + l[0] - .02, x + l[0] + .02, DY, DY + .33, z + l[1] - .02, z + l[1] + .02, MX.wood2, { noCast: true }); });
}
lounger(-6.6, 6.8); lounger(-4.6, 6.8); lounger(-2.6, 6.8);
B(12.2, 14.4, DY + .72, DY + .77, .9, 1.8, MX.cloth); [[12.35, 1.0], [14.25, 1.0], [12.35, 1.7], [14.25, 1.7]].forEach(function (l) { B(l[0] - .03, l[0] + .03, DY, DY + .72, l[1] - .03, l[1] + .03, MX.cloth, { noCast: true }); });
B(12.2, 14.4, DY + .42, DY + .46, .35, .65, MX.cloth); B(12.2, 14.4, DY + .42, DY + .46, 2.05, 2.35, MX.cloth);
// mur de soutènement du coteau, derrière la terrasse à droite
B(9.4, 16.5, 0, 1.9, ZB - .3, ZB, M.render);

await pause();
/* ---------- Végétation : feuillage en milliers de touffes ---------- */
var clumpGeo = new T.IcosahedronGeometry(1, 1);
var leafMat = new T.MeshStandardMaterial({ color: 0xFFFFFF, roughness: .92, flatShading: false });
var tmpO = new T.Object3D(), tmpC = new T.Color();
function foliage(cx, cy, cz, h, shape, count, size, hue, sat, lum) {
  var im = new T.InstancedMesh(clumpGeo, leafMat, count);
  for (var i = 0; i < count; i++) {
    var u = Math.pow(rnd(), .85), a = rr(0, Math.PI * 2), rad = shape(u) * Math.sqrt(rr(.35, 1));
    tmpO.position.set(cx + Math.cos(a) * rad, cy + u * h, cz + Math.sin(a) * rad);
    var sc = size * rr(.6, 1.15); tmpO.scale.set(sc, sc * rr(.7, 1), sc);
    tmpO.rotation.set(rr(0, 3), rr(0, 3), rr(0, 3)); tmpO.updateMatrix(); im.setMatrixAt(i, tmpO.matrix);
    var outer = rad / Math.max(.01, shape(u));
    tmpC.setHSL(hue + rr(-.02, .02), sat * rr(.85, 1.1), lum * (.55 + .45 * u) * (.75 + .35 * outer) * rr(.85, 1.15));
    im.setColorAt(i, tmpC);
  }
  im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
  im.castShadow = true; im.receiveShadow = true; scene.add(im); return im;
}
function trunk(x, z, h, r) { var y0 = groundAt(z); var t = new T.Mesh(new T.CylinderGeometry(r * .6, r, h, 7), M.bark); t.position.set(x, y0 + h / 2, z); t.castShadow = true; scene.add(t); }
function tree(x, z, h, r, hue, lum) {
  trunk(x, z, h * .55, r * .09);
  foliage(x, groundAt(z) + h * .45, z, r * 1.9, function (u) { return r * Math.sin(Math.PI * Math.min(1, u * 1.05 + .08)) * 1.05; }, 1500, r * .14, hue, .45, lum);
}
function olive(x, z) {
  trunk(x, z, 1.5, .2);
  foliage(x, groundAt(z) + 1.3, z, 1.8, function (u) { return 1.5 * Math.sin(Math.PI * (u * .9 + .1)); }, 700, .17, .2, .18, .34);
}
function cypress(x, z, h) {
  trunk(x, z, 1, .14);
  foliage(x, groundAt(z) + .4, z, h, function (u) { return .85 * Math.sin(Math.PI * Math.min(1, .15 + u * .9)) * (1 - u * .55); }, 900, .17, .28, .42, .19);
}
function bush(x, z, r, hue, sat, lum, y0) { foliage(x, (y0 === undefined ? groundAt(z) : y0), z, r * 1.3, function (u) { return r * Math.sin(Math.PI * (u * .8 + .2)); }, 160, r * .22, hue, sat, lum); }
function roses(x, z, r, hue) {
  bush(x, z, r, .31, .42, .24);
  foliage(x, groundAt(z) + r * .35, z, r * 1.05, function (u) { return r * .95 * Math.sin(Math.PI * (u * .75 + .25)); }, 80, r * .1, hue, .7, .6);
}
await pause();
// grands arbres derrière la maison, sur le coteau
tree(-15, -17, 7, 5, .27, .17); tree(-4, -21, 7.5, 5.4, .26, .16); tree(8, -20, 7, 5.2, .27, .18); tree(19, -17, 6.5, 4.8, .25, .19);
tree(-26, -8, 5.5, 4.2, .27, .2); tree(29, -6, 5.5, 4, .26, .21); tree(-28, 14, 4.4, 3.4, .25, .24);
for (var ci = 0; ci < 4; ci++) cypress(-14.5, -8 + ci * 3.1, rr(8, 10.5));
olive(23, 10); olive(-15, 17);
// massifs au bord de la terrasse
var fl = [.94, .14, .94, .9, .14, .94, .14];
for (var bi = 0; bi < 7; bi++) roses(-8 + bi * 4, 14.2, .75, fl[bi]);

(function () { // quelques nuages, loin derrière la maison
  var ct = TX.cloud();
  [[-300, 92, -700, 260], [-40, 110, -760, 320], [210, 88, -700, 240], [420, 104, -600, 280], [-560, 80, -520, 220], [90, 70, -640, 170]].forEach(function (c) {
    var sp = new T.Sprite(new T.SpriteMaterial({ map: ct, transparent: true, depthWrite: false, fog: false, toneMapped: false, opacity: .8 }));
    sp.position.set(c[0], c[1], c[2]); sp.scale.set(c[3], c[3] / 2, 1); scene.add(sp);
  });
})();

await pause();
/* ---------- Caméra : lent travelling, sans interaction ---------- */
var CAM = { az: -.38, el: .17, R: 36, cx: 3, cy: 3.6, cz: 2.5, sx: 0, sy: 0 };
// sx / sy décalent le cadrage : la maison se place en haut à droite, le titre en bas à gauche
function fit() {
  var w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h;
  var narrow = camera.aspect < 1.1;
  camera.fov = narrow ? 44 : 32; camera.updateProjectionMatrix();
  CAM.R = narrow ? 46 : 41; CAM.sx = narrow ? 0 : 7; CAM.sy = narrow ? -1.2 : -2.6;
}
function place(t) {
  var k = REDUCE ? 0 : sm((t - 3.5) / 8); // immobile pendant le fondu, puis le travelling démarre en douceur
  var tt = Math.max(0, t - 3.5);
  var a = CAM.az + Math.sin(tt * .045) * .07 * k, r = CAM.R - (1 - Math.cos(tt * .03)) * 1.2 * k;
  camera.position.set(CAM.cx + Math.sin(a) * Math.cos(CAM.el) * r, CAM.cy + Math.sin(CAM.el) * r, CAM.cz + Math.cos(a) * Math.cos(CAM.el) * r);
  var rx = Math.cos(a), rz = -Math.sin(a);
  camera.lookAt(CAM.cx - rx * CAM.sx, CAM.cy + CAM.sy, CAM.cz - rz * CAM.sx);
}
window.addEventListener('resize', function () { fit(); place((performance.now() - t0) / 1000); renderer.render(scene, camera); });
var t0 = performance.now();
fit(); place(0);
renderer.shadowMap.needsUpdate = true;
await pause();
renderer.compile(scene, camera);
await pause();
renderer.render(scene, camera);
requestAnimationFrame(function () { frame.classList.add('ready'); });

/* Vue de la terrasse pour la vitrine, calculée une seule fois */
(function () {
  var img = $('#still'); if (!img || !BAKE) return;
  var w = SMALL ? 1000 : 1500, h = Math.round(w * .72);
  renderer.setPixelRatio(1); renderer.setSize(w, h, false);
  var cam2 = new T.PerspectiveCamera(44, w / h, .5, 3000);
  cam2.position.set(-7, 1.9, 21); cam2.lookAt(-1.2, 2.9, 3);
  renderer.render(scene, cam2);
  try { img.src = renderer.domElement.toDataURL('image/jpeg', .9); img.hidden = false; } catch (e) { }
  renderer.setPixelRatio(DPR); fit(); place(0); renderer.render(scene, camera);
})();

var visible = true, last = 0;
if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(stage);
function loop(now) {
  requestAnimationFrame(loop);
  if (!visible || REDUCE || document.hidden) return;
  if (SMALL && now - last < 32) return;
  last = now;
  place((now - t0) / 1000); renderer.render(scene, camera);
}
requestAnimationFrame(loop);
window.__ready = true;
}
function loadJS(src) { return new Promise(function (ok, ko) { var e = document.createElement('script'); e.src = src; e.onload = ok; e.onerror = ko; document.head.appendChild(e); }); }
function boot() {
  if (window.THREE) return start3D();
  loadJS('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js')
    .then(function () { return loadJS('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/objects/Sky.js'); })
    .then(function () { if (window.requestIdleCallback) requestIdleCallback(start3D, { timeout: 1000 }); else setTimeout(start3D, 200); })
    .catch(function () { /* l'image du rendu reste affichée */ });
}
if (BAKE) boot();
else if (LIVE) {
  // le rendu en direct démarre une fois la page chargée ; l'image du rendu reste affichée en attendant
  var go = function () { setTimeout(boot, 1200); };
  if (document.readyState === 'complete') go(); else window.addEventListener('load', go);
}
})();
