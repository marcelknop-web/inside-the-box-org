import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const CyberCrisisManagement = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Content */}
          <div className="space-y-8">
            <h1 className="text-primary text-xl sm:text-2xl lg:text-5xl font-bold font-mono mb-12">
              Cyber Crisis Management
            </h1>
            
            <div className="space-y-8 text-foreground leading-relaxed">
              <p className="text-lg font-sans mb-8">
                Comprehensive cyber crisis management capability development through strategic planning, scenario preparation, and realistic simulation exercises.
              </p>
              
              {/* Services Overview */}
              <div className="space-y-6">
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
                  <h2 className="text-primary text-xl font-bold font-mono mb-4">Crisis Planning & Preparedness</h2>
                  <p className="text-sm text-foreground/80 mb-4">
                    Development of comprehensive crisis management plans and organizational preparedness frameworks.
                  </p>
                  <ul className="text-sm text-foreground/80 space-y-2">
                    <li>• Crisis management governance structure and authority definition</li>
                    <li>• Crisis team composition and role assignment</li>
                    <li>• Decision-making frameworks under time pressure and uncertainty</li>
                    <li>• Crisis communication protocols and stakeholder management</li>
                    <li>• Business continuity integration and operational resilience</li>
                  </ul>
                </div>
                
                <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg p-6">
                  <h2 className="text-highlight text-xl font-bold font-mono mb-4">Scenario Development</h2>
                  <p className="text-sm text-foreground/80 mb-4">
                    Creation of realistic crisis scenarios based on current threat intelligence and organizational risk profile.
                  </p>
                  <ul className="text-sm text-foreground/80 space-y-2">
                    <li>• Threat-informed scenario design and narrative development</li>
                    <li>• Multi-stage crisis progression and escalation modeling</li>
                    <li>• Cross-functional impact analysis and dependency mapping</li>
                    <li>• Regulatory and legal implication integration</li>
                    <li>• Media and public perception consideration</li>
                  </ul>
                </div>
                
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                  <h2 className="text-primary text-xl font-bold font-mono mb-4">Crisis Simulation Exercises</h2>
                  <p className="text-sm text-foreground/80 mb-4">
                    Immersive crisis simulation training using controlled cyber training range environments.
                  </p>
                  <ul className="text-sm text-foreground/80 space-y-2">
                    <li>• Realistic cyber attack simulation and live crisis injection</li>
                    <li>• Cross-functional team coordination and communication testing</li>
                    <li>• Decision-making under pressure and time constraints</li>
                    <li>• Stakeholder interaction and external communication practice</li>
                    <li>• Crisis escalation and de-escalation procedure validation</li>
                  </ul>
                </div>
                
                <div className="bg-highlight/5 border border-highlight/20 rounded-lg p-6">
                  <h2 className="text-highlight text-xl font-bold font-mono mb-4">Leadership Development</h2>
                  <p className="text-sm text-foreground/80 mb-4">
                    Specialized training for crisis leadership and executive decision-making during cyber incidents.
                  </p>
                  <ul className="text-sm text-foreground/80 space-y-2">
                    <li>• Executive crisis leadership training and coaching</li>
                    <li>• Strategic decision-making frameworks and tools</li>
                    <li>• Crisis communication and media interaction skills</li>
                    <li>• Board and stakeholder reporting under crisis conditions</li>
                    <li>• Legal and regulatory coordination during incidents</li>
                  </ul>
                </div>
                
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
                  <h2 className="text-primary text-xl font-bold font-mono mb-4">Crisis Communication</h2>
                  <p className="text-sm text-foreground/80 mb-4">
                    Strategic communication planning and execution for internal and external stakeholder management.
                  </p>
                  <ul className="text-sm text-foreground/80 space-y-2">
                    <li>• Crisis communication strategy and messaging development</li>
                    <li>• Media relations and public statement coordination</li>
                    <li>• Employee communication and internal information management</li>
                    <li>• Customer and partner notification procedures</li>
                    <li>• Regulatory reporting and compliance communication</li>
                  </ul>
                </div>
                
                <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg p-6">
                  <h2 className="text-highlight text-xl font-bold font-mono mb-4">Training Methodologies</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-foreground/80">
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Tabletop Exercises</h3>
                      <p>Discussion-based scenario walkthroughs for strategic planning and coordination practice.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Live Simulations</h3>
                      <p>Real-time crisis scenarios with technical components and operational constraints.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Cyber Range Training</h3>
                      <p>Immersive technical environment simulating realistic attack scenarios and business impact.</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                  <h2 className="text-primary text-xl font-bold font-mono mb-4">Expected Outcomes</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-foreground/80">
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Enhanced Readiness</h3>
                      <p>Improved organizational preparedness and response capability for cyber crisis situations.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Tested Procedures</h3>
                      <p>Validated crisis management procedures and identification of improvement opportunities.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Team Coordination</h3>
                      <p>Strengthened cross-functional collaboration and communication under crisis conditions.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Leadership Confidence</h3>
                      <p>Increased executive confidence in crisis decision-making and stakeholder management.</p>
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

export default CyberCrisisManagement;