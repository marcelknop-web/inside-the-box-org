import { useEffect, useRef } from 'react';

export interface FlightInput {
  throttle: number;   // 0..1
  pitch: number;      // -1..1 (up/down)
  roll: number;       // -1..1 (left/right)
  yaw: number;        // -1..1 (Q/E)
}

/**
 * Keyboard + touch flight input.
 * Keyboard: W/S pitch, A/D roll, Q/E yaw, Shift/Space throttle
 * Touch: left half = pitch/roll joystick, right half = throttle (vertical drag)
 */
export function useFlightInput(): React.MutableRefObject<FlightInput> {
  const input = useRef<FlightInput>({ throttle: 0.5, pitch: 0, roll: 0, yaw: 0 });
  const keys = useRef<Set<string>>(new Set());
  const touchState = useRef({
    leftId: -1, leftStartX: 0, leftStartY: 0, leftDx: 0, leftDy: 0,
    rightId: -1, rightStartY: 0, rightDy: 0,
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
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

  // Touch handlers
  useEffect(() => {
    const ts = touchState.current;
    const DEADZONE = 12;
    const MAX_RADIUS = 60;

    const onTouchStart = (e: TouchEvent) => {
      const w = window.innerWidth;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.clientX < w * 0.5) {
          // Left half: pitch/roll joystick
          if (ts.leftId < 0) {
            ts.leftId = t.identifier;
            ts.leftStartX = t.clientX;
            ts.leftStartY = t.clientY;
            ts.leftDx = 0;
            ts.leftDy = 0;
          }
        } else {
          // Right half: throttle
          if (ts.rightId < 0) {
            ts.rightId = t.identifier;
            ts.rightStartY = t.clientY;
            ts.rightDy = 0;
          }
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === ts.leftId) {
          ts.leftDx = t.clientX - ts.leftStartX;
          ts.leftDy = t.clientY - ts.leftStartY;
        } else if (t.identifier === ts.rightId) {
          ts.rightDy = t.clientY - ts.rightStartY;
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === ts.leftId) {
          ts.leftId = -1;
          ts.leftDx = 0;
          ts.leftDy = 0;
        } else if (t.identifier === ts.rightId) {
          ts.rightId = -1;
          ts.rightDy = 0;
        }
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  // Update input ref every animation frame
  useEffect(() => {
    let raf: number;
    const THROTTLE_SPEED = 0.8;
    const DEADZONE = 12;
    const MAX_RADIUS = 60;
    let lastTime = performance.now();

    const tick = () => {
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      const k = keys.current;
      const ts = touchState.current;

      // --- Keyboard ---
      let pitchTarget = 0;
      if (k.has('w') || k.has('arrowup')) pitchTarget -= 1;
      if (k.has('s') || k.has('arrowdown')) pitchTarget += 1;

      let rollTarget = 0;
      if (k.has('a') || k.has('arrowleft')) rollTarget -= 1;
      if (k.has('d') || k.has('arrowright')) rollTarget += 1;

      let yawTarget = 0;
      if (k.has('q')) yawTarget -= 1;
      if (k.has('e')) yawTarget += 1;

      let throttleDelta = 0;
      if (k.has('shift')) throttleDelta = THROTTLE_SPEED * dt;
      if (k.has('control') || k.has(' ')) throttleDelta = -THROTTLE_SPEED * dt;

      // --- Touch: left joystick → pitch/roll ---
      if (ts.leftId >= 0) {
        const dx = Math.abs(ts.leftDx) > DEADZONE ? ts.leftDx : 0;
        const dy = Math.abs(ts.leftDy) > DEADZONE ? ts.leftDy : 0;
        rollTarget = Math.max(-1, Math.min(1, dx / MAX_RADIUS));
        pitchTarget = Math.max(-1, Math.min(1, dy / MAX_RADIUS));
      }

      // --- Touch: right drag → throttle ---
      if (ts.rightId >= 0) {
        // Drag up = throttle up (negative dy)
        throttleDelta = -ts.rightDy * 0.003;
        ts.rightDy *= 0.95; // dampen
      }

      // Apply smoothing
      const smooth = Math.min(dt * 6, 1);
      input.current.pitch += (pitchTarget - input.current.pitch) * smooth;
      input.current.roll += (rollTarget - input.current.roll) * smooth;
      input.current.yaw += (yawTarget - input.current.yaw) * smooth;
      input.current.throttle = Math.max(0, Math.min(1, input.current.throttle + throttleDelta));

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return input;
}
