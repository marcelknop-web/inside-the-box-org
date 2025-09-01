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
                who have worked in both offensive and defensive security roles across various industries.
              </p>
              
              <div className="space-y-6">
                <h2 className="text-electric text-2xl font-bold font-mono hover:text-highlight transition-electric">
                  Our Team
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6 hover:bg-primary/20 hover:border-primary/50 transition-electric">
                    <h3 className="text-primary text-lg font-semibold mb-3">Security Researchers</h3>
                    <ul className="space-y-2 text-sm">
                      <li>• Active threat intelligence analysis</li>
                      <li>• Vulnerability research and disclosure</li>
                      <li>• Advanced persistent threat tracking</li>
                      <li>• Zero-day exploit development</li>
                    </ul>
                  </div>
                  
                  <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6 hover:bg-primary/20 hover:border-primary/50 transition-electric">
                    <h3 className="text-primary text-lg font-semibold mb-3">Incident Response Experts</h3>
                    <ul className="space-y-2 text-sm">
                      <li>• Fortune 500 company breaches</li>
                      <li>• Critical infrastructure protection</li>
                      <li>• Government sector security</li>
                      <li>• International incident coordination</li>
                    </ul>
                  </div>
                  
                  <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6 hover:bg-primary/20 hover:border-primary/50 transition-electric">
                    <h3 className="text-primary text-lg font-semibold mb-3">Penetration Testers</h3>
                    <ul className="space-y-2 text-sm">
                      <li>• Red team operations</li>
                      <li>• Social engineering assessments</li>
                      <li>• Network and application security</li>
                      <li>• Physical security testing</li>
                    </ul>
                  </div>
                  
                  <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6 hover:bg-primary/20 hover:border-primary/50 transition-electric">
                    <h3 className="text-primary text-lg font-semibold mb-3">Training Specialists</h3>
                    <ul className="space-y-2 text-sm">
                      <li>• Adult learning methodologies</li>
                      <li>• Simulation environment design</li>
                      <li>• Performance assessment</li>
                      <li>• Curriculum development</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <h2 className="text-electric text-2xl font-bold font-mono hover:text-highlight transition-electric">
                  Qualifications & Certifications
                </h2>
                
                <p className="text-lg font-sans">
                  Our instructors hold industry-recognized certifications and have <span className="text-highlight font-semibold">real-world experience</span> 
                  in handling major cybersecurity incidents. They bring practical knowledge from:
                </p>
                
                <ul className="space-y-3 text-lg font-sans ml-6">
                  <li>• <span className="text-highlight font-semibold">CISSP, CISM, GCIH</span> - Advanced security certifications</li>
                  <li>• <span className="text-highlight font-semibold">CEH, OSCP, GPEN</span> - Penetration testing expertise</li>
                  <li>• <span className="text-highlight font-semibold">Military & Government</span> - National security experience</li>
                  <li>• <span className="text-highlight font-semibold">Academic Research</span> - Published cybersecurity research</li>
                </ul>
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