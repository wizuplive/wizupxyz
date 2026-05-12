import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function getSafeRedirectPath(nextPath: string | null) {
  if (!nextPath || !nextPath.startsWith('/') || nextPath.startsWith('//')) {
    return '/app';
  }

  return nextPath;
}

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const supabase = await createClient();
  const next = getSafeRedirectPath(searchParams.get('next'));

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(`${origin}/?error=oauth-failed`);
  }

  return NextResponse.redirect(data.url);
}
