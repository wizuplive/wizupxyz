'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

type AuthActionResult = {
  error: string | null;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

export async function signInWithPassword(
  formData: FormData
): Promise<AuthActionResult> {
  const email = getString(formData, 'email');
  const password = getString(formData, 'password');

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/app', 'layout');
  redirect('/app');
}

export async function signUpWithPassword(
  formData: FormData
): Promise<AuthActionResult> {
  const email = getString(formData, 'email');
  const password = getString(formData, 'password');
  const fullName = getString(formData, 'full_name');

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: fullName ? { full_name: fullName } : undefined,
    },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/app', 'layout');
  redirect('/app');
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
