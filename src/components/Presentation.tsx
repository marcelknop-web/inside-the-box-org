import { useState } from 'react';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { GeometricSymbol } from './GeometricSymbol';

interface Slide {
  id: number;
  title: string;
  content: string[];
  type: 'title' | 'content' | 'image' | 'section';
}

const defaultSlides: Slide[] = [
  {
    id: 1,
    type: 'title',
    title: 'Your Presentation Title',
    content: ['Subtitle or tagline goes here', 'inside-the-box.org']
  },
  {
    id: 2,
    type: 'section',
    title: 'Section Title',
    content: ['Section overview or agenda']
  },
  {
    id: 3,
    type: 'content',
    title: 'Content Slide',
    content: [
      'Key point number one',
      'Second important insight',
      'Third bullet point',
      'Supporting detail or conclusion'
    ]
  },
  {
    id: 4,
    type: 'content',
    title: 'Thank You',
    content: ['Questions & Discussion', 'inside-the-box.org', 'contact@inside-the-box.org']
  }
];

interface PresentationProps {
  slides?: Slide[];
  onExit?: () => void;
}

export const Presentation = ({ slides = defaultSlides, onExit }: PresentationProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const slide = slides[currentSlide];

  const renderSlide = () => {
    switch (slide.type) {
      case 'title':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
            <GeometricSymbol size="lg" />
            <div className="space-y-6">
              <h1 className="text-6xl md:text-8xl font-mono text-primary animate-glow">
                {slide.title}
              </h1>
              {slide.content.map((line, index) => (
                <p key={index} className={`text-2xl md:text-4xl font-mono ${
                  index === slide.content.length - 1 ? 'text-highlight' : 'text-foreground/80'
                }`}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        );

      case 'section':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-12">
            <div className="w-32 h-32 border-4 border-highlight rounded-lg animate-pulse-slow"></div>
            <h1 className="text-5xl md:text-7xl font-mono text-highlight animate-glow">
              {slide.title}
            </h1>
            {slide.content.map((line, index) => (
              <p key={index} className="text-xl md:text-3xl font-mono text-foreground/70">
                {line}
              </p>
            ))}
          </div>
        );

      default:
        return (
          <div className="flex flex-col h-full p-16">
            <h1 className="text-4xl md:text-6xl font-mono text-primary mb-16 animate-glow">
              {slide.title}
            </h1>
            <div className="flex-1 flex flex-col justify-center space-y-8">
              {slide.content.map((point, index) => (
                <div key={index} className="flex items-center space-x-6">
                  <div className="w-4 h-4 border-2 border-highlight rotate-45 animate-pulse"></div>
                  <p className="text-xl md:text-3xl font-mono text-foreground/90">
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-hidden">
      {/* Slide Content */}
      <div className="relative h-full w-full">
        <div className="absolute inset-0 geometric-pattern opacity-5"></div>
        <div className="relative z-10 h-full">
          {renderSlide()}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between">
        <button
          onClick={prevSlide}
          className="bg-primary/20 border-2 border-primary/40 rounded-lg p-3 text-primary hover:text-highlight hover:bg-primary/30 transition-electric"
          disabled={currentSlide === 0}
        >
          <ChevronLeft size={24} />
        </button>

        {/* Slide Indicators */}
        <div className="flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full border-2 transition-electric ${
                index === currentSlide
                  ? 'bg-highlight border-highlight animate-glow'
                  : 'border-primary/40 hover:border-primary'
              }`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          className="bg-primary/20 border-2 border-primary/40 rounded-lg p-3 text-primary hover:text-highlight hover:bg-primary/30 transition-electric"
          disabled={currentSlide === slides.length - 1}
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Exit Button */}
      {onExit && (
        <button
          onClick={onExit}
          className="absolute top-8 right-8 bg-primary/20 border-2 border-primary/40 rounded-lg p-3 text-primary hover:text-highlight hover:bg-primary/30 transition-electric"
        >
          <Home size={24} />
        </button>
      )}

      {/* Slide Counter */}
      <div className="absolute top-8 left-8 bg-primary/20 border-2 border-primary/40 rounded-lg px-4 py-2 text-primary font-mono">
        {currentSlide + 1} / {slides.length}
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-foreground/50 font-mono text-sm">
        Use ← → arrows or click to navigate
      </div>
    </div>
  );
};