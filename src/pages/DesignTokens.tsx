import { useState } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Download, Upload, Settings } from 'lucide-react';

export default function DesignTokens() {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const colorTokens = [
    { name: 'primary', value: '45 95% 55%', css: 'hsl(45 95% 55%)', usage: 'Main brand color' },
    { name: 'primary-foreground', value: '0 0% 0%', css: 'hsl(0 0% 0%)', usage: 'Text on primary background' },
    { name: 'secondary', value: '215 14% 16%', css: 'hsl(215 14% 16%)', usage: 'Secondary elements' },
    { name: 'background', value: '215 16% 12%', css: 'hsl(215 16% 12%)', usage: 'Page background' },
    { name: 'foreground', value: '0 0% 95%', css: 'hsl(0 0% 95%)', usage: 'Primary text' },
    { name: 'muted', value: '215 18% 9%', css: 'hsl(215 18% 9%)', usage: 'Muted backgrounds' },
    { name: 'border', value: '215 14% 22%', css: 'hsl(215 14% 22%)', usage: 'Borders and dividers' },
    { name: 'electric', value: '185 85% 55%', css: 'hsl(185 85% 55%)', usage: 'Highlight color' },
  ];

  const spacingTokens = [
    { name: 'xs', value: '0.25rem', pixels: '4px', usage: 'Very tight spacing' },
    { name: 'sm', value: '0.5rem', pixels: '8px', usage: 'Small spacing' },
    { name: 'md', value: '1rem', pixels: '16px', usage: 'Default spacing' },
    { name: 'lg', value: '1.5rem', pixels: '24px', usage: 'Large spacing' },
    { name: 'xl', value: '2rem', pixels: '32px', usage: 'Extra large spacing' },
    { name: '2xl', value: '3rem', pixels: '48px', usage: 'Section spacing' },
    { name: '3xl', value: '4rem', pixels: '64px', usage: 'Page spacing' },
  ];

  const typographyTokens = [
    { name: 'font-family-sans', value: 'Inter, system-ui, sans-serif', usage: 'Primary font family' },
    { name: 'font-family-mono', value: 'JetBrains Mono, monospace', usage: 'Monospace font family' },
    { name: 'font-size-xs', value: '0.75rem', pixels: '12px', usage: 'Extra small text' },
    { name: 'font-size-sm', value: '0.875rem', pixels: '14px', usage: 'Small text' },
    { name: 'font-size-base', value: '1rem', pixels: '16px', usage: 'Base text size' },
    { name: 'font-size-lg', value: '1.125rem', pixels: '18px', usage: 'Large text' },
    { name: 'font-size-xl', value: '1.25rem', pixels: '20px', usage: 'Extra large text' },
    { name: 'font-size-2xl', value: '1.5rem', pixels: '24px', usage: 'Heading text' },
    { name: 'font-size-3xl', value: '1.875rem', pixels: '30px', usage: 'Large heading' },
    { name: 'font-size-4xl', value: '2.25rem', pixels: '36px', usage: 'Extra large heading' },
  ];

  const shadowTokens = [
    { name: 'shadow-sm', value: '0 1px 2px 0 rgb(0 0 0 / 0.05)', usage: 'Small shadow' },
    { name: 'shadow-md', value: '0 4px 6px -1px rgb(0 0 0 / 0.1)', usage: 'Medium shadow' },
    { name: 'shadow-lg', value: '0 10px 15px -3px rgb(0 0 0 / 0.1)', usage: 'Large shadow' },
    { name: 'shadow-glow', value: '0 0 20px rgba(247, 214, 46, 0.25)', usage: 'Electric glow effect' },
  ];

  const borderRadiusTokens = [
    { name: 'radius-sm', value: '0.25rem', pixels: '4px', usage: 'Small radius' },
    { name: 'radius-md', value: '0.375rem', pixels: '6px', usage: 'Default radius' },
    { name: 'radius-lg', value: '0.5rem', pixels: '8px', usage: 'Large radius' },
    { name: 'radius-xl', value: '0.75rem', pixels: '12px', usage: 'Extra large radius' },
    { name: 'radius-full', value: '9999px', pixels: '9999px', usage: 'Fully rounded' },
  ];

  const copyToken = (value: string, tokenName: string) => {
    const cssVar = `var(--${tokenName})`;
    navigator.clipboard.writeText(cssVar);
    setCopiedToken(tokenName);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const exportTokens = () => {
    const tokens = {
      colors: colorTokens.reduce((acc, token) => ({ ...acc, [token.name]: token.value }), {}),
      spacing: spacingTokens.reduce((acc, token) => ({ ...acc, [token.name]: token.value }), {}),
      typography: typographyTokens.reduce((acc, token) => ({ ...acc, [token.name]: token.value }), {}),
      shadows: shadowTokens.reduce((acc, token) => ({ ...acc, [token.name]: token.value }), {}),
      borderRadius: borderRadiusTokens.reduce((acc, token) => ({ ...acc, [token.name]: token.value }), {}),
    };

    const dataStr = JSON.stringify(tokens, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'design-tokens.json');
    linkElement.click();
  };

  const TokenCard = ({ tokens, title, type }: { tokens: any[], title: string, type: string }) => (
    <Card className="p-6">
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      <div className="space-y-3">
        {tokens.map((token) => (
          <div key={token.name} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <code className="text-sm font-mono bg-muted px-2 py-1 rounded">--{token.name}</code>
                {type === 'colors' && (
                  <div 
                    className="w-6 h-6 rounded border-2 border-border"
                    style={{ backgroundColor: token.css }}
                  />
                )}
                {type === 'spacing' && (
                  <div className="flex items-center gap-1">
                    <div 
                      className="bg-primary h-3 rounded"
                      style={{ width: token.value }}
                    />
                    <span className="text-xs text-muted-foreground">({token.pixels})</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <code className="text-xs text-muted-foreground">{token.value}</code>
                <span className="text-xs text-muted-foreground">{token.usage}</span>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToken(token.value, token.name)}
              className="ml-2"
            >
              <Copy className="w-4 h-4" />
              {copiedToken === token.name && <span className="ml-1 text-xs">Copied!</span>}
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );

  return (
    <PageLayout maxWidth="wide">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-electric mb-2">Design Tokens</h1>
            <p className="text-muted-foreground">Centralized design values for consistent styling</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Import
            </Button>
            <Button onClick={exportTokens} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Tokens
            </Button>
          </div>
        </div>

        {/* Usage Instructions */}
        <Card className="p-6 bg-primary/5 border-primary/20">
          <h2 className="text-lg font-semibold mb-3 text-primary">How to Use Design Tokens</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-medium mb-2">In CSS:</h3>
              <code className="block bg-muted p-3 rounded">
                .my-element {'{'}
                <br />
                &nbsp;&nbsp;color: hsl(var(--primary));
                <br />
                &nbsp;&nbsp;margin: var(--spacing-md);
                <br />
                {'}'}
              </code>
            </div>
            <div>
              <h3 className="font-medium mb-2">In Tailwind:</h3>
              <code className="block bg-muted p-3 rounded">
                &lt;div className="text-primary p-md"&gt;
                <br />
                &nbsp;&nbsp;Content here
                <br />
                &lt;/div&gt;
              </code>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="spacing">Spacing</TabsTrigger>
            <TabsTrigger value="typography">Typography</TabsTrigger>
            <TabsTrigger value="shadows">Shadows</TabsTrigger>
            <TabsTrigger value="borders">Borders</TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="mt-6">
            <TokenCard tokens={colorTokens} title="Color Tokens" type="colors" />
          </TabsContent>

          <TabsContent value="spacing" className="mt-6">
            <TokenCard tokens={spacingTokens} title="Spacing Tokens" type="spacing" />
          </TabsContent>

          <TabsContent value="typography" className="mt-6">
            <TokenCard tokens={typographyTokens} title="Typography Tokens" type="typography" />
          </TabsContent>

          <TabsContent value="shadows" className="mt-6">
            <TokenCard tokens={shadowTokens} title="Shadow Tokens" type="shadows" />
          </TabsContent>

          <TabsContent value="borders" className="mt-6">
            <TokenCard tokens={borderRadiusTokens} title="Border Radius Tokens" type="borders" />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}