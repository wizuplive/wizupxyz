import 'server-only';

import fs from 'node:fs';
import path from 'node:path';
import { loadEnvConfig } from '@next/env';
import type { GoogleGenAIOptions } from '@google/genai';

loadEnvConfig(process.cwd());

const REQUIRED_VERTEX_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';
const GOOGLE_SERVICE_ACCOUNT_KEY_ENV = 'GOOGLE_SERVICE_ACCOUNT_KEY';

interface ServiceAccountCredentials {
  client_email?: string;
  private_key?: string;
  project_id?: string;
  [key: string]: unknown;
}

export interface VertexCredentialDebugStatus {
  credentialSource: 'env-json' | 'env-path' | 'adc';
  hasGoogleApplicationCredentials: boolean;
  hasGoogleApplicationCredentialsJson: boolean;
  hasGoogleServiceAccountKey: boolean;
  serviceAccountJsonParsed: boolean;
  serviceAccountClientEmailPresent: boolean;
  serviceAccountPrivateKeyPresent: boolean;
  hasVertexAiCredentials: boolean;
}

export interface VertexGoogleAuthConfig {
  credentialSource: VertexCredentialDebugStatus['credentialSource'];
  googleAuthOptions?: {
    credentials: ServiceAccountCredentials;
    scopes: string[];
  };
  projectIdHint?: string;
}

export function runtimeEnv(name: string) {
  const live = process.env[name]?.trim();
  if (live) return live;

  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return '';

  const line = fs
    .readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith(name + '='));

  return line ? line.slice(name.length + 1).trim().replace(/^['"]|['"]$/g, '') : '';
}

function inspectServiceAccountEnv() {
  const rawServiceAccount = runtimeEnv(GOOGLE_SERVICE_ACCOUNT_KEY_ENV);

  if (!rawServiceAccount) {
    return {
      rawServiceAccount,
      parsed: null as ServiceAccountCredentials | null,
      serviceAccountJsonParsed: false,
      serviceAccountClientEmailPresent: false,
      serviceAccountPrivateKeyPresent: false,
    };
  }

  try {
    const parsed = JSON.parse(rawServiceAccount) as ServiceAccountCredentials;
    const clientEmail =
      typeof parsed.client_email === 'string' ? parsed.client_email.trim() : '';
    const privateKeyRaw = typeof parsed.private_key === 'string' ? parsed.private_key : '';
    const privateKey = privateKeyRaw.replace(/\\n/g, '\n').trim();

    return {
      rawServiceAccount,
      parsed: {
        ...parsed,
        ...(clientEmail ? { client_email: clientEmail } : {}),
        ...(privateKey ? { private_key: privateKey } : {}),
      },
      serviceAccountJsonParsed: true,
      serviceAccountClientEmailPresent: Boolean(clientEmail),
      serviceAccountPrivateKeyPresent: Boolean(privateKey),
    };
  } catch {
    return {
      rawServiceAccount,
      parsed: null as ServiceAccountCredentials | null,
      serviceAccountJsonParsed: false,
      serviceAccountClientEmailPresent: false,
      serviceAccountPrivateKeyPresent: false,
    };
  }
}

export function getVertexCredentialDebugStatus(): VertexCredentialDebugStatus {
  const inspection = inspectServiceAccountEnv();

  return {
    credentialSource: inspection.rawServiceAccount
      ? 'env-json'
      : runtimeEnv('GOOGLE_APPLICATION_CREDENTIALS')
        ? 'env-path'
        : 'adc',
    hasGoogleApplicationCredentials: Boolean(runtimeEnv('GOOGLE_APPLICATION_CREDENTIALS')),
    hasGoogleApplicationCredentialsJson: Boolean(runtimeEnv('GOOGLE_APPLICATION_CREDENTIALS_JSON')),
    hasGoogleServiceAccountKey: Boolean(inspection.rawServiceAccount),
    serviceAccountJsonParsed: inspection.serviceAccountJsonParsed,
    serviceAccountClientEmailPresent: inspection.serviceAccountClientEmailPresent,
    serviceAccountPrivateKeyPresent: inspection.serviceAccountPrivateKeyPresent,
    hasVertexAiCredentials: Boolean(runtimeEnv('VERTEX_AI_CREDENTIALS')),
  };
}

export function getVertexGoogleAuthConfig(): VertexGoogleAuthConfig {
  const inspection = inspectServiceAccountEnv();
  const rawServiceAccount = inspection.rawServiceAccount;

  if (!rawServiceAccount) {
    return {
      credentialSource: runtimeEnv('GOOGLE_APPLICATION_CREDENTIALS') ? 'env-path' : 'adc',
    };
  }

  if (!inspection.serviceAccountJsonParsed || !inspection.parsed) {
    throw new Error(`${GOOGLE_SERVICE_ACCOUNT_KEY_ENV} contains invalid JSON.`);
  }

  const parsed = inspection.parsed;
  const clientEmail = typeof parsed.client_email === 'string' ? parsed.client_email.trim() : '';
  const privateKey = typeof parsed.private_key === 'string' ? parsed.private_key.trim() : '';

  if (!clientEmail || !privateKey) {
    throw new Error(
      `${GOOGLE_SERVICE_ACCOUNT_KEY_ENV} must include client_email and private_key.`
    );
  }

  return {
    credentialSource: 'env-json',
    projectIdHint:
      typeof parsed.project_id === 'string' && parsed.project_id.trim()
        ? parsed.project_id.trim()
        : undefined,
    googleAuthOptions: {
      credentials: {
        ...parsed,
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: [REQUIRED_VERTEX_SCOPE],
    },
  };
}

export function buildVertexGoogleGenAIOptions(input?: {
  project?: string | null;
  location?: string | null;
}): GoogleGenAIOptions {
  const vertexAuth = getVertexGoogleAuthConfig();
  const project = input?.project?.trim() || runtimeEnv('GOOGLE_CLOUD_PROJECT') || vertexAuth.projectIdHint;

  if (!project) {
    throw new Error('GOOGLE_CLOUD_PROJECT is required for Vertex AI.');
  }

  return {
    vertexai: true,
    project,
    location: input?.location?.trim() || runtimeEnv('GOOGLE_CLOUD_LOCATION') || 'global',
    ...(vertexAuth.googleAuthOptions
      ? { googleAuthOptions: vertexAuth.googleAuthOptions }
      : {}),
  };
}

export function logVertexAuthFailure(context: string, error: unknown) {
  const debug = getVertexCredentialDebugStatus();
  const message =
    error instanceof Error && error.message.trim()
      ? error.message.replace(/\s+/g, ' ').trim().slice(0, 240)
      : 'Unknown Vertex auth error.';

  console.warn(
    '[vertex-auth]',
    JSON.stringify({
      context,
      credentialSource: debug.credentialSource,
      hasGoogleServiceAccountKey: debug.hasGoogleServiceAccountKey,
      serviceAccountJsonParsed: debug.serviceAccountJsonParsed,
      serviceAccountClientEmailPresent: debug.serviceAccountClientEmailPresent,
      serviceAccountPrivateKeyPresent: debug.serviceAccountPrivateKeyPresent,
      hasGoogleApplicationCredentials: debug.hasGoogleApplicationCredentials,
      error: message,
    })
  );
}
