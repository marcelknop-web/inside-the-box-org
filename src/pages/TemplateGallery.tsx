import { useState } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Search, Filter, Eye, Check } from 'lucide-react';

export default function TemplateGallery() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const templates = [
    {
      id: 'hero-section',
      name: 'Hero Section',
      category: 'landing',
      description: 'Modern hero section with gradient background and call-to-action',
      image: '/lovable-uploads/hero-template.jpg',
      tags: ['hero', 'landing', 'cta', 'gradient'],
      code: `<section className="relative py-20 bg-gradient-to-br from-background to-secondary">
  <div className="container mx-auto px-6 text-center">
    <h1 className="text-5xl font-bold text-electric mb-6">
      Your Heading Here
    </h1>
    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
      Compelling subtitle that explains your value proposition
    </p>
    <Button size="lg" className="mr-4">Get Started</Button>
    <Button size="lg" variant="outline">Learn More</Button>
  </div>
</section>`
    },
    {
      id: 'feature-grid',
      name: 'Feature Grid',
      category: 'content',
      description: 'Three-column feature grid with icons and descriptions',
      image: '/lovable-uploads/feature-grid-template.jpg',
      tags: ['features', 'grid', 'icons', 'content'],
      code: `<section className="py-16">
  <div className="container mx-auto px-6">
    <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {features.map((feature) => (
        <Card key={feature.id} className="p-6 text-center">
          <feature.icon className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
          <p className="text-muted-foreground">{feature.description}</p>
        </Card>
      ))}
    </div>
  </div>
</section>`
    },
    {
      id: 'pricing-table',
      name: 'Pricing Table',
      category: 'commercial',
      description: 'Responsive pricing table with highlight tier',
      image: '/lovable-uploads/pricing-template.jpg',
      tags: ['pricing', 'table', 'commercial', 'responsive'],
code: `<section className="py-16 bg-secondary/50">
  <div className="container mx-auto px-6">
    <h2 className="text-3xl font-bold text-center mb-12">Pricing Plans</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-2">Basic</h3>
        <div className="text-3xl font-bold text-primary mb-4">
          $9<span className="text-sm text-muted-foreground">/month</span>
        </div>
        <Button className="w-full">Choose Plan</Button>
      </Card>
    </div>
  </div>
</section>`
    },
    {
      id: 'contact-form',
      name: 'Contact Form',
      category: 'forms',
      description: 'Clean contact form with validation',
      image: '/lovable-uploads/contact-form-template.jpg',
      tags: ['contact', 'form', 'validation', 'clean'],
      code: `<Card className="max-w-md mx-auto p-6">
  <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
  <form className="space-y-4">
    <div>
      <Label htmlFor="name">Name</Label>
      <Input id="name" placeholder="Your name" />
    </div>
    <div>
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="your@email.com" />
    </div>
    <div>
      <Label htmlFor="message">Message</Label>
      <Textarea id="message" placeholder="Your message..." />
    </div>
    <Button type="submit" className="w-full">Send Message</Button>
  </form>
</Card>`
    },
    {
      id: 'dashboard-stats',
      name: 'Dashboard Stats',
      category: 'dashboard',
      description: 'Statistics cards for dashboard interfaces',
      image: '/lovable-uploads/dashboard-stats-template.jpg',
      tags: ['dashboard', 'stats', 'cards', 'metrics'],
      code: `<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
  {stats.map((stat) => (
    <Card key={stat.id} className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{stat.label}</p>
          <p className="text-2xl font-bold">{stat.value}</p>
        </div>
        <stat.icon className="w-8 h-8 text-primary" />
      </div>
      <div className="mt-2 flex items-center text-sm">
        <span className={stat.trend > 0 ? 'text-green-500' : 'text-red-500'}>
          {stat.trend > 0 ? '+' : ''}{stat.trend}%
        </span>
        <span className="text-muted-foreground ml-1">vs last month</span>
      </div>
    </Card>
  ))}
</div>`
    },
    {
      id: 'team-cards',
      name: 'Team Cards',
      category: 'content',
      description: 'Team member cards with social links',
      image: '/lovable-uploads/team-cards-template.jpg',
      tags: ['team', 'cards', 'social', 'profiles'],
      code: `<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
  {team.map((member) => (
    <Card key={member.id} className="p-6 text-center">
      <img 
        src={member.avatar} 
        alt={member.name}
        className="w-24 h-24 rounded-full mx-auto mb-4"
      />
      <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
      <p className="text-primary mb-2">{member.role}</p>
      <p className="text-muted-foreground text-sm mb-4">{member.bio}</p>
      <div className="flex justify-center space-x-3">
        {member.social.map((link) => (
          <a key={link.platform} href={link.url} className="text-muted-foreground hover:text-primary">
            <link.icon className="w-5 h-5" />
          </a>
        ))}
      </div>
    </Card>
  ))}
</div>`
    }
  ];

  const categories = [
    { id: 'all', name: 'All Templates', count: templates.length },
    { id: 'landing', name: 'Landing Pages', count: templates.filter(t => t.category === 'landing').length },
    { id: 'content', name: 'Content Sections', count: templates.filter(t => t.category === 'content').length },
    { id: 'forms', name: 'Forms', count: templates.filter(t => t.category === 'forms').length },
    { id: 'dashboard', name: 'Dashboard', count: templates.filter(t => t.category === 'dashboard').length },
    { id: 'commercial', name: 'Commercial', count: templates.filter(t => t.category === 'commercial').length },
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const copyCode = (code: string, templateName: string) => {
    navigator.clipboard.writeText(code);
    // You could add a toast notification here
  };

  return (
    <PageLayout maxWidth="wide">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-electric mb-2">Template Gallery</h1>
          <p className="text-muted-foreground">Ready-to-use components and sections for your projects</p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
            {categories.map(category => (
              <TabsTrigger key={category.id} value={category.id} className="text-xs">
                {category.name}
                <Badge variant="secondary" className="ml-1 text-xs">
                  {category.count}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <Card key={template.id} className="group overflow-hidden">
              <div className="aspect-video bg-secondary/50 p-4 flex items-center justify-center">
                <div className="text-center">
                  <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Preview</p>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold">{template.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {template.category}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  {template.description}
                </p>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {template.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {template.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{template.tags.length - 3}
                    </Badge>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => copyCode(template.code, template.name)}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Copy Code
                  </Button>
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No templates found matching your criteria.</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}