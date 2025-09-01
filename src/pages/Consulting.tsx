import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const Consulting = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Content */}
          <div className="space-y-8">
            <h1 className="text-primary text-5xl font-bold font-mono mb-12">
              Cybersecurity Consulting
            </h1>
            
            <div className="space-y-8 text-foreground leading-relaxed">
              <p className="text-lg font-sans mb-8">
                Comprehensive cybersecurity consulting services tailored to your organization's needs.
              </p>
              
              {/* Services Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ISMS ISO 27001, BSI GS */}
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6 hover:bg-primary/20 hover:border-primary/50 transition-electric">
                  <h3 className="text-primary text-lg font-semibold font-mono mb-3">
                    ISMS ISO 27001, BSI GS
                  </h3>
                  <p className="text-sm text-foreground/80">
                    Information Security Management System implementation and certification according to ISO 27001 and BSI IT-Grundschutz standards.
                  </p>
                </div>

                {/* NIS-2, DORA */}
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6 hover:bg-primary/20 hover:border-primary/50 transition-electric">
                  <h3 className="text-primary text-lg font-semibold font-mono mb-3">
                    NIS-2, DORA, PART-IS
                  </h3>
                  <p className="text-sm text-foreground/80">
                    Network and Information Security Directive, Digital Operational Resilience Act, and PART-IS compliance consulting.
                  </p>
                </div>

                {/* TISAX, PCI-DSS */}
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6 hover:bg-primary/20 hover:border-primary/50 transition-electric">
                  <h3 className="text-primary text-lg font-semibold font-mono mb-3">
                    TISAX, PCI-DSS
                  </h3>
                  <p className="text-sm text-foreground/80">
                    Trusted Information Security Assessment Exchange and Payment Card Industry Data Security Standard implementation.
                  </p>
                </div>

                {/* Assessments & Concepts */}
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6 hover:bg-primary/20 hover:border-primary/50 transition-electric">
                  <h3 className="text-primary text-lg font-semibold font-mono mb-3">
                    Assessments & Concepts
                  </h3>
                  <p className="text-sm text-foreground/80">
                    Comprehensive security assessments and strategic cybersecurity concept development.
                  </p>
                </div>

                {/* Incident Management */}
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6 hover:bg-primary/20 hover:border-primary/50 transition-electric">
                  <h3 className="text-primary text-lg font-semibold font-mono mb-3">
                    Incident Management
                  </h3>
                  <p className="text-sm text-foreground/80">
                    Security incident response planning, implementation, and crisis management procedures.
                  </p>
                </div>

                {/* Cyber Crisis Management */}
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6 hover:bg-primary/20 hover:border-primary/50 transition-electric">
                  <h3 className="text-primary text-lg font-semibold font-mono mb-3">
                    Cyber Crisis Management
                  </h3>
                  <p className="text-sm text-foreground/80">
                    Crisis management strategy development and cyber crisis simulation exercises.
                  </p>
                </div>

                {/* Arena Training, TIBER Test */}
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6 hover:bg-primary/20 hover:border-primary/50 transition-electric">
                  <h3 className="text-primary text-lg font-semibold font-mono mb-3">
                    Arena Training, TIBER Test
                  </h3>
                  <p className="text-sm text-foreground/80">
                    Threat Intelligence-based Ethical Red Teaming and advanced cybersecurity training programs.
                  </p>
                </div>

                {/* Events & Workshops */}
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6 hover:bg-primary/20 hover:border-primary/50 transition-electric">
                  <h3 className="text-primary text-lg font-semibold font-mono mb-3">
                    Events & Workshops
                  </h3>
                  <p className="text-sm text-foreground/80">
                    Cybersecurity awareness workshops, training events, and educational seminars.
                  </p>
                </div>

                {/* Publications, Trainings */}
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6 hover:bg-primary/20 hover:border-primary/50 transition-electric">
                  <h3 className="text-primary text-lg font-semibold font-mono mb-3">
                    Publications, Trainings
                  </h3>
                  <p className="text-sm text-foreground/80">
                    Industry publications, thought leadership content, and specialized training programs.
                  </p>
                </div>

                {/* Virtual CISO */}
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6 hover:bg-primary/20 hover:border-primary/50 transition-electric">
                  <h3 className="text-primary text-lg font-semibold font-mono mb-3">
                    Virtual CISO
                  </h3>
                  <p className="text-sm text-foreground/80">
                    Outsourced Chief Information Security Officer services for strategic cybersecurity leadership.
                  </p>
                </div>
              </div>
              
              <div className="pt-8">
                <div className="flex justify-center lg:justify-start">
                  <a 
                    href="/consulting/team" 
                    className="bg-highlight/10 border-2 border-highlight/30 rounded-lg text-highlight font-mono text-lg hover:text-primary hover:bg-highlight/20 hover:border-highlight/50 transition-electric px-6 py-3 inline-block"
                  >
                    By Whom?
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

export default Consulting;