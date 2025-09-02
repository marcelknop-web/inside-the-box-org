import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const EventsWorkshops = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Content */}
          <div className="space-y-8">
            <h1 className="text-primary text-xl sm:text-2xl lg:text-5xl font-bold font-mono mb-12">
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
                Professional moderation of cybersecurity events, workshops, and training sessions.
              </p>
              
              {/* Services Overview */}
              <div className="space-y-6">
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
                  <h2 className="text-primary text-xl font-bold font-mono mb-4">Event Moderation</h2>
                  <p className="text-base text-foreground/80 mb-4">
                    Expert facilitation of cybersecurity conferences, seminars, and workshops.
                  </p>
                  <ul className="text-base text-foreground/80 space-y-2">
                    <li>• Conference and seminar moderation</li>
                    <li>• Panel discussion facilitation</li>
                    <li>• Workshop design and execution</li>
                  </ul>
                </div>
                
                <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg p-6">
                  <h2 className="text-highlight text-xl font-bold font-mono mb-4">Training Workshops</h2>
                  <p className="text-base text-foreground/80 mb-4">
                    Cybersecurity awareness and technical training workshop development.
                  </p>
                  <ul className="text-base text-foreground/80 space-y-2">
                    <li>• Security awareness programs</li>
                    <li>• Technical skill development</li>
                    <li>• Crisis management exercises</li>
                  </ul>
                </div>
                
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                  <h2 className="text-primary text-xl font-bold font-mono mb-4">Client References</h2>
                  <p className="text-base text-foreground/80 mb-4">
                    Trusted by leading organizations across government, industry, and academia.
                  </p>
                  <div className="text-base text-foreground/70 leading-relaxed">
                    <p>Beamtenbund • Bechtle • Bitkom • BSI • CDU • DENIC • DDPS (CH) • DIIR • DWT • Fast Lane • Euroforum • HPI • IIR • ISACA • Management Circle • SoftwareONE • University of the Bundeswehr and Giessen</p>
                  </div>
                </div>
                
                <div className="bg-highlight/5 border border-highlight/20 rounded-lg p-6">
                  <h2 className="text-highlight text-xl font-bold font-mono mb-4">Event Types</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-base text-foreground/80">
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Conferences</h3>
                      <p>Large-scale cybersecurity conferences and industry events.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Workshops</h3>
                      <p>Interactive training sessions and skill-building workshops.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Seminars</h3>
                      <p>Educational seminars and awareness training programs.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-8">
                <div className="flex justify-between space-x-4 flex-wrap gap-y-4">
                  <a 
                    href="/consulting" 
                    className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-lg hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-6 py-3 inline-block"
                  >
                    All Consulting Services
                  </a>
                  <a 
                    href="/consulting/team" 
                    className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-lg hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-6 py-3 inline-block"
                  >
                    Meet Our Team
                  </a>
                  <a 
                    href="/contact" 
                    className="bg-highlight/10 border-2 border-highlight/30 rounded-lg text-highlight font-mono text-lg hover:text-primary hover:bg-highlight/20 hover:border-highlight/50 transition-electric px-6 py-3 inline-block"
                  >
                    Contact
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EventsWorkshops;