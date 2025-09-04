import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { InfoCard } from '@/components/InfoCard';
import { LinkButton } from '@/components/LinkButton';
import { Mic, Users, Award, Presentation, Wrench, GraduationCap } from 'lucide-react';

const EventsWorkshops = () => {
  return (
    <PageLayout>
      <div className="space-y-8">
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">
          Events & Workshops
        </h1>
        
        {/* Image Gallery */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="rounded-lg overflow-hidden border-2 border-primary/20">
            <img 
              src="/lovable-uploads/fc4cff06-0e9d-41c4-bac3-73a041a924b3.png" 
              alt="Cybersecurity Training Presentation" 
              className="w-full h-24 sm:h-32 object-cover"
            />
          </div>
          <div className="rounded-lg overflow-hidden border-2 border-primary/20">
            <img 
              src="/lovable-uploads/f463db5a-733d-4e4e-b151-d3e33ebe8997.png" 
              alt="Training Room Session" 
              className="w-full h-24 sm:h-32 object-cover"
            />
          </div>
          <div className="rounded-lg overflow-hidden border-2 border-primary/20">
            <img 
              src="/lovable-uploads/48ad82c3-84e8-4161-93d5-d79b509f7cc4.png" 
              alt="Conference Presentation" 
              className="w-full h-24 sm:h-32 object-cover"
            />
          </div>
        </div>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8">
            Moderation of cybersecurity training sessions, workshops, and events.
          </p>
          
          <div className="space-y-6">
            <ServiceCard
              icon={Mic}
              title="Event Moderation"
              description="Expert facilitation of cybersecurity conferences, seminars, and workshops."
            >
              <ul className="text-base text-foreground/80 space-y-2 mt-4">
                <li className="pl-4 -indent-4">• Conference and seminar moderation</li>
                <li className="pl-4 -indent-4">• Panel discussion facilitation</li>
                <li className="pl-4 -indent-4">• Workshop design and execution</li>
              </ul>
            </ServiceCard>
            
            <ServiceCard
              icon={Users}
              title="Training Workshops"
              description="Cybersecurity awareness and technical training workshop development."
              variant="highlight"
            >
              <ul className="text-base text-foreground/80 space-y-2 mt-4">
                <li className="pl-4 -indent-4">• Security awareness programs</li>
                <li className="pl-4 -indent-4">• Technical skill development</li>
                <li className="pl-4 -indent-4">• Crisis management exercises</li>
              </ul>
            </ServiceCard>
            
            <ServiceCard
              icon={Award}
              title="Client References"
              description="Trusted by leading organizations across government, industry, and academia."
            >
              <div className="text-base text-foreground/70 leading-relaxed mt-4">
                <p>Beamtenbund • Bechtle • Bitkom • BSI • CDU • DENIC • DDPS (CH) • DIIR • DWT • Fast Lane • Euroforum • HPI • IIR • ISACA • Management Circle • SoftwareONE • University of the Bundeswehr and Giessen</p>
              </div>
            </ServiceCard>
            
            <InfoCard variant="subtle">
              <h2 className="text-primary text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-4">Event Types</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-base sm:text-lg text-foreground/80">
                <div className="flex flex-col items-center text-center space-y-2">
                  <Presentation className="text-primary" size={24} />
                  <h3 className="font-semibold text-foreground mb-2">Conferences</h3>
                  <p>Large-scale cybersecurity conferences and industry events.</p>
                </div>
                <div className="flex flex-col items-center text-center space-y-2">
                  <Wrench className="text-primary" size={24} />
                  <h3 className="font-semibold text-foreground mb-2">Workshops</h3>
                  <p>Interactive training sessions and skill-building workshops.</p>
                </div>
                <div className="flex flex-col items-center text-center space-y-2">
                  <GraduationCap className="text-primary" size={24} />
                  <h3 className="font-semibold text-foreground mb-2">Seminars</h3>
                  <p>Educational seminars and awareness training programs.</p>
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

export default EventsWorkshops;