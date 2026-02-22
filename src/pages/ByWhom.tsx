import { PageLayout } from '@/components/PageLayout';
import { ProfileCard } from '@/components/ProfileCard';
import { PageNavButtons } from '@/components/PageNavButtons';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';
import { consultantProfiles } from '@/data/consultantProfiles';

const ByWhom = () => {
  const { t, language } = useLanguage();

  const translatedProfiles = consultantProfiles.map((profile) => {
    const key = profile.name === 'Marcel Knop' ? 'marcel' : 'andreas';
    const p = language === 'de' ? {
      ...profile,
      sections: [
        { title: t(`profiles.${key}.eduTitle`), items: (language === 'de' ? (key === 'marcel' ? ['Dipl.-Ing. Maschinenbau', 'CISSP, CISA', 'ISO/IEC 27001 + 22301 Lead Auditor', 'BSI Grundschutz-Praktiker'] : ['B.Sc. Betriebswirtschaftslehre', 'ISO/IEC 27001 Lead Auditor + Implementer', 'ISO/IEC 27005 Risk Manager', 'BSI IT-Grundschutz-Praktiker', 'Datenschutzauditor (DSA-TÜV)']) : profile.sections[0].items) },
        { title: t(`profiles.${key}.expTitle`), items: (language === 'de' ? (key === 'marcel' ? ['KPMG: Consultant bis Senior Manager', 'Accenture: Senior Manager', 'Ernst & Young: Senior Manager'] : ['PwC: Manager, Cybersecurity und Datenschutz', 'Ernst & Young: Senior Consultant', 'CSPi: Consultant Security und Datenschutz']) : profile.sections[1].items) },
        { title: t(`profiles.${key}.servTitle`), items: (language === 'de' ? (key === 'marcel' ? ['Cybersecurity-Beratung und Audits', 'ISMS, TISAX, NIS-2, PCI-DSS Implementierung', 'Cyber-Krisenmanagement und Übungen', 'TIBER, BCM'] : ['Informationssicherheit, ISMS-Strategie', 'ISO/IEC 27001, PCI-DSS, NIST, TISAX', 'Risikomanagement, Business Continuity', 'EU-DSGVO, Kritische Infrastrukturen (KRITIS)']) : profile.sections[2].items) },
        { title: t(`profiles.${key}.langTitle`), items: (language === 'de' ? (key === 'marcel' ? ['Deutsch (Muttersprache)', 'Englisch (verhandlungssicher)'] : ['Deutsch (Muttersprache)', 'Englisch (verhandlungssicher)', 'Französisch (fachsprachlich)']) : profile.sections[3].items) },
      ] as typeof profile.sections,
    } : profile;
    return p;
  });

  return (
    <PageLayout>
      <div className="space-y-8">
        <PageMeta title={t('byWhom.title')} description={t('byWhom.metaDesc')} />
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">
          {t('byWhom.title')}
        </h1>
        
        <div className="space-y-12 text-foreground leading-relaxed">
          <p className="text-lg font-sans">
            {t('byWhom.intro')}
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

export default ByWhom;
