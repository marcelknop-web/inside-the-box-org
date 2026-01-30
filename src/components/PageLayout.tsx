import { Header } from '@/components/Header';
import { ReactNode } from 'react';

interface PageLayoutProps {
  children: ReactNode;
  maxWidth?: 'default' | 'wide';
}

export const PageLayout = ({ children, maxWidth = 'default' }: PageLayoutProps) => {
  const containerClass = maxWidth === 'wide' ? 'max-w-6xl' : 'max-w-4xl';
  
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-6 py-12">
        <div className={`${containerClass} mx-auto`}>
          {children}
        </div>
      </main>
      
    </div>
  );
};