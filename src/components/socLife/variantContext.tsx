import { createContext, useCallback, useContext, ReactNode } from "react";
import { useLanguage } from "@/i18n/LanguageContext";

/**
 * SOC Life ships in two flavours that share the same engine, components,
 * audio, and floor plan but differ in:
 *   - i18n root key  ("socLife" vs "otSocLife")
 *   - incident catalogue (IT scenarios vs OT/ICS scenarios)
 *   - reason override map
 *   - localStorage namespace (so highscores don't bleed between variants)
 *
 * Sub-components (DollHouse, RoomActions, IncidentPanel, SocMeters,
 * ConsequenceOverlay, Onboarding) read this context via `useVariantT()` to
 * translate room / NPC / UI strings against the right i18n root, with an
 * automatic fallback to the IT root for any keys the OT variant inherits
 * unchanged.
 */
export type SocLifeVariant = "it" | "ot";

interface VariantInfo {
  variant: SocLifeVariant;
  /** Root key for i18n lookups: "socLife" or "otSocLife". */
  i18nRoot: string;
  /** Prefix for localStorage keys ("socLife" or "otSocLife"). */
  storageNs: string;
}

const VariantContext = createContext<VariantInfo>({
  variant: "it",
  i18nRoot: "socLife",
  storageNs: "socLife",
});

export function SocLifeVariantProvider({
  variant,
  children,
}: {
  variant: SocLifeVariant;
  children: ReactNode;
}) {
  const i18nRoot = variant === "ot" ? "otSocLife" : "socLife";
  const storageNs = i18nRoot;
  return (
    <VariantContext.Provider value={{ variant, i18nRoot, storageNs }}>
      {children}
    </VariantContext.Provider>
  );
}

export function useSocLifeVariant(): VariantInfo {
  return useContext(VariantContext);
}

/**
 * Variant-aware translation hook.
 *
 * Resolves keys against the active variant's root first ("otSocLife.foo"),
 * and silently falls back to the IT root ("socLife.foo") when the variant
 * does not override that particular key. This means the OT variant only
 * needs to ship overrides for the strings that actually differ from IT —
 * everything else (verdict tiers, onboarding glue text, button labels …)
 * inherits from the canonical SOC Life translations for free.
 *
 * Usage:
 *   const t = useVariantT();
 *   t("title")          // → otSocLife.title (or socLife.title fallback)
 *   t("rooms.siem.name")
 *
 * For top-level keys outside the SOC Life namespace (rare), pass the full
 * key starting with the root and call `useLanguage().t` directly instead.
 */
export function useVariantT(): {
  t: (key: string) => string;
  tArray: (key: string) => string[];
  language: "de" | "en" | "fr";
} {
  const { t: rawT, tArray: rawTArray, language } = useLanguage();
  const { i18nRoot } = useSocLifeVariant();

  const t = useCallback(
    (key: string): string => {
      if (i18nRoot === "socLife") return rawT(`socLife.${key}`);
      const variantKey = `${i18nRoot}.${key}`;
      const v = rawT(variantKey);
      // `t()` returns the lookup key itself when nothing matched — that's
      // our sentinel for "no override defined, fall back to IT root".
      if (v !== variantKey) return v;
      return rawT(`socLife.${key}`);
    },
    [i18nRoot, rawT],
  );

  const tArray = useCallback(
    (key: string): string[] => {
      if (i18nRoot === "socLife") return rawTArray(`socLife.${key}`);
      const arr = rawTArray(`${i18nRoot}.${key}`);
      if (arr.length > 0) return arr;
      return rawTArray(`socLife.${key}`);
    },
    [i18nRoot, rawTArray],
  );

  return { t, tArray, language: language as "de" | "en" | "fr" };
}
