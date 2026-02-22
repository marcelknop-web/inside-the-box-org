import { PageLayout } from '@/components/PageLayout';
import { InfoCard } from '@/components/InfoCard';
import { PageNavButtons } from '@/components/PageNavButtons';
import { PageMeta } from '@/components/PageMeta';
import { AlertTriangle, Target, Users, Globe } from 'lucide-react';

const Index = () => {
  return (
    <PageLayout>
      <div className="space-y-8">
        <PageMeta title="Cyber Training Range" description="Realistic cyber attack simulations and crisis coordination training. 40+ trainings delivered, 350+ people trained across 6 countries." />
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-8">
          Cyber Training Range
        </h1>
        <p className="text-lg font-sans mb-12 text-foreground">
          Expect the unexpected.
        </p>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <InfoCard icon={AlertTriangle}>
            <p className="text-lg font-sans">
              Most response failures are not technical – they are organizational. When an incident hits, <span className="text-primary font-semibold">coordination breaks down before systems do</span>.
            </p>
          </InfoCard>
          
          <InfoCard icon={Target}>
            <p className="text-lg font-sans">
               Our <span className="text-primary font-semibold">simulation environments</span> train teams under realistic attack conditions, combining{" "}
               <span className="text-primary font-semibold">technical response with crisis decision-making</span> in a controlled setting.
            </p>
          </InfoCard>

          {/* Statistics Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg p-6 text-center">
              <Target className="text-highlight mx-auto mb-4" size={40} />
              <div className="text-3xl font-bold text-highlight font-mono mb-2">40+</div>
              <div className="text-foreground font-sans">Trainings Delivered</div>
            </div>
            <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg p-6 text-center">
              <Users className="text-highlight mx-auto mb-4" size={40} />
              <div className="text-3xl font-bold text-highlight font-mono mb-2">350+</div>
              <div className="text-foreground font-sans">People Trained</div>
            </div>
            <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg p-6 text-center">
              <Globe className="text-highlight mx-auto mb-4" size={40} />
              <div className="text-3xl font-bold text-highlight font-mono mb-2">6</div>
              <div className="text-foreground font-sans">Countries Covered</div>
            </div>
          </div>
          
          <PageNavButtons buttons={[
            { href: '/training', label: 'How?' },
            { href: '/contact', label: 'Contact', variant: 'highlight' },
          ]} />
        </div>
      </div>
    </PageLayout>
  );
};

export default Index;