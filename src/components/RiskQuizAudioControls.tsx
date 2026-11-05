import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface Props {
  muted: boolean;
  volume: number;
  onMute: () => void;
  onVolume: (value: number) => void;
}

export function RiskQuizAudioControls({ muted, volume, onMute, onVolume }: Props) {
  return <div className="flex items-center justify-end gap-3 mb-3" role="group" aria-label="Quiz-Sound">
    <Button variant="ghost" size="icon" onClick={onMute} aria-pressed={!muted}
      aria-label={muted ? 'Ton einschalten' : 'Ton ausschalten'} title={muted ? 'Ton einschalten' : 'Ton ausschalten'}
      className={muted ? 'text-muted-foreground' : 'text-primary'}>
      {muted ? <VolumeX className="h-5 w-5"/> : <Volume2 className="h-5 w-5"/>}
    </Button>
    <Slider className="w-24" value={[volume]} min={0} max={100} step={5}
      aria-label="Lautstärke" onValueChange={values => { const value = values[0]; if (value !== undefined) onVolume(value); }}/>
  </div>;
}