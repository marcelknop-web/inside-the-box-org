import { Helmet } from "react-helmet-async";
import SocLife from "./SocLife";
import { RZF_INCIDENTS, RZF_COMIC_INCIDENT_IDS } from "@/data/rzfSocLifeData";
import { reasonFor } from "@/data/socLifeReasons";

/** RZF SOC Life — SOC Life engine with RZF NRW content. Direct link only (noindex). */
export default function RzfSocLife() {
  return (
    <>
      <Helmet>
        <title>RZF SOC Life — Cyber-Simulation Finanzverwaltung NRW</title>
        <meta name="description" content="SOC-Simulator im Rechenzentrum der Finanzverwaltung NRW." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <SocLife variant="rzf" incidents={RZF_INCIDENTS} comicIds={RZF_COMIC_INCIDENT_IDS} reasonResolver={reasonFor} />
    </>
  );
}
