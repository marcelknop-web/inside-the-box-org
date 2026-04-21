import { useLanguage } from '@/i18n/LanguageContext';

/**
 * Pure date-based "new" badge. Renders a small pulsing gold dot + label
 * if `addedAt` is within the last `maxDays` days (default 30).
 *
 * Unlike <NewBadge>, this does not use localStorage — it's purely a
 * function of the publication date, so all visitors see the same state.
 *
 * Usage: <NewDateBadge addedAt="2026-04-15" />
 */
interface NewDateBadgeProps {
  /** ISO date string YYYY-MM-DD */
  addedAt: string;
  /** Hide once older than N days (default 30) */
  maxDays?: number;
  className?: string;
}

export const NewDateBadge = ({ addedAt, maxDays = 30, className = '' }: NewDateBadgeProps) => {
  const { language } = useLanguage();
  const ts = new Date(addedAt).getTime();
  if (Number.isNaN(ts)) return null;
  const ageDays = (Date.now() - ts) / (1000 * 60 * 60 * 24);
  if (ageDays >= maxDays || ageDays < 0) return null;

  const label = language === 'de' ? 'Neu' : language === 'fr' ? 'Nouveau' : 'New';

  return (
    <span
      className={`inline-flex items-center gap-1 align-middle font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-highlight/15 text-highlight border border-highlight/30 ${className}`}
      aria-label={label}
      title={label}
    >
      <span className="relative inline-flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-highlight opacity-60 animate-ping" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-highlight" />
      </span>
      {label}
    </span>
  );
};
