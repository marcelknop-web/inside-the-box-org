import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const TechnicalRequirements = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Content */}
          <div className="space-y-8">
            <h1 className="text-primary text-xl sm:text-2xl lg:text-5xl font-bold font-mono mb-12">
              Technical Requirements
            </h1>
            
            <div className="space-y-8 text-foreground leading-relaxed">
              <p className="text-lg font-sans">
                Training takes place in a <span className="text-highlight font-semibold">virtual environment</span>. 
                Participants connect via <span className="text-highlight font-semibold">RDP from their own devices</span>.
              </p>
              
              <div className="space-y-6">
                <h2 className="text-primary text-2xl font-bold font-mono">
                  Requirements
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
                    <h3 className="text-primary text-lg font-semibold font-mono mb-3">
                      System
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li>• Modern computer (Windows/Mac/Linux)</li>
                      <li>• 8GB RAM minimum</li>
                      <li>• Stable internet (10+ Mbps)</li>
                      <li>• 1920x1080 resolution</li>
                      <li>• RDP client installed</li>
                    </ul>
                  </div>
                  
                  <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg p-6">
                    <h3 className="text-highlight text-lg font-semibold font-mono mb-3">
                      Network
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li>• <span className="font-mono">RDP: 3389/tcp</span></li>
                      <li>• <span className="font-mono">HTTPS: 443/tcp</span></li>
                      <li>• Test connectivity beforehand</li>
                      <li>• Backup communication ready</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="pt-8">
                <div className="flex justify-between space-x-4">
                  <a 
                    href="/training" 
                    className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-lg hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-6 py-3 inline-block"
                  >
                    Back to Training
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

export default TechnicalRequirements;