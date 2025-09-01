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
                TISAX and PCI-DSS compliance consulting for automotive and payment industries.
              </p>
              
              {/* Services Overview */}
              <div className="space-y-6">
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
                  <h2 className="text-primary text-xl font-bold font-mono mb-4">Implementation</h2>
                  <ul className="text-sm text-foreground/80 space-y-2">
                    <li>• Assessment level determination</li>
                    <li>• Security control implementation</li>
                    <li>• Documentation and evidence collection</li>
                  </ul>
                </div>
                
                <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg p-6">
                  <h2 className="text-highlight text-xl font-bold font-mono mb-4">Reviews</h2>
                  <ul className="text-sm text-foreground/80 space-y-2">
                    <li>• Pre-assessment readiness evaluation</li>
                    <li>• Security control effectiveness review</li>
                    <li>• Compliance status verification</li>
                  </ul>
                </div>
                
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                  <h2 className="text-primary text-xl font-bold font-mono mb-4">Audit Support</h2>
                  <ul className="text-sm text-foreground/80 space-y-2">
                    <li>• Assessment preparation</li>
                    <li>• Auditor coordination</li>
                    <li>• Certification maintenance</li>
                  </ul>
                </div>
                
                <div className="bg-highlight/5 border border-highlight/20 rounded-lg p-6">
                  <h2 className="text-highlight text-xl font-bold font-mono mb-4">Framework Expertise</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-foreground/80">
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">TISAX</h3>
                      <p>Security assessment exchange for automotive industry suppliers.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">PCI-DSS</h3>
                      <p>Data security standard for payment card processing organizations.</p>
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