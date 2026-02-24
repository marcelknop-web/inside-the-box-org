import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { GeometricSymbol } from '@/components/GeometricSymbol';

const formSchema = z.object({
  vorname: z.string().trim().max(100).optional(),
  nachname: z.string().trim().max(100).optional(),
  email: z.string().trim().email({ message: 'Bitte gültige E-Mail-Adresse eingeben' }).max(255),
  geburtsdatum: z.date().optional(),
  falscheErklaerungen: z.enum(['nein', 'ja'], { required_error: 'Bitte auswählen' }),
  notorisch: z.enum(['nein', 'ja'], { required_error: 'Bitte auswählen' }),
  erlaeuterung: z.string().trim().max(2000).optional(),
  initialen: z.string().trim().min(1, { message: 'Initialen sind erforderlich' }).max(10),
  bestaetigung: z.literal(true, { errorMap: () => ({ message: 'Bitte bestätigen' }) }),
});

type FormValues = z.infer<typeof formSchema>;

const Ehrenerklaerung = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vorname: '',
      nachname: '',
      email: '',
      falscheErklaerungen: 'nein',
      notorisch: 'nein',
      erlaeuterung: '',
      initialen: '',
    },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'brain99') {
      setIsAuthenticated(true);
    } else {
      alert('Falsches Passwort');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #e8eff5 0%, #f0f4f8 100%)' }}>
        <div className="w-full max-w-sm space-y-6 px-6">
          <div className="text-center">
            <GeometricSymbol size="sm" />
            <h1 className="text-2xl font-bold mt-4" style={{ color: '#4a6b7a' }}>Ehrenerklärung</h1>
            <p className="text-sm mt-2" style={{ color: '#7a9aaa' }}>Bitte Passwort eingeben</p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white"
              style={{ borderColor: '#c0d0d8' }}
            />
            <Button type="submit" className="w-full py-5" style={{ background: '#5a8a9a', color: 'white' }}>
              Zugang
            </Button>
          </form>
        </div>
      </div>
    );
  }

  const onSubmit = (data: FormValues) => {
    console.log('Ehrenerklärung submitted:', { ...data, email: '[redacted]' });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #e8eff5 0%, #f0f4f8 100%)' }}>
        <div className="text-center space-y-4 p-8">
          <div className="flex justify-center"><GeometricSymbol size="md" /></div>
          <h2 className="text-2xl font-semibold" style={{ color: '#4a6b7a' }}>Vielen Dank!</h2>
          <p style={{ color: '#6b8a9a' }}>Ihre Ehrenerklärung wurde erfolgreich übermittelt.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #e8eff5 0%, #f0f4f8 100%)' }}>
      {/* Header */}
      <div className="px-6 pt-10 pb-6 max-w-lg mx-auto">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold italic" style={{ color: '#4a6b7a' }}>
              Ehrenerklärung
            </h1>
            <p className="mt-2 text-sm" style={{ color: '#7a9aaa' }}>
              Bitte das folgende Formular ausfüllen,<br />
              um am ISACA CSE Training teilzunehmen.
            </p>
          </div>
          <div className="flex-shrink-0 ml-4 mt-1">
            <GeometricSymbol size="sm" />
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-6 pb-8 max-w-lg mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Vorname / Nachname */}
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="vorname" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-normal" style={{ color: '#4a6b7a' }}>Vorname</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-white border-0 border-b-2 rounded-none shadow-none focus-visible:ring-0 focus-visible:border-[#4a8b9a]" style={{ borderColor: '#c0d0d8', color: '#1a2a3a' }} />
                  </FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="nachname" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-normal" style={{ color: '#4a6b7a' }}>Nachname</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-white border-0 border-b-2 rounded-none shadow-none focus-visible:ring-0 focus-visible:border-[#4a8b9a]" style={{ borderColor: '#c0d0d8', color: '#1a2a3a' }} />
                  </FormControl>
                </FormItem>
              )} />
            </div>

            {/* Email / Geburtsdatum */}
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-normal" style={{ color: '#4a6b7a' }}>E-Mail-Adresse *</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} className="bg-white border-0 border-b-2 rounded-none shadow-none focus-visible:ring-0 focus-visible:border-[#4a8b9a]" style={{ borderColor: '#c0d0d8', color: '#1a2a3a' }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="geburtsdatum" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-normal" style={{ color: '#4a6b7a' }}>Geburtsdatum</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className={cn(
                          "w-full bg-white border-0 border-b-2 rounded-none shadow-none font-normal justify-between focus-visible:ring-0 hover:bg-white",
                          !field.value && "text-muted-foreground"
                        )} style={{ borderColor: '#c0d0d8' }}>
                          {field.value ? format(field.value, 'dd.MM.yyyy') : ''}
                          <CalendarIcon className="h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </FormItem>
              )} />
            </div>

            {/* Radio questions */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <FormField control={form.control} name="falscheErklaerungen" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-normal leading-snug" style={{ color: '#4a6b7a' }}>
                    Ich habe in den letzten 12 Monaten falsche Ehren-Erklärungen abgegeben
                  </FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="mt-2 space-y-1">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nein" id="falsch-nein" />
                        <Label htmlFor="falsch-nein" className="font-normal text-sm" style={{ color: '#4a6b7a' }}>Nein</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ja" id="falsch-ja" />
                        <Label htmlFor="falsch-ja" className="font-normal text-sm" style={{ color: '#4a6b7a' }}>Ja</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="notorisch" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-normal leading-snug" style={{ color: '#4a6b7a' }}>
                    Ich bin ein/e notorische/r Lügner:in
                  </FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="mt-2 space-y-1">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nein" id="notor-nein" />
                        <Label htmlFor="notor-nein" className="font-normal text-sm" style={{ color: '#4a6b7a' }}>Nein</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ja" id="notor-ja" />
                        <Label htmlFor="notor-ja" className="font-normal text-sm" style={{ color: '#4a6b7a' }}>Ja</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Erläuterung */}
            <FormField control={form.control} name="erlaeuterung" render={({ field }) => (
              <FormItem className="pt-4">
                <FormLabel className="text-sm font-normal" style={{ color: '#4a6b7a' }}>
                  Falls eine Frage mit Ja beantwortet wurde, bitte erläutern:
                </FormLabel>
                <FormControl>
                  <Textarea {...field} rows={4} className="bg-white border rounded-lg shadow-none focus-visible:ring-0 resize-none" style={{ borderColor: '#c0d0d8', color: '#1a2a3a' }} />
                </FormControl>
              </FormItem>
            )} />

            {/* Initialen */}
            <FormField control={form.control} name="initialen" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-normal" style={{ color: '#4a6b7a' }}>Initialen *</FormLabel>
                <FormControl>
                  <Input {...field} className="bg-white border rounded-lg shadow-none focus-visible:ring-0" style={{ borderColor: '#c0d0d8', color: '#1a2a3a' }} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Checkbox */}
            <FormField control={form.control} name="bestaetigung" render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="leading-snug">
                  <FormLabel className="text-xs font-normal" style={{ color: '#6b8a9a' }}>
                    Hiermit erkläre ich, dass die von mir angegebenen Informationen richtig und vollständig sind.
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )} />

            {/* Submit */}
            <div className="pt-2">
              <Button type="submit" className="w-full py-6 text-base font-medium rounded-lg" style={{ background: '#5a8a9a', color: 'white' }}>
                Absenden
              </Button>
              <p className="text-center text-sm mt-3" style={{ color: '#7a9aaa' }}>Vielen Dank!</p>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default Ehrenerklaerung;
