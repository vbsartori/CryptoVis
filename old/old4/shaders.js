/* ===========================================================
   Mouse-reactive WebGL shader wallpapers.
   Three modes: 'plasma' (liquid chrome), 'voronoi' (cells),
   'nebula' (warped starfield).
   =========================================================== */
(function () {
  const canvas = document.getElementById('bg-shader');
  if (!canvas) return;
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false });
  if (!gl) {
    canvas.style.display = 'none';
    document.body.classList.add('no-webgl');
    return;
  }

  const VERT = `
    attribute vec2 a_pos;
    void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
  `;

  const COMMON = `
    precision highp float;
    uniform vec2  u_res;
    uniform vec2  u_mouse;   // 0..1
    uniform vec2  u_mouseV;  // velocity
    uniform float u_time;
    uniform float u_hold;    // 0..1 mouse held
  `;

  // ---------- PLASMA / LIQUID CHROME ----------
  const FRAG_PLASMA = COMMON + `
    // hash + value noise
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
    float vnoise(vec2 p){
      vec2 i = floor(p); vec2 f = fract(p);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      vec2 u = f*f*(3.0-2.0*f);
      return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
    }
    float fbm(vec2 p){
      float v = 0.0; float a = 0.5;
      for(int i = 0; i < 5; i++){
        v += a * vnoise(p);
        p *= 2.02; a *= 0.5;
      }
      return v;
    }
    void main(){
      vec2 uv = gl_FragCoord.xy / u_res.xy;
      vec2 p  = (gl_FragCoord.xy - 0.5*u_res.xy) / min(u_res.x, u_res.y);
      vec2 m  = (u_mouse - 0.5) * vec2(u_res.x/u_res.y, 1.0);

      // displacement field warped by mouse
      vec2 q  = p * 1.8;
      float t = u_time * 0.10;
      vec2 warp = vec2(
        fbm(q + vec2(t, 0.0) + m*1.3),
        fbm(q + vec2(0.0, t) - m*1.3)
      );
      // pull field toward mouse — slight gravitational lens
      vec2 d  = p - m;
      float r = length(d);
      vec2 lens = -d * (0.20 / (r + 0.25)) * (0.6 + 0.6*u_hold);
      warp += lens;

      float n = fbm(q*1.4 + warp*1.6 + t*0.7);
      float n2 = fbm(q*3.0 + warp*2.0 - t*0.5);
      float v = mix(n, n2, 0.5);

      // iridescent ramp — cool neutrals, slight magenta-cyan iridescence
      vec3 c1 = vec3(0.020, 0.022, 0.030);
      vec3 c2 = vec3(0.060, 0.066, 0.085);
      vec3 c3 = vec3(0.120, 0.110, 0.150);
      vec3 c4 = vec3(0.180, 0.220, 0.280);
      vec3 col = mix(c1, c2, smoothstep(0.10, 0.45, v));
      col = mix(col, c3, smoothstep(0.45, 0.65, v));
      col = mix(col, c4, smoothstep(0.65, 0.85, v));

      // iridescent thin-film highlight along the gradient direction
      float hi = smoothstep(0.62, 0.72, v) - smoothstep(0.72, 0.82, v);
      vec3 irid = 0.5 + 0.5*cos(6.2831*(vec3(0.0, 0.33, 0.67) + v*1.5 + u_time*0.05));
      col += hi * irid * 0.18;

      // mouse highlight
      float halo = exp(-r*r*4.0) * 0.10;
      col += halo * vec3(0.6, 0.7, 1.0);

      // vignette
      float vig = smoothstep(1.2, 0.3, length(p));
      col *= 0.55 + 0.55*vig;

      // film grain
      float g = (hash(gl_FragCoord.xy + u_time) - 0.5) * 0.025;
      col += g;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  // ---------- VORONOI CELLS ----------
  const FRAG_VORONOI = COMMON + `
    vec2 hash2(vec2 p){
      p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
      return fract(sin(p)*43758.5453);
    }
    // returns vec3(F1, F2, cell-id)
    vec3 voro(vec2 x){
      vec2 n = floor(x); vec2 f = fract(x);
      float F1 = 8.0, F2 = 8.0;
      float id = 0.0;
      for(int j=-1; j<=1; j++){
        for(int i=-1; i<=1; i++){
          vec2 g = vec2(float(i), float(j));
          vec2 o = hash2(n+g);
          o = 0.5 + 0.5*sin(u_time*0.4 + 6.2831*o);
          vec2 r = g + o - f;
          float d = dot(r,r);
          if(d < F1){ F2 = F1; F1 = d; id = dot(n+g, vec2(7.0, 113.0)); }
          else if(d < F2){ F2 = d; }
        }
      }
      return vec3(sqrt(F1), sqrt(F2), id);
    }
    float hash11(float x){ return fract(sin(x)*43758.5453); }
    void main(){
      vec2 res = u_res;
      vec2 p   = (gl_FragCoord.xy - 0.5*res) / min(res.x, res.y);
      vec2 m   = (u_mouse - 0.5) * vec2(res.x/res.y, 1.0);

      float scale = 4.5;
      vec2 q = p * scale + vec2(u_time*0.08, -u_time*0.05);
      vec3 v = voro(q);
      float edge = v.y - v.x;             // 0 at cell boundary
      float edgeMask = smoothstep(0.02, 0.10, edge);

      // identify mouse cell
      vec2 mq = m * scale + vec2(u_time*0.08, -u_time*0.05);
      vec3 mv = voro(mq);
      float sameCell = step(abs(mv.z - v.z), 0.5);

      // base palette — ink + slight shifting hue based on cell id
      float hue = fract(v.z * 0.10);
      vec3 base = vec3(0.045, 0.050, 0.060);
      vec3 tint = 0.5 + 0.5*cos(6.2831*(vec3(0.0,0.33,0.67) + hue));
      vec3 col  = base + tint * 0.020;

      // depth from cell distance
      col *= 0.6 + 0.9*edgeMask;

      // hovered cell glow
      float pulse = 0.55 + 0.45*sin(u_time*2.2 + hue*6.2831);
      col += sameCell * tint * 0.18 * pulse;
      col += sameCell * vec3(0.10, 0.12, 0.18) * 0.4;

      // bright cell boundary lines
      float bound = 1.0 - smoothstep(0.0, 0.04, edge);
      col += bound * vec3(0.30, 0.34, 0.42) * (0.5 + 0.5*sameCell);

      // pulse ring out from mouse on hold
      float r = length(p - m);
      float ring = u_hold * exp(-pow(r - mod(u_time*0.6, 1.6), 2.0)*40.0);
      col += ring * vec3(0.5, 0.7, 1.0) * 0.25;

      // vignette
      col *= 0.55 + 0.5*smoothstep(1.2, 0.2, length(p));

      // grain
      col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233))+u_time)*43758.5453) - 0.5)*0.020;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  // ---------- NEBULA WARP ----------
  const FRAG_NEBULA = COMMON + `
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
    float vnoise(vec2 p){
      vec2 i = floor(p); vec2 f = fract(p);
      float a = hash(i), b = hash(i+vec2(1,0)),
            c = hash(i+vec2(0,1)), d = hash(i+vec2(1,1));
      vec2 u = f*f*(3.0-2.0*f);
      return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
    }
    float fbm(vec2 p){
      float v = 0.0; float a = 0.5;
      for(int i=0;i<6;i++){ v += a*vnoise(p); p *= 2.07; a *= 0.5; }
      return v;
    }
    float stars(vec2 p, float density){
      vec2 i = floor(p);
      float h = hash(i);
      vec2 f = fract(p) - 0.5;
      float twinkle = 0.5 + 0.5*sin(u_time*2.0 + h*42.0);
      float s = step(1.0-density, h);
      float d = length(f);
      return s * smoothstep(0.10, 0.0, d) * twinkle;
    }
    void main(){
      vec2 res = u_res;
      vec2 p   = (gl_FragCoord.xy - 0.5*res) / min(res.x, res.y);
      vec2 m   = (u_mouse - 0.5) * vec2(res.x/res.y, 1.0);

      // warp around mouse — swirl
      vec2 d = p - m;
      float r = length(d);
      float ang = atan(d.y, d.x) + (0.7/(r+0.35)) * (0.4 + 0.8*u_hold);
      vec2 warped = m + vec2(cos(ang), sin(ang)) * r;

      // clouds
      float t = u_time * 0.04;
      float c1 = fbm(warped*1.3 + vec2(t, 0.0));
      float c2 = fbm(warped*2.6 - vec2(0.0, t*1.3) + c1);
      float cloud = pow(c2, 1.4);

      vec3 base = vec3(0.020, 0.018, 0.030);
      vec3 deep = vec3(0.060, 0.040, 0.110);
      vec3 mid  = vec3(0.180, 0.110, 0.260);
      vec3 hot  = vec3(0.420, 0.300, 0.520);

      vec3 col = base;
      col = mix(col, deep, smoothstep(0.20, 0.55, cloud));
      col = mix(col, mid,  smoothstep(0.55, 0.78, cloud));
      col = mix(col, hot,  smoothstep(0.78, 0.95, cloud));

      // mouse "hot spot" — energy injection
      float halo = exp(-r*r*4.0);
      col += halo * vec3(0.45, 0.55, 0.85) * 0.18;
      col += exp(-r*r*30.0) * vec3(0.7, 0.8, 1.0) * 0.3;

      // stars across multiple layers
      float s = 0.0;
      s += stars(warped*40.0 + vec2(u_time*0.05, 0.0), 0.02) * 0.9;
      s += stars(warped*70.0 - vec2(0.0, u_time*0.03), 0.014) * 0.7;
      s += stars(warped*120.0 + vec2(u_time*0.02, u_time*0.01), 0.010) * 0.5;
      col += s * vec3(0.95, 0.95, 1.0);

      // vignette
      col *= 0.55 + 0.55*smoothstep(1.3, 0.2, length(p));

      // grain
      col += (hash(gl_FragCoord.xy + u_time) - 0.5)*0.022;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compile(type, src){
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(sh), '\n', src);
      gl.deleteShader(sh); return null;
    }
    return sh;
  }
  function program(fragSrc){
    const v = compile(gl.VERTEX_SHADER, VERT);
    const f = compile(gl.FRAGMENT_SHADER, fragSrc);
    if (!v || !f) return null;
    const p = gl.createProgram();
    gl.attachShader(p, v); gl.attachShader(p, f);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(p));
      return null;
    }
    return p;
  }

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

  const programs = {
    plasma:  program(FRAG_PLASMA),
    voronoi: program(FRAG_VORONOI),
    nebula:  program(FRAG_NEBULA),
  };

  let currentName = localStorage.getItem('shader.mode') || 'plasma';
  if (!programs[currentName]) currentName = 'plasma';

  // mouse state — smoothed
  const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, vx: 0, vy: 0, hold: 0, tHold: 0 };
  window.addEventListener('mousemove', e => {
    mouse.tx = e.clientX / window.innerWidth;
    mouse.ty = 1.0 - e.clientY / window.innerHeight;
  }, { passive: true });
  window.addEventListener('mousedown', () => { mouse.tHold = 1; });
  window.addEventListener('mouseup',   () => { mouse.tHold = 0; });
  window.addEventListener('touchmove', e => {
    if (!e.touches[0]) return;
    mouse.tx = e.touches[0].clientX / window.innerWidth;
    mouse.ty = 1.0 - e.touches[0].clientY / window.innerHeight;
  }, { passive: true });
  window.addEventListener('touchstart', e => {
    mouse.tHold = 1;
    if (e.touches[0]){
      mouse.tx = e.touches[0].clientX / window.innerWidth;
      mouse.ty = 1.0 - e.touches[0].clientY / window.innerHeight;
    }
  }, { passive: true });
  window.addEventListener('touchend', () => { mouse.tHold = 0; });

  function resize(){
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width  = Math.floor(window.innerWidth  * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width  = window.innerWidth  + 'px';
    canvas.style.height = window.innerHeight + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);

  const t0 = performance.now();
  function frame(now){
    const t = (now - t0) * 0.001;
    // smooth mouse
    mouse.vx = (mouse.tx - mouse.x) * 0.08;
    mouse.vy = (mouse.ty - mouse.y) * 0.08;
    mouse.x += mouse.vx; mouse.y += mouse.vy;
    mouse.hold += (mouse.tHold - mouse.hold) * 0.08;

    const prog = programs[currentName];
    if (prog){
      gl.useProgram(prog);
      const aPos = gl.getAttribLocation(prog, 'a_pos');
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(gl.getUniformLocation(prog, 'u_res'), canvas.width, canvas.height);
      gl.uniform2f(gl.getUniformLocation(prog, 'u_mouse'), mouse.x, mouse.y);
      gl.uniform2f(gl.getUniformLocation(prog, 'u_mouseV'), mouse.vx*40, mouse.vy*40);
      gl.uniform1f(gl.getUniformLocation(prog, 'u_time'), t);
      gl.uniform1f(gl.getUniformLocation(prog, 'u_hold'), mouse.hold);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // public API for the switcher
  window.__setShader = function(name){
    if (!programs[name]) return;
    currentName = name;
    localStorage.setItem('shader.mode', name);
    document.querySelectorAll('[data-shader]').forEach(el => {
      el.classList.toggle('is-active', el.dataset.shader === name);
    });
  };
  window.__getShader = () => currentName;
  // initialize active state once DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.__setShader(currentName));
  } else {
    window.__setShader(currentName);
  }
})();
