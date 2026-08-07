import { useCallback, useEffect, useRef, useState } from "react";
import clickAsset from "@/assets/notnagel/click.mp3.asset.json";
import stepAsset from "@/assets/notnagel/step.mp3.asset.json";
import successAsset from "@/assets/notnagel/success.mp3.asset.json";
import errorAsset from "@/assets/notnagel/error.mp3.asset.json";

export type NotnagelSfx = "click" | "step" | "success" | "error";

const SRC: Record<NotnagelSfx, string> = {
  click: clickAsset.url,
  step: stepAsset.url,
  success: successAsset.url,
  error: errorAsset.url,
};

const GAIN: Record<NotnagelSfx, number> = {
  click: 0.22,
  step: 0.32,
  success: 0.34,
  error: 0.3,
};

const KEY = "notnagel.sound.v1";

/**
 * Dezente Game-Sounds für Notnagel. Standardmäßig aus, Zustand in localStorage.
 * Kein Autoplay: Audio wird erst nach dem ersten Einschalten geladen.
 */
export function useNotnagelAudio() {
  const [enabled, setEnabled] = useState(false);
  const cache = useRef<Partial<Record<NotnagelSfx, HTMLAudioElement>>>({});

  useEffect(() => {
    try {
      setEnabled(localStorage.getItem(KEY) === "on");
    } catch { /* localStorage nicht verfügbar */ }
  }, []);

  const toggle = useCallback(() => {
    setEnabled((on) => {
      const next = !on;
      try { localStorage.setItem(KEY, next ? "on" : "off"); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const play = useCallback((name: NotnagelSfx) => {
    if (!enabled) return;
    try {
      let el = cache.current[name];
      if (!el) {
        el = new Audio(SRC[name]);
        el.preload = "auto";
        cache.current[name] = el;
      }
      el.volume = GAIN[name];
      el.currentTime = 0;
      void el.play().catch(() => { /* Autoplay-Block ignorieren */ });
    } catch { /* ignore */ }
  }, [enabled]);

  return { enabled, toggle, play };
}
