import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import andreasHeadshot from '@/assets/andreas-funder-headshot.jpg';
import marcelHeadshot from '@/assets/marcel-knop-headshot.jpg';

const ByWhom = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Content */}
          <div className="space-y-8">
            <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">
              By Whom?
            </h1>
            
            <div className="space-y-8 text-foreground leading-relaxed">
              <p className="text-lg font-sans">
                <span className="text-highlight font-semibold">Senior cybersecurity consultants</span> with enterprise security and incident response experience and combined 35+ years of professional consulting expertise.
              </p>
              
              <div className="space-y-8">
                {/* Marcel Knop Profile */}
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
                  <div className="flex flex-col md:flex-row gap-6 mb-4">
                    <div className="flex-shrink-0">
                      <img 
                        src={marcelHeadshot} 
                        alt="Marcel Knop - Senior Cybersecurity Consultant" 
                        className="w-32 h-32 rounded-full object-cover border-2 border-primary/30 filter grayscale"
                      />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-primary text-2xl font-bold font-mono mb-2">Marcel Knop</h2>
                      <h3 className="text-highlight text-lg font-semibold">Senior Consultant</h3>
                    </div>
                  </div>
                  
                  <div className="space-y-4 text-base sm:text-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-primary font-semibold mb-2">Education & Qualifications</h4>
                        <ul className="space-y-1">
                          <li>• Dipl.-Ing. Mechanical Engineering</li>
                          <li>• CISSP, CISA</li>
                          <li>• ISO/IEC 27001 + 22301 Lead Auditor</li>
                          <li>• BSI Baseline Protection Practitioner</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-primary font-semibold mb-2">Professional Experience</h4>
                        <ul className="space-y-1">
                          <li>• KPMG: Consultant to Senior Manager</li>
                          <li>• Accenture: Senior Manager</li>
                          <li>• Ernst & Young: Senior Manager</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-primary font-semibold mb-2">Consulting Services</h4>
                        <ul className="space-y-1">
                          <li>• Cybersecurity consulting and audits</li>
                          <li>• ISMS, TISAX, NIS-2, PCI-DSS implementation</li>
                          <li>• Cyber crisis management and exercises</li>
                          <li>• TIBER, BCM</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-primary font-semibold mb-2">Languages</h4>
                        <ul className="space-y-1">
                          <li>• German (mother tongue)</li>
                          <li>• English (business fluent)</li>
                        </ul>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Andreas Funder Profile */}
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
                  <div className="flex flex-col md:flex-row gap-6 mb-4">
                    <div className="flex-shrink-0">
                      <img 
                        src={andreasHeadshot} 
                        alt="Andreas Funder - Senior Cybersecurity Consultant" 
                        className="w-32 h-32 rounded-full object-cover border-2 border-primary/30 filter grayscale"
                      />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-primary text-2xl font-bold font-mono mb-2">Andreas Funder</h2>
                      <h3 className="text-highlight text-lg font-semibold mb-4">Senior Consultant</h3>
                    </div>
                  </div>
                  
                  <div className="space-y-4 text-base sm:text-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-primary font-semibold mb-2">Education & Qualifications</h4>
                        <ul className="space-y-1">
                          <li>• B.Sc. Business Administration</li>
                          <li>• ISO/IEC 27001 Lead Auditor + Implementer</li>
                          <li>• ISO/IEC 27005 Risk Manager</li>
                          <li>• BSI IT-Grundschutz Practitioner</li>
                          <li>• Data Privacy Auditor (DSA-TÜV)</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-primary font-semibold mb-2">Professional Experience</h4>
                        <ul className="space-y-1">
                          <li>• PwC: Manager, Cybersecurity and Privacy</li>
                          <li>• Ernst & Young: Senior Consultant</li>
                          <li>• CSPi: Consultant Security and Data Privacy</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-primary font-semibold mb-2">Consulting Services</h4>
                        <ul className="space-y-1">
                          <li>• Information Security, ISMS Strategy</li>
                          <li>• ISO/IEC 27001, PCI-DSS, NIST, TISAX</li>
                          <li>• Risk Management, Business Continuity</li>
                          <li>• EU GDPR, Critical Infrastructure (KRITIS)</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-primary font-semibold mb-2">Languages</h4>
                        <ul className="space-y-1">
                          <li>• German (mother tongue)</li>
                          <li>• English (business fluent)</li>
                          <li>• French (professional working)</li>
                        </ul>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
              
              <div className="pt-8">
                <div className="flex justify-center lg:justify-between space-x-4">
                  <a 
                    href="/training" 
                    className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-lg hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-6 py-3 inline-block"
                  >
                    Return to trainings
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

export default ByWhom;