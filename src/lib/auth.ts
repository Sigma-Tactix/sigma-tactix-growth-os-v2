import type { User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

// Google OAuth access token, for calling Google Analytics/Ads APIs directly.
// Only available in this session after a fresh sign-in / session restore —
// Supabase doesn't replay it, so it's re-cached on every auth state change.
let cachedGoogleAccessToken: string | null = null;

// Initialize auth state listener. Call this on app load. Fires onAuthSuccess
// whenever a Supabase session exists — including one restored from a prior
// visit (Supabase persists sessions to localStorage automatically).
export const initAuth = (
  onAuthSuccess?: (user: User) => void,
  onAuthFailure?: () => void
) => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.provider_token) cachedGoogleAccessToken = session.provider_token;
    if (session?.user) onAuthSuccess?.(session.user);
    else onAuthFailure?.();
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.provider_token) cachedGoogleAccessToken = session.provider_token;
    if (session?.user) {
      onAuthSuccess?.(session.user);
    } else {
      cachedGoogleAccessToken = null;
      onAuthFailure?.();
    }
  });

  return () => subscription.unsubscribe();
};

// Redirect-based sign-in (Supabase's default OAuth flow) — the browser
// navigates to Google and back; the result lands via the onAuthStateChange
// listener above, not this function's return value.
export const googleSignIn = async (): Promise<void> => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      scopes: 'https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/adwords',
      redirectTo: window.location.origin,
    },
  });
  if (error) throw error;
};

// Email/password sign-in. Session lands via the onAuthStateChange listener
// in initAuth, same as googleSignIn — no provider_token though, so
// Google Analytics/Ads API calls aren't available for email-auth sessions.
export const emailSignIn = async (email: string, password: string): Promise<void> => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
};

// Email/password sign-up. If Supabase has email confirmation enabled, no
// session is returned here and the user must confirm via email first —
// signUpSent below distinguishes that case from an immediate session.
// emailRedirectTo mirrors googleSignIn's redirectTo: without it, Supabase
// falls back to the dashboard's Site URL (or rejects the redirect outright
// if it isn't on the allow-list) instead of sending the user back here.
export const emailSignUp = async (email: string, password: string): Promise<{ signUpSent: boolean }> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) throw error;
  return { signUpSent: !data.session };
};

// Supabase session access token — used to authenticate requests to our own
// backend (src/lib/api.ts). Auto-refreshes via the Supabase SDK if expired.
export const getIdToken = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
};

// Google OAuth access token — used to call Google Analytics/Ads APIs
// directly (src/lib/google-api.ts).
export const getGoogleAccessToken = (): string | null => cachedGoogleAccessToken;

export const logout = async () => {
  await supabase.auth.signOut();
  cachedGoogleAccessToken = null;
};
