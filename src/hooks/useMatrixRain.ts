import { useEffect, useRef, useCallback } from 'react';

const MATRIX_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFINSIDETHEBOX';
const CHAR_COUNT = MATRIX_CHARS.length;
const FONT_SIZE = 14;
const FADE_STYLE = 'rgba(0, 0, 0, 0.05)';
const FONT = `${FONT_SIZE}px monospace`;
const IS_MOBILE = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const FRAME_SKIP = IS_MOBILE ? 3 : 2;

export function useMatrixRain(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  onColumnReset?: (columnRatio: number) => void
) {
  const columnsRef = useRef<Float32Array | null>(null);
  const swayPhaseRef = useRef<Float32Array | null>(null);
  const swaySpeedRef = useRef<Float32Array | null>(null);
  const swayAmpRef = useRef<Float32Array | null>(null);
  const colCountRef = useRef(0);

  const initColumns = useCallback((count: number, h: number) => {
    colCountRef.current = count;
    columnsRef.current = new Float32Array(count);
    swayPhaseRef.current = new Float32Array(count);
    swaySpeedRef.current = new Float32Array(count);
    swayAmpRef.current = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      columnsRef.current[i] = Math.random() * h / FONT_SIZE;
      swayPhaseRef.current[i] = Math.random() * Math.PI * 2;
      swaySpeedRef.current[i] = 0.02 + Math.random() * 0.04;
      swayAmpRef.current[i] = (1.5 + Math.random() * 2.5) * FONT_SIZE * 0.3;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frameCount = 0;

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      const newCount = Math.floor(w / FONT_SIZE);
      if (colCountRef.current !== newCount) {
        initColumns(newCount, h);
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      frameCount++;
      ctx.fillStyle = FADE_STYLE;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (frameCount % FRAME_SKIP === 0) {
        const cols = columnsRef.current!;
        const phases = swayPhaseRef.current!;
        const speeds = swaySpeedRef.current!;
        const amps = swayAmpRef.current!;
        const count = colCountRef.current;
        const canvasH = canvas.height;

        ctx.font = FONT;

        for (let i = 0; i < count; i++) {
          const char = MATRIX_CHARS[(Math.random() * CHAR_COUNT) | 0];

          phases[i] += speeds[i];
          const x = i * FONT_SIZE + Math.sin(phases[i]) * amps[i];
          const y = cols[i] * FONT_SIZE;

          const brightness = Math.random();
          if (!IS_MOBILE && brightness > 0.95) {
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ff1a1a';
            ctx.shadowBlur = 15;
          } else if (!IS_MOBILE && brightness > 0.7) {
            ctx.fillStyle = '#ff1a1a';
            ctx.shadowColor = '#ff1a1a';
            ctx.shadowBlur = 8;
          } else {
            ctx.fillStyle = `rgba(255,26,26,${(0.3 + brightness * 0.5).toFixed(2)})`;
          }

          ctx.fillText(char, x, y);
          ctx.shadowBlur = 0;

          if (y > canvasH && Math.random() > 0.975) {
            cols[i] = 0;
            onColumnReset?.(i / count);
          }
          cols[i]++;
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [canvasRef, initColumns, onColumnReset]);
}
