import { AuthGateway } from './auth-gateway';

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};

  const getValue = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  return (
    <AuthGateway
      nextPath={getValue('next') ?? '/app'}
      defaultMode={getValue('mode') === 'signup' ? 'signup' : 'signin'}
      signupState={getValue('signup') ?? null}
      emailHint={getValue('email') ?? ''}
    />
  );
}
