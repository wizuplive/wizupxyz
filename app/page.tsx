import { redirect } from 'next/navigation';

import { HomepageV6 } from '@/components/marketing/homepage-v6';

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function MarketingHomepage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const code = getParam(params, 'code');
  const error = getParam(params, 'error');

  if (code || error) {
    const callbackParams = new URLSearchParams();
    if (code) {
      callbackParams.set('code', code);
    }
    if (error) {
      callbackParams.set('error', error);
    }

    const next = getParam(params, 'next');
    if (next) {
      callbackParams.set('next', next);
    }

    redirect(`/auth/callback?${callbackParams.toString()}`);
  }

  return <HomepageV6 />;
}
