export const Footer = () => {
  return (
    <footer className="border-t border-border py-6 mt-16 bg-gradient-to-b from-transparent to-black/40 relative">
      {/* Dark overlay that extends beyond footer */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background"></div>
      <div className="absolute top-0 left-0 right-0 bottom-[-100vh] bg-gradient-to-b from-transparent to-black/60"></div>
      
      <div className="container mx-auto px-6 relative z-10">
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