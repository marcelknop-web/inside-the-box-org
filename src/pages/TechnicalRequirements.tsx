import { Header } from '@/components/Header';

const TechnicalRequirements = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Content */}
          <div className="space-y-8">
            <h1 className="text-highlight text-5xl font-bold font-mono mb-12">
              Technical Requirements
            </h1>
            
            <div className="space-y-8 text-foreground leading-relaxed">
              <p className="text-lg font-sans">
                The training takes place in a <span className="text-highlight font-semibold">virtual environment</span> that simulates a realistic 
                corporate IT infrastructure. Participants connect to this environment via a web browser 
                from their own devices.
              </p>
              
              <div className="space-y-6">
                <h2 className="text-electric text-2xl font-bold font-mono hover:text-highlight transition-electric">
                  System Requirements
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card-electric">
                    <h3 className="text-highlight text-lg font-semibold mb-3">Hardware</h3>
                    <ul className="space-y-2 text-sm">
                      <li>• Modern computer (Windows, macOS, or Linux)</li>
                      <li>• Minimum 8GB RAM</li>
                      <li>• Stable internet connection (minimum 10 Mbps)</li>
                      <li>• Screen resolution: 1920x1080 or higher</li>
                    </ul>
                  </div>
                  
                  <div className="card-electric">
                    <h3 className="text-highlight text-lg font-semibold mb-3">Software</h3>
                    <ul className="space-y-2 text-sm">
                      <li>• Modern web browser (Chrome, Firefox, Safari, Edge)</li>
                      <li>• JavaScript enabled</li>
                      <li>• VPN client (if required by organization)</li>
                      <li>• SSH client (built-in or PuTTY)</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <h2 className="text-electric text-2xl font-bold font-mono hover:text-highlight transition-electric">
                  Network Requirements
                </h2>
                
                <p className="text-lg font-sans">
                  The training environment requires <span className="text-highlight font-semibold">outbound internet access</span> on specific ports. 
                  Corporate firewalls may need to be configured to allow:
                </p>
                
                <div className="card-electric">
                  <h3 className="text-highlight text-lg font-semibold mb-3">Required Ports</h3>
                  <ul className="space-y-2 text-sm font-mono">
                    <li>• HTTPS (443/tcp) - Web interface access</li>
                    <li>• SSH (22/tcp) - Terminal access</li>
                    <li>• RDP (3389/tcp) - Windows systems access</li>
                    <li>• Custom ports (8000-8999/tcp) - Application services</li>
                  </ul>
                </div>
              </div>
              
              <div className="space-y-6">
                <h2 className="text-electric text-2xl font-bold font-mono hover:text-highlight transition-electric">
                  Preparation
                </h2>
                
                <p className="text-lg font-sans">
                  Before the training session, participants should:
                </p>
                
                <ul className="space-y-3 text-lg font-sans ml-6">
                  <li>• Test their internet connection and browser compatibility</li>
                  <li>• Ensure they have <span className="text-highlight font-semibold">administrative rights</span> on their device</li>
                  <li>• Install any required VPN software</li>
                  <li>• Verify access to the training platform URL</li>
                </ul>
              </div>
              
              <div className="pt-8">
                <div className="flex justify-center lg:justify-start">
                  <a 
                    href="/" 
                    className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-lg hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-6 py-3 inline-block"
                  >
                    Why?
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

export default TechnicalRequirements;