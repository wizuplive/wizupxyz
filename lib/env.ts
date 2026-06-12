import { z } from 'zod';

const envSchema = z.object({
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  GOOGLEGENAIUSEVERTEXAI: z.string().optional(),
  GOOGLE_GENAI_USE_VERTEXAI: z.string().optional(),
  GOOGLE_CLOUD_PROJECT: z.string().optional(),
  GOOGLE_CLOUD_LOCATION: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  GOOGLE_SERVICE_ACCOUNT_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
  IMAGE_GENERATION_MODE: z.enum(['codex-assisted', 'runtime-provider']).optional(),
  WIZUP_IMAGE_PROVIDER: z.string().optional(),
  WIZUP_IMAGE_MODEL: z.string().optional(),
  WIZUP_IMAGE_DRAFT_MODEL: z.string().optional(),
  WIZUP_IMAGE_FALLBACK_PROVIDER: z.string().optional(),
  WIZUP_IMAGE_FALLBACK_MODEL: z.string().optional(),
  WIZUP_IMAGE_REVIEW_MODEL: z.string().optional(),
  TAVILY_API_KEY: z.string().optional(),

  // NOWPayments server-only
  NOWPAYMENTS_API_URL: z.string().optional(),
  NOWPAYMENTS_API_KEY: z.string().optional(),
  NOWPAYMENTS_IPN_SECRET: z.string().optional(),

  // Public
  NEXT_PUBLIC_APP_URL: z.string().optional(),
});

export const env = envSchema.parse(process.env);
