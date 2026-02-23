import { Linkedin } from 'lucide-react';

interface ProfileSection {
  title: string;
  items: string[];
}

interface ProfileCardProps {
  name: string;
  role: string;
  imageUrl: string;
  linkedinUrl: string;
  sections: [ProfileSection, ProfileSection, ProfileSection, ProfileSection];
}

export const ProfileCard = ({ name, role, imageUrl, linkedinUrl, sections }: ProfileCardProps) => {
  return (
    <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
      <div className="flex flex-col md:flex-row gap-6 mb-4">
        <div className="flex-shrink-0">
          <div className="w-32 h-32 rounded-full bg-primary/5 p-1">
            <img 
              src={imageUrl} 
              alt={`${name} - ${role}`} 
              className="w-full h-full rounded-full object-cover object-[50%_30%] border border-primary/20 scale-110"
            />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-primary text-2xl font-bold font-mono">{name}</h2>
            <a 
              href={linkedinUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white rounded-full p-1 text-linkedin hover:text-linkedin/80 transition-electric"
            >
              <Linkedin size={20} />
            </a>
          </div>
          <h3 className="text-highlight text-lg font-semibold">{role}</h3>
        </div>
      </div>
      
      <div className="space-y-4 text-base sm:text-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-4">
          {sections.slice(0, 2).map((section, i) => (
            <div key={i}>
              <h4 className="text-primary font-semibold mb-2">{section.title}</h4>
              <ul className="space-y-1">
                {section.items.map((item, j) => (
                  <li key={j} className="pl-4 -indent-4">• {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-4">
          {sections.slice(2, 4).map((section, i) => (
            <div key={i}>
              <h4 className="text-primary font-semibold mb-2">{section.title}</h4>
              <ul className="space-y-1">
                {section.items.map((item, j) => (
                  <li key={j} className="pl-4 -indent-4">• {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};