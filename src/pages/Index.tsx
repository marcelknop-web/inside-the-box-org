import { PageLayout } from '@/components/PageLayout';
import { InfoCard } from '@/components/InfoCard';
import { LinkButton } from '@/components/LinkButton';
import { AlertTriangle, Target, Shield, Users, Globe } from 'lucide-react';

const Index = () => {
  return (
    <PageLayout>
      <div className="space-y-8">
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-8">
          Cyber Training Range
        </h1>
        <h2 className="text-highlight text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-12">
          Why?
        </h2>

        {/* Statistics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-cyan-500/10 border-2 border-cyan-500/30 rounded-lg p-6 text-center">
            <Target className="text-cyan-400 mx-auto mb-4" size={40} />
            <div className="text-3xl font-bold text-cyan-400 font-mono mb-2">40+</div>
            <div className="text-foreground/80 font-sans">Trainings Conducted</div>
          </div>
          <div className="bg-cyan-500/10 border-2 border-cyan-500/30 rounded-lg p-6 text-center">
            <Users className="text-cyan-400 mx-auto mb-4" size={40} />
            <div className="text-3xl font-bold text-cyan-400 font-mono mb-2">150+</div>
            <div className="text-foreground/80 font-sans">Participants</div>
          </div>
          <div className="bg-cyan-500/10 border-2 border-cyan-500/30 rounded-lg p-6 text-center">
            <Globe className="text-cyan-400 mx-auto mb-4" size={40} />
            <div className="text-3xl font-bold text-cyan-400 font-mono mb-2">4</div>
            <div className="text-foreground/80 font-sans">Countries</div>
          </div>
        </div>
        
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