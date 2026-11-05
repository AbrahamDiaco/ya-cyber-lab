import { useEffect, useState } from 'react';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Auth() {
  const [dark, setDark] = useState(true);
  useEffect(() => { setDark(document.documentElement.classList.contains('dark')); }, []);
  return <main className="auth-page">
    <Link to="/" className="auth-back"><ArrowLeft size={17} /> Retour à YA CyberLab</Link>
    <section className="auth-card">
      <div className="brand-mark"><ShieldCheck size={24} /></div>
      <span className="eyebrow">ESPACE APPRENANT</span>
      <h1>Bienvenue dans le lab.</h1>
      <p>Connectez-vous pour retrouver vos parcours et votre progression.</p>
      <SupabaseAuth supabaseClient={supabase} view="sign_in" redirectTo={new URL('/auth/callback', window.location.origin).href} providers={[]} appearance={{ theme: ThemeSupa, variables: { default: { colors: { brand: '#2563eb', brandAccent: '#1d4ed8', inputBackground: dark ? '#101b2c' : '#ffffff', inputBorder: dark ? '#26364b' : '#dce4ef', inputText: dark ? '#f4f7fc' : '#142033', defaultButtonBackground: dark ? '#101b2c' : '#ffffff', defaultButtonText: dark ? '#f4f7fc' : '#142033' } } } }} theme={dark ? 'dark' : 'light'} />
      <small>Démo disponible sans compte : explorez les laboratoires depuis l’accueil.</small>
    </section>
  </main>;
}
