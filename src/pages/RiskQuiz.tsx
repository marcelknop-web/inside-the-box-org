import Nis2AwarenessQuiz from './Nis2AwarenessQuiz';
import { getRiskQuestion } from '@/data/riskQuiz';

const variant = {
  brand: 'RISIKO',
  title: 'Risikomanagement-Quiz',
  intro: 'Zehn Fragen zu Bewertung, Klassen und Zuständigkeiten. Aufsteigende Schwierigkeit. Zwei Joker.',
  storagePrefix: 'risk_quiz',
  getQuestion: getRiskQuestion,
};

export default function RiskQuiz() {
  return <Nis2AwarenessQuiz variant={variant} />;
}
