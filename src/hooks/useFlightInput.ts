import { useEffect, useRef } from 'react';

export interface FlightInput {
  throttle: number;   // 0..1
  pitch: number;      // -1..1 (up/down)
  roll: number;       // -1..1 (left/right)
  yaw: number;        // -1..1 (Q/E)
}

/**
 * Keyboard-driven flight input:
 *  W / ArrowUp    = pitch down (nose down)
 *  S / ArrowDown  = pitch up (nose up)
 *  A / ArrowLeft  = roll left
 *  D / ArrowRight = roll right
 *  Q              = yaw left
 *  E              = yaw right
 *  Shift          = throttle up
 *  Ctrl / Space   = throttle down
 */
export function useFlightInput(): React.MutableRefObject<FlightInput> {
  const input = useRef<FlightInput>({ throttle: 0.5, pitch: 0, roll: 0, yaw: 0 });
  const keys = useRef<Set<string>>(new Set());

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Don't capture if user is typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
      keys.current.add(e.key.toLowerCase());
    };
    const up = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase());
    };
    const blur = () => keys.current.clear();

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);

  // Update input ref every animation frame via a polling approach
  useEffect(() => {
    let raf: number;
    const THROTTLE_SPEED = 0.8; // per second
    let lastTime = performance.now();

    const tick = () => {
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      const k = keys.current;

      // Pitch
      let pitchTarget = 0;
      if (k.has('w') || k.has('arrowup')) pitchTarget -= 1;
      if (k.has('s') || k.has('arrowdown')) pitchTarget += 1;
      input.current.pitch += (pitchTarget - input.current.pitch) * Math.min(dt * 6, 1);

      // Roll
      let rollTarget = 0;
      if (k.has('a') || k.has('arrowleft')) rollTarget -= 1;
      if (k.has('d') || k.has('arrowright')) rollTarget += 1;
      input.current.roll += (rollTarget - input.current.roll) * Math.min(dt * 6, 1);

      // Yaw
      let yawTarget = 0;
      if (k.has('q')) yawTarget -= 1;
      if (k.has('e')) yawTarget += 1;
      input.current.yaw += (yawTarget - input.current.yaw) * Math.min(dt * 6, 1);

      // Throttle
      if (k.has('shift')) input.current.throttle = Math.min(1, input.current.throttle + THROTTLE_SPEED * dt);
      if (k.has('control') || k.has(' ')) input.current.throttle = Math.max(0, input.current.throttle - THROTTLE_SPEED * dt);

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return input;
}
