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
            <h1 className="text-highlight text-5xl font-bold font-mono mb-12">
              Technical Requirements
            </h1>
            
            <div className="space-y-8 text-foreground leading-relaxed">
              <p className="text-lg font-sans">
                The training takes place in a <span className="text-highlight font-semibold">virtual environment</span> that simulates a realistic 
                corporate IT infrastructure. Participants connect via RDP from their own devices.
              </p>
              
              <div className="space-y-6">
                <h2 className="text-primary text-2xl font-bold font-mono hover:text-highlight transition-electric">
                  Requirements
                </h2>
                
                <div className="card-electric">
                  <ul className="space-y-3 text-lg">
                    <li>• Modern computer (Windows, macOS, or Linux)</li>
                    <li>• Stable internet connection (minimum 10 Mbps)</li>
                    <li>• RDP client (built-in on Windows, download for Mac/Linux)</li>
                    <li>• Access to port 3389/tcp for RDP connections</li>
                  </ul>
                </div>
              </div>
              
              <div className="pt-8">
                <div className="flex justify-center lg:justify-start">
                  <a 
                    href="/training" 
                    className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-lg hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-6 py-3 inline-block"
                  >
                    Back to Training
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