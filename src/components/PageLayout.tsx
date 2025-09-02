import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ReactNode } from 'react';

interface PageLayoutProps {
  children: ReactNode;
  maxWidth?: 'default' | 'wide';
}

export const PageLayout = ({ children, maxWidth = 'default' }: PageLayoutProps) => {
  const containerClass = maxWidth === 'wide' ? 'max-w-6xl' : 'max-w-4xl';
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-6 py-12">
        <div className={`${containerClass} mx-auto`}>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};