import { useLocation } from 'react-router-dom';

export const Footer = () => {
  const location = useLocation();
  const isImprintPage = location.pathname === '/imprint';
  
  return (
    <footer className="py-6 mt-16">
      <div className="container mx-auto px-6">
        <div className="flex justify-center items-center space-x-6">
          {!isImprintPage && (
            <a 
              href="/imprint" 
              className="bg-highlight/10 border-2 border-highlight/30 rounded-lg text-highlight font-mono text-sm hover:text-primary hover:bg-highlight/20 hover:border-highlight/50 transition-electric px-4 py-2"
            >
              Imprint
            </a>
          )}
          {isImprintPage && (
            <p className="text-foreground/70 text-sm font-mono">
              Last updated: 4th September, 2025
            </p>
          )}
        </div>
      </div>
    </footer>
  );
};