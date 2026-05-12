'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';

import { signInWithPassword, signUpWithPassword } from '@/app/actions/auth';
import { WorkflowNotice } from '@/components/workflow/workflow-panels';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type AuthMode = 'signin' | 'signup';

function getSafeRedirectPath(nextPath: string) {
  if (!nextPath.startsWith('/') || nextPath.startsWith('//')) {
    return '/app';
  }

  return nextPath;
}

export function AuthGateway({
  nextPath,
  defaultMode,
  signupState,
  emailHint,
}: {
  nextPath: string;
  defaultMode: AuthMode;
  signupState: string | null;
  emailHint: string;
}) {
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const safeNextPath = getSafeRedirectPath(nextPath);

  const signupNotice = useMemo(() => {
    if (signupState !== 'check-email') {
      return null;
    }

    return emailHint
      ? `Check ${emailHint} to confirm your account, then sign in.`
      : 'Check your email to confirm your account, then sign in.';
  }, [emailHint, signupState]);

  async function handleSubmit(formData: FormData) {
    setError(null);

    startTransition(async () => {
      const action = mode === 'signup' ? signUpWithPassword : signInWithPassword;
      const result = await action(formData);

      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
        <div className="max-w-xl flex-1">
          <Link href="/" className="mb-6 inline-flex text-sm text-white/60 transition-colors hover:text-white">
            ← Back to WIZUP
          </Link>
          <h1 className="mb-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Sign in to keep building.
          </h1>
          <p className="mb-6 max-w-lg text-base leading-relaxed text-white/60 sm:text-lg">
            Save your onboarding answers, protect your workspace, and move through Ideas, Examples, Product, Sales Kit, Store, and Saved without losing progress.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              'Protected workspace access',
              'Onboarding answers synced after login',
              'Saved workflow history across sessions',
            ].map((item) => (
              <div key={item} className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
                {item}
              </div>
            ))}
          </div>
        </div>

        <Card className="w-full max-w-lg border-white/5 bg-card p-6 sm:p-8">
          <div className="mb-6 flex rounded-full border border-white/5 bg-white/[0.03] p-1">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                mode === 'signin' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                mode === 'signup' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
              }`}
            >
              Create account
            </button>
          </div>

          <div className="mb-5 space-y-3">
            {signupNotice ? <WorkflowNotice tone="success">{signupNotice}</WorkflowNotice> : null}
            {error ? <WorkflowNotice tone="error">{error}</WorkflowNotice> : null}
          </div>

          <form action={handleSubmit} className="space-y-4">
            <input type="hidden" name="next" value={safeNextPath} />

            {mode === 'signup' ? (
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-white/40">
                  Full name
                </label>
                <Input name="full_name" placeholder="Your name" className="h-12 border-white/10 bg-black/30 text-white" />
              </div>
            ) : null}

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-white/40">
                Email
              </label>
              <Input
                defaultValue={emailHint}
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="h-12 border-white/10 bg-black/30 text-white"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-white/40">
                Password
              </label>
              <Input
                name="password"
                type="password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                placeholder={mode === 'signup' ? 'Create a password' : 'Enter your password'}
                className="h-12 border-white/10 bg-black/30 text-white"
                required
              />
            </div>

            <Button type="submit" disabled={isPending} className="h-12 w-full text-sm font-semibold">
              {isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === 'signup' ? 'Creating account' : 'Signing in'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  {mode === 'signup' ? 'Create account' : 'Sign in'}
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs uppercase tracking-widest text-white/35">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <Link href={`/auth/login?next=${encodeURIComponent(safeNextPath)}`}>
            <Button type="button" variant="outline" className="h-12 w-full border-white/10 text-white hover:bg-white/5">
              Continue with Google
            </Button>
          </Link>

          <p className="mt-5 text-center text-sm text-white/45">
            {mode === 'signup' ? 'Already have an account?' : 'Need an account?'}{' '}
            <button
              type="button"
              onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
              className="text-white transition-colors hover:text-primary"
            >
              {mode === 'signup' ? 'Sign in' : 'Create one'}
            </button>
          </p>
        </Card>
      </div>
    </div>
  );
}
