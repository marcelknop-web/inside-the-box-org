import { GeometricSymbol } from '@/components/GeometricSymbol';
import { Header } from '@/components/Header';

const ByWhom = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row items-start justify-between">
          {/* Left: Geometric Symbol */}
          <div className="mb-12 lg:mb-0 lg:mr-20">
            <GeometricSymbol size="lg" />
          </div>
          
          {/* Right: Content */}
          <div className="flex-1 max-w-3xl">
            <h1 className="text-electric text-5xl font-bold font-mono mb-12">
              By Whom?
            </h1>
            
            <div className="space-y-8 text-foreground leading-relaxed">
              <p className="text-lg font-sans">
                The cyber training range is developed and conducted by <span className="text-highlight font-semibold">experienced cybersecurity professionals</span> 
                who bring real-world expertise from consulting and incident response.
              </p>
              
              <div className="space-y-8">
                {/* Marcel Knop Profile */}
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6 hover:bg-primary/20 hover:border-primary/50 transition-electric">
                  <h2 className="text-primary text-2xl font-bold font-mono mb-4">Marcel Knop</h2>
                  <h3 className="text-highlight text-lg font-semibold mb-4">Senior Consultant</h3>
                  
                  <div className="space-y-4 text-sm">
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
                          <li>• 350+ cybersecurity projects</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-primary font-semibold mb-2">Consulting Services</h4>
                      <ul className="space-y-1">
                        <li>• Cybersecurity consulting and audits</li>
                        <li>• ISMS, TISAX, NIS-2, PCI-DSS implementation</li>
                        <li>• Cyber crisis management and exercises, TIBER, BCM</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-primary font-semibold mb-2">Notable Clients</h4>
                      <p className="text-xs">ADAC, Airbus, Alstom, BSI, German Armed Forces, Continental, Daimler, Deutsche Bahn, Deutsche Bank, Deutsche Lufthansa, SAP, Siemens, Telekom, VW</p>
                    </div>
                  </div>
                </div>

                {/* Andreas Funder Profile */}
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6 hover:bg-primary/20 hover:border-primary/50 transition-electric">
                  <h2 className="text-primary text-2xl font-bold font-mono mb-4">Andreas Funder</h2>
                  <h3 className="text-highlight text-lg font-semibold mb-4">Senior Consultant</h3>
                  
                  <div className="space-y-4 text-sm">
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
                        <h4 className="text-primary font-semibold mb-2">Specialized Expertise</h4>
                        <ul className="space-y-1">
                          <li>• Critical Infrastructures (KRITIS)</li>
                          <li>• EU NIS2, EU RCE, EU CRA</li>
                          <li>• Business Continuity Management</li>
                          <li>• Risk Management ISO 31000</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-primary font-semibold mb-2">Consulting Services</h4>
                      <ul className="space-y-1">
                        <li>• Information Security, ISMS, Cyber Security Strategy</li>
                        <li>• ISO/IEC 27001, PCI-DSS, NIST, BSI IT-Grundschutz, TISAX</li>
                        <li>• Information Security Risk Management</li>
                        <li>• Data Privacy EU GDPR, BDSG</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-8">
                <div className="flex justify-center lg:justify-start">
                  <a 
                    href="/training" 
                    className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-lg hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-6 py-3 inline-block"
                  >
                    What Training?
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ByWhom;