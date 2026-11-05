import Nis2AwarenessQuiz from './Nis2AwarenessQuiz';
import { getRiskQuestion } from '@/data/riskQuiz';
import logo from '@/assets/otto-fuchs-logo.svg.asset.json';
import studio from '@/assets/risk-quiz-studio.jpg';
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
    <div className="risk-studio" aria-hidden="true">
      <img src={studio} alt="" width={1920} height={1088} />
      <div className="risk-audience-lights">
        <span className="risk-spotlight risk-spotlight-left" />
        <span className="risk-spotlight risk-spotlight-right" />
        <span className="risk-spotlight risk-spotlight-back" />
      </div>
    </div>
    <header className="risk-show-header">
      <div className="max-w-6xl mx-auto flex items-center gap-3">
        <img src={logo.url} alt="" className="risk-brand-mark" />
        <div className="flex-1 text-foreground font-bold text-sm">OTTO FUCHS</div>
        <span className="risk-on-air"><span /> QUIZ NIGHT</span>
      </div>
    </header>
    <Nis2AwarenessQuiz variant={variant} />
  </div>;
}
