import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Target, Users, Shield, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const TrainingIntro = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-primary text-3xl sm:text-4xl lg:text-6xl font-bold font-mono mb-8 hover:text-highlight transition-electric">
              Why Training?
            </h1>
            
            <p className="text-xl text-foreground font-sans leading-relaxed mb-8">
              In cybersecurity, <span className="text-highlight font-semibold">technical knowledge alone isn't enough</span>. 
              Real incidents demand coordinated response under extreme pressure.
            </p>
          </div>

          {/* Key Points */}
          <div className="space-y-8 mb-16">
            <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-8">
              <div className="flex items-start space-x-6">
                <Target className="text-primary mt-2 flex-shrink-0" size={32} />
                <div>
                  <h3 className="text-primary text-xl font-bold font-mono mb-4">
                    Realistic Scenarios
                  </h3>
                  <p className="text-foreground text-lg font-sans leading-relaxed">
                    Our simulations replicate actual attack patterns and organizational pressures. 
                    Teams learn to respond effectively when <span className="text-highlight font-semibold">every minute counts</span>.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg p-8">
              <div className="flex items-start space-x-6">
                <Users className="text-highlight mt-2 flex-shrink-0" size={32} />
                <div>
                  <h3 className="text-highlight text-xl font-bold font-mono mb-4">
                    Team Coordination
                  </h3>
                  <p className="text-foreground text-lg font-sans leading-relaxed">
                    Cyber incidents are <span className="text-highlight font-semibold">team efforts</span>. 
                    Practice communication protocols, decision-making processes, and crisis management 
                    in controlled environments.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-8">
              <div className="flex items-start space-x-6">
                <Shield className="text-primary mt-2 flex-shrink-0" size={32} />
                <div>
                  <h3 className="text-primary text-xl font-bold font-mono mb-4">
                    Competency Building
                  </h3>
                  <p className="text-foreground text-lg font-sans leading-relaxed">
                    Move beyond theoretical knowledge. Develop <span className="text-highlight font-semibold">practical skills</span> 
                    through hands-on exercises that mirror real-world incidents.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <p className="text-lg text-foreground font-sans mb-8">
              Ready to strengthen your team's response capabilities?
            </p>
            
            <Link 
              to="/training-topics"
              className="bg-highlight/10 border-2 border-highlight/30 rounded-lg text-highlight font-mono text-lg hover:text-primary hover:bg-highlight/20 hover:border-highlight/50 transition-electric inline-flex items-center space-x-3 px-8 py-4"
            >
              <span>Explore Training Topics</span>
              <ArrowRight size={20} />
            </Link>
          </div>
          
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TrainingIntro;