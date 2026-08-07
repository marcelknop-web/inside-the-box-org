import { useCallback, useEffect, useRef, useState } from "react";
import clickAsset from "@/assets/notnagel/click.mp3.asset.json";
import stepAsset from "@/assets/notnagel/step.mp3.asset.json";
import successAsset from "@/assets/notnagel/success.mp3.asset.json";
import errorAsset from "@/assets/notnagel/error.mp3.asset.json";
import completeAsset from "@/assets/audio/complete.mp3.asset.json";
import ambOpsAsset from "@/assets/audio/amb_ops.mp3.asset.json";
import ambMaritimeAsset from "@/assets/audio/amb_maritime.mp3.asset.json";
import ambBankAsset from "@/assets/audio/amb_bank.mp3.asset.json";
import vStartAsset from "@/assets/audio/v_start.mp3.asset.json";
import vStepAsset from "@/assets/audio/v_step.mp3.asset.json";
import vBlockerAsset from "@/assets/audio/v_blocker.mp3.asset.json";
import vReadyAsset from "@/assets/audio/v_ready.mp3.asset.json";
import vExerciseAsset from "@/assets/audio/v_exercise.mp3.asset.json";

export type ToolSfx = "click" | "step" | "success" | "error" | "complete";
export type ToolVoice = "start" | "step" | "blocker" | "ready" | "exercise";
export type AmbienceTheme = "ops" | "maritime" | "bank";

const SFX: Record<ToolSfx, string> = {
  click: clickAsset.url,
  step: stepAsset.url,
  success: successAsset.url,
  error: errorAsset.url,
  complete: completeAsset.url,
};

const SFX_GAIN: Record<ToolSfx, number> = {
  click: 0.2,
  step: 0.3,
  success: 0.32,
  error: 0.28,
  complete: 0.34,
};

const VOICE: Record<ToolVoice, string> = {
  start: vStartAsset.url,
  step: vStepAsset.url,
  blocker: vBlockerAsset.url,
  ready: vReadyAsset.url,
  exercise: vExerciseAsset.url,
};

const AMBIENCE: Record<AmbienceTheme, string> = {
  ops: ambOpsAsset.url,
  maritime: ambMaritimeAsset.url,
  bank: ambBankAsset.url,
};

/**
 * Gemeinsame, professionell produzierte Audio-Ebene für die Compliance-Tools.
 * Drei Ebenen: kurze UI-SFX, dezente Ambience-Schleife und sachliche Sprach-Ansagen (DE).
 * Standardmäßig aus (kein Autoplay), Zustand pro Tool in localStorage.
 */
export function useToolAudio(theme: AmbienceTheme, storageKey: string) {
  const [enabled, setEnabled] = useState(false);
  const cache = useRef<Record<string, HTMLAudioElement>>({});
  const ambience = useRef<HTMLAudioElement | null>(null);
  const lastVoice = useRef(0);

  useEffect(() => {
    try {
      setEnabled(localStorage.getItem(storageKey) === "on");
    } catch { /* localStorage nicht verfügbar */ }
  }, [storageKey]);

  const el = useCallback((src: string) => {
    let node = cache.current[src];
    if (!node) {
      node = new Audio(src);
      node.preload = "auto";
      cache.current[src] = node;
    }
    return node;
  }, []);

  const play = useCallback((name: ToolSfx) => {
    if (!enabled) return;
    try {
      const node = el(SFX[name]);
      node.volume = SFX_GAIN[name];
      node.currentTime = 0;
      void node.play().catch(() => { /* Autoplay-Block ignorieren */ });
    } catch { /* ignore */ }
  }, [enabled, el]);

  /** Sprach-Ansage; entkoppelt gegen Mehrfach-Trigger (min. 1,2 s Abstand). */
  const say = useCallback((name: ToolVoice) => {
    if (!enabled) return;
    const now = Date.now();
    if (now - lastVoice.current < 1200) return;
    lastVoice.current = now;
    try {
      const node = el(VOICE[name]);
      node.volume = 0.62;
      node.currentTime = 0;
      void node.play().catch(() => { /* ignore */ });
    } catch { /* ignore */ }
  }, [enabled, el]);

  const stopAmbience = useCallback(() => {
    const node = ambience.current;
    if (!node) return;
    node.pause();
    node.currentTime = 0;
  }, []);

  const startAmbience = useCallback(() => {
    try {
      let node = ambience.current;
      if (!node) {
        node = new Audio(AMBIENCE[theme]);
        node.loop = true;
        node.preload = "auto";
        ambience.current = node;
      }
      node.volume = 0.14;
      void node.play().catch(() => { /* Autoplay-Block ignorieren */ });
    } catch { /* ignore */ }
  }, [theme]);

  useEffect(() => {
    if (enabled) startAmbience();
    else stopAmbience();
  }, [enabled, startAmbience, stopAmbience]);

  useEffect(() => () => {
    ambience.current?.pause();
    ambience.current = null;
  }, []);

  const toggle = useCallback(() => {
    setEnabled((on) => {
      const next = !on;
      try { localStorage.setItem(storageKey, next ? "on" : "off"); } catch { /* ignore */ }
      return next;
    });
  }, [storageKey]);

  return { enabled, toggle, play, say };
}
