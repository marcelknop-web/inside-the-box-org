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
            <h1 className="text-primary text-5xl font-bold font-mono mb-12">
              Technical Requirements
            </h1>
            
            <div className="space-y-8 text-foreground leading-relaxed">
              <p className="text-lg font-sans">
                The training takes place in a <span className="text-highlight font-semibold">virtual environment</span> that simulates a realistic 
                corporate IT infrastructure. Participants connect via <span className="text-highlight font-semibold">RDP from their own devices</span>.
              </p>
              
              <div className="space-y-6">
                <h2 className="text-primary text-2xl font-bold font-mono hover:text-highlight transition-electric">
                  System Requirements
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6 hover:bg-primary/20 hover:border-primary/50 transition-electric">
                    <h3 className="text-primary text-lg font-semibold font-mono mb-3">
                      Hardware
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li>• Modern computer (Windows, macOS, or Linux)</li>
                      <li>• Minimum 8GB RAM recommended</li>
                      <li>• Stable internet connection (minimum 10 Mbps)</li>
                      <li>• Screen resolution: 1920x1080 or higher</li>
                    </ul>
                  </div>
                  
                  <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg p-6 hover:bg-highlight/20 hover:border-highlight/50 transition-electric">
                    <h3 className="text-highlight text-lg font-semibold font-mono mb-3">
                      Software
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li>• RDP client (built-in on Windows)</li>
                      <li>• Microsoft Remote Desktop (Mac/iOS)</li>
                      <li>• Remmina or similar (Linux)</li>
                      <li>• Administrative rights for software installation</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <h2 className="text-primary text-2xl font-bold font-mono hover:text-highlight transition-electric">
                  Network Configuration
                </h2>
                
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                  <h3 className="text-primary text-lg font-semibold font-mono mb-3">
                    Required Ports
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-mono text-highlight mb-2">• RDP: 3389/tcp</p>
                      <p className="text-xs text-foreground/70">Remote Desktop Protocol access</p>
                    </div>
                    <div>
                      <p className="text-sm font-mono text-highlight mb-2">• HTTPS: 443/tcp</p>
                      <p className="text-xs text-foreground/70">Secure web access (backup)</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <h2 className="text-primary text-2xl font-bold font-mono hover:text-highlight transition-electric">
                  Pre-Training Setup
                </h2>
                
                <div className="bg-highlight/5 border border-highlight/20 rounded-lg p-6">
                  <p className="text-lg font-sans mb-4">
                    <span className="text-highlight font-semibold">Before the training session</span>, participants should:
                  </p>
                  <ul className="space-y-3 text-sm ml-6">
                    <li>• Test RDP client functionality with a test connection</li>
                    <li>• Verify <span className="text-highlight font-semibold">network access</span> to port 3389</li>
                    <li>• Ensure stable internet connection (speed test recommended)</li>
                    <li>• Have <span className="text-highlight font-semibold">backup communication</span> method ready (phone/email)</li>
                  </ul>
                </div>
              </div>
              
              <div className="pt-8">
                <div className="flex justify-center lg:justify-start space-x-4">
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