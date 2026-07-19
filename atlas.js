/* ============================================================
   CRYPTO LAB — ATLAS interactions
   cursor · shader swatch · ticker · clock · reveal · progress
   matrix motif fill · copy buttons
   ============================================================ */
(function(){
  'use strict';

  /* ---------- custom cursor ---------- */
  const fine = matchMedia('(pointer:fine)').matches;
  const cursor = document.getElementById('cursor');
  if(fine && cursor){
    let cx=-100,cy=-100,x=-100,y=-100,started=false;
    addEventListener('mousemove',e=>{
      cx=e.clientX;cy=e.clientY;
      if(!started){started=true;x=cx;y=cy;cursor.classList.add('live');}
      const t=e.target;
      cursor.classList.toggle('big',!!(t.closest&&t.closest('a,button')));
    },{passive:true});
    (function loop(){x+=(cx-x)*.22;y+=(cy-y)*.22;cursor.style.transform='translate3d('+x+'px,'+y+'px,0)';requestAnimationFrame(loop);})();
  }

  /* ---------- shader swatch ---------- */
  document.querySelectorAll('.swatch').forEach(btn=>{
    btn.addEventListener('click',()=>{ if(window.__setShader) window.__setShader(btn.dataset.shader); });
  });
  addEventListener('keydown',e=>{
    const map={'1':'plasma','2':'voronoi','3':'nebula'};
    if(map[e.key]&&window.__setShader&&document.activeElement.tagName!=='INPUT') window.__setShader(map[e.key]);
  });

  /* ---------- card tint ---------- */
  const tint=document.getElementById('tint');
  if(tint&&fine){
    document.querySelectorAll('.card').forEach(card=>{
      card.addEventListener('mouseenter',e=>{
        const a=getComputedStyle(card).getPropertyValue('--a').trim()||'#888';
        tint.style.background='radial-gradient(1100px 700px at '+e.clientX+'px '+e.clientY+'px,'+toRGBA(a,.12)+',transparent 70%)';
        tint.classList.add('on');
      });
      card.addEventListener('mouseleave',()=>tint.classList.remove('on'));
    });
  }
  function toRGBA(c,a){
    c=c.trim();
    if(c.startsWith('#')){const h=c.slice(1);const n=h.length===3?h.split('').map(s=>s+s).join(''):h;const v=parseInt(n,16);return 'rgba('+((v>>16)&255)+','+((v>>8)&255)+','+(v&255)+','+a+')';}
    const m=c.match(/rgba?\(([^)]+)\)/); if(m){const p=m[1].split(',').slice(0,3).join(',');return 'rgba('+p+','+a+')';}
    return 'rgba(136,136,136,'+a+')';
  }

  /* ---------- matrix motif fill ---------- */
  document.querySelectorAll('.mo-matrix').forEach(box=>{
    const cols=9,chars='ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿ01₿Ξ$';
    for(let i=0;i<cols;i++){
      const col=document.createElement('div');
      col.className='col';
      col.style.left=(i/cols*100)+'%';
      col.style.animationDuration=(2.6+Math.random()*3.4)+'s';
      col.style.animationDelay=(-Math.random()*5)+'s';
      col.style.opacity=(.4+Math.random()*.5).toFixed(2);
      let t='';for(let j=0;j<16;j++)t+=chars[Math.floor(Math.random()*chars.length)]+'\n';
      col.textContent=t; box.appendChild(col);
    }
  });

  /* ---------- live ticker (CoinGecko, graceful fallback) ---------- */
  const COINS=[['bitcoin','BTC'],['ethereum','ETH'],['solana','SOL'],['binancecoin','BNB'],['ripple','XRP'],['dogecoin','DOGE'],['cardano','ADA'],['avalanche-2','AVAX'],['chainlink','LINK'],['polkadot','DOT']];
  const track=document.getElementById('ticker-track');
  function fmtPrice(v){ if(v>=1000)return '$'+Math.round(v).toLocaleString('en-US'); if(v>=1)return '$'+v.toFixed(2); return '$'+v.toFixed(4); }
  function renderTicker(rows){
    if(!track)return;
    const half=document.createElement('div');half.className='ticker-half';
    rows.forEach(r=>{
      const item=document.createElement('span');item.className='ti';
      const up=r.chg>=0;
      item.innerHTML='<b>'+r.sym+'</b><span class="tp">'+(r.price==null?'····':fmtPrice(r.price))+'</span>'+(r.chg==null?'':'<span class="tc '+(up?'up':'dn')+'">'+(up?'▲':'▼')+' '+Math.abs(r.chg).toFixed(1)+'%</span>');
      half.appendChild(item);
      const sep=document.createElement('span');sep.className='tsep';sep.textContent='✦';half.appendChild(sep);
    });
    track.innerHTML='';track.appendChild(half);track.appendChild(half.cloneNode(true));
    const w=half.scrollWidth;track.style.setProperty('--dur',Math.max(24,Math.round(w/55))+'s');
  }
  renderTicker(COINS.map(c=>({sym:c[1],price:null,chg:null})));
  (async function(){
    try{
      const ids=COINS.map(c=>c[0]).join(',');
      const res=await fetch('https://api.coingecko.com/api/v3/simple/price?ids='+ids+'&vs_currencies=usd&include_24hr_change=true');
      if(!res.ok)return;
      const data=await res.json();
      renderTicker(COINS.filter(c=>data[c[0]]).map(c=>({sym:c[1],price:data[c[0]].usd,chg:data[c[0]].usd_24h_change})));
    }catch(e){}
  })();

  /* ---------- scroll reveal ---------- */
  const obs=new IntersectionObserver(es=>{es.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');obs.unobserve(en.target);}});},{threshold:.06,rootMargin:'0px 0px -30px 0px'});
  document.querySelectorAll('[data-reveal]').forEach((el,i)=>{el.style.transitionDelay=(Math.min(i%6,4)*55)+'ms';obs.observe(el);});
  function revealVisible(){document.querySelectorAll('[data-reveal]:not(.in)').forEach(el=>{const r=el.getBoundingClientRect();if(r.top<innerHeight+60&&el.offsetParent!==null)el.classList.add('in');});}
  addEventListener('load',()=>setTimeout(revealVisible,200));

  /* ---------- progress bar ---------- */
  const prog=document.querySelector('.progress i');
  function upProg(){const max=document.documentElement.scrollHeight-innerHeight;if(prog)prog.style.width=(max>0?(scrollY/max)*100:0)+'%';}
  addEventListener('scroll',()=>{upProg();revealVisible();},{passive:true});
  addEventListener('resize',upProg,{passive:true});upProg();

  /* ---------- copy buttons ---------- */
  document.querySelectorAll('.copy-btn').forEach(btn=>{
    btn.addEventListener('click',async()=>{
      const target=document.querySelector(btn.dataset.copy); if(!target)return;
      const text=target.textContent.trim();
      try{await navigator.clipboard.writeText(text);}
      catch(err){const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');}catch(e){}ta.remove();}
      btn.classList.add('copied');
      const lbl=btn.querySelector('.lbl');const old=lbl.textContent;lbl.textContent='Copiado';
      setTimeout(()=>{btn.classList.remove('copied');lbl.textContent=old;},1600);
    });
  });

  /* ---------- UTC clock ---------- */
  const clockEl=document.getElementById('clock');
  function tick(){const d=new Date();const p=n=>String(n).padStart(2,'0');if(clockEl)clockEl.textContent=p(d.getUTCHours())+':'+p(d.getUTCMinutes())+':'+p(d.getUTCSeconds());}
  tick();setInterval(tick,1000);
})();
