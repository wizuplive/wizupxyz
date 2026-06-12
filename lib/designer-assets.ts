export type DesignerAssetType =
  | 'cover'
  | 'mockup'
  | 'sales_graphic'
  | 'thumbnail'
  | 'social_preview';

export type DesignerAssetStatus =
  | 'queued_for_codex'
  | 'generating'
  | 'needs_review'
  | 'awaiting_approval'
  | 'ready'
  | 'failed';

export type SessionDesignerAssetStateStatus =
  | 'pending'
  | 'queued_for_codex'
  | 'generating'
  | 'ready'
  | 'failed'
  | 'approved'
  | 'rejected'
  | 'idle'
  | 'running'
  | 'awaiting_approval';

export interface DesignerAssetScoreBreakdown {
  brandFit: number | null;
  clarity: number | null;
  premiumFeel: number | null;
  textSafety: number | null;
  composition: number | null;
  productRelevance: number | null;
}

export interface DesignerAssetVariant {
  id: string;
  assetId: string;
  storageBucket: string;
  storagePath: string;
  publicUrl: string | null;
  mimeType: string;
  width: number | null;
  height: number | null;
  reviewerScore: number | null;
  reviewerNotes: string | null;
  scoreBreakdown: DesignerAssetScoreBreakdown;
  isPrimary: boolean;
  createdAt: string;
}

export interface DesignerAsset {
  id: string;
  projectId: string;
  sessionId: string;
  type: DesignerAssetType;
  status: DesignerAssetStatus;
  promptVersion: string;
  sourceModel: string;
  primaryVariantId: string | null;
  variantCount: number;
  createdAt: string;
  updatedAt: string;
  errorMessage?: string | null;
}

export interface SessionPrimaryDesignerAsset {
  assetId: string;
  variantId: string;
  type: DesignerAssetType;
  status: 'ready';
  publicUrl: string;
  storageBucket?: string;
  storagePath?: string;
}

export interface SessionDesignerAssetState {
  assetType: DesignerAssetType;
  status: SessionDesignerAssetStateStatus;
  rowId?: string | null;
  message?: string | null;
  reviewerScore?: number | null;
  storagePath?: string | null;
  publicUrl?: string | null;
  updatedAt: string;
}

export interface DesignerGenerationContext {
  projectId: string;
  sessionId: string;
  assetType: DesignerAssetType;
  productTitle: string;
  productSubtitle: string;
  targetBuyer: string;
  corePromise: string;
  problemSummary: string;
  differentiator: string;
  pricing: string;
  brandDirection: string;
  variantCount?: number;
  mode?: 'production' | 'draft';
  sourceContext?: {
    strategySummary?: string;
    creatorSummary?: string;
    salesSummary?: string;
  };
  referenceStyleNotes?: string;
  formatConstraints?: string;
}

export interface DesignerPromptPackage {
  assetType: DesignerAssetType;
  prompt: string;
  negativePrompt: string;
  aspectRatio: string;
  outputMimeType: 'image/png';
}

export interface DesignerVariantReview {
  variantId: string;
  score: number;
  scoreBreakdown: DesignerAssetScoreBreakdown;
  notes: string;
  source: 'gemini' | 'internal';
  internalOnly: boolean;
}
