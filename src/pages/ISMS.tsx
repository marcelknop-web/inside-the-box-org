import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const ISMS = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Content */}
          <div className="space-y-8">
            <h1 className="text-primary text-xl sm:text-2xl lg:text-5xl font-bold font-mono mb-12">
              ISMS ISO 27001, BSI GS
            </h1>
            
            <div className="space-y-8 text-foreground leading-relaxed">
              <p className="text-lg font-sans mb-8">
                ISMS development and certification support.
              </p>
              
              {/* Services Overview */}
              <div className="space-y-6">
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
                  <h2 className="text-primary text-xl font-bold font-mono mb-4">ISO 27001 Implementation</h2>
                  <p className="text-sm text-foreground/80 mb-4">
                    ISMS frameworks meeting international standards.
                  </p>
                  <ul className="text-sm text-foreground/80 space-y-2">
                    <li>• Risk assessment and treatment</li>
                    <li>• Policy development</li>
                    <li>• Certification support</li>
                  </ul>
                </div>
                
                <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg p-6">
                  <h2 className="text-highlight text-xl font-bold font-mono mb-4">BSI IT-Grundschutz</h2>
                  <p className="text-sm text-foreground/80 mb-4">
                    BSI IT-Grundschutz methodology implementation.
                  </p>
                  <ul className="text-sm text-foreground/80 space-y-2">
                    <li>• IT-Grundschutz compendium</li>
                    <li>• Security safeguards</li>
                    <li>• BSI certification</li>
                  </ul>
                </div>
                
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                  <h2 className="text-primary text-xl font-bold font-mono mb-4">Our Approach</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base sm:text-lg text-foreground/80">
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Assessment</h3>
                      <p>Analysis of current security posture and gap identification.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Implementation</h3>
                      <p>Structured rollout of security controls and procedures.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Certification</h3>
                      <p>Support through external audits and compliance.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Maintenance</h3>
                      <p>Ongoing ISMS improvement and threat adaptation.</p>
                    </div>
                  </div>
                </div>
                
              </div>
              
              <div className="pt-8">
                <div className="flex justify-center lg:justify-start space-x-4 flex-wrap gap-y-4">
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
                    Let's talk
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

export default ISMS;