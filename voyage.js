/* ============================================================
   CRYPTO LAB — "VOYAGE" v3 interactions
   starfield · panel observer · rail · live data · matrix rain
   ============================================================ */
(function () {
  'use strict';

  /* ---------- starfield canvas ---------- */
  const cv = document.getElementById('stars');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (cv) {
    const ctx = cv.getContext('2d');
    let W, H, stars = [];
    function resize() {
      W = cv.width = innerWidth * devicePixelRatio;
      H = cv.height = innerHeight * devicePixelRatio;
      cv.style.width = innerWidth + 'px';
      cv.style.height = innerHeight + 'px';
      stars = Array.from({ length: Math.min(220, Math.floor(innerWidth / 7)) }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: (Math.random() * 1.2 + 0.3) * devicePixelRatio,
        v: (Math.random() * 0.06 + 0.015) * devicePixelRatio,
        tw: Math.random() * Math.PI * 2,
        ts: Math.random() * 0.02 + 0.004
      }));
    }
    resize();
    addEventListener('resize', resize);
    function frame() {
      ctx.clearRect(0, 0, W, H);
      for (const s of stars) {
        s.y -= s.v; s.tw += s.ts;
        if (s.y < -4) { s.y = H + 4; s.x = Math.random() * W; }
        const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(s.tw));
        ctx.globalAlpha = a;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!reduced) requestAnimationFrame(frame);
    }
    frame();
  }

  /* ---------- panels: active state + rail + accent ---------- */
  const panels = Array.from(document.querySelectorAll('.panel'));
  const rail = document.getElementById('rail');
  const railBtns = [];
  panels.forEach((p, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.innerHTML = '<span class="lab">' + (p.dataset.label || '') + '</span><span class="dot"></span>';
    btn.addEventListener('click', () => {
      window.scrollTo({ top: p.offsetTop, behavior: 'smooth' });
    });
    rail.appendChild(btn);
    railBtns.push(btn);
  });

  function setActive(i) {
    const p = panels[i];
    if (!p) return;
    railBtns.forEach((b, j) => b.classList.toggle('on', j === i));
    const acc = p.dataset.acc;
    if (acc) document.documentElement.style.setProperty('--acc', acc);
  }

  // primary: IntersectionObserver with a LOW threshold (tall panels on small
  // viewports may never reach high ratios)
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        if (en.intersectionRatio >= 0.3 || en.boundingClientRect.top <= innerHeight * 0.4) {
          setActive(panels.indexOf(en.target));
        }
      });
    }, { threshold: [0.12, 0.3, 0.6], rootMargin: '0px 0px -8% 0px' });
    panels.forEach(p => obs.observe(p));
  }

  // fallback + belt-and-braces: reveal any panel near the viewport on scroll,
  // and keep rail/accent in sync even if IO never fires
  function revealVisible() {
    const vh = innerHeight;
    panels.forEach(p => {
      if (p.classList.contains('in')) return;
      const r = p.getBoundingClientRect();
      if (r.top < vh * 0.88 && r.bottom > vh * 0.12) p.classList.add('in');
    });
    setActive(currentIndex());
  }
  addEventListener('scroll', revealVisible, { passive: true });
  addEventListener('resize', revealVisible, { passive: true });
  addEventListener('load', () => setTimeout(revealVisible, 150));
  setTimeout(revealVisible, 400);

  // make sure first panel is live immediately
  if (panels[0]) { panels[0].classList.add('in'); setActive(0); }

  /* keyboard nav */
  function currentIndex() {
    const y = scrollY + innerHeight / 2;
    let best = 0, bd = Infinity;
    panels.forEach((p, i) => {
      const d = Math.abs(p.offsetTop + p.offsetHeight / 2 - y);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  }
  addEventListener('keydown', e => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'PageDown' && e.key !== 'PageUp') return;
    if (/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    e.preventDefault();
    const i = currentIndex();
    const next = (e.key === 'ArrowDown' || e.key === 'PageDown') ? Math.min(i + 1, panels.length - 1) : Math.max(i - 1, 0);
    window.scrollTo({ top: panels[next].offsetTop, behavior: 'smooth' });
  });

  /* ---------- live market data (CoinGecko) ---------- */
  const IDS = ['bitcoin', 'ethereum', 'solana', 'binancecoin', 'ripple'];
  const SYM = { bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL', binancecoin: 'BNB', ripple: 'XRP' };
  function fmt(v) {
    if (v >= 1000) return '$' + v.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (v >= 1) return '$' + v.toFixed(2);
    return '$' + v.toFixed(4);
  }
  function sparkPath(prices, w, h) {
    const n = prices.length;
    if (!n) return '';
    let min = Infinity, max = -Infinity;
    for (const p of prices) { if (p < min) min = p; if (p > max) max = p; }
    const span = (max - min) || 1;
    const pts = prices.map((p, i) => [
      (i / (n - 1)) * w,
      h - 3 - ((p - min) / span) * (h - 6)
    ]);
    return 'M' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L');
  }
  (async function load() {
    try {
      const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=' + IDS.join(',') + '&sparkline=true&price_change_percentage=24h';
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const byId = {};
      data.forEach(d => { byId[d.id] = d; });

      // pulse cards
      IDS.forEach(id => {
        const d = byId[id];
        if (!d) return;
        const card = document.querySelector('.pcard[data-id="' + id + '"]');
        if (!card) return;
        const up = (d.price_change_percentage_24h || 0) >= 0;
        card.querySelector('.price').textContent = fmt(d.current_price);
        const chg = card.querySelector('.chg');
        chg.textContent = (up ? '▲ +' : '▼ ') + (d.price_change_percentage_24h || 0).toFixed(2) + '% · 24h';
        chg.classList.add(up ? 'up' : 'dn');
        const sp = d.sparkline_in_7d && d.sparkline_in_7d.price;
        if (sp && sp.length) {
          const sampled = sp.filter((_, i) => i % 4 === 0);
          const path = card.querySelector('svg.spark path.line');
          path.setAttribute('d', sparkPath(sampled, 120, 40));
          path.setAttribute('stroke', up ? '#0ecb81' : '#f6465d');
        }
      });

      // mini BTC in top bar
      const b = byId.bitcoin;
      if (b) {
        const mini = document.getElementById('btc-mini');
        if (mini) {
          const up = (b.price_change_percentage_24h || 0) >= 0;
          mini.innerHTML = '<b>BTC</b> ' + fmt(b.current_price) +
            ' <span class="chg ' + (up ? 'up' : 'dn') + '">' + (up ? '+' : '') +
            (b.price_change_percentage_24h || 0).toFixed(1) + '%</span>';
        }
      }

      // sentiment tug-of-war: share of gainers among loaded coins
      const ups = data.filter(d => (d.price_change_percentage_24h || 0) >= 0).length;
      const bull = Math.round(30 + (ups / data.length) * 40); // 30..70 band
      const tug = document.querySelector('.tug-bar');
      if (tug) {
        tug.style.setProperty('--bull', bull + '%');
        const bl = document.querySelector('.tug-labels .bulls');
        const br = document.querySelector('.tug-labels .bears');
        if (bl) bl.textContent = 'Touros ' + bull + '%';
        if (br) br.textContent = Math.round(100 - bull) + '% Ursos';
      }
    } catch (e) { /* offline — placeholders stay */ }
  })();

  /* ---------- matrix rain ---------- */
  const mc = document.getElementById('matrix-canvas');
  if (mc && !reduced) {
    const mctx = mc.getContext('2d');
    const CHARS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄ01₿Ξ$¥';
    let cols, drops, fs;
    function msize() {
      const r = mc.parentElement.getBoundingClientRect();
      mc.width = r.width; mc.height = r.height;
      fs = 16;
      cols = Math.floor(mc.width / fs);
      drops = Array.from({ length: cols }, () => Math.random() * -50);
    }
    msize();
    addEventListener('resize', msize);
    let visible = false;
    new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: 0.05 }).observe(mc);
    setInterval(() => {
      if (!visible) return;
      mctx.fillStyle = 'rgba(4, 3, 10, 0.12)';
      mctx.fillRect(0, 0, mc.width, mc.height);
      mctx.font = fs + 'px monospace';
      for (let i = 0; i < cols; i++) {
        const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
        const y = drops[i] * fs;
        mctx.fillStyle = Math.random() > 0.975 ? '#d8ffe8' : '#00ff66';
        mctx.fillText(ch, i * fs, y);
        if (y > mc.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    }, 50);
  }

  /* ---------- copy buttons ---------- */
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const target = document.querySelector(btn.dataset.copy);
      if (!target) return;
      const text = target.textContent.trim();
      try { await navigator.clipboard.writeText(text); }
      catch (err) {
        const ta = document.createElement('textarea'); ta.value = text;
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (e) {} ta.remove();
      }
      btn.classList.add('copied');
      const old = btn.textContent;
      btn.textContent = 'Copiado';
      setTimeout(() => { btn.classList.remove('copied'); btn.textContent = old; }, 1500);
    });
  });
})();
