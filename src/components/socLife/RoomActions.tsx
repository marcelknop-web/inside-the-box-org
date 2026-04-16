import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { NPCS, ROOMS, RoomId } from "@/data/socLifeData";

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
    <div className="rounded-lg border border-border/40 bg-background/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {t("socLife.here")}
        </div>
        <div className="font-mono text-sm text-foreground">
          {t(`socLife.rooms.${room.i18n}.name`)}
        </div>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        {t(`socLife.rooms.${room.i18n}.desc`)}
      </p>

      {npcs.length > 0 && (
        <div className="mb-3 space-y-1">
          {npcs.map((npc) => (
            <div key={npc.id} className="rounded-md border border-border/30 bg-background/60 p-2 text-xs">
              <div className="font-mono text-[11px] uppercase tracking-wider text-cyan-300">
                {t(`socLife.npcs.${npc.i18n}.name`)}
              </div>
              <div className="text-muted-foreground italic">
                « {t(`socLife.npcs.${npc.i18n}.greet`)} »
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {t("socLife.actions")}
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <Button
            key={a}
            size="sm"
            variant="outline"
            className="font-sans"
            onClick={() => onIdleAction(a)}
          >
            {t(`socLife.idle.${a}.name`)}
          </Button>
        ))}
      </div>
    </div>
  );
}
