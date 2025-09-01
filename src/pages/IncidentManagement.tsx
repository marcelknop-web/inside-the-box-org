import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const IncidentManagement = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Content */}
          <div className="space-y-8">
            <h1 className="text-primary text-xl sm:text-2xl lg:text-5xl font-bold font-mono mb-12">
              Incident Management
            </h1>
            
            <div className="space-y-8 text-foreground leading-relaxed">
              <p className="text-lg font-sans mb-8">
                Security incident management framework development.
              </p>
              
              {/* Services Overview */}
              <div className="space-y-6">
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
                  <h2 className="text-primary text-xl font-bold font-mono mb-4">Incident Response Planning</h2>
                  <p className="text-sm text-foreground/80 mb-4">
                    Development of structured incident response procedures and operational playbooks.
                  </p>
                  <ul className="text-sm text-foreground/80 space-y-2">
                    <li>• Incident classification and severity levels</li>
                    <li>• Response team structure and roles</li>
                    <li>• Escalation and communication protocols</li>
                  </ul>
                </div>
                
                <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg p-6">
                  <h2 className="text-highlight text-xl font-bold font-mono mb-4">Detection & Analysis</h2>
                  <p className="text-sm text-foreground/80 mb-4">
                    Implementation of incident detection capabilities and analytical processes for effective threat identification.
                  </p>
                  <ul className="text-sm text-foreground/80 space-y-2">
                    <li>• Security monitoring and alerting systems</li>
                    <li>• Forensic analysis methodology</li>
                    <li>• Evidence collection and preservation</li>
                  </ul>
                </div>
                
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                  <h2 className="text-primary text-xl font-bold font-mono mb-4">Containment & Eradication</h2>
                  <p className="text-sm text-foreground/80 mb-4">
                    Strategic approaches for incident containment, threat eradication, and system recovery operations.
                  </p>
                  <ul className="text-sm text-foreground/80 space-y-2">
                    <li>• Containment strategy development</li>
                    <li>• Network segmentation and isolation</li>
                    <li>• System hardening and recovery</li>
                  </ul>
                </div>
                
                <div className="bg-highlight/5 border border-highlight/20 rounded-lg p-6">
                  <h2 className="text-highlight text-xl font-bold font-mono mb-4">Recovery & Lessons Learned</h2>
                  <p className="text-sm text-foreground/80 mb-4">
                    Systematic recovery operations and post-incident analysis for continuous improvement.
                  </p>
                  <ul className="text-sm text-foreground/80 space-y-2">
                    <li>• Business continuity coordination</li>
                    <li>• Post-incident review and analysis</li>
                    <li>• Process improvement implementation</li>
                  </ul>
                </div>
                
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
                  <h2 className="text-primary text-xl font-bold font-mono mb-4">Training & Simulation</h2>
                  <p className="text-sm text-foreground/80 mb-4">
                    Practical training programs and simulation exercises to develop incident response capabilities.
                  </p>
                  <ul className="text-sm text-foreground/80 space-y-2">
                    <li>• Incident response team training</li>
                    <li>• Tabletop exercises and simulations</li>
                    <li>• Technical skills development</li>
                  </ul>
                </div>
                
                <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg p-6">
                  <h2 className="text-highlight text-xl font-bold font-mono mb-4">Key Capabilities</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base sm:text-lg text-foreground/80">
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">24/7 Response</h3>
                      <p>Round-the-clock incident response capability with appropriate staffing and escalation procedures.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Threat Hunting</h3>
                      <p>Proactive threat hunting capabilities to identify advanced persistent threats and insider risks.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Digital Forensics</h3>
                      <p>Comprehensive digital forensics capabilities for evidence collection and incident attribution.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Legal Coordination</h3>
                      <p>Integration with legal counsel and law enforcement for regulatory compliance and prosecution support.</p>
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

export default IncidentManagement;