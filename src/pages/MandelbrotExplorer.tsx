import { useRef, useEffect, useCallback } from 'react';

interface Props {
  embedded?: boolean;
}

const VERTEX = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const FRAGMENT = `
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uCenter;
uniform float uZoom;

// Professional palette: navy base, gold accents, cyan highlights
vec3 palette(float t) {
  vec3 gold    = vec3(0.961, 0.722, 0.0);
  vec3 cyan    = vec3(0.0, 0.737, 0.831);
  vec3 navy    = vec3(0.035, 0.055, 0.15);
  vec3 deepNav = vec3(0.01, 0.02, 0.06);
  vec3 warmGld = vec3(0.85, 0.6, 0.05);

  t = fract(t);
  if (t < 0.2)  return mix(deepNav, navy, t / 0.2);
  if (t < 0.35) return mix(navy, cyan * 0.7, (t - 0.2) / 0.15);
  if (t < 0.5)  return mix(cyan * 0.7, cyan, (t - 0.35) / 0.15);
  if (t < 0.65) return mix(cyan, warmGld, (t - 0.5) / 0.15);
  if (t < 0.8)  return mix(warmGld, gold, (t - 0.65) / 0.15);
  if (t < 0.9)  return mix(gold, navy, (t - 0.8) / 0.1);
  return mix(navy, deepNav, (t - 0.9) / 0.1);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - uResolution * 0.5) / min(uResolution.x, uResolution.y);
  vec2 c = uCenter + uv / uZoom;

  vec2 z = vec2(0.0);
  float iter = 0.0;
  const float MAX_ITER = 512.0;

  for (float i = 0.0; i < MAX_ITER; i++) {
    float x2 = z.x * z.x;
    float y2 = z.y * z.y;
    if (x2 + y2 > 256.0) break;
    z = vec2(x2 - y2 + c.x, 2.0 * z.x * z.y + c.y);
    iter = i;
  }

  if (z.x * z.x + z.y * z.y <= 256.0) {
    gl_FragColor = vec4(0.01, 0.02, 0.06, 1.0);
    return;
  }

  // Smooth iteration count
  float sl = iter - log2(log2(dot(z, z))) + 4.0;
  float t = sl / 80.0 + uTime * 0.015;
  vec3 col = palette(t);

  // Subtle glow near boundary
  float edge = exp(-sl * 0.02);
  col += vec3(0.961, 0.722, 0.0) * edge * 0.3;

  gl_FragColor = vec4(col, 1.0);
}
`;

// Interesting zoom targets in the Mandelbrot set
const ZOOM_TARGETS = [
  { x: -0.7435669, y: 0.1314023, label: 'Seahorse Valley' },
  { x: -0.16,      y: 1.0405,    label: 'Antenna Spiral' },
  { x: -1.25066,   y: 0.02012,   label: 'Mini Mandelbrot' },
  { x: -0.10109636384562,  y: 0.95628651080914, label: 'Deep Spiral' },
  { x: 0.360240443437614,  y: -0.641313061064803, label: 'Double Hook' },
];

export default function MandelbrotExplorer({ embedded }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const uniformsRef = useRef<Record<string, WebGLUniformLocation | null>>({});
  const stateRef = useRef({
    zoom: 0.8,
    centerX: -0.5,
    centerY: 0.0,
    targetIdx: 0,
    phase: 0 as 0 | 1 | 2, // 0=zoom-in, 1=hold, 2=zoom-out-transition
    phaseTime: 0,
    time: 0,
  });
  const rafRef = useRef(0);

  const initGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { antialias: false, preserveDrawingBuffer: false });
    if (!gl) return;
    glRef.current = gl;

    // Compile shaders
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, VERTEX);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, FRAGMENT);
    gl.compileShader(fs);

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);
    programRef.current = prog;

    // Full-screen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    uniformsRef.current = {
      uResolution: gl.getUniformLocation(prog, 'uResolution'),
      uTime: gl.getUniformLocation(prog, 'uTime'),
      uCenter: gl.getUniformLocation(prog, 'uCenter'),
      uZoom: gl.getUniformLocation(prog, 'uZoom'),
    };
  }, []);

  useEffect(() => {
    initGL();

    const canvas = canvasRef.current!;
    const s = stateRef.current;
    let lastT = performance.now();

    // Pick first target
    s.targetIdx = Math.floor(Math.random() * ZOOM_TARGETS.length);
    const firstTarget = ZOOM_TARGETS[s.targetIdx];
    s.centerX = firstTarget.x;
    s.centerY = firstTarget.y;
    s.zoom = 0.8;
    s.phase = 0;
    s.phaseTime = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 1.5); // cap for perf
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      glRef.current?.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const gl = glRef.current;
      const u = uniformsRef.current;
      if (!gl || !u.uResolution) { rafRef.current = requestAnimationFrame(render); return; }

      const now = performance.now();
      const dt = Math.min((now - lastT) / 1000, 0.05);
      lastT = now;
      s.time += dt;
      s.phaseTime += dt;

      const target = ZOOM_TARGETS[s.targetIdx];

      if (s.phase === 0) {
        // Zoom in exponentially
        s.zoom *= 1 + dt * 0.35;
        // Slowly drift center toward target
        s.centerX += (target.x - s.centerX) * dt * 0.5;
        s.centerY += (target.y - s.centerY) * dt * 0.5;

        if (s.zoom > 50000) {
          s.phase = 1;
          s.phaseTime = 0;
        }
      } else if (s.phase === 1) {
        // Hold at deep zoom for a moment
        s.zoom *= 1 + dt * 0.1; // very slow continued zoom
        if (s.phaseTime > 2.0) {
          s.phase = 2;
          s.phaseTime = 0;
          // Pick next target
          let next = s.targetIdx;
          while (next === s.targetIdx) next = Math.floor(Math.random() * ZOOM_TARGETS.length);
          s.targetIdx = next;
        }
      } else {
        // Zoom out and transition
        s.zoom *= 1 - dt * 1.2;
        const nextTarget = ZOOM_TARGETS[s.targetIdx];
        s.centerX += (nextTarget.x - s.centerX) * dt * 2.0;
        s.centerY += (nextTarget.y - s.centerY) * dt * 2.0;

        if (s.zoom < 0.8) {
          s.zoom = 0.8;
          s.phase = 0;
          s.phaseTime = 0;
        }
      }

      gl.uniform2f(u.uResolution!, canvas.width, canvas.height);
      gl.uniform1f(u.uTime!, s.time);
      gl.uniform2f(u.uCenter!, s.centerX, s.centerY);
      gl.uniform1f(u.uZoom!, s.zoom);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [initGL]);

  return (
    <div className={`relative ${embedded ? 'fixed inset-0 z-40' : 'w-screen h-screen'} bg-[#010208] overflow-hidden`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ imageRendering: 'auto' }}
      />
      {/* Subtle vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 60%, rgba(1,2,8,0.6) 100%)',
        }}
      />
    </div>
  );
}
