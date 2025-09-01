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
            <h1 className="text-highlight text-5xl font-bold font-mono mb-12">
              Why?
            </h1>
            
            <div className="space-y-8 text-foreground leading-relaxed">
              <p className="text-lg font-sans">
                Analyses of past cybersecurity incidents repeatedly show that <span className="text-highlight font-semibold">human error is the most common 
                cause of delays and serious mistakes</span> in dealing with such events. In order to be better prepared for 
                the dynamics and complexity of such rare situations, we have created realistic training in a <span className="text-highlight font-semibold">simulated 
                IT environment</span> ("Cyber Training Range").
              </p>
              
              <p className="text-lg font-sans">
                During the training, participants are introduced to <span className="text-highlight font-semibold">key technologies and techniques</span> for detecting 
                and remediating cyber attacks. This knowledge is then practiced by <span className="text-highlight font-semibold">analyzing and defending against 
                simulated live attacks</span>. Within the cyber training range, participants can safely practice various 
                defense and remediation tactics.
              </p>
              
              <p className="text-lg font-sans">
                In addition, participants gain experience in <span className="text-highlight font-semibold">interdisciplinary cooperation</span> with corporate 
                management and communication, specialist departments and third parties. The training includes 
                <span className="text-highlight font-semibold">technical elements as well as elements of incident, emergency and crisis management</span>.
              </p>
              
              <div className="pt-8">
                <div className="flex justify-center lg:justify-start">
                  <a 
                    href="/training" 
                    className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-lg hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-6 py-3 inline-block"
                  >
                    What?
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