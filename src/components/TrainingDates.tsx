import { isPastDate } from '@/lib/trainingDates';

export function TrainingDates({ text, endDates }: { text: string; endDates: readonly string[] }) {
  return (
    <p className="text-highlight text-sm font-mono font-semibold">
      {text.split(' · ').map((label, index) => (
        <span key={index}>
          {index > 0 && <span className="text-muted-foreground"> · </span>}
          <span className={endDates[index] && isPastDate(endDates[index]) ? 'text-muted-foreground opacity-50 grayscale' : undefined}>{label}</span>
        </span>
      ))}
    </p>
  );
}