import { PageLayout } from '@/components/PageLayout';
import { ProfileCard } from '@/components/ProfileCard';
import { PageNavButtons } from '@/components/PageNavButtons';
import { useLanguage } from '@/i18n/LanguageContext';
import { consultantProfiles } from '@/data/consultantProfiles';

const ConsultingTeam = () => {
  const { t, language } = useLanguage();

  const translatedProfiles = consultantProfiles.map((profile) => {
    const key = profile.name === 'Marcel Knop' ? 'marcel' : 'andreas';
    if (language === 'de') {
      return {
        ...profile,
        sections: [
          { title: t(`profiles.${key}.eduTitle`), items: (key === 'marcel' ? ['Dipl.-Ing. Maschinenbau', 'CISSP, CISA', 'ISO/IEC 27001 + 22301 Lead Auditor', 'BSI Grundschutz-Praktiker'] : ['B.Sc. Betriebswirtschaftslehre', 'ISO/IEC 27001 Lead Auditor + Implementer', 'ISO/IEC 27005 Risk Manager', 'BSI IT-Grundschutz-Praktiker', 'Datenschutzauditor (DSA-TÜV)']) },
          { title: t(`profiles.${key}.expTitle`), items: (key === 'marcel' ? ['KPMG: Consultant bis Senior Manager', 'Accenture: Senior Manager', 'Ernst & Young: Senior Manager'] : ['PwC: Manager, Cybersecurity und Datenschutz', 'Ernst & Young: Senior Consultant', 'CSPi: Consultant Security und Datenschutz']) },
          { title: t(`profiles.${key}.servTitle`), items: (key === 'marcel' ? ['Cybersecurity-Beratung und Audits', 'ISMS, TISAX, NIS-2, PCI-DSS Implementierung', 'Cyber-Krisenmanagement und Übungen', 'TIBER, BCM'] : ['Informationssicherheit, ISMS-Strategie', 'ISO/IEC 27001, PCI-DSS, NIST, TISAX', 'Risikomanagement, Business Continuity', 'EU-DSGVO, Kritische Infrastrukturen (KRITIS)']) },
          { title: t(`profiles.${key}.langTitle`), items: (key === 'marcel' ? ['Deutsch (Muttersprache)', 'Englisch (verhandlungssicher)'] : ['Deutsch (Muttersprache)', 'Englisch (verhandlungssicher)', 'Französisch (fachsprachlich)']) },
        ] as typeof profile.sections,
      };
    }
    return profile;
  });

  return (
    <PageLayout>
      <div className="space-y-8">
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">
          {t('consultingTeam.title')}
        </h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans">
            {t('consultingTeam.intro')}
          </p>
          
          <div className="space-y-8">
            {translatedProfiles.map((profile) => (
              <ProfileCard key={profile.name} {...profile} />
            ))}
          </div>
          
          <PageNavButtons buttons={[
            { href: '/consulting', label: t('byWhom.backToConsulting') },
            { href: '/training', label: t('byWhom.backToTraining') },
            { href: '/contact', label: t('nav.contact'), variant: 'highlight' },
          ]} />
        </div>
      </div>
    </PageLayout>
  );
};

export default ConsultingTeam;
