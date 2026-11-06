import { useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { Activity, ArrowLeft, ArrowRight, Check, CheckCircle2, Clock3, ExternalLink, FlaskConical, LockKeyhole, Play, RotateCcw, ShieldAlert, ShieldCheck, Terminal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { evaluateLab, labs, type LabDefinition } from '@/data/labs';
import './LabExplorer.css';

type LabProgress = { completed: boolean; progress: number; attempts: number };
type LabProgressMap = Record<string, LabProgress>;
const STORAGE_KEY = 'ya_lab_progress';
const DVWA_ORIGIN = 'https://dvwa.ya-consulting.com';
const blankProgress: LabProgress = { completed: false, progress: 0, attempts: 0 };
const dvwaSteps = [
  'J’ai ouvert cet exercice DVWA avec ma session de formation.',
  'J’ai réalisé le scénario autorisé dans DVWA.',
  'J’ai identifié la contre-mesure et son effet.'
];

export default function LabExplorer({ user }: { user: User | null }) {
  const [selected, setSelected] = useState<LabDefinition | null>(null);
  const [filter, setFilter] = useState<'Tous' | 'DVWA' | 'OWASP TOP 10'>('Tous');
  const [input, setInput] = useState('');
  const [hardened, setHardened] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [progress, setProgress] = useState<LabProgressMap>(() => JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
  const [saving, setSaving] = useState(false);
  const [syncError, setSyncError] = useState(false);

  useEffect(() => {
    if (!user) {
      setProgress(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
      return;
    }
    supabase.from('lab_progress').select('lab_slug,completed,progress,attempts').eq('user_id', user.id).then(({ data, error }) => {
      if (error) {
        setSyncError(true);
        return;
      }
      if (data) setProgress(Object.fromEntries(data.map(row => [row.lab_slug, { completed: row.completed, progress: row.progress, attempts: row.attempts }])));
    });
  }, [user]);

  const filtered = useMemo(() => labs.filter(lab => filter === 'Tous' || lab.platform === filter), [filter]);
  const completeCount = labs.filter(lab => progress[lab.slug]?.completed).length;
  const aggregateProgress = Math.round(completeCount / labs.length * 100);

  const saveProgress = async (lab: LabDefinition, next: LabProgress) => {
    const nextProgress = { ...progress, [lab.slug]: next };
    setProgress(nextProgress);
    if (!user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProgress));
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('lab_progress').upsert({ user_id: user.id, lab_slug: lab.slug, ...next, updated_at: new Date().toISOString() }, { onConflict: 'user_id,lab_slug' });
    setSaving(false);
    setSyncError(Boolean(error));
  };

  const markDvwStep = (lab: LabDefinition, step: number) => {
    const previous = progress[lab.slug] ?? blankProgress;
    if (step > 0 && previous.progress < step * 35) return;
    const percent = [35, 70, 100][step];
    void saveProgress(lab, { progress: percent, completed: step === 2, attempts: previous.attempts + (step === 0 ? 1 : 0) });
  };

  const openLab = (lab: LabDefinition) => {
    setSelected(lab);
    setInput('');
    setHardened(false);
    setResult(null);
  };

  const run = async () => {
    if (!selected) return;
    const outcome = evaluateLab(selected.kind, input, hardened);
    setResult(outcome);
    const previous = progress[selected.slug] ?? blankProgress;
    await saveProgress(selected, {
      completed: previous.completed || outcome.success,
      progress: outcome.success || previous.completed ? 100 : Math.max(previous.progress, 35),
      attempts: previous.attempts + 1
    });
  };

  const reset = () => { setInput(''); setHardened(false); setResult(null); };

  return <>
    <div className="page-intro"><div className="eyebrow">PRATIQUER EN ENVIRONNEMENT CONTRÔLÉ</div><h1>Laboratoires pratiques</h1><p>Exercices DVWA sur votre instance de formation et simulations OWASP locales.</p></div>
    <div className="lab-safety"><div className="lab-safety-icon"><ShieldCheck size={20}/></div><div><b>Instance de formation dédiée</b><p>Les exercices DVWA s’ouvrent sur dvwa.ya-consulting.com. N’utilisez que des comptes et données réservés à ce laboratoire.</p></div><span className="isolation-chip"><LockKeyhole size={12}/> AUTORISÉ</span></div>
    <section className="lab-progress-overview"><div className="lab-overview-copy"><span className="eyebrow">VOTRE PROGRESSION</span><b>{completeCount} <small>/ {labs.length} labs terminés</small></b><span>{saving ? 'Synchronisation en cours…' : syncError ? 'Synchronisation indisponible — réessayez plus tard' : user ? 'Progression synchronisée avec votre compte' : 'Progression enregistrée sur cet appareil'}</span></div><div className="lab-overview-bar"><div><i style={{ width: `${aggregateProgress}%` }}/></div><b>{aggregateProgress}%</b></div></section>
    {selected ? <section className="lab-workspace" aria-label={`Laboratoire ${selected.title}`}>
      <div className="lab-workspace-head"><button className="lab-back" onClick={() => setSelected(null)}><ArrowLeft size={15}/> Tous les laboratoires</button><span className={`lab-platform ${selected.platform === 'DVWA' ? 'dvwa-platform' : 'owasp-platform'}`}>{selected.platform}</span></div>
      <div className="lab-workspace-grid"><div className="lab-challenge"><div className="eyebrow">{selected.area}</div><h2>{selected.title}</h2><p>{selected.description}</p><div className="lab-objective"><TargetIcon/><div><b>Objectif du scénario</b><span>{selected.objective}</span></div></div><div className="lab-hint"><CircleHint/><span>{selected.hint}</span></div><div className="lab-challenge-meta"><span><Clock3 size={13}/> 5–10 min</span><span><Activity size={13}/> {progress[selected.slug]?.attempts ?? 0} tentative(s)</span></div></div>
        {selected.platform === 'DVWA' ? <div className="dvwa-workspace"><div className="simulator-top"><div className="window-dots"><i/><i/><i/></div><span>dvwa.ya-consulting.com <span>· instance de formation</span></span><span className="secure-label"><ShieldCheck size={12}/> HTTPS</span></div><div className="dvwa-workspace-body"><div className="dvwa-open-card"><div className="dvwa-open-icon"><ExternalLink size={18}/></div><div><b>Exercice sur votre instance DVWA</b><p>Le lab s’ouvrira dans un nouvel onglet. La progression ci-dessous est confirmée par vous dans YA CyberLab ; DVWA ne transmet pas automatiquement ses résultats.</p></div></div><a className="dvwa-launch" href={`${DVWA_ORIGIN}${selected.dvwaPath}`} target="_blank" rel="noopener noreferrer" onClick={() => markDvwStep(selected, 0)}><ExternalLink size={15}/> Ouvrir {selected.title} dans DVWA <ArrowRight size={15}/></a><div className="dvwa-checklist"><div className="eyebrow">ÉTAPES À VALIDER</div>{dvwaSteps.map((label, index) => {const active = (progress[selected.slug]?.progress ?? 0) >= [35,70,100][index];const enabled = index === 0 || (progress[selected.slug]?.progress ?? 0) >= [0,35,70][index];return <button key={label} className={`dvwa-check-row ${active?'checked':''}`} disabled={!enabled || active} onClick={() => markDvwStep(selected,index)}><span className="dvwa-check-box">{active&&<Check size={13}/>}</span><span>{label}</span>{active&&<small>Validé</small>}</button>})}</div><div className="dvwa-progress-line"><div><i style={{width:`${progress[selected.slug]?.progress ?? 0}%`}}/></div><b>{progress[selected.slug]?.progress ?? 0}%</b></div><div className="simulator-foot"><LockKeyhole size={12}/> Navigateur séparé · progression saisie explicitement ici</div></div></div> : <div className="lab-simulator"><div className="simulator-top"><div className="window-dots"><i/><i/><i/></div><span>owasp-lab.local <span>· simulation locale</span></span><span className="secure-label"><ShieldCheck size={12}/> LOCAL</span></div><div className="simulator-body"><div className="simulator-title"><Terminal size={15}/><b>{selected.area}</b><span>SCÉNARIO FICTIF</span></div>
          {selected.kind === 'misconfig' ? <div className="config-toggle"><div><b>Profil de sécurité renforcé</b><small>CSP · HSTS · anti-framing</small></div><button className={hardened ? 'toggle-on' : ''} role="switch" aria-checked={hardened} aria-label="Activer le profil renforcé" onClick={() => setHardened(!hardened)}><i/></button></div> : <><label htmlFor="lab-sim-input">{selected.kind === 'csrf' ? 'Jeton anti-CSRF' : selected.kind === 'access' ? 'Identifiant du dossier' : selected.kind === 'api' ? 'Identifiant du profil API' : selected.kind === 'ssrf' ? 'URL à vérifier (simulation)' : selected.kind === 'exposure' ? 'Commande d’inspection' : selected.kind === 'xss' ? 'Contenu de message à afficher' : 'Valeur de recherche'}</label><input id="lab-sim-input" className="simulator-input" value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => event.key === 'Enter' && void run()} placeholder={selected.placeholder}/></>}
          {selected.kind === 'misconfig' && <p className="config-note">Les changements ne modifient qu’un état de démonstration dans cette page.</p>}
          <div className="sim-actions"><button className="sim-run" onClick={() => void run()}><Play size={14} fill="currentColor"/> Lancer la simulation</button><button className="sim-reset" onClick={reset}><RotateCcw size={14}/> Réinitialiser</button></div>
          <div className={`sim-result ${result ? result.success ? 'sim-success' : 'sim-warning' : ''}`} aria-live="polite"><div className="sim-result-icon">{result?.success ? <CheckCircle2 size={17}/> : result ? <ShieldAlert size={17}/> : <Terminal size={16}/>}</div><div><b>{result?.success ? 'Objectif atteint' : result ? 'À examiner' : 'Résultat de la simulation'}</b><p>{result?.message ?? 'Lance une simulation pour observer la réponse du système fictif.'}</p></div></div>
          {selected.kind === 'xss' && input && <div className="output-preview"><span>APERÇU ÉCHAPPÉ — TEXTE UNIQUEMENT</span><p>{input}</p></div>}
          {selected.kind === 'exposure' && result?.success && <div className="masked-response"><span>email</span><code>a***@exemple.test</code><span>api_token</span><code>[MASQUÉ]</code></div>}
          <div className="simulator-foot"><LockKeyhole size={12}/> Traitement local uniquement · Aucun trafic réseau sortant</div>
        </div></div>}</div>
      {progress[selected.slug]?.completed && <div className="lab-complete-banner"><CheckCircle2 size={17}/> Laboratoire validé · {progress[selected.slug].attempts} tentative(s) <button onClick={reset}>Recommencer</button></div>}
    </section> : <>
      <div className="lab-filter-bar"><div><span className="eyebrow">PARCOURS PRATIQUES</span><b>Choisissez un laboratoire</b></div><div className="lab-filters">{(['Tous', 'DVWA', 'OWASP TOP 10'] as const).map(value => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{value}</button>)}</div></div>
      <div className="interactive-lab-grid">{filtered.map(lab => { const state = progress[lab.slug] ?? blankProgress; return <article className="interactive-lab-card" key={lab.slug}><div className="interactive-card-top"><span className={`lab-platform ${lab.platform === 'DVWA' ? 'dvwa-platform' : 'owasp-platform'}`}>{lab.platform}</span><span className="lab-card-area">{lab.area}</span></div><div className="interactive-card-icon"><FlaskConical size={21}/></div><h3>{lab.title}</h3><p>{lab.description}</p><div className="interactive-progress"><div><i style={{width:`${state.progress}%`}}/></div><span>{state.completed ? 'Validé' : state.progress ? `${state.progress}%` : 'À découvrir'}</span></div><button className="open-lab-button" onClick={() => openLab(lab)}>{state.completed ? 'Revoir le lab' : state.attempts ? 'Reprendre' : 'Démarrer le lab'} <ArrowRight size={14}/></button></article> })}</div>
    </>}
    <div className="lab-reference-note"><ShieldAlert size={15}/><span><b>Progression DVWA :</b> les validations sont enregistrées par YA CyberLab dans Supabase ou en mode démo. Elles reposent sur les étapes confirmées par l’apprenant ; la fédération de connexion ne fournit pas à elle seule un résultat vérifié par DVWA.</span><a href="https://owasp.org/www-project-top-ten/" target="_blank" rel="noreferrer">OWASP Top 10 <ExternalLink size={12}/></a></div>
  </>;
}

function TargetIcon(){return <span className="objective-target"><Check size={16}/></span>}
function CircleHint(){return <span className="circle-hint">i</span>}
