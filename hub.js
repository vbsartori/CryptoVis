/* ============================================================
   CRYPTO LAB hub v3 — interactions
   i18n · cursor · peek previews · tint · ticker · misc
   ============================================================ */
(function () {
  'use strict';

  /* ---------- i18n (markup = PT, dict = EN) ---------- */
  const EN = {
    'ui.wallpaper': 'Wallpaper',
    'ui.copy': 'Copy',
    'hero.eyebrow': 'Eight worlds · one market · vol. 03',
    'hero.h1': 'Crypto, but you can <em>walk through it.</em>',
    'hero.lead': 'A collection of experimental dashboards — different ways to <em>feel</em> the market beyond the green-and-red candle. Hover the index. Pick a world. Stay a while.',
    'hero.stat.viz': 'Visualizations',
    'hero.stat.data': 'Market data',
    'hero.stat.utc': 'UTC now',
    'sec.worlds.h': 'Worlds',
    'sec.worlds.desc': 'Experiential, atmospheric ways to inhabit the market — built to be felt, not just read.',
    'sec.instr.h': 'Instruments',
    'sec.instr.desc': 'Precision tools for when you want the data straight — live prices and classic technical analysis.',
    'galaxy.tag': 'Cosmic / orbital',
    'galaxy.sub': 'Every coin is a celestial body — Bitcoin is the sun.',
    'bubbles.tag': 'Floating / soap',
    'bubbles.sub': 'Iridescent spheres: green rises, red sinks. Pop one.',
    'prix.tag': 'Race / leaderboard',
    'prix.sub': 'The top coins race their 24h performance on a track.',
    'city.tag': 'Cyberpunk / grid',
    'city.sub': 'A synthwave city where every token is a building.',
    'matrix.tag': 'Digital rain',
    'matrix.sub': 'Prices rain down in green katakana. The market has you.',
    'sentiment.tag': 'Bulls vs bears',
    'sentiment.sub': 'A 3am trading floor — fear, greed, RSI and news.',
    'pulse.tag': 'Market dashboard',
    'pulse.sub': 'BTC, ETH, gold, S&P and Nasdaq on one calm screen.',
    'ichimoku.tag': 'Ichimoku cloud',
    'ichimoku.sub': 'Bitcoin read through the Japanese equilibrium chart.',
    'peek.enter': 'Enter →',
    'op.tag': 'The operator · who builds this',
    'op.h2': 'Behind the <em>laboratory.</em>',
    'op.p': 'Victor Bruno Sartori — an electrical engineer moving between energy, data and markets. Energy regulation, market intelligence, data science, A.I. and DeFi: this lab is where all of it collides.',
    'op.role': 'Electrical engineer · Data scientist',
    'op.status': 'Open to projects',
    'op.btn': 'Open CV',
    'coffee.tag': 'Bitcoffee · keep the lab open',
    'coffee.h2': 'Buy me a <em>Bitcoffee.</em>',
    'coffee.p': 'If any of these worlds made you smile, tip me a sip. Every satoshi goes back into building stranger, more beautiful ways to look at the market.\n          <span class="signature" data-i18n="coffee.sig">— Made with caffeine and curiosity</span>',
    'coffee.sig': '— Made with caffeine and curiosity',
    'footer.mid': 'Move the mouse. Click and hold. Try all three wallpapers.',
    'footer.cv': 'Curriculum',
    'footer.right': 'Built with caffeine ✦'
  };
  const COPIED = { en: 'Copied', pt: 'Copiado' };
  const PT_BASE = new Map();
  document.querySelectorAll('[data-i18n]').forEach(el => PT_BASE.set(el, el.innerHTML));
  let lang = 'pt';
  try { lang = localStorage.getItem('lab.lang') || 'pt'; } catch (e) {}
  function applyLang(l) {
    lang = l;
    document.documentElement.lang = (l === 'pt') ? 'pt-BR' : 'en';
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const k = el.dataset.i18n;
      if (l === 'en' && EN[k] != null) el.innerHTML = EN[k];
      else if (PT_BASE.has(el)) el.innerHTML = PT_BASE.get(el);
    });
    document.querySelectorAll('.lang-toggle button').forEach(b => b.classList.toggle('on', b.dataset.lang === l));
    try { localStorage.setItem('lab.lang', l); } catch (e) {}
  }
  document.querySelectorAll('.lang-toggle button').forEach(b => b.addEventListener('click', () => applyLang(b.dataset.lang)));
  applyLang(lang);

  /* ---------- shader switcher ---------- */
  document.querySelectorAll('.swatch').forEach(btn => {
    btn.addEventListener('click', () => { if (window.__setShader) window.__setShader(btn.dataset.shader); });
  });
  window.addEventListener('keydown', e => {
    const map = { '1': 'plasma', '2': 'voronoi', '3': 'nebula' };
    if (map[e.key] && window.__setShader && document.activeElement.tagName !== 'INPUT') window.__setShader(map[e.key]);
  });

  /* ---------- custom cursor ring ---------- */
  const fine = window.matchMedia('(pointer: fine)').matches;
  const cursor = document.getElementById('cursor');
  if (fine && cursor) {
    let cx = -100, cy = -100, x = -100, y = -100, started = false;
    window.addEventListener('mousemove', e => {
      cx = e.clientX; cy = e.clientY;
      if (!started) { started = true; x = cx; y = cy; cursor.classList.add('live'); }
      const t = e.target;
      cursor.classList.toggle('big', !!(t.closest && t.closest('a, button')));
    }, { passive: true });
    (function loop() {
      x += (cx - x) * 0.22; y += (cy - y) * 0.22;
      cursor.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- peek preview + page tint ---------- */
  const peek = document.getElementById('peek');
  const tint = document.getElementById('tint');
  const peekEnabled = fine && window.innerWidth > 900 && peek;
  if (peekEnabled) {
    const PW = 360, PH = 230;
    let tx = innerWidth / 2, ty = innerHeight / 2, px = tx, py = ty;
    let active = null;

    function setTarget(e) {
      let nx = e.clientX + 30;
      let ny = e.clientY - PH - 26;
      if (nx + PW > innerWidth - 16) nx = e.clientX - PW - 30;
      if (ny < 16) ny = e.clientY + 30;
      if (ny + PH > innerHeight - 16) ny = innerHeight - PH - 16;
      tx = nx; ty = ny;
    }
    (function loop() {
      px += (tx - px) * 0.16; py += (ty - py) * 0.16;
      peek.style.transform = 'translate3d(' + px + 'px,' + py + 'px,0)';
      requestAnimationFrame(loop);
    })();

    document.querySelectorAll('.irow').forEach(row => {
      row.addEventListener('mouseenter', e => {
        const id = row.dataset.pv;
        document.querySelectorAll('#peek .pv').forEach(p => p.classList.toggle('on', p.dataset.pv === id));
        const accent = getComputedStyle(row).getPropertyValue('--a').trim() || '#888888';
        peek.querySelector('.peek-card').style.setProperty('--a', accent);
        if (tint) {
          tint.style.background = 'radial-gradient(1000px 640px at ' + e.clientX + 'px ' + e.clientY + 'px, ' +
            toRGBA(accent, 0.13) + ', transparent 70%)';
          tint.classList.add('on');
        }
        if (active !== id) { px = tx; py = ty; }
        active = id;
        setTarget(e);
        peek.classList.add('on');
      });
      row.addEventListener('mousemove', setTarget, { passive: true });
      row.addEventListener('mouseleave', () => {
        active = null;
        peek.classList.remove('on');
        if (tint) tint.classList.remove('on');
      });
    });

    function toRGBA(c, a) {
      c = c.trim();
      if (c.startsWith('#')) {
        const h = c.slice(1);
        const n = h.length === 3 ? h.split('').map(s => s + s).join('') : h;
        const v = parseInt(n, 16);
        return 'rgba(' + ((v >> 16) & 255) + ',' + ((v >> 8) & 255) + ',' + (v & 255) + ',' + a + ')';
      }
      const m = c.match(/rgba?\(([^)]+)\)/);
      if (m) { const p = m[1].split(',').slice(0, 3).join(','); return 'rgba(' + p + ',' + a + ')'; }
      return 'rgba(136,136,136,' + a + ')';
    }
  }

  /* ---------- live ticker (CoinGecko, graceful fallback) ---------- */
  const COINS = [
    ['bitcoin', 'BTC'], ['ethereum', 'ETH'], ['solana', 'SOL'], ['binancecoin', 'BNB'],
    ['ripple', 'XRP'], ['dogecoin', 'DOGE'], ['cardano', 'ADA'], ['avalanche-2', 'AVAX'],
    ['chainlink', 'LINK'], ['polkadot', 'DOT']
  ];
  const track = document.getElementById('ticker-track');
  function fmtPrice(v) {
    if (v >= 1000) return '$' + Math.round(v).toLocaleString('en-US');
    if (v >= 1) return '$' + v.toFixed(2);
    return '$' + v.toFixed(4);
  }
  function renderTicker(rows) {
    if (!track) return;
    const half = document.createElement('div');
    half.className = 'ticker-half';
    rows.forEach(r => {
      const item = document.createElement('span');
      item.className = 'ti';
      const up = r.chg >= 0;
      item.innerHTML = '<b>' + r.sym + '</b><span class="tp">' + (r.price == null ? '····' : fmtPrice(r.price)) + '</span>' +
        (r.chg == null ? '' : '<span class="tc ' + (up ? 'up' : 'dn') + '">' + (up ? '▲' : '▼') + ' ' + Math.abs(r.chg).toFixed(1) + '%</span>');
      half.appendChild(item);
      const sep = document.createElement('span');
      sep.className = 'tsep'; sep.textContent = '✦';
      half.appendChild(sep);
    });
    track.innerHTML = '';
    track.appendChild(half);
    track.appendChild(half.cloneNode(true));
    const w = half.scrollWidth;
    track.style.setProperty('--dur', Math.max(24, Math.round(w / 55)) + 's');
  }
  renderTicker(COINS.map(c => ({ sym: c[1], price: null, chg: null })));
  (async function loadTicker() {
    try {
      const ids = COINS.map(c => c[0]).join(',');
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=' + ids + '&vs_currencies=usd&include_24hr_change=true');
      if (!res.ok) return;
      const data = await res.json();
      renderTicker(COINS.filter(c => data[c[0]]).map(c => ({
        sym: c[1],
        price: data[c[0]].usd,
        chg: data[c[0]].usd_24h_change
      })));
    } catch (e) { /* offline — keep placeholders */ }
  })();

  /* ---------- matrix rain preview ---------- */
  const mp = document.getElementById('pv-matrix');
  if (mp) {
    const cols = 12, chars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿ01₿Ξ$';
    for (let i = 0; i < cols; i++) {
      const col = document.createElement('div');
      col.className = 'col';
      col.style.left = (i / cols * 100) + '%';
      col.style.animationDuration = (3 + Math.random() * 4) + 's';
      col.style.animationDelay = (-Math.random() * 6) + 's';
      col.style.opacity = (0.4 + Math.random() * 0.6).toFixed(2);
      let text = '';
      for (let j = 0; j < 20; j++) text += chars[Math.floor(Math.random() * chars.length)] + '\n';
      col.textContent = text;
      mp.appendChild(col);
    }
  }

  /* ---------- scroll reveal ---------- */
  const obs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); obs.unobserve(en.target); }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
  document.querySelectorAll('[data-reveal]').forEach((el, i) => {
    el.style.transitionDelay = (Math.min(i % 8, 4) * 60) + 'ms';
    obs.observe(el);
  });
  function revealVisible() {
    document.querySelectorAll('[data-reveal]:not(.in)').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight + 60 && el.offsetParent !== null) el.classList.add('in');
    });
  }
  window.addEventListener('load', () => setTimeout(revealVisible, 200));
  window.addEventListener('scroll', revealVisible, { passive: true });

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
      const lbl = btn.querySelector('.lbl'); const old = lbl.textContent;
      lbl.textContent = COPIED[lang] || 'Copied';
      setTimeout(() => { btn.classList.remove('copied'); lbl.textContent = old; }, 1600);
    });
  });

  /* ---------- live UTC clock ---------- */
  const clockEl = document.getElementById('clock');
  function tick() {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    if (clockEl) clockEl.textContent = p(d.getUTCHours()) + ':' + p(d.getUTCMinutes()) + ':' + p(d.getUTCSeconds());
  }
  tick(); setInterval(tick, 1000);
})();
