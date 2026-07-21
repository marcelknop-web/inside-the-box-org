import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * 90s-style hit counter. Increments once per browser session, then displays the
 * global site visit count from the backend as glowing LCD digits.
 */
export function VisitCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const already = sessionStorage.getItem("visit_counted_v1");
        if (!already) {
          const { data, error } = await supabase.rpc("increment_page_visit", { p_page: "site" });
          if (!error && typeof data === "number") {
            sessionStorage.setItem("visit_counted_v1", "1");
            if (!cancelled) setCount(data);
            return;
          }
        }
        const { data } = await supabase
          .from("page_visits")
          .select("count")
          .eq("page", "site")
          .maybeSingle();
        if (!cancelled && data) setCount(Number(data.count));
      } catch {
        /* silent */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const digits = (count ?? 0).toString().padStart(8, "0").split("");

  return (
    <div className="mt-8 flex flex-col items-center gap-2 select-none">
      <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-foreground/50">
        ★ You are visitor № ★
      </div>
      <div
        className="flex gap-1 rounded-sm border border-highlight/30 bg-black px-2 py-1.5 shadow-[inset_0_0_12px_rgba(0,188,212,0.25)]"
        aria-label={`Visitor count: ${count ?? "loading"}`}
      >
        {digits.map((d, i) => (
          <span
            key={i}
            className="inline-block min-w-[1ch] font-mono text-lg font-bold leading-none text-highlight"
            style={{
              textShadow:
                "0 0 4px hsl(var(--highlight) / 0.9), 0 0 10px hsl(var(--highlight) / 0.6)",
              fontFamily: '"IBM Plex Mono","Courier New",monospace',
            }}
          >
            {count === null ? "0" : d}
          </span>
        ))}
      </div>
      <div className="text-[9px] font-mono uppercase tracking-widest text-foreground/40">
        since 1999 · best viewed in Netscape Navigator
      </div>
    </div>
  );
}

export default VisitCounter;
