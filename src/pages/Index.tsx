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
                When cyber incidents happen, <span className="text-highlight font-semibold">human error causes most of the confusion and delays</span>. 
                We've seen it countless times - teams scramble, communication breaks down, and valuable time gets wasted.
              </p>
              
              <p className="text-lg font-sans">
                That's why we built a <span className="text-highlight font-semibold">realistic training environment</span> where your team can 
                practice handling real attacks safely. No guesswork, no theoretical scenarios - just hands-on experience with 
                <span className="text-highlight font-semibold">actual attack simulations</span> and cross-team coordination.
              </p>
              
              <p className="text-lg font-sans">
                Our training combines <span className="text-highlight font-semibold">technical defense skills with crisis management</span> - 
                because when seconds count, you need both.
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