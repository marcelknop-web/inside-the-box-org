import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const Publications = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Content */}
          <div className="space-y-8">
            <h1 className="text-primary text-xl sm:text-2xl lg:text-5xl font-bold font-mono mb-12">
              Publications, Trainings
            </h1>
            
            <div className="space-y-8 text-foreground leading-relaxed">
              <p className="text-lg font-sans mb-8">
                Industry publications, thought leadership content, and specialized training programs.
              </p>
              
              {/* Publications Overview */}
              <div className="space-y-6">
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
                  <h2 className="text-primary text-xl font-bold font-mono mb-4">Cyber Training Ranges, iX 10/2021</h2>
                  <p className="text-sm text-foreground/80 mb-3">
                    Article about Cyber Training Ranges for conducting cyber crisis exercises (German).
                  </p>
                  <div className="space-y-2">
                    <a href="https://www.heise.de/select/ix/2021/10/2019809530193925811" target="_blank" rel="noopener noreferrer" className="text-highlight hover:text-primary transition-electric text-sm underline block">
                      Read on heise.de
                    </a>
                    <a href="https://www.inside-the-box.org/_files/ugd/11f56a_252cf48472d945c3939701c64918059d.pdf" target="_blank" rel="noopener noreferrer" className="text-highlight hover:text-primary transition-electric text-sm underline block">
                      Download PDF
                    </a>
                  </div>
                </div>
                
                <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg p-6">
                  <h2 className="text-highlight text-xl font-bold font-mono mb-4">Management of Cyber Crises, iX 07/2015</h2>
                  <p className="text-sm text-foreground/80 mb-3">
                    Article on management of crisis, and specifically on cyber crisis (German).
                  </p>
                  <div className="space-y-2">
                    <a href="https://www.heise.de/select/ix/archiv/2015/7/seite-78" target="_blank" rel="noopener noreferrer" className="text-highlight hover:text-primary transition-electric text-sm underline block">
                      Read on heise.de
                    </a>
                    <a href="https://www.inside-the-box.org/_files/ugd/11f56a_42590b73cc604856be569cda33e694e1.pdf" target="_blank" rel="noopener noreferrer" className="text-highlight hover:text-primary transition-electric text-sm underline block">
                      Download PDF
                    </a>
                  </div>
                </div>
                
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                  <h2 className="text-primary text-xl font-bold font-mono mb-4">DENIC Annual Meeting Keynote</h2>
                  <p className="text-sm text-foreground/80 mb-3">
                    Distinctive elements and obstacles in the management of cyber crises (German).
                  </p>
                  <a href="https://vimeo.com/295582173" target="_blank" rel="noopener noreferrer" className="text-highlight hover:text-primary transition-electric text-sm underline">
                    Watch on Vimeo
                  </a>
                </div>
                
                <div className="bg-highlight/5 border border-highlight/20 rounded-lg p-6">
                  <h2 className="text-highlight text-xl font-bold font-mono mb-4">Training & Certification</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-foreground/80">
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">ISACA Programs</h3>
                      <p>Cybersecurity expert training and certification programs.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Industry Content</h3>
                      <p>Published articles and thought leadership in cybersecurity publications.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Conference Presentations</h3>
                      <p>Keynote speeches and presentations at industry conferences.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Educational Resources</h3>
                      <p>Training materials and educational content for cybersecurity professionals.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-8">
                <div className="flex justify-center lg:justify-start space-x-4 flex-wrap gap-y-4">
                  <a 
                    href="/consulting" 
                    className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-lg hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-6 py-3 inline-block"
                  >
                    All Consulting Services
                  </a>
                  <a 
                    href="/consulting/team" 
                    className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-lg hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-6 py-3 inline-block"
                  >
                    Meet Our Team
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

export default Publications;