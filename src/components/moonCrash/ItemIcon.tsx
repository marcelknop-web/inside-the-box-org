import { Flame, Package, Cable, Umbrella, Heater, Crosshair, Milk, Cylinder, Map, Sailboat, Droplets, Siren, BriefcaseMedical, Compass, Radio, type LucideIcon } from "lucide-react";

const icons: LucideIcon[] = [Flame, Package, Cable, Umbrella, Heater, Crosshair, Milk, Cylinder, Map, Sailboat, Droplets, Siren, BriefcaseMedical, Compass, Radio];

export function ItemIcon({ item, className = "size-6" }: { item: number; className?: string }) {
  const Icon = icons[item] ?? Package;
  return <Icon className={className} aria-hidden="true" />;
}
