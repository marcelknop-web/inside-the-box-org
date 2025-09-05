import { PageLayout } from '@/components/PageLayout';
import { DesignSpecs } from '@/components/DesignSpecs';
import { BrandAssets } from '@/components/BrandAssets';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DesignSystem = () => {
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