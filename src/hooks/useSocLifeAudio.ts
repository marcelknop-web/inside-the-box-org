import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SfxKey =
  | "incident_klaxon"
  | "success_chime"
  | "fail_buzz"
  | "footstep"
  | "click_ui"
  | "escalation";

export type MusicKey = "ambient_loop" | "alert_loop";

const DB_NAME = "soc-life-audio";
const DB_STORE = "clips";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGet(key: string): Promise<Blob | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve) => {
      const tx = db.transaction(DB_STORE, "readonly");
      const req = tx.objectStore(DB_STORE).get(key);
      req.onsuccess = () => resolve((req.result as Blob) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function dbPut(key: string, blob: Blob): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(DB_STORE, "readwrite");
      tx.objectStore(DB_STORE).put(blob, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    /* noop */
  }
}

async function fetchClip(preset: string): Promise<Blob | null> {
  const cached = await dbGet(preset);
  if (cached) return cached;
  try {
    const { data, error } = await supabase.functions.invoke("soc-life-audio", {
      body: { preset },
    });
    if (error || !data?.audio) return null;
    const bytes = Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: data.mime || "audio/mpeg" });
    await dbPut(preset, blob);
    return blob;
  } catch {
    return null;
  }
}

export function useSocLifeAudio() {
  const musicElRef = useRef<HTMLAudioElement | null>(null);
  const currentMusicRef = useRef<MusicKey | null>(null);
  const sfxCacheRef = useRef<Map<SfxKey, string>>(new Map());
  const enabledRef = useRef(false);
  const [enabled, setEnabledState] = useState(false);
  const [musicReady, setMusicReady] = useState(false);

  useEffect(() => {
    return () => {
      if (musicElRef.current) {
        musicElRef.current.pause();
        musicElRef.current.src = "";
      }
      sfxCacheRef.current.forEach((url) => URL.revokeObjectURL(url));
      sfxCacheRef.current.clear();
    };
  }, []);

  const setEnabled = useCallback((v: boolean) => {
    enabledRef.current = v;
    setEnabledState(v);
    if (!v && musicElRef.current) musicElRef.current.pause();
    else if (v && musicElRef.current && musicElRef.current.src) {
      musicElRef.current.play().catch(() => {});
    }
  }, []);

  const ensureMusic = useCallback(async (key: MusicKey) => {
    if (currentMusicRef.current === key && musicElRef.current?.src) return;
    const blob = await fetchClip(key);
    if (!blob) return;
    if (!musicElRef.current) {
      const el = new Audio();
      el.loop = true;
      el.volume = 0.35;
      musicElRef.current = el;
    }
    const oldSrc = musicElRef.current.src;
    musicElRef.current.src = URL.createObjectURL(blob);
    if (oldSrc) URL.revokeObjectURL(oldSrc);
    currentMusicRef.current = key;
    setMusicReady(true);
    if (enabledRef.current) {
      musicElRef.current.play().catch(() => {});
    }
  }, []);

  const switchMusic = useCallback(async (key: MusicKey) => {
    if (currentMusicRef.current === key) return;
    // Crossfade-ish: lower vol, swap, raise
    const el = musicElRef.current;
    if (el && enabledRef.current) {
      const start = el.volume;
      const steps = 8;
      for (let i = 0; i < steps; i++) {
        el.volume = Math.max(0, start * (1 - i / steps));
        await new Promise((r) => setTimeout(r, 30));
      }
    }
    await ensureMusic(key);
    if (musicElRef.current && enabledRef.current) {
      const el2 = musicElRef.current;
      el2.volume = 0;
      el2.play().catch(() => {});
      const target = 0.35;
      for (let i = 0; i < 12; i++) {
        el2.volume = Math.min(target, (target * (i + 1)) / 12);
        await new Promise((r) => setTimeout(r, 40));
      }
    }
  }, [ensureMusic]);

  const playSfx = useCallback(async (key: SfxKey, volume = 0.5) => {
    if (!enabledRef.current) return;
    let url = sfxCacheRef.current.get(key);
    if (!url) {
      const blob = await fetchClip(key);
      if (!blob) return;
      url = URL.createObjectURL(blob);
      sfxCacheRef.current.set(key, url);
    }
    const a = new Audio(url);
    a.volume = volume;
    a.play().catch(() => {});
  }, []);

  // Preload commonly used sfx in background once enabled
  const prewarm = useCallback(async () => {
    const keys: SfxKey[] = ["click_ui", "incident_klaxon", "success_chime", "fail_buzz"];
    for (const k of keys) {
      if (sfxCacheRef.current.has(k)) continue;
      const blob = await fetchClip(k);
      if (blob) sfxCacheRef.current.set(k, URL.createObjectURL(blob));
    }
  }, []);

  return { enabled, setEnabled, musicReady, ensureMusic, switchMusic, playSfx, prewarm };
}
