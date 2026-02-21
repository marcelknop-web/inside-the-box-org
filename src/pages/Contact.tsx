import { PageLayout } from '@/components/PageLayout';
import { Footer } from '@/components/Footer';
import { PageNavButtons } from '@/components/PageNavButtons';
import { Phone, Mail } from 'lucide-react';

const Contact = () => {
  return (
    <PageLayout>
      <div className="space-y-8">
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">
          Contact
        </h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans">
            Talk to Marcel.
          </p>
          
          {/* Contact Methods */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-3">
                <Phone size={24} className="text-primary" />
                <h3 className="text-primary text-lg font-semibold">Phone</h3>
              </div>
              <div className="space-y-2 text-base sm:text-lg">
                <p><a href="tel:+4915205691648" className="text-primary hover:text-highlight transition-electric">+49 1520 569 1648</a></p>
              </div>
            </div>
            
            <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-3">
                <Mail size={24} className="text-primary" />
                <h3 className="text-primary text-lg font-semibold">Email</h3>
              </div>
              <div className="space-y-2 text-base sm:text-lg">
                <p><a href="mailto:marcel@inside-the-box.org" className="text-primary hover:text-highlight transition-electric">marcel@inside-the-box.org</a></p>
              </div>
            </div>
          </div>
          
          <PageNavButtons buttons={[
            { href: '/why', label: 'View Training' },
            { href: '/consulting', label: 'View Consulting' },
          ]} />
        </div>
      </div>
      <div className="mt-16">
        <Footer />
      </div>
    </PageLayout>
  );
};

export default Contact;