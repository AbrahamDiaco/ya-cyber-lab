import { useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { Activity, ArrowLeft, ArrowRight, Check, CheckCircle2, Clock3, ExternalLink, FlaskConical, LockKeyhole, Play, RotateCcw, ShieldAlert, ShieldCheck, Terminal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { evaluateLab, labs, type LabDefinition } from '@/data/labs';
import './LabExplorer.css';

type LabProgress = { completed: boolean; progress: number; attempts: number };
type LabProgressMap = Record<string, LabProgress>;
const STORAGE_KEY = 'ya_lab_progress';
const blankProgress: LabProgress = { completed: false, progress: 0, attempts: 0 };

export default function LabExplorer({ user }: { user: User | null }) {
  const [selected, setSelected] = useState<LabDefinition | null>(null);
  const [filter, setFilter] = useState<'Tous' | 'DVWA' | 'OWASP TOP 10'>('Tous');
  const [input, setInput] = useState('');
  const [hardened, setHardened] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [progress, setProgress] = useState<LabProgressMap>(() => JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      setProgress(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
      return;
    }
    supabase.from('lab_progress').select('lab_slug,completed,progress,attempts').eq('user_id', user.id).then(({ data }) => {
      if (data) setProgress(Object.fromEntries(data.map(row => [row.lab_slug, { completed: row.completed, progress: row.progress, attempts: row.attempts }])));
    });
  }, [user]);

  const filtered = useMemo(() => labs.filter(lab => filter === 'Tous' || lab.platform === filter), [filter]);
  const completeCount = labs.filter(lab => progress[lab.slug]?.completed).length;
  const aggregateProgress = Math.round(completeCount / labs.length * 100);

  const persist = async (lab: LabDefinition, success: boolean) => {
    const previous = progress[lab.slug] ?? blankProgress;
    const next = { completed: previous.completed || success, progress: success || previous.completed ? 100 : Math.max(previous.progress, 35), attempts: previous.attempts + 1 };
    const nextProgress = { ...progress, [lab.slug]: next };
    setProgress(nextProgress);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProgress));
    if (user) {
      setSaving(true);
      const { error } = await supabase.from('lab_progress').upsert({ user_id: user.id, lab_slug: lab.slug, ...next, updated_at: new Date().toISOString() }, { onConflict: 'user_id,lab_slug' });
      setSaving(false);
      if (error) return;
    }
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
    await persist(selected, outcome.success);
  };

  const reset = () => { setInput(''); setHardened(false); setResult(null); };

  return <>
    <div className="page-intro"><div className="eyebrow">PRATIQUER EN ENVIRONNEMENT CONTRÔLÉ</div><h1>Laboratoires pratiques</h1><p>Exercices pédagogiques inspirés de DVWA et de l’OWASP Top 10. Toutes les actions restent dans ce navigateur.</p></div>
    <div className="lab-safety"><div className="lab-safety-icon"><ShieldCheck size={20}/></div><div><b>Bac à sable local — aucun système réel n’est contacté</b><p>Les scénarios sont simulés côté interface : aucun payload n’est envoyé, aucune requête n’est exécutée sur un serveur de laboratoire.</p></div><span className="isolation-chip"><LockKeyhole size={12}/> ISOLÉ</span></div>
    <section className="lab-progress-overview"><div className="lab-overview-copy"><span className="eyebrow">VOTRE PROGRESSION</span><b>{completeCount} <small>/ {labs.length} labs terminés</small></b><span>{saving ? 'Synchronisation en cours…' : user ? 'Progression synchronisée avec votre compte' : 'Progression enregistrée sur cet appareil'}</span></div><div className="lab-overview-bar"><div><i style={{ width: `${aggregateProgress}%` }}/></div><b>{aggregateProgress}%</b></div></section>
    {selected ? <section className="lab-workspace" aria-label={`Laboratoire ${selected.title}`}>
      <div className="lab-workspace-head"><button className="lab-back" onClick={() => setSelected(null)}><ArrowLeft size={15}/> Tous les laboratoires</button><span className={`lab-platform ${selected.platform === 'DVWA' ? 'dvwa-platform' : 'owasp-platform'}`}>{selected.platform}</span></div>
      <div className="lab-workspace-grid"><div className="lab-challenge"><div className="eyebrow">{selected.area}</div><h2>{selected.title}</h2><p>{selected.description}</p><div className="lab-objective"><TargetIcon/><div><b>Objectif du scénario</b><span>{selected.objective}</span></div></div><div className="lab-hint"><CircleHint/><span>{selected.hint}</span></div><div className="lab-challenge-meta"><span><Clock3 size={13}/> 5–10 min</span><span><Activity size={13}/> {progress[selected.slug]?.attempts ?? 0} tentative(s)</span></div></div>
        <div className="lab-simulator"><div className="simulator-top"><div className="window-dots"><i/><i/><i/></div><span>{selected.platform === 'DVWA' ? 'dvwa-sandbox.local' : 'owasp-lab.local'} <span>· simulation</span></span><span className="secure-label"><ShieldCheck size={12}/> LOCAL</span></div><div className="simulator-body"><div className="simulator-title"><Terminal size={15}/><b>{selected.area}</b><span>SCÉNARIO FICTIF</span></div>
          {selected.kind === 'misconfig' ? <div className="config-toggle"><div><b>Profil de sécurité renforcé</b><small>CSP · HSTS · anti-framing</small></div><button className={hardened ? 'toggle-on' : ''} role="switch" aria-checked={hardened} aria-label="Activer le profil renforcé" onClick={() => setHardened(!hardened)}><i/></button></div> : <><label htmlFor="lab-sim-input">{selected.kind === 'csrf' ? 'Jeton anti-CSRF' : selected.kind === 'access' ? 'Identifiant du dossier' : selected.kind === 'api' ? 'Identifiant du profil API' : selected.kind === 'ssrf' ? 'URL à vérifier (simulation)' : selected.kind === 'exposure' ? 'Commande d’inspection' : selected.kind === 'xss' ? 'Contenu de message à afficher' : 'Valeur de recherche'}</label><input id="lab-sim-input" className="simulator-input" value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => event.key === 'Enter' && void run()} placeholder={selected.placeholder}/></>}
          {selected.kind === 'misconfig' && <p className="config-note">Les changements ne modifient qu’un état de démonstration dans cette page.</p>}
          <div className="sim-actions"><button className="sim-run" onClick={() => void run()}><Play size={14} fill="currentColor"/> Lancer la simulation</button><button className="sim-reset" onClick={reset}><RotateCcw size={14}/> Réinitialiser</button></div>
          <div className={`sim-result ${result ? result.success ? 'sim-success' : 'sim-warning' : ''}`} aria-live="polite"><div className="sim-result-icon">{result?.success ? <CheckCircle2 size={17}/> : result ? <ShieldAlert size={17}/> : <Terminal size={16}/>}</div><div><b>{result?.success ? 'Objectif atteint' : result ? 'À examiner' : 'Résultat de la simulation'}</b><p>{result?.message ?? 'Lance une simulation pour observer la réponse du système fictif.'}</p></div></div>
          {selected.kind === 'xss' && input && <div className="output-preview"><span>APERÇU ÉCHAPPÉ — TEXTE UNIQUEMENT</span><p>{input}</p></div>}
          {selected.kind === 'exposure' && result?.success && <div className="masked-response"><span>email</span><code>a***@exemple.test</code><span>api_token</span><code>[MASQUÉ]</code></div>}
          <div className="simulator-foot"><LockKeyhole size={12}/> Traitement local uniquement · Aucun trafic réseau sortant</div>
        </div></div></div>
      {progress[selected.slug]?.completed && <div className="lab-complete-banner"><CheckCircle2 size={17}/> Laboratoire validé · {progress[selected.slug].attempts} tentative(s) <button onClick={reset}>Recommencer</button></div>}
    </section> : <>
      <div className="lab-filter-bar"><div><span className="eyebrow">PARCOURS PRATIQUES</span><b>Choisissez un laboratoire</b></div><div className="lab-filters">{(['Tous', 'DVWA', 'OWASP TOP 10'] as const).map(value => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{value}</button>)}</div></div>
      <div className="interactive-lab-grid">{filtered.map(lab => { const state = progress[lab.slug] ?? blankProgress; return <article className="interactive-lab-card" key={lab.slug}><div className="interactive-card-top"><span className={`lab-platform ${lab.platform === 'DVWA' ? 'dvwa-platform' : 'owasp-platform'}`}>{lab.platform}</span><span className="lab-card-area">{lab.area}</span></div><div className="interactive-card-icon"><FlaskConical size={21}/></div><h3>{lab.title}</h3><p>{lab.description}</p><div className="interactive-progress"><div><i style={{width:`${state.progress}%`}}/></div><span>{state.completed ? 'Validé' : state.progress ? `${state.progress}%` : 'À découvrir'}</span></div><button className="open-lab-button" onClick={() => openLab(lab)}>{state.completed ? 'Revoir le lab' : state.attempts ? 'Reprendre' : 'Démarrer le lab'} <ArrowRight size={14}/></button></article> })}</div>
    </>}
    <div className="lab-reference-note"><ShieldAlert size={15}/><span><b>Référentiels :</b> DVWA est une application volontairement vulnérable à déployer uniquement dans un environnement de test isolé. Cette version propose des simulations locales inspirées de ses exercices et des catégories OWASP Top 10, sans connexion à une instance DVWA externe.</span><a href="https://owasp.org/www-project-top-ten/" target="_blank" rel="noreferrer">OWASP Top 10 <ExternalLink size={12}/></a></div>
  </>;
}

function TargetIcon(){return <span className="objective-target"><Check size={16}/></span>}
function CircleHint(){return <span className="circle-hint">i</span>}
