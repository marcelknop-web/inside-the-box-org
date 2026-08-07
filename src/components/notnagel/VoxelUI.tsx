import React from "react";

/** Voxel-Panel: harte Kanten, Blockrahmen, Pixel-Bevel. Ersetzt die frühere Card. */
export function VoxelPanel({
  title, action, children, className = "", tone = "default",
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "gold" | "cyan";
}) {
  const border =
    tone === "gold" ? "border-[#f5b800]/50"
    : tone === "cyan" ? "border-[#00bcd4]/40"
    : "border-[#243347]";
  return (
    <div className={`voxel-bevel border-2 ${border} bg-[#16202e] p-4 sm:p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-3.5 flex items-start justify-between gap-3 border-b-2 border-[#22303f] pb-2.5">
          {title && (
            <h3 className="text-[13.5px] font-bold uppercase tracking-[0.14em] text-[#ffd23f]">{title}</h3>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}


type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
  pixel?: boolean;
};

/** Blockiger Button mit Press-Effekt. */
export function VoxelButton({
  variant = "primary", pixel = false, className = "", children, ...rest
}: ButtonProps) {
  const base = "voxel-press inline-flex items-center justify-center gap-2 border-2 px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40";
  const look =
    variant === "primary"
      ? "voxel-bevel-gold border-[#ffd23f] bg-[#f5b800] text-[#0a0e14] hover:bg-[#ffd23f]"
      : variant === "danger"
        ? "voxel-bevel border-red-500/60 bg-red-500/15 text-red-200 hover:bg-red-500/25"
        : "voxel-bevel border-[#33455c] bg-[#16202e] text-[#d6e0ee] hover:border-[#f5b800]/70 hover:text-[#ffd23f]";
  const type = pixel ? "text-[13px] font-bold uppercase tracking-[0.12em]" : "";
  return (
    <button className={`${base} ${look} ${type} ${className}`} {...rest}>
      {children}
    </button>
  );
}

