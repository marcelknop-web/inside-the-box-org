export const Footer = () => {
  return (
    <footer className="border-t border-border py-6 mt-16 bg-gradient-to-b from-background to-black/80">
      <div className="container mx-auto px-6">
        <div className="flex justify-center">
          <a 
            href="/imprint" 
            className="text-foreground/70 hover:text-primary transition-electric text-sm font-mono"
          >
            Imprint
          </a>
        </div>
      </div>
    </footer>
  );
};