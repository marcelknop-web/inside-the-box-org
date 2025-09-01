import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const About = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Content */}
          <div className="space-y-8">
            <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">
              About
            </h1>
            
            <div className="space-y-8 text-foreground leading-relaxed">
              <p className="text-lg font-sans">
                <span className="text-highlight font-semibold">INSIDE THE BOX</span> helps organizations build real cybersecurity resilience through practical training and expert guidance.
              </p>
              
              <div className="space-y-6">
                <p className="text-lg font-sans">
                  We believe cybersecurity isn't just about tools and policies - it's about people knowing exactly what to do when things go wrong.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6 hover:bg-primary/20 hover:border-primary/50 transition-electric">
                    <h3 className="text-primary text-xl font-bold font-mono mb-4">Training</h3>
                    <p className="text-sm text-foreground/80">
                      Hands-on cyber training that simulates real attacks. Your team learns by doing, 
                      not just reading about it.
                    </p>
                  </div>
                  
                  <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg p-6 hover:bg-highlight/20 hover:border-highlight/50 transition-electric">
                    <h3 className="text-highlight text-xl font-bold font-mono mb-4">Consulting</h3>
                    <p className="text-sm text-foreground/80">
                      Strategic cybersecurity advice that actually works. We help you build defenses 
                      that fit your organization's reality.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="pt-8">
                <div className="flex justify-center lg:justify-start">
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

export default About;