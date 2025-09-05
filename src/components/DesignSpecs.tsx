import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, Download } from 'lucide-react';
import { useState } from 'react';

export const DesignSpecs = () => {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const copyToClipboard = (text: string, colorName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedColor(colorName);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const colors = [
    { name: 'Primary Yellow', hsl: '45 95% 55%', hex: '#F7D62E', usage: 'Main brand color, CTAs, highlights' },
    { name: 'Background Dark', hsl: '215 16% 12%', hex: '#1A1D23', usage: 'Main background, slides' },
    { name: 'Card Dark', hsl: '215 18% 9%', hex: '#13161A', usage: 'Content cards, panels' },
    { name: 'Text Light', hsl: '0 0% 95%', hex: '#F2F2F2', usage: 'Primary text color' },
    { name: 'Highlight Cyan', hsl: '185 85% 55%', hex: '#29C7D9', usage: 'Secondary highlights, accents' },
    { name: 'LinkedIn Blue', hsl: '201 100% 35%', hex: '#0077B5', usage: 'Social media, professional content' },
    { name: 'Border Electric', hsl: '215 14% 22%', hex: '#323740', usage: 'Borders, dividers' },
    { name: 'Secondary Gray', hsl: '215 14% 16%', hex: '#252931', usage: 'Secondary elements' },
  ];

  const typography = [
    { name: 'Primary Font', value: 'Inter', usage: 'Headings, body text, UI elements' },
    { name: 'Monospace Font', value: 'JetBrains Mono', usage: 'Code, technical content' },
  ];

  const spacing = [
    { name: 'Small', value: '0.25rem (4px)', usage: 'Fine details, tight spacing' },
    { name: 'Medium', value: '1rem (16px)', usage: 'Standard spacing, paragraphs' },
    { name: 'Large', value: '2rem (32px)', usage: 'Section spacing, headers' },
    { name: 'Extra Large', value: '3rem (48px)', usage: 'Major sections, page margins' },
  ];

  const downloadSpecs = () => {
    const specs = {
      brand: 'Berlin Electronic Design System',
      colors: colors.map(c => ({ name: c.name, hsl: c.hsl, hex: c.hex, usage: c.usage })),
      typography,
      spacing,
      gradients: [
        { name: 'Primary Gradient', value: 'linear-gradient(135deg, #F7D62E, #F9DA3A)' },
        { name: 'Dark Gradient', value: 'linear-gradient(180deg, #1F2329, #13161A)' },
      ],
      shadows: [
        { name: 'Electric Glow', value: '0 0 20px rgba(247, 214, 46, 0.25)' },
        { name: 'Card Shadow', value: '0 4px 20px rgba(19, 22, 26, 0.5)' },
      ]
    };
    
    const dataStr = JSON.stringify(specs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'berlin-electronic-design-specs.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-electric mb-2">Berlin Electronic Design System</h1>
          <p className="text-muted-foreground">Complete design specifications for PowerPoint presentations</p>
        </div>
        <Button onClick={downloadSpecs} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Download Specs JSON
        </Button>
      </div>

      {/* Colors */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Color Palette</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {colors.map((color) => (
            <div key={color.name} className="space-y-3">
              <div 
                className="h-20 rounded-lg border-2 border-border"
                style={{ backgroundColor: color.hex }}
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
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded">HSL: {color.hsl}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(`hsl(${color.hsl})`, `${color.name}-hsl`)}
                    className="h-6 w-6 p-0"
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

      {/* Typography */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Typography</h2>
        <div className="space-y-6">
          {typography.map((font) => (
            <div key={font.name} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
              <div>
                <h3 className="font-semibold mb-1">{font.name}</h3>
                <p className="text-sm text-muted-foreground">{font.usage}</p>
              </div>
              <div className="flex items-center gap-2">
                <code className="bg-muted px-3 py-1 rounded">{font.value}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(font.value, font.name)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Spacing */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Spacing System</h2>
        <div className="space-y-4">
          {spacing.map((space) => (
            <div key={space.name} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
              <div>
                <h3 className="font-semibold mb-1">{space.name}</h3>
                <p className="text-sm text-muted-foreground">{space.usage}</p>
              </div>
              <div className="flex items-center gap-2">
                <code className="bg-muted px-3 py-1 rounded">{space.value}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(space.value, space.name)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Layout Guidelines */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Layout Guidelines</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">PowerPoint Slide Dimensions</h3>
            <ul className="space-y-2 text-sm">
              <li><strong>Standard:</strong> 10" × 7.5" (4:3 ratio)</li>
              <li><strong>Widescreen:</strong> 13.33" × 7.5" (16:9 ratio)</li>
              <li><strong>Custom:</strong> 16" × 9" (16:9 ratio)</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Margins & Safe Areas</h3>
            <ul className="space-y-2 text-sm">
              <li><strong>Outer margin:</strong> 0.5" from edges</li>
              <li><strong>Content padding:</strong> 1" from slide edges</li>
              <li><strong>Text safe area:</strong> 1.5" from all edges</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};