import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const NIS2DORA = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Content */}
          <div className="space-y-8">
            <h1 className="text-primary text-xl sm:text-2xl lg:text-5xl font-bold font-mono mb-12">
              NIS-2, DORA, PART-IS
            </h1>
            
            <div className="space-y-8 text-foreground leading-relaxed">
              <p className="text-lg font-sans mb-8">
                NIS-2, DORA, and PART-IS compliance support.
              </p>
              
              {/* Services Overview */}
              <div className="space-y-6">
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
                  <h2 className="text-primary text-xl font-bold font-mono mb-4">Impact Analysis</h2>
                  <p className="text-sm text-foreground/80 mb-4">
                    Determine the scope and implications of regulatory requirements for your organization.
                  </p>
                  <ul className="text-sm text-foreground/80 space-y-2">
                    <li>• Regulatory applicability assessment</li>
                    <li>• Critical business function identification</li>
                    <li>• Cross-divisional impact analysis</li>
                  </ul>
                </div>
                
                <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg p-6">
                  <h2 className="text-highlight text-xl font-bold font-mono mb-4">GAP Analysis</h2>
                  <p className="text-sm text-foreground/80 mb-4">
                    Systematic evaluation of current capabilities against regulatory requirements.
                  </p>
                  <ul className="text-sm text-foreground/80 space-y-2">
                    <li>• Current state assessment and gap identification</li>
                    <li>• Risk-based prioritization of activities</li>
                    <li>• Implementation timeline development</li>
                  </ul>
                </div>
                
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                  <h2 className="text-primary text-xl font-bold font-mono mb-4">Implementation of Measures</h2>
                  <p className="text-sm text-foreground/80 mb-4">
                    Development and deployment of technical and organizational measures for compliance.
                  </p>
                  <ul className="text-sm text-foreground/80 space-y-2">
                    <li>• Technical and organizational measure development</li>
                    <li>• Continuous monitoring and effectiveness assessment</li>
                    <li>• Incident response and reporting mechanisms</li>
                  </ul>
                </div>
                
                <div className="bg-highlight/5 border border-highlight/20 rounded-lg p-6">
                  <h2 className="text-highlight text-xl font-bold font-mono mb-4">Regulatory Framework Coverage</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-base sm:text-lg text-foreground/80">
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">NIS-2 Directive</h3>
                      <p>Network and Information Systems security requirements for essential and important entities.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">DORA</h3>
                      <p>Digital Operational Resilience Act for financial services ICT risk management.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">PART-IS</h3>
                      <p>Proportionate and risk-based approaches to information security compliance.</p>
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

export default NIS2DORA;