import { createContext, useCallback, useContext, ReactNode } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { en } from "@/i18n/en";
import { de } from "@/i18n/de";
import { RZF_I18N } from "@/data/rzfSocLifeI18n";

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
 *
 * IMPORTANT: the OT variant is locked to English content regardless of the
 * UI language picker. The OT scenarios are authored as a single
 * authoritative English wording — we deliberately bypass the active
 * language and resolve directly against the EN dictionary.
 */
export type SocLifeVariant = "it" | "ot" | "rzf";

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
  const i18nRoot = variant === "ot" ? "otSocLife" : variant === "rzf" ? "rzfSocLife" : "socLife";
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

/* ------------------------------------------------------------------ */
/* English-locked resolver for the OT variant                          */
/* ------------------------------------------------------------------ */

function getNestedRaw(obj: any, path: string): any {
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
}

function resolveEnString(key: string): string {
  const v = getNestedRaw(en, key);
  return typeof v === "string" ? v : key;
}

/** RZF variant: German-locked; overrides from RZF_I18N, fallback to DE socLife. */
function resolveRzfString(key: string): string {
  const o = getNestedRaw(RZF_I18N, key);
  if (typeof o === "string") return o;
  const v = getNestedRaw(de, `socLife.${key}`);
  return typeof v === "string" ? v : key;
}
function resolveRzfArray(key: string): string[] {
  const o = getNestedRaw(RZF_I18N, key);
  if (Array.isArray(o)) return o;
  const v = getNestedRaw(de, `socLife.${key}`);
  return Array.isArray(v) ? v : [];
}

function resolveEnArray(key: string): string[] {
  const v = getNestedRaw(en, key);
  return Array.isArray(v) ? v : [];
}

/**
 * Variant-aware translation hook.
 *
 * IT variant: resolves against the active UI language (DE/EN/FR) under
 * the `socLife.*` root.
 *
 * OT variant: resolves against EN only — first under `otSocLife.*`, then
 * falls back to `socLife.*` for any key the OT variant inherits
 * unchanged. The active UI language is ignored on purpose.
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
      if (i18nRoot === "rzfSocLife") return resolveRzfString(key);
      // OT variant — English only.
      const variantKey = `otSocLife.${key}`;
      const v = resolveEnString(variantKey);
      if (v !== variantKey) return v;
      return resolveEnString(`socLife.${key}`);
    },
    [i18nRoot, rawT],
  );

  const tArray = useCallback(
    (key: string): string[] => {
      if (i18nRoot === "socLife") return rawTArray(`socLife.${key}`);
      if (i18nRoot === "rzfSocLife") return resolveRzfArray(key);
      // OT variant — English only.
      const arr = resolveEnArray(`otSocLife.${key}`);
      if (arr.length > 0) return arr;
      return resolveEnArray(`socLife.${key}`);
    },
    [i18nRoot, rawTArray],
  );

  // Report EN to consumers so any locale-dependent rendering inside the
  // OT shell (e.g. reason resolver) also stays English.
  const reportedLanguage =
    i18nRoot === "otSocLife" ? "en" : i18nRoot === "rzfSocLife" ? "de" : (language as "de" | "en" | "fr");

  return { t, tArray, language: reportedLanguage };
}
