import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CalendarCheck, Loader2 } from 'lucide-react';

const EVENT_DATES = [
  { value: '2026-05-07', labelKey: 'date1', locationKey: 'location' },
  { value: '2026-09-17', labelKey: 'date2', locationKey: 'location' },
  { value: '2026-12-03', labelKey: 'date3', locationKey: 'locationBerlin' },
] as const;

const TtxRegistrationForm = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    company: '',
    phone: '',
    notes: '',
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !form.first_name || !form.last_name || !form.email) return;

    setLoading(true);
    const { error } = await supabase.from('ttx_registrations' as any).insert({
      event_date: selectedDate,
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      company: form.company || null,
      phone: form.phone || null,
      notes: form.notes || null,
    });
    setLoading(false);

    if (error) {
      toast.error(t('ttx.registerError'));
    } else {
      toast.success(t('ttx.registerSuccess'));
      setForm({ first_name: '', last_name: '', email: '', company: '', phone: '', notes: '' });
      setSelectedDate('');
    }
  };

  const inputClass =
    'w-full rounded-md border border-primary/20 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Date selector */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-primary font-sans">{t('ttx.selectDate')} *</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {EVENT_DATES.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setSelectedDate(d.value)}
              className={`flex items-center gap-2 rounded-lg border p-3 text-sm font-sans transition-all cursor-pointer ${
                selectedDate === d.value
                  ? 'border-primary bg-primary/10 text-primary font-semibold'
                  : 'border-primary/20 bg-card/40 text-foreground/80 hover:border-primary/40'
              }`}
            >
              <CalendarCheck className="w-4 h-4 shrink-0" />
              <div className="text-left">
                <div>{t(`ttx.${d.labelKey}` as any)}</div>
                <div className="text-xs text-muted-foreground">{t(`ttx.${d.locationKey}` as any)}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Name fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">{t('ttx.firstName')} *</label>
          <input className={inputClass} required value={form.first_name} onChange={(e) => update('first_name', e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">{t('ttx.lastName')} *</label>
          <input className={inputClass} required value={form.last_name} onChange={(e) => update('last_name', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">{t('ttx.email')} *</label>
        <input className={inputClass} type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">{t('ttx.company')}</label>
          <input className={inputClass} value={form.company} onChange={(e) => update('company', e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">{t('ttx.phone')}</label>
          <input className={inputClass} value={form.phone} onChange={(e) => update('phone', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">{t('ttx.notes')}</label>
        <textarea className={`${inputClass} min-h-[60px]`} value={form.notes} onChange={(e) => update('notes', e.target.value)} />
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-muted-foreground">{t('ttx.spotsInfo')}</p>
        <button
          type="submit"
          disabled={loading || !selectedDate || !form.first_name || !form.last_name || !form.email}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {t('ttx.submitRegister')}
        </button>
      </div>
    </form>
  );
};

export default TtxRegistrationForm;
