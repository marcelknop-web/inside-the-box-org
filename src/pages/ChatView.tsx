import { useState, useRef, useEffect, ReactNode } from 'react';
import { Send, Plus, MessageCircle, Shield, Target, BookOpen, AlertTriangle, Eye, Flame, Swords, Calendar, FileText, UserCheck, ChevronLeft, Menu, ShieldCheck, Search, Settings, Award, RotateCcw, Network, CreditCard, CheckCircle, FileCheck, Car, BarChart, RefreshCw, GraduationCap, ClipboardList, Zap, Crown, Users, Gamepad2, Monitor, Users2, Lightbulb, Flag, Crosshair, CheckSquare, Mic, Presentation, Wrench, Radio, Video, DollarSign, Phone, Mail, Server, Bug, AlertCircle, MessageSquare, Globe, Building2, Plane, Landmark } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';
import { consultantProfiles } from '@/data/consultantProfiles';
import { LucideIcon } from 'lucide-react';

interface NavLink { url: string; label: string; }
interface AiResponse { message: string; links: NavLink[]; }
interface ChatMessage { role: 'user' | 'assistant'; content: string; links?: NavLink[]; }

// ── Chat-styled content blocks ──────────────────────────────────────────────

const Block = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-2xl px-5 py-4 text-sm font-mono leading-relaxed text-foreground ${className}`}>
    {children}
  </div>
);

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h2 className="text-primary text-lg font-bold font-mono mb-3">{children}</h2>
);

const SubTitle = ({ children, variant = 'primary' }: { children: ReactNode; variant?: 'primary' | 'highlight' }) => (
  <h3 className={`${variant === 'highlight' ? 'text-highlight' : 'text-primary'} font-semibold font-mono mb-1`}>{children}</h3>
);

const CardBlock = ({ icon: Icon, title, desc, variant = 'primary' }: { icon: LucideIcon; title: string; desc: string; variant?: 'primary' | 'highlight' }) => (
  <div className={`rounded-xl p-4 ${variant === 'highlight' ? 'bg-highlight/5 border border-highlight/20' : 'bg-primary/5 border border-primary/20'}`}>
    <div className="flex items-start gap-3">
      <Icon size={18} className={`mt-0.5 flex-shrink-0 ${variant === 'highlight' ? 'text-highlight' : 'text-primary'}`} />
      <div>
        <SubTitle variant={variant}>{title}</SubTitle>
        <p className="text-foreground/80 text-sm">{desc}</p>
      </div>
    </div>
  </div>
);

const StatBlock = ({ value, label }: { value: string; label: string }) => (
  <div className="bg-highlight/5 border border-highlight/20 rounded-xl p-3 text-center">
    <div className="text-xl font-bold text-highlight font-mono">{value}</div>
    <div className="text-xs text-foreground/70">{label}</div>
  </div>
);

const GridItem = ({ icon: Icon, title, desc, variant = 'primary' }: { icon: LucideIcon; title: string; desc: string; variant?: 'primary' | 'highlight' }) => (
  <div className="flex items-start gap-2">
    <Icon size={16} className={`mt-0.5 flex-shrink-0 ${variant === 'highlight' ? 'text-highlight' : 'text-primary'}`} />
    <div>
      <p className={`font-semibold text-xs ${variant === 'highlight' ? 'text-highlight' : 'text-primary'}`}>{title}</p>
      <p className="text-foreground/70 text-xs">{desc}</p>
    </div>
  </div>
);

// ── Service content renderers ───────────────────────────────────────────────

const useServiceContent = () => {
  const { t, language } = useLanguage();

  const contentMap: Record<string, () => ReactNode> = {
    isms: () => (
      <div className="space-y-3">
        <Block><SectionTitle>{t('isms.title')}</SectionTitle><p>{t('isms.intro')}</p></Block>
        <CardBlock icon={ShieldCheck} title={t('isms.iso27001Title')} desc={t('isms.iso27001Desc')} />
        <CardBlock icon={FileText} title={t('isms.bsiTitle')} desc={t('isms.bsiDesc')} variant="highlight" />
        <Block className="bg-secondary/30">
          <SectionTitle>{t('isms.approachTitle')}</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <GridItem icon={Search} title={t('isms.assessmentTitle')} desc={t('isms.assessmentDesc')} />
            <GridItem icon={Settings} title={t('isms.implementationTitle')} desc={t('isms.implementationDesc')} />
            <GridItem icon={Award} title={t('isms.certificationTitle')} desc={t('isms.certificationDesc')} />
            <GridItem icon={RotateCcw} title={t('isms.maintenanceTitle')} desc={t('isms.maintenanceDesc')} />
          </div>
        </Block>
      </div>
    ),
    'nis2-dora': () => (
      <div className="space-y-3">
        <Block><SectionTitle>{t('nis2.title')}</SectionTitle><p>{t('nis2.intro')}</p></Block>
        <CardBlock icon={Search} title={t('nis2.impactTitle')} desc={t('nis2.impactDesc')} />
        <CardBlock icon={Shield} title={t('nis2.gapTitle')} desc={t('nis2.gapDesc')} />
        <CardBlock icon={Shield} title={t('nis2.measuresTitle')} desc={t('nis2.measuresDesc')} />
        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">{t('nis2.frameworkTitle')}</SubTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
            <GridItem icon={Building2} title={t('nis2.nis2Name')} desc={t('nis2.nis2Desc')} variant="highlight" />
            <GridItem icon={Landmark} title={t('nis2.doraName')} desc={t('nis2.doraDesc')} variant="highlight" />
            <GridItem icon={Plane} title={t('nis2.partisName')} desc={t('nis2.partisDesc')} variant="highlight" />
          </div>
        </Block>
      </div>
    ),
    'tisax-pci-dss': () => (
      <div className="space-y-3">
        <Block><SectionTitle>{t('tisax.title')}</SectionTitle><p>{t('tisax.intro')}</p></Block>
        <CardBlock icon={Settings} title={t('tisax.implTitle')} desc={t('tisax.implDesc')} />
        <CardBlock icon={CheckCircle} title={t('tisax.reviewsTitle')} desc={t('tisax.reviewsDesc')} variant="highlight" />
        <CardBlock icon={FileCheck} title={t('tisax.auditTitle')} desc={t('tisax.auditDesc')} />
        <Block className="bg-secondary/30">
          <SubTitle>{t('tisax.frameworkTitle')}</SubTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            <GridItem icon={Car} title={t('tisax.tisaxName')} desc={t('tisax.tisaxDesc')} />
            <GridItem icon={CreditCard} title={t('tisax.pciName')} desc={t('tisax.pciDesc')} />
          </div>
        </Block>
      </div>
    ),
    'assessments-concepts': () => (
      <div className="space-y-3">
        <Block><SectionTitle>{t('assessments.title')}</SectionTitle><p>{t('assessments.intro')}</p></Block>
        <CardBlock icon={Search} title={t('assessments.threatTitle')} desc={t('assessments.threatDesc')} />
        <CardBlock icon={Shield} title={t('assessments.controlsTitle')} desc={t('assessments.controlsDesc')} variant="highlight" />
        <CardBlock icon={Users} title={t('assessments.rolesTitle')} desc={t('assessments.rolesDesc')} />
        <CardBlock icon={Calendar} title={t('assessments.planningTitle')} desc={t('assessments.planningDesc')} variant="highlight" />
        <CardBlock icon={BarChart} title={t('assessments.measureTitle')} desc={t('assessments.measureDesc')} />
      </div>
    ),
    'incident-management': () => (
      <div className="space-y-3">
        <Block><SectionTitle>{t('incident.title')}</SectionTitle><p>{t('incident.intro')}</p></Block>
        <CardBlock icon={FileText} title={t('incident.planTitle')} desc={t('incident.planDesc')} />
        <CardBlock icon={Eye} title={t('incident.detectionTitle')} desc={t('incident.detectionDesc')} variant="highlight" />
        <CardBlock icon={Shield} title={t('incident.containTitle')} desc={t('incident.containDesc')} />
        <CardBlock icon={RefreshCw} title={t('incident.recoveryTitle')} desc={t('incident.recoveryDesc')} variant="highlight" />
        <CardBlock icon={GraduationCap} title={t('incident.simTitle')} desc={t('incident.simDesc')} />
      </div>
    ),
    'cyber-crisis-management': () => (
      <div className="space-y-3">
        <Block><SectionTitle>{t('cyberCrisis.title')}</SectionTitle><p>{t('cyberCrisis.intro')}</p></Block>
        <CardBlock icon={ClipboardList} title={t('cyberCrisis.planTitle')} desc={t('cyberCrisis.planDesc')} />
        <CardBlock icon={Zap} title={t('cyberCrisis.scenarioTitle')} desc={t('cyberCrisis.scenarioDesc')} variant="highlight" />
        <CardBlock icon={Target} title={t('cyberCrisis.simTitle')} desc={t('cyberCrisis.simDesc')} />
        <CardBlock icon={Crown} title={t('cyberCrisis.leaderTitle')} desc={t('cyberCrisis.leaderDesc')} variant="highlight" />
        <CardBlock icon={MessageSquare} title={t('cyberCrisis.commTitle')} desc={t('cyberCrisis.commDesc')} />
        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">{t('cyberCrisis.methTitle')}</SubTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
            <GridItem icon={Users} title={t('cyberCrisis.tabletop')} desc={t('cyberCrisis.tabletopDesc')} variant="highlight" />
            <GridItem icon={Gamepad2} title={t('cyberCrisis.liveSim')} desc={t('cyberCrisis.liveSimDesc')} variant="highlight" />
            <GridItem icon={Monitor} title={t('cyberCrisis.cyberRange')} desc={t('cyberCrisis.cyberRangeDesc')} variant="highlight" />
          </div>
        </Block>
        <Block className="bg-secondary/30">
          <SubTitle>{t('cyberCrisis.outcomesTitle')}</SubTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
            <GridItem icon={ShieldCheck} title={t('cyberCrisis.readiness')} desc={t('cyberCrisis.readinessDesc')} />
            <GridItem icon={Users2} title={t('cyberCrisis.coordination')} desc={t('cyberCrisis.coordinationDesc')} />
            <GridItem icon={Lightbulb} title={t('cyberCrisis.leadership')} desc={t('cyberCrisis.leadershipDesc')} />
          </div>
        </Block>
      </div>
    ),
    'arena-training': () => (
      <div className="space-y-3">
        <Block><SectionTitle>{t('arena.title')}</SectionTitle><p>{t('arena.intro')}</p></Block>
        <CardBlock icon={Target} title={t('arena.arenaTitle')} desc={t('arena.arenaDesc')} />
        <CardBlock icon={Flag} title={t('arena.tiberTitle')} desc={t('arena.tiberDesc')} variant="highlight" />
        <Block className="bg-secondary/30">
          <SubTitle>{t('arena.methTitle')}</SubTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            <GridItem icon={Gamepad2} title={t('arena.realisticTitle')} desc={t('arena.realisticDesc')} />
            <GridItem icon={Crosshair} title={t('arena.handsOnTitle')} desc={t('arena.handsOnDesc')} />
            <GridItem icon={Users} title={t('arena.teamTitle')} desc={t('arena.teamDesc')} />
            <GridItem icon={CheckSquare} title={t('arena.regulatoryTitle')} desc={t('arena.regulatoryDesc')} />
          </div>
        </Block>
      </div>
    ),
    'events-workshops': () => (
      <div className="space-y-3">
        <Block><SectionTitle>{t('events.title')}</SectionTitle><p>{t('events.intro')}</p></Block>
        <div className="grid grid-cols-3 gap-2">
          <img src="/lovable-uploads/fc4cff06-0e9d-41c4-bac3-73a041a924b3.png" alt="Presentation" className="rounded-lg w-full h-20 object-cover border border-border" />
          <img src="/lovable-uploads/f463db5a-733d-4e4e-b151-d3e33ebe8997.png" alt="Training" className="rounded-lg w-full h-20 object-cover border border-border" />
          <img src="/lovable-uploads/48ad82c3-84e8-4161-93d5-d79b509f7cc4.png" alt="Conference" className="rounded-lg w-full h-20 object-cover border border-border" />
        </div>
        <CardBlock icon={Mic} title={t('events.moderationTitle')} desc={t('events.moderationDesc')} />
        <CardBlock icon={Users} title={t('events.workshopsTitle')} desc={t('events.workshopsDesc')} variant="highlight" />
        <CardBlock icon={Award} title={t('events.referencesTitle')} desc={t('events.referencesDesc')} />
        <Block className="bg-secondary/30">
          <SubTitle>{t('events.eventTypesTitle')}</SubTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
            <GridItem icon={Presentation} title={t('events.conferences')} desc={t('events.conferencesDesc')} />
            <GridItem icon={Wrench} title={t('events.workshops')} desc={t('events.workshopsDescShort')} />
            <GridItem icon={GraduationCap} title={t('events.seminars')} desc={t('events.seminarsDesc')} />
          </div>
        </Block>
      </div>
    ),
    publications: () => (
      <div className="space-y-3">
        <Block><SectionTitle>{t('publications.title')}</SectionTitle><p>{t('publications.intro')}</p></Block>
        <CardBlock icon={Shield} title={t('publications.pub1Title')} desc={t('publications.pub1Desc')} />
        <CardBlock icon={Radio} title={t('publications.pub2Title')} desc={t('publications.pub2Desc')} variant="highlight" />
        <CardBlock icon={Video} title={t('publications.pub3Title')} desc={t('publications.pub3Desc')} />
        <Block className="bg-secondary/30">
          <SubTitle>{t('publications.certTitle')}</SubTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
            <GridItem icon={Award} title={t('publications.isacaTitle')} desc={t('publications.isacaDesc')} />
            <GridItem icon={Presentation} title={t('publications.confTitle')} desc={t('publications.confDesc')} />
            <GridItem icon={BookOpen} title={t('publications.eduTitle')} desc={t('publications.eduDesc')} />
          </div>
        </Block>
      </div>
    ),
    'virtual-ciso': () => (
      <div className="space-y-3">
        <Block><SectionTitle>{t('vciso.title')}</SectionTitle><p>{t('vciso.intro')}</p></Block>
        <CardBlock icon={Crown} title={t('vciso.stratTitle')} desc={t('vciso.stratDesc')} />
        <CardBlock icon={Settings} title={t('vciso.opsTitle')} desc={t('vciso.opsDesc')} />
        <CardBlock icon={CheckSquare} title={t('vciso.compTitle')} desc={t('vciso.compDesc')} />
        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">{t('vciso.modelTitle')}</SubTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            <GridItem icon={UserCheck} title={t('vciso.flexible')} desc={t('vciso.flexibleDesc')} variant="highlight" />
            <GridItem icon={DollarSign} title={t('vciso.costEffective')} desc={t('vciso.costEffectiveDesc')} variant="highlight" />
            <GridItem icon={Zap} title={t('vciso.immediate')} desc={t('vciso.immediateDesc')} variant="highlight" />
            <GridItem icon={Award} title={t('vciso.experienced')} desc={t('vciso.experiencedDesc')} variant="highlight" />
          </div>
        </Block>
      </div>
    ),
    why: () => (
      <div className="space-y-3">
        <Block>
          <SectionTitle>{t('index.title')}</SectionTitle>
          <p className="text-lg font-semibold mb-2">{t('index.subtitle')}</p>
          <p className="text-foreground/80" dangerouslySetInnerHTML={{
            __html: t('index.card1').replace(/<span>/g, '<span class="text-primary font-semibold">')
          }} />
        </Block>
        <Block className="bg-secondary/30">
          <p className="text-foreground/80" dangerouslySetInnerHTML={{
            __html: t('index.card2').replace(/<span>/g, '<span class="text-primary font-semibold">')
          }} />
        </Block>
        <div className="grid grid-cols-3 gap-2">
          <StatBlock value="40+" label={t('index.trainingsDelivered')} />
          <StatBlock value="350+" label={t('index.peopleTrained')} />
          <StatBlock value="6" label={t('index.countriesCovered')} />
        </div>
      </div>
    ),
    training: () => (
      <div className="space-y-3">
        <Block>
          <SectionTitle>{t('training.title')}</SectionTitle>
          <p>{t('training.subtitle')}</p>
        </Block>
        <CardBlock icon={Server} title={t('training.hostForensics')} desc={t('training.hostForensicsDesc')} />
        <CardBlock icon={Bug} title={t('training.malwareAnalysis')} desc={t('training.malwareAnalysisDesc')} variant="highlight" />
        <CardBlock icon={Shield} title={t('training.siem')} desc={t('training.siemDesc')} />
        <CardBlock icon={AlertCircle} title={t('training.incidentMgmt')} desc={t('training.incidentMgmtDesc')} variant="highlight" />
        <CardBlock icon={AlertTriangle} title={t('training.crisisMgmt')} desc={t('training.crisisMgmtDesc')} />
        <CardBlock icon={MessageSquare} title={t('training.crisisComm')} desc={t('training.crisisCommDesc')} variant="highlight" />
        <Block className="bg-highlight/5 border border-highlight/20 rounded-xl">
          <SubTitle variant="highlight">{t('training.methodsTitle')}</SubTitle>
          <p className="text-xs text-foreground/70 mb-2">{t('training.methodsSubtitle')}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <GridItem icon={BookOpen} title={t('training.knowledgeTransfer')} desc={t('training.knowledgeTransferDesc')} variant="highlight" />
            <GridItem icon={Users} title={t('training.groupExercises')} desc={t('training.groupExercisesDesc')} variant="highlight" />
            <GridItem icon={Zap} title={t('training.liveCyberAttacks')} desc={t('training.liveCyberAttacksDesc')} variant="highlight" />
          </div>
        </Block>
      </div>
    ),
    consulting: () => (
      <div className="space-y-3">
        <Block>
          <SectionTitle>{t('consulting.title')}</SectionTitle>
          <p>{t('consulting.intro')}</p>
        </Block>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { icon: ShieldCheck, title: t('consulting.ismsTitle'), desc: t('consulting.ismsDesc'), id: 'isms' },
            { icon: Network, title: t('consulting.nis2Title'), desc: t('consulting.nis2Desc'), id: 'nis2-dora' },
            { icon: CreditCard, title: t('consulting.tisaxTitle'), desc: t('consulting.tisaxDesc'), id: 'tisax-pci-dss' },
            { icon: Search, title: t('consulting.assessTitle'), desc: t('consulting.assessDesc'), id: 'assessments-concepts' },
            { icon: AlertTriangle, title: t('consulting.incidentTitle'), desc: t('consulting.incidentDesc'), id: 'incident-management' },
            { icon: Radio, title: t('consulting.crisisTitle'), desc: t('consulting.crisisDesc'), id: 'cyber-crisis-management' },
            { icon: Target, title: t('consulting.arenaTitle'), desc: t('consulting.arenaDesc'), id: 'arena-training' },
            { icon: Calendar, title: t('consulting.eventsTitle'), desc: t('consulting.eventsDesc'), id: 'events-workshops' },
            { icon: FileText, title: t('consulting.pubTitle'), desc: t('consulting.pubDesc'), id: 'publications' },
            { icon: UserCheck, title: t('consulting.vcisoTitle'), desc: t('consulting.vcisoDesc'), id: 'virtual-ciso' },
          ].map(s => (
            <div key={s.id} className="rounded-xl p-3 bg-primary/5 border border-primary/20 flex items-start gap-2 cursor-pointer hover:bg-primary/10 transition-electric" onClick={() => setActive(s.id)}>
              <s.icon size={14} className="text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-primary font-semibold text-xs">{s.title} →</p>
                <p className="text-foreground/70 text-xs">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <StatBlock value="270+" label={t('consulting.clientsServed')} />
          <StatBlock value="20+" label={t('consulting.industrySectors')} />
          <StatBlock value="35+" label={t('consulting.yearsCombined')} />
        </div>
      </div>
    ),
    'by-whom': () => {
      const profiles = consultantProfiles.map((profile) => {
        const key = profile.name === 'Marcel Knop' ? 'marcel' : 'andreas';
        if (language === 'de') {
          return {
            ...profile,
            sections: [
              { title: t(`profiles.${key}.eduTitle`), items: key === 'marcel' ? ['Dipl.-Ing. Maschinenbau', 'CISSP, CISA', 'ISO/IEC 27001 + 22301 Lead Auditor', 'BSI Grundschutz-Praktiker'] : ['B.Sc. Betriebswirtschaftslehre', 'ISO/IEC 27001 Lead Auditor + Implementer', 'ISO/IEC 27005 Risk Manager', 'BSI IT-Grundschutz-Praktiker', 'Datenschutzauditor (DSA-TÜV)'] },
              { title: t(`profiles.${key}.expTitle`), items: key === 'marcel' ? ['KPMG: Consultant bis Senior Manager', 'Accenture: Senior Manager', 'Ernst & Young: Senior Manager'] : ['PwC: Manager, Cybersecurity und Datenschutz', 'Ernst & Young: Senior Consultant', 'CSPi: Consultant Security und Datenschutz'] },
              { title: t(`profiles.${key}.servTitle`), items: key === 'marcel' ? ['Cybersecurity-Beratung und Audits', 'ISMS, TISAX, NIS-2, PCI-DSS Implementierung', 'Cyber-Krisenmanagement und Übungen', 'TIBER, BCM'] : ['Informationssicherheit, ISMS-Strategie', 'ISO/IEC 27001, PCI-DSS, NIST, TISAX', 'Risikomanagement, Business Continuity', 'EU-DSGVO, Kritische Infrastrukturen (KRITIS)'] },
              { title: t(`profiles.${key}.langTitle`), items: key === 'marcel' ? ['Deutsch (Muttersprache)', 'Englisch (verhandlungssicher)'] : ['Deutsch (Muttersprache)', 'Englisch (verhandlungssicher)', 'Französisch (fachsprachlich)'] },
            ],
          };
        }
        return profile;
      });
      return (
        <div className="space-y-3">
          <Block><SectionTitle>{t('byWhom.title')}</SectionTitle><p>{t('byWhom.intro')}</p></Block>
          {profiles.map(p => (
            <Block key={p.name} className="bg-secondary/30">
              <div className="flex items-center gap-3 mb-3">
                <img src={p.imageUrl} alt={p.name} className="w-12 h-12 rounded-full object-cover border-2 border-primary/30" />
                <div>
                  <p className="text-primary font-bold text-sm">{p.name}</p>
                  <p className="text-foreground/60 text-xs">{p.role}</p>
                </div>
                {p.linkedinUrl && (
                  <a href={p.linkedinUrl} target="_blank" rel="noopener noreferrer" className="ml-auto text-highlight text-xs hover:underline">LinkedIn</a>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {p.sections.map((s, i) => (
                  <div key={i}>
                    <p className="text-primary font-semibold text-xs mb-1">{s.title}</p>
                    <ul className="text-xs text-foreground/70 space-y-0.5">
                      {s.items.map((item, j) => <li key={j}>• {item}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </Block>
          ))}
        </div>
      );
    },
    contact: () => (
      <div className="space-y-3">
        <Block><SectionTitle>{t('contact.title')}</SectionTitle><p>{t('contact.intro')}</p></Block>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="rounded-xl p-4 bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Phone size={16} className="text-primary" />
              <SubTitle>{t('contact.phone')}</SubTitle>
            </div>
            <a href="tel:+4915205691648" className="text-foreground/80 text-sm hover:text-highlight transition-electric">+49 1520 569 1648</a>
          </div>
          <div className="rounded-xl p-4 bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Mail size={16} className="text-primary" />
              <SubTitle>{t('contact.email')}</SubTitle>
            </div>
            <a href="mailto:marcel@inside-the-box.org" className="text-foreground/80 text-sm hover:text-highlight transition-electric">marcel@inside-the-box.org</a>
          </div>
        </div>
      </div>
    ),
  };

  // We need setActive to be available inside consulting content
  let setActive: (id: string) => void = () => {};
  const bindSetActive = (fn: (id: string) => void) => { setActive = fn; };

  return { contentMap, bindSetActive };
};

// ── Sidebar config ──────────────────────────────────────────────────────────

interface SidebarItem { id: string; icon: LucideIcon; label: string; }
interface SidebarGroup { title: string; items: SidebarItem[]; }

const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    title: 'Training',
    items: [
      { id: 'why', icon: Target, label: 'Cyber Training Range' },
      { id: 'training', icon: Swords, label: 'Trainingsthemen' },
    ],
  },
  {
    title: 'Beratung',
    items: [
      { id: 'consulting', icon: Shield, label: 'Übersicht' },
      { id: 'isms', icon: ShieldCheck, label: 'ISMS ISO 27001' },
      { id: 'nis2-dora', icon: Network, label: 'NIS-2, DORA, PART-IS' },
      { id: 'tisax-pci-dss', icon: CreditCard, label: 'TISAX, PCI-DSS' },
      { id: 'assessments-concepts', icon: Search, label: 'Assessments & Konzepte' },
      { id: 'incident-management', icon: Flame, label: 'Incident Management' },
      { id: 'cyber-crisis-management', icon: Swords, label: 'Cyber-Krisenmanagement' },
      { id: 'arena-training', icon: Target, label: 'Arena Training, TIBER' },
      { id: 'events-workshops', icon: Calendar, label: 'Events & Workshops' },
      { id: 'publications', icon: FileText, label: 'Publikationen' },
      { id: 'virtual-ciso', icon: UserCheck, label: 'Virtual CISO' },
    ],
  },
  {
    title: 'Über uns',
    items: [
      { id: 'by-whom', icon: Users, label: 'Von Wem' },
      { id: 'contact', icon: Mail, label: 'Kontakt' },
    ],
  },
];

// ── Main component ──────────────────────────────────────────────────────────

const ChatView = () => {
  const { language, setLanguage, t } = useLanguage();
  const [activeService, setActiveService] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contentAreaRef = useRef<HTMLDivElement>(null);

  const { contentMap, bindSetActive } = useServiceContent();
  bindSetActive((id) => { setActiveService(id); setMessages([]); });

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => {
    if (contentAreaRef.current) contentAreaRef.current.scrollTop = 0;
  }, [activeService]);
  useEffect(() => {
    const el = inputRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 200) + 'px'; }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jbhfqocscbvcvzlgwvvy.supabase.co';
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiaGZxb2NzY2J2Y3Z6bGd3dnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTM2NTksImV4cCI6MjA4NzI2OTY1OX0.gwIYZtnr5HEMgEHsFgYOFlyQOpm-KBWTavu0IWEyLyE';
      const res = await fetch(`${supabaseUrl}/functions/v1/ask-navigator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` },
        body: JSON.stringify({ question: userMsg }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data: AiResponse = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.message, links: data.links }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Etwas ist schiefgelaufen. Bitte versuche es erneut.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const newChat = () => { setActiveService(null); setMessages([]); setInput(''); inputRef.current?.focus(); };

  const selectService = (id: string) => {
    setActiveService(id);
    setMessages([]);
    inputRef.current?.focus();
  };

  const serviceContent = activeService && contentMap[activeService] ? contentMap[activeService]() : null;

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: 'hsl(var(--background))' }}>
      <PageMeta title="inside-the-box" description="Cybersecurity Navigator" />

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 flex-shrink-0 overflow-hidden`}>
        <div className="w-64 h-full flex flex-col bg-card border-r border-border">
          <div className="p-3 flex gap-2">
            <button onClick={newChat} className="flex-1 flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-mono text-foreground hover:bg-secondary transition-electric">
              <Plus size={16} /><span>Neuer Chat</span>
            </button>
            <button onClick={() => setLanguage(language === 'en' ? 'de' : 'en')} className="rounded-lg border border-border px-2.5 py-2.5 text-xs font-mono text-muted-foreground hover:bg-secondary hover:text-foreground transition-electric uppercase tracking-wider">
              {language === 'en' ? 'DE' : 'EN'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-4">
            {SIDEBAR_GROUPS.map((group) => (
              <div key={group.title} className="mb-3">
                <p className="px-2 py-1.5 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{group.title}</p>
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => selectService(item.id)}
                    className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-electric group ${
                      activeService === item.id
                        ? 'bg-secondary text-foreground'
                        : 'text-foreground/70 hover:bg-secondary/50 hover:text-foreground'
                    }`}
                  >
                    <item.icon size={14} className={`flex-shrink-0 ${activeService === item.id ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                    <span className="truncate font-mono text-xs">{item.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="border-t border-border p-3">
            <span className="text-xs font-mono text-muted-foreground">inside-the-box.org</span>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-12 border-b border-border flex items-center px-3 gap-2 flex-shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-electric">
            {sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
          </button>
          <span className="text-sm font-mono text-foreground">
            {activeService ? (SIDEBAR_GROUPS.flatMap(g => g.items).find(i => i.id === activeService)?.label || 'inside-the-box') : 'inside-the-box Navigator'}
          </span>
        </div>

        <div ref={contentAreaRef} className="flex-1 overflow-y-auto">
          {!activeService && messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-4">
              <div className="mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <MessageCircle size={24} className="text-primary" />
                </div>
              </div>
              <h1 className="text-2xl font-mono text-foreground mb-2">Wie kann ich helfen?</h1>
              <p className="text-sm text-muted-foreground font-mono text-center max-w-md">
                Fragen Sie mich zu unseren Cybersecurity-Services – oder wählen Sie ein Thema in der Seitenleiste.
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-4">
              {/* Service content as assistant "response" */}
              {serviceContent && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MessageCircle size={14} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">{serviceContent}</div>
                </div>
              )}

              {/* Chat messages */}
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MessageCircle size={14} className="text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm font-mono leading-relaxed ${msg.role === 'user' ? 'bg-secondary text-foreground' : 'text-foreground'}`}>
                    <p>{msg.content}</p>
                    {msg.links && msg.links.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {msg.links.map((link, j) => {
                          // Convert internal links to service navigation
                          const serviceId = SIDEBAR_GROUPS.flatMap(g => g.items).find(s => link.url.includes(s.id))?.id;
                          return (
                            <li key={j}>
                              {serviceId ? (
                                <button onClick={() => selectService(serviceId)} className="text-primary hover:underline text-xs text-left">→ {link.label}</button>
                              ) : (
                                <a href={link.url} className="text-primary hover:underline text-xs">→ {link.label}</a>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <MessageCircle size={14} className="text-primary" />
                  </div>
                  <div className="flex items-center gap-1 py-2">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border p-4 flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end bg-secondary rounded-2xl border border-border focus-within:border-primary/40 transition-electric">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Nachricht an inside-the-box…"
                className="flex-1 bg-transparent px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground resize-none focus:outline-none max-h-[200px]"
                disabled={isLoading}
              />
              <button onClick={handleSend} disabled={!input.trim() || isLoading} className="m-1.5 p-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-30 hover:bg-primary/80 transition-electric">
                <Send size={16} />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono text-center mt-2">
              inside-the-box Navigator kann Fehler machen. Angaben bitte prüfen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
