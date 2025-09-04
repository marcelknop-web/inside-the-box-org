import { useLocation } from 'react-router-dom';

export const Footer = () => {
  const location = useLocation();
  const isImprintPage = location.pathname === '/imprint';
  
  return (
    <footer className="border-t border-border py-6 mt-16 bg-black">
      <div className="container mx-auto px-6">
        <div className="flex justify-center items-center space-x-6">
          {!isImprintPage && (
            <a 
              href="/imprint" 
              className="text-foreground/70 hover:text-primary transition-electric text-sm font-mono"
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