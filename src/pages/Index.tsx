import { PageLayout } from '@/components/PageLayout';
import { InfoCard } from '@/components/InfoCard';
import { LinkButton } from '@/components/LinkButton';
import { AlertTriangle, Target, Shield } from 'lucide-react';

const Index = () => {
  return (
    <PageLayout>
      <div className="space-y-8">
        <h1 className="text-primary text-3xl sm:text-4xl lg:text-6xl font-bold font-mono mb-8">
          Cyber Training Range
        </h1>
        <h2 className="text-highlight text-2xl sm:text-3xl lg:text-4xl font-bold font-mono mb-12">
          Why?
        </h2>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <InfoCard icon={AlertTriangle}>
            <p className="text-lg font-sans">
              Cyber incidents reveal that <span className="text-primary font-semibold">human factors cause most response delays</span>. 
              Organizations face coordination challenges during critical security events.
            </p>
          </InfoCard>
          
          <InfoCard icon={Target}>
            <p className="text-lg font-sans">
               Our <span className="text-primary font-semibold">simulation environments</span> enable teams to develop competencies through{" "}
               <span className="text-primary font-semibold">realistic attack scenarios</span> and practical crisis coordination.
            </p>
          </InfoCard>
          
          <InfoCard icon={Shield}>
            <p className="text-lg font-sans">
              Training integrates <span className="text-primary font-semibold">technical capabilities with crisis management</span>.
            </p>
          </InfoCard>
          
          <div className="pt-8">
            <div className="flex justify-between space-x-4">
              <LinkButton href="/training">How?</LinkButton>
              <LinkButton href="/contact" variant="highlight">Contact</LinkButton>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Index;