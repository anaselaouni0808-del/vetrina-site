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
    pc: { t: 'Villa sur sous-sol et piscine', m: 'Villa contemporaine, Lot-et-Garonne',
      d: 'Une villa posée sur la pente. Les pièces de vie s’ouvrent sur une grande terrasse et une piscine de 10 mètres, construites au-dessus d’un sous-sol qui accueille le garage et une réserve de près de 200 m².',
      f: [['Chambres', '4'], ['Salon', '60 m²'], ['Cuisine', '28 m²'], ['Piscine', '10 × 4 m'], ['Réserve en sous-sol', '196 m²']],
      v: seq('pc', 'v', 4), p: seq('pc', 'p', 5),
      vn: ['Façade sur la piscine', 'Terrasse couverte et escalier extérieur', 'Entrée côté jardin', 'Façade latérale'],
      pn: ['Plan du rez-de-chaussée', 'Plan du sous-sol', 'Façades latérale et principale', 'Façades latérale et arrière', 'Plan de masse'] },
    pa: { t: 'Villa avec étage et piscine', m: 'Villa, Lot-et-Garonne',
      d: 'Une maison en L sous toitures de tuiles, avec une chambre à l’étage ouverte sur un toit-terrasse. Le séjour de 78 m² donne sur la piscine et la terrasse.',
      f: [['Chambres', '4 + 1 à l’étage'], ['Séjour', '78 m²'], ['Garage', 'Oui'], ['Piscine', 'Oui']],
      v: seq('pa', 'v', 7), p: seq('pa', 'p', 3),
      vn: ['Façade d’entrée', 'Entrée et garage', 'Terrasse et piscine', 'Façade sur jardin', 'Vue d’ensemble sur la piscine', 'Façade latérale', 'Vue aérienne'],
      pn: ['Plan du rez-de-chaussée', 'Plan de l’étage', 'Plan des toitures'] },
    pb: { t: 'Maison de plain-pied', m: 'Maison individuelle, Lot-et-Garonne',
      d: 'Trois volumes sous toitures à quatre pentes, autour d’un séjour de 79 m² ouvert sur une grande terrasse. Les chambres sont regroupées d’un côté, le garage de l’autre.',
      f: [['Chambres', '4'], ['Séjour', '79 m²'], ['Garage', 'Oui']],
      v: seq('pb', 'v', 5), p: seq('pb', 'p', 3),
      vn: ['Façade d’entrée', 'Terrasse côté jardin', 'Terrasse et séjour', 'Façade sur jardin', 'Façade latérale'],
      pn: ['Plan du rez-de-chaussée', 'Façades principale et arrière', 'Façades latérales'] },
    pd: { t: 'Maison individuelle', m: 'Beaupuy, Lot-et-Garonne',
      d: 'Une maison de plain-pied de 138 m² sur un terrain de 601 m². La vue montre le projet inséré dans la photo du terrain, comme dans le dossier de permis de construire.',
      f: [['Surface habitable', '138 m²'], ['Chambres', '4'], ['Séjour et cuisine', '56 m²'], ['Garage', '17 m²'], ['Terrain', '601 m²'], ['Permis de construire', '2021']],
      v: seq('pd', 'v', 1), p: seq('pd', 'p', 3),
      vn: ['Insertion dans le site'],
      pn: ['Plan du rez-de-chaussée', 'Façade sud', 'Coupe longitudinale'] },
    pe: { t: 'Deux logements', m: 'Castelnau-sur-Gupie, Lot-et-Garonne',
      d: 'Deux maisons mitoyennes de 85 m² chacune, avec trois chambres et un garage. Le projet est présenté dans son terrain, tel qu’il figurait au dossier de permis de construire.',
      f: [['Logements', '2'], ['Surface par logement', '85 m²'], ['Chambres par logement', '3'], ['Séjour et cuisine', '36 m²'], ['Permis de construire', '2021']],
      v: seq('pe', 'v', 2), p: seq('pe', 'p', 2),
      vn: ['Insertion dans le site', 'Vue 3D'],
      pn: ['Plan du rez-de-chaussée', 'Façade sud-ouest'] }
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
    stage.classList.toggle('plan', set === 'p');
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
    tPlans.hidden = !cur.p.length;
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
  wood: function (r) {
    return canvasTex(512, function (g, s) {
      var n = 12, w = s / n;
      for (var i = 0; i < n; i++) {
        var L = rr(-14, 14);
        g.fillStyle = 'rgb(' + [150 + L, 108 + L * .8, 72 + L * .6].map(Math.round).join(',') + ')'; g.fillRect(i * w, 0, w, s);
        for (var k = 0; k < 26; k++) {
          g.strokeStyle = 'rgba(70,45,25,' + rr(.05, .18) + ')'; g.lineWidth = rr(.5, 1.6);
          var x = i * w + rr(2, w - 2); g.beginPath(); g.moveTo(x, 0);
          for (var y = 0; y <= s; y += 32) g.lineTo(x + Math.sin(y * .02 + k) * rr(.5, 2.5), y);
          g.stroke();
        }
        g.fillStyle = 'rgba(30,20,12,.55)'; g.fillRect(i * w, 0, 2, s);
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
      for (i = 0; i < 40; i++) { g.fillStyle = 'rgba(160,150,80,' + rr(.04, .1) + ')'; g.beginPath(); g.arc(rr(0, s), rr(0, s), rr(20, 60), 0, 7); g.fill(); }
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
  water: new T.MeshStandardMaterial({ color: 0x2A8A96, emissive: 0x0B4650, emissiveIntensity: .35, roughness: .02, metalness: .25, envMapIntensity: 1.5 }),
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
/* ---------- Terrain en pente et horizon ----------
   La maison est celle d'un projet de l'atelier (villa sur sous-sol, plans RDC et sous-sol).
   Coordonnées du plan : x de 0 à 27,87 m (cuisine à gauche du plan), z de 0 (côté piscine) vers l'arrière.
   Monde : la façade piscine regarde +z, le plan est tourné de 180° pour retrouver la vue des rendus. */
var PX = 13.9, PZ = 7;
function wx(x) { return PX - x; }
function wz(z) { return PZ - z; }
function sm(t) { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); }
function groundAt(worldZ) { var z = PZ - worldZ; return 3.0 * sm((z - 1.0) / 14); }
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
/* ---------- La villa, d'après les plans ---------- */
// bloc en coordonnées du plan
function pbox(x0, x1, z0, z1, y0, y1, mat, opt) { return box(x1 - x0, y1 - y0, z1 - z0, wx((x0 + x1) / 2), y0, wz((z0 + z1) / 2), mat, opt); }
// ouverture sur une face « avant » (plan z = zf, regardant la piscine) ou « arrière »
function bayZ(x0, x1, zf, y0, y1, back) {
  var s = back ? -1 : 1, z = wz(zf) + s * .035, w = x1 - x0, cx = wx((x0 + x1) / 2), h = y1 - y0;
  box(w, h, .05, cx, y0, z, M.win, { noCast: true });
  var n = Math.max(1, Math.round(w / 1.2));
  for (var k = 0; k <= n; k++) box(.06, h, .09, wx(x0 + k * (w / n)), y0, z + s * .02, M.alu, { noCast: true });
  box(w + .06, .07, .1, cx, y1 - .07, z + s * .02, M.alu, { noCast: true }); box(w + .06, .06, .1, cx, y0, z + s * .02, M.alu, { noCast: true });
}
function bayX(xf, z0, z1, y0, y1, left) { // sur une face latérale (plan x = xf)
  var s = left ? 1 : -1, x = wx(xf) + s * .035, d = z1 - z0, cz = wz((z0 + z1) / 2), h = y1 - y0;
  box(.05, h, d, x, y0, cz, M.win, { noCast: true });
  var n = Math.max(1, Math.round(d / 1.2));
  for (var k = 0; k <= n; k++) box(.09, h, .06, x + s * .02, y0, wz(z0 + k * (d / n)), M.alu, { noCast: true });
  box(.1, .07, d + .06, x + s * .02, y1 - .07, cz, M.alu, { noCast: true });
}
var L0 = 3.0, L1 = 3.25; // niveau du rez-de-chaussée (dessus de dalle)
// Sous-sol : aile droite, partie centrale en retrait, bassin de la piscine en saillie
pbox(22.15, 27.87, .3, 13.4, 0, L1, M.render);
pbox(0, 22.15, 2.0, 13.4, 0, L0, M.render);
pbox(8.7, 19.5, 0, 2.0, 0, L0, M.render);
// ouvertures du sous-sol
pbox(.6, 5.2, 1.94, 2.0, 0, 2.45, M.alu, { noCast: true });            // porte de garage
for (var gi = 0; gi < 6; gi++) pbox(.6, 5.2, 1.9, 1.94, .3 + gi * .36, .32 + gi * .36, M.coping, { noCast: true });
bayZ(6.2, 7.8, 2.0, 0, 2.2);                                            // porte vitrée
bayZ(20.0, 21.6, 2.0, 1.1, 2.2);
bayZ(23.4, 25.4, .3, 1.0, 2.2);
// dalle du rez-de-chaussée, terrasse et piscine à débordement
pbox(0, 8.7, 0, 6.3, L0, L1, M.tiles);
pbox(19.5, 22.15, 0, 6.3, L0, L1, M.tiles);
pbox(8.7, 19.5, 4.0, 6.3, L0, L1, M.tiles);
pbox(8.7, 9.075, 0, 4.0, L0, L1, M.tiles);
pbox(19.075, 19.5, 0, 4.0, L0, L1, M.tiles);
pbox(9.075, 19.075, .04, 4.0, L0 - .2, L1 - .03, M.water, { noCast: true });
pbox(9.0, 19.15, 0, .04, L0 - .25, L0 - .05, M.alu, { noCast: true });   // goulotte de débordement
// garde-corps vitrés
function glass(x0, x1, z0, z1) { pbox(x0, x1, z0, z1, L1, L1 + 1.0, M.balcony, { noCast: true }); }
glass(0, 8.7, -.02, .03); glass(19.5, 22.15, -.02, .03); glass(-.03, .02, 0, 3.16);
pbox(0, 8.7, -.04, .05, L1 + .98, L1 + 1.03, M.alu); pbox(19.5, 22.15, -.04, .05, L1 + .98, L1 + 1.03, M.alu);
// volumes du rez-de-chaussée (hauteurs relevées sur les façades)
var blocks = [
  [0, 6.0, 3.16, 9.16, 6.55],      // cuisine
  [6.0, 15.0, 6.3, 13.4, 7.0],     // salon
  [15.0, 22.15, 6.3, 13.4, 7.0],   // chambres
  [22.15, 27.87, .3, 13.4, 6.75],  // aile des chambres
  [4.6, 10.1, 13.4, 17.1, 6.55]    // entrée et escalier
];
blocks.forEach(function (b) {
  pbox(b[0], b[1], b[2], b[3], b[0] > 22 ? L1 : L1, b[4], M.render);
  pbox(b[0] - .12, b[1] + .12, b[2] - .12, b[3] + .12, b[4], b[4] + .22, M.coping);
  pbox(b[0] + .1, b[1] - .1, b[2] + .1, b[3] - .1, b[4] + .22, b[4] + .26, M.roof, { noCast: true });
});
// baies côté piscine
bayZ(1.3, 3.45, 3.16, L1, L1 + 2.15); bayZ(3.65, 5.8, 3.16, L1, L1 + 2.15);
bayZ(7.5, 9.9, 6.3, L1, L1 + 2.15); bayZ(10.1, 12.5, 6.3, L1, L1 + 2.15);
bayZ(15.9, 17.7, 6.3, L1, L1 + 2.15); bayZ(18.6, 20.4, 6.3, L1, L1 + 2.15);
bayZ(23.6, 25.4, .3, L1 + .95, L1 + 2.15);
bayX(22.15, 1.2, 3.0, L1, L1 + 2.15);
// façades latérales et arrière
bayX(27.87, 2.0, 3.8, L1 + .95, L1 + 2.15, true); bayX(27.87, 7.4, 9.0, L1 + .95, L1 + 2.15, true); bayX(27.87, 10.6, 11.8, L1 + .95, L1 + 2.15, true);
bayZ(16.0, 17.5, 13.4, L1 + .95, L1 + 2.15, true); bayZ(19.0, 20.5, 13.4, L1 + .95, L1 + 2.15, true); bayZ(23.2, 24.7, 13.4, L1 + .95, L1 + 2.15, true);
bayZ(6.4, 7.4, 17.1, L1, L1 + 2.15, true);
bayX(0, 4.4, 6.0, L1 + .9, L1 + 2.15);
// auvent sur colonnes devant la cuisine (terrasse couverte et garage)
pbox(-.25, 6.25, -.45, 3.16, 6.33, 6.55, M.coping);
[[.45, .05], [5.55, .05]].forEach(function (c) { var m = pbox(c[0] - .11, c[0] + .11, c[1] - .11, c[1] + .11, 0, 6.33, M.coping); });
// escalier extérieur le long de la façade du garage
(function () {
  var n = 17;
  for (var i = 0; i < n; i++) {
    var z0 = 1.2 + i * .47, y = (i + 1) * (L0 / n);
    pbox(-1.25, -.05, z0, z0 + .47, Math.max(0, y - .18), y, M.coping);
  }
  pbox(-1.32, -1.26, 1.2, 1.2 + n * .47, L0 + 1.0, L0 + 1.04, M.alu); // main courante (simplifiée)
  for (i = 0; i <= n; i += 2) { var zz = 1.2 + i * .47; pbox(-1.31, -1.27, zz, zz + .04, (i * L0 / n), (i * L0 / n) + 1.02, M.alu, { noCast: true }); }
})();
// cour pavée devant le garage
pbox(-2.0, 9.0, -9.0, 2.0, 0, .03, M.tiles, { noCast: true });

await pause();
/* ---------- Végétation : feuillage en milliers de touffes ---------- */
var clumpGeo = new T.IcosahedronGeometry(1, 1);
var leafMat = new T.MeshStandardMaterial({ color: 0xFFFFFF, roughness: .92, flatShading: false });
var tmpO = new T.Object3D(), tmpC = new T.Color();
// shape(u) renvoie le rayon horizontal à la hauteur relative u (0 bas, 1 haut)
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
function bush(x, z, r, hue, sat, lum) { foliage(x, groundAt(z), z, r * 1.3, function (u) { return r * Math.sin(Math.PI * (u * .8 + .2)); }, 160, r * .22, hue, sat, lum); }
await pause();
// grands arbres derrière la maison, sur le haut du terrain
tree(-4, -16, 5, 4, .24, .3); tree(8, -18, 5.5, 4.2, .25, .27); tree(22, -12, 4.8, 3.8, .23, .31);
tree(-20, -6, 4.5, 3.6, .25, .28); tree(30, 4, 4, 3.4, .23, .32); tree(-26, 12, 4, 3.2, .24, .3);
// oliviers et cyprès sur le jardin bas
olive(-9, 13); olive(4, 15.5); olive(-20, 4);
for (var ci = 0; ci < 5; ci++) cypress(-21.5, -8 + ci * 3.2, rr(8, 10.5));
// massifs le long de la façade et lavandes devant la cour
for (var bi = 0; bi < 6; bi++) bush(-12 + bi * 2.6, 8.4, .8, .33, .4, .26);
for (var lv = 0; lv < 8; lv++) bush(16.6, -1 + lv * 1.05, .42, .72, .22, .42);
(function () { // ombre de contact au pied de la maison
  var m = new T.Mesh(new T.PlaneGeometry(34, 4), new T.MeshBasicMaterial({ map: TX.ao(), transparent: true, depthWrite: false, opacity: .8 }));
  m.rotation.x = -Math.PI / 2; m.position.set(0, .02, 6.3); scene.add(m);
})();

await pause();
/* ---------- Caméra : lent travelling, sans interaction ---------- */
var CAM = { az: .55, el: .12, R: 48, cx: 0, cy: 3.4, cz: 1, sx: 0, sy: 0 };
// sx / sy décalent le cadrage : la maison se place en haut à droite, le titre en bas à gauche
function fit() {
  var w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h;
  var narrow = camera.aspect < 1.1;
  camera.fov = narrow ? 44 : 32; camera.updateProjectionMatrix();
  CAM.R = narrow ? 50 : 48; CAM.sx = narrow ? 0 : 5.5; CAM.sy = narrow ? -1.5 : -2.2;
}
function place(t) {
  var a = CAM.az + (REDUCE ? 0 : Math.sin(t * .045) * .07), r = CAM.R - (REDUCE ? 0 : (1 - Math.cos(t * .03)) * 1.2);
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
  var go = function () { setTimeout(boot, 600); };
  if (document.readyState === 'complete') go(); else window.addEventListener('load', go);
}
})();
