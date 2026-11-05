import Nis2AwarenessQuiz from './Nis2AwarenessQuiz';
import { getRiskQuestion } from '@/data/riskQuiz';
import logo from '@/assets/otto-fuchs-logo.svg.asset.json';
import '@fontsource/gudea/400.css';
import '@fontsource/gudea/700.css';
import '@/styles/risk-quiz.css';

const variant = {
  brand: 'OTTO FUCHS',
  title: 'Risikomanagement-Quiz',
  intro: 'Zehn Fragen zu Bewertung, Klassen und Zuständigkeiten. Aufsteigende Schwierigkeit. Zwei Joker.',
  storagePrefix: 'risk_quiz',
  getQuestion: getRiskQuestion,
};

export default function RiskQuiz() {
  return <div className="risk-quiz-theme">
    <header className="border-b border-border bg-background px-5 sm:px-8 py-4">
      <div className="max-w-4xl mx-auto flex items-center gap-3">
        <img src={logo.url} alt="OTTO FUCHS" className="w-9 h-10 object-contain" />
        <div className="flex-1 text-primary font-bold text-xl">OTTO FUCHS</div>
        <span className="text-muted-foreground text-xs">Risikomanagement</span>
      </div>
    </header>
    <Nis2AwarenessQuiz variant={variant} />
  </div>;
}
