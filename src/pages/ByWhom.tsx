import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';



const ByWhom = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 py-12">
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
                      <div className="w-32 h-32 rounded-full bg-primary/5 p-1">
                        <img 
                          src="/lovable-uploads/0b083536-ec9e-4eda-b874-e926cc196404.png" 
                          alt="Marcel Knop - Senior Cybersecurity Consultant" 
                          className="w-full h-full rounded-full object-cover object-[50%_30%] border border-primary/20 scale-110"
                        />
                      </div>
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
                          <li className="pl-4 -indent-4">• Dipl.-Ing. Mechanical Engineering</li>
                          <li className="pl-4 -indent-4">• CISSP, CISA</li>
                          <li className="pl-4 -indent-4">• ISO/IEC 27001 + 22301 Lead Auditor</li>
                          <li className="pl-4 -indent-4">• BSI Baseline Protection Practitioner</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-primary font-semibold mb-2">Professional Experience</h4>
                        <ul className="space-y-1">
                          <li className="pl-4 -indent-4">• KPMG: Consultant to Senior Manager</li>
                          <li className="pl-4 -indent-4">• Accenture: Senior Manager</li>
                          <li className="pl-4 -indent-4">• Ernst & Young: Senior Manager</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-primary font-semibold mb-2">Consulting Services</h4>
                        <ul className="space-y-1">
                          <li className="pl-4 -indent-4">• Cybersecurity consulting and audits</li>
                          <li className="pl-4 -indent-4">• ISMS, TISAX, NIS-2, PCI-DSS implementation</li>
                          <li className="pl-4 -indent-4">• Cyber crisis management and exercises</li>
                          <li className="pl-4 -indent-4">• TIBER, BCM</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-primary font-semibold mb-2">Languages</h4>
                        <ul className="space-y-1">
                          <li className="pl-4 -indent-4">• German (mother tongue)</li>
                          <li className="pl-4 -indent-4">• English (business fluent)</li>
                        </ul>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Andreas Funder Profile */}
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
                  <div className="flex flex-col md:flex-row gap-6 mb-4">
                    <div className="flex-shrink-0">
                      <div className="w-32 h-32 rounded-full bg-primary/5 p-1">
                        <img 
                          src="/lovable-uploads/11e7ca2e-054c-44e6-8555-9f230229ef12.png" 
                          alt="Andreas Funder - Senior Cybersecurity Consultant" 
                          className="w-full h-full rounded-full object-cover object-[50%_30%] border border-primary/20 scale-110"
                        />
                      </div>
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
                          <li className="pl-4 -indent-4">• B.Sc. Business Administration</li>
                          <li className="pl-4 -indent-4">• ISO/IEC 27001 Lead Auditor + Implementer</li>
                          <li className="pl-4 -indent-4">• ISO/IEC 27005 Risk Manager</li>
                          <li className="pl-4 -indent-4">• BSI IT-Grundschutz Practitioner</li>
                          <li className="pl-4 -indent-4">• Data Privacy Auditor (DSA-TÜV)</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-primary font-semibold mb-2">Professional Experience</h4>
                        <ul className="space-y-1">
                          <li className="pl-4 -indent-4">• PwC: Manager, Cybersecurity and Privacy</li>
                          <li className="pl-4 -indent-4">• Ernst & Young: Senior Consultant</li>
                          <li className="pl-4 -indent-4">• CSPi: Consultant Security and Data Privacy</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-primary font-semibold mb-2">Consulting Services</h4>
                        <ul className="space-y-1">
                          <li className="pl-4 -indent-4">• Information Security, ISMS Strategy</li>
                          <li className="pl-4 -indent-4">• ISO/IEC 27001, PCI-DSS, NIST, TISAX</li>
                          <li className="pl-4 -indent-4">• Risk Management, Business Continuity</li>
                          <li className="pl-4 -indent-4">• EU GDPR, Critical Infrastructure (KRITIS)</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-primary font-semibold mb-2">Languages</h4>
                        <ul className="space-y-1">
                          <li className="pl-4 -indent-4">• German (mother tongue)</li>
                          <li className="pl-4 -indent-4">• English (business fluent)</li>
                          <li className="pl-4 -indent-4">• French (professional working)</li>
                        </ul>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
              
              <div className="pt-8">
                <div className="flex flex-col sm:flex-row sm:justify-center gap-4">
                  <a 
                    href="/training" 
                    className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-lg hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-6 py-3 text-center w-full sm:w-32"
                  >
                    Training
                  </a>
                  <a 
                    href="/contact" 
                    className="bg-highlight/10 border-2 border-highlight/30 rounded-lg text-highlight font-mono text-lg hover:text-primary hover:bg-highlight/20 hover:border-highlight/50 transition-electric px-6 py-3 text-center w-full sm:w-32"
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