import type { RoomId } from "@/data/socLifeData";
import type { IdleAction } from "./RoomActions";

/**
 * Resolve the i18n label for an idle action — preferring the room-specific
 * variant (`socLife.idle.<action>.byRoom.<roomId>.{name|result}`) when present,
 * and falling back to the generic copy (`socLife.idle.<action>.{name|result}`).
 *
 * `t()` returns the lookup key itself when a translation is missing, so we use
 * "result equals key" as the sentinel for "no override defined".
 */
export function resolveIdleLabel(
  t: (key: string) => string,
  action: IdleAction,
  room: RoomId,
  field: "name" | "result",
): string {
  const specificKey = `socLife.idle.byRoom.${room}.${action}.${field}`;
  const specific = t(specificKey);
  if (specific !== specificKey) return specific;
  return t(`socLife.idle.${action}.${field}`);
}
