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
            <h1 className="text-primary text-5xl font-bold font-mono mb-12">
              ISMS ISO 27001, BSI GS
            </h1>
            
            <div className="space-y-8 text-foreground leading-relaxed">
              <p className="text-lg font-sans mb-8">
                Comprehensive Information Security Management System implementation and certification according to ISO 27001 and BSI IT-Grundschutz standards.
              </p>
              
              {/* Services Overview */}
              <div className="space-y-6">
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
                  <h2 className="text-primary text-xl font-bold font-mono mb-4">ISO 27001 Implementation</h2>
                  <p className="text-sm text-foreground/80 mb-4">
                    Establish and maintain an Information Security Management System (ISMS) that meets international standards and helps protect your organization's information assets.
                  </p>
                  <ul className="text-sm text-foreground/80 space-y-2">
                    <li>• Risk assessment and treatment planning</li>
                    <li>• Security policy development</li>
                    <li>• Implementation roadmap creation</li>
                    <li>• Internal audit preparation</li>
                    <li>• Certification support</li>
                  </ul>
                </div>
                
                <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg p-6">
                  <h2 className="text-highlight text-xl font-bold font-mono mb-4">BSI IT-Grundschutz</h2>
                  <p className="text-sm text-foreground/80 mb-4">
                    Implementation of the German Federal Office for Information Security (BSI) IT-Grundschutz methodology for systematic IT security management.
                  </p>
                  <ul className="text-sm text-foreground/80 space-y-2">
                    <li>• IT-Grundschutz compendium application</li>
                    <li>• Security safeguards implementation</li>
                    <li>• Documentation and compliance</li>
                    <li>• Regular security reviews</li>
                    <li>• BSI certification preparation</li>
                  </ul>
                </div>
                
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                  <h2 className="text-primary text-xl font-bold font-mono mb-4">Our Approach</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-foreground/80">
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Assessment Phase</h3>
                      <p>Comprehensive analysis of your current security posture and identification of gaps against ISO 27001 and BSI standards.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Implementation Phase</h3>
                      <p>Structured rollout of security controls, policies, and procedures tailored to your organization's specific needs.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Certification Support</h3>
                      <p>Guidance through the certification process, including preparation for external audits and ongoing compliance.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Continuous Improvement</h3>
                      <p>Ongoing support for maintaining and improving your ISMS to adapt to evolving threats and business requirements.</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-highlight/5 border border-highlight/20 rounded-lg p-6">
                  <h2 className="text-highlight text-xl font-bold font-mono mb-4">Benefits</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-foreground/80">
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Enhanced Security</h3>
                      <p>Systematic approach to identifying and mitigating information security risks.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Compliance</h3>
                      <p>Meet regulatory requirements and demonstrate due diligence to stakeholders.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Business Continuity</h3>
                      <p>Protect critical business processes and maintain operational resilience.</p>
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
                    className="bg-highlight/10 border-2 border-highlight/30 rounded-lg text-highlight font-mono text-lg hover:text-primary hover:bg-highlight/20 hover:border-highlight/50 transition-electric px-6 py-3 inline-block"
                  >
                    Meet Our Team
                  </a>
                  <a 
                    href="/contact" 
                    className="bg-primary/5 border-2 border-primary/20 rounded-lg text-primary font-mono text-lg hover:text-highlight hover:bg-primary/15 hover:border-primary/40 transition-electric px-6 py-3 inline-block"
                  >
                    Get in Touch
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