import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Phone, Mail } from 'lucide-react';
import { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
    // Reset form
    setFormData({ name: '', email: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Content */}
          <div className="space-y-8">
            <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">
              Contact
            </h1>
            
            <div className="space-y-8 text-foreground leading-relaxed">
              <p className="text-lg font-sans">
                Let's talk.
              </p>
              
              {/* Contact Methods */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6 hover:bg-primary/20 hover:border-primary/50 transition-electric">
                  <div className="flex items-center space-x-3 mb-3">
                    <Phone size={24} className="text-primary" />
                    <h3 className="text-primary text-lg font-semibold">Phone</h3>
                  </div>
                  <div className="space-y-2 text-base sm:text-lg">
                    <p><a href="tel:+4915205691648" className="text-highlight hover:text-primary transition-electric">+49 1520 569 1648</a></p>
                  </div>
                </div>
                
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6 hover:bg-primary/20 hover:border-primary/50 transition-electric">
                  <div className="flex items-center space-x-3 mb-3">
                    <Mail size={24} className="text-primary" />
                    <h3 className="text-primary text-lg font-semibold">Email</h3>
                  </div>
                  <div className="space-y-2 text-base sm:text-lg">
                    <p><a href="mailto:marcel@inside-the-box.org" className="text-highlight hover:text-primary transition-electric">marcel@inside-the-box.org</a></p>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="bg-highlight/5 border border-highlight/20 rounded-lg p-6">
                <h2 className="text-highlight text-2xl font-bold font-mono mb-6">
                  Quick Request
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Input
                        type="text"
                        name="name"
                        placeholder="Your Name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="bg-background border-border focus:border-highlight"
                      />
                    </div>
                    <div>
                      <Input
                        type="email"
                        name="email"
                        placeholder="Your Email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="bg-background border-border focus:border-highlight"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Textarea
                      name="message"
                      placeholder="Your message or questions about our training programs..."
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={4}
                      className="bg-background border-border focus:border-highlight resize-none"
                    />
                  </div>
                  
                  <Button 
                    type="submit"
                    className="bg-highlight/10 border-2 border-highlight/30 rounded-lg text-highlight font-mono hover:text-primary hover:bg-highlight/20 hover:border-highlight/50 transition-electric px-6 py-3"
                  >
                    Send Request
                  </Button>
                </form>
              </div>
              
              <div className="pt-8">
                <div className="flex justify-center lg:justify-start space-x-4">
                  <a 
                    href="/why" 
                    className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-lg hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-6 py-3 inline-block"
                  >
                    View Training
                  </a>
                  <a 
                    href="/consulting" 
                    className="bg-primary/10 border-2 border-primary/30 rounded-lg text-primary font-mono text-lg hover:text-highlight hover:bg-primary/20 hover:border-primary/50 transition-electric px-6 py-3 inline-block"
                  >
                    View Consulting
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

export default Contact;