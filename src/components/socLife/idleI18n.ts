import type { RoomId } from "@/data/socLifeData";
import type { IdleAction } from "./RoomActions";

/**
 * Resolve the i18n label for an idle action — preferring the room-specific
 * variant (`idle.byRoom.<roomId>.<action>.{name|result}`) when present,
 * and falling back to the generic copy (`idle.<action>.{name|result}`).
 *
 * Accepts a `t()` function that is already namespaced (e.g. via
 * `useVariantT()`), so keys are *relative* to the active SOC Life root.
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
  const specificKey = `idle.byRoom.${room}.${action}.${field}`;
  const specific = t(specificKey);
  if (specific !== specificKey) return specific;
  return t(`idle.${action}.${field}`);
}
