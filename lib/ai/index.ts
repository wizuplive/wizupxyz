import 'server-only';

import { GoogleGenAI } from '@google/genai';

export type AIServiceLabel =
  | 'Scout'
  | 'Analyst'
  | 'Strategist'
  | 'Creator'
  | 'Reviewer';

export type AIResultSource = 'gemini' | 'mock';

export interface AIResultMetadata<TRole extends AIServiceLabel = AIServiceLabel> {
  role: TRole;
  source: AIResultSource;
  model: string;
  generatedAt: string;
  fallbackReason?: string;
}

export interface ScoutInput {
  audience?: string;
  niche?: string;
  problem?: string;
  productType?: string;
  priceRange?: string;
  researchNotes?: string;
}

export interface ScoutOpportunity {
  id: string;
  title: string;
  buyer: string;
  problem: string;
  format: string;
  priceRange: string;
  opportunityScore: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  verdict: 'Build now' | 'Refine first' | 'Skip';
  whyNow: string;
  evidence: string[];
  risks: string[];
  nextStep: string;
}

export interface ScoutIdeasOutput extends AIResultMetadata<'Scout'> {
  summary: string;
  ideas: ScoutOpportunity[];
  nextSearches: string[];
  research?: ScoutResearchContext;
}

export interface ScoutResearchSource {
  title: string;
  url: string;
  provider: string;
  score: number;
  snippet: string;
}

export interface ScoutResearchContext {
  scanId: string;
  provider: string;
  status: 'completed' | 'failed';
  sources: ScoutResearchSource[];
  error?: string;
}

export interface AnalystInput {
  ideaTitle: string;
  buyer?: string;
  format?: string;
  priceRange?: string;
  notes?: string;
}

export interface CompetitiveExample {
  title: string;
  format: string;
  audience: string;
  priceRange: string;
  positioning: string;
  strengths: string[];
  weaknesses: string[];
}

export interface FormatPricingPattern {
  format: string;
  typicalPriceRange: string;
  buyerExpectation: string;
}

export interface AnalystExamplesOutput extends AIResultMetadata<'Analyst'> {
  ideaTitle: string;
  titlePatterns: string[];
  formatPricing: FormatPricingPattern[];
  competitorExamples: CompetitiveExample[];
  buyerComplaints: string[];
  improvementAngles: string[];
  recommendation: string;
}

export interface StrategistInput {
  ideaTitle: string;
  buyer: string;
  problem?: string;
  format?: string;
  priceRange?: string;
  differentiator?: string;
  notes?: string;
}

export interface ProductPositioning {
  title: string;
  subtitle: string;
  promise: string;
  targetBuyer: string;
  category: string;
  recommendedPrice: string;
}

export interface ProductModule {
  title: string;
  goal: string;
  includedAssets: string[];
  buyerOutcome: string;
}

export interface StrategistProductOutlineOutput
  extends AIResultMetadata<'Strategist'> {
  positioning: ProductPositioning;
  modules: ProductModule[];
  keyFeatures: string[];
  proofPoints: string[];
  buildPlan: string[];
  assumptions: string[];
}

export interface CreatorInput {
  productTitle: string;
  buyer: string;
  format?: string;
  modules?: ProductModule[];
  positioning?: ProductPositioning;
  tone?: string;
  notes?: string;
}

export interface ProductContentSection {
  title: string;
  body: string;
  actionPrompt: string;
}

export interface LaunchEmail {
  subject: string;
  previewText: string;
  body: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface CreatorAssetsOutput extends AIResultMetadata<'Creator'> {
  productContent: {
    title: string;
    introduction: string;
    sections: ProductContentSection[];
    closingNote: string;
  };
  salesKit: {
    headline: string;
    subheadline: string;
    problemSection: string;
    benefitBullets: string[];
    launchEmails: LaunchEmail[];
    socialPosts: string[];
    faq: FAQItem[];
    pricingRationale: string;
    callToAction: string;
  };
}

export interface ReviewerInput {
  productTitle: string;
  buyer: string;
  headline?: string;
  subheadline?: string;
  price?: string;
  includedAssets?: string[];
  notes?: string;
}

export interface ReadinessCheck {
  area: string;
  status: 'Pass' | 'Needs work' | 'Missing';
  score: number;
  notes: string;
  fix: string;
}

export interface ReviewerStoreReadinessOutput
  extends AIResultMetadata<'Reviewer'> {
  readinessScore: number;
  verdict: 'Ready to publish' | 'Revise before launch' | 'Not ready';
  checks: ReadinessCheck[];
  priorityFixes: string[];
  launchChecklist: string[];
  storeSummary: {
    hero: string;
    offer: string;
    checkout: string;
    trust: string;
  };
}

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

const WIZUP_SYSTEM_INSTRUCTION = [
  'You are WIZUP, a server-side AI service layer for digital product builders.',
  'Power the canonical workflow: Ideas -> Examples -> Product -> Sales Kit -> Store.',
  'Use only these user-facing labels when describing roles: Scout, Analyst, Strategist, Creator, Reviewer.',
  'Return only valid JSON matching the supplied schema. Do not wrap JSON in Markdown.',
  'Keep recommendations specific, practical, and suitable for small digital products.',
].join('\n');

type OutputWithoutMetadata<TOutput extends AIResultMetadata> = Omit<
  TOutput,
  keyof AIResultMetadata
>;

interface GenerateStructuredOptions<TOutput extends AIResultMetadata> {
  role: TOutput['role'];
  prompt: string;
  responseJsonSchema: unknown;
  fallback: (metadata: AIResultMetadata) => TOutput;
  temperature?: number;
  maxOutputTokens?: number;
}

export async function generateScoutIdeas(
  input: ScoutInput = {}
): Promise<ScoutIdeasOutput> {
  return generateStructuredOutput<ScoutIdeasOutput>({
    role: 'Scout',
    prompt: [
      'Scout should generate market opportunities for the Ideas step.',
      'Find practical digital product ideas that can be built by an individual creator.',
      `Input: ${serializeInput(input)}`,
    ].join('\n'),
    responseJsonSchema: scoutIdeasSchema,
    fallback: mockScoutIdeas,
    temperature: 0.8,
    maxOutputTokens: 3200,
  });
}

export async function generateAnalystExamples(
  input: AnalystInput
): Promise<AnalystExamplesOutput> {
  return generateStructuredOutput<AnalystExamplesOutput>({
    role: 'Analyst',
    prompt: [
      'Analyst should expand an idea into Examples and competitive analysis.',
      'Identify patterns, buyer complaints, pricing norms, and ways to build a stronger original version.',
      `Input: ${serializeInput(input)}`,
    ].join('\n'),
    responseJsonSchema: analystExamplesSchema,
    fallback: (metadata) => mockAnalystExamples(metadata, input),
    temperature: 0.65,
    maxOutputTokens: 3600,
  });
}

export async function generateStrategistProductOutline(
  input: StrategistInput
): Promise<StrategistProductOutlineOutput> {
  return generateStructuredOutput<StrategistProductOutlineOutput>({
    role: 'Strategist',
    prompt: [
      'Strategist should structure the Product step.',
      'Create core positioning, product modules, proof points, and a build plan.',
      `Input: ${serializeInput(input)}`,
    ].join('\n'),
    responseJsonSchema: strategistProductOutlineSchema,
    fallback: (metadata) => mockStrategistProductOutline(metadata, input),
    temperature: 0.55,
    maxOutputTokens: 3600,
  });
}

export async function generateCreatorAssets(
  input: CreatorInput
): Promise<CreatorAssetsOutput> {
  return generateStructuredOutput<CreatorAssetsOutput>({
    role: 'Creator',
    prompt: [
      'Creator should generate actual Product content and Sales Kit assets.',
      'Write usable content, launch emails, social posts, FAQ, and conversion copy.',
      `Input: ${serializeInput(input)}`,
    ].join('\n'),
    responseJsonSchema: creatorAssetsSchema,
    fallback: (metadata) => mockCreatorAssets(metadata, input),
    temperature: 0.7,
    maxOutputTokens: 5200,
  });
}

export async function generateReviewerStoreReadiness(
  input: ReviewerInput
): Promise<ReviewerStoreReadinessOutput> {
  return generateStructuredOutput<ReviewerStoreReadinessOutput>({
    role: 'Reviewer',
    prompt: [
      'Reviewer should evaluate generated assets for Store readiness.',
      'Score clarity, offer strength, checkout readiness, trust, and launch blockers.',
      `Input: ${serializeInput(input)}`,
    ].join('\n'),
    responseJsonSchema: reviewerStoreReadinessSchema,
    fallback: (metadata) => mockReviewerStoreReadiness(metadata, input),
    temperature: 0.35,
    maxOutputTokens: 3200,
  });
}

async function generateStructuredOutput<TOutput extends AIResultMetadata>(
  options: GenerateStructuredOptions<TOutput>
): Promise<TOutput> {
  const model = getGeminiModel();
  const useVertex = process.env.GOOGLE_GENAI_USE_VERTEXAI === 'true';
  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)?.trim();

  if (!useVertex && !apiKey) {
    return options.fallback(
      createMetadata(
        options.role,
        'mock',
        model,
        'AI provider not configured (missing Vertex AI or API key).'
      )
    );
  }

  try {
    let ai: GoogleGenAI;
    if (useVertex) {
      const project = process.env.GOOGLE_CLOUD_PROJECT;
      const location = process.env.GOOGLE_CLOUD_LOCATION || 'global';
      if (!project) {
        throw new Error('GOOGLE_CLOUD_PROJECT is required for Vertex AI.');
      }
      ai = new GoogleGenAI({ vertexai: true, project, location });
    } else {
      ai = new GoogleGenAI({ apiKey });
    }
    const response = await ai.models.generateContent({
      model,
      contents: options.prompt,
      config: {
        systemInstruction: WIZUP_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseJsonSchema: options.responseJsonSchema,
        temperature: options.temperature,
        maxOutputTokens: options.maxOutputTokens,
      },
    });

    const text = response.text;

    if (!text) {
      throw new Error('Gemini returned an empty response.');
    }

    const parsed = parseStructuredResponse<OutputWithoutMetadata<TOutput>>(
      text
    );

    return {
      ...parsed,
      ...createMetadata(options.role, 'gemini', model),
    } as TOutput;
  } catch (error) {
    const fallbackReason =
      error instanceof Error ? error.message : 'Gemini API call failed.';

    return options.fallback(
      createMetadata(options.role, 'mock', model, fallbackReason)
    );
  }
}

function getGeminiModel() {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

function createMetadata(
  role: AIServiceLabel,
  source: AIResultSource,
  model: string,
  fallbackReason?: string
): AIResultMetadata {
  return {
    role,
    source,
    model,
    generatedAt: new Date().toISOString(),
    ...(fallbackReason ? { fallbackReason } : {}),
  };
}

function serializeInput(input: unknown) {
  return JSON.stringify(input, null, 2);
}

function parseStructuredResponse<TOutput>(text: string): TOutput {
  return JSON.parse(stripJsonCodeFence(text)) as TOutput;
}

function stripJsonCodeFence(text: string) {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '');
}

const stringArraySchema = {
  type: 'array',
  items: { type: 'string' },
};

const scoutIdeasSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'ideas', 'nextSearches'],
  properties: {
    summary: { type: 'string' },
    ideas: {
      type: 'array',
      minItems: 3,
      maxItems: 5,
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'id',
          'title',
          'buyer',
          'problem',
          'format',
          'priceRange',
          'opportunityScore',
          'difficulty',
          'verdict',
          'whyNow',
          'evidence',
          'risks',
          'nextStep',
        ],
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          buyer: { type: 'string' },
          problem: { type: 'string' },
          format: { type: 'string' },
          priceRange: { type: 'string' },
          opportunityScore: { type: 'integer', minimum: 0, maximum: 100 },
          difficulty: { type: 'string', enum: ['Easy', 'Medium', 'Hard'] },
          verdict: {
            type: 'string',
            enum: ['Build now', 'Refine first', 'Skip'],
          },
          whyNow: { type: 'string' },
          evidence: stringArraySchema,
          risks: stringArraySchema,
          nextStep: { type: 'string' },
        },
      },
    },
    nextSearches: stringArraySchema,
  },
};

const analystExamplesSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'ideaTitle',
    'titlePatterns',
    'formatPricing',
    'competitorExamples',
    'buyerComplaints',
    'improvementAngles',
    'recommendation',
  ],
  properties: {
    ideaTitle: { type: 'string' },
    titlePatterns: stringArraySchema,
    formatPricing: {
      type: 'array',
      minItems: 2,
      maxItems: 4,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['format', 'typicalPriceRange', 'buyerExpectation'],
        properties: {
          format: { type: 'string' },
          typicalPriceRange: { type: 'string' },
          buyerExpectation: { type: 'string' },
        },
      },
    },
    competitorExamples: {
      type: 'array',
      minItems: 3,
      maxItems: 5,
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'title',
          'format',
          'audience',
          'priceRange',
          'positioning',
          'strengths',
          'weaknesses',
        ],
        properties: {
          title: { type: 'string' },
          format: { type: 'string' },
          audience: { type: 'string' },
          priceRange: { type: 'string' },
          positioning: { type: 'string' },
          strengths: stringArraySchema,
          weaknesses: stringArraySchema,
        },
      },
    },
    buyerComplaints: stringArraySchema,
    improvementAngles: stringArraySchema,
    recommendation: { type: 'string' },
  },
};

const productModuleSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'goal', 'includedAssets', 'buyerOutcome'],
  properties: {
    title: { type: 'string' },
    goal: { type: 'string' },
    includedAssets: stringArraySchema,
    buyerOutcome: { type: 'string' },
  },
};

const strategistProductOutlineSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'positioning',
    'modules',
    'keyFeatures',
    'proofPoints',
    'buildPlan',
    'assumptions',
  ],
  properties: {
    positioning: {
      type: 'object',
      additionalProperties: false,
      required: [
        'title',
        'subtitle',
        'promise',
        'targetBuyer',
        'category',
        'recommendedPrice',
      ],
      properties: {
        title: { type: 'string' },
        subtitle: { type: 'string' },
        promise: { type: 'string' },
        targetBuyer: { type: 'string' },
        category: { type: 'string' },
        recommendedPrice: { type: 'string' },
      },
    },
    modules: {
      type: 'array',
      minItems: 3,
      maxItems: 6,
      items: productModuleSchema,
    },
    keyFeatures: stringArraySchema,
    proofPoints: stringArraySchema,
    buildPlan: stringArraySchema,
    assumptions: stringArraySchema,
  },
};

const creatorAssetsSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['productContent', 'salesKit'],
  properties: {
    productContent: {
      type: 'object',
      additionalProperties: false,
      required: ['title', 'introduction', 'sections', 'closingNote'],
      properties: {
        title: { type: 'string' },
        introduction: { type: 'string' },
        sections: {
          type: 'array',
          minItems: 3,
          maxItems: 6,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['title', 'body', 'actionPrompt'],
            properties: {
              title: { type: 'string' },
              body: { type: 'string' },
              actionPrompt: { type: 'string' },
            },
          },
        },
        closingNote: { type: 'string' },
      },
    },
    salesKit: {
      type: 'object',
      additionalProperties: false,
      required: [
        'headline',
        'subheadline',
        'problemSection',
        'benefitBullets',
        'launchEmails',
        'socialPosts',
        'faq',
        'pricingRationale',
        'callToAction',
      ],
      properties: {
        headline: { type: 'string' },
        subheadline: { type: 'string' },
        problemSection: { type: 'string' },
        benefitBullets: stringArraySchema,
        launchEmails: {
          type: 'array',
          minItems: 3,
          maxItems: 3,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['subject', 'previewText', 'body'],
            properties: {
              subject: { type: 'string' },
              previewText: { type: 'string' },
              body: { type: 'string' },
            },
          },
        },
        socialPosts: stringArraySchema,
        faq: {
          type: 'array',
          minItems: 3,
          maxItems: 6,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['question', 'answer'],
            properties: {
              question: { type: 'string' },
              answer: { type: 'string' },
            },
          },
        },
        pricingRationale: { type: 'string' },
        callToAction: { type: 'string' },
      },
    },
  },
};

const reviewerStoreReadinessSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'readinessScore',
    'verdict',
    'checks',
    'priorityFixes',
    'launchChecklist',
    'storeSummary',
  ],
  properties: {
    readinessScore: { type: 'integer', minimum: 0, maximum: 100 },
    verdict: {
      type: 'string',
      enum: ['Ready to publish', 'Revise before launch', 'Not ready'],
    },
    checks: {
      type: 'array',
      minItems: 4,
      maxItems: 7,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['area', 'status', 'score', 'notes', 'fix'],
        properties: {
          area: { type: 'string' },
          status: { type: 'string', enum: ['Pass', 'Needs work', 'Missing'] },
          score: { type: 'integer', minimum: 0, maximum: 100 },
          notes: { type: 'string' },
          fix: { type: 'string' },
        },
      },
    },
    priorityFixes: stringArraySchema,
    launchChecklist: stringArraySchema,
    storeSummary: {
      type: 'object',
      additionalProperties: false,
      required: ['hero', 'offer', 'checkout', 'trust'],
      properties: {
        hero: { type: 'string' },
        offer: { type: 'string' },
        checkout: { type: 'string' },
        trust: { type: 'string' },
      },
    },
  },
};

function mockScoutIdeas(metadata: AIResultMetadata): ScoutIdeasOutput {
  return {
    ...metadata,
    role: 'Scout',
    summary:
      'Mock scan found practical digital product opportunities with clear buyer pain, simple delivery, and impulse-friendly pricing.',
    ideas: [
      {
        id: 'mock-idea-1',
        title: 'The Anti-Overwhelm Daily Planner',
        buyer: 'Adults with ADHD who abandon traditional planners',
        problem:
          'Most planners are too visually busy and require too much setup to use consistently.',
        format: 'Printable PDF and Notion template',
        priceRange: '$15 - $29',
        opportunityScore: 92,
        difficulty: 'Easy',
        verdict: 'Build now',
        whyNow:
          'Demand for neurodivergent-friendly productivity tools remains strong, and buyers want simpler systems.',
        evidence: [
          'Buyers repeatedly ask for low-friction planning systems.',
          'Existing templates often receive complaints about clutter.',
          'The format can be shipped quickly without custom software.',
        ],
        risks: [
          'The category is competitive.',
          'The product must be genuinely simple to stand out.',
        ],
        nextStep:
          'Study three ADHD planner examples and extract the most common complaints.',
      },
      {
        id: 'mock-idea-2',
        title: 'Local Business Canva Promo Kit',
        buyer: 'Service businesses without a designer',
        problem:
          'Owners need polished promotions but do not have time to design from scratch.',
        format: 'Canva template pack',
        priceRange: '$29 - $49',
        opportunityScore: 84,
        difficulty: 'Medium',
        verdict: 'Build now',
        whyNow:
          'Small businesses continue to publish frequent short-form promotions across several channels.',
        evidence: [
          'Template packs are easy to demonstrate visually.',
          'Recurring campaigns create repeated use cases.',
          'Canva lowers the editing barrier for buyers.',
        ],
        risks: [
          'Templates need strong examples by niche.',
          'Generic designs are easy to ignore.',
        ],
        nextStep:
          'Choose one service niche and define ten recurring promotion scenarios.',
      },
      {
        id: 'mock-idea-3',
        title: 'Beginner Strength Tracker Spreadsheet',
        buyer: 'New gym members who want simple progress tracking',
        problem:
          'Beginners struggle to know whether their workouts are improving over time.',
        format: 'Google Sheets tracker',
        priceRange: '$9 - $19',
        opportunityScore: 71,
        difficulty: 'Medium',
        verdict: 'Refine first',
        whyNow:
          'Simple fitness accountability products remain attractive when they remove complexity.',
        evidence: [
          'Spreadsheets are inexpensive and quick to deliver.',
          'Buyers value visible progress and streaks.',
          'The idea can be paired with a short setup guide.',
        ],
        risks: [
          'Many free trackers exist.',
          'The product needs a distinctive beginner angle.',
        ],
        nextStep:
          'Narrow the audience to one training style or one beginner outcome.',
      },
    ],
    nextSearches: [
      'ADHD planner complaints',
      'Canva template ideas for local businesses',
      'beginner fitness spreadsheet reviews',
    ],
  };
}

function mockAnalystExamples(
  metadata: AIResultMetadata,
  input: AnalystInput
): AnalystExamplesOutput {
  const ideaTitle = input.ideaTitle || 'The Anti-Overwhelm Daily Planner';

  return {
    ...metadata,
    role: 'Analyst',
    ideaTitle,
    titlePatterns: [
      '[Specific outcome] for [specific buyer]',
      'The [timeframe] [result] system',
      '[Pain-free adjective] [product format]',
    ],
    formatPricing: [
      {
        format: input.format || 'Printable PDF',
        typicalPriceRange: input.priceRange || '$15 - $29',
        buyerExpectation:
          'Immediate download, clear instructions, and a clean printable layout.',
      },
      {
        format: 'Notion template',
        typicalPriceRange: '$19 - $49',
        buyerExpectation:
          'Duplicate link, simple dashboard, and a short walkthrough.',
      },
    ],
    competitorExamples: [
      {
        title: 'Minimal Focus Planner',
        format: 'Printable PDF',
        audience: input.buyer || 'Busy adults who need simpler planning',
        priceRange: '$17 - $24',
        positioning: 'A stripped-down daily worksheet for getting started.',
        strengths: ['Clear promise', 'Low price', 'Fast to understand'],
        weaknesses: ['Limited guidance', 'Few reset tools'],
      },
      {
        title: 'Calm Week Dashboard',
        format: 'Notion template',
        audience: 'Creators and freelancers',
        priceRange: '$29 - $39',
        positioning: 'A weekly planning hub with habit and task views.',
        strengths: ['Flexible structure', 'Modern interface'],
        weaknesses: ['Setup friction', 'Too many optional sections'],
      },
      {
        title: 'Brain Dump Workbook',
        format: 'PDF workbook',
        audience: 'People with overloaded task lists',
        priceRange: '$12 - $19',
        positioning: 'A guided worksheet for clearing mental clutter.',
        strengths: ['Strong pain point', 'Simple promise'],
        weaknesses: ['Weak follow-through system', 'No prioritization method'],
      },
    ],
    buyerComplaints: [
      'Too many colors and boxes make the product feel overwhelming.',
      'The setup instructions assume the buyer already has a planning habit.',
      'Most products do not explain what to do when the plan falls apart.',
    ],
    improvementAngles: [
      'Add an ink-friendly black-and-white version.',
      'Include a one-page reset protocol for low-energy days.',
      'Use fewer sections with clearer decision rules.',
    ],
    recommendation:
      'Build a cleaner version that focuses on daily recovery and tiny next actions instead of a full life-management system.',
  };
}

function mockStrategistProductOutline(
  metadata: AIResultMetadata,
  input: StrategistInput
): StrategistProductOutlineOutput {
  return {
    ...metadata,
    role: 'Strategist',
    positioning: {
      title: input.ideaTitle || 'The Anti-Overwhelm Daily Planner',
      subtitle:
        'A minimal planning system for turning mental clutter into three doable actions.',
      promise:
        'Help buyers start their day without building a complicated productivity routine.',
      targetBuyer: input.buyer || 'Adults with ADHD',
      category: input.format || 'Printable planner',
      recommendedPrice: input.priceRange || '$19',
    },
    modules: [
      {
        title: 'Module 1: The Brain Dump',
        goal: 'Capture every open loop without sorting or judging it.',
        includedAssets: ['Brain dump worksheet', 'Prompt list', 'Example page'],
        buyerOutcome: 'The buyer sees everything in one calm place.',
      },
      {
        title: 'Module 2: Top 3 Targets',
        goal: 'Choose only the actions that matter today.',
        includedAssets: ['Priority matrix', 'Decision rules', 'Daily card'],
        buyerOutcome: 'The buyer leaves with a realistic plan for the day.',
      },
      {
        title: 'Module 3: Reset Protocol',
        goal: 'Recover when the plan is missed or interrupted.',
        includedAssets: ['Reset checklist', 'Two-minute restart script'],
        buyerOutcome: 'The buyer can restart without guilt or re-planning.',
      },
    ],
    keyFeatures: [
      'Ink-friendly black-and-white layout',
      'Three-action daily limit',
      'Reset flow for bad days',
      'Example-filled version for quick onboarding',
    ],
    proofPoints: [
      'Designed around the common complaint that planners become too complex.',
      'Printable format keeps delivery simple and immediate.',
      'The reset protocol addresses the moment most planners fail.',
    ],
    buildPlan: [
      'Draft the worksheets in grayscale first.',
      'Create one completed example for each worksheet.',
      'Write a five-minute quick-start guide.',
      'Export printable and tablet-friendly PDF versions.',
    ],
    assumptions: [
      'The buyer wants a lightweight tool, not a full productivity course.',
      'The strongest differentiator is simplicity.',
      'The sales page should emphasize relief from overwhelm.',
    ],
  };
}

function mockCreatorAssets(
  metadata: AIResultMetadata,
  input: CreatorInput
): CreatorAssetsOutput {
  const title = input.productTitle || 'The Anti-Overwhelm Daily Planner';
  const buyer = input.buyer || 'adults with ADHD';

  return {
    ...metadata,
    role: 'Creator',
    productContent: {
      title,
      introduction: `This planner helps ${buyer} turn a noisy task list into a calm, short plan for today.`,
      sections: [
        {
          title: 'Start With a Full Brain Dump',
          body: 'Write every task, worry, errand, and reminder in one place. Do not sort yet. The goal is to stop carrying the list in your head.',
          actionPrompt:
            'Set a five-minute timer and list everything taking up attention.',
        },
        {
          title: 'Choose Your Top 3 Targets',
          body: 'Pick three actions that would make the day feel meaningfully better. Smaller is better than impressive.',
          actionPrompt:
            'Circle three items that are concrete enough to start in two minutes.',
        },
        {
          title: 'Use the Reset Protocol',
          body: 'If the plan breaks, restart with one tiny action. A missed morning does not need to become a missed day.',
          actionPrompt:
            'Choose one action you can complete before checking your phone again.',
        },
      ],
      closingNote:
        'Keep the system light. The win is not a perfect plan; the win is returning to the next useful action.',
    },
    salesKit: {
      headline:
        'Stop letting an overloaded brain decide your day for you.',
      subheadline:
        'A minimal printable planner that helps you dump the noise, choose three doable actions, and restart when the day goes sideways.',
      problemSection:
        'Most planners assume you can calmly organize your life before you begin. When your brain is already crowded, those extra boxes and routines create more friction.',
      benefitBullets: [
        'Turn a messy task list into a short daily plan.',
        'Use a reset protocol when the plan falls apart.',
        'Print clean black-and-white pages that do not add visual noise.',
        'Start in minutes with completed examples.',
      ],
      launchEmails: [
        {
          subject: 'A planner for the days planning feels impossible',
          previewText:
            'This is a lighter way to get out of your head and into one next action.',
          body: `If planning tools usually make you feel behind, ${title} was built for a different rhythm: dump the noise, pick three targets, and restart without guilt.`,
        },
        {
          subject: `${title} is ready`,
          previewText:
            'Get the printable system and start with today\'s three actions.',
          body: `The planner is live. Download it, print the first page, and give yourself a simpler way to decide what matters today.`,
        },
        {
          subject: 'Your day does not need a perfect plan',
          previewText:
            'A tiny restart is still progress. Here is the system that makes it easier.',
          body: `Last call for launch pricing. If you want a calmer daily planning flow, ${title} gives you the pages and prompts to begin.`,
        },
      ],
      socialPosts: [
        'Your planner should not require a planning habit before it works. Start with one brain dump and three actions.',
        'When the day goes sideways, restart smaller. That is the whole point of the reset protocol.',
        'Built a printable planner for overloaded brains: fewer boxes, clearer choices, and no guilt spiral.',
      ],
      faq: [
        {
          question: 'Is this only for people with ADHD?',
          answer:
            'No. It is designed around ADHD-friendly principles, but anyone who gets overwhelmed by complex planners can use it.',
        },
        {
          question: 'Do I need Notion or special software?',
          answer:
            'No. The core product is a printable PDF that works immediately after download.',
        },
        {
          question: 'How long does setup take?',
          answer:
            'Most buyers can print the first page and start the daily flow in under five minutes.',
        },
      ],
      pricingRationale:
        'A $19 one-time price is low enough for an impulse purchase while still signaling more value than a generic printable.',
      callToAction: 'Get the planner and choose today\'s three actions.',
    },
  };
}

function mockReviewerStoreReadiness(
  metadata: AIResultMetadata,
  input: ReviewerInput
): ReviewerStoreReadinessOutput {
  return {
    ...metadata,
    role: 'Reviewer',
    readinessScore: 78,
    verdict: 'Revise before launch',
    checks: [
      {
        area: 'Hero clarity',
        status: input.headline ? 'Pass' : 'Needs work',
        score: input.headline ? 86 : 68,
        notes:
          'The hero should state the buyer, pain point, and outcome in one clear promise.',
        fix:
          'Use a headline that names the overloaded-brain problem and the simple daily outcome.',
      },
      {
        area: 'Offer contents',
        status: input.includedAssets?.length ? 'Pass' : 'Needs work',
        score: input.includedAssets?.length ? 84 : 65,
        notes:
          'Buyers need to see exactly what files, templates, or pages they receive.',
        fix:
          'Add a concise included-assets list near the price card.',
      },
      {
        area: 'Pricing confidence',
        status: input.price ? 'Pass' : 'Missing',
        score: input.price ? 82 : 45,
        notes:
          'A clear price and one-time payment statement reduce checkout uncertainty.',
        fix:
          'Show the price, delivery format, and instant access message together.',
      },
      {
        area: 'Trust and objections',
        status: 'Needs work',
        score: 70,
        notes:
          'The store needs FAQ answers for software requirements, setup time, and refunds.',
        fix:
          'Add three FAQs below the offer stack before publishing.',
      },
    ],
    priorityFixes: [
      'Add a visible included-assets list.',
      'Pair the price with the delivery promise.',
      'Include FAQs that remove setup and compatibility objections.',
    ],
    launchChecklist: [
      'Confirm every download link works.',
      'Export a clean product mockup image.',
      'Run one checkout test purchase.',
      'Proofread hero, FAQ, and button copy.',
      'Save a rollback copy of the current store page.',
    ],
    storeSummary: {
      hero:
        input.headline ||
        'A simple planner for overloaded days and three doable actions.',
      offer:
        input.price || 'One-time digital download with instant access.',
      checkout: 'Needs a final checkout test before launch.',
      trust:
        'Add FAQ coverage for setup, software needs, delivery, and refund policy.',
    },
  };
}
