import { ROOMS, RoomId, NPCS } from "@/data/socLifeData";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

interface FloorPlanProps {
  current: RoomId;
  highlight: RoomId | null;
  onMove: (room: RoomId) => void;
}

/**
 * Tech-Atelier 2D floor plan: 4 columns x 2 rows of rooms.
 * Avatar = filled gold dot in current room. Highlight = required room (cyan ring).
 */
export function SocFloorPlan({ current, highlight, onMove }: FloorPlanProps) {
  const { t } = useLanguage();

  return (
    <div className="rounded-lg border border-border/40 bg-background/40 p-3">
      <div className="grid grid-cols-4 gap-2">
        {ROOMS.slice().sort((a, b) => a.row - b.row || a.col - b.col).map((room) => {
          const isCurrent = current === room.id;
          const isHighlight = highlight === room.id;
          const npcsHere = NPCS.filter((n) => n.homeRoom === room.id);
          return (
            <button
              key={room.id}
              type="button"
              onClick={() => !isCurrent && onMove(room.id)}
              className={cn(
                "group relative flex h-28 flex-col items-start justify-between rounded-md border p-2 text-left transition-all",
                "border-border/40 bg-background/60 hover:bg-background/80",
                isCurrent && "border-primary/70 bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.4)]",
                isHighlight && !isCurrent && "border-cyan-400/70 ring-2 ring-cyan-400/40 animate-pulse",
              )}
              aria-label={t(`socLife.rooms.${room.i18n}.name`)}
            >
              <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {t(`socLife.rooms.${room.i18n}.name`)}
              </div>

              <div className="flex w-full items-end justify-between">
                <div className="flex gap-1">
                  {npcsHere.map((npc) => (
                    <span
                      key={npc.id}
                      className="h-2 w-2 rounded-full bg-muted-foreground/60"
                      title={t(`socLife.npcs.${npc.i18n}.name`)}
                    />
                  ))}
                </div>
                {isCurrent && (
                  <div className="relative">
                    <div className="absolute inset-0 -m-1 animate-ping rounded-full bg-primary/40" />
                    <div className="relative h-3 w-3 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.8)]" />
                  </div>
                )}
              </div>

              {isHighlight && (
                <div className="absolute right-1 top-1 font-mono text-[9px] uppercase text-cyan-300">
                  ◉
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground sm:grid-cols-4">
        <span><span className="inline-block h-2 w-2 rounded-full bg-primary mr-1 align-middle" />{t("socLife.youAreHere")}</span>
        <span><span className="inline-block h-2 w-2 rounded-full bg-cyan-400 mr-1 align-middle" />{t("socLife.incidentRoomHint")}</span>
        <span><span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/60 mr-1 align-middle" />NPC</span>
      </div>
    </div>
  );
}
