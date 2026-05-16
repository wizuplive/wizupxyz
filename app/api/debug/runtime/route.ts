import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export const runtime = 'nodejs';

function runtimeEnv(name: string) {
  const live = process.env[name]?.trim();
  if (live) return live;

  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return '';

  const line = fs.readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith(name + '='));

  return line ? line.slice(name.length + 1).trim().replace(/^['"]|['"]$/g, '') : '';
}

export async function GET() {
  const cwd = process.cwd();
  const envPath = path.join(cwd, '.env.local');

  return NextResponse.json({
    cwd,
    envLocalExists: fs.existsSync(envPath),
    googleGenaiUseVertexai: runtimeEnv('GOOGLE_GENAI_USE_VERTEXAI'),
    hasGoogleCloudProject: Boolean(runtimeEnv('GOOGLE_CLOUD_PROJECT')),
    googleCloudLocation: runtimeEnv('GOOGLE_CLOUD_LOCATION'),
    geminiModel: runtimeEnv('GEMINI_MODEL'),
    hasTavilyApiKey: Boolean(runtimeEnv('TAVILY_API_KEY')),
    hasGeminiApiKey: Boolean(runtimeEnv('GEMINI_API_KEY')),
    hasGoogleApiKey: Boolean(runtimeEnv('GOOGLE_API_KEY')),
  });
}
