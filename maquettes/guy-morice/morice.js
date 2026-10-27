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

/* =====================================================================
   Rendu 3D réaliste
   ===================================================================== */
var frame = $('#frame');
if (!window.THREE || !frame) return;
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
try { renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); }
catch (e) { frame.querySelector('.wait').textContent = 'Le rendu 3D n’est pas disponible sur cet appareil.'; return; }
var DPR = Math.min(window.devicePixelRatio || 1, SMALL ? 1.5 : 1.75);
renderer.setPixelRatio(DPR);
renderer.outputEncoding = T.sRGBEncoding;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = .5;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;
frame.appendChild(renderer.domElement); renderer.domElement.setAttribute('aria-hidden', 'true');

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
var sc = sun.shadow.camera; sc.left = -36; sc.right = 36; sc.top = 32; sc.bottom = -32; sc.near = 30; sc.far = 220;
sun.shadow.bias = -.00025; sun.shadow.normalBias = .025;
scene.add(sun); scene.add(sun.target);
scene.add(new T.HemisphereLight(0xBFD3EA, 0x5E5A40, .45));

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

/* ---------- Terrain et horizon ---------- */
var ground = new T.Mesh(new T.PlaneGeometry(1200, 1200), M.grass);
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
(function () { // coteaux lointains
  var g = new T.PlaneGeometry(2200, 2200, 180, 180); g.rotateX(-Math.PI / 2);
  var p = g.attributes.position;
  for (var i = 0; i < p.count; i++) {
    var x = p.getX(i), z = p.getZ(i), d = Math.hypot(x, z);
    var k = Math.min(1, Math.max(0, (d - 170) / 260));
    p.setY(i, (Math.sin(x * .009) * 10 + Math.sin(z * .007 + 1.3) * 14 + Math.sin((x + z) * .018) * 5 + 16) * k - .3);
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

/* ---------- Maison ---------- */
var H1 = 3.2, H2 = 3.1, Y2 = H1 + .25;
// rez-de-chaussée, x -8..5, baies du séjour plein sud
volume(-8, 5, 0, H1, -4.5, 4.5, M.render, [{ x0: -7.4, x1: -1.2, y0: 0, y1: 2.75 }, { x0: .3, x1: 3.8, y0: 0, y1: 2.75 }], .55);
box(13.4, .25, 9.4, -1.5, H1, 0, M.coping);
// étage : partie enduite (x -3..3.8) avec fenêtre en bandeau, partie bardée bois (x 3.8..8) en porte-à-faux
volume(-3, 3.8, Y2, Y2 + H2, -4.5, 3.5, M.render, [{ x0: -2.5, x1: 3.3, y0: Y2 + .8, y1: Y2 + 2.55 }], .5);
box(4.2, H2, 8, 5.9, Y2, -.5, woodMat(3, 2.4));
box(1.8, 1.6, .05, 6.1, Y2 + .8, 3.53, M.win, { noCast: true });
box(.05, 1.6, 2.6, 8.03, Y2 + .8, -1.2, M.win, { noCast: true });
box(11.5, .32, 8.5, 2.5, Y2 + H2, -.5, M.coping);
box(11, .05, 8, 2.5, Y2 + H2 + .32, -.5, M.roof, { noCast: true });
// brise-soleil verticaux en bois devant le bandeau
var fins = woodMat(.15, 1);
for (var i = 0; i < 16; i++) box(.07, 1.95, .36, -2.4 + i * .38, Y2 + .7, 3.72, fins);
// auvent / garage sous le porte-à-faux
box(.35, H1, .35, 7.6, 0, 3.2, M.render);
box(2.9, H1 - .1, .08, 6.5, 0, -4.4, M.alu);
// toit-terrasse ouest : garde-corps vitré
box(5.2, 1.05, .05, -5.4, H1 + .25, 4.62, M.balcony, { noCast: true });
box(.05, 1.05, 9.2, -8.1, H1 + .25, 0, M.balcony, { noCast: true });
box(5.2, .05, .07, -5.4, H1 + 1.3, 4.62, M.alu);
box(.07, .05, 9.2, -8.1, H1 + 1.3, 0, M.alu);
box(5, .04, 9, -5.5, H1 + .25, 0, M.tiles, { noCast: true });
// pergola bioclimatique à lames
var px0 = -8.4, px1 = -1.4, pz0 = 4.7, pz1 = 9.4;
[[px0, pz1], [px1, pz1]].forEach(function (p) { box(.18, 2.9, .18, p[0], 0, p[1], M.alu); });
box(px1 - px0 + .18, .22, .18, (px0 + px1) / 2, 2.8, pz1, M.alu);
box(.16, .22, pz1 - pz0, px0, 2.8, (pz0 + pz1) / 2, M.alu);
box(.16, .22, pz1 - pz0, px1, 2.8, (pz0 + pz1) / 2, M.alu);
for (i = 0; i < 18; i++) { var sl = box(px1 - px0 - .2, .03, .2, (px0 + px1) / 2, 2.88, pz0 + .2 + i * .26, M.alu); sl.rotation.x = .55; }
// terrasse, piscine, plage
box(17, .12, 6, -1.6, 0, 7.5, M.tiles, { noCast: true });
box(11.4, .14, 5.6, -3.2, 0, 13.6, M.coping, { noCast: true });
box(10, .03, 4.2, -3.2, .12, 13.6, M.water, { noCast: true });
[-6.4, -4.8].forEach(function (x) { box(.7, .28, 1.9, x, .14, 17.5, M.coping); var b = box(.7, .06, .7, x, .62, 16.6, M.coping); b.rotation.x = -.7; });
box(3.2, .03, 24, 6.4, 0, 16, M.gravel, { noCast: true });

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
function trunk(x, z, h, r) { var t = new T.Mesh(new T.CylinderGeometry(r * .6, r, h, 7), M.bark); t.position.set(x, h / 2, z); t.castShadow = true; scene.add(t); }
function tree(x, z, h, r, hue, lum) {
  trunk(x, z, h * .55, r * .09);
  var H = r * 1.9;
  foliage(x, h * .45, z, H, function (u) { return r * Math.sin(Math.PI * Math.min(1, u * 1.05 + .08)) * 1.05; }, 1500, r * .14, hue, .45, lum);
}
function olive(x, z) {
  trunk(x, z, 1.5, .2);
  foliage(x, 1.3, z, 1.8, function (u) { return 1.5 * Math.sin(Math.PI * (u * .9 + .1)); }, 700, .17, .2, .18, .34);
}
function cypress(x, z, h) {
  trunk(x, z, 1, .14);
  foliage(x, .4, z, h, function (u) { return .85 * Math.sin(Math.PI * Math.min(1, .15 + u * .9)) * (1 - u * .55); }, 900, .17, .28, .42, .19);
}
tree(-17, -13, 4.5, 3.6, .24, .3); tree(-6, -17, 5.5, 4.2, .25, .27); tree(9, -16, 5, 3.8, .23, .31);
tree(20, -6, 4, 3.2, .22, .33); tree(-26, 2, 4.2, 3.4, .25, .28); tree(25, 11, 3.6, 3, .23, .32);
olive(3.6, 11); olive(-11.6, 12); olive(2.4, 18);
for (i = 0; i < 6; i++) cypress(-13.8, -3 + i * 3.4, rr(8, 10.5));
box(28, 1.3, .9, 1, 0, 22.5, M.hedge);
for (var lv = 0; lv < 14; lv++) { // lavandes le long de l'allée
  foliage(8.6, .05, 6 + lv * 1.12, .7, function (u) { return .5 * Math.sin(Math.PI * (u * .8 + .2)); }, 70, .1, .72, .22, .42);
}
(function () { // ombre de contact sous la maison
  var m = new T.Mesh(new T.PlaneGeometry(21, 15), new T.MeshBasicMaterial({ map: TX.ao(), transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.set(-.8, .015, .2); scene.add(m);
})();

/* ---------- Caméra : lent travelling, sans interaction ---------- */
var CAM = { az: .6, el: .11, R: 36, tx: -.5, ty: 2.8, tz: 2.5 };
function fit() {
  var w = frame.clientWidth, h = frame.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h;
  var narrow = camera.aspect < 1.2;
  camera.fov = narrow ? 42 : 30; camera.updateProjectionMatrix();
  CAM.R = narrow ? 33 : 36; CAM.tx = narrow ? .5 : -.5; CAM.ty = narrow ? 1.6 : 2.8;
}
function place(t) {
  var a = CAM.az + (REDUCE ? 0 : Math.sin(t * .045) * .075), r = CAM.R - (REDUCE ? 0 : (1 - Math.cos(t * .03)) * 1.2);
  camera.position.set(CAM.tx + Math.sin(a) * Math.cos(CAM.el) * r, CAM.ty + Math.sin(CAM.el) * r, CAM.tz + Math.cos(a) * Math.cos(CAM.el) * r);
  camera.lookAt(CAM.tx, CAM.ty - .4, CAM.tz);
}
window.addEventListener('resize', function () { fit(); place((performance.now() - t0) / 1000); renderer.render(scene, camera); });
var t0 = performance.now();
fit(); place(0);
renderer.shadowMap.needsUpdate = true;
renderer.compile(scene, camera);
renderer.render(scene, camera);
requestAnimationFrame(function () { frame.classList.add('ready'); });

/* Vue de la terrasse pour la vitrine, calculée une seule fois */
(function () {
  var img = $('#still'); if (!img) return;
  var w = SMALL ? 1000 : 1500, h = Math.round(w * .72);
  renderer.setPixelRatio(1); renderer.setSize(w, h, false);
  var cam2 = new T.PerspectiveCamera(44, w / h, .5, 3000);
  cam2.position.set(-7, 1.9, 21); cam2.lookAt(-1.2, 2.9, 3);
  renderer.render(scene, cam2);
  try { img.src = renderer.domElement.toDataURL('image/jpeg', .9); img.hidden = false; } catch (e) { }
  renderer.setPixelRatio(DPR); fit(); place(0); renderer.render(scene, camera);
})();

var visible = true, last = 0;
if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(frame);
function loop(now) {
  requestAnimationFrame(loop);
  if (!visible || REDUCE || document.hidden) return;
  if (SMALL && now - last < 32) return;
  last = now;
  place((now - t0) / 1000); renderer.render(scene, camera);
}
requestAnimationFrame(loop);
})();
