/* Training Autogeno: lingua, scena "Acqua ferma", copia email, fallback screenshot. */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');

  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var params = new URLSearchParams(location.search);

  function sget(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function sset(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }

  /* Tema: solo per prove (?theme=dark|light); di norma segue il sistema. */
  var th = params.get('theme');
  if (th === 'dark' || th === 'light') root.setAttribute('data-theme', th);

  /* ---------- Lingua ---------- */
  var lang = 'it';
  var storageOK = true;
  var redraws = [];

  function detectLang() {
    var q = (params.get('lang') || '').toLowerCase().slice(0, 2);
    if (q === 'it' || q === 'en') return q;
    var s = sget('ta-lang');
    if (s === 'it' || s === 'en') return s;
    var n = ((navigator.languages && navigator.languages[0]) || navigator.language || 'en').toLowerCase();
    return n.indexOf('it') === 0 ? 'it' : 'en';
  }

  function applyHead(l) {
    var els = document.querySelectorAll('head [data-en]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i], isMeta = el.tagName === 'META';
      if (!el.hasAttribute('data-it')) el.setAttribute('data-it', isMeta ? el.getAttribute('content') : el.textContent);
      var val = el.getAttribute('data-' + l);
      if (isMeta) el.setAttribute('content', val); else el.textContent = val;
    }
  }

  function applyLinks() {
    if (storageOK) return;
    var links = document.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) {
      var h = links[i].getAttribute('href');
      if (!/^[\w\-./]+\.html(#.*)?$/.test(h)) continue;
      var u = new URL(h, location.href);
      u.searchParams.set('lang', lang);
      links[i].setAttribute('href', u.pathname.split('/').pop() + u.search + u.hash);
    }
  }

  function setLang(l, save) {
    lang = l;
    root.setAttribute('lang', l);
    root.setAttribute('data-lang', l);
    var btns = document.querySelectorAll('[data-set-lang]');
    for (var i = 0; i < btns.length; i++) btns[i].setAttribute('aria-pressed', btns[i].getAttribute('data-set-lang') === l ? 'true' : 'false');
    applyHead(l);
    var shots = document.querySelectorAll('img[data-shot]');
    for (var k = 0; k < shots.length; k++) {
      var want = 'assets/img/screens/' + shots[k].getAttribute('data-shot') + '.' + l + '.jpg';
      if (shots[k].getAttribute('src') !== want) shots[k].setAttribute('src', want);
    }
    var alts = document.querySelectorAll('[data-alt-it]');
    for (var a = 0; a < alts.length; a++) alts[a].setAttribute('aria-label', alts[a].getAttribute('data-alt-' + l));
    if (save) storageOK = sset('ta-lang', l);
    applyLinks();
    for (var j = 0; j < redraws.length; j++) redraws[j]();
  }

  setLang(detectLang(), !!params.get('lang'));

  /* ---------- Scena "Acqua ferma" ---------- */
  function rng(seed) {
    var s = seed >>> 0;
    return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  }

  function newScene(seed) {
    var r = rng(seed), stars = [], i;
    for (i = 0; i < 70; i++) stars.push({ x: r(), y: Math.pow(r(), 1.4) * 0.9, a: 0.25 + r() * 0.6, p: r() * 6.28, s: 0.3 + r() * 0.8 });
    var rows = [];
    for (i = 0; i < 20; i++) rows.push({ w: 0.55 + r() * 0.7, ph: r() * 6.28, sp: 0.5 + r() * 0.5 });
    return { r: r, stars: stars, rows: rows, ripples: [], next: -6 };
  }

  function stepScene(S, t, hyFrac) {
    var r = S.r, i;
    while (S.next <= t) {
      if (S.ripples.length < 7) {
        var d = 0.1 + r() * 0.85;
        S.ripples.push({ x: 0.08 + r() * 0.84, d: d, born: S.next, life: 7 + r() * 2 });
      }
      S.next += 1.3 + r() * 1.7;
    }
    for (i = S.ripples.length - 1; i >= 0; i--) if (t - S.ripples[i].born > S.ripples[i].life) S.ripples.splice(i, 1);
  }

  /* Disegna la scena in un rettangolo w x h (coordinate del contesto). */
  function drawWater(ctx, w, h, t, S, o) {
    var hy = h * o.hy, g, i;
    var mx = w * o.mx, my = hy * o.my;
    var mr = Math.max(o.mrMin, Math.min(o.mrMax, Math.min(w, h) * o.mrK));

    /* cielo */
    g = ctx.createLinearGradient(0, 0, 0, hy);
    g.addColorStop(0, '#07100A'); g.addColorStop(0.55, '#10201A'); g.addColorStop(1, '#2C4824');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, hy + 1);

    /* stelle */
    for (i = 0; i < S.stars.length; i++) {
      var s = S.stars[i], tw = 0.55 + 0.45 * Math.sin(t * s.s + s.p);
      ctx.globalAlpha = s.a * tw * (1 - s.y * 0.8);
      ctx.fillStyle = '#E6ECE2';
      ctx.fillRect(s.x * w, s.y * hy, s.s > 0.8 ? 1.6 : 1.1, s.s > 0.8 ? 1.6 : 1.1);
    }
    ctx.globalAlpha = 1;

    /* alone e bagliore d'orizzonte */
    g = ctx.createRadialGradient(mx, my, 0, mx, my, mr * 9);
    g.addColorStop(0, 'rgba(226,238,206,.30)'); g.addColorStop(0.25, 'rgba(190,215,170,.12)'); g.addColorStop(1, 'rgba(190,215,170,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, hy);
    g = ctx.createLinearGradient(0, hy - h * 0.12, 0, hy);
    g.addColorStop(0, 'rgba(120,165,100,0)'); g.addColorStop(1, 'rgba(130,176,110,.34)');
    ctx.fillStyle = g; ctx.fillRect(0, hy - h * 0.12, w, h * 0.12);

    /* luna */
    ctx.fillStyle = '#EEF4E0';
    ctx.beginPath(); ctx.arc(mx, my, mr, 0, 6.2832); ctx.fill();
    ctx.fillStyle = 'rgba(120,150,110,.06)';
    ctx.beginPath(); ctx.arc(mx + mr * 0.28, my + mr * 0.2, mr * 0.7, 0, 6.2832); ctx.fill();

    /* acqua */
    g = ctx.createLinearGradient(0, hy, 0, h);
    g.addColorStop(0, '#2A4421'); g.addColorStop(0.12, '#193019'); g.addColorStop(0.6, '#0E1B11'); g.addColorStop(1, '#070D09');
    ctx.fillStyle = g; ctx.fillRect(0, hy, w, h - hy);
    g = ctx.createLinearGradient(0, hy, 0, hy + 3);
    g.addColorStop(0, 'rgba(190,215,170,.35)'); g.addColorStop(1, 'rgba(190,215,170,0)');
    ctx.fillStyle = g; ctx.fillRect(0, hy, w, 3);

    /* riflesso a trattini che tremolano */
    var reach = Math.min(h - hy - 8, h * 0.36), N = S.rows.length;
    ctx.lineCap = 'round';
    for (i = 0; i < N; i++) {
      var row = S.rows[i], p = (i + 0.5) / N, y = hy + 6 + p * reach;
      var wd = mr * 3.2 * (0.6 + p * 1.5) * row.w;
      var jx = Math.sin(t * row.sp + row.ph) * (1.5 + p * 9);
      var a = 0.62 * Math.pow(1 - p, 1.1) * (0.82 + 0.18 * Math.sin(t * 1.3 + row.ph));
      var th2 = 2 + p * 4.5, x0 = mx + jx - wd / 2;
      var lg = ctx.createLinearGradient(x0, 0, x0 + wd, 0);
      lg.addColorStop(0, 'rgba(232,242,214,0)'); lg.addColorStop(0.5, 'rgba(232,242,214,' + a.toFixed(3) + ')'); lg.addColorStop(1, 'rgba(232,242,214,0)');
      ctx.fillStyle = lg; ctx.fillRect(x0, y - th2 / 2, wd, th2);
    }

    /* increspature ellittiche */
    var wh = h - hy;
    for (i = 0; i < S.ripples.length; i++) {
      var rp = S.ripples[i], age = (t - rp.born) / rp.life;
      if (age < 0 || age > 1) continue;
      var cx = rp.x * w, cy = hy + wh * (0.14 + rp.d * 0.8);
      var maxr = (26 + 120 * rp.d) * (o.rs || 1), ratio = 0.14 + 0.1 * rp.d;
      for (var k = 0; k < 3; k++) {
        var ak = age - k * 0.11;
        if (ak <= 0) continue;
        var e = 1 - Math.pow(1 - Math.min(ak, 1), 2.2);
        var al = 0.55 * Math.pow(1 - Math.min(ak, 1), 1.6) * Math.min(1, ak * 8);
        ctx.strokeStyle = 'rgba(181,204,159,' + al.toFixed(3) + ')';
        ctx.lineWidth = 1 + rp.d * 1.2;
        ctx.beginPath(); ctx.ellipse(cx, cy, Math.max(1, maxr * e), Math.max(0.5, maxr * e * ratio), 0, 0, 6.2832); ctx.stroke();
      }
    }
  }

  function fitCanvas(c) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = c.clientWidth, h = c.clientHeight;
    if (!w || !h) return null;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    var ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }

  function initHero() {
    var c = document.getElementById('scene');
    if (!c || !c.getContext) return;
    var S = newScene(11), t0 = performance.now(), running = false, raf = 0, visible = true;
    function opts(w) {
      var narrow = w < 720;
      return narrow
        ? { hy: 0.45, mx: 0.74, my: 0.5, mrK: 0.05, mrMin: 13, mrMax: 24, rs: 0.8 }
        : { hy: 0.45, mx: 0.74, my: 0.5, mrK: 0.04, mrMin: 18, mrMax: 34, rs: 1 };
    }
    function frame(t) {
      var f = fitCanvas(c);
      if (!f) return;
      stepScene(S, t);
      drawWater(f.ctx, f.w, f.h, t, S, opts(f.w));
    }
    function loop(ts) {
      if (!running) return;
      frame((ts - t0) / 1000);
      raf = requestAnimationFrame(loop);
    }
    function start() { if (running || reduce || !visible || document.hidden) return; running = true; raf = requestAnimationFrame(loop); }
    function stop() { running = false; cancelAnimationFrame(raf); }
    if (reduce) {
      frame(0);
      window.addEventListener('resize', function () { frame(0); });
      return;
    }
    start();
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); else stop(); }).observe(c);
    }
  }

  /* ---------- Telefoni: scene disegnate se manca lo screenshot ---------- */
  var COLORS = ['#8FB07A', '#8E9BA8', '#E3A15C', '#DB8C8C', '#8DBACB', '#E5C36A', '#A6D3E3'];
  var NAMES = {
    it: ['Calma', 'Pesantezza', 'Calore', 'Cuore', 'Respiro', 'Plesso', 'Fronte'],
    en: ['Calm', 'Heaviness', 'Warmth', 'Heart', 'Breath', 'Solar plexus', 'Forehead']
  };
  var FORM = {
    it: ['Io sono calmo e disteso', 'Il braccio destro è pesante', 'Il braccio destro è caldo', 'Il mio cuore batte calmo e rilassato', 'Il respiro è calmo e regolare', 'Il mio plesso solare è piacevolmente caldo', 'La mia fronte è piacevolmente fresca'],
    en: ['I am calm and relaxed', 'My right arm is heavy', 'My right arm is warm', 'My heart beats calm and regular', 'My breath is calm and regular', 'My solar plexus is pleasantly warm', 'My forehead is pleasantly cool']
  };
  var TXT = {
    it: { home: 'Training Autogeno', homeSub: 'Il tuo percorso', setup: 'Prepara la sessione', voice: 'Voce guida', music: 'Musica di sottofondo', timer: 'Timer musica', wake: 'Ripresa finale', start: 'Inizia', sess: 'Calma', paywall: 'Tutti e sette gli esercizi', p1: 'Voce guida e formule', p2: 'Musiche di sottofondo', p3: 'Ripresa finale opzionale', go: 'Continua', restore: 'Ripristina acquisti', cancel: 'Per sempre, senza abbonamento' },
    en: { home: 'Autogenic Training', homeSub: 'Your path', setup: 'Set up your session', voice: 'Guiding voice', music: 'Background music', timer: 'Music timer', wake: 'Final wake-up', start: 'Start', sess: 'Calm', paywall: 'All seven exercises', p1: 'Guiding voice and formulas', p2: 'Background music', p3: 'Optional final wake-up', go: 'Continue', restore: 'Restore purchases', cancel: 'Forever, no subscription' }
  };
  var HF = '"Bricolage Grotesque", "Avenir Next", system-ui, sans-serif';
  var BF = '"Figtree", "Avenir Next", system-ui, sans-serif';

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function wrapText(ctx, text, x, y, maxW, lh, align) {
    var words = text.split(' '), line = '', lines = [], i;
    for (i = 0; i < words.length; i++) {
      var test = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = words[i]; } else line = test;
    }
    lines.push(line);
    ctx.textAlign = align || 'left';
    for (i = 0; i < lines.length; i++) ctx.fillText(lines[i], x, y + i * lh);
    return lines.length;
  }
  function toggle(ctx, x, y, on) {
    rr(ctx, x, y, 46, 26, 13); ctx.fillStyle = on ? '#B5CC9F' : '#2B382B'; ctx.fill();
    ctx.fillStyle = on ? '#0C120E' : '#93A08E';
    ctx.beginPath(); ctx.arc(on ? x + 33 : x + 13, y + 13, 9, 0, 6.2832); ctx.fill();
  }
  function lock(ctx, x, y) {
    ctx.strokeStyle = '#93A08E'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    rr(ctx, x, y + 7, 14, 11, 2.5); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + 7, y + 7, 4.5, Math.PI, 0); ctx.stroke();
  }

  function drawPhone(c, kind) {
    var f = fitCanvas(c);
    if (!f) return;
    var ctx = f.ctx, W = 400, k = f.w / W, H = f.h / k, tx = TXT[lang], i;
    ctx.save(); ctx.scale(k, k);
    ctx.fillStyle = '#0C120E'; ctx.fillRect(0, 0, W, H);
    ctx.textBaseline = 'alphabetic';

    if (kind === 'home') {
      ctx.fillStyle = '#B5CC9F'; ctx.font = '600 28px ' + HF; ctx.textAlign = 'left'; ctx.fillText(tx.home, 32, 108);
      ctx.fillStyle = '#93A08E'; ctx.font = '400 16px ' + BF; ctx.fillText(tx.homeSub, 32, 136);
      ctx.strokeStyle = '#2B382B'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(52, 206); ctx.lineTo(52, 206 + 6 * 96); ctx.stroke();
      for (i = 0; i < 7; i++) {
        var y = 206 + i * 96;
        ctx.save(); ctx.shadowColor = COLORS[i]; ctx.shadowBlur = i === 0 ? 16 : 8;
        ctx.fillStyle = COLORS[i]; ctx.beginPath(); ctx.arc(52, y, 12, 0, 6.2832); ctx.fill(); ctx.restore();
        ctx.fillStyle = '#E6ECE2'; ctx.font = '600 20px ' + HF; ctx.textAlign = 'left'; ctx.fillText(NAMES[lang][i], 88, y - 2);
        ctx.fillStyle = '#93A08E'; ctx.font = 'italic 300 14px ' + BF; ctx.fillText(FORM[lang][i], 88, y + 22, 250);
        if (i > 0) lock(ctx, 352, y - 14);
      }
    } else if (kind === 'setup') {
      ctx.fillStyle = '#E6ECE2'; ctx.font = '600 28px ' + HF; ctx.textAlign = 'left'; ctx.fillText(tx.setup, 32, 108, 340);
      var rows = [[tx.voice, 1], [tx.music, 1], [tx.timer, 2], [tx.wake, 1]];
      for (i = 0; i < rows.length; i++) {
        var ry = 180 + i * 110;
        ctx.strokeStyle = '#2B382B'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(32, ry + 70); ctx.lineTo(368, ry + 70); ctx.stroke();
        ctx.fillStyle = '#E6ECE2'; ctx.font = '500 18px ' + BF; ctx.textAlign = 'left'; ctx.fillText(rows[i][0], 32, ry + 28);
        if (rows[i][1] === 1) toggle(ctx, 322, ry + 8, true);
        else {
          ctx.strokeStyle = '#2B382B'; ctx.lineWidth = 3; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(32, ry + 52); ctx.lineTo(368, ry + 52); ctx.stroke();
          ctx.strokeStyle = '#B5CC9F'; ctx.beginPath(); ctx.moveTo(32, ry + 52); ctx.lineTo(228, ry + 52); ctx.stroke();
          ctx.fillStyle = '#B5CC9F'; ctx.beginPath(); ctx.arc(228, ry + 52, 9, 0, 6.2832); ctx.fill();
        }
      }
      rr(ctx, 32, 720, 336, 56, 12); ctx.fillStyle = '#B5CC9F'; ctx.fill();
      ctx.fillStyle = '#0C120E'; ctx.font = '600 19px ' + HF; ctx.textAlign = 'center'; ctx.fillText(tx.start, 200, 755);
    } else if (kind === 'session') {
      var S = c._S || (c._S = newScene(5));
      if (!c._ready) { for (var q = -6; q < 2; q += 0.5) stepScene(S, q); c._ready = true; }
      drawWater(ctx, W, H, 2, S, { hy: 0.45, mx: 0.5, my: 0.55, mrK: 0.06, mrMin: 16, mrMax: 26, rs: 1.15 });
      ctx.fillStyle = '#E6ECE2'; ctx.font = '600 22px ' + HF; ctx.textAlign = 'center'; ctx.fillText(tx.sess, 200, 100);
      ctx.fillStyle = '#93A08E'; ctx.font = '400 15px ' + BF; ctx.fillText('1 / 7', 200, 126);
      ctx.fillStyle = '#E6ECE2'; ctx.font = 'italic 300 28px ' + BF;
      wrapText(ctx, FORM[lang][0], 200, H - 290, 300, 38, 'center');
      ctx.strokeStyle = 'rgba(230,236,226,.2)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(60, H - 120); ctx.lineTo(340, H - 120); ctx.stroke();
      ctx.strokeStyle = '#B5CC9F'; ctx.beginPath(); ctx.moveTo(60, H - 120); ctx.lineTo(160, H - 120); ctx.stroke();
    } else if (kind === 'paywall') {
      for (i = 0; i < 7; i++) {
        var px = 200 + (i - 3) * 40, py = 160 + Math.pow(i - 3, 2) * 3;
        ctx.save(); ctx.shadowColor = COLORS[i]; ctx.shadowBlur = 12; ctx.fillStyle = COLORS[i];
        ctx.beginPath(); ctx.arc(px, py, 11, 0, 6.2832); ctx.fill(); ctx.restore();
      }
      ctx.fillStyle = '#E6ECE2'; ctx.font = '600 30px ' + HF; ctx.textAlign = 'center';
      wrapText(ctx, tx.paywall, 200, 270, 300, 36, 'center');
      var ps = [tx.p1, tx.p2, tx.p3];
      for (i = 0; i < ps.length; i++) {
        var yy = 400 + i * 54;
        ctx.strokeStyle = '#B5CC9F'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(52, yy - 6); ctx.lineTo(59, yy + 1); ctx.lineTo(70, yy - 12); ctx.stroke();
        ctx.fillStyle = '#E6ECE2'; ctx.font = '400 18px ' + BF; ctx.textAlign = 'left'; ctx.fillText(ps[i], 88, yy);
      }
      rr(ctx, 32, 650, 336, 56, 12); ctx.fillStyle = '#B5CC9F'; ctx.fill();
      ctx.fillStyle = '#0C120E'; ctx.font = '600 19px ' + HF; ctx.textAlign = 'center'; ctx.fillText(tx.go, 200, 685);
      ctx.fillStyle = '#93A08E'; ctx.font = '400 15px ' + BF; ctx.fillText(tx.restore, 200, 744); ctx.fillText(tx.cancel, 200, 772);
    }
    ctx.restore();
  }

  function initPhones() {
    var cs = document.querySelectorAll('canvas[data-phone]');
    function all() { for (var i = 0; i < cs.length; i++) drawPhone(cs[i], cs[i].getAttribute('data-phone')); }
    redraws.push(all);
    all();
    window.addEventListener('resize', all);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(all);
    /* Le immagini reali compaiono da sole (onload) e coprono la scena disegnata. */
    var imgs = document.querySelectorAll('.phone img');
    for (var j = 0; j < imgs.length; j++) if (imgs[j].complete && imgs[j].naturalWidth > 0) imgs[j].classList.add('ok');
  }

  /* ---------- Copia email ---------- */
  function initCopy() {
    var btns = document.querySelectorAll('[data-copy]');
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener('click', function () {
        var src = document.getElementById(b.getAttribute('data-copy'));
        if (!src) return;
        var text = src.textContent.trim();
        function done() {
          b.classList.add('done');
          var it = b.querySelector('[data-l="it"]'), en = b.querySelector('[data-l="en"]');
          if (it && en) { it.setAttribute('data-keep', it.textContent); en.setAttribute('data-keep', en.textContent); it.textContent = 'Copiato'; en.textContent = 'Copied'; }
          setTimeout(function () {
            b.classList.remove('done');
            if (it && en) { it.textContent = it.getAttribute('data-keep'); en.textContent = en.getAttribute('data-keep'); }
          }, 1800);
        }
        function fallback() {
          var ta = document.createElement('textarea');
          ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0';
          document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); done(); } catch (e) { /* niente */ }
          document.body.removeChild(ta);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
        else fallback();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var sw = document.querySelectorAll('[data-set-lang]');
    Array.prototype.forEach.call(sw, function (b) {
      b.addEventListener('click', function () { setLang(b.getAttribute('data-set-lang'), true); });
    });
    setLang(lang, false); /* aggiorna i pulsanti ora che esistono */
    /* Segnaposto degli store: non saltare in cima alla pagina */
    var todo = document.querySelectorAll('a[data-todo][href="#"]');
    Array.prototype.forEach.call(todo, function (a) { a.addEventListener('click', function (e) { e.preventDefault(); }); });
    initHero();
    initPhones();
    initCopy();
  });
})();
