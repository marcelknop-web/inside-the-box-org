import { PageLayout } from '@/components/PageLayout';
import { ProfileCard } from '@/components/ProfileCard';
import { PageNavButtons } from '@/components/PageNavButtons';
import { PageMeta } from '@/components/PageMeta';
import { consultantProfiles } from '@/data/consultantProfiles';

const ByWhom = () => {
  return (
    <PageLayout>
      <div className="space-y-8">
        <PageMeta title="By Whom" description="Meet the team: Marcel Knop and Andreas Funder. CISSP-certified cybersecurity consultants with Big Four and enterprise experience." />
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">
          By Whom
        </h1>
        
        <div className="space-y-12 text-foreground leading-relaxed">
          <p className="text-lg font-sans">
            Two senior cybersecurity consultants with combined 35+ years of professional consulting expertise.
          </p>
          
          <div className="space-y-8">
            {consultantProfiles.map((profile) => (
              <ProfileCard key={profile.name} {...profile} />
            ))}
          </div>
          
          <PageNavButtons buttons={[
            { href: '/consulting', label: 'Back to Consulting' },
            { href: '/training', label: 'Back to Training' },
            { href: '/contact', label: 'Contact', variant: 'highlight' },
          ]} />
        </div>
      </div>
    </PageLayout>
  );
};

export default ByWhom;