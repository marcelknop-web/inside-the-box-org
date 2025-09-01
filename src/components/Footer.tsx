export const Footer = () => {
  return (
    <footer className="border-t border-border py-6 mt-16">
      <div className="container mx-auto px-6">
        <div className="flex justify-center">
          <a 
            href="/imprint" 
            className="text-foreground/60 hover:text-primary transition-electric text-sm font-mono"
          >
            Imprint
          </a>
        </div>
      </div>
    </footer>
  );
};