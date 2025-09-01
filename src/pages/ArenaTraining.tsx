import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const ArenaTraining = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Content */}
          <div className="space-y-8">
            <h1 className="text-primary text-xl sm:text-2xl lg:text-5xl font-bold font-mono mb-12">
              Arena Training, TIBER Test
            </h1>
            
            <div className="space-y-8 text-foreground leading-relaxed">
              <p className="text-lg font-sans mb-8">
                Advanced threat intelligence-based ethical red teaming and cyber training programs.
              </p>
              
              {/* Services Overview */}
              <div className="space-y-6">
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
                  <h2 className="text-primary text-xl font-bold font-mono mb-4">Arena Training</h2>
                  <p className="text-base sm:text-lg text-foreground/80 mb-4">
                    Comprehensive cybersecurity training in realistic attack scenarios.
                  </p>
                  <ul className="text-base sm:text-lg text-foreground/80 space-y-2">
                    <li>• Analysis of host and network-based attacks</li>
                    <li>• SIEM monitoring of live communication</li>
                    <li>• Techniques and tactics to prevent detection</li>
                  </ul>
                </div>
                
                <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg p-6">
                  <h2 className="text-highlight text-xl font-bold font-mono mb-4">TIBER Test</h2>
                  <p className="text-base sm:text-lg text-foreground/80 mb-4">
                    Threat Intelligence-based Ethical Red Teaming coordination and management.
                  </p>
                  <ul className="text-base sm:text-lg text-foreground/80 space-y-2">
                    <li>• Scenario creation and safeguard definition</li>
                    <li>• Team communication moderation</li>
                    <li>• Testing coordination and documentation</li>
                  </ul>
                </div>
                
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                  <h2 className="text-primary text-xl font-bold font-mono mb-4">Training Methodology</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base sm:text-lg text-foreground/80">
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Realistic Scenarios</h3>
                      <p>Live attack simulations using actual threat intelligence and attack patterns.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Hands-on Practice</h3>
                      <p>Direct engagement with cybersecurity tools and defensive techniques.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Team Coordination</h3>
                      <p>Multi-team exercises involving threat intelligence, red team, and blue team coordination.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Regulatory Compliance</h3>
                      <p>Authority contact procedures and regulatory reporting requirements.</p>
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

export default ArenaTraining;