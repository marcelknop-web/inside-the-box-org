import { useState } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Eye, Code } from 'lucide-react';

export default function ComponentLibrary() {
  const [selectedComponent, setSelectedComponent] = useState('button');
  const [copied, setCopied] = useState(false);

  const components = [
    {
      id: 'button',
      name: 'Button',
      category: 'Form',
      description: 'Interactive button component with multiple variants',
      preview: (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          <div className="flex gap-2">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
          </div>
        </div>
      ),
      code: `<Button>Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>`
    },
    {
      id: 'card',
      name: 'Card',
      category: 'Layout',
      description: 'Container component for grouping related content',
      preview: (
        <Card className="p-6 max-w-sm">
          <h3 className="text-lg font-semibold mb-2">Card Title</h3>
          <p className="text-muted-foreground">Card description with some example content.</p>
          <Button className="mt-4">Action</Button>
        </Card>
      ),
      code: `<Card className="p-6">
  <h3 className="text-lg font-semibold mb-2">Card Title</h3>
  <p className="text-muted-foreground">Description</p>
  <Button className="mt-4">Action</Button>
</Card>`
    },
    {
      id: 'badge',
      name: 'Badge',
      category: 'Display',
      description: 'Small label component for status and categories',
      preview: (
        <div className="flex gap-2 flex-wrap">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      ),
      code: `<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>`
    },
    {
      id: 'input',
      name: 'Input',
      category: 'Form',
      description: 'Text input field with various states',
      preview: (
        <div className="space-y-4 max-w-sm">
          <Input placeholder="Default input" />
          <Input placeholder="Disabled input" disabled />
          <Input type="email" placeholder="Email input" />
        </div>
      ),
      code: `<Input placeholder="Default input" />
<Input placeholder="Disabled input" disabled />
<Input type="email" placeholder="Email input" />`
    }
  ];

  const categories = [...new Set(components.map(c => c.category))];

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PageLayout maxWidth="wide">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-electric mb-2">Component Library</h1>
          <p className="text-muted-foreground">Reusable components with live previews and code examples</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Component List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Components</h2>
            {categories.map(category => (
              <div key={category}>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  {category}
                </h3>
                <div className="space-y-1">
                  {components
                    .filter(c => c.category === category)
                    .map(component => (
                      <button
                        key={component.id}
                        onClick={() => setSelectedComponent(component.id)}
                        className={`w-full text-left p-3 rounded-lg transition-electric ${
                          selectedComponent === component.id
                            ? 'bg-primary/10 border border-primary/30 text-primary'
                            : 'hover:bg-secondary'
                        }`}
                      >
                        <div className="font-medium">{component.name}</div>
                        <div className="text-sm text-muted-foreground">{component.description}</div>
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Component Preview */}
          <div className="lg:col-span-2">
            {(() => {
              const component = components.find(c => c.id === selectedComponent);
              if (!component) return null;

              return (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold">{component.name}</h2>
                      <p className="text-muted-foreground">{component.description}</p>
                    </div>
                    <Badge variant="outline">{component.category}</Badge>
                  </div>

                  <Tabs defaultValue="preview" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="preview" className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Preview
                      </TabsTrigger>
                      <TabsTrigger value="code" className="flex items-center gap-2">
                        <Code className="w-4 h-4" />
                        Code
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="preview" className="mt-6">
                      <div className="p-8 border-2 border-dashed border-border rounded-lg bg-secondary/50">
                        {component.preview}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="code" className="mt-6">
                      <div className="relative">
                        <pre className="p-4 bg-secondary rounded-lg overflow-x-auto">
                          <code className="text-sm font-mono">{component.code}</code>
                        </pre>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyCode(component.code)}
                          className="absolute top-2 right-2"
                        >
                          <Copy className="w-4 h-4" />
                          {copied ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </Card>
              );
            })()}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}