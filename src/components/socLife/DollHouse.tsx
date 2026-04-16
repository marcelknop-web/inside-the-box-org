import { useEffect, useMemo, useRef, useState } from "react";
import { ROOMS, RoomId, NPCS } from "@/data/socLifeData";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

interface DollHouseProps {
  current: RoomId;
  highlight: RoomId | null;
  onMove: (room: RoomId) => void;
}

/** SVG viewBox dimensions (logical units) */
const VB_W = 800;
const VB_H = 360;
const ROOM_W = VB_W / 4; // 200
const ROOM_H = VB_H / 2 - 18; // 162  — leave 36 units for the corridor strip
const CORRIDOR_Y = ROOM_H; // y where the inter-floor corridor starts
const FLOOR_GAP = 36; // height of corridor strip

/** Each room's bottom-floor y (where feet stand) */
function roomFloorY(row: 0 | 1) {
  if (row === 0) return ROOM_H - 6; // upper floor feet line
  return CORRIDOR_Y + FLOOR_GAP + ROOM_H - 6;
}
function roomCenterX(col: 0 | 1 | 2 | 3) {
  return col * ROOM_W + ROOM_W / 2;
}
function roomXY(roomId: RoomId, offset = 0): { x: number; y: number } {
  const r = ROOMS.find((x) => x.id === roomId)!;
  return { x: roomCenterX(r.col) + offset, y: roomFloorY(r.row) };
}

/** Build a path the figure walks: through corridor when changing floors */
function buildPath(from: { x: number; y: number; row: 0 | 1 }, to: { x: number; y: number; row: 0 | 1 }) {
  if (from.row === to.row) {
    return [from, { x: to.x, y: from.y }];
  }
  // Use the staircase column closest to source: snap to col 1 or 2 boundary
  const stairX = Math.abs(from.x - ROOM_W * 2) < Math.abs(from.x - ROOM_W) ? ROOM_W * 2 : ROOM_W * 2;
  const corridorY = CORRIDOR_Y + FLOOR_GAP / 2;
  return [
    from,
    { x: stairX, y: from.y },
    { x: stairX, y: corridorY },
    { x: to.x, y: corridorY },
    { x: to.x, y: to.y },
  ];
}

interface FigState {
  x: number;
  y: number;
  facing: 1 | -1;
  walking: boolean;
  frame: number; // 0..3 for animation
}

function useWalkingFigure(target: { x: number; y: number; row: 0 | 1 }, room: RoomId) {
  const [state, setState] = useState<FigState>(() => ({
    x: target.x, y: target.y, facing: 1, walking: false, frame: 0,
  }));
  const queueRef = useRef<{ x: number; y: number }[]>([]);
  const lastRoomRef = useRef<RoomId>(room);

  // Re-plan path when room changes
  useEffect(() => {
    if (room === lastRoomRef.current) return;
    const fromRow = ROOMS.find((r) => r.id === lastRoomRef.current)!.row;
    const path = buildPath(
      { x: state.x, y: state.y, row: fromRow },
      target,
    );
    queueRef.current = path.slice(1); // skip current
    lastRoomRef.current = room;
    setState((s) => ({ ...s, walking: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room]);

  // Movement loop ~30fps
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const speed = 140; // logical units / sec
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setState((s) => {
        const next = { ...s };
        if (queueRef.current.length === 0) {
          if (s.walking) { next.walking = false; next.frame = 0; }
          return next;
        }
        const wp = queueRef.current[0];
        const dx = wp.x - s.x;
        const dy = wp.y - s.y;
        const dist = Math.hypot(dx, dy);
        const step = speed * dt;
        if (dist <= step) {
          next.x = wp.x; next.y = wp.y;
          queueRef.current.shift();
        } else {
          next.x = s.x + (dx / dist) * step;
          next.y = s.y + (dy / dist) * step;
        }
        if (Math.abs(dx) > 0.5) next.facing = dx > 0 ? 1 : -1;
        next.walking = true;
        next.frame = Math.floor(now / 120) % 4;
        return next;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return state;
}

/**
 * Pixel figure: 12x16 logical units, drawn from rectangles for crisp pixel feel.
 * `accent` colors clothes; head/skin stay neutral. Walk frame swings legs.
 */
function PixelFigure({
  x, y, facing, walking, frame, accent, idle,
}: {
  x: number; y: number; facing: 1 | -1; walking: boolean; frame: number;
  accent: string; idle?: boolean;
}) {
  // 1 unit = 1.5 svg unit pixels for slightly bigger appearance
  const u = 1.6;
  const W = 12 * u;
  const H = 18 * u;
  const px = (cx: number, cy: number, w: number, h: number, fill: string) => (
    <rect x={cx * u} y={cy * u} width={w * u} height={h * u} fill={fill} shapeRendering="crispEdges" />
  );
  // Walk swing
  const legLA = walking ? (frame === 0 ? 0 : frame === 1 ? -1 : frame === 2 ? 0 : 1) : 0;
  const legRA = walking ? -legLA : 0;
  const armLA = walking ? -legLA : 0;
  const armRA = walking ? -legRA : 0;
  // Idle "bob"
  const bob = idle && !walking ? Math.sin(performance.now() / 600) * 0.3 : 0;

  const skin = "hsl(35 40% 78%)";
  const hair = "hsl(20 30% 15%)";
  const dark = "hsl(0 0% 8%)";

  return (
    <g
      transform={`translate(${x - W / 2}, ${y - H + bob}) scale(${facing}, 1) translate(${facing === -1 ? -W : 0}, 0)`}
      style={{ pointerEvents: "none" }}
    >
      {/* Shadow */}
      <ellipse cx={W / 2} cy={H + 2} rx={W * 0.45} ry={1.4} fill="hsl(0 0% 0% / 0.45)" />
      {/* Head */}
      {px(4, 0, 4, 4, skin)}
      {px(4, 0, 4, 1, hair)}
      {px(7, 1, 1, 1, dark)} {/* eye */}
      {/* Body */}
      {px(3, 4, 6, 6, accent)}
      {px(3, 9, 6, 1, dark)}
      {/* Arms */}
      {px(2, 5 + armLA, 1, 4, accent)}
      {px(9, 5 + armRA, 1, 4, accent)}
      {/* Legs */}
      {px(4, 10 + legLA, 2, 5, dark)}
      {px(6, 10 + legRA, 2, 5, dark)}
      {/* Feet */}
      {px(4, 15 + legLA, 2, 1, "hsl(0 0% 4%)")}
      {px(6, 15 + legRA, 2, 1, "hsl(0 0% 4%)")}
    </g>
  );
}

/** Furniture per room, drawn inside its rect. All in muted tones. */
function RoomFurniture({ id }: { id: RoomId }) {
  const stroke = "hsl(0 0% 100% / 0.18)";
  const fill = "hsl(0 0% 100% / 0.06)";
  switch (id) {
    case "soc_floor":
      // Two desks with monitors
      return (
        <g>
          <rect x={20} y={ROOM_H - 30} width={50} height={20} fill={fill} stroke={stroke} />
          <rect x={28} y={ROOM_H - 50} width={34} height={20} fill={fill} stroke={stroke} />
          <rect x={32} y={ROOM_H - 47} width={26} height={14} fill="hsl(180 60% 50% / 0.35)" />
          <rect x={100} y={ROOM_H - 30} width={50} height={20} fill={fill} stroke={stroke} />
          <rect x={108} y={ROOM_H - 50} width={34} height={20} fill={fill} stroke={stroke} />
          <rect x={112} y={ROOM_H - 47} width={26} height={14} fill="hsl(180 60% 50% / 0.35)" />
        </g>
      );
    case "siem":
      // Big console wall
      return (
        <g>
          <rect x={15} y={20} width={170} height={70} fill={fill} stroke={stroke} />
          <rect x={20} y={25} width={50} height={28} fill="hsl(45 90% 55% / 0.3)" />
          <rect x={75} y={25} width={50} height={28} fill="hsl(180 60% 50% / 0.3)" />
          <rect x={130} y={25} width={50} height={28} fill="hsl(0 70% 55% / 0.3)" />
          <rect x={20} y={58} width={160} height={28} fill="hsl(140 50% 50% / 0.25)" />
          <rect x={40} y={ROOM_H - 25} width={120} height={15} fill={fill} stroke={stroke} />
        </g>
      );
    case "forensics":
      // Lab bench + microscope-like
      return (
        <g>
          <rect x={20} y={ROOM_H - 35} width={160} height={25} fill={fill} stroke={stroke} />
          <rect x={50} y={ROOM_H - 65} width={20} height={30} fill={fill} stroke={stroke} />
          <circle cx={60} cy={ROOM_H - 70} r={6} fill={fill} stroke={stroke} />
          <rect x={120} y={ROOM_H - 55} width={40} height={20} fill="hsl(180 60% 50% / 0.3)" />
        </g>
      );
    case "noc":
      // Network rack
      return (
        <g>
          <rect x={30} y={20} width={50} height={ROOM_H - 30} fill={fill} stroke={stroke} />
          {Array.from({ length: 8 }).map((_, i) => (
            <rect key={i} x={34} y={26 + i * 14} width={42} height={10} fill="hsl(140 50% 50% / 0.3)" />
          ))}
          <rect x={100} y={ROOM_H - 30} width={80} height={20} fill={fill} stroke={stroke} />
        </g>
      );
    case "server_room":
      // Server racks
      return (
        <g>
          {[20, 70, 120].map((rx) => (
            <g key={rx}>
              <rect x={rx} y={20} width={40} height={ROOM_H - 30} fill={fill} stroke={stroke} />
              {Array.from({ length: 10 }).map((_, i) => (
                <rect key={i} x={rx + 4} y={24 + i * 12} width={32} height={8} fill="hsl(45 90% 55% / 0.25)" />
              ))}
            </g>
          ))}
        </g>
      );
    case "war_room":
      // Big table + chairs
      return (
        <g>
          <rect x={30} y={ROOM_H - 50} width={140} height={20} fill={fill} stroke={stroke} />
          <rect x={50} y={ROOM_H - 30} width={20} height={20} fill={fill} stroke={stroke} />
          <rect x={90} y={ROOM_H - 30} width={20} height={20} fill={fill} stroke={stroke} />
          <rect x={130} y={ROOM_H - 30} width={20} height={20} fill={fill} stroke={stroke} />
          <rect x={20} y={20} width={160} height={40} fill={fill} stroke={stroke} />
          <rect x={28} y={25} width={144} height={30} fill="hsl(180 60% 50% / 0.25)" />
        </g>
      );
    case "ciso_office":
      // Executive desk + plant
      return (
        <g>
          <rect x={30} y={ROOM_H - 45} width={100} height={20} fill={fill} stroke={stroke} />
          <rect x={55} y={ROOM_H - 65} width={30} height={20} fill={fill} stroke={stroke} />
          <rect x={150} y={ROOM_H - 60} width={20} height={50} fill="hsl(120 30% 30% / 0.5)" />
          <circle cx={160} cy={ROOM_H - 65} r={12} fill="hsl(120 40% 40% / 0.6)" />
        </g>
      );
    case "kitchen":
      // Coffee machine + counter
      return (
        <g>
          <rect x={20} y={ROOM_H - 35} width={160} height={25} fill={fill} stroke={stroke} />
          <rect x={40} y={ROOM_H - 70} width={30} height={35} fill={fill} stroke={stroke} />
          <rect x={45} y={ROOM_H - 60} width={20} height={10} fill="hsl(20 60% 35% / 0.6)" />
          <circle cx={120} cy={ROOM_H - 50} r={6} fill="hsl(20 60% 35% / 0.5)" />
          <circle cx={140} cy={ROOM_H - 50} r={6} fill="hsl(20 60% 35% / 0.5)" />
        </g>
      );
  }
}

export function DollHouse({ current, highlight, onMove }: DollHouseProps) {
  const { t } = useLanguage();

  // Spread NPCs slightly inside their home rooms (offset)
  const npcOffsets: Record<string, number> = useMemo(() => ({
    junior: -28, ir_lead: -28, ciso: 28, sysadmin: -38,
  }), []);

  // Player figure (target follows current room with small offset to right)
  const playerRow = ROOMS.find((r) => r.id === current)!.row;
  const playerTarget = roomXY(current, 18);
  const player = useWalkingFigure({ ...playerTarget, row: playerRow }, current);

  return (
    <div className="rounded-lg border border-border/40 bg-background/40 p-3">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="block w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="SOC dollhouse"
      >
        {/* Outer building */}
        <rect x={0} y={0} width={VB_W} height={VB_H} fill="hsl(0 0% 4%)" />
        {/* Subtle grid */}
        <g opacity={0.08}>
          {Array.from({ length: 16 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 50} y1={0} x2={i * 50} y2={VB_H} stroke="hsl(0 0% 100%)" strokeWidth={0.5} />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 50} x2={VB_W} y2={i * 50} stroke="hsl(0 0% 100%)" strokeWidth={0.5} />
          ))}
        </g>

        {/* Corridor strip between floors */}
        <rect x={0} y={CORRIDOR_Y} width={VB_W} height={FLOOR_GAP} fill="hsl(0 0% 7%)" stroke="hsl(0 0% 100% / 0.1)" />
        {/* Staircase suggestion */}
        <g opacity={0.6}>
          {Array.from({ length: 6 }).map((_, i) => (
            <rect
              key={i}
              x={ROOM_W * 2 - 6 + i * 2}
              y={CORRIDOR_Y + FLOOR_GAP - 2 - i * (FLOOR_GAP / 6)}
              width={2}
              height={FLOOR_GAP / 6}
              fill="hsl(45 90% 55% / 0.4)"
            />
          ))}
        </g>

        {/* Rooms */}
        {ROOMS.map((room) => {
          const x = room.col * ROOM_W;
          const y = room.row === 0 ? 0 : CORRIDOR_Y + FLOOR_GAP;
          const isCurrent = current === room.id;
          const isHighlight = highlight === room.id;
          return (
            <g key={room.id}>
              {/* Clickable interactive overlay */}
              <rect
                x={x + 1} y={y + 1} width={ROOM_W - 2} height={ROOM_H - 2}
                fill={isCurrent ? "hsl(45 90% 55% / 0.06)" : "hsl(0 0% 100% / 0.015)"}
                stroke={
                  isCurrent ? "hsl(45 90% 55% / 0.7)"
                  : isHighlight ? "hsl(180 90% 55% / 0.8)"
                  : "hsl(0 0% 100% / 0.18)"
                }
                strokeWidth={isHighlight ? 1.6 : 1}
                style={{ cursor: isCurrent ? "default" : "pointer" }}
                onClick={() => !isCurrent && onMove(room.id)}
              >
                <title>{t(`socLife.rooms.${room.i18n}.name`)}</title>
              </rect>

              {/* Translate furniture/labels into room coords */}
              <g transform={`translate(${x}, ${y})`} style={{ pointerEvents: "none" }}>
                <RoomFurniture id={room.id} />
                {/* Floor line */}
                <line x1={4} y1={ROOM_H - 6} x2={ROOM_W - 4} y2={ROOM_H - 6}
                  stroke="hsl(0 0% 100% / 0.25)" strokeWidth={0.6} />
                {/* Door (visible on side toward stairs) */}
                <rect x={ROOM_W - 18} y={ROOM_H - 28} width={6} height={22}
                  fill="hsl(0 0% 100% / 0.05)" stroke="hsl(0 0% 100% / 0.25)" strokeWidth={0.5} />
                {/* Label */}
                <text x={6} y={12} fontFamily="ui-monospace, monospace" fontSize={8}
                  fill="hsl(0 0% 100% / 0.6)" letterSpacing={1}>
                  {t(`socLife.rooms.${room.i18n}.name`).toUpperCase()}
                </text>
                {isHighlight && (
                  <text x={ROOM_W - 12} y={12} fontFamily="ui-monospace, monospace" fontSize={9}
                    fill="hsl(180 90% 60%)" textAnchor="end">◉</text>
                )}
              </g>
            </g>
          );
        })}

        {/* NPCs (static, idle bob) */}
        {NPCS.map((npc) => {
          const offset = npcOffsets[npc.id] ?? -20;
          const pos = roomXY(npc.homeRoom, offset);
          return (
            <PixelFigure
              key={npc.id}
              x={pos.x} y={pos.y}
              facing={offset > 0 ? -1 : 1}
              walking={false} frame={0}
              accent="hsl(180 70% 45%)"
              idle
            />
          );
        })}

        {/* Player figure */}
        <PixelFigure
          x={player.x} y={player.y}
          facing={player.facing} walking={player.walking} frame={player.frame}
          accent="hsl(45 90% 55%)"
          idle
        />
      </svg>

      <div className="mt-2 flex flex-wrap gap-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        <span><span className="inline-block h-2 w-2 rounded-full mr-1 align-middle" style={{ background: "hsl(45 90% 55%)" }} />{t("socLife.youAreHere")}</span>
        <span><span className="inline-block h-2 w-2 rounded-full mr-1 align-middle" style={{ background: "hsl(180 70% 45%)" }} />NPC</span>
        <span className={cn(highlight ? "text-cyan-300" : "")}>
          <span className="inline-block h-2 w-2 rounded-full mr-1 align-middle" style={{ background: "hsl(180 90% 55%)" }} />
          {t("socLife.incidentRoomHint")}
        </span>
      </div>
    </div>
  );
}
