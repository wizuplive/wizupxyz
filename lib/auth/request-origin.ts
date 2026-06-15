export function getRequestOrigin(request: Request) {
  const url = new URL(request.url);
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host = forwardedHost || request.headers.get('host')?.trim();
  const protocol = forwardedProto || url.protocol.replace(/:$/, '');

  if (host && host !== '0.0.0.0' && !host.startsWith('0.0.0.0:')) {
    return `${protocol}://${host}`;
  }

  return url.origin;
}
