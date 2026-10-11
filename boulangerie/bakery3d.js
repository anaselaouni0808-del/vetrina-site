/* Maison Escoubès: viennoiseries modélisées en 3D (Three.js r128) */
(function () {
  var THREE = window.THREE;
  if (!THREE) return;
  var TAU = Math.PI * 2;
  function lin(hex) { return new THREE.Color(hex).convertSRGBToLinear(); }
  function rand(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function seg(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }
  function smooth(t) { return t * t * (3 - 2 * t); }

  /* Build a closed tube-like surface from a function f(i/nu, j/nv) -> [x,y,z, r,g,b, extra] */
  function gridGeo(nu, nv, fn, wrapV, extraName, flip) {
    var pos = [], col = [], ext = [], idx = [];
    var cols = wrapV ? nv : nv + 1;
    for (var i = 0; i <= nu; i++) {
      for (var j = 0; j < cols; j++) {
        var o = fn(i / nu, j / nv);
        pos.push(o[0], o[1], o[2]); col.push(o[3], o[4], o[5]); ext.push(o[6] || 0);
      }
    }
    for (var a = 0; a < nu; a++) {
      for (var b = 0; b < nv; b++) {
        var b1 = wrapV ? (b + 1) % nv : b + 1;
        var p0 = a * cols + b, p1 = a * cols + b1, p2 = (a + 1) * cols + b, p3 = (a + 1) * cols + b1;
        if (flip) idx.push(p0, p1, p2, p1, p3, p2); else idx.push(p0, p2, p1, p1, p2, p3);
      }
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    if (extraName) g.setAttribute(extraName, new THREE.Float32BufferAttribute(ext, 1));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  /* ---------- Canelé: fluted copper-mould shape, caramelised crust ---------- */
  var caneleGeoCache = null;
  function caneleGeo() {
    if (caneleGeoCache) return caneleGeoCache;
    var H = 1, flutes = 10, r = rand(5);
    var cTop = lin('#2a0c03'), cMid = lin('#6a2509'), cLow = lin('#8a3c12'), cRidge = lin('#b0571d'), cGroove = lin('#3a1205');
    var side = gridGeo(46, 160, function (u, v) {
      var y = u * H, th = v * TAU;
      var r0 = 0.46 - 0.05 * u;
      if (u > 0.86) { var t = (u - 0.86) / 0.14; r0 *= 1 - 0.16 * t * t; }
      if (u < 0.05) { var tb = 1 - u / 0.05; r0 *= 1 - 0.05 * tb * tb; }
      var c = Math.cos(th * flutes / 2); var ridge = Math.pow(Math.abs(c), 0.55);
      var rr = r0 * (0.91 + 0.11 * ridge);
      var base = new THREE.Color().copy(cLow).lerp(cMid, smooth(clamp(u * 1.3, 0, 1))).lerp(cTop, smooth(seg(u, 0.55, 1)));
      base.lerp(cGroove, (1 - ridge) * 0.55); base.lerp(cRidge, Math.pow(ridge, 6) * 0.35 * (1 - u));
      var n = 0.92 + r() * 0.12;
      return [Math.cos(th) * rr, y, Math.sin(th) * rr, base.r * n, base.g * n, base.b * n];
    }, true);
    var top = gridGeo(14, 160, function (u, v) {
      var th = v * TAU, rho = 1 - u;
      var c = Math.cos(th * flutes / 2), ridge = Math.pow(Math.abs(c), 0.55);
      var rTop = (0.46 - 0.05) * 0.84 * (0.91 + 0.11 * ridge);
      var rr = rTop * rho;
      var y = H - 0.11 * (1 - rho * rho) + 0.015 * Math.sin(rho * 9);
      var cc = new THREE.Color().copy(lin('#3d1406')).lerp(lin('#1d0702'), smooth(1 - rho));
      if (rho > 0.82) cc.lerp(lin('#5e220a'), (rho - 0.82) / 0.18 * 0.6);
      return [Math.cos(th) * rr, y, Math.sin(th) * rr, cc.r, cc.g, cc.b];
    }, true);
    caneleGeoCache = { side: side, top: top };
    return caneleGeoCache;
  }
  var caneleMat = null;
  function canele() {
    var g = caneleGeo();
    if (!caneleMat) caneleMat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.42, metalness: 0, clearcoat: 0.75, clearcoatRoughness: 0.32, side: THREE.DoubleSide });
    var grp = new THREE.Group();
    var a = new THREE.Mesh(g.side, caneleMat), b = new THREE.Mesh(g.top, caneleMat);
    a.castShadow = b.castShadow = true; a.receiveShadow = true;
    grp.add(a, b);
    return grp;
  }

  /* ---------- Baguette: crust shader with grignes (scores) ---------- */
  function baguetteGeo(opt) {
    opt = opt || {};
    var L = opt.len || 2.6, R = opt.r || 0.2, slashes = opt.slashes || 5, rnd = rand(opt.seed || 3);
    var noise = [];
    function shape(u, v, rise, score) {
      var x = (u * 2 - 1);
      var th = v * TAU;
      var prof = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(x), 5)), 0.42);
      var rr = R * prof * (1 + 0.18 * rise);
      var t = th - Math.PI / 2; if (t > Math.PI) t -= TAU;
      var g = 0, ear = 0;
      for (var k = 0; k < slashes; k++) {
        var uk = -0.66 + k * (1.32 / (slashes - 1));
        var s = (x - uk) * (L / 2);
        if (Math.abs(s) > 0.2) continue;
        var d = (t - s * 3.0) * R;
        var along = 1 - Math.pow(Math.abs(s) / 0.2, 2);
        if (Math.abs(d) < 0.045) g = Math.max(g, (1 - Math.abs(d) / 0.045) * along);
        if (d > 0.03 && d < 0.09) ear = Math.max(ear, Math.sin((d - 0.03) / 0.06 * Math.PI) * along);
      }
      rr *= 1 - 0.13 * g * score; rr *= 1 + 0.07 * ear * score;
      var y = Math.sin(th) * rr, z = Math.cos(th) * rr;
      if (y < 0) y *= 0.5;
      return { p: [x * (L / 2) * (1 + 0.03 * rise), y, z * 0.92], g: g * score };
    }
    var nu = 110, nv = 56;
    var geo = gridGeo(nu, nv, function (u, v) {
      var s = shape(u, v, 0, 0); var n = 0.9 + rnd() * 0.12; noise.push(n);
      return [s.p[0], s.p[1], s.p[2], n, n, n, 0];
    }, true, 'aGroove');
    if (opt.morph) {
      var risen = [], scored = [], groove = geo.getAttribute('aGroove'), base = geo.getAttribute('position');
      var k = 0;
      for (var i = 0; i <= nu; i++) for (var j = 0; j < nv; j++) {
        var a = shape(i / nu, j / nv, 1, 0), b = shape(i / nu, j / nv, 1, 1);
        risen.push(a.p[0] - base.getX(k), a.p[1] - base.getY(k), a.p[2] - base.getZ(k));
        scored.push(b.p[0] - a.p[0], b.p[1] - a.p[1], b.p[2] - a.p[2]);
        groove.setX(k, b.g); k++;
      }
      geo.morphAttributes.position = [new THREE.Float32BufferAttribute(risen, 3), new THREE.Float32BufferAttribute(scored, 3)];
      geo.morphTargetsRelative = true;
    } else {
      var p = geo.getAttribute('position'), gr = geo.getAttribute('aGroove'), m = 0;
      for (var i2 = 0; i2 <= nu; i2++) for (var j2 = 0; j2 < nv; j2++) {
        var c = shape(i2 / nu, j2 / nv, 1, 1); p.setXYZ(m, c.p[0], c.p[1], c.p[2]); gr.setX(m, c.g); m++;
      }
      geo.computeVertexNormals();
    }
    return geo;
  }
  function crustMaterial(uBake, uScore, morph) {
    var mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0 });
    if (morph) { mat.morphTargets = true; }
    mat.onBeforeCompile = function (sh) {
      sh.uniforms.uBake = uBake; sh.uniforms.uScore = uScore;
      sh.vertexShader = 'attribute float aGroove;\nvarying float vGroove;\nvarying float vTop;\n' +
        sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvGroove = aGroove;\nvTop = normal.y;');
      sh.fragmentShader = 'uniform float uBake;\nuniform float uScore;\nvarying float vGroove;\nvarying float vTop;\n' +
        sh.fragmentShader.replace('#include <color_fragment>', [
          '#include <color_fragment>',
          'vec3 dough = pow(vec3(0.94, 0.89, 0.79), vec3(2.2));',
          'vec3 crustTop = pow(vec3(0.66, 0.36, 0.13), vec3(2.2));',
          'vec3 crustSide = pow(vec3(0.85, 0.58, 0.29), vec3(2.2));',
          'vec3 crust = mix(crustSide, crustTop, smoothstep(-0.1, 0.9, vTop));',
          'vec3 groove = pow(vec3(0.93, 0.79, 0.55), vec3(2.2));',
          'float g = clamp(vGroove * uScore, 0.0, 1.0);',
          'vec3 baked = mix(crust, groove, g * 0.85);',
          'diffuseColor.rgb *= mix(dough * (1.0 - 0.28 * g), baked, uBake);'
        ].join('\n'));
    };
    return mat;
  }
  var bakedU = { value: 1 }, scoredU = { value: 1 };
  function baguette(seed) {
    var m = new THREE.Mesh(baguetteGeo({ seed: seed }), crustMaterial(bakedU, scoredU, false));
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }

  /* ---------- Pain au levain (boule) ---------- */
  function boule() {
    var r = rand(17);
    var geo = gridGeo(40, 90, function (u, v) {
      var ph = u * Math.PI, th = v * TAU;
      var x = Math.sin(ph) * Math.cos(th), z = Math.sin(ph) * Math.sin(th), y = Math.cos(ph);
      var rad = 1;
      var a1 = Math.abs(x * 0.8 - z * 0.6), a2 = Math.abs(x * 0.6 + z * 0.8);
      var cut = 0;
      if (y > 0.25) { if (a1 < 0.06) cut = 1 - a1 / 0.06; if (a2 < 0.06) cut = Math.max(cut, 1 - a2 / 0.06); }
      rad -= 0.05 * cut;
      var yy = y > 0 ? y * 0.62 : y * 0.18;
      var c = lin('#b06c32').lerp(lin('#7c4318'), smooth(clamp(y, 0, 1)));
      if (cut > 0) c.lerp(lin('#efd9ae'), cut * 0.9);
      if (y > 0.45 && r() < 0.08) c.lerp(lin('#efe6d6'), 0.35 + r() * 0.3);
      var n = 0.92 + r() * 0.1;
      return [x * rad * 0.9, yy * rad * 0.9 + 0.16, z * rad * 0.9, c.r * n, c.g * n, c.b * n];
    }, true, null, true);
    var m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }));
    m.castShadow = m.receiveShadow = true;
    return m;
  }

  /* ---------- Croissant ---------- */
  function croissant() {
    var r = rand(29);
    var geo = gridGeo(140, 48, function (u, v) {
      var ph = (u * 2 - 1) * 1.6, th = v * TAU;
      var Rc = 0.62;
      var cx = Math.sin(ph) * Rc, cz = -Math.cos(ph) * Rc + Rc * 0.75;
      var body = Math.pow(Math.max(0, 1 - Math.pow(ph / 1.6, 2)), 0.75);
      var roll = ph / 0.36 + Math.sin(th) * 0.35;
      var groove = Math.pow(Math.abs(Math.sin(roll * Math.PI)), 0.35);
      var tr = (0.42 * body + 0.004) * (0.86 + 0.14 * groove);
      var nx = Math.sin(ph), nz = -Math.cos(ph);
      var ox = Math.cos(th) * tr, oy = Math.sin(th) * tr * 0.82;
      if (oy < 0) oy *= 0.35;
      var top = clamp(Math.sin(th), 0, 1);
      var c = lin('#d39443').lerp(lin('#9c5014'), smooth(top) * 0.85).lerp(lin('#7a3a0e'), (1 - groove) * 0.55 * (0.4 + top));
      if (Math.abs(ph) > 1.25) c.lerp(lin('#8a4512'), (Math.abs(ph) - 1.25) / 0.3 * 0.5);
      var n = 0.93 + r() * 0.08;
      return [cx + nx * ox, oy + 0.06, cz + nz * ox, c.r * n, c.g * n, c.b * n];
    }, true, null, true);
    var m = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.55, clearcoat: 0.22, clearcoatRoughness: 0.6 }));
    m.castShadow = m.receiveShadow = true;
    return m;
  }

  /* ---------- Chocolatine ---------- */
  function roundedRect(w, h, rr) {
    var s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + rr, y); s.lineTo(x + w - rr, y); s.quadraticCurveTo(x + w, y, x + w, y + rr); s.lineTo(x + w, y + h - rr);
    s.quadraticCurveTo(x + w, y + h, x + w - rr, y + h); s.lineTo(x + rr, y + h); s.quadraticCurveTo(x, y + h, x, y + h - rr);
    s.lineTo(x, y + rr); s.quadraticCurveTo(x, y, x + rr, y); return s;
  }
  function chocolatine() {
    var grp = new THREE.Group();
    var geo = new THREE.ExtrudeGeometry(roundedRect(1.25, 0.42, 0.19), { depth: 0.7, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 5, curveSegments: 12 });
    geo.translate(0, 0.27, -0.35);
    var pos = geo.getAttribute('position'), cols = [], r = rand(41);
    for (var i = 0; i < pos.count; i++) {
      var y = pos.getY(i);
      var c = lin('#d99a4c').lerp(lin('#8a4614'), smooth(clamp((y - 0.1) / 0.45, 0, 1)) * 0.9);
      var layer = 0.5 + 0.5 * Math.sin(y * 60); c.lerp(lin('#f1cf96'), layer * 0.22);
      var xs = pos.getX(i); if (y > 0.4) { var band = Math.pow(Math.abs(Math.sin(xs * 7.5)), 6); c.lerp(lin('#7a3c10'), band * 0.45); }
      var n = 0.93 + r() * 0.08; cols.push(c.r * n, c.g * n, c.b * n);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    var m = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.5, clearcoat: 0.35 }));
    m.castShadow = m.receiveShadow = true; grp.add(m);
    var choc = new THREE.MeshStandardMaterial({ color: lin('#2e160c'), roughness: 0.35 });
    [-0.12, 0.12].forEach(function (dz) { [-0.66, 0.66].forEach(function (dx) {
      var b = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.12), choc); b.position.set(dx, 0.26 + dz * 0.4, dz); grp.add(b);
    }); });
    return grp;
  }

  /* ---------- Flan pâtissier (slice) ---------- */
  function flan() {
    var grp = new THREE.Group();
    var shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(1.2, 0.35); shape.lineTo(1.2, -0.35); shape.lineTo(0, 0);
    var custard = new THREE.ExtrudeGeometry(shape, { depth: 0.5, bevelEnabled: false });
    custard.rotateX(-Math.PI / 2); custard.translate(-0.6, 0.1, 0);
    var mC = new THREE.Mesh(custard, new THREE.MeshStandardMaterial({ color: lin('#f3d27a'), roughness: 0.55 }));
    var top = new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: false }); top.rotateX(-Math.PI / 2); top.translate(-0.6, 0.6, 0);
    var tc = [], tp = top.getAttribute('position'), r = rand(7);
    for (var i = 0; i < tp.count; i++) { var c = lin('#8a4416').lerp(lin('#c97b35'), r()); tc.push(c.r, c.g, c.b); }
    top.setAttribute('color', new THREE.Float32BufferAttribute(tc, 3));
    var mT = new THREE.Mesh(top, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 }));
    var base = new THREE.ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: false }); base.rotateX(-Math.PI / 2); base.translate(-0.6, 0.02, 0);
    var mB = new THREE.Mesh(base, new THREE.MeshStandardMaterial({ color: lin('#c98a44'), roughness: 0.7 }));
    var crust = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.62, 0.72), new THREE.MeshStandardMaterial({ color: lin('#c27f3c'), roughness: 0.7 }));
    crust.position.set(0.62, 0.33, 0);
    [mC, mT, mB, crust].forEach(function (m) { m.castShadow = m.receiveShadow = true; grp.add(m); });
    return grp;
  }

  /* ---------- Shared bits ---------- */
  function standMesh() {
    var pts = [[0, 0], [0.55, 0], [0.56, 0.04], [0.18, 0.1], [0.12, 0.2], [0.11, 0.66], [0.16, 0.74], [1.12, 0.78], [1.18, 0.83], [1.16, 0.86], [0, 0.86]].map(function (p) { return new THREE.Vector2(p[0], p[1]); });
    var m = new THREE.Mesh(new THREE.LatheGeometry(pts, 64), new THREE.MeshPhysicalMaterial({ color: lin('#f8f4ea'), roughness: 0.25, clearcoat: 0.6 }));
    m.castShadow = m.receiveShadow = true; return m;
  }
  function basketMesh() {
    var pts = [[0, 0], [0.42, 0], [0.47, 0.06], [0.56, 0.62], [0.6, 0.68], [0.55, 0.69], [0.5, 0.64], [0.42, 0.08], [0, 0.08]].map(function (p) { return new THREE.Vector2(p[0], p[1]); });
    var geo = new THREE.LatheGeometry(pts, 72);
    var pos = geo.getAttribute('position'), cols = [];
    for (var i = 0; i < pos.count; i++) {
      var a = Math.atan2(pos.getZ(i), pos.getX(i)), y = pos.getY(i);
      var w = Math.sin(a * 18 + Math.floor(y * 12) * Math.PI) > 0 ? 1 : 0.72;
      var c = lin('#b5813f'); cols.push(c.r * w, c.g * w, c.b * w);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    var m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide }));
    m.castShadow = m.receiveShadow = true; return m;
  }
  function softTexture() {
    var c = document.createElement('canvas'); c.width = c.height = 128; var x = c.getContext('2d');
    var g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128); var t = new THREE.CanvasTexture(c); return t;
  }
  function makeRenderer(canvas, opts) {
    var r = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, preserveDrawingBuffer: !!(opts && opts.keep) });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.08;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    return r;
  }
  function warmLights(scene, shadowSize) {
    scene.add(new THREE.HemisphereLight(0xfff3dc, 0x3a2412, 0.62));
    var key = new THREE.DirectionalLight(0xfff0d6, 1.35); key.position.set(-3, 6, 4.5); key.castShadow = true;
    key.shadow.mapSize.set(shadowSize || 1024, shadowSize || 1024); key.shadow.camera.left = -4; key.shadow.camera.right = 4; key.shadow.camera.top = 4; key.shadow.camera.bottom = -2; key.shadow.radius = 4; key.shadow.bias = -0.0008;
    scene.add(key);
    var rim = new THREE.PointLight(0xffb35c, 1.1, 14, 1.5); rim.position.set(1.6, 3, -2.4); scene.add(rim);
    var fill = new THREE.DirectionalLight(0xffffff, 0.28); fill.position.set(2, 2, 6); scene.add(fill);
    return { key: key, rim: rim };
  }
  function easeOutBounce(x) {
    var n1 = 7.5625, d1 = 2.75;
    if (x < 1 / d1) return n1 * x * x;
    if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
    if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
    return n1 * (x -= 2.625 / d1) * x + 0.984375;
  }
  function visibleLoop(el, fn) {
    var running = false, raf = 0, last = 0;
    function tick(now) { if (!running) return; var dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now; fn(dt, now / 1000); raf = requestAnimationFrame(tick); }
    function start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(tick); }
    function stop() { running = false; cancelAnimationFrame(raf); }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { e[0].isIntersecting ? start() : stop(); }, { rootMargin: '120px' }).observe(el);
    else start();
    return { start: start, stop: stop };
  }


  /* =========================================================
     1. La boutique qui s'ouvre (hero, piloté par le scroll)
     ========================================================= */
  function shutterTexture() {
    var c = document.createElement('canvas'); c.width = 1024; c.height = 768; var x = c.getContext('2d');
    var g = x.createLinearGradient(0, 0, 0, 768); g.addColorStop(0, '#74636b'); g.addColorStop(1, '#4d3f47');
    x.fillStyle = g; x.fillRect(0, 0, 1024, 768);
    for (var y = 0; y < 768; y += 16) {
      var s = x.createLinearGradient(0, y, 0, y + 16);
      s.addColorStop(0, 'rgba(255,255,255,0.16)'); s.addColorStop(0.5, 'rgba(0,0,0,0.0)'); s.addColorStop(1, 'rgba(0,0,0,0.28)');
      x.fillStyle = s; x.fillRect(0, y, 1024, 16);
    }
    x.save(); x.globalAlpha = 0.35; x.fillStyle = '#f6d777'; x.font = '600 44px "Figtree", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('FERMÉ · OUVERTURE À 6 H 45', 512, 690); x.restore();
    var t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  function signTexture() {
    var c = document.createElement('canvas'); c.width = 1024; c.height = 200; var x = c.getContext('2d');
    x.fillStyle = '#3d0f22'; x.fillRect(0, 0, 1024, 200);
    x.strokeStyle = '#f6d777'; x.lineWidth = 5; x.strokeRect(14, 14, 996, 172);
    x.fillStyle = '#f6d777'; x.font = '400 104px "Young Serif", Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('Maison Escoubès', 512, 106);
    var t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  function awningTexture() {
    var c = document.createElement('canvas'); c.width = 512; c.height = 128; var x = c.getContext('2d');
    for (var i = 0; i < 16; i++) { x.fillStyle = i % 2 ? '#f7dcd4' : '#8a2342'; x.fillRect(i * 32, 0, 32, 128); }
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  }
  function openTexture(on) {
    var c = document.createElement('canvas'); c.width = 256; c.height = 128; var x = c.getContext('2d');
    x.fillStyle = on ? '#fff3c4' : '#2a1018'; x.fillRect(0, 0, 256, 128);
    x.strokeStyle = on ? '#8a2342' : '#5a3a46'; x.lineWidth = 6; x.strokeRect(8, 8, 240, 112);
    x.fillStyle = on ? '#8a2342' : '#5a3a46'; x.font = '400 66px "Young Serif", Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(on ? 'Ouvert' : 'Fermé', 128, 68);
    var t = new THREE.CanvasTexture(c); return t;
  }

  function Hero(host, opts) {
    var reduce = !!opts.reduce, lite = !!opts.lite;
    var canvas = document.createElement('canvas'); canvas.className = 'hero-3d'; canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !lite, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lite ? 1.5 : 2));
    renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = !lite; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x1a0610, 16, 48);
    var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 80);

    /* lights: a cold street light, and the warm shop light that comes on as the shutter rises */
    var street = new THREE.HemisphereLight(0x9fb0ff, 0x2a0a16, 0.95); scene.add(street);
    var moon = new THREE.DirectionalLight(0xaebcff, 0.7); moon.position.set(-4, 5, 12); scene.add(moon);
    var shop = new THREE.DirectionalLight(0xffe2b8, 0); shop.position.set(-2, 6, 6); shop.castShadow = !lite;
    shop.shadow.mapSize.set(1024, 1024); shop.shadow.camera.left = -5; shop.shadow.camera.right = 5; shop.shadow.camera.top = 5; shop.shadow.camera.bottom = -2; shop.shadow.bias = -0.0008; shop.shadow.radius = 4;
    scene.add(shop);
    var glow = new THREE.PointLight(0xffb35c, 0, 16, 1.6); glow.position.set(0, 3.2, 0.6); scene.add(glow);

    var wineStone = new THREE.MeshStandardMaterial({ color: lin('#3d0f22'), roughness: 0.8 });
    var wineLight = new THREE.MeshStandardMaterial({ color: lin('#6a1a35'), roughness: 0.7 });

    /* facade */
    var W = 6.4, H = 4.6, Z = 2.0;
    var facade = new THREE.Group(); scene.add(facade);
    var pillarL = new THREE.Mesh(new THREE.BoxGeometry(2.4, H + 1.6, 0.5), wineStone); pillarL.position.set(-(W / 2 + 1.2), (H + 1.6) / 2 - 0.2, Z); facade.add(pillarL);
    var pillarR = pillarL.clone(); pillarR.position.x = W / 2 + 1.2; facade.add(pillarR);
    var lintel = new THREE.Mesh(new THREE.BoxGeometry(W + 4.8, 1.6, 0.5), wineStone); lintel.position.set(0, H + 0.6, Z); facade.add(lintel);
    var sign = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 0.94), new THREE.MeshStandardMaterial({ map: signTexture(), roughness: 0.6, emissive: 0x2a0a16, emissiveIntensity: 0.4 }));
    sign.position.set(0, H + 0.55, Z + 0.27); facade.add(sign);
    var sill = new THREE.Mesh(new THREE.BoxGeometry(W + 0.4, 0.3, 0.7), wineLight); sill.position.set(0, -0.05, Z + 0.1); sill.receiveShadow = true; facade.add(sill);
    var floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), new THREE.MeshStandardMaterial({ color: lin('#1d0a14'), roughness: 0.9 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, -0.2, 6); floor.receiveShadow = true; scene.add(floor);
    var back = new THREE.Mesh(new THREE.PlaneGeometry(W + 1, H + 1), new THREE.MeshStandardMaterial({ color: lin('#4f1228'), roughness: 0.85, emissive: 0x2a0a16, emissiveIntensity: 0 }));
    back.position.set(0, H / 2, -2.4); scene.add(back);

    /* shelves on the back wall */
    var shelfMat = new THREE.MeshStandardMaterial({ color: lin('#f3d8c8'), roughness: 0.6 });
    [1.6, 2.7, 3.8].forEach(function (y) { var s = new THREE.Mesh(new THREE.BoxGeometry(W - 0.6, 0.06, 0.5), shelfMat); s.position.set(0, y, -2.15); s.receiveShadow = true; scene.add(s); });

    /* counter */
    var counter = new THREE.Mesh(new THREE.BoxGeometry(W, 0.9, 2.2), new THREE.MeshStandardMaterial({ color: lin('#f4ddd2'), roughness: 0.5 }));
    counter.position.set(0, 0.2, 0.55); counter.receiveShadow = true; scene.add(counter);
    var counterFront = new THREE.Mesh(new THREE.BoxGeometry(W, 0.9, 0.06), new THREE.MeshStandardMaterial({ color: lin('#5a1630'), roughness: 0.55 }));
    counterFront.position.set(0, 0.2, 1.67); scene.add(counterFront);
    var linen = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.1), new THREE.MeshStandardMaterial({ color: lin('#fff7f3'), roughness: 0.95 }));
    linen.rotation.x = -Math.PI / 2; linen.rotation.z = 0.12; linen.position.set(-0.35, 0.655, 1.0); linen.receiveShadow = true; scene.add(linen);
    var TOP = 0.65;

    /* canelés pyramid on a stand */
    var stand = standMesh(); stand.position.set(0.9, TOP, 0.2); scene.add(stand);
    var S = 0.55, plateY = TOP + 0.86;
    var slots = [[-0.55, 0, 0.12], [0, 0, 0.12], [0.55, 0, 0.12], [-0.3, 0, -0.38], [0.3, 0, -0.38], [-0.27, 1, -0.12], [0.27, 1, -0.12], [0, 2, -0.12]];
    var caneles = [];
    slots.forEach(function (s, i) {
      var c = canele(); c.scale.setScalar(S);
      var tx = 0.9 + s[0], ty = plateY + s[1] * S * 0.98, tz = 0.2 + s[2];
      c.position.set(tx, ty + 5, tz); c.rotation.y = i * 0.7; c.traverse(function (m) { m.userData.canele = i; if (m.isMesh) m.castShadow = true; });
      scene.add(c); caneles.push({ g: c, tx: tx, ty: ty, tz: tz, hop: 0, spin: 0, hover: 0, baseRot: i * 0.7, order: i });
    });

    /* basket of baguettes */
    var basket = basketMesh(); basket.scale.setScalar(0.9); basket.position.set(-1.7, TOP, 0.1); scene.add(basket);
    var bags = [];
    [[-0.1, 0.18, 0.05], [0.12, -0.12, -0.08], [0.0, 0.02, 0.14]].forEach(function (b, i) {
      var m = baguette(11 + i * 7); m.scale.setScalar(0.62); m.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
      var pivot = new THREE.Group(); pivot.position.set(-1.7 + b[0], TOP + 0.1, 0.1 + b[2]);
      m.rotation.z = Math.PI / 2; m.position.y = 0.78; pivot.rotation.z = b[1]; pivot.rotation.y = i * 1.3; pivot.add(m); scene.add(pivot); bags.push({ p: pivot, b: b, i: i });
    });
    var cr = croissant(); cr.scale.setScalar(0.72); cr.position.set(-0.4, TOP, 1.05); cr.rotation.y = 0.35; scene.add(cr);

    /* steam */
    var soft = softTexture(), wisps = [];
    for (var w = 0; w < 6; w++) {
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: soft, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
      sp.userData = { x: w < 3 ? -1.7 + (w - 1) * 0.2 : 0.9 + (w - 4) * 0.22, y: w < 3 ? TOP + 1.7 : TOP + 2.7, ph: w * 0.37 }; scene.add(sp); wisps.push(sp);
    }

    /* roller shutter: a corrugated sheet that rolls up into a box above the opening */
    var shutGeo = new THREE.PlaneGeometry(W, H); shutGeo.translate(0, -H / 2, 0);
    var shutter = new THREE.Mesh(shutGeo, new THREE.MeshStandardMaterial({ map: shutterTexture(), roughness: 0.6, metalness: 0.12 }));
    shutter.position.set(0, H, Z + 0.35); scene.add(shutter);
    var rollBox = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, W, 24), new THREE.MeshStandardMaterial({ color: lin('#4d3f47'), roughness: 0.4, metalness: 0.6 }));
    rollBox.rotation.z = Math.PI / 2; rollBox.position.set(0, H + 0.05, Z + 0.36); scene.add(rollBox);
    var barMesh = new THREE.Mesh(new THREE.BoxGeometry(W, 0.14, 0.14), new THREE.MeshStandardMaterial({ color: lin('#2e242a'), roughness: 0.4, metalness: 0.7 }));
    scene.add(barMesh);

    /* awning, unfurls after the shutter */
    var awnTex = awningTexture();
    var awnGeo = new THREE.PlaneGeometry(W + 0.6, 1.1, 1, 1); awnGeo.translate(0, -0.55, 0);
    var awning = new THREE.Mesh(awnGeo, new THREE.MeshStandardMaterial({ map: awnTex, roughness: 0.9, side: THREE.DoubleSide }));
    awning.position.set(0, H - 0.05, Z + 0.3); scene.add(awning);
    var scallop = new THREE.Mesh(new THREE.BoxGeometry(W + 0.6, 0.12, 0.05), new THREE.MeshStandardMaterial({ color: lin('#8a2342'), roughness: 0.8 })); scene.add(scallop);

    /* "Ouvert" board, flips when the shop is open */
    var openMat = new THREE.MeshStandardMaterial({ map: openTexture(false), roughness: 0.6 });
    var openMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.45), openMat); openMesh.position.set(W / 2 - 0.6, 3.6, Z + 0.28); scene.add(openMesh);
    var openOn = openTexture(true), openOff = openMat.map;

    var state = { p: 0, mx: 0, my: 0, hover: -1, t: 0, open: false };
    var ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), pickables = [];
    caneles.forEach(function (c) { c.g.traverse(function (m) { if (m.isMesh) pickables.push(m); }); });
    function pick(e) { var r = canvas.getBoundingClientRect(); ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1; ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1; ray.setFromCamera(ndc, camera); var h = ray.intersectObjects(pickables, false)[0]; return h ? h.object.userData.canele : -1; }
    var area = opts.pointerArea || host;
    area.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var r = host.getBoundingClientRect(); state.mx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1.2, 1.2); state.my = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1.2, 1.2);
      if (state.p > 0.6) { var h = pick(e); state.hover = h; canvas.style.cursor = h >= 0 ? 'pointer' : ''; }
    });
    area.addEventListener('pointerleave', function () { state.mx = state.my = 0; state.hover = -1; });
    area.addEventListener('click', function (e) {
      if (state.p < 0.6) return;
      var h = pick(e);
      if (h >= 0) { caneles[h].hop = 1; caneles[h].spin = 1; if (opts.onCanele) opts.onCanele(); }
    });

    var portraitK = 0, fitD = 0;
    function resize() {
      var w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
      portraitK = clamp((1.15 - w / h) / 0.7, 0, 1);
      fitD = (W + 1.2) / (2 * Math.tan(15 * Math.PI / 180) * camera.aspect);
    }
    resize(); window.addEventListener('resize', resize);

    var camPos = new THREE.Vector3(0, 3, 16), look = new THREE.Vector3(0, 2.6, 0);
    function ease(t) { return t * t * (3 - 2 * t); }
    function frame(dt, now) {
      state.t += dt;
      var p = reduce ? 1 : state.p;
      var e = ease(seg(p, 0.06, 0.5));                     // shutter: 0 closed → 1 open
      var lights = ease(seg(p, 0.18, 0.5));
      shop.intensity = lights * 1.25; glow.intensity = lights * 1.0; street.intensity = 0.95 - lights * 0.55; moon.intensity = 0.7 - lights * 0.5;
      back.material.emissiveIntensity = lights * 0.9;
      shutter.scale.y = 1 - e * 0.97; barMesh.position.set(0, H - H * shutter.scale.y - 0.05 + 0.0, Z + 0.35);
      barMesh.position.y = H - H * shutter.scale.y; barMesh.visible = e < 0.98; shutter.visible = e < 0.99;
      var aw = ease(seg(p, 0.55, 0.75));                   // awning: rolled up → out
      awning.scale.y = 0.04 + aw * 0.96; awning.rotation.x = -aw * 0.62; scallop.position.set(0, H - 0.05 - 1.1 * awning.scale.y * Math.cos(aw * 0.62), Z + 0.3 + 1.1 * awning.scale.y * Math.sin(aw * 0.62)); scallop.visible = aw > 0.02;
      var on = p > 0.72 && state.open; if (openMat.map !== (on ? openOn : openOff)) { openMat.map = on ? openOn : openOff; openMat.needsUpdate = true; }

      var d = Math.max(17.5, fitD) * (1 - ease(seg(p, 0, 1)) * (0.24 + portraitK * 0.06));
      var yaw = reduce ? 0 : state.mx * 0.16 + Math.sin(state.t * 0.25) * 0.03;
      var shiftX = (1 - portraitK) * 1.15 * ease(seg(p, 0.62, 0.9));
      var want = new THREE.Vector3(shiftX + Math.sin(yaw) * d, 3.0 + (reduce ? 0 : state.my * 0.4) - ease(seg(p, 0.3, 1)) * 0.7, Math.cos(yaw) * d);
      camPos.lerp(want, 1 - Math.exp(-5 * dt)); camera.position.copy(camPos);
      look.set(shiftX, 3.3 + portraitK * 2.2 - ease(seg(p, 0.3, 0.8)) * (0.4 + portraitK * 4.2), 0); camera.lookAt(look);

      caneles.forEach(function (c, i) {
        var pp = reduce ? 1 : clamp((p - 0.46 - i * 0.022) / 0.14, 0, 1);
        var y = c.ty + (1 - easeOutBounce(pp)) * 5;
        c.hover += ((state.hover === i ? 1 : 0) - c.hover) * Math.min(1, dt * 10);
        if (c.hop > 0) c.hop = Math.max(0, c.hop - dt * 1.6);
        var hopY = Math.sin((1 - c.hop) * Math.PI) * (c.hop > 0 ? 0.55 : 0);
        if (c.spin > 0) c.spin = Math.max(0, c.spin - dt * 1.4);
        c.g.position.set(c.tx, y + hopY + c.hover * 0.08, c.tz);
        c.g.rotation.y = c.baseRot + (1 - c.spin) * (c.spin > 0 ? TAU : 0) + c.hover * 0.4;
        c.g.rotation.z = pp < 1 ? (1 - pp) * 0.4 * (i % 2 ? 1 : -1) : 0;
        c.g.visible = pp > 0 || reduce;
      });
      bags.forEach(function (b) {
        var pp = reduce ? 1 : ease(clamp((p - 0.4 - b.i * 0.03) / 0.16, 0, 1));
        b.p.position.y = TOP + 0.1 + (1 - pp) * 5; b.p.visible = pp > 0 || reduce;
        b.p.rotation.z = b.b[1] + (reduce ? 0 : Math.sin(state.t * 0.8 + b.i * 2) * 0.015);
      });
      var crp = reduce ? 1 : ease(clamp((p - 0.42) / 0.16, 0, 1)); cr.position.y = TOP + (1 - crp) * 5; cr.visible = crp > 0 || reduce;
      var st = clamp((p - 0.6) / 0.2, 0, 1);
      wisps.forEach(function (sp, i) {
        var dd = sp.userData, cyc = ((state.t * 0.28 + dd.ph) % 1);
        sp.position.set(dd.x + Math.sin(state.t * 0.9 + i) * 0.12 * cyc, dd.y + cyc * 1.3, 0.1);
        var s = 0.35 + cyc * 0.9; sp.scale.set(s, s * 1.4, 1); sp.material.opacity = reduce ? 0 : Math.sin(cyc * Math.PI) * 0.16 * st;
      });
      renderer.render(scene, camera);
    }
    var loop = visibleLoop(host, frame);
    return { canvas: canvas, loop: loop, set: function (p) { state.p = p; }, setOpen: function (o) { state.open = !!o; } };
  }

  /* =========================================================
     2. Produits : rendus 3D, rotation en direct (survol ou doigt)
     ========================================================= */
  function Products(cards, opts) {
    var reduce = !!opts.reduce, fine = !!opts.fine;
    var canvas = document.createElement('canvas'); canvas.className = 'prod-3d';
    var renderer = makeRenderer(canvas, { keep: true });
    var W = 640, H = 460; renderer.setPixelRatio(1); renderer.setSize(W, H, false);
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 50);
    warmLights(scene, 1024);
    var catcher = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShadowMaterial({ opacity: 0.24 }));
    catcher.rotation.x = -Math.PI / 2; catcher.receiveShadow = true; scene.add(catcher);
    var holder = new THREE.Group(); scene.add(holder);
    function shadowify(g) { g.traverse(function (o) { if (o.isMesh) o.castShadow = true; }); return g; }
    function model(id) {
      var g = new THREE.Group();
      if (id === 'tradition') { var b = baguette(5); b.rotation.y = 0.3; b.scale.setScalar(1.25); b.position.y = 0.2; g.add(b); }
      else if (id === 'levain') { var m = boule(); m.scale.setScalar(1.15); g.add(m); }
      else if (id === 'canele') { var a = canele(); a.scale.setScalar(1.05); a.position.set(-0.45, 0, 0.1); var c2 = canele(); c2.scale.setScalar(0.85); c2.position.set(0.55, 0, -0.2); c2.rotation.y = 1; g.add(a, c2); }
      else if (id === 'chocolatine') { var ch = chocolatine(); ch.rotation.y = 0.55; ch.scale.setScalar(1.3); g.add(ch); }
      else if (id === 'croissant') { var cr = croissant(); cr.scale.setScalar(1.55); cr.rotation.y = 0.2; cr.position.z = -0.3; g.add(cr); }
      else if (id === 'flan') { var fl = flan(); fl.rotation.y = 0.9; fl.scale.setScalar(1.4); g.add(fl); }
      return shadowify(g);
    }
    camera.position.set(0, 2.3, 4.8); camera.lookAt(0, 0.38, 0);
    var items = cards.map(function (card) {
      var id = card.getAttribute('data-id'); var art = card.querySelector('.product-art');
      var m = model(id); holder.add(m); m.visible = false;
      return { card: card, art: art, m: m, img: null };
    });
    items.forEach(function (it) {
      items.forEach(function (o) { o.m.visible = o === it; });
      holder.rotation.y = 0; renderer.render(scene, camera);
      var img = new Image(); img.alt = ''; img.className = 'prod-img'; img.src = canvas.toDataURL('image/png');
      var svg = it.art.querySelector('svg'); if (svg) svg.style.display = 'none';
      it.art.appendChild(img); it.img = img; it.card.classList.add('is-3d');
    });
    items.forEach(function (o) { o.m.visible = false; });

    var active = null, raf = 0, last = 0, ang = 0, vel = 1.1, drag = null, bob = 0;
    function tick(now) {
      if (!active) return;
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!drag) ang += dt * vel; bob += dt;
      holder.rotation.y = ang; holder.position.y = Math.sin(bob * 2.4) * 0.04;
      renderer.render(scene, camera); raf = requestAnimationFrame(tick);
    }
    function activate(it) {
      if (active === it) return; if (active) deactivate(active);
      items.forEach(function (o) { o.m.visible = o === it; });
      active = it; ang = 0; bob = 0; it.art.appendChild(canvas); canvas.classList.add('on'); it.img.classList.add('off');
      last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
    }
    function deactivate(it) {
      if (active !== it) return;
      active = null; cancelAnimationFrame(raf); canvas.classList.remove('on'); it.img.classList.remove('off'); holder.rotation.y = 0; holder.position.y = 0;
    }
    items.forEach(function (it) {
      if (reduce) return;
      if (fine) {
        it.card.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') activate(it); });
        it.card.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') deactivate(it); });
      }
      /* finger or mouse: drag the product to turn it */
      it.art.addEventListener('pointerdown', function (e) {
        if (e.target.closest('button')) return;
        activate(it); drag = { x: e.clientX, a: ang }; vel = 0;
        try { it.art.setPointerCapture(e.pointerId); } catch (er) {}
      });
      it.art.addEventListener('pointermove', function (e) { if (drag && active === it) { ang = drag.a + (e.clientX - drag.x) * 0.012; } });
      var end = function () { if (drag) { drag = null; vel = 0.9; } };
      it.art.addEventListener('pointerup', end); it.art.addEventListener('pointercancel', end);
      it.art.style.touchAction = 'pan-y';
    });
    return { items: items };
  }

  window.Bakery3D = { Hero: Hero, Products: Products };
})();
