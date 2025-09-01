import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Content */}
          <div className="space-y-8">
            <h1 className="text-highlight text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">
              Why?
            </h1>
            
            <div className="space-y-8 text-foreground leading-relaxed">
              <p className="text-lg font-sans">
                Analysis of cyber incidents consistently demonstrates that <span className="text-highlight font-semibold">human factors contribute significantly to response delays</span>. 
                Organizations frequently experience coordination challenges and procedural gaps during critical security events.
              </p>
              
              <p className="text-lg font-sans">
                Our approach utilizes <span className="text-highlight font-semibold">controlled simulation environments</span> where teams can 
                develop competencies through <span className="text-highlight font-semibold">realistic attack scenarios</span>. This methodology enables 
                practical skill development in crisis coordination and incident response procedures.
              </p>
              
              <p className="text-lg font-sans">
                The curriculum integrates <span className="text-highlight font-semibold">technical capabilities with organizational crisis management</span> 
                to address comprehensive incident response requirements.
              </p>
              
              <div className="pt-8">
                <div className="flex justify-center lg:justify-start space-x-4">
                  <a 
                    href="/training" 
                    className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-lg hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-6 py-3 inline-block"
                  >
                    What?
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

export default Index;