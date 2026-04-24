import { Helmet } from "react-helmet-async";
import SocLife from "./SocLife";
import { INCIDENTS as OT_INCIDENTS, COMIC_INCIDENT_IDS as OT_COMIC_INCIDENT_IDS } from "@/data/otSocLifeData";
import { otReasonFor } from "@/data/otSocLifeReasons";

interface OtSocLifeProps {
  embedded?: boolean;
}

/**
 * OT-SOC Life — IT-SOC engine, OT/ICS content.
 *
 * Re-uses the entire SocLife shell and only swaps the incident catalogue,
 * the rationale resolver, the i18n root, and the localStorage namespace.
 *
 * Content is **locked to English** at the resolver level (see
 * `useVariantT()` in `variantContext.tsx`) — the global UI language
 * picker is left untouched, but every string rendered inside the OT
 * shell is read from the English dictionary regardless. This avoids the
 * mount-time language-flash and the half-translated fallback chain.
 */
export default function OtSocLife({ embedded = false }: OtSocLifeProps = {}) {

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
