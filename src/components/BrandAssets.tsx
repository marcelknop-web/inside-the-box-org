import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Image } from 'lucide-react';
import backgroundImage from '@/assets/powerpoint-background-1.jpg';
import logoTemplate from '@/assets/logo-template.jpg';
import titleSlideTemplate from '@/assets/title-slide-template.jpg';
import contentSlideTemplate from '@/assets/content-slide-template.jpg';

export const BrandAssets = () => {
  const assets = [
    {
      name: 'PowerPoint Background',
      description: 'Dark industrial background with electric yellow accents and millimeter grid',
      image: backgroundImage,
      dimensions: '1920×1080px (16:9)',
      usage: 'Use as slide background in PowerPoint'
    },
    {
      name: 'Logo Template',
      description: 'Geometric logo design with Berlin Electronic aesthetic',
      image: logoTemplate,
      dimensions: '1024×1024px',
      usage: 'Customize for your brand logo'
    },
    {
      name: 'Title Slide Template',
      description: 'Professional title slide layout with designated areas for text',
      image: titleSlideTemplate,
      dimensions: '1920×1080px (16:9)',
      usage: 'Opening slide for presentations'
    },
    {
      name: 'Content Slide Template',
      description: 'Content layout with sections for bullet points and visuals',
      image: contentSlideTemplate,
      dimensions: '1920×1080px (16:9)',
      usage: 'Standard content slides'
    }
  ];

  const downloadAsset = (assetUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = assetUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllAssets = () => {
    assets.forEach((asset, index) => {
      setTimeout(() => {
        downloadAsset(asset.image, `${asset.name.toLowerCase().replace(/ /g, '-')}.jpg`);
      }, index * 500);
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-electric mb-2">Brand Assets</h1>
          <p className="text-muted-foreground">Downloadable graphics for PowerPoint presentations</p>
        </div>
        <Button onClick={downloadAllAssets} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Download All Assets
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assets.map((asset) => (
          <Card key={asset.name} className="overflow-hidden">
            <div className="aspect-video bg-secondary relative group">
              <img 
                src={asset.image} 
                alt={asset.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  onClick={() => downloadAsset(asset.image, `${asset.name.toLowerCase().replace(/ /g, '-')}.jpg`)}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">{asset.name}</h3>
              <p className="text-muted-foreground text-sm mb-3">{asset.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="bg-secondary px-2 py-1 rounded">{asset.dimensions}</span>
                <span className="text-muted-foreground">{asset.usage}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Usage Instructions */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Image className="w-6 h-6" />
          PowerPoint Usage Instructions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Setting Up Backgrounds</h3>
            <ol className="space-y-2 text-sm list-decimal list-inside">
              <li>Right-click on slide → "Format Background"</li>
              <li>Select "Picture or texture fill"</li>
              <li>Click "File..." and select downloaded background</li>
              <li>Apply to all slides or current slide</li>
            </ol>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Using Templates</h3>
            <ol className="space-y-2 text-sm list-decimal list-inside">
              <li>Insert template image as background</li>
              <li>Add text boxes over designated areas</li>
              <li>Use the color palette for consistent styling</li>
              <li>Apply Inter font family for text elements</li>
            </ol>
          </div>
        </div>
      </Card>

      {/* Color Reference */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Quick Color Reference</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {[
            { name: 'Primary Yellow', hex: '#F7D62E' },
            { name: 'Background', hex: '#1A1D23' },
            { name: 'Text Light', hex: '#F2F2F2' },
            { name: 'Highlight Cyan', hex: '#29C7D9' },
            { name: 'LinkedIn Blue', hex: '#0077B5' },
            { name: 'Border', hex: '#323740' },
            { name: 'Secondary', hex: '#252931' },
            { name: 'Card Dark', hex: '#13161A' },
          ].map((color) => (
            <div key={color.name} className="text-center">
              <div 
                className="h-12 w-full rounded-md border-2 border-border mb-2"
                style={{ backgroundColor: color.hex }}
              />
              <p className="text-xs font-medium">{color.name}</p>
              <code className="text-xs text-muted-foreground">{color.hex}</code>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};