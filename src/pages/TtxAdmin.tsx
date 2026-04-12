import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const DATE_LABELS: Record<string, string> = {
  "2026-05-07": "7. Mai 2026 – Online",
  "2026-09-17": "17. Sept. 2026 – Online",
  "2026-12-03": "3. Dez. 2026 – Berlin",
};

interface Registration {
  id: string;
  event_date: string;
  first_name: string;
  last_name: string;
  email: string;
  company: string | null;
  phone: string | null;
  notes: string | null;
  price_cents: number;
  created_at: string;
}

const TtxAdmin = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Kein Zugangstoken angegeben.");
      setLoading(false);
      return;
    }

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    fetch(
      `https://${projectId}.supabase.co/functions/v1/ttx-admin?token=${encodeURIComponent(token)}`
    )
      .then((res) => {
        if (!res.ok) throw new Error("Zugriff verweigert");
        return res.json();
      })
      .then((data) => {
        setRegistrations(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Lade Anmeldungen…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <h1 className="text-2xl font-bold text-foreground mb-2">
        TTX Anmeldungen
      </h1>
      <p className="text-muted-foreground mb-6">
        {registrations.length} Anmeldung{registrations.length !== 1 ? "en" : ""}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-border rounded-lg">
          <thead>
            <tr className="bg-muted text-muted-foreground">
              <th className="p-3 text-left">Datum</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">E-Mail</th>
              <th className="p-3 text-left">Firma</th>
              <th className="p-3 text-left">Telefon</th>
              <th className="p-3 text-left">Anmerkungen</th>
              <th className="p-3 text-left">Registriert am</th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((r) => (
              <tr key={r.id} className="border-t border-border hover:bg-muted/50">
                <td className="p-3 whitespace-nowrap">{DATE_LABELS[r.event_date] || r.event_date}</td>
                <td className="p-3 font-medium">
                  {r.first_name} {r.last_name}
                </td>
                <td className="p-3">{r.email}</td>
                <td className="p-3">{r.company || "–"}</td>
                <td className="p-3">{r.phone || "–"}</td>
                <td className="p-3 max-w-[200px] truncate">{r.notes || "–"}</td>
                <td className="p-3 text-muted-foreground">
                  {new Date(r.created_at).toLocaleString("de-DE")}
                </td>
              </tr>
            ))}
            {registrations.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted-foreground">
                  Noch keine Anmeldungen vorhanden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TtxAdmin;
