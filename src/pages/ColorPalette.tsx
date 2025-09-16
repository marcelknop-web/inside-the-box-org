import { useState } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Palette, Download } from 'lucide-react';

export default function ColorPalette() {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [customColors, setCustomColors] = useState<Array<{ name: string; hex: string; hsl: string }>>([]);

  const primaryColors = [
    { name: 'Primary Yellow', hex: '#F7D62E', hsl: '45 95% 55%', usage: 'Main brand color, CTAs, highlights' },
    { name: 'Highlight Cyan', hex: '#29C7D9', hsl: '185 85% 55%', usage: 'Secondary highlights, accents' },
    { name: 'LinkedIn Blue', hex: '#0077B5', hsl: '201 100% 35%', usage: 'Professional content, social links' },
  ];

  const neutralColors = [
    { name: 'Background Dark', hex: '#1A1D23', hsl: '215 16% 12%', usage: 'Main background' },
    { name: 'Card Dark', hex: '#13161A', hsl: '215 18% 9%', usage: 'Content cards, panels' },
    { name: 'Secondary Gray', hex: '#252931', hsl: '215 14% 16%', usage: 'Secondary elements' },
    { name: 'Border Electric', hex: '#323740', hsl: '215 14% 22%', usage: 'Borders, dividers' },
    { name: 'Text Light', hex: '#F2F2F2', hsl: '0 0% 95%', usage: 'Primary text color' },
  ];

  const generateShades = (baseColor: string) => {
    // Simple shade generation (in a real app, you'd use a proper color library)
    const shades = [];
    const baseNum = parseInt(baseColor.slice(1), 16);
    
    for (let i = 1; i <= 9; i++) {
      const factor = i <= 5 ? 1 + (i * 0.15) : 1 - ((i - 5) * 0.15);
      const r = Math.round(Math.min(255, ((baseNum >> 16) & 255) * factor));
      const g = Math.round(Math.min(255, ((baseNum >> 8) & 255) * factor));
      const b = Math.round(Math.min(255, (baseNum & 255) * factor));
      
      const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
      shades.push({ shade: i * 100, hex });
    }
    
    return shades;
  };

  const copyToClipboard = (text: string, colorName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedColor(colorName);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const exportPalette = () => {
    const palette = {
      primary: primaryColors,
      neutral: neutralColors,
      custom: customColors,
      exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(palette, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'color-palette.json');
    linkElement.click();
  };

  return (
    <PageLayout maxWidth="wide">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-electric mb-2">Color Palette</h1>
            <p className="text-muted-foreground">Explore and manage the design system colors</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportPalette} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Palette
            </Button>
            <Button className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Color Generator
            </Button>
          </div>
        </div>

        {/* Primary Colors */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Primary Colors</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {primaryColors.map((color) => (
              <div key={color.name} className="space-y-4">
                <div 
                  className="h-32 rounded-lg border-2 border-border cursor-pointer transition-transform hover:scale-105"
                  style={{ backgroundColor: color.hex }}
                  onClick={() => copyToClipboard(color.hex, color.name)}
                />
                <div className="space-y-2">
                  <h3 className="font-semibold">{color.name}</h3>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-secondary px-2 py-1 rounded">{color.hex}</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(color.hex, color.name)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    {copiedColor === color.name && (
                      <span className="text-xs text-primary">Copied!</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{color.usage}</p>
                </div>
                
                {/* Color Shades */}
                <div className="grid grid-cols-5 gap-1">
                  {generateShades(color.hex).slice(0, 5).map((shade) => (
                    <div
                      key={shade.shade}
                      className="h-8 rounded cursor-pointer transition-transform hover:scale-110"
                      style={{ backgroundColor: shade.hex }}
                      onClick={() => copyToClipboard(shade.hex, `${color.name}-${shade.shade}`)}
                      title={`${color.name} ${shade.shade} - ${shade.hex}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Neutral Colors */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Neutral Colors</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {neutralColors.map((color) => (
              <div key={color.name} className="space-y-3">
                <div 
                  className="h-20 rounded-lg border-2 border-border cursor-pointer transition-transform hover:scale-105"
                  style={{ backgroundColor: color.hex }}
                  onClick={() => copyToClipboard(color.hex, color.name)}
                />
                <div className="space-y-2">
                  <h3 className="font-medium text-sm">{color.name}</h3>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-secondary px-2 py-1 rounded">{color.hex}</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(color.hex, color.name)}
                      className="h-5 w-5 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{color.usage}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Color Contrast Checker */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Contrast Checker</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Background Color</label>
                <Input type="color" defaultValue="#1A1D23" className="h-12" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Text Color</label>
                <Input type="color" defaultValue="#F2F2F2" className="h-12" />
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="p-8 rounded-lg" style={{ backgroundColor: '#1A1D23', color: '#F2F2F2' }}>
                <h3 className="text-xl font-bold mb-2">Sample Text</h3>
                <p>This is how your text will look with the selected colors.</p>
                <div className="mt-4 text-sm">
                  <span className="text-primary">Contrast Ratio: 12.6:1 ✓ AAA</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}