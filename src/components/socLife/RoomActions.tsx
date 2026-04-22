import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { NPCS, ROOMS, RoomId } from "@/data/socLifeData";
import { resolveIdleLabel } from "./idleI18n";

export type IdleAction = "coffee" | "threat_intel" | "playbook" | "smalltalk" | "stretch";

interface RoomActionsProps {
  currentRoom: RoomId;
  onIdleAction: (action: IdleAction) => void;
}

/** Room-specific idle actions (no incident) */
const ACTIONS_BY_ROOM: Record<RoomId, IdleAction[]> = {
  soc_floor:   ["threat_intel", "smalltalk"],
  siem:        ["threat_intel", "playbook"],
  forensics:   ["playbook"],
  noc:         ["threat_intel"],
  server_room: ["stretch"],
  war_room:    ["playbook", "smalltalk"],
  ciso_office: ["playbook"],
  kitchen:     ["coffee", "smalltalk", "stretch"],
};

export function RoomActions({ currentRoom, onIdleAction }: RoomActionsProps) {
  const { t } = useLanguage();
  const room = ROOMS.find((r) => r.id === currentRoom)!;
  const actions = ACTIONS_BY_ROOM[currentRoom];
  const npcs = NPCS.filter((n) => n.homeRoom === currentRoom);

  return (
    <div className="rounded-lg border border-border/40 bg-background/40 p-3 sm:p-4 sm:h-full flex flex-col gap-3">
      {/* Room header */}
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {t("socLife.here")}
        </div>
        <div className="font-mono text-base text-primary mt-0.5">
          {t(`socLife.rooms.${room.i18n}.name`)}
        </div>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          {t(`socLife.rooms.${room.i18n}.desc`)}
        </p>
      </div>

      {/* NPCs */}
      {npcs.length > 0 && (
        <div className="space-y-1.5">
          {npcs.map((npc) => (
            <div key={npc.id} className="text-xs">
              <span className="font-mono text-cyan-300">
                {t(`socLife.npcs.${npc.i18n}.name`)}:
              </span>{" "}
              <span className="text-muted-foreground italic">
                « {t(`socLife.npcs.${npc.i18n}.greet`)} »
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-auto pt-3 border-t border-border/30">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
          {t("socLife.actions")}
        </div>
        <div className="flex flex-col gap-1.5">
          {actions.map((a) => (
            <Button
              key={a}
              size="sm"
              variant="outline"
              className="justify-start whitespace-normal text-left h-auto min-h-8 py-1.5 font-sans"
              onClick={() => onIdleAction(a)}
            >
              {resolveIdleLabel(t, a, currentRoom, "name")}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
