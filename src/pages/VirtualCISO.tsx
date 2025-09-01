import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const VirtualCISO = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Content */}
          <div className="space-y-8">
            <h1 className="text-primary text-xl sm:text-2xl lg:text-5xl font-bold font-mono mb-12">
              Virtual CISO
            </h1>
            
            <div className="space-y-8 text-foreground leading-relaxed">
              <p className="text-lg font-sans mb-8">
                Outsourced Chief Information Security Officer services for strategic cybersecurity leadership.
              </p>
              
              {/* Services Overview */}
              <div className="space-y-6">
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
                  <h2 className="text-primary text-xl font-bold font-mono mb-4">Strategic Leadership</h2>
                  <p className="text-sm text-foreground/80 mb-4">
                    Executive-level cybersecurity guidance and strategic decision-making support.
                  </p>
                  <ul className="text-sm text-foreground/80 space-y-2">
                    <li>• Cybersecurity strategy development</li>
                    <li>• Risk management and governance</li>
                    <li>• Board and executive reporting</li>
                  </ul>
                </div>
                
                <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg p-6">
                  <h2 className="text-highlight text-xl font-bold font-mono mb-4">Operational Excellence</h2>
                  <p className="text-sm text-foreground/80 mb-4">
                    Day-to-day security operations oversight and program management.
                  </p>
                  <ul className="text-sm text-foreground/80 space-y-2">
                    <li>• Security program implementation</li>
                    <li>• Team leadership and development</li>
                    <li>• Vendor and technology management</li>
                  </ul>
                </div>
                
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                  <h2 className="text-primary text-xl font-bold font-mono mb-4">Compliance & Assurance</h2>
                  <p className="text-sm text-foreground/80 mb-4">
                    Regulatory compliance management and security assurance programs.
                  </p>
                  <ul className="text-sm text-foreground/80 space-y-2">
                    <li>• Regulatory compliance oversight</li>
                    <li>• Audit coordination and management</li>
                    <li>• Policy and procedure development</li>
                  </ul>
                </div>
                
                <div className="bg-highlight/5 border border-highlight/20 rounded-lg p-6">
                  <h2 className="text-highlight text-xl font-bold font-mono mb-4">Service Model</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-foreground/80">
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Flexible Engagement</h3>
                      <p>Part-time or project-based CISO services tailored to organizational needs.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Cost-Effective</h3>
                      <p>Executive-level expertise without the full-time executive cost.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Immediate Impact</h3>
                      <p>Rapid deployment of experienced cybersecurity leadership.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Proven Experience</h3>
                      <p>Enterprise-level cybersecurity management and consulting expertise.</p>
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

export default VirtualCISO;