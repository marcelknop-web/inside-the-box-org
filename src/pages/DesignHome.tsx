import { PageLayout } from '@/components/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Palette, 
  Component, 
  FileText, 
  Coins, 
  Layout, 
  Zap,
  ArrowRight,
  Download,
  Eye,
  Settings
} from 'lucide-react';

export default function DesignHome() {
  const features = [
    {
      icon: Component,
      title: 'Component Library',
      description: 'Browse and copy ready-to-use React components with live previews',
      href: '/components',
      color: 'text-blue-500',
      stats: '24 Components'
    },
    {
      icon: Palette,
      title: 'Color Palette',
      description: 'Explore colors, generate shades, and check contrast ratios',
      href: '/colors',
      color: 'text-purple-500',
      stats: '8 Color Tokens'
    },
    {
      icon: FileText,
      title: 'Template Gallery',
      description: 'Ready-made sections and layouts for quick prototyping',
      href: '/templates',
      color: 'text-green-500',
      stats: '12 Templates'
    },
    {
      icon: Coins,
      title: 'Design Tokens',
      description: 'Centralized design values for consistent styling across projects',
      href: '/tokens',
      color: 'text-orange-500',
      stats: '40+ Tokens'
    },
    {
      icon: Layout,
      title: 'Design Specs',
      description: 'Complete design specifications and downloadable assets',
      href: '/design-system',
      color: 'text-cyan-500',
      stats: 'Full Specs'
    }
  ];

  const quickActions = [
    { icon: Download, label: 'Export All Tokens', action: 'export-tokens' },
    { icon: Eye, label: 'Preview Components', action: 'preview' },
    { icon: Settings, label: 'Customize Theme', action: 'customize' },
  ];

  return (
    <PageLayout maxWidth="wide">
      <div className="space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-2xl">
              <Zap className="w-12 h-12 text-primary" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-electric mb-4">
            Design System Studio
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A complete design system toolkit with components, tokens, templates, and tools 
            for building consistent, beautiful interfaces.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            {quickActions.map((action, index) => (
              <Button key={index} variant="outline" className="flex items-center gap-2">
                <action.icon className="w-4 h-4" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">24</div>
            <div className="text-sm text-muted-foreground">Components</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">40+</div>
            <div className="text-sm text-muted-foreground">Design Tokens</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">12</div>
            <div className="text-sm text-muted-foreground">Templates</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">100%</div>
            <div className="text-sm text-muted-foreground">Type Safe</div>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="group p-6 hover:shadow-glow transition-all duration-300 cursor-pointer">
              <a href={feature.href} className="block">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 bg-secondary rounded-lg ${feature.color}`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {feature.stats}
                  </Badge>
                </div>
                
                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-electric">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground text-sm mb-4">
                  {feature.description}
                </p>
                
                <div className="flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                  Explore
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            </Card>
          ))}
        </div>

        {/* Getting Started */}
        <Card className="p-8 bg-gradient-to-br from-primary/5 to-electric/5 border-primary/20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Getting Started</h2>
              <p className="text-muted-foreground mb-6">
                Start building with our design system in minutes. Copy components, 
                export tokens, and create beautiful interfaces faster than ever.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-primary text-black rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <span>Browse the component library</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-primary text-black rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <span>Copy code snippets to your project</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-primary text-black rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <span>Customize using design tokens</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <Button size="lg" className="w-full">
                <Component className="w-5 h-5 mr-2" />
                Browse Components
              </Button>
              <Button size="lg" variant="outline" className="w-full">
                <Download className="w-5 h-5 mr-2" />
                Download Design Kit
              </Button>
            </div>
          </div>
        </Card>

        {/* Recent Updates */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Recent Updates</h2>
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">New Dashboard Templates</h3>
                  <p className="text-sm text-muted-foreground">Added 3 new dashboard layouts with charts and metrics</p>
                </div>
                <Badge variant="secondary">New</Badge>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Enhanced Color Palette</h3>
                  <p className="text-sm text-muted-foreground">Improved contrast checker and shade generation</p>
                </div>
                <Badge variant="outline">Updated</Badge>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Design Token Export</h3>
                  <p className="text-sm text-muted-foreground">Export tokens as JSON, CSS variables, or Figma tokens</p>
                </div>
                <Badge variant="outline">Improved</Badge>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}