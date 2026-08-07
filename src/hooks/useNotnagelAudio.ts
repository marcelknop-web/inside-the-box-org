import { useToolAudio } from "@/hooks/useToolAudio";

export type NotnagelSfx = "click" | "step" | "success" | "error" | "complete";

/**
 * Audio für Notnagel: professionelle UI-SFX, dezente Ops-Ambience und
 * sachliche Sprach-Ansagen. Standardmäßig aus, Zustand in localStorage.
 */
export function useNotnagelAudio() {
  return useToolAudio("ops", "notnagel.sound.v1");
}
