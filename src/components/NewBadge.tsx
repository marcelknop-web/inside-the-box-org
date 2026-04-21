import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

/**
 * Subtle "new" indicator badge. Renders a small gold dot until the user
 * clicks/hovers, then persists dismissed state in localStorage.
 *
 * Usage: <NewBadge id="ttx-readiness-2026" />
 *
 * Each id should be unique per item. After dismissal, the badge stays
 * hidden for that specific id forever.
 */
interface NewBadgeProps {
  id: string;
  /** Optional: hide automatically after N days from first sight (default 14) */
  maxDays?: number;
  className?: string;
}

const STORAGE_PREFIX = 'itb-newbadge:';

export const NewBadge = ({ id, maxDays = 14, className = '' }: NewBadgeProps) => {
  const { language } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const key = STORAGE_PREFIX + id;
    const raw = localStorage.getItem(key);
    if (raw === 'dismissed') {
      setVisible(false);
      return;
    }
    let firstSeen: number;
    if (raw) {
      firstSeen = parseInt(raw, 10);
      if (Number.isNaN(firstSeen)) firstSeen = Date.now();
    } else {
      firstSeen = Date.now();
      localStorage.setItem(key, String(firstSeen));
    }
    const ageDays = (Date.now() - firstSeen) / (1000 * 60 * 60 * 24);
    setVisible(ageDays < maxDays);
  }, [id, maxDays]);

  if (!visible) return null;

  const label = language === 'de' ? 'Neu' : language === 'fr' ? 'Nouveau' : 'New';

  return (
    <span
      className={`inline-flex items-center gap-1 align-middle ${className}`}
      aria-label={label}
      title={label}
    >
      <span className="relative inline-flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
      </span>
      <span className="text-[10px] font-mono uppercase tracking-wider text-primary/90">
        {label}
      </span>
    </span>
  );
};
