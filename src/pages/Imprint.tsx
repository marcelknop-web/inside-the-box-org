import { PageLayout } from '@/components/PageLayout';
import { PageNavButtons } from '@/components/PageNavButtons';

const Imprint = () => {
  return (
    <PageLayout>
      <div className="space-y-8">
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">
          Imprint
        </h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <div className="space-y-4">
            <p className="text-lg font-sans">
              <span className="text-highlight font-semibold">Responsible for content</span><br />
              Marcel Knop<br />
              Appenrother Weg 14<br />
              34308 Bad Emstal, Germany
            </p>
            
            <p className="text-lg font-sans">
              <span className="text-highlight font-semibold">Contact</span><br />
              <a href="mailto:marcel@inside-the-box.org" className="text-foreground hover:text-primary transition-electric">marcel@inside-the-box.org</a><br />
              <a href="tel:+4915205691648" className="text-foreground hover:text-primary transition-electric">+49 1520 569 1648</a>
            </p>
            
            <p className="text-lg font-sans">
              <span className="text-highlight font-semibold">VAT ID</span> DE328906053
            </p>
            
            <p className="text-lg font-sans">
              <span className="text-highlight font-semibold">Professional liability insurance</span><br />
              Hiscox SA<br />
              Arnulfstr. 31<br />
              80636 Munich, Germany
            </p>
          </div>
          
          <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
            <h2 className="text-primary text-xl font-bold font-mono mb-4">Disclaimer</h2>
            <p className="text-base text-foreground/80">
              Despite careful content control, I assume no liability for the content of external links. 
              The operators of linked pages are solely responsible for their content. Liability for own 
              content complies with § 7 TMG. Obligations to remove or block content remain unaffected 
              upon knowledge of a concrete legal violation.
            </p>
          </div>
          
          <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
            <h2 className="text-primary text-xl font-bold font-mono mb-4">Copyright</h2>
            <p className="text-base text-foreground/80">
              All content on this site is subject to German copyright law. If you notice any violations, please notify me — I will remove 
              the content promptly. Use beyond private purposes requires written consent.
            </p>
          </div>
          
          <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
            <h2 className="text-primary text-xl font-bold font-mono mb-4">Data Protection</h2>
            <p className="text-base text-foreground/80">
              Use of published contact data for unsolicited advertising is prohibited.
            </p>
          </div>
          
          <PageNavButtons buttons={[
            { href: '/training', label: 'Training' },
            { href: '/consulting', label: 'Consulting' },
            { href: '/contact', label: 'Contact', variant: 'highlight' },
          ]} />
        </div>
      </div>
    </PageLayout>
  );
};

export default Imprint;