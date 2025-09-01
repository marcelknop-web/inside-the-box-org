import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AlertTriangle, Target, Users, Shield } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Service Buttons */}
          <div className="flex justify-center space-x-4 mb-16">
            <a 
              href="/consulting" 
              className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-lg hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-8 py-4 inline-block"
            >
              Cybersecurity Consulting
            </a>
            <a 
              href="/training" 
              className="bg-highlight/10 border-2 border-highlight/30 rounded-lg text-highlight font-mono text-lg hover:text-primary hover:bg-highlight/20 hover:border-highlight/50 transition-electric px-8 py-4 inline-block"
            >
              Cyber Training Range
            </a>
          </div>
          
          {/* Content */}
          <div className="space-y-8">
            <h2 className="text-highlight text-2xl sm:text-3xl lg:text-4xl font-bold font-mono mb-12">
              Why?
            </h2>
            
            <div className="space-y-8 text-foreground leading-relaxed">
              <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <AlertTriangle className="text-primary mt-1 flex-shrink-0" size={28} />
                  <p className="text-lg font-sans">
                    Cyber incidents reveal that <span className="text-primary font-semibold">human factors cause most response delays</span>. 
                    Organizations face coordination challenges during critical security events.
                  </p>
                </div>
              </div>
              
              <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <Target className="text-primary mt-1 flex-shrink-0" size={28} />
                  <p className="text-lg font-sans">
                    Our <span className="text-primary font-semibold">simulation environments</span> enable teams to develop competencies through 
                    <span className="text-primary font-semibold">realistic attack scenarios</span> and practical crisis coordination.
                  </p>
                </div>
              </div>
              
              <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <Shield className="text-primary mt-1 flex-shrink-0" size={28} />
                  <p className="text-lg font-sans">
                    Training integrates <span className="text-primary font-semibold">technical capabilities with crisis management</span>.
                  </p>
                </div>
              </div>
              
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