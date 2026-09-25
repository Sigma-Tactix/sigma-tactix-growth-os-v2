import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { emailSignIn, emailSignUp, googleSignIn, initAuth } from '@/src/lib/auth';

type AuthGateProps = { children: ReactNode };

/**
 * Keeps server-owned workspace data behind an actual Supabase application
 * session. Signing into the Supabase dashboard is intentionally not enough:
 * the browser that uses Growth OS needs its own session token.
 */
export default function AuthGate({ children }: AuthGateProps) {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => initAuth(
    (nextUser) => {
      setUser(nextUser);
      setChecking(false);
    },
    () => {
      setUser(null);
      setChecking(false);
    },
  ), []);

  const submitEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      if (mode === 'signUp') {
        const { signUpSent } = await emailSignUp(email.trim(), password);
        if (signUpSent) setNotice('Check your email to confirm your account, then sign in here.');
      } else {
        await emailSignIn(email.trim(), password);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitGoogle = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await googleSignIn();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to start Google sign-in.');
      setSubmitting(false);
    }
  };

  if (checking) {
    return <main className="grid min-h-[100dvh] place-items-center bg-background text-sm sigma-muted">Checking workspace session…</main>;
  }

  if (user) return <>{children}</>;

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-background px-6 py-12 sigma-text">
      <section className="sigma-card-feature w-full max-w-md p-7">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#d83c18]">Sigma Tactix Growth OS</p>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Sign in to this workspace</h1>
        <p className="sigma-text-soft mt-2 text-sm leading-6">A Supabase dashboard login does not sign this app in. Use the account authorized for your analytics and connector records.</p>

        <button type="button" onClick={submitGoogle} disabled={submitting} className="sigma-button-secondary mt-6 w-full px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60">
          Continue with Google
        </button>
        <p className="sigma-muted mt-2 text-xs">Google sign-in requests read-only Analytics and Google Ads access. GA4 service-account verification remains separate.</p>

        <div className="sigma-muted my-6 flex items-center gap-3 text-xs"><span className="sigma-divider h-px flex-1 border-t" />or<span className="sigma-divider h-px flex-1 border-t" /></div>
        <form onSubmit={submitEmail} className="space-y-3">
          <label className="block text-sm font-medium">Email<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="sigma-input mt-1.5 w-full px-3 py-2.5" /></label>
          <label className="block text-sm font-medium">Password<input type="password" autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'} required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} className="sigma-input mt-1.5 w-full px-3 py-2.5" /></label>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
          <button type="submit" disabled={submitting} className="sigma-button-primary w-full px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60">{mode === 'signIn' ? 'Sign in with email' : 'Create account'}</button>
        </form>
        <button type="button" onClick={() => { setMode(mode === 'signIn' ? 'signUp' : 'signIn'); setError(null); setNotice(null); }} className="mt-5 text-sm font-medium text-[#c93616] hover:text-[#9f2d13]">
          {mode === 'signIn' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
        </button>
      </section>
    </main>
  );
}
