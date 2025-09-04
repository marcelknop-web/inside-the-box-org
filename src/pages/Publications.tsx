import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { InfoCard } from '@/components/InfoCard';
import { LinkButton } from '@/components/LinkButton';
import { Shield, Radio, Video, Award, FileText, Presentation, GraduationCap, BookOpen } from 'lucide-react';

const Publications = () => {
  return (
    <PageLayout>
      <div className="space-y-8">
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">
          Publications, Trainings
        </h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8">
            Industry publications, thought leadership content, and specialized training programs.
          </p>
          
          <div className="space-y-6">
            <ServiceCard
              icon={Shield}
              title="Cyber Training Ranges, iX 10/2021"
              description="Article about Cyber Training Ranges for conducting cyber crisis exercises (German)."
            >
              <div className="mt-4">
                <a href="https://www.heise.de/select/ix/2021/10/2019809530193925811" target="_blank" rel="noopener noreferrer" className="text-highlight hover:text-primary transition-electric text-base underline">
                  Read on heise.de
                </a>
              </div>
            </ServiceCard>
            
            <ServiceCard
              icon={Radio}
              title="Management of Cyber Crises, iX 07/2015"
              description="Article on management of crisis, and specifically on cyber crisis (German)."
              variant="highlight"
            >
              <div className="mt-4">
                <a href="https://www.heise.de/select/ix/archiv/2015/7/seite-78" target="_blank" rel="noopener noreferrer" className="text-highlight hover:text-primary transition-electric text-base underline">
                  Read on heise.de
                </a>
              </div>
            </ServiceCard>
            
            <ServiceCard
              icon={Video}
              title="DENIC Annual Meeting Keynote"
              description="Distinctive elements and obstacles in the management of cyber crises (German)."
            >
              <div className="mt-4">
                <a href="https://vimeo.com/295582173" target="_blank" rel="noopener noreferrer" className="text-highlight hover:text-primary transition-electric text-base underline">
                  Watch on Vimeo
                </a>
              </div>
            </ServiceCard>
            
            <InfoCard variant="subtle">
              <h2 className="text-primary text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-4">Training & Certification</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base sm:text-lg text-foreground/80">
                <div className="flex items-start space-x-3">
                  <Award className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">ISACA Programs</h3>
                    <p>Cybersecurity expert training and certification programs.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <FileText className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Industry Content</h3>
                    <p>Published articles and thought leadership in cybersecurity publications.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Presentation className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Conference Presentations</h3>
                    <p>Keynote speeches and presentations at industry conferences.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <BookOpen className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Educational Resources</h3>
                    <p>Training materials and educational content for cybersecurity professionals.</p>
                  </div>
                </div>
              </div>
            </InfoCard>
          </div>
          
          <div className="pt-8">
            {/* Mobile Layout */}
            <div className="flex flex-col space-y-4 md:hidden">
              <LinkButton href="/consulting">All Consulting Services</LinkButton>
              <LinkButton href="/consulting/team">By Whom</LinkButton>
              <LinkButton href="/contact" variant="highlight">Contact</LinkButton>
            </div>
            
            {/* Desktop Layout */}
            <div className="hidden md:flex justify-between space-x-4">
              <LinkButton href="/consulting">All Consulting Services</LinkButton>
              <LinkButton href="/consulting/team">By Whom</LinkButton>
              <LinkButton href="/contact" variant="highlight">Contact</LinkButton>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Publications;