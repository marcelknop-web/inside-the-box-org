import { useEffect, useMemo, useRef, useState } from "react";
import { ROOMS, RoomId, NPCS, NpcId } from "@/data/socLifeData";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

interface DollHouseProps {
  current: RoomId;
  highlight: RoomId | null;
  onMove: (room: RoomId) => void;
  /** Max display height in CSS pixels. Used to compute integer pixel scale. */
  maxHeight?: number;
  /** When true, the house gets a cool-blue night tint overlay. */
  isNight?: boolean;
}

/**
 * 80s pixel-art SOC dollhouse. Everything is rendered into a single canvas
 * with crisp integer scaling. Berlin warehouse vibe: night palette, magenta
 * neon highlights, cyan and gold accents, scanline overlay via CSS.
 *
 * Logical resolution: 256 x 144 (true 80s low-res), upscaled by integer factor.
 * Floor plan: 4 rooms wide × 2 floors tall, with central staircase.
 */

// --- Logical pixel grid ---
const LOGICAL_W = 256;
const LOGICAL_H = 144;
const ROOM_W = 64;          // 4 rooms × 64 = 256
const ROOM_H = 60;          // upper room incl. floor
const CORRIDOR_H = 24;      // middle corridor with stairs
// Floor 0 = upper, Floor 1 = lower
function roomTopY(row: 0 | 1) {
  return row === 0 ? 0 : ROOM_H + CORRIDOR_H;
}
function roomFloorLineY(row: 0 | 1) {
  return roomTopY(row) + ROOM_H - 4; // y where feet stand
}
function roomCenterX(col: 0 | 1 | 2 | 3) {
  return col * ROOM_W + ROOM_W / 2;
}
const CORRIDOR_Y = ROOM_H;
const STAIR_X = ROOM_W * 2; // staircase between col 1 and col 2

// --- Palette (PICO-8 inspired but tuned to brand: gold/cyan/magenta) ---
const C = {
  bg: "#0a0a12",
  buildingDark: "#141422",
  buildingMid: "#1d1d33",
  wall1: "#22223a",
  wall2: "#2a2a45",
  trim: "#3a3a5e",
  floorDark: "#241a14",
  floorMid: "#3a2a1e",
  floorLight: "#4a3826",
  doorFrame: "#5a3820",
  door: "#241410",
  corridor: "#0e0e18",
  corridorLine: "#3a2a4a",
  scanline: "rgba(0,0,0,0.18)",
  // accents
  gold: "#f5b800",
  goldDim: "#7a5c00",
  cyan: "#00bcd4",
  cyanDim: "#005a66",
  magenta: "#ff3aa0",
  magentaDim: "#7a1a4d",
  green: "#7af542",
  greenDim: "#2a6a18",
  red: "#ff4a4a",
  redDim: "#7a1a1a",
  amber: "#ffae3a",
  white: "#e8e8f0",
  shadow: "rgba(0,0,0,0.55)",
  // skin / hair palette per NPC
  skinA: "#e8b88a", hairA: "#3a1a14",  // junior (Lina) reddish
  skinB: "#c89060", hairB: "#1a1a1a",  // ir_lead (Tobi) dark
  skinC: "#e8c0a0", hairC: "#7a5a30",  // ciso (Albrecht) light brown
  skinD: "#a06840", hairD: "#0a0a0a",  // sysadmin (Murat) very dark
};

interface FigState {
  x: number; y: number;
  facing: 1 | -1;
  walking: boolean;
  frame: number;
}

function buildPath(
  from: { x: number; y: number; row: 0 | 1 },
  to: { x: number; y: number; row: 0 | 1 },
) {
  // Same floor: walk horizontally on that floor's level only.
  if (from.row === to.row) {
    return [{ x: to.x, y: from.y }];
  }
  // Different floor: only the staircase changes elevation.
  // 1) walk to stair column on current floor, 2) climb/descend, 3) walk to target room.
  const fromFloorY = roomFloorLineY(from.row);
  const toFloorY = roomFloorLineY(to.row);
  return [
    { x: STAIR_X, y: fromFloorY },
    { x: STAIR_X, y: toFloorY },
    { x: to.x,    y: toFloorY },
  ];
}

function useWalker(targetRoom: RoomId, initial: { x: number; y: number }) {
  const [state, setState] = useState<FigState>({
    x: initial.x, y: initial.y, facing: 1, walking: false, frame: 0,
  });
  const queueRef = useRef<{ x: number; y: number }[]>([]);
  const lastRoomRef = useRef<RoomId>(targetRoom);

  useEffect(() => {
    if (targetRoom === lastRoomRef.current) return;
    const fromRow = ROOMS.find((r) => r.id === lastRoomRef.current)!.row;
    const toRoom = ROOMS.find((r) => r.id === targetRoom)!;
    const toX = roomCenterX(toRoom.col) + 8;
    const toY = roomFloorLineY(toRoom.row);
    queueRef.current = buildPath(
      { x: state.x, y: state.y, row: fromRow },
      { x: toX, y: toY, row: toRoom.row },
    );
    lastRoomRef.current = targetRoom;
    setState((s) => ({ ...s, walking: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetRoom]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const speed = 38; // logical px / sec
    const loop = (now: number) => {
      const dt = (now - last) / 1000; last = now;
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
        if (Math.abs(dx) > 0.2) next.facing = dx > 0 ? 1 : -1;
        next.walking = true;
        next.frame = Math.floor(now / 140) % 4;
        return next;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return state;
}

// ----------- Drawing helpers (canvas, integer pixels) -----------
function drawRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
function drawPx(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
}

function drawWallpaper(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  drawRect(ctx, x, y, w, h, C.wall1);
  // vertical pinstripe pattern every 4px
  for (let i = x + 2; i < x + w; i += 4) {
    drawRect(ctx, i, y + 2, 1, h - 4, C.wall2);
  }
  // top trim
  drawRect(ctx, x, y, w, 2, C.trim);
}

function drawFloor(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  drawRect(ctx, x, y, w, h, C.floorMid);
  // plank lines every 8px
  for (let i = x; i < x + w; i += 8) drawRect(ctx, i, y, 1, h, C.floorDark);
  // floor top highlight
  drawRect(ctx, x, y, w, 1, C.floorLight);
}

function drawDoor(ctx: CanvasRenderingContext2D, x: number, y: number) {
  drawRect(ctx, x, y, 8, 14, C.doorFrame);
  drawRect(ctx, x + 1, y + 1, 6, 12, C.door);
  drawPx(ctx, x + 5, y + 7, C.gold);
}

// CRT monitor 12x9 at (x,y), with screen color
function drawCrt(ctx: CanvasRenderingContext2D, x: number, y: number, screenColor: string, frame: number) {
  drawRect(ctx, x, y, 12, 9, "#1a1a1a");        // bezel
  drawRect(ctx, x + 1, y + 1, 10, 6, screenColor);
  // scanline blink
  drawRect(ctx, x + 1, y + 2 + (frame % 3), 10, 1, "rgba(0,0,0,0.3)");
  drawRect(ctx, x + 4, y + 9, 4, 1, "#0a0a0a");
  drawRect(ctx, x + 3, y + 9, 6, 1, "#2a2a2a");
}

// Server rack 14x40 — blinking LEDs
function drawRack(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  drawRect(ctx, x, y, 14, 40, "#1a1a26");
  drawRect(ctx, x + 1, y + 1, 12, 38, "#0e0e18");
  for (let i = 0; i < 9; i++) {
    const ry = y + 3 + i * 4;
    drawRect(ctx, x + 2, ry, 10, 3, "#2a2a3a");
    // blinking LED — use t (animation tick) to flicker
    const on = ((Math.floor(t / 200) + i) % 3) !== 0;
    drawPx(ctx, x + 3, ry + 1, on ? C.green : C.greenDim);
    drawPx(ctx, x + 11, ry + 1, ((i + Math.floor(t / 350)) % 2) === 0 ? C.amber : "#3a2a10");
  }
}

// Coffee machine 10x14 + steaming cup
function drawCoffee(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  drawRect(ctx, x, y, 10, 14, "#2a2a2a");
  drawRect(ctx, x + 1, y + 1, 8, 4, "#1a1a1a");
  drawRect(ctx, x + 2, y + 6, 6, 4, C.amber);
  drawPx(ctx, x + 4, y + 8, C.gold);
  drawRect(ctx, x + 3, y + 11, 4, 2, "#3a2a10");
  // steam
  const s = Math.sin(t / 200) * 1;
  drawPx(ctx, x + 4 + Math.round(s), y - 1, C.white);
  drawPx(ctx, x + 5, y - 3, C.white);
}

// Desk + monitor + chair
function drawDesk(ctx: CanvasRenderingContext2D, x: number, y: number, screen: string, t: number) {
  // chair
  drawRect(ctx, x + 16, y + 14, 6, 6, "#1a1a26");
  drawRect(ctx, x + 16, y + 14, 6, 1, "#3a3a4a");
  // desk top
  drawRect(ctx, x, y + 12, 22, 3, "#3a2a1a");
  drawRect(ctx, x, y + 15, 2, 8, "#2a1a14");
  drawRect(ctx, x + 20, y + 15, 2, 8, "#2a1a14");
  // monitor on desk
  drawCrt(ctx, x + 4, y + 3, screen, t);
}

// Network rack (NOC)
function drawNocRack(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  drawRect(ctx, x, y, 18, 30, "#1a1a26");
  for (let i = 0; i < 5; i++) {
    const ry = y + 3 + i * 5;
    drawRect(ctx, x + 2, ry, 14, 3, "#0a0a14");
    for (let j = 0; j < 6; j++) {
      const on = ((Math.floor(t / 180) + i * 3 + j) % 4) !== 0;
      drawPx(ctx, x + 3 + j * 2, ry + 1, on ? C.cyan : C.cyanDim);
    }
  }
}

// Plant
function drawPlant(ctx: CanvasRenderingContext2D, x: number, y: number) {
  drawRect(ctx, x + 1, y + 8, 6, 6, "#3a2a14");
  drawRect(ctx, x + 2, y + 8, 4, 1, "#5a3820");
  // leaves
  drawRect(ctx, x, y, 8, 8, C.greenDim);
  drawPx(ctx, x + 3, y - 1, C.green);
  drawPx(ctx, x + 1, y + 1, C.green);
  drawPx(ctx, x + 6, y + 2, C.green);
  drawPx(ctx, x + 4, y + 5, C.green);
}

// Big SIEM video wall: 3 large screens in a row
function drawSiemWall(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  // back wall plate
  drawRect(ctx, x, y, 60, 24, "#0a0a14");
  drawRect(ctx, x, y + 24, 60, 1, "#1a1a26");
  // 3 screens
  const screens = [C.amber, C.cyan, C.red];
  for (let i = 0; i < 3; i++) {
    const sx = x + 2 + i * 20;
    drawRect(ctx, sx, y + 2, 18, 16, "#0e0e18");
    drawRect(ctx, sx + 1, y + 3, 16, 14, screens[i] + "");
    // pseudo data lines
    for (let r = 0; r < 6; r++) {
      const w = ((i * 3 + r + Math.floor(t / 250)) % 12) + 2;
      drawRect(ctx, sx + 1, y + 3 + r * 2, w, 1, "rgba(0,0,0,0.45)");
    }
  }
}

// Forensic lab: bench with microscope + drives
function drawForensics(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  drawRect(ctx, x, y + 12, 50, 4, "#3a2a1a");
  drawRect(ctx, x + 4, y + 16, 2, 8, "#2a1a14");
  drawRect(ctx, x + 44, y + 16, 2, 8, "#2a1a14");
  // microscope
  drawRect(ctx, x + 8, y + 4, 4, 8, "#2a2a3a");
  drawRect(ctx, x + 6, y + 12, 8, 1, "#3a3a4a");
  drawPx(ctx, x + 10, y + 2, C.cyan);
  // drive
  drawRect(ctx, x + 28, y + 6, 14, 6, "#1a1a26");
  drawPx(ctx, x + 30, y + 8, ((Math.floor(t / 220) % 2) === 0) ? C.green : C.greenDim);
  drawRect(ctx, x + 32, y + 8, 8, 2, "#0a0a14");
}

// Conference table + chairs (war room)
function drawWarRoom(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  drawRect(ctx, x, y + 14, 56, 6, "#3a2a1a");
  drawRect(ctx, x + 6, y + 20, 4, 4, "#1a1a26");
  drawRect(ctx, x + 26, y + 20, 4, 4, "#1a1a26");
  drawRect(ctx, x + 46, y + 20, 4, 4, "#1a1a26");
  // wall screen
  drawRect(ctx, x + 8, y, 40, 12, "#0a0a14");
  drawRect(ctx, x + 9, y + 1, 38, 10, C.cyanDim);
  for (let r = 0; r < 4; r++) {
    const w = ((r * 5 + Math.floor(t / 300)) % 30) + 4;
    drawRect(ctx, x + 9, y + 1 + r * 2, w, 1, C.cyan);
  }
}

// Executive office: desk + lamp + plant
function drawCisoOffice(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  drawRect(ctx, x, y + 14, 36, 6, "#5a3820");
  drawRect(ctx, x + 4, y + 20, 4, 4, "#3a2a14");
  drawRect(ctx, x + 28, y + 20, 4, 4, "#3a2a14");
  // monitor
  drawCrt(ctx, x + 8, y + 4, C.gold, Math.floor(t / 200));
  // lamp
  drawRect(ctx, x + 26, y + 6, 1, 8, "#3a3a4a");
  drawRect(ctx, x + 24, y + 4, 5, 3, C.gold);
  drawPlant(ctx, x + 42, y + 8);
}

// ----------- Pixel figure (12x18, walk anim) -----------
function drawFigure(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  facing: 1 | -1, walking: boolean, frame: number,
  shirt: string, pants: string,
  skin: string, hair: string,
  highlight = false,
) {
  // y is feet baseline; figure draws upward
  const fx = Math.round(x - 3);  // figure 6px wide footprint
  const fy = Math.round(y - 16);

  // Save / flip
  ctx.save();
  if (facing === -1) {
    ctx.translate(fx + 3, 0);
    ctx.scale(-1, 1);
    ctx.translate(-(fx + 3), 0);
  }

  // shadow
  drawRect(ctx, fx - 2, y, 10, 1, C.shadow);

  // Walk swing
  const lOff = walking ? (frame === 1 ? -1 : frame === 3 ? 1 : 0) : 0;
  const rOff = -lOff;
  const armOff = walking ? (frame === 1 ? 1 : frame === 3 ? -1 : 0) : 0;

  // Head
  drawRect(ctx, fx + 1, fy, 4, 4, skin);
  drawRect(ctx, fx + 1, fy, 4, 1, hair);
  drawPx(ctx, fx + 4, fy + 1, hair);
  drawPx(ctx, fx + 3, fy + 2, "#0a0a0a"); // eye
  // Body
  drawRect(ctx, fx, fy + 4, 6, 6, shirt);
  drawRect(ctx, fx, fy + 9, 6, 1, "#0a0a0a");
  // Arms
  drawRect(ctx, fx - 1, fy + 5 + armOff, 1, 4, shirt);
  drawRect(ctx, fx + 6, fy + 5 - armOff, 1, 4, shirt);
  // Legs
  drawRect(ctx, fx + 1, fy + 10 + lOff, 2, 5, pants);
  drawRect(ctx, fx + 3, fy + 10 + rOff, 2, 5, pants);
  // Feet
  drawRect(ctx, fx + 1, fy + 15 + lOff, 2, 1, "#0a0a0a");
  drawRect(ctx, fx + 3, fy + 15 + rOff, 2, 1, "#0a0a0a");

  ctx.restore();

  // Highlight halo for the player
  if (highlight) {
    ctx.fillStyle = "rgba(245,184,0,0.18)";
    ctx.beginPath();
    ctx.arc(x + 0.5, y - 2, 8, 0, Math.PI * 2);
    ctx.fill();
  }
}

const NPC_LOOK: Record<NpcId, { shirt: string; pants: string; skin: string; hair: string }> = {
  junior:   { shirt: C.magenta, pants: "#1a1a26", skin: C.skinA, hair: C.hairA },
  ir_lead:  { shirt: C.cyan,    pants: "#0a0a14", skin: C.skinB, hair: C.hairB },
  ciso:     { shirt: "#5a1a4a", pants: "#1a1a1a", skin: C.skinC, hair: C.hairC },
  sysadmin: { shirt: C.green,   pants: "#1a1a26", skin: C.skinD, hair: C.hairD },
};

// Per-room furniture renderer
function renderRoom(ctx: CanvasRenderingContext2D, room: RoomId, x: number, y: number, t: number) {
  drawWallpaper(ctx, x, y, ROOM_W, ROOM_H - 4);
  drawFloor(ctx, x, y + ROOM_H - 4, ROOM_W, 4);
  // Door on right side leading to corridor
  drawDoor(ctx, x + ROOM_W - 10, y + ROOM_H - 18);

  switch (room) {
    case "soc_floor": {
      drawDesk(ctx, x + 4, y + 24, C.cyan, t);
      drawDesk(ctx, x + 34, y + 24, C.amber, t + 50);
      break;
    }
    case "siem": {
      drawSiemWall(ctx, x + 2, y + 6, t);
      break;
    }
    case "forensics": {
      drawForensics(ctx, x + 6, y + 18, t);
      break;
    }
    case "noc": {
      drawNocRack(ctx, x + 4, y + 10, t);
      drawNocRack(ctx, x + 26, y + 10, t + 100);
      drawDesk(ctx, x + 44, y + 24, C.green, t + 200);
      break;
    }
    case "server_room": {
      drawRack(ctx, x + 4, y + 6, t);
      drawRack(ctx, x + 22, y + 6, t + 80);
      drawRack(ctx, x + 40, y + 6, t + 160);
      break;
    }
    case "war_room": {
      drawWarRoom(ctx, x + 4, y + 14, t);
      break;
    }
    case "ciso_office": {
      drawCisoOffice(ctx, x + 6, y + 16, t);
      break;
    }
    case "kitchen": {
      drawCoffee(ctx, x + 8, y + 30, t);
      drawCoffee(ctx, x + 22, y + 30, t + 200);
      drawRect(ctx, x + 36, y + 38, 12, 4, "#3a2a1a"); // counter
      drawPx(ctx, x + 38, y + 36, C.amber); // cup
      drawPx(ctx, x + 44, y + 36, C.amber);
      break;
    }
  }
}

export function DollHouse({ current, highlight, onMove, maxHeight, isNight = false }: DollHouseProps) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(3);

  // Compute integer scale for crisp pixels based on container width AND height
  useEffect(() => {
    const update = () => {
      const w = wrapRef.current?.clientWidth ?? 800;
      const h = maxHeight ?? Number.POSITIVE_INFINITY;
      const sByW = Math.floor(w / LOGICAL_W);
      const sByH = Math.floor(h / LOGICAL_H);
      const s = Math.max(2, Math.min(6, Math.min(sByW, sByH)));
      setScale(s);
    };
    update();
    const ro = new ResizeObserver(update);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [maxHeight]);

  const playerInitial = useMemo(() => {
    const r = ROOMS.find((x) => x.id === current)!;
    return { x: roomCenterX(r.col) + 8, y: roomFloorLineY(r.row) };
  }, []); // initial only

  const player = useWalker(current, playerInitial);

  // Track isNight in a ref so the rAF loop sees latest value without
  // re-binding (and we can smoothly interpolate the tint strength).
  const isNightRef = useRef(isNight);
  isNightRef.current = isNight;
  const tintRef = useRef(isNight ? 1 : 0); // 0 = day, 1 = night

  // Animation loop
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let raf = 0;
    let start = performance.now();
    const draw = (now: number) => {
      const t = now - start;

      // Clear
      drawRect(ctx, 0, 0, LOGICAL_W, LOGICAL_H, C.bg);

      // Building outline
      drawRect(ctx, 0, 0, LOGICAL_W, LOGICAL_H, C.buildingDark);
      drawRect(ctx, 1, 1, LOGICAL_W - 2, LOGICAL_H - 2, C.buildingMid);

      // Render rooms
      ROOMS.forEach((room) => {
        const x = room.col * ROOM_W;
        const y = roomTopY(room.row);
        renderRoom(ctx, room.id, x, y, t);
      });

      // Corridor strip
      drawRect(ctx, 0, CORRIDOR_Y, LOGICAL_W, CORRIDOR_H, C.corridor);
      // floor of corridor
      drawRect(ctx, 0, CORRIDOR_Y + CORRIDOR_H - 2, LOGICAL_W, 2, "#1a0e22");
      // dotted ceiling line
      for (let i = 0; i < LOGICAL_W; i += 4) drawPx(ctx, i, CORRIDOR_Y + 1, C.corridorLine);
      // staircase: diagonal pixel steps
      for (let i = 0; i < 12; i++) {
        const sx = STAIR_X - 6 + i;
        const sy = CORRIDOR_Y + CORRIDOR_H - 2 - i * (CORRIDOR_H / 12);
        drawRect(ctx, sx, sy, 2, 2, C.gold);
        drawPx(ctx, sx, sy + 2, C.goldDim);
      }
      // stair rail neon — flicker between magenta tones
      const railFlicker = (Math.floor(t / 80) % 17) === 0;
      const railCol = railFlicker ? C.magenta : C.magentaDim;
      drawRect(ctx, STAIR_X - 8, CORRIDOR_Y + 4, 1, CORRIDOR_H - 8, railCol);
      drawRect(ctx, STAIR_X + 6, CORRIDOR_Y + 4, 1, CORRIDOR_H - 8, railCol);

      // Ambient corridor "data motes" — small pixels drifting horizontally
      for (let m = 0; m < 6; m++) {
        const phase = (t / 40 + m * 43) % (LOGICAL_W + 16);
        const mx = phase - 8;
        const my = CORRIDOR_Y + 4 + ((m * 5) % (CORRIDOR_H - 8));
        const col = m % 2 === 0 ? C.cyan : C.magenta;
        drawPx(ctx, mx, my, col);
      }

      // Highlight ring around required incident room
      if (highlight) {
        const r = ROOMS.find((x) => x.id === highlight)!;
        const x = r.col * ROOM_W;
        const y = roomTopY(r.row);
        const blink = (Math.floor(t / 200) % 2) === 0;
        ctx.strokeStyle = blink ? C.cyan : C.cyanDim;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, ROOM_W - 1, ROOM_H - 1);
        // pulsing inner glow band
        const a = 0.08 + 0.07 * (1 + Math.sin(t / 220));
        ctx.fillStyle = `rgba(0,188,212,${a.toFixed(3)})`;
        ctx.fillRect(x + 1, y + 1, ROOM_W - 2, 2);
        ctx.fillRect(x + 1, y + ROOM_H - 5, ROOM_W - 2, 2);
      }

      // Current room marker (subtle gold inset)
      const cur = ROOMS.find((x) => x.id === current)!;
      const cx = cur.col * ROOM_W;
      const cy = roomTopY(cur.row);
      ctx.strokeStyle = "rgba(245,184,0,0.45)";
      ctx.lineWidth = 1;
      ctx.strokeRect(cx + 0.5, cy + 0.5, ROOM_W - 1, ROOM_H - 1);

      // Occasional spark in server / NOC rooms (visual life)
      const sparkRoom = ((Math.floor(t / 1700)) % 2 === 0) ? "server_room" : "noc";
      if ((Math.floor(t / 60) % 28) === 0) {
        const r = ROOMS.find((x) => x.id === sparkRoom)!;
        const sx = r.col * ROOM_W + 8 + ((Math.floor(t / 60)) % 40);
        const sy = roomTopY(r.row) + 12 + ((Math.floor(t / 60)) % 16);
        drawPx(ctx, sx, sy, C.amber);
        drawPx(ctx, sx + 1, sy, C.gold);
        drawPx(ctx, sx, sy + 1, C.gold);
      }

      // NPCs — wander left/right within their room at floor level.
      // Each NPC has its own phase + speed so motion feels organic but bounded.
      NPCS.forEach((npc, idx) => {
        const r = ROOMS.find((x) => x.id === npc.homeRoom)!;
        const baseX = r.col * ROOM_W;
        const minX = baseX + 8;
        const maxX = baseX + ROOM_W - 12;
        const span = maxX - minX;
        // slow oscillation, offset per NPC
        const speed = 0.00035 + idx * 0.00007; // very gentle
        const phase = idx * 1.7;
        const tri = Math.abs(((t * speed + phase) % 2) - 1); // 0..1 triangle wave
        const x = Math.round(minX + tri * span);
        const facing: 1 | -1 = ((t * speed + phase) % 2) < 1 ? 1 : -1;
        const y = roomFloorLineY(r.row);
        const look = NPC_LOOK[npc.id];
        // walking only when actually moving (avoid pose-spam during pause moments)
        const movingFrame = Math.floor(t / 160) % 4;
        // small idle pause every ~5s
        const idle = (Math.floor((t + idx * 1300) / 5000) % 4) === 0;
        const bob = idle ? Math.round(Math.sin(t / 500 + idx) * 0.5) : 0;
        drawFigure(
          ctx, x, y + bob,
          facing, !idle, movingFrame,
          look.shirt, look.pants, look.skin, look.hair,
        );
      });

      // Player figure (gold)
      drawFigure(ctx, player.x, player.y,
        player.facing, player.walking, player.frame,
        C.gold, "#0a0a14", "#e8c0a0", "#3a2014",
        true,
      );

      // Subtle "neon" sweep on the building outline (very faint, slow)
      const sweepX = (t / 18) % (LOGICAL_W + 40) - 20;
      ctx.fillStyle = "rgba(255,58,160,0.05)";
      ctx.fillRect(sweepX, 0, 12, LOGICAL_H);

      // ---- Day/night tint overlay (smooth ease toward target) ----
      const target = isNightRef.current ? 1 : 0;
      // ~1s fade at 60fps: step ~0.016 per frame
      tintRef.current += (target - tintRef.current) * 0.04;
      const tint = tintRef.current;
      if (tint > 0.01) {
        // cool moonlight blue, multiply-style on dark scene via additive overlay
        ctx.fillStyle = `rgba(40,90,180,${(0.22 * tint).toFixed(3)})`;
        ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
        // subtle vignette darkening at edges
        ctx.fillStyle = `rgba(6,10,28,${(0.18 * tint).toFixed(3)})`;
        ctx.fillRect(0, 0, LOGICAL_W, 6);
        ctx.fillRect(0, LOGICAL_H - 6, LOGICAL_W, 6);
        ctx.fillRect(0, 0, 4, LOGICAL_H);
        ctx.fillRect(LOGICAL_W - 4, 0, 4, LOGICAL_H);
        // a few "stars" in the building's dark trim (top strip)
        for (let s = 0; s < 5; s++) {
          const sx = ((s * 53 + Math.floor(t / 2000) * 17) % (LOGICAL_W - 4)) + 2;
          const twinkle = (Math.floor(t / 280 + s) % 5) === 0 ? C.white : "rgba(232,232,240,0.5)";
          drawPx(ctx, sx, 2 + (s % 2), twinkle);
        }
      }

      // (Room labels rendered as HTML overlay below for crisp readability)

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
    // re-bind when current/highlight/player/scale change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, current, highlight]);

  // Click handler: map screen coords -> logical room
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const rect = cv.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * LOGICAL_W;
    const cy = ((e.clientY - rect.top) / rect.height) * LOGICAL_H;
    const col = Math.floor(cx / ROOM_W) as 0 | 1 | 2 | 3;
    let row: 0 | 1 | null = null;
    if (cy < ROOM_H) row = 0;
    else if (cy > CORRIDOR_Y + CORRIDOR_H) row = 1;
    if (col < 0 || col > 3 || row == null) return;
    const room = ROOMS.find((r) => r.col === col && r.row === row);
    if (room && room.id !== current) onMove(room.id);
  };

  return (
    <div ref={wrapRef} className="rounded-lg border border-border/40 bg-background/40 p-3">
      <div
        className="relative mx-auto"
        style={{
          width: LOGICAL_W * scale,
          maxWidth: "100%",
          aspectRatio: `${LOGICAL_W} / ${LOGICAL_H}`,
        }}
      >
        <canvas
          ref={canvasRef}
          width={LOGICAL_W}
          height={LOGICAL_H}
          onClick={handleClick}
          className="block w-full h-full cursor-pointer"
          style={{ imageRendering: "pixelated", boxShadow: "0 0 0 2px #000, 0 0 24px hsl(var(--primary)/0.18) inset" }}
        />
        {/* CRT scanline overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0 1px, transparent 1px 3px)",
            mixBlendMode: "multiply",
          }}
        />
        {/* CRT vignette */}
        <div
          className="pointer-events-none absolute inset-0 rounded-md"
          style={{ boxShadow: "inset 0 0 60px rgba(0,0,0,0.6)" }}
        />

        {/* Crisp HTML room labels — readable, professional, no pixel-noise */}
        {ROOMS.map((room) => {
          const isCurrent = room.id === current;
          const isHighlight = room.id === highlight;
          const leftPct = (room.col * ROOM_W + 2) / LOGICAL_W * 100;
          const topPct = (roomTopY(room.row) + 2) / LOGICAL_H * 100;
          const widthPct = (ROOM_W - 4) / LOGICAL_W * 100;
          return (
            <button
              key={room.id}
              type="button"
              onClick={() => room.id !== current && onMove(room.id)}
              className="absolute pointer-events-auto text-left"
              style={{ left: `${leftPct}%`, top: `${topPct}%`, width: `${widthPct}%` }}
              title={t(`socLife.rooms.${room.i18n}.name`)}
            >
              <span
                className={cn(
                  "inline-block px-1.5 py-0.5 font-mono uppercase tracking-wider rounded-sm transition-colors",
                  "text-[10px] sm:text-[11px] leading-tight",
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : isHighlight
                    ? "bg-cyan-400/90 text-background animate-pulse"
                    : "bg-background/80 text-foreground/80 hover:bg-background hover:text-foreground"
                )}
              >
                {t(`socLife.rooms.${room.i18n}.name`)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
