'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/types';

export type OnboardingAnswers = {
  productType: string;
  audience: string;
  market: string;
  startingPoint: string;
};

type AuthActionResult = {
  error: string | null;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function getSafeRedirectPath(nextPath: string) {
  if (!nextPath.startsWith('/')) {
    return '/app';
  }

  if (nextPath.startsWith('//')) {
    return '/app';
  }

  return nextPath;
}

export async function signInWithPassword(
  formData: FormData
): Promise<AuthActionResult> {
  const email = getString(formData, 'email');
  const password = getString(formData, 'password');
  const nextPath = getSafeRedirectPath(getString(formData, 'next') || '/app');

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/app', 'layout');
  redirect(nextPath);
}

export async function signUpWithPassword(
  formData: FormData
): Promise<AuthActionResult> {
  const email = getString(formData, 'email');
  const password = getString(formData, 'password');
  const fullName = getString(formData, 'full_name');
  const nextPath = getSafeRedirectPath(getString(formData, 'next') || '/app');

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: fullName ? { full_name: fullName } : undefined,
      emailRedirectTo: undefined,
    },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/app', 'layout');

  if (data.session) {
    redirect(nextPath);
  }

  redirect(`/login?mode=signup&signup=check-email&email=${encodeURIComponent(email)}`);
}

export async function persistOnboardingAnswers(
  answers: OnboardingAnswers
): Promise<AuthActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { error: userError.message };
  }

  if (!user) {
    return { error: 'Sign in to save onboarding progress.' };
  }

  const payload: Json = {
    productType: answers.productType,
    audience: answers.audience,
    market: answers.market,
    startingPoint: answers.startingPoint,
    savedAt: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('profiles')
    .update({
      onboarding_completed: true,
      onboarding_preferences: payload,
    })
    .eq('id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/app', 'layout');
  revalidatePath('/app');
  return { error: null };
}

export async function signOut(): Promise<AuthActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/app', 'layout');
  redirect('/');
}
