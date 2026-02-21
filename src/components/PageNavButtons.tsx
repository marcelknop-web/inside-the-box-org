import { LinkButton } from '@/components/LinkButton';

interface NavButton {
  href: string;
  label: string;
  variant?: 'primary' | 'highlight';
}

interface PageNavButtonsProps {
  buttons: NavButton[];
}

export const PageNavButtons = ({ buttons }: PageNavButtonsProps) => {
  return (
    <div className="pt-8">
      {/* Mobile Layout */}
      <div className="flex flex-col space-y-4 md:hidden">
        {buttons.map((btn, i) => (
          <LinkButton key={i} href={btn.href} variant={btn.variant || 'primary'}>
            {btn.label}
          </LinkButton>
        ))}
      </div>
      
      {/* Desktop Layout */}
      <div className="hidden md:flex justify-between gap-4">
        {buttons.map((btn, i) => (
          <LinkButton key={i} href={btn.href} variant={btn.variant || 'primary'} className="flex-1 text-center">
            {btn.label}
          </LinkButton>
        ))}
      </div>
    </div>
  );
};