import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { InfoCard } from '@/components/InfoCard';
import { PageNavButtons } from '@/components/PageNavButtons';
import { Shield, Radio, Video, Award, FileText, Presentation, GraduationCap, BookOpen } from 'lucide-react';

const Publications = () => {
  return (
    <PageLayout>
      <div className="space-y-8">
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">
          Publications & Training
        </h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8">
            Selected publications, keynotes, and certification programs for cybersecurity professionals and decision-makers.
          </p>
          
          <div className="space-y-6">
            <ServiceCard
              icon={Shield}
              title="Cyber Training Ranges — iX 10/2021"
              description="Practical guidance on designing and conducting cyber crisis exercises using training range environments."
            >
              <div className="mt-4">
                <a href="https://www.heise.de/select/ix/2021/10/2019809530193925811" target="_blank" rel="noopener noreferrer" className="text-highlight hover:text-primary transition-electric text-base underline">
                  Read on heise.de
                </a>
              </div>
            </ServiceCard>
            
            <ServiceCard
              icon={Radio}
              title="Management of Cyber Crises — iX 07/2015"
              description="Structured approach to cyber crisis management for organizations and response teams."
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
              description="Distinctive elements and obstacles in cyber crisis management – executive audience."
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
                    <p>Cybersecurity expert training and certification delivery, including curriculum development and examination preparation.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Presentation className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Conference Presentations</h3>
                    <p>Keynotes and technical presentations at industry-level events across government, finance, and critical infrastructure sectors.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <BookOpen className="text-primary mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Educational Resources</h3>
                    <p>Training materials developed for practitioners and security managers – field-tested, not academic.</p>
                  </div>
                </div>
              </div>
            </InfoCard>
          </div>
          
          <PageNavButtons buttons={[
            { href: '/consulting', label: 'All Consulting Services' },
            { href: '/consulting/team', label: 'By Whom' },
            { href: '/contact', label: 'Contact', variant: 'highlight' },
          ]} />
        </div>
      </div>
    </PageLayout>
  );
};

export default Publications;