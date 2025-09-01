import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const AssessmentsConcepts = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Content */}
          <div className="space-y-8">
            <h1 className="text-primary text-xl sm:text-2xl lg:text-5xl font-bold font-mono mb-12">
              Assessments & Concepts
            </h1>
            
            <div className="space-y-8 text-foreground leading-relaxed">
              <p className="text-lg font-sans mb-8">
                Security assessment and concept development for responsible digitalization.
              </p>
              
              {/* Services Overview */}
              <div className="space-y-6">
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
                  <h2 className="text-primary text-xl font-bold font-mono mb-4">Threat & Risk Assessment</h2>
                  <p className="text-base sm:text-lg text-foreground/80 mb-4">
                    Comprehensive identification and analysis of cybersecurity threats and organizational risk exposure.
                  </p>
                  <ul className="text-base sm:text-lg text-foreground/80 space-y-2">
                    <li>• Threat landscape analysis and attack vectors</li>
                    <li>• Asset inventory and criticality assessment</li>
                    <li>• Risk quantification and business impact evaluation</li>
                  </ul>
                </div>
                
                <div className="bg-highlight/10 border-2 border-highlight/30 rounded-lg p-6">
                  <h2 className="text-highlight text-xl font-bold font-mono mb-4">Security Controls Design</h2>
                  <p className="text-base sm:text-lg text-foreground/80 mb-4">
                    Development of tailored security control frameworks addressing identified risks and compliance requirements.
                  </p>
                  <ul className="text-base sm:text-lg text-foreground/80 space-y-2">
                    <li>• Control objective definition and mapping</li>
                    <li>• Technical and organizational measure specification</li>
                    <li>• Cost-benefit analysis and investment prioritization</li>
                  </ul>
                </div>
                
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                  <h2 className="text-primary text-xl font-bold font-mono mb-4">Roles & Responsibilities</h2>
                  <p className="text-base sm:text-lg text-foreground/80 mb-4">
                    Definition of organizational roles, responsibilities, and governance structures for security management.
                  </p>
                  <ul className="text-base sm:text-lg text-foreground/80 space-y-2">
                    <li>• Security governance framework</li>
                    <li>• Role definition and responsibility assignment</li>
                    <li>• Escalation procedures and decision-making</li>
                  </ul>
                </div>
                
                <div className="bg-highlight/5 border border-highlight/20 rounded-lg p-6">
                  <h2 className="text-highlight text-xl font-bold font-mono mb-4">Implementation Planning</h2>
                  <p className="text-base sm:text-lg text-foreground/80 mb-4">
                    Strategic roadmap development for systematic security concept implementation and operationalization.
                  </p>
                  <ul className="text-base sm:text-lg text-foreground/80 space-y-2">
                    <li>• Implementation phasing and milestones</li>
                    <li>• Resource planning and budget allocation</li>
                    <li>• Change management and communication</li>
                  </ul>
                </div>
                
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
                  <h2 className="text-primary text-xl font-bold font-mono mb-4">Measurement & Monitoring</h2>
                  <p className="text-base sm:text-lg text-foreground/80 mb-4">
                    Establishment of metrics, monitoring capabilities, and continuous improvement processes.
                  </p>
                  <ul className="text-base sm:text-lg text-foreground/80 space-y-2">
                    <li>• KPI definition and measurement</li>
                    <li>• Security dashboard and reporting</li>
                    <li>• Continuous monitoring and improvement</li>
                  </ul>
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

export default AssessmentsConcepts;