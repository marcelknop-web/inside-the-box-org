import { PageLayout } from '@/components/PageLayout';
import { DesignSpecs } from '@/components/DesignSpecs';
import { BrandAssets } from '@/components/BrandAssets';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const DesignSystem = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'brain99') {
      setIsAuthenticated(true);
    } else {
      alert('Incorrect password');
    }
  };

  if (!isAuthenticated) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">Protected Area</h1>
              <p className="text-muted-foreground mt-2">Enter password to access design system</p>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
              />
              <Button type="submit" className="w-full">
                Access Design System
              </Button>
            </form>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout maxWidth="wide">
      <Tabs defaultValue="specs" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="specs">Design Specifications</TabsTrigger>
          <TabsTrigger value="assets">Brand Assets</TabsTrigger>
        </TabsList>
        
        <TabsContent value="specs">
          <DesignSpecs />
        </TabsContent>
        
        <TabsContent value="assets">
          <BrandAssets />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default DesignSystem;