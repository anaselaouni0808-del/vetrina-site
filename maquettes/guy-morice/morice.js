/* Guy Morice, architecte : maquette de site. Three.js r128, GSAP 3.12, Lenis 1.1 */
(function () {
"use strict";
var body = document.body;
var REDUCE = body.classList.contains('reduce');
var MOBILE = function () { return window.innerWidth <= 860; };
var TOUCH = matchMedia('(pointer: coarse)').matches;
var hasGSAP = !!(window.gsap && window.ScrollTrigger);
if (hasGSAP) gsap.registerPlugin(ScrollTrigger);
function MQ(map) { var mm = gsap.matchMedia(); Object.keys(map).forEach(function (q) { mm.add(q, map[q]); }); }
function $(s, c) { return (c || document).querySelector(s); }
function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }

/* ---------------- Défilement doux (ordinateur seulement) ---------------- */
var lenis = null;
if (hasGSAP && window.Lenis && !REDUCE && !TOUCH) {
  lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.95 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
  gsap.ticker.lagSmoothing(0);
}
$$('a[href^="#"]').forEach(function (a) {
  a.addEventListener('click', function (e) {
    var id = a.getAttribute('href');
    var el = id.length > 1 ? document.querySelector(id) : document.body;
    if (!el) return;
    e.preventDefault();
    closeMenu();
    if (lenis) lenis.scrollTo(el, { offset: id === '#top' ? 0 : -60, duration: 1.4 });
    else el.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth' });
  });
});

/* ---------------- En-tête, menu, barre téléphone ---------------- */
var hdr = $('#hdr'), burger = $('#burger'), menu = $('#menu');
function onScrollHdr() { hdr.classList.toggle('solid', window.scrollY > 30 || body.classList.contains('menu-open')); }
window.addEventListener('scroll', onScrollHdr, { passive: true }); onScrollHdr();
function closeMenu() {
  if (!body.classList.contains('menu-open')) return;
  body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Ouvrir le menu');
  menu.setAttribute('aria-hidden', 'true'); if (lenis) lenis.start(); onScrollHdr();
}
burger.addEventListener('click', function () {
  if (body.classList.contains('menu-open')) { closeMenu(); return; }
  body.classList.add('menu-open'); burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', 'Fermer le menu');
  menu.setAttribute('aria-hidden', 'false'); if (lenis) lenis.stop(); onScrollHdr();
});
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

var dock = $('#dock');
(function () {
  var pastHero = false, inContact = false;
  function upd() { dock.classList.toggle('show', pastHero && !inContact); }
  if (!('IntersectionObserver' in window)) { dock.classList.add('show'); return; }
  new IntersectionObserver(function (e) { pastHero = !e[0].isIntersecting; upd(); }, { rootMargin: '-40% 0px 0px 0px' }).observe($('#hero'));
  new IntersectionObserver(function (e) { inContact = e[0].isIntersecting; upd(); }, { threshold: 0.05 }).observe($('#contact'));
})();

/* ---------------- Soleil réel à Estillac ---------------- */
var LAT = 44.17 * Math.PI / 180;
function decl(dayOfYear) { return 23.44 * Math.sin(2 * Math.PI * (284 + dayOfYear) / 365) * Math.PI / 180; }
function sunPos(hour, dayOfYear) {
  var d = decl(dayOfYear), H = (hour - 12) * 15 * Math.PI / 180;
  var alt = Math.asin(Math.sin(LAT) * Math.sin(d) + Math.cos(LAT) * Math.cos(d) * Math.cos(H));
  var az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(LAT) - Math.tan(d) * Math.cos(LAT));
  return { alt: alt, az: az };
}
function fmtH(h) { var hh = Math.floor(h), mm = Math.round((h - hh) * 60 / 5) * 5; if (mm === 60) { hh++; mm = 0; } return hh + ' h ' + (mm < 10 ? '0' : '') + mm; }
var JUNE = 172;

/* ---------------- Matériaux et briques de la maquette ---------------- */
function noiseTex(T, base, spread, size) {
  var c = document.createElement('canvas'); c.width = c.height = size || 256;
  var g = c.getContext('2d'), im = g.createImageData(c.width, c.height);
  for (var i = 0; i < im.data.length; i += 4) {
    var v = base + (Math.random() - .5) * spread;
    im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  // fibres du carton
  g.globalAlpha = .05; g.strokeStyle = '#000';
  for (var k = 0; k < 160; k++) { g.beginPath(); var x = Math.random() * c.width, y = Math.random() * c.height; g.moveTo(x, y); g.lineTo(x + (Math.random() - .5) * 30, y + (Math.random() - .5) * 4); g.stroke(); }
  var t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.encoding = T.sRGBEncoding; t.anisotropy = 4;
  return t;
}
function kit(T, renderer) {
  var paper = noiseTex(T, 246, 14); paper.repeat.set(2, 2);
  var cardT = noiseTex(T, 220, 22); cardT.repeat.set(3, 3);
  var M = {
    white: new T.MeshStandardMaterial({ color: 0xF6F6F3, map: paper, roughness: .88 }),
    card: new T.MeshStandardMaterial({ color: 0xE2E2DE, map: cardT, roughness: 1 }),
    card2: new T.MeshStandardMaterial({ color: 0xCFCFCB, map: cardT, roughness: 1 }),
    grey: new T.MeshStandardMaterial({ color: 0xB9BAB7, map: paper, roughness: .9 }),
    dark: new T.MeshStandardMaterial({ color: 0x3A3C3F, roughness: .75 }),
    glass: new T.MeshStandardMaterial({ color: 0x2E3236, roughness: .08, metalness: .55 }),
    clear: new T.MeshStandardMaterial({ color: 0xDDE3E8, roughness: .05, metalness: .2, transparent: true, opacity: .32, depthWrite: false }),
    water: new T.MeshStandardMaterial({ color: 0x6F767C, roughness: .04, metalness: .7 }),
    edge: new T.LineBasicMaterial({ color: 0x8E8E8A, transparent: true, opacity: .55 })
  };
  // reflets doux pour le verre et l'eau
  var pm = new T.PMREMGenerator(renderer), env = new T.Scene();
  var sky = new T.Mesh(new T.SphereGeometry(50, 32, 16), new T.ShaderMaterial({
    side: T.BackSide, uniforms: {},
    vertexShader: 'varying vec3 p;void main(){p=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'varying vec3 p;void main(){float h=p.y*.5+.5;vec3 c=mix(vec3(.55),vec3(1.),smoothstep(.35,.85,h));gl_FragColor=vec4(c,1.);}'
  }));
  env.add(sky);
  var envMap = pm.fromScene(env, 0.04).texture;
  M.glass.envMap = envMap; M.water.envMap = envMap; M.clear.envMap = envMap;
  M.glass.envMapIntensity = 1.1; M.water.envMapIntensity = 1.2;
  return M;
}
// Boîte posée sur sa base (pour l'animation « du plan au volume »)
function B(T, M, parent, w, h, d, x, y, z, mat, o) {
  o = o || {};
  var g = new T.BoxGeometry(w, h, d); g.translate(0, h / 2, 0);
  var m = new T.Mesh(g, mat || M.white);
  m.position.set(x, y, z); m.castShadow = o.cast !== false; m.receiveShadow = true;
  if (o.edges !== false) m.add(new T.LineSegments(new T.EdgesGeometry(g), M.edge));
  if (o.ry) m.rotation.y = o.ry;
  parent.add(m); return m;
}
function prism(T, M, parent, len, w, ridge, x, y, z, mat) { // volume de toiture à deux pans, faîtage selon x
  var s = new T.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, ridge); s.lineTo(-w / 2, 0);
  var g = new T.ExtrudeGeometry(s, { depth: len, bevelEnabled: false }); g.translate(0, 0, -len / 2); g.rotateY(Math.PI / 2);
  var m = new T.Mesh(g, mat || M.white); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true;
  m.add(new T.LineSegments(new T.EdgesGeometry(g), M.edge)); parent.add(m); return m;
}
function roof2(T, M, parent, len, w, ridge, x, y, z, mat) { // deux pans en tuile, débord
  var half = w / 2, a = Math.atan2(ridge, half), L = Math.hypot(half, ridge) + .45;
  [-1, 1].forEach(function (s) {
    var g = new T.BoxGeometry(len + .6, .16, L); var m = new T.Mesh(g, mat || M.card2);
    m.rotation.x = s * a; m.position.set(x, y + ridge / 2 - .02, z + s * (half / 2 + .1));
    m.castShadow = m.receiveShadow = true; m.add(new T.LineSegments(new T.EdgesGeometry(g), M.edge)); parent.add(m);
  });
}
function tree(T, M, parent, x, z, r, kind) {
  var g = new T.Group(); g.position.set(x, 0, z);
  if (kind === 'cypres') {
    var c = new T.Mesh(new T.ConeGeometry(r, r * 7, 10), M.white); c.position.y = r * 3.5 + .3; c.castShadow = c.receiveShadow = true; g.add(c);
  } else {
    var t = new T.Mesh(new T.CylinderGeometry(.07, .1, 2.2, 6), M.dark); t.position.y = 1.1; t.castShadow = true; g.add(t);
    var s = new T.Mesh(new T.IcosahedronGeometry(r, 1), M.white); s.position.y = 2.1 + r * .75; s.castShadow = s.receiveShadow = true; g.add(s);
  }
  parent.add(g); return g;
}
function contour(T, M, parent, pts, h, y, mat) {
  var s = new T.Shape(); pts.forEach(function (p, i) { if (i) s.lineTo(p[0], -p[1]); else s.moveTo(p[0], -p[1]); });
  var g = new T.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 4 }); g.rotateX(-Math.PI / 2);
  var m = new T.Mesh(g, mat); m.position.y = y; m.receiveShadow = true; m.castShadow = true;
  m.add(new T.LineSegments(new T.EdgesGeometry(g, 30), M.edge)); parent.add(m); return m;
}
function blob(cx, cz, rx, rz, seed, n) {
  var pts = []; n = n || 40;
  for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2, k = 1 + .12 * Math.sin(a * 3 + seed) + .07 * Math.sin(a * 5 + seed * 2); pts.push([cx + Math.cos(a) * rx * k, cz + Math.sin(a) * rz * k]); }
  return pts;
}

/* La maison de la page d'accueil, proche de la photo de couverture : deux volumes cubiques, pergola, piscine */
function buildHouse(T, M, g) {
  var parts = [];
  function P(m) { parts.push(m); return m; }
  // rez-de-chaussée
  P(B(T, M, g, 12, 3.2, 8, -1, 0, 0));
  // baies sud du RDC avec meneaux
  P(B(T, M, g, 7.6, 2.6, .08, -2.6, .1, 4.01, M.glass, { edges: false, cast: false }));
  for (var i = 0; i < 5; i++) P(B(T, M, g, .09, 2.6, .14, -6.4 + i * 1.9, .1, 4.03, M.white, { edges: false }));
  P(B(T, M, g, 2.2, 2.6, .08, 3.2, .1, 4.01, M.glass, { edges: false, cast: false }));
  // garage habillé de lames sombres
  var gar = P(B(T, M, g, 4, 2.9, 6.4, 7, 0, .6, M.dark));
  for (i = 0; i < 15; i++) P(B(T, M, g, .07, 2.9, .06, 5.15 + i * .26, 0, 3.83, M.dark, { edges: false, cast: false }));
  // étage en porte-à-faux
  P(B(T, M, g, 9.6, 3, 7.4, 2.4, 3.2, -.6));
  P(B(T, M, g, 9.9, .22, 7.7, 2.4, 6.2, -.6));
  P(B(T, M, g, 7.8, 1.5, .08, 2.6, 4.0, 3.11, M.glass, { edges: false, cast: false }));
  for (i = 0; i < 14; i++) P(B(T, M, g, .08, 2.2, .55, -1.6 + i * .62, 3.6, 3.45, M.white, { edges: false })); // brise-soleil verticaux
  P(B(T, M, g, .08, 1.6, 3.4, 7.21, 3.9, -1.4, M.glass, { edges: false, cast: false }));
  // dalle du RDC débordante
  P(B(T, M, g, 12.5, .22, 8.5, -1, 3.2, 0));
  // toit-terrasse ouest : garde-corps vitré
  P(B(T, M, g, 4.6, 1, .05, -4.7, 3.42, 4.2, M.clear, { edges: false, cast: false }));
  P(B(T, M, g, .05, 1, 8.4, -7.2, 3.42, 0, M.clear, { edges: false, cast: false }));
  // terrasse et pergola à lames
  P(B(T, M, g, 13, .14, 4.6, -1.5, 0, 6.3, M.grey, { edges: false, cast: false }));
  [-7.4, -.6].forEach(function (x) { P(B(T, M, g, .2, 2.9, .2, x, 0, 8.3)); });
  P(B(T, M, g, 7, .18, .24, -4, 2.9, 8.3));
  for (i = 0; i < 13; i++) P(B(T, M, g, 6.9, .07, .2, -4, 3.08, 4.25 + i * .33, M.white, { edges: false }));
  // piscine
  P(B(T, M, g, 9.4, .16, 4.4, -2.3, 0, 11.6, M.white));
  var w = P(B(T, M, g, 8.6, .02, 3.6, -2.3, .16, 11.6, M.water, { edges: false, cast: false }));
  // allée en pas japonais vers l'entrée
  for (i = 0; i < 6; i++) P(B(T, M, g, 1.1, .08, .6, 4.2 + i * .25, 0, 6 + i * 1.15, M.grey, { edges: false, cast: false }));
  // murets
  P(B(T, M, g, .25, 1, 10, -10.5, 0, 8.5));
  P(B(T, M, g, 8, 1, .25, 11.6, 0, 5.2));
  return parts;
}

/* ---------------- Maquette 3D principale ---------------- */
var scene3d = null;
function showH1() { $$('.hero h1 .ln > span').forEach(function (s) { s.style.transform = 'none'; }); }
(function initMain() {
  var host = $('#scene');
  if (!window.THREE || !host) { showH1(); return; }
  var T = THREE, renderer;
  try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch (e) { host.classList.add('nogl'); showH1(); return; }
  var DPR = Math.min(window.devicePixelRatio || 1, MOBILE() ? 1.6 : 1.75);
  renderer.setPixelRatio(DPR);
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  host.prepend(renderer.domElement); renderer.domElement.setAttribute('aria-hidden', 'true');

  var scene = new T.Scene(); scene.fog = new T.Fog(0xF4F4F2, 90, 190);
  var cam = new T.PerspectiveCamera(30, 1, 1, 400);
  var M = kit(T, renderer);

  var world = new T.Group(); scene.add(world);
  // Socle et courbes de niveau, comme une maquette de site en carton
  var site = new T.Group(); world.add(site);
  var base = B(T, M, site, 52, .8, 40, 0, -.8, 0, M.card, { cast: false });
  var c1 = contour(T, M, site, blob(-6, -13, 30, 12, 1.3), .45, 0, M.card);
  var c2 = contour(T, M, site, blob(-14, -16, 18, 8, 2.1), .45, .45, M.card2);
  var c3 = contour(T, M, site, blob(-18, -17, 9, 4.5, .7), .45, .9, M.card);
  var contours = [c1, c2, c3];
  var house = new T.Group(); world.add(house);
  var parts = buildHouse(T, M, house);
  var trees = [
    tree(T, M, world, 13, 11, 1.6), tree(T, M, world, 16, -5, 2.1), tree(T, M, world, -15, 3, 1.8),
    tree(T, M, world, -20, -9, 1.5), tree(T, M, world, 19, 8, 1.2), tree(T, M, world, 9, -12, 1.9),
    tree(T, M, world, -12.5, 14, .42, 'cypres'), tree(T, M, world, -11.3, 15.2, .38, 'cypres'), tree(T, M, world, 15, 14.5, .4, 'cypres')
  ];

  var hemi = new T.HemisphereLight(0xFFFFFF, 0xBEBEBA, .55); scene.add(hemi);
  var sun = new T.DirectionalLight(0xFFFFFF, 1); sun.castShadow = true;
  var SM = MOBILE() ? 1024 : 2048; sun.shadow.mapSize.set(SM, SM);
  var sc = sun.shadow.camera; sc.left = -26; sc.right = 26; sc.top = 26; sc.bottom = -26; sc.near = 1; sc.far = 140;
  sun.shadow.bias = -.0004; sun.shadow.normalBias = .035;
  scene.add(sun); scene.add(sun.target);

  // Étiquettes techniques reliées à la maquette
  var labelsEl = $('#labels');
  var LBL = [
    { t: 'Toit-terrasse accessible', p: new T.Vector3(-5.2, 4.4, 1) },
    { t: 'Brise-soleil verticaux', p: new T.Vector3(5.8, 5.4, 3.6) },
    { t: 'Pergola à lames orientables', p: new T.Vector3(-6.8, 3.2, 8.3) },
    { t: 'Baies plein sud', p: new T.Vector3(-2.6, 1.4, 4.1) }
  ].map(function (l) { var d = document.createElement('div'); d.className = 'lbl'; d.innerHTML = '<i></i><span>' + l.t + '</span>'; labelsEl.appendChild(d); l.el = d; return l; });

  var state = { az: 0, el: 1.52, R: 1, hour: 9, build: 0, dAz: 0, labels: 0, introDone: false, auto: 0 };
  var W = 1, H = 1, target = new T.Vector3();
  function fit() {
    W = host.clientWidth; H = host.clientHeight; renderer.setSize(W, H, false);
    cam.aspect = W / H; cam.fov = MOBILE() ? 34 : 28; cam.updateProjectionMatrix();
    var vf = cam.fov * Math.PI / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * cam.aspect);
    var rad = MOBILE() ? 16.5 : 15.5;
    state.R = rad / Math.sin(Math.min(vf, hf) / 2);
    target.set(MOBILE() ? 0 : 1.5, MOBILE() ? 1 : -1.6, 2);
    dirty = true;
  }
  function placeCam() {
    var az = state.az + state.dAz, el = state.el, R = state.R * (1 - .16 * scrollP);
    cam.position.set(target.x + Math.sin(az) * Math.cos(el) * R, target.y + Math.sin(el) * R, target.z + Math.cos(az) * Math.cos(el) * R);
    cam.lookAt(target);
  }
  function setSun(h) {
    var s = sunPos(h, JUNE), up = Math.max(0, s.alt);
    sun.position.set(-Math.sin(s.az) * Math.cos(s.alt) * 80, Math.sin(s.alt) * 80, Math.cos(s.az) * Math.cos(s.alt) * 80);
    var k = clamp(up / .3, 0, 1);
    sun.intensity = .95 * k; hemi.intensity = .48 + .14 * k;
    sun.color.setHSL(.09, .35 * (1 - k), .5 + .5 * k);
    var r = $('#sunRead'); if (r) r.textContent = '21 juin, ' + fmtH(h) + ', hauteur ' + Math.round(s.alt * 180 / Math.PI) + '°';
  }
  // état de construction : 0 = plan, 1 = volumes montés
  function applyBuild(b) {
    contours.forEach(function (c, i) { var k = clamp(b * 3 - i * .35, 0, 1); c.scale.y = Math.max(.001, k); c.position.y = .45 * i * k; });
    var n = parts.length;
    parts.forEach(function (m, i) {
      var start = .25 + (i / n) * .5, k = clamp((b - start) / .25, 0, 1);
      k = 1 - Math.pow(1 - k, 3);
      m.scale.y = Math.max(.001, k);
    });
    trees.forEach(function (t, i) { var k = clamp((b - .7 - i * .025) / .2, 0, 1); var e = k === 0 ? .001 : 1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2); t.scale.setScalar(Math.max(.001, e)); });
  }
  var dirty = true, visible = true, scrollP = 0;
  function render() {
    placeCam(); renderer.render(scene, cam);
    // étiquettes
    var show = state.labels > .01 && !MOBILE();
    var v = new T.Vector3();
    LBL.forEach(function (l) {
      if (!show) { l.el.classList.remove('on'); return; }
      v.copy(l.p).project(cam);
      var x = (v.x * .5 + .5) * W, y = (-v.y * .5 + .5) * H;
      l.el.style.transform = 'translate(' + (x - 4).toFixed(1) + 'px,' + (y - 12).toFixed(1) + 'px)';
      l.el.classList.toggle('on', state.labels > .5 && x > 20 && x < W - 220 && y > 90 && y < H - 40);
    });
  }
  window.addEventListener('resize', function () { fit(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(host);

  // Glisser pour tourner (horizontal, le défilement vertical reste libre)
  var drag = null, dTarget = 0;
  renderer.domElement.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, a: dTarget }; host.classList.add('drag'); });
  window.addEventListener('pointermove', function (e) { if (!drag) return; dTarget = clamp(drag.a - (e.clientX - drag.x) * .005, -1.4, 1.4); });
  window.addEventListener('pointerup', function () { drag = null; host.classList.remove('drag'); });

  fit(); setSun(state.hour); applyBuild(REDUCE ? 1 : 0);
  if (REDUCE) { state.el = .5; state.az = .62; state.labels = 1; state.introDone = true; state.hour = 15; setSun(15); }
  renderer.compile(scene, cam);

  // Introduction : le plan se dessine, puis les volumes montent
  function intro() {
    if (REDUCE || !hasGSAP) { applyBuild(1); state.el = .5; state.az = .62; state.labels = 1; state.introDone = true; $$('.hero h1 .ln > span').forEach(function (s) { s.style.transform = 'none'; }); return; }
    var o = { b: 0 }, lines = $$('.hero h1 .ln > span');
    gsap.set(lines, { y: 0, yPercent: 105 });
    var tl = gsap.timeline({ delay: .2, onComplete: function () { state.introDone = true; } });
    tl.to(o, { b: 1, duration: 3.2, ease: 'power1.inOut', onUpdate: function () { applyBuild(o.b); dirty = true; } }, 0)
      .to(state, { el: .5, az: .62, duration: 3.4, ease: 'power3.inOut', onUpdate: function () { dirty = true; } }, .5)
      .to(lines, { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: .12 }, 1.4)
      .from('.hero .tagline, .cart', { opacity: 0, y: 20, duration: 1, ease: 'power3.out', stagger: .12 }, 1.9)
      .to(state, { labels: 1, duration: .6 }, 3.2);
  }
  intro();

  // Le défilement fait tourner la caméra et avance l'heure (ordinateur)
  if (hasGSAP && !REDUCE) {
    MQ({
      '(min-width: 861px)': function () {
        var st = ScrollTrigger.create({
          trigger: '#hero', start: 'top top', end: '+=110%', pin: true, scrub: true, anticipatePin: 1,
          onUpdate: function (s) { scrollP = s.progress; dirty = true; }
        });
        return function () { st.kill(); scrollP = 0; };
      }
    });
  }

  var t0 = performance.now(), last = t0;
  function loop(now) {
    var dt = Math.min(.05, (now - last) / 1000); last = now;
    if (visible) {
      if (Math.abs(dTarget - state.dAz) > 1e-4) { state.dAz += (dTarget - state.dAz) * .1; dirty = true; }
      if (state.introDone) {
        var h;
        if (MOBILE() || REDUCE) { state.auto += dt * (REDUCE ? 0 : .22); h = REDUCE ? 15 : 9 + 10 * (.5 - .5 * Math.cos(state.auto * .3)); }
        else h = 9 + scrollP * 10;
        if (Math.abs(h - state.hour) > .002) { state.hour = h; setSun(h); dirty = true; }
        var targetEl = .5 - scrollP * .26, targetAz = .62 - scrollP * 1.15;
        state.el += (targetEl - state.el) * .12; state.az += (targetAz - state.az) * .12;
        if (Math.abs(targetEl - state.el) > 1e-4 || Math.abs(targetAz - state.az) > 1e-4) dirty = true;
        var lt = scrollP < .55 ? 1 : 0; if (Math.abs(lt - state.labels) > .01) { state.labels += (lt - state.labels) * .15; dirty = true; }
      }
      if (dirty) { render(); dirty = false; }
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  scene3d = { T: T };
})();

/* ---------------- Vues 3D des réalisations (rendus générés) ---------------- */
function makeStills() {
  if (!window.THREE) return;
  var T = THREE, imgs = $$('img[data-still]');
  var r;
  try { r = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); } catch (e) { return; }
  var WID = MOBILE() ? 900 : 1280, HEI = Math.round(WID * .75);
  r.setPixelRatio(1); r.setSize(WID, HEI, false); r.outputEncoding = T.sRGBEncoding;
  r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
  var M = kit(T, r);
  function stage(bg) {
    var s = new T.Scene(); s.background = new T.Color(bg || 0xE9E9E6);
    s.add(new T.HemisphereLight(0xFFFFFF, 0xB8B8B4, .5));
    var sun = new T.DirectionalLight(0xFFF6EC, .95); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    var c = sun.shadow.camera; c.left = -22; c.right = 22; c.top = 22; c.bottom = -22; c.far = 140;
    sun.shadow.bias = -.0004; sun.shadow.normalBias = .03; s.add(sun); s.add(sun.target);
    B(T, M, s, 70, .6, 60, 0, -.6, 0, M.card, { cast: false, edges: false });
    return { s: s, sun: sun };
  }
  function shoot(st, az, el, R, look, hour, day) {
    var p = sunPos(hour, day);
    st.sun.position.set(-Math.sin(p.az) * Math.cos(p.alt) * 80, Math.sin(p.alt) * 80, Math.cos(p.az) * Math.cos(p.alt) * 80);
    var cam = new T.PerspectiveCamera(26, WID / HEI, 1, 400);
    cam.position.set(look[0] + Math.sin(az) * Math.cos(el) * R, look[1] + Math.sin(el) * R, look[2] + Math.cos(az) * Math.cos(el) * R);
    cam.lookAt(look[0], look[1], look[2]);
    r.render(st.s, cam);
    return new Promise(function (res) { r.domElement.toBlob(function (b) { res(b ? URL.createObjectURL(b) : r.domElement.toDataURL('image/jpeg', .9)); }, 'image/jpeg', .9); });
  }
  var jobs = [
    function () { // maison à étage, fin d'après-midi
      var st = stage(); var g = new T.Group(); st.s.add(g); buildHouse(T, M, g);
      tree(T, M, g, 13, 9, 1.8); tree(T, M, g, -14, -6, 2.2); tree(T, M, g, -13, 13, .42, 'cypres'); tree(T, M, g, -12, 14.5, .36, 'cypres');
      return shoot(st, -.55, .2, 48, [0, 2.5, 3], 17.5, JUNE);
    },
    function () { // extension contemporaine sur maison traditionnelle
      var st = stage(); var g = new T.Group(); st.s.add(g);
      B(T, M, g, 11, 3.4, 7.5, -3, 0, 0, M.grey);
      prism(T, M, g, 11, 7.5, 2.3, -3, 3.4, 0, M.grey);
      roof2(T, M, g, 11, 7.5, 2.3, -3, 3.4, 0, M.card2);
      for (var i = 0; i < 4; i++) B(T, M, g, 1, 1.5, .08, -7.2 + i * 2.6, 1.1, 3.76, M.dark, { edges: false, cast: false });
      B(T, M, g, 6.5, 3.2, 6, 5.75, 0, .9);
      B(T, M, g, 7, .25, 6.6, 5.75, 3.2, .9);
      B(T, M, g, 5.6, 2.7, .08, 5.75, .1, 3.91, M.glass, { edges: false, cast: false });
      B(T, M, g, .08, 2.7, 3.6, 9.01, .1, 1.4, M.glass, { edges: false, cast: false });
      for (i = 0; i < 3; i++) B(T, M, g, .08, 2.7, .12, 3.9 + i * 1.85, .1, 3.95, M.white, { edges: false });
      B(T, M, g, 9, .12, 4, 4.5, 0, 6, M.grey, { edges: false, cast: false });
      tree(T, M, g, 12.5, 7, 1.7); tree(T, M, g, -11, 8, 1.4); tree(T, M, g, 14, -6, 2);
      return shoot(st, .55, .22, 46, [1.5, 2.6, 1.5], 10.5, JUNE);
    },
    function () { // plain-pied en L autour d'un patio
      var st = stage(); var g = new T.Group(); st.s.add(g);
      B(T, M, g, 15, 3, 6, 0, 0, -4); B(T, M, g, 15.8, .25, 6.8, 0, 3, -4);
      B(T, M, g, 6, 3, 10, -4.5, 0, 4); B(T, M, g, 6.8, .25, 10.8, -4.5, 3, 4);
      B(T, M, g, 7.6, 2.5, .08, 3.4, .1, -.99, M.glass, { edges: false, cast: false });
      B(T, M, g, .08, 2.5, 7.6, -1.49, .1, 4.4, M.glass, { edges: false, cast: false });
      for (var i = 0; i < 4; i++) B(T, M, g, .08, 2.5, .12, 0 + i * 2.4, .1, -.95, M.white, { edges: false });
      for (i = 0; i < 18; i++) B(T, M, g, .4, .08, 8.5, -1.1 + i * .48, 0, 5, M.dark, { edges: false, cast: false });
      tree(T, M, g, 5, 5.5, 1.5); tree(T, M, g, 12, 6, 2); tree(T, M, g, -13, -4, 1.6); tree(T, M, g, 9, 10.5, .4, 'cypres');
      B(T, M, g, .25, .9, 12, 9.5, 0, 6);
      return shoot(st, .3, .42, 44, [0, 0, 1.5], 12.5, 80);
    },
    function () { // grange rénovée
      var st = stage(); var g = new T.Group(); st.s.add(g);
      B(T, M, g, 17, 4.6, 8.5, 0, 0, 0, M.grey);
      prism(T, M, g, 17, 8.5, 3.2, 0, 4.6, 0, M.grey);
      roof2(T, M, g, 17, 8.5, 3.2, 0, 4.6, 0, M.card2);
      B(T, M, g, 4.6, 4.1, .08, -2, .1, 4.26, M.glass, { edges: false, cast: false });
      for (var i = 0; i < 4; i++) B(T, M, g, .1, 4.1, .14, -4.25 + i * 1.5, .1, 4.3, M.dark, { edges: false });
      B(T, M, g, 1.4, 2.2, .08, 4.8, .1, 4.26, M.glass, { edges: false, cast: false });
      B(T, M, g, 1.4, 1.2, .08, 4.8, 2.9, 4.26, M.glass, { edges: false, cast: false });
      for (i = 0; i < 32; i++) B(T, M, g, .06, 4.6, .26, 8.52, 0, -4.1 + i * .26, M.dark, { edges: false, cast: false });
      B(T, M, g, 10, .12, 3.6, -3, 0, 6.3, M.white, { edges: false, cast: false });
      tree(T, M, g, 13, 4, 1.9); tree(T, M, g, -12, 6, 1.6); tree(T, M, g, -13.5, -5, .45, 'cypres'); tree(T, M, g, -12.2, -6.5, .4, 'cypres'); tree(T, M, g, 7, 11, 1.3);
      return shoot(st, -.6, .24, 50, [0, 3, 1], 18, 200);
    }
  ];
  var k = 0;
  function next() {
    if (k >= jobs.length) { r.dispose(); r.forceContextLoss && r.forceContextLoss(); return; }
    var i = k++;
    jobs[i]().then(function (url) {
      var im = imgs[i]; im.onload = function () { im.classList.add('ok'); }; im.src = url;
      if (window.requestIdleCallback) requestIdleCallback(next, { timeout: 600 }); else setTimeout(next, 60);
    });
  }
  next();
}
(function () {
  var wrap = $('#worksWrap'); if (!wrap) return;
  var started = false;
  function go() { if (started) return; started = true; setTimeout(makeStills, 50); }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { if (e[0].isIntersecting) go(); }, { rootMargin: '600px 0px' }).observe(wrap);
  else go();
  window.addEventListener('load', function () { setTimeout(go, 3800); });
})();

/* ---------------- Défilement horizontal des réalisations ---------------- */
(function () {
  var works = $('#works'), bar = $('#worksBar'), count = $('#worksCount'), n = $$('.work').length;
  function setP(p) { bar.style.transform = 'scaleX(' + (.25 + .75 * p) + ')'; count.textContent = '0' + Math.min(n, 1 + Math.round(p * (n - 1))) + ' / 0' + n; }
  works.addEventListener('scroll', function () { var m = works.scrollWidth - works.clientWidth; setP(m > 0 ? works.scrollLeft / m : 0); }, { passive: true });
  if (!hasGSAP || REDUCE) return;
  MQ({
    '(min-width: 861px)': function () {
      function dist() { return Math.max(0, works.scrollWidth - document.documentElement.clientWidth); }
      var tw = gsap.to(works, {
        x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: { trigger: '#realisations', start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: .6, invalidateOnRefresh: true, anticipatePin: 1, onUpdate: function (s) { setP(s.progress); } }
      });
      return function () { tw.scrollTrigger && tw.scrollTrigger.kill(); tw.kill(); gsap.set(works, { clearProps: 'transform' }); };
    }
  });
})();

/* ---------------- Démarche ---------------- */
$$('.step svg .dr').forEach(function (p) { try { p.style.setProperty('--len', Math.ceil(p.getTotalLength()) + 1); } catch (e) { } });
if ('IntersectionObserver' in window) {
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .4 });
  $$('.step').forEach(function (s) { io.observe(s); });
} else $$('.step').forEach(function (s) { s.classList.add('in'); });
if (hasGSAP && !REDUCE) {
  gsap.to('#rail', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top 60%', end: 'bottom 60%', scrub: true } });
}

/* ---------------- Coupe solaire interactive ---------------- */
(function () {
  var mEl = $('#month'); if (!mEl) return;
  var MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  var DAY21 = [21, 52, 80, 111, 141, 172, 202, 233, 264, 294, 325, 355];
  var S = 60, TIP = [100, 138], WALL = 160, HEAD = 168, FLOOR = 300, NORTH = 540;
  var cur = { a: 0 };
  function noonAlt(i) { return (90 - 44.17) + decl(DAY21[i]) * 180 / Math.PI; }
  function draw(aDeg) {
    var a = aDeg * Math.PI / 180, t = Math.tan(a), c = Math.cos(a), s = Math.sin(a);
    var yHit = TIP[1] + (WALL - TIP[0]) * t;
    var lit = Math.max(HEAD, yHit), inside = lit < FLOOR;
    var xEnd = inside ? Math.min(NORTH, WALL + (FLOOR - lit) / t) : WALL;
    var yEnd = inside ? (xEnd === NORTH ? lit + (NORTH - WALL) * t : FLOOR) : FLOOR;
    var P0 = inside ? [WALL, lit] : [TIP[0], TIP[1]];
    var L = 200, Sx = P0[0] - L * c, Sy = P0[1] - L * s;
    var ray = $('#ray'), ray2 = $('#ray2');
    if (inside) { ray.setAttribute('x1', Sx); ray.setAttribute('y1', Sy); ray.setAttribute('x2', xEnd); ray.setAttribute('y2', yEnd); }
    else { ray.setAttribute('x1', Sx); ray.setAttribute('y1', Sy); ray.setAttribute('x2', TIP[0]); ray.setAttribute('y2', TIP[1]); }
    var gx = TIP[0] + (FLOOR - TIP[1]) / t; // ombre portée du débord
    ray2.setAttribute('x1', TIP[0]); ray2.setAttribute('y1', TIP[1]);
    ray2.setAttribute('x2', Math.min(gx, WALL)); ray2.setAttribute('y2', Math.min(FLOOR, yHit));
    var beam = $('#beamPoly');
    if (inside) {
      var B0 = [WALL - L * c, FLOOR - L * s];
      beam.setAttribute('points', [Sx + ',' + Sy, P0[0] + ',' + P0[1], xEnd + ',' + yEnd, WALL + ',' + FLOOR, B0[0] + ',' + B0[1]].join(' '));
    } else beam.setAttribute('points', '0,0 0,0 0,0');
    var patch = $('#patch'); patch.setAttribute('width', inside ? Math.max(0, Math.min(xEnd, NORTH) - WALL - 5) : 0);
    var dot = $('#sunDot'); dot.setAttribute('cx', Sx); dot.setAttribute('cy', Sy);
    var tx = $('#angTxt'); tx.setAttribute('x', Sx + 18); tx.setAttribute('y', Sy + 5); tx.textContent = Math.round(aDeg) + '°';
    var depth = inside ? (xEnd - WALL) / S : 0;
    $('#rAlt').textContent = Math.round(aDeg) + '°';
    $('#rDepth').textContent = inside ? depth.toFixed(2).replace('.', ',') + ' m' : 'Baie à l’ombre';
    $('#sunCopy').textContent = aDeg > 62 ? 'En été, le débord de toit arrête le soleil de midi : la pièce reste fraîche sans volets fermés.'
      : aDeg < 36 ? 'En hiver, le soleil bas entre jusqu’au fond de la pièce et la chauffe gratuitement.'
      : 'À la mi-saison, le soleil entre à moitié : de la lumière, sans surchauffe.';
  }
  function setMonth(i, anim) {
    $('#monthOut').textContent = MONTHS[i];
    mEl.setAttribute('aria-valuetext', MONTHS[i] + ', soleil à ' + Math.round(noonAlt(i)) + ' degrés');
    var to = noonAlt(i);
    if (anim && hasGSAP && !REDUCE) gsap.to(cur, { a: to, duration: .7, ease: 'power3.out', overwrite: true, onUpdate: function () { draw(cur.a); } });
    else { cur.a = to; draw(to); }
  }
  mEl.addEventListener('input', function () { setMonth(+mEl.value, true); });
  setMonth(11, false);
  // à l'arrivée sur la section, l'année défile une fois de décembre à juin
  if (hasGSAP && !REDUCE) {
    ScrollTrigger.create({ trigger: '#coupe', start: 'top 70%', once: true, onEnter: function () {
      var o = { m: 11 };
      gsap.to(o, { m: 17, duration: 2.6, ease: 'power2.inOut', onUpdate: function () { var i = Math.round(o.m) % 12; if (+mEl.value !== i) { mEl.value = i; $('#monthOut').textContent = MONTHS[i]; } cur.a = (90 - 44.17) + decl(lerp(355, 172 + 365, (o.m - 11) / 6) % 365) * 180 / Math.PI; draw(cur.a); } });
    } });
  }
})();

/* ---------------- Territoire, parcours, apparitions ---------------- */
$('#yearNow').textContent = new Date().getFullYear();
if (hasGSAP && !REDUCE) {
  gsap.fromTo('#landImg', { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.land-hero', start: 'top bottom', end: 'bottom top', scrub: true } });
  $$('.land-row img').forEach(function (im, i) {
    gsap.to(im, { clipPath: 'inset(0% 0 0 0)', duration: 1.4, ease: 'expo.inOut', delay: i * .12, scrollTrigger: { trigger: im, start: 'top 85%' } });
  });
  MQ({
    '(min-width: 861px)': function () { gsap.fromTo('#tlLine', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '#tl', start: 'top 80%', end: 'bottom 55%', scrub: true } }); },
    '(max-width: 860px)': function () { gsap.fromTo('#tlLine', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '#tl', start: 'top 75%', end: 'bottom 60%', scrub: true } }); }
  });
  ScrollTrigger.batch('.reveal', { start: 'top 88%', onEnter: function (els) { gsap.to(els, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: .1, overwrite: true }); } });
  gsap.from('.big-name', { xPercent: 8, ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  $$('.contact .tel-big').forEach(function (el) { gsap.from(el, { yPercent: 60, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } }); });
} else {
  $$('.reveal').forEach(function (e) { e.style.opacity = 1; e.style.transform = 'none'; });
  $$('.land-row img').forEach(function (e) { e.style.clipPath = 'none'; });
  $('#tlLine').style.transform = 'none';
}

/* ---------------- Contact : ouvert en ce moment ? ---------------- */
(function () {
  var now; try { now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' })); } catch (e) { now = new Date(); }
  var d = now.getDay(), h = now.getHours() + now.getMinutes() / 60;
  var row = $('#hours tr[data-d="' + d + '"]'); if (row) row.classList.add('today');
  var wk = d >= 1 && d <= 5, open = wk && ((h >= 9 && h < 13) || (h >= 14 && h < 19));
  var txt;
  if (open) txt = 'Ouvert en ce moment, jusqu’à ' + (h < 13 ? '13 h' : '19 h');
  else if (wk && h < 9) txt = 'Fermé, ouvre aujourd’hui à 9 h';
  else if (wk && h >= 13 && h < 14) txt = 'Pause, reprise à 14 h';
  else { var nd = (d === 5 || d === 6) ? 'lundi' : (d === 0 ? 'demain, lundi,' : 'demain'); txt = 'Fermé, ouvre ' + nd + ' à 9 h'; }
  $('#status').classList.toggle('open', open); $('#statusTxt').textContent = txt;
  var btn = $('#copy');
  btn.addEventListener('click', function () {
    function ok() { btn.textContent = 'Numéro copié'; setTimeout(function () { btn.textContent = 'Copier le numéro'; }, 2200); }
    function sel() { var r = document.createRange(); r.selectNodeContents($('#telnum')); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    try { navigator.clipboard.writeText('06 09 61 26 41').then(ok, sel); } catch (e) { sel(); }
  });
})();

window.addEventListener('load', function () { if (hasGSAP) ScrollTrigger.refresh(); });
})();
