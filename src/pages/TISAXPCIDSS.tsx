import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const TISAXPCIDSS = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Content */}
          <div className="space-y-8">
            <h1 className="text-primary text-xl sm:text-2xl lg:text-5xl font-bold font-mono mb-12">
              TISAX, PCI-DSS
            </h1>
            
            <div className="space-y-8 text-foreground leading-relaxed">
              <p className="text-lg font-sans mb-8">
                TISAX and PCI-DSS compliance consulting.
              </p>
              
              {/* Services Overview */}
              <div className="space-y-6">
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
                  <h2 className="text-primary text-xl font-bold font-mono mb-4">Implementation</h2>
                  <p className="text-sm text-foreground/80 mb-4">
                    Systematic implementation of security controls and compliance frameworks.
                  </p>
                  <ul className="text-sm text-foreground/80 space-y-2">
                    <li>• Assessment level determination and scope definition</li>
                    <li>• Security control implementation and execution</li>
                    <li>• Documentation and evidence collection</li>
                  </ul>
                </div>
                
                <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg p-6">
                  <h2 className="text-highlight text-xl font-bold font-mono mb-4">Reviews</h2>
                  <p className="text-sm text-foreground/80 mb-4">
                    Comprehensive assessment and validation of current security posture.
                  </p>
                  <ul className="text-sm text-foreground/80 space-y-2">
                    <li>• Pre-assessment readiness evaluation</li>
                    <li>• Security control effectiveness review</li>
                    <li>• Compliance status verification</li>
                  </ul>
                </div>
                
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                  <h2 className="text-primary text-xl font-bold font-mono mb-4">Audit Support</h2>
                  <p className="text-sm text-foreground/80 mb-4">
                    Professional guidance throughout the assessment and certification process.
                  </p>
                  <ul className="text-sm text-foreground/80 space-y-2">
                    <li>• Assessment preparation and documentation</li>
                    <li>• Auditor coordination and communication</li>
                    <li>• Certification maintenance and renewal</li>
                  </ul>
                </div>
                
                <div className="bg-highlight/5 border border-highlight/20 rounded-lg p-6">
                  <h2 className="text-highlight text-xl font-bold font-mono mb-4">Framework Expertise</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-foreground/80">
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">TISAX</h3>
                      <p>Trusted Information Security Assessment Exchange for automotive industry suppliers and service providers requiring standardized security assessments.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">PCI-DSS</h3>
                      <p>Payment Card Industry Data Security Standard for organizations handling cardholder data and payment transactions.</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
                  <h2 className="text-primary text-xl font-bold font-mono mb-4">Assessment Levels & Merchant Categories</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-foreground mb-3">TISAX Assessment Levels</h3>
                      <ul className="text-sm text-foreground/80 space-y-1">
                        <li>• Assessment Level 1: Basic protection requirements</li>
                        <li>• Assessment Level 2: Standard protection requirements</li>
                        <li>• Assessment Level 3: High protection requirements</li>
                        <li>• Special protection requirements for sensitive data</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-3">PCI-DSS Merchant Levels</h3>
                      <ul className="text-sm text-foreground/80 space-y-1">
                        <li>• Level 1: Over 6 million transactions annually</li>
                        <li>• Level 2: 1-6 million transactions annually</li>
                        <li>• Level 3: 20,000-1 million e-commerce transactions</li>
                        <li>• Level 4: Under 20,000 e-commerce transactions</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg p-6">
                  <h2 className="text-highlight text-xl font-bold font-mono mb-4">Key Deliverables</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-foreground/80">
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Compliance Roadmap</h3>
                      <p>Detailed implementation plan with timelines, milestones, and resource requirements for achieving compliance.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Policy Documentation</h3>
                      <p>Comprehensive security policies, procedures, and controls aligned with framework requirements.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Assessment Preparation</h3>
                      <p>Complete readiness package including evidence collection and assessor coordination support.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Ongoing Compliance</h3>
                      <p>Maintenance program for sustained compliance including monitoring and renewal activities.</p>
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

export default TISAXPCIDSS;