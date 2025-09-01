export const Footer = () => {
  return (
    <footer className="border-t border-border py-6 mt-16 bg-gradient-to-b from-background to-black/90 min-h-[20vh] relative">
      {/* Very dark background extending to page bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black/90"></div>
      <div className="absolute top-0 left-0 right-0 h-screen bg-gradient-to-b from-transparent to-black/95"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex justify-center">
          <a 
            href="/imprint" 
            className="text-foreground/80 hover:text-primary transition-electric text-sm font-mono"
          >
            Imprint
          </a>
        </div>
      </div>
      
      {/* Ensure page extends to bottom with dark background */}
      <div className="absolute top-full left-0 right-0 h-screen bg-black/95"></div>
    </footer>
  );
};