import { useState } from 'react';
import { Presentation } from '../components/Presentation';
import { PageLayout } from '../components/PageLayout';
import { Button } from '../components/ui/button';
import { Download, Eye, Palette } from 'lucide-react';

// Sample slide templates
const sampleSlides = [
  {
    id: 1,
    type: 'title' as const,
    title: 'Cybersecurity Presentation',
    content: ['Professional template for your presentations', 'inside-the-box.org']
  },
  {
    id: 2,
    type: 'section' as const,
    title: 'Agenda',
    content: ['Overview of today\'s topics']
  },
  {
    id: 3,
    type: 'content' as const,
    title: 'Key Security Principles',
    content: [
      'Confidentiality - Protecting sensitive information',
      'Integrity - Ensuring data accuracy and completeness',
      'Availability - Maintaining system accessibility',
      'Authentication - Verifying user identities'
    ]
  },
  {
    id: 4,
    type: 'content' as const,
    title: 'Training Benefits',
    content: [
      'Enhanced security awareness',
      'Practical hands-on experience',
      'Industry-recognized certifications',
      'Expert-led instruction'
    ]
  },
  {
    id: 5,
    type: 'content' as const,
    title: 'Contact & Next Steps',
    content: ['Thank you for your attention', 'inside-the-box.org', 'Ready for questions']
  }
];

export const PresentationTemplate = () => {
  const [showPresentation, setShowPresentation] = useState(false);

  const downloadAssets = () => {
    // Create a simple text file with design specifications
    const designSpecs = `
INSIDE-THE-BOX.ORG PRESENTATION DESIGN GUIDE
==========================================

COLORS (HSL VALUES):
- Primary: hsl(200 100% 70%)
- Highlight: hsl(120 100% 70%) 
- Background: hsl(240 10% 8%)
- Foreground: hsl(0 0% 95%)

FONTS:
- Primary: JetBrains Mono (monospace)
- Fallback: ui-monospace, SFMono-Regular

GRADIENTS:
- Primary: linear-gradient(135deg, hsl(200 100% 70%), hsl(280 100% 70%))
- Background: radial-gradient(circle at 50% 50%, hsl(240 100% 5%) 0%, hsl(240 10% 8%) 100%)

ANIMATIONS:
- Glow effect on titles
- Subtle pulse on icons
- Electric transitions (0.3s cubic-bezier)

LAYOUT PRINCIPLES:
- Generous whitespace
- Geometric accent elements
- Monospace typography
- Dark theme with neon accents
- Electronic/cyber aesthetic
`;

    const blob = new Blob([designSpecs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inside-the-box-presentation-guide.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (showPresentation) {
    return (
      <Presentation 
        slides={sampleSlides} 
        onExit={() => setShowPresentation(false)} 
      />
    );
  }

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-mono text-primary mb-6 animate-glow">
            Presentation Template
          </h1>
          <p className="text-xl text-foreground/80 font-mono">
            Professional presentation template matching your brand identity
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="card-electric p-8">
            <div className="flex items-center space-x-4 mb-6">
              <Eye className="text-highlight" size={32} />
              <h2 className="text-2xl font-mono text-primary">Preview Template</h2>
            </div>
            <p className="text-foreground/80 mb-6 font-mono">
              See the presentation template in action with sample cybersecurity content.
            </p>
            <Button 
              onClick={() => setShowPresentation(true)}
              className="w-full text-lg py-6"
            >
              Launch Presentation
            </Button>
          </div>

          <div className="card-electric p-8">
            <div className="flex items-center space-x-4 mb-6">
              <Download className="text-highlight" size={32} />
              <h2 className="text-2xl font-mono text-primary">Design Guide</h2>
            </div>
            <p className="text-foreground/80 mb-6 font-mono">
              Download the complete design specifications for creating your own slides.
            </p>
            <Button 
              onClick={downloadAssets}
              variant="outline"
              className="w-full text-lg py-6"
            >
              Download Guide
            </Button>
          </div>
        </div>

        <div className="card-electric p-8 mb-16">
          <div className="flex items-center space-x-4 mb-6">
            <Palette className="text-highlight" size={32} />
            <h2 className="text-2xl font-mono text-primary">Design System</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-mono text-highlight mb-4">Color Palette</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-primary rounded border-2 border-primary/30"></div>
                  <span className="font-mono text-foreground/80">Primary Blue</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-highlight rounded border-2 border-highlight/30"></div>
                  <span className="font-mono text-foreground/80">Highlight Green</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-background border-2 border-foreground/20 rounded"></div>
                  <span className="font-mono text-foreground/80">Dark Background</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-mono text-highlight mb-4">Typography</h3>
              <div className="space-y-3">
                <div className="font-mono text-2xl text-primary">Heading Style</div>
                <div className="font-mono text-lg text-foreground/80">Body Text Style</div>
                <div className="font-mono text-sm text-foreground/60">Caption Style</div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-mono text-primary mb-4">Features Included</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-lg border-2 border-primary/30 mx-auto mb-3 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary rotate-45"></div>
              </div>
              <p className="font-mono text-foreground/80">Responsive Design</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-lg border-2 border-primary/30 mx-auto mb-3 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-highlight rotate-45 animate-pulse"></div>
              </div>
              <p className="font-mono text-foreground/80">Animated Elements</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-lg border-2 border-primary/30 mx-auto mb-3 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary rounded"></div>
              </div>
              <p className="font-mono text-foreground/80">Brand Consistent</p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};