import { createContext, useContext, ReactNode } from "react";

/**
 * SOC Life ships in two flavours that share the same engine, components,
 * audio, and floor plan but differ in:
 *   - i18n root key  ("socLife" vs "otSocLife")
 *   - incident catalogue (IT scenarios vs OT/ICS scenarios)
 *   - reason override map
 *   - localStorage namespace (so highscores don't bleed between variants)
 *
 * Sub-components (DollHouse, RoomActions, IncidentPanel, SocMeters,
 * ConsequenceOverlay, Onboarding) read this context to translate the room /
 * NPC / UI strings against the right i18n root, while the page-level
 * `SocLife` component picks the right INCIDENTS array and reason resolver.
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
