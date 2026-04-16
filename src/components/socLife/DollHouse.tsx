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
  /**
   * When set, every NPC whose home room matches this value rushes to their
   * workstation and types frantically until the room clears. Used to make the
   * SOC visibly *react* to a live incident.
   */
  alertRoom?: RoomId | null;
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

// Shared elevator state — both the walker and the renderer mutate / read it.
// The cabin is the single source of truth for vertical movement. Nobody
// "teleports" through the floor: you must call the lift, wait for the doors
// to FULLY open, step in, wait for them to CLOSE, ride (with realistic mass
// and acceleration), wait for them to open again, then step out.
//
// Physics: the cabin has actual velocity. It accelerates, cruises, then
// decelerates with a clean ease-out. This makes a heavy cabin *feel* heavy:
// you see it overcome inertia, gather speed, then slow down on approach.
type ElevatorPhase =
  | "idle"           // parked, doors open, no passenger, no call
  | "doors_opening"  // just arrived, doors sliding open
  | "doors_open"    // doors fully open, dwelling for boarding/exit
  | "doors_closing" // received call to leave or got passenger, doors sliding shut
  | "moving";        // cabin in transit between floors

interface ElevatorState {
  /** Pixel Y of the cabin floor (where feet stand inside the cabin). */
  cabinY: number;
  /** Pixel Y velocity of the cabin (px/ms). Positive = downward. */
  cabinVy: number;
  /** Floor the cabin is currently parked at (only updated when at-floor). */
  currentFloor: 0 | 1;
  /** Floor the cabin should head to next (set by walker). */
  targetFloor: 0 | 1;
  /** 0..1 — how open the doors are (0 = closed, 1 = fully open). */
  doorOpen: number;
  phase: ElevatorPhase;
  /** ms timestamp when current phase ends (used for dwell). */
  phaseUntil: number;
  /** True while a passenger is inside the cabin and committed to the ride. */
  occupied: boolean;
  /** True while a passenger is currently boarding/exiting (hold doors open). */
  boardingHold: boolean;
}

function makeElevatorRef(initialFloor: 0 | 1): ElevatorState {
  return {
    cabinY: roomFloorLineY(initialFloor),
    cabinVy: 0,
    currentFloor: initialFloor,
    targetFloor: initialFloor,
    doorOpen: 1,
    phase: "doors_open",
    phaseUntil: 0,
    occupied: false,
    boardingHold: false,
  };
}

function useWalker(
  targetRoom: RoomId,
  initial: { x: number; y: number },
  elevatorRef: React.MutableRefObject<ElevatorState>,
) {
  const [state, setState] = useState<FigState>({
    x: initial.x, y: initial.y, facing: 1, walking: false, frame: 0,
  });
  // Walker phases:
  //   walk_to_target : walking horizontally on current floor toward final room
  //   walk_to_lift   : same floor needs lift (different row from target)
  //   wait_for_lift  : standing at the call button until cabin arrives + opens
  //   board          : stepping into the cabin
  //   ride           : riding the cabin to target floor (y follows cabinY)
  //   exit           : stepping out of the cabin onto the destination floor
  //   walk_final     : last horizontal walk to the room center
  type Phase =
    | "idle" | "walk_to_target" | "walk_to_lift" | "wait_for_lift"
    | "board" | "ride" | "exit" | "walk_final";
  const phaseRef = useRef<Phase>("idle");
  const finalTargetRef = useRef<{ x: number; y: number; row: 0 | 1 } | null>(null);
  const lastRoomRef = useRef<RoomId>(targetRoom);

  // Door positions for boarding / exiting (centered on shaft).
  const BOARD_X = STAIR_X;       // standing right in front of doors
  const INSIDE_X = STAIR_X;      // inside the cabin, same column

  useEffect(() => {
    if (targetRoom === lastRoomRef.current) return;
    const fromRow = ROOMS.find((r) => r.id === lastRoomRef.current)!.row;
    const toRoom = ROOMS.find((r) => r.id === targetRoom)!;
    const toX = roomCenterX(toRoom.col) + 8;
    const toY = roomFloorLineY(toRoom.row);
    finalTargetRef.current = { x: toX, y: toY, row: toRoom.row };
    lastRoomRef.current = targetRoom;
    // Choose initial phase: same floor → walk straight there.
    // Different floor → head for the lift first.
    if (fromRow === toRoom.row) {
      phaseRef.current = "walk_to_target";
    } else {
      phaseRef.current = "walk_to_lift";
    }
    setState((s) => ({ ...s, walking: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetRoom]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const speed = 38; // logical px / sec
    const loop = (now: number) => {
      const dt = (now - last) / 1000; last = now;
      const lift = elevatorRef.current;
      const target = finalTargetRef.current;

      setState((s) => {
        const next = { ...s };
        const moveTowards = (tx: number, ty: number) => {
          const dx = tx - s.x, dy = ty - s.y;
          const dist = Math.hypot(dx, dy);
          const step = speed * dt;
          if (dist <= step) {
            next.x = tx; next.y = ty;
            return true; // arrived
          }
          next.x = s.x + (dx / dist) * step;
          next.y = s.y + (dy / dist) * step;
          if (Math.abs(dx) > 0.2) next.facing = dx > 0 ? 1 : -1;
          return false;
        };

        switch (phaseRef.current) {
          case "idle": {
            next.walking = false;
            break;
          }
          case "walk_to_target": {
            if (!target) { phaseRef.current = "idle"; break; }
            // pure horizontal on current floor
            if (moveTowards(target.x, s.y)) {
              phaseRef.current = "idle";
              next.walking = false;
            } else next.walking = true;
            break;
          }
          case "walk_to_lift": {
            if (!target) { phaseRef.current = "idle"; break; }
            // walk horizontally on current floor to the door column
            if (moveTowards(BOARD_X, s.y)) {
              // Arrived at door — call the lift to this floor.
              const myFloor: 0 | 1 = s.y < CORRIDOR_Y + CORRIDOR_H / 2 ? 0 : 1;
              if (lift.targetFloor !== myFloor) lift.targetFloor = myFloor;
              lift.occupied = false; // we're outside, doors may open
              phaseRef.current = "wait_for_lift";
              next.walking = false;
            } else next.walking = true;
            break;
          }
          case "wait_for_lift": {
            // Stand still, face the doors (slight bob via frame=0).
            next.walking = false;
            const myFloor: 0 | 1 = s.y < CORRIDOR_Y + CORRIDOR_H / 2 ? 0 : 1;
            // Keep requesting our floor in case the lift was diverted.
            if (lift.targetFloor !== myFloor) lift.targetFloor = myFloor;
            const cabinHere = lift.currentFloor === myFloor && lift.phase === "doors_open" && lift.doorOpen > 0.85;
            if (cabinHere) {
              phaseRef.current = "board";
            }
            break;
          }
          case "board": {
            // Step into the cabin (same Y, X centered on shaft).
            if (moveTowards(INSIDE_X, s.y)) {
              // Mark cabin as occupied → doors will close, lift will move.
              lift.occupied = true;
              if (target) lift.targetFloor = target.row;
              phaseRef.current = "ride";
              next.walking = false;
            } else next.walking = true;
            break;
          }
          case "ride": {
            // Player is inside — y follows cabinY exactly.
            next.x = INSIDE_X;
            next.y = lift.cabinY;
            next.walking = false;
            const arrived =
              target && lift.currentFloor === target.row &&
              lift.phase === "doors_open" && lift.doorOpen > 0.85;
            if (arrived) {
              phaseRef.current = "exit";
            }
            break;
          }
          case "exit": {
            if (!target) { phaseRef.current = "idle"; break; }
            // Step out onto the destination floor (toward the target room).
            const exitDir = target.x > INSIDE_X ? 1 : -1;
            const exitX = INSIDE_X + exitDir * 10;
            if (moveTowards(exitX, roomFloorLineY(target.row))) {
              lift.occupied = false; // free the cabin
              phaseRef.current = "walk_final";
              next.walking = false;
            } else next.walking = true;
            break;
          }
          case "walk_final": {
            if (!target) { phaseRef.current = "idle"; break; }
            if (moveTowards(target.x, target.y)) {
              phaseRef.current = "idle";
              next.walking = false;
            } else next.walking = true;
            break;
          }
        }

        if (next.walking) next.frame = Math.floor(now / 140) % 4;
        else next.frame = 0;
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

// Deterministic pseudo-random in [0,1) — stable per (seed) so flicker has structure
function rand1(seed: number) {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// CRT monitor 12x9 at (x,y), with screen color.
// Realistic: animated bar-graph inside the screen, occasional flicker, scanline roll.
function drawCrt(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  screenColor: string,
  t: number,
  seed = 0,
) {
  drawRect(ctx, x, y, 12, 9, "#1a1a1a");        // bezel
  // Brief flicker every ~4-7s
  const flickerPhase = (t / 1000 + seed * 0.37) % (4 + (seed % 3));
  const flicker = flickerPhase < 0.06 ? 0.55 : 1;
  drawRect(ctx, x + 1, y + 1, 10, 6, screenColor);
  // Animated bar-graph (10 cols x 6 rows of pixels) — looks like SIEM volume meter
  for (let bx = 0; bx < 10; bx++) {
    // smooth wave per column with random phase
    const phase = seed * 0.6 + bx * 0.55;
    const wave = (Math.sin(t / 420 + phase) + Math.sin(t / 230 + phase * 1.7)) * 0.5;
    const h = Math.max(0, Math.min(6, Math.round(3 + wave * 2.5 * flicker)));
    const barCol = bx % 3 === 0 ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.3)";
    if (h < 6) drawRect(ctx, x + 1 + bx, y + 1, 1, 6 - h, barCol);
  }
  // Rolling scanline
  const sl = Math.floor((t / 90 + seed) % 6);
  drawRect(ctx, x + 1, y + 1 + sl, 10, 1, "rgba(0,0,0,0.35)");
  // Random hot pixel occasionally
  if (rand1(Math.floor(t / 180) + seed) > 0.92) {
    drawPx(ctx, x + 1 + (Math.floor(t / 50 + seed) % 10), y + 1 + (Math.floor(t / 70 + seed) % 6), C.white);
  }
  drawRect(ctx, x + 4, y + 9, 4, 1, "#0a0a0a");
  drawRect(ctx, x + 3, y + 9, 6, 1, "#2a2a2a");
}

// Server rack 14x40 — realistic LED activity (heartbeat + bursts + steady link lights)
function drawRack(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  drawRect(ctx, x, y, 14, 40, "#1a1a26");
  drawRect(ctx, x + 1, y + 1, 12, 38, "#0e0e18");
  for (let i = 0; i < 9; i++) {
    const ry = y + 3 + i * 4;
    drawRect(ctx, x + 2, ry, 10, 3, "#2a2a3a");

    // Steady "power" LED — slow soft pulse, never quite off
    const pulse = (Math.sin(t / 600 + i * 0.7) + 1) * 0.5; // 0..1
    drawPx(ctx, x + 3, ry + 1, pulse > 0.35 ? C.green : C.greenDim);

    // Activity LED — bursty traffic. Each lane has its own randomized bursts.
    const burstSeed = Math.floor(t / 90) + i * 11;
    const burstActive = rand1(Math.floor(t / 600) + i * 7) > 0.55;
    const flick = burstActive && rand1(burstSeed) > 0.45;
    drawPx(ctx, x + 6, ry + 1, flick ? C.amber : "#3a2a10");

    // Link LED — mostly on, occasional drop
    const linkUp = rand1(Math.floor(t / 1200) + i * 3) > 0.08;
    drawPx(ctx, x + 11, ry + 1, linkUp ? C.cyan : C.cyanDim);
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
function drawDesk(ctx: CanvasRenderingContext2D, x: number, y: number, screen: string, t: number, seed = 0) {
  // chair
  drawRect(ctx, x + 16, y + 14, 6, 6, "#1a1a26");
  drawRect(ctx, x + 16, y + 14, 6, 1, "#3a3a4a");
  // desk top
  drawRect(ctx, x, y + 12, 22, 3, "#3a2a1a");
  drawRect(ctx, x, y + 15, 2, 8, "#2a1a14");
  drawRect(ctx, x + 20, y + 15, 2, 8, "#2a1a14");
  // monitor on desk
  drawCrt(ctx, x + 4, y + 3, screen, t, seed);
}

// Network rack (NOC) — port lanes with link/activity LEDs that look like a real switch
function drawNocRack(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  drawRect(ctx, x, y, 18, 30, "#1a1a26");
  for (let i = 0; i < 5; i++) {
    const ry = y + 3 + i * 5;
    drawRect(ctx, x + 2, ry, 14, 3, "#0a0a14");
    for (let j = 0; j < 6; j++) {
      // Each port: link is mostly steady, traffic flickers in bursts
      const portSeed = i * 23 + j * 7;
      const link = rand1(Math.floor(t / 1500) + portSeed) > 0.12;
      const traffic = rand1(Math.floor(t / 80) + portSeed * 3) > 0.55;
      const col = link
        ? (traffic ? C.cyan : C.cyanDim)
        : "#0a0a14";
      drawPx(ctx, x + 3 + j * 2, ry + 1, col);
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

// Big SIEM video wall: 3 large screens with realistic animated bar-graphs
function drawSiemWall(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  // back wall plate
  drawRect(ctx, x, y, 60, 24, "#0a0a14");
  drawRect(ctx, x, y + 24, 60, 1, "#1a1a26");
  // 3 screens — each: bg color + vertical bar-graph + occasional spike
  const tints = [
    { bg: "#3a2810", bar: C.amber, dim: "#5a3a14" },     // events / log volume
    { bg: "#08303a", bar: C.cyan, dim: "#0a4a5a" },      // network throughput
    { bg: "#3a1010", bar: C.red, dim: "#5a1818" },       // alerts (red)
  ];
  for (let i = 0; i < 3; i++) {
    const sx = x + 2 + i * 20;
    const tint = tints[i];
    drawRect(ctx, sx, y + 2, 18, 16, "#0e0e18");
    drawRect(ctx, sx + 1, y + 3, 16, 14, tint.bg);
    // 16 vertical bars, height animated with seeded noise
    for (let bx = 0; bx < 16; bx++) {
      const ph = i * 7.3 + bx * 0.45;
      const wave = (Math.sin(t / 380 + ph) + Math.sin(t / 170 + ph * 2.1)) * 0.5;
      const spike = rand1(Math.floor(t / 250) + i * 31 + bx) > 0.92 ? 4 : 0;
      const h = Math.max(1, Math.min(13, Math.round(7 + wave * 4 + spike)));
      // bar: dim base + bright top pixel
      drawRect(ctx, sx + 1 + bx, y + 3 + (14 - h), 1, h, tint.dim);
      drawPx(ctx, sx + 1 + bx, y + 3 + (14 - h), tint.bar);
    }
    // Rolling scanline across the screen
    const sl = Math.floor((t / 70 + i * 5) % 14);
    drawRect(ctx, sx + 1, y + 3 + sl, 16, 1, "rgba(0,0,0,0.3)");
  }
}

// Forensic lab: bench with microscope + drives. Drive LED = realistic disk activity.
function drawForensics(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  drawRect(ctx, x, y + 12, 50, 4, "#3a2a1a");
  drawRect(ctx, x + 4, y + 16, 2, 8, "#2a1a14");
  drawRect(ctx, x + 44, y + 16, 2, 8, "#2a1a14");
  // microscope
  drawRect(ctx, x + 8, y + 4, 4, 8, "#2a2a3a");
  drawRect(ctx, x + 6, y + 12, 8, 1, "#3a3a4a");
  // microscope eyepiece light — slow pulse
  drawPx(ctx, x + 10, y + 2, ((Math.sin(t / 700) + 1) * 0.5) > 0.4 ? C.cyan : C.cyanDim);
  // drive — power LED steady-soft, activity LED bursty
  drawRect(ctx, x + 28, y + 6, 14, 6, "#1a1a26");
  drawPx(ctx, x + 30, y + 8, C.greenDim);
  const burst = rand1(Math.floor(t / 70)) > 0.55;
  drawPx(ctx, x + 31, y + 8, burst ? C.green : C.greenDim);
  drawRect(ctx, x + 32, y + 8, 8, 2, "#0a0a14");
  // tiny activity blip on the drive bezel
  if (rand1(Math.floor(t / 110) + 5) > 0.7) drawPx(ctx, x + 40, y + 8, C.amber);
}

// Conference table + chairs (war room) — wall screen with smooth animated waveform
function drawWarRoom(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  drawRect(ctx, x, y + 14, 56, 6, "#3a2a1a");
  drawRect(ctx, x + 6, y + 20, 4, 4, "#1a1a26");
  drawRect(ctx, x + 26, y + 20, 4, 4, "#1a1a26");
  drawRect(ctx, x + 46, y + 20, 4, 4, "#1a1a26");
  // wall screen
  drawRect(ctx, x + 8, y, 40, 12, "#0a0a14");
  drawRect(ctx, x + 9, y + 1, 38, 10, "#062028");
  // Animated waveform line across the screen
  for (let bx = 0; bx < 38; bx++) {
    const v = Math.sin(t / 280 + bx * 0.35) * 0.5 + Math.sin(t / 130 + bx * 0.7) * 0.25;
    const yy = y + 6 + Math.round(v * 3);
    drawPx(ctx, x + 9 + bx, yy, C.cyan);
    drawPx(ctx, x + 9 + bx, yy + 1, C.cyanDim);
  }
  // baseline grid
  for (let bx = 0; bx < 38; bx += 4) drawPx(ctx, x + 9 + bx, y + 6, "rgba(0,188,212,0.25)");
  // Rolling scanline
  const sl = Math.floor((t / 100) % 10);
  drawRect(ctx, x + 9, y + 1 + sl, 38, 1, "rgba(0,0,0,0.3)");
}

// Executive office: desk + lamp + plant
function drawCisoOffice(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  drawRect(ctx, x, y + 14, 36, 6, "#5a3820");
  drawRect(ctx, x + 4, y + 20, 4, 4, "#3a2a14");
  drawRect(ctx, x + 28, y + 20, 4, 4, "#3a2a14");
  // monitor — pass live t with seed for animated bars
  drawCrt(ctx, x + 8, y + 4, C.gold, t, 9);
  // lamp — soft warm pulse
  drawRect(ctx, x + 26, y + 6, 1, 8, "#3a3a4a");
  const lampOn = ((Math.sin(t / 1300) + 1) * 0.5) > 0.25;
  drawRect(ctx, x + 24, y + 4, 5, 3, lampOn ? C.gold : C.goldDim);
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
      drawDesk(ctx, x + 4, y + 24, C.cyan, t, 1);
      drawDesk(ctx, x + 34, y + 24, C.amber, t + 50, 2);
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
      drawDesk(ctx, x + 44, y + 24, C.green, t + 200, 3);
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

export function DollHouse({ current, highlight, onMove, maxHeight, isNight = false, alertRoom = null }: DollHouseProps) {
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
    return { x: roomCenterX(r.col) + 8, y: roomFloorLineY(r.row), row: r.row };
  }, []); // initial only

  // Shared elevator state — single source of truth for the cabin.
  const elevatorRef = useRef<ElevatorState>(makeElevatorRef(playerInitial.row));

  const player = useWalker(current, playerInitial, elevatorRef);

  // Track isNight in a ref so the rAF loop sees latest value without
  // re-binding (and we can smoothly interpolate the tint strength).
  const isNightRef = useRef(isNight);
  isNightRef.current = isNight;
  const tintRef = useRef(isNight ? 1 : 0); // 0 = day, 1 = night

  // ---- Visitor system ------------------------------------------------------
  // Occasionally an "extra" colleague appears from the staircase, walks into a
  // random room, chats next to the resident NPC for a few seconds, then leaves
  // again. Pure ref state — no React re-renders — so the rAF loop stays smooth.
  type VisitorPhase = "enter" | "chat" | "leave" | "idle";
  interface Visitor {
    phase: VisitorPhase;
    targetRoom: RoomId;
    x: number; y: number;
    facing: 1 | -1;
    shirt: string; pants: string; skin: string; hair: string;
    chatUntil: number;
    nextSpawnAt: number;
  }
  const visitorPalette: Array<{ shirt: string; pants: string; skin: string; hair: string }> = [
    { shirt: "#ff7a3a", pants: "#1a1a26", skin: C.skinA, hair: C.hairC }, // orange dev
    { shirt: "#3aa0ff", pants: "#0a0a14", skin: C.skinC, hair: C.hairB }, // blue consultant
    { shirt: "#9a6aff", pants: "#1a1a26", skin: C.skinB, hair: C.hairA }, // purple manager
    { shirt: "#7af542", pants: "#0a0a14", skin: C.skinD, hair: C.hairD }, // green pentester
    { shirt: "#ffd23a", pants: "#2a1a14", skin: C.skinA, hair: C.hairB }, // gold auditor
  ];
  const visitorRef = useRef<Visitor>({
    phase: "idle",
    targetRoom: "soc_floor",
    x: STAIR_X, y: roomFloorLineY(1),
    facing: 1,
    shirt: visitorPalette[0].shirt,
    pants: visitorPalette[0].pants,
    skin: visitorPalette[0].skin,
    hair: visitorPalette[0].hair,
    chatUntil: 0,
    nextSpawnAt: 12_000, // first visitor after ~12s
  });

  // Per-NPC behavior state — natural "stand for a few seconds, then take a few
  // steps to a new spot" loop. When an incident is active in their home room,
  // they rush to their workstation and type frantically until cleared.
  // State lives in a ref so the rAF loop can mutate it without re-rendering.
  interface NpcState {
    x: number;
    targetX: number;
    phaseUntil: number;            // ms timestamp when the current phase ends
    phase: "idle" | "walk" | "work";
    facing: 1 | -1;
    initialized: boolean;
  }
  const npcStatesRef = useRef<Record<string, NpcState>>({});
  const alertRoomRef = useRef<RoomId | null>(alertRoom);
  alertRoomRef.current = alertRoom;

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
      // ===== Elevator =====
      // Lovingly animated lift in the central shaft. The cabin tracks any figure
      // currently traversing the vertical staircase column; otherwise it idles
      // at whichever floor was last visited.
      const SHAFT_W = 18;
      const shaftX = STAIR_X - SHAFT_W / 2;
      const shaftTop = CORRIDOR_Y - 4;            // peeks slightly into upper floor
      const shaftBottom = CORRIDOR_Y + CORRIDOR_H + 2; // and into lower floor
      const upperFloorY = roomFloorLineY(0);
      const lowerFloorY = roomFloorLineY(1);

      // 1) Shaft frame & rails
      drawRect(ctx, shaftX - 1, shaftTop, SHAFT_W + 2, shaftBottom - shaftTop, "#0a0a14");
      drawRect(ctx, shaftX, shaftTop, SHAFT_W, shaftBottom - shaftTop, "#141422");
      // vertical guide rails (subtle gold)
      drawRect(ctx, shaftX + 1, shaftTop, 1, shaftBottom - shaftTop, C.goldDim);
      drawRect(ctx, shaftX + SHAFT_W - 2, shaftTop, 1, shaftBottom - shaftTop, C.goldDim);

      // 2) Update elevator state machine.
      // The cabin is the SOLE means of changing floor. The walker pushes
      // `targetFloor` and `occupied`; we advance physics + door dwell here.
      const lift = elevatorRef.current;
      const targetY = roomFloorLineY(lift.targetFloor);
      const FLOOR_TOL = 0.6;          // px — when we consider cabin "at floor"
      const DOOR_DWELL_MS = 1400;     // doors stay open this long when idle
      const ARRIVAL_DWELL_MS = 2200;  // a touch longer right after arrival, so player can step in/out

      // Move the cabin
      const dyToTarget = targetY - lift.cabinY;
      if (Math.abs(dyToTarget) > FLOOR_TOL) {
        // In transit — close doors, drift toward target with gentle ease
        lift.phase = "moving";
        lift.cabinY += dyToTarget * 0.06;
      } else {
        // At a floor — snap, mark currentFloor reached, open doors
        lift.cabinY = targetY;
        if (lift.currentFloor !== lift.targetFloor) {
          lift.currentFloor = lift.targetFloor;
          lift.phase = "doors_open";
          lift.phaseUntil = t + ARRIVAL_DWELL_MS;
        } else if (lift.phase === "moving") {
          // Just settled
          lift.phase = "doors_open";
          lift.phaseUntil = t + ARRIVAL_DWELL_MS;
        }
      }

      // Door progress
      // Doors closed while moving OR while occupied (passenger inside, ready to ride).
      // Doors open while idle at a floor and not occupied, or while waiting for passenger to step in/out.
      const doorsShouldOpen =
        lift.phase === "doors_open" &&
        Math.abs(targetY - lift.cabinY) <= FLOOR_TOL &&
        !lift.occupied;
      const doorTarget = doorsShouldOpen ? 1 : 0;
      lift.doorOpen = lift.doorOpen + (doorTarget - lift.doorOpen) * 0.14;

      // While doors are open and dwell expired, allow new floor calls;
      // if no fresh call, just stay put. (targetFloor==currentFloor → idle)
      if (lift.phase === "doors_open" && t >= lift.phaseUntil && !lift.occupied) {
        // refresh dwell so doors keep gently breathing
        lift.phaseUntil = t + DOOR_DWELL_MS;
      }

      const cabinY = lift.cabinY;
      const moving = Math.abs(targetY - cabinY) > FLOOR_TOL;
      const doorOpen = lift.doorOpen;

      // 3) Cable from top of shaft to cabin
      drawRect(ctx, STAIR_X, shaftTop, 1, Math.max(0, Math.round(cabinY - 14 - shaftTop)), "#3a3a4a");
      // Cable wobble pixel when moving
      if (moving) {
        const wob = Math.sin(t / 60) > 0 ? 1 : -1;
        drawPx(ctx, STAIR_X + wob, shaftTop + Math.floor((cabinY - shaftTop) / 2), "#5a5a6a");
      }

      // 4) Cabin (16x16) — body, ceiling lamp, floor
      const cabX = shaftX + 1;
      const cabY = Math.round(cabinY) - 16;
      drawRect(ctx, cabX, cabY, SHAFT_W - 2, 16, "#1d1d33");
      drawRect(ctx, cabX + 1, cabY + 1, SHAFT_W - 4, 14, "#22223a");
      // ceiling lamp — warm gold, soft pulse
      const lampOn = ((Math.sin(t / 350) + 1) * 0.5) > 0.25;
      drawRect(ctx, cabX + 5, cabY + 1, 6, 2, lampOn ? C.gold : C.goldDim);
      drawPx(ctx, cabX + 7, cabY + 3, lampOn ? C.gold : C.goldDim);
      drawPx(ctx, cabX + 8, cabY + 3, lampOn ? C.gold : C.goldDim);
      // cabin floor strip
      drawRect(ctx, cabX, cabY + 14, SHAFT_W - 2, 2, "#0a0a14");

      // 5) Sliding doors (driven by elevator state, not by player position)
      const halfDoor = Math.floor((SHAFT_W - 4) / 2);
      const slide = Math.round(halfDoor * doorOpen);
      // Left door
      drawRect(ctx, cabX + 1, cabY + 3, halfDoor - slide, 11, "#2a2a45");
      drawRect(ctx, cabX + 1 + halfDoor - slide - 1, cabY + 3, 1, 11, C.cyanDim);
      // Right door
      drawRect(ctx, cabX + 1 + halfDoor + slide, cabY + 3, halfDoor - slide, 11, "#2a2a45");
      drawRect(ctx, cabX + 1 + halfDoor + slide, cabY + 3, 1, 11, C.cyanDim);
      // Door seam light when fully open — magenta neon glow
      if (doorOpen > 0.85) {
        drawRect(ctx, cabX + 1 + halfDoor - slide, cabY + 13, 2 * slide, 1, C.magenta);
      }

      // 6) Floor indicator above the upper door — shows current floor + travel arrow
      const indY = shaftTop - 1;
      drawRect(ctx, shaftX + 4, indY, SHAFT_W - 8, 4, "#0a0a14");
      // Floor digit (1 = upper, 2 = lower) — render as small pixel digit
      const floorNum = lift.targetFloor === 0 ? 1 : 2;
      // simple 3x3 pixel digit
      const digitX = shaftX + 6;
      const digitY = indY + 1;
      const digitOn = lampOn ? C.amber : "#5a3a10";
      if (floorNum === 1) {
        drawPx(ctx, digitX + 1, digitY, digitOn);
        drawPx(ctx, digitX + 1, digitY + 1, digitOn);
        drawPx(ctx, digitX + 1, digitY + 2, digitOn);
      } else {
        drawPx(ctx, digitX, digitY, digitOn);
        drawPx(ctx, digitX + 1, digitY, digitOn);
        drawPx(ctx, digitX + 2, digitY, digitOn);
        drawPx(ctx, digitX + 2, digitY + 1, digitOn);
        drawPx(ctx, digitX + 1, digitY + 2, digitOn);
        drawPx(ctx, digitX, digitY + 2, digitOn);
        drawPx(ctx, digitX, digitY + 3, digitOn);
        drawPx(ctx, digitX + 1, digitY + 3, digitOn);
        drawPx(ctx, digitX + 2, digitY + 3, digitOn);
      }
      // Travel arrow — points up or down when moving, off when idle
      const arrowX = shaftX + SHAFT_W - 5;
      if (moving) {
        const goingUp = targetY < cabinY;
        const blink = (Math.floor(t / 220) % 2) === 0;
        const aCol = blink ? C.green : C.greenDim;
        if (goingUp) {
          drawPx(ctx, arrowX + 1, digitY, aCol);
          drawPx(ctx, arrowX, digitY + 1, aCol);
          drawPx(ctx, arrowX + 1, digitY + 1, aCol);
          drawPx(ctx, arrowX + 2, digitY + 1, aCol);
          drawPx(ctx, arrowX + 1, digitY + 2, aCol);
        } else {
          drawPx(ctx, arrowX + 1, digitY + 1, aCol);
          drawPx(ctx, arrowX, digitY + 2, aCol);
          drawPx(ctx, arrowX + 1, digitY + 2, aCol);
          drawPx(ctx, arrowX + 2, digitY + 2, aCol);
          drawPx(ctx, arrowX + 1, digitY + 3, aCol);
        }
      } else {
        drawPx(ctx, arrowX + 1, digitY + 1, "#3a3a4a");
        drawPx(ctx, arrowX + 1, digitY + 2, "#3a3a4a");
      }

      // 7) Call buttons next to door at each floor (decorative — soft glow)
      const callBlink = ((Math.sin(t / 280) + 1) * 0.5) > 0.55;
      drawPx(ctx, shaftX - 2, upperFloorY - 6, callBlink ? C.cyan : C.cyanDim);
      drawPx(ctx, shaftX + SHAFT_W + 1, lowerFloorY - 6, callBlink ? C.cyan : C.cyanDim);

      // 8) Subtle neon side rails replacing old stair rail
      const railFlicker = (Math.floor(t / 80) % 17) === 0;
      const railCol = railFlicker ? C.magenta : C.magentaDim;
      drawRect(ctx, shaftX - 3, CORRIDOR_Y + 4, 1, CORRIDOR_H - 8, railCol);
      drawRect(ctx, shaftX + SHAFT_W + 2, CORRIDOR_Y + 4, 1, CORRIDOR_H - 8, railCol);

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

      // NPCs — natural behavior: stand still most of the time, occasionally
      // walk a few steps to a new spot in the room, then stand again.
      // When an incident touches their home room they rush to their workstation
      // and type frantically until the alert clears.
      const npcPositions: Partial<Record<NpcId, { x: number; y: number }>> = {};
      const WALK_SPEED = 22;        // px/s — calm office pace
      const RUSH_SPEED = 70;        // px/s — hectic when alerted
      // Per-room workstation X offset (relative to room left edge).
      // Picked so the NPC stands right next to a desk / rack / monitor.
      const WORKSTATION_OFFSET: Record<RoomId, number> = {
        soc_floor:   12,   // left desk in SOC bullpen
        siem:        20,   // in front of the video wall
        forensics:   18,   // forensic bench
        noc:         52,   // NOC desk on the right
        server_room: 12,   // first rack
        war_room:    32,   // wall screen
        ciso_office: 18,   // CISO desk
        kitchen:     16,   // coffee machine
      };

      NPCS.forEach((npc, idx) => {
        const r = ROOMS.find((x) => x.id === npc.homeRoom)!;
        const baseX = r.col * ROOM_W;
        const minX = baseX + 6;
        const maxX = baseX + ROOM_W - 14;
        const span = Math.max(16, maxX - minX);
        const workstationX = Math.max(minX, Math.min(maxX, baseX + WORKSTATION_OFFSET[npc.homeRoom]));
        const isAlerted = alertRoomRef.current === npc.homeRoom;

        // Initialize per-NPC state on first frame
        let st = npcStatesRef.current[npc.id];
        if (!st) {
          const startX = minX + Math.floor(span * (0.2 + (idx * 0.17) % 0.6));
          st = {
            x: startX,
            targetX: startX,
            phase: "idle",
            // Stagger first decision so they don't all move in sync
            phaseUntil: t + 1500 + idx * 700,
            facing: 1,
            initialized: true,
          };
          npcStatesRef.current[npc.id] = st;
        }

        // === Alert override ===
        // If their room is hot and they aren't already at the workstation,
        // force a rush-to-desk. If they're there, lock them into "work" mode.
        if (isAlerted) {
          const distToWs = Math.abs(st.x - workstationX);
          if (distToWs > 1.2) {
            // (Re)target the workstation if not already heading there
            if (st.phase !== "walk" || Math.abs(st.targetX - workstationX) > 0.5) {
              st.targetX = workstationX;
              st.phase = "walk";
              st.facing = workstationX > st.x ? 1 : -1;
              st.phaseUntil = t + 30_000;
            }
          } else if (st.phase !== "work") {
            st.x = workstationX;
            st.phase = "work";
            st.facing = 1; // face the desk/screen
            st.phaseUntil = t + 60_000; // refresh while alert lasts
          }
        } else if (st.phase === "work") {
          // Alert just cleared — relax back into idle wandering
          st.phase = "idle";
          st.phaseUntil = t + 1200 + Math.random() * 2000;
        }

        // Phase transitions (only when not under alert lock)
        if (!isAlerted && t >= st.phaseUntil) {
          if (st.phase === "idle") {
            const longTrip = Math.random() < 0.25;
            const stepDist = longTrip
              ? 16 + Math.random() * (span - 16)
              : 8 + Math.random() * 14;
            const dir = Math.random() < 0.5 ? -1 : 1;
            let target = st.x + dir * stepDist;
            if (target < minX) target = st.x + stepDist;
            if (target > maxX) target = st.x - stepDist;
            target = Math.max(minX, Math.min(maxX, target));
            st.targetX = target;
            st.phase = "walk";
            st.facing = target > st.x ? 1 : -1;
            st.phaseUntil = t + 30_000;
          } else if (st.phase === "walk") {
            st.phase = "idle";
            st.phaseUntil = t + 3000 + Math.random() * 6000;
          }
        }

        // Move during walk phase
        let walkingNow = false;
        if (st.phase === "walk") {
          const dx = st.targetX - st.x;
          const adx = Math.abs(dx);
          if (adx < 0.6) {
            st.x = st.targetX;
            // If we just arrived at the workstation under alert, snap to work
            if (isAlerted && Math.abs(st.x - workstationX) < 1.2) {
              st.phase = "work";
              st.facing = 1;
              st.phaseUntil = t + 60_000;
            } else {
              st.phase = "idle";
              st.phaseUntil = t + 3000 + Math.random() * 6000;
            }
          } else {
            const speed = isAlerted ? RUSH_SPEED : WALK_SPEED;
            const step = speed * (1 / 60);
            st.x += Math.sign(dx) * Math.min(step, adx);
            st.facing = dx > 0 ? 1 : -1;
            walkingNow = true;
          }
        }

        const x = Math.round(st.x);
        const y = roomFloorLineY(r.row);
        const look = NPC_LOOK[npc.id];
        // Walking gait: faster cadence when rushing
        const movingFrame = walkingNow
          ? Math.floor(t / (isAlerted ? 80 : 130)) % 4
          : 0;
        // While "working", flicker a tiny typing animation in arms by toggling
        // the frame (drawFigure swings arms based on frame parity).
        const typingFrame = st.phase === "work" ? (Math.floor(t / 90) % 4) : movingFrame;
        const showAsWalking = walkingNow || st.phase === "work";
        npcPositions[npc.id] = { x, y };
        drawFigure(
          ctx, x, y,
          st.facing, showAsWalking, typingFrame,
          look.shirt, look.pants, look.skin, look.hair,
        );

        // Workstation visual cues during "work" phase: keyboard tap sparks +
        // a small red exclamation badge above their head so the player can see
        // which NPC is on it.
        if (st.phase === "work") {
          // Tap spark on the desk (roughly where the keyboard sits)
          if ((Math.floor(t / 70) % 2) === 0) {
            drawPx(ctx, x + 1, y - 2, C.amber);
            drawPx(ctx, x + 2, y - 2, C.gold);
          }
          // Blinking red alert dot above the head
          const blink = (Math.floor(t / 240) % 2) === 0;
          drawPx(ctx, x, y - 20, blink ? C.red : C.redDim);
          drawPx(ctx, x + 1, y - 20, blink ? C.red : C.redDim);
        }
      });

      // ---- Visitor state machine ----------------------------------------
      // Spawns occasionally, walks from staircase to a chosen room's right
      // half, chats next to the resident NPC for a few seconds, then leaves.
      const v = visitorRef.current;
      const vSpeed = 28; // logical px/s
      const dt = 16; // approx ms/frame — visitors don't need exact dt
      const walkBy = (tx: number, ty: number) => {
        const dx = tx - v.x, dy = ty - v.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 1) { v.x = tx; v.y = ty; return true; }
        const step = (vSpeed * dt) / 1000;
        v.x += (dx / dist) * step;
        v.y += (dy / dist) * step;
        if (Math.abs(dx) > 0.2) v.facing = dx > 0 ? 1 : -1;
        return false;
      };

      if (v.phase === "idle") {
        if (t >= v.nextSpawnAt) {
          const npc = NPCS[Math.floor(Math.random() * NPCS.length)];
          const palette = visitorPalette[Math.floor(Math.random() * visitorPalette.length)];
          v.targetRoom = npc.homeRoom;
          v.shirt = palette.shirt; v.pants = palette.pants;
          v.skin = palette.skin; v.hair = palette.hair;
          v.x = STAIR_X + 2;
          v.y = roomFloorLineY(1);
          v.facing = 1;
          v.phase = "enter";
        }
      } else if (v.phase === "enter") {
        const r = ROOMS.find((x) => x.id === v.targetRoom)!;
        const targetX = r.col * ROOM_W + Math.floor(ROOM_W * 0.75); // right lane
        const targetY = roomFloorLineY(r.row);
        if (Math.abs(v.y - targetY) > 1) {
          if (Math.abs(v.x - STAIR_X) > 1) walkBy(STAIR_X, v.y);
          else walkBy(STAIR_X, targetY);
        } else if (walkBy(targetX, targetY)) {
          v.phase = "chat";
          v.chatUntil = t + 4500 + Math.random() * 3500;
          const npc = NPCS.find((n) => n.homeRoom === v.targetRoom);
          const pos = npc ? npcPositions[npc.id] : undefined;
          if (pos) v.facing = pos.x < v.x ? -1 : 1;
        }
      } else if (v.phase === "chat") {
        if (t >= v.chatUntil) v.phase = "leave";
      } else if (v.phase === "leave") {
        const targetY = roomFloorLineY(1);
        if (Math.abs(v.y - targetY) > 1) {
          if (Math.abs(v.x - STAIR_X) > 1) walkBy(STAIR_X, v.y);
          else walkBy(STAIR_X, targetY);
        } else if (walkBy(-10, targetY)) {
          v.phase = "idle";
          v.nextSpawnAt = t + 18_000 + Math.random() * 22_000;
        }
      }

      if (v.phase !== "idle") {
        const walking = v.phase !== "chat";
        const frame = Math.floor(t / 130) % 4;
        drawFigure(
          ctx, Math.round(v.x), Math.round(v.y),
          v.facing, walking, frame,
          v.shirt, v.pants, v.skin, v.hair,
        );
        if (v.phase === "chat") {
          const bx = Math.round(v.x) + (v.facing === 1 ? -10 : 4);
          const by = Math.round(v.y) - 22;
          drawRect(ctx, bx, by, 10, 6, "#e8e8f0");
          drawRect(ctx, bx + (v.facing === 1 ? 7 : 1), by + 6, 2, 1, "#e8e8f0");
          const dotPhase = Math.floor(t / 250) % 3;
          drawPx(ctx, bx + 2, by + 3, dotPhase >= 0 ? "#0a0a14" : "#7a7a8a");
          drawPx(ctx, bx + 5, by + 3, dotPhase >= 1 ? "#0a0a14" : "#7a7a8a");
          drawPx(ctx, bx + 8, by + 3, dotPhase >= 2 ? "#0a0a14" : "#7a7a8a");
        }
      }


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
