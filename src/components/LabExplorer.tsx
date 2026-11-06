import { useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { Activity, ArrowLeft, ArrowRight, Check, CheckCircle2, Clock3, ExternalLink, FlaskConical, LockKeyhole, Play, RotateCcw, ShieldAlert, ShieldCheck, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { evaluateLab, labs, type LabDefinition } from '@/data/labs';
import './LabExplorer.css';

type LabProgress = { completed: boolean; progress: number; attempts: number };
type VerifiedLabProgress = LabProgress & { lastVerifiedAt: string | null };
type LabProgressMap = Record<string, LabProgress>;
const STORAGE_KEY = 'ya_lab_progress';
const DVWA_ORIGIN = 'https://dvwa.ya-consulting.com';
const blankProgress: LabProgress = { completed: false, progress: 0, attempts: 0 };
const owaspSlugs = ['owasp-api', 'owasp-exposure', 'owasp-misconfig', 'owasp-ssrf'];

export default function LabExplorer({ user }: { user: User | null }) {
  const [selected, setSelected] = useState<LabDefinition | null>(null);
  const [filter, setFilter] = useState<'Tous' | 'DVWA' | 'OWASP TOP 10'>('Tous');
  const [input, setInput] = useState('');
  const [hardened, setHardened] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [progress, setProgress] = useState<LabProgressMap>(() => JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
  const [verifiedProgress, setVerifiedProgress] = useState<Record<string, VerifiedLabProgress>>({});
  const [saving, setSaving] = useState(false);
  const [syncError, setSyncError] = useState(false);

  useEffect(() => {
    if (!user) {
      setProgress(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
      setVerifiedProgress({});
      return;
    }
    supabase.from('lab_progress').select('lab_slug,completed,progress,attempts').eq('user_id', user.id).in('lab_slug', owaspSlugs).then(({ data, error }) => {
      if (error) setSyncError(true);
      else if (data) setProgress(Object.fromEntries(data.map(row => [row.lab_slug, { completed: row.completed, progress: row.progress, attempts: row.attempts }])));
    });
  }, [user]);

  useEffect(() => {
    if (!user) {
      setVerifiedProgress({});
      return;
    }
    const refreshVerified = async () => {
      const { data, error } = await supabase.from('dvwa_lab_progress').select('lab_slug,completed,progress,attempts,last_verified_at').eq('user_id', user.id);
      if (error) {
        setSyncError(true);
        return;
      }
      if (data) {
        setVerifiedProgress(Object.fromEntries(data.map(row => [row.lab_slug, { completed: row.completed, progress: row.progress, attempts: row.attempts, lastVerifiedAt: row.last_verified_at }])));
        setSyncError(false);
      }
    };
    void refreshVerified();
    window.addEventListener('focus', refreshVerified);
    return () => window.removeEventListener('focus', refreshVerified);
  }, [user]);

  const filtered = useMemo(() => labs.filter(lab => filter === 'Tous' || lab.platform === filter), [filter]);
  const completeCount = labs.filter(lab => lab.platform === 'DVWA' ? verifiedProgress[lab.slug]?.completed : progress[lab.slug]?.completed).length;
  const aggregateProgress = Math.round(completeCount / labs.length * 100);

  const saveOwaspProgress = async (lab: LabDefinition, next: LabProgress) => {
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

  const openLab = (lab: LabDefinition) => {
    setSelected(lab);
    setInput('');
    setHardened(false);
    setResult(null);
  };

  const run = async () => {
    if (!selected || selected.platform !== 'OWASP TOP 10') return;
    const outcome = evaluateLab(selected.kind, input, hardened);
    setResult(outcome);
    const previous = progress[selected.slug] ?? blankProgress;
    await saveOwaspProgress(selected, {
      completed: previous.completed || outcome.success,
      progress: outcome.success || previous.completed ? 100 : Math.max(previous.progress, 35),
      attempts: previous.attempts + 1
    });
  };

  const reset = () => { setInput(''); setHardened(false); setResult(null); };
  const currentProgress = selected?.platform === 'DVWA' ? verifiedProgress[selected.slug] : selected ? progress[selected.slug] : undefined;

  return <>
    <div className="page-intro"><div className="eyebrow">PRATIQUER EN ENVIRONNEMENT CONTRÔLÉ</div><h1>Laboratoires pratiques</h1><p>Exercices DVWA vérifiés par l’instance de formation et simulations OWASP locales.</p></div>
    <div className="lab-safety"><div className="lab-safety-icon"><ShieldCheck size={20}/></div><div><b>Instance de formation dédiée</b><p>Les exercices DVWA s’ouvrent sur dvwa.ya-consulting.com. Les validations certifiées proviennent du serveur DVWA, pas d’une déclaration dans le navigateur.</p></div><span className="isolation-chip"><LockKeyhole size={12}/> AUTORISÉ</span></div>
    <section className="lab-progress-overview"><div className="lab-overview-copy"><span className="eyebrow">VOTRE PROGRESSION</span><b>{completeCount} <small>/ {labs.length} labs terminés</small></b><span>{saving ? 'Synchronisation en cours…' : syncError ? 'Synchronisation indisponible — réessayez plus tard' : user ? 'DVWA certifié par serveur · OWASP suivi dans votre compte' : 'OWASP enregistré sur cet appareil · connectez-vous pour les résultats DVWA'}</span></div><div className="lab-overview-bar"><div><i style={{ width: `${aggregateProgress}%` }}/></div><b>{aggregateProgress}%</b></div></section>
    {selected ? <section className="lab-workspace" aria-label={`Laboratoire ${selected.title}`}>
      <div className="lab-workspace-head"><button className="lab-back" onClick={() => setSelected(null)}><ArrowLeft size={15}/> Tous les laboratoires</button><span className={`lab-platform ${selected.platform === 'DVWA' ? 'dvwa-platform' : 'owasp-platform'}`}>{selected.platform}</span></div>
      <div className="lab-workspace-grid"><div className="lab-challenge"><div className="eyebrow">{selected.area}</div><h2>{selected.title}</h2><p>{selected.description}</p><div className="lab-objective"><TargetIcon/><div><b>Objectif du scénario</b><span>{selected.objective}</span></div></div><div className="lab-hint"><CircleHint/><span>{selected.hint}</span></div><div className="lab-challenge-meta"><span><Clock3 size={13}/> 5–10 min</span><span><Activity size={13}/> {currentProgress?.attempts ?? 0} tentative(s)</span></div></div>
        {selected.platform === 'DVWA' ? <Dvwaworkspace lab={selected} progress={verifiedProgress[selected.slug]} user={user}/> : <div className="lab-simulator"><div className="simulator-top"><div className="window-dots"><i/><i/><i/></div><span>owasp-lab.local <span>· simulation locale</span></span><span className="secure-label"><ShieldCheck size={12}/> LOCAL</span></div><div className="simulator-body"><div className="simulator-title"><Terminal size={15}/><b>{selected.area}</b><span>SCÉNARIO FICTIF</span></div>
          {selected.kind === 'misconfig' ? <div className="config-toggle"><div><b>Profil de sécurité renforcé</b><small>CSP · HSTS · anti-framing</small></div><button className={hardened ? 'toggle-on' : ''} role="switch" aria-checked={hardened} aria-label="Activer le profil renforcé" onClick={() => setHardened(!hardened)}><i/></button></div> : <><label htmlFor="lab-sim-input">{selected.kind === 'csrf' ? 'Jeton anti-CSRF' : selected.kind === 'access' ? 'Identifiant du dossier' : selected.kind === 'api' ? 'Identifiant du profil API' : selected.kind === 'ssrf' ? 'URL à vérifier (simulation)' : selected.kind === 'exposure' ? 'Commande d’inspection' : selected.kind === 'xss' ? 'Contenu de message à afficher' : 'Valeur de recherche'}</label><input id="lab-sim-input" className="simulator-input" value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => event.key === 'Enter' && void run()} placeholder={selected.placeholder}/></>}
          {selected.kind === 'misconfig' && <p className="config-note">Les changements ne modifient qu’un état de démonstration dans cette page.</p>}
          <div className="sim-actions"><button className="sim-run" onClick={() => void run()}><Play size={14} fill="currentColor"/> Lancer la simulation</button><button className="sim-reset" onClick={reset}><RotateCcw size={14}/> Réinitialiser</button></div>
          <div className={`sim-result ${result ? result.success ? 'sim-success' : 'sim-warning' : ''}`} aria-live="polite"><div className="sim-result-icon">{result?.success ? <CheckCircle2 size={17}/> : result ? <ShieldAlert size={17}/> : <Terminal size={16}/>}</div><div><b>{result?.success ? 'Objectif atteint' : result ? 'À examiner' : 'Résultat de la simulation'}</b><p>{result?.message ?? 'Lance une simulation pour observer la réponse du système fictif.'}</p></div></div>
          {selected.kind === 'xss' && input && <div className="output-preview"><span>APERÇU ÉCHAPPÉ — TEXTE UNIQUEMENT</span><p>{input}</p></div>}
          {selected.kind === 'exposure' && result?.success && <div className="masked-response"><span>email</span><code>a***@exemple.test</code><span>api_token</span><code>[MASQUÉ]</code></div>}
          <div className="simulator-foot"><LockKeyhole size={12}/> Traitement local uniquement · Aucun trafic réseau sortant</div>
        </div></div>}</div>
      {currentProgress?.completed && <div className="lab-complete-banner"><CheckCircle2 size={17}/> {selected.platform === 'DVWA' ? 'Réussite vérifiée par DVWA' : 'Simulation terminée'} · {currentProgress.attempts} tentative(s)</div>}
    </section> : <>
      <div className="lab-filter-bar"><div><span className="eyebrow">PARCOURS PRATIQUES</span><b>Choisissez un laboratoire</b></div><div className="lab-filters">{(['Tous', 'DVWA', 'OWASP TOP 10'] as const).map(value => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{value}</button>)}</div></div>
      <div className="interactive-lab-grid">{filtered.map(lab => { const state = (lab.platform === 'DVWA' ? verifiedProgress[lab.slug] : progress[lab.slug]) ?? blankProgress; return <article className="interactive-lab-card" key={lab.slug}><div className="interactive-card-top"><span className={`lab-platform ${lab.platform === 'DVWA' ? 'dvwa-platform' : 'owasp-platform'}`}>{lab.platform}</span><span className="lab-card-area">{lab.area}</span></div><div className="interactive-card-icon"><FlaskConical size={21}/></div><h3>{lab.title}</h3><p>{lab.description}</p><div className="interactive-progress"><div><i style={{width:`${state.progress}%`}}/></div><span>{lab.platform === 'DVWA' ? state.completed ? 'Vérifié' : 'En attente' : state.completed ? 'Validé' : state.progress ? `${state.progress}%` : 'À découvrir'}</span></div><button className="open-lab-button" onClick={() => openLab(lab)}>{state.completed ? 'Revoir le lab' : state.attempts ? 'Reprendre' : 'Démarrer le lab'} <ArrowRight size={14}/></button></article> })}</div>
    </>}
    <div className="lab-reference-note"><ShieldAlert size={15}/><span><b>Résultats DVWA :</b> une réussite n’est certifiée qu’après réception d’un événement HMAC signé émis côté serveur par l’instance DVWA. Les simulations OWASP restent locales et sont suivies séparément.</span><a href="https://owasp.org/www-project-top-ten/" target="_blank" rel="noreferrer">OWASP Top 10 <ExternalLink size={12}/></a></div>
  </>;
}

function Dvwaworkspace({ lab, progress, user }: { lab: LabDefinition; progress?: VerifiedLabProgress; user: User | null }) {
  const lastVerified = progress?.lastVerifiedAt ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(progress.lastVerifiedAt)) : null;
  return <div className="dvwa-workspace"><div className="simulator-top"><div className="window-dots"><i/><i/><i/></div><span>dvwa.ya-consulting.com <span>· instance de formation</span></span><span className="secure-label"><ShieldCheck size={12}/> HTTPS</span></div><div className="dvwa-workspace-body"><div className="dvwa-open-card"><div className="dvwa-open-icon"><ExternalLink size={18}/></div><div><b>Exercice sur votre instance DVWA</b><p>La réussite sera certifiée uniquement après validation côté serveur et envoi d’un événement signé. Une confirmation dans YA CyberLab ne peut pas valider le laboratoire.</p></div></div><a className="dvwa-launch" href={`${DVWA_ORIGIN}${lab.dvwaPath}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={15}/> Ouvrir {lab.title} dans DVWA <ArrowRight size={15}/></a><div className={`dvwa-verification-state ${progress?.completed ? 'verified' : ''}`} aria-live="polite">{progress?.completed ? <><CheckCircle2 size={18}/><div><b>Réussite vérifiée par DVWA</b><span>{progress.attempts} événement(s) confirmé(s){lastVerified ? ` · dernière vérification : ${lastVerified}` : ''}</span></div></> : <><Activity size={18}/><div><b>En attente d’un résultat signé</b><span>{user ? 'Après la réussite dans DVWA, le serveur transmettra la validation à YA CyberLab.' : 'Connectez-vous à YA CyberLab pour rattacher le résultat vérifié à votre compte.'}</span>{!user && <Link to="/auth">Se connecter</Link>}</div></>}</div><div className="dvwa-progress-line"><div><i style={{ width: `${progress?.progress ?? 0}%` }}/></div><b>{progress?.progress ?? 0}%</b></div><div className="simulator-foot"><LockKeyhole size={12}/> État certifié par le serveur DVWA · aucune auto-déclaration</div></div></div>;
}

function TargetIcon(){return <span className="objective-target"><Check size={16}/></span>}
function CircleHint(){return <span className="circle-hint">i</span>}
