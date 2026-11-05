import { ArrowDown, ArrowRight, BookOpen, CheckCircle2, Eye, ShieldAlert, ShieldCheck } from 'lucide-react';
import { getLessonConcept } from '@/data/lessonConcepts';
import './LessonConcept.css';

const stageLabels = ['Événement', 'Point faible', 'Risque', 'Défense'];

export default function LessonConcept({ title }: { title: string }) {
  const concept = getLessonConcept(title);

  return <section className="concept-learning" aria-label={`Comprendre ${title}`}>
    <header className="concept-intro">
      <div className="concept-title-icon"><BookOpen size={19} /></div>
      <div><span className="eyebrow">LE CONCEPT EN CLAIR</span><h2>Comprendre {title}</h2></div>
    </header>
    <p className="concept-definition">{concept.introduction}</p>

    <div className="concept-scenario">
      <div className="scenario-heading"><Eye size={15} /><span>SCÉNARIO DE DÉMONSTRATION</span></div>
      <p>{concept.scenario}</p>
    </div>

    <div className="concept-flow-heading"><span className="eyebrow">COMMENT LE RISQUE SE FORME</span><span className="concept-flow-note">Une chaîne d’événements, un point de contrôle</span></div>
    <div className="concept-flow" aria-label="Étapes du scénario pédagogique">
      {concept.steps.map((text, index) => <div className="concept-flow-item" key={stageLabels[index]}>
        <div className={`concept-flow-node node-${index}`}><span>{String(index + 1).padStart(2, '0')}</span></div>
        <div className="concept-flow-copy"><span>{stageLabels[index]}</span><p>{text}</p></div>
        {index < concept.steps.length - 1 && <ArrowRight className="concept-flow-arrow" size={16} />}
        {index < concept.steps.length - 1 && <ArrowDown className="concept-flow-down" size={15} />}
      </div>)}
    </div>

    <div className="concept-detail-grid">
      <article className="concept-detail-card risk-detail"><div className="detail-icon"><ShieldAlert size={16} /></div><div><h3>Pourquoi c’est risqué</h3><p>{concept.risk}</p></div></article>
      <article className="concept-detail-card defense-detail"><div className="detail-icon"><ShieldCheck size={16} /></div><div><h3>Le principe de défense</h3><p>{concept.defense}</p></div></article>
    </div>
    <div className="concept-takeaway"><CheckCircle2 size={16} /><p><b>À retenir</b><span>{concept.takeaway}</span></p></div>
    <div className="concept-transition"><span>Maintenant que le mécanisme est clair, observez-le dans un scénario fictif isolé.</span><ArrowRight size={15} /></div>
  </section>;
}
