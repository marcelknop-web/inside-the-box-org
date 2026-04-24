import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useLanguage } from "@/i18n/LanguageContext";
import SocLife from "./SocLife";
import { INCIDENTS as OT_INCIDENTS, COMIC_INCIDENT_IDS as OT_COMIC_INCIDENT_IDS } from "@/data/otSocLifeData";
import { otReasonFor } from "@/data/otSocLifeReasons";

interface OtSocLifeProps {
  embedded?: boolean;
}

/**
 * OT-SOC Life — IT-SOC engine, OT/ICS content.
 *
 * Re-uses the entire SocLife shell (rooms, audio, meters, scoring, highscore
 * board, onboarding) and only swaps the incident catalogue, the rationale
 * resolver, the i18n root (via the variant provider inside SocLife), and the
 * localStorage namespace.
 *
 * Locked to English on mount per product decision: the OT scenarios are
 * authored as a cross-training tool for SOC analysts, and we ship a single
 * authoritative wording rather than three half-curated translations.
 */
export default function OtSocLife({ embedded = false }: OtSocLifeProps = {}) {
  const { language, setLanguage } = useLanguage();

  useEffect(() => {
    if (language !== "en") setLanguage("en");
    // Only run on mount + when this page is active. We deliberately don't
    // restore the previous language on unmount — the user may want to keep
    // browsing in English afterwards, and the language picker is one click
    // away in the chrome.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {!embedded && (
        <Helmet>
          <title>OT-SOC Life — Industrial Cyber-Sim</title>
          <meta
            name="description"
            content="Cross-training simulator for IT SOC analysts moving into OT / ICS. Modbus anomalies, PLC logic writes, SIS bypass, Purdue-aware decisions under pressure."
          />
        </Helmet>
      )}
      <SocLife
        embedded={embedded}
        variant="ot"
        incidents={OT_INCIDENTS}
        comicIds={OT_COMIC_INCIDENT_IDS}
        reasonResolver={otReasonFor}
      />
    </>
  );
}
