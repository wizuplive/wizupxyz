'use client';

import { createClient } from '@/lib/supabase/client';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

function getStorageKey(userId?: string | null) {
  if (!userId) return null;
  return `wizup.active-build-session:${userId}`;
}

export type BuildStage =
  | 'home'
  | 'find'
  | 'create'
  | 'sell'
  | 'launch'
  | 'saved'
  | 'team';

export interface SelectedIdea {
  id: string;
  title: string;
  description: string;
  buyer: string;
  format: string;
  priceRange: string;
  opportunityScore: number | null;
  difficulty: string;
  verdict: string;
  whyNow: string;
}

export interface ProductDraftModule {
  title: string;
  goal: string;
  includedAssets: string[];
  buyerOutcome: string;
}

export interface ProductDraft {
  title: string;
  subtitle: string;
  promise: string;
  targetBuyer: string;
  category: string;
  recommendedPrice: string;
  problemSummary: string;
  differentiator: string;
  keyFeatures: string[];
  proofPoints: string[];
  buildPlan: string[];
  modules: ProductDraftModule[];
}

export interface SalesKitEmail {
  subject: string;
  previewText: string;
  body: string;
}

export interface SalesKitFaqItem {
  question: string;
  answer: string;
}

export interface SalesKit {
  headline: string;
  subheadline: string;
  problemSection: string;
  benefitBullets: string[];
  launchEmails: SalesKitEmail[];
  socialPosts: string[];
  faq: SalesKitFaqItem[];
  pricingRationale: string;
  callToAction: string;
}

export interface LaunchReadinessItem {
  label: string;
  status: 'ready' | 'needs_work' | 'missing';
  detail: string;
}

export interface LaunchReadiness {
  readinessScore: number;
  verdict: 'Ready to launch' | 'Needs polish' | 'Not ready';
  checklist: LaunchReadinessItem[];
  priorityFixes: string[];
  preview: {
    hero: string;
    offer: string;
    trust: string;
    nextStep: string;
  };
}

export interface BuildSession {
  id: string;
  title: string;
  current_stage: BuildStage;
  status: 'not_started' | 'working' | 'ready' | 'needs_review' | 'complete';
  selected_idea: SelectedIdea | null;
  product_draft: ProductDraft | null;
  sales_kit: SalesKit | null;
  launch_readiness: LaunchReadiness | null;
  next_action: string;
  updated_at: string;
}

interface ActiveBuildSessionContextType {
  activeSession: BuildSession | null;
  setActiveSession: (session: BuildSession | null) => void;
  startBuildFromIdea: (idea: SelectedIdea) => void;
  updateStage: (stage: BuildStage, data?: Partial<BuildSession>) => void;
  setProductDraft: (data: ProductDraft) => void;
  setSalesKit: (data: SalesKit) => void;
  setLaunchReadiness: (data: LaunchReadiness) => void;
  resetActiveBuild: () => void;
}

const ActiveBuildSessionContext = createContext<ActiveBuildSessionContextType | undefined>(undefined);

function nowIso() {
  return new Date().toISOString();
}

function createSessionId() {
  return `build_${Math.random().toString(36).slice(2, 10)}`;
}

function nextActionForStage(stage: BuildStage) {
  switch (stage) {
    case 'create':
      return 'Shape the product draft.';
    case 'sell':
      return 'Write the sales kit.';
    case 'launch':
      return 'Review launch readiness.';
    case 'saved':
      return 'Reopen a saved workflow asset.';
    case 'team':
      return 'Review the trust layer.';
    default:
      return 'Choose the next guided step.';
  }
}

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return `{${entries
    .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableSerialize(entryValue)}`)
    .join(',')}}`;
}

function isStructurallyEqual<T>(current: T, next: T) {
  if (current === next) return true;
  return stableSerialize(current) === stableSerialize(next);
}

export const ActiveBuildSessionProvider = ({ children }: { children: ReactNode }) => {
  const [activeSession, setActiveSessionState] = useState<BuildSession | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const lastSeenUserIdRef = useRef<string | null>(null);

  const syncUserId = useCallback((nextUserId: string | null) => {
    if (lastSeenUserIdRef.current !== nextUserId) {
      setActiveSessionState((prev) => (prev === null ? prev : null));
      lastSeenUserIdRef.current = nextUserId;
    }

    setUserId((prev) => (prev === nextUserId ? prev : nextUserId));
  }, []);

  useEffect(() => {
    const supabase = createClient();
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      const nextUserId = user?.id ?? null;
      if (lastSeenUserIdRef.current !== nextUserId) {
        setActiveSessionState((prev) => (prev === null ? prev : null));
      }
      syncUserId(nextUserId);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user?.id ?? null;
      if (lastSeenUserIdRef.current !== nextUserId) {
        setActiveSessionState((prev) => (prev === null ? prev : null));
      }
      syncUserId(nextUserId);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [syncUserId]);

  useEffect(() => {
    if (userId === null) {
      setActiveSessionState((prev) => (prev === null ? prev : null));
      setIsHydrated(true);
      return;
    }
    
    const key = getStorageKey(userId);
    if (key && typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(key);
      if (stored) {
        try {
          setActiveSessionState(JSON.parse(stored));
        } catch {
          window.localStorage.removeItem(key);
          setActiveSessionState(null);
        }
      } else {
        setActiveSessionState(null);
      }
    }
    setIsHydrated(true);
  }, [userId]);

  useEffect(() => {
    if (!isHydrated || !userId) return;
    const key = getStorageKey(userId);
    if (!key) return;

    if (!activeSession) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, JSON.stringify(activeSession));
    }
  }, [activeSession, isHydrated, userId]);

  const setActiveSession = useCallback((session: BuildSession | null) => {
    setActiveSessionState((prev) => {
      if (prev === session) return prev;
      if (prev && session && isStructurallyEqual(prev, session)) return prev;
      if (prev === null && session === null) return prev;
      return session;
    });
  }, []);

  const startBuildFromIdea = useCallback((idea: SelectedIdea) => {
    setActiveSessionState({
      id: createSessionId(),
      title: idea.title,
      current_stage: 'create',
      status: 'working',
      selected_idea: idea,
      product_draft: null,
      sales_kit: null,
      launch_readiness: null,
      next_action: nextActionForStage('create'),
      updated_at: nowIso(),
    });
  }, []);

  const updateStage = useCallback((stage: BuildStage, data: Partial<BuildSession> = {}) => {
    setActiveSessionState((prev) => {
      if (!prev) return null;
      if (prev.current_stage === stage && Object.keys(data).length === 0) return prev;
      return {
        ...prev,
        ...data,
        current_stage: stage,
        next_action: data.next_action ?? nextActionForStage(stage),
        updated_at: nowIso(),
      };
    });
  }, []);

  const setProductDraft = useCallback((data: ProductDraft) => {
    setActiveSessionState((prev) => {
      if (!prev) return null;
      if (prev.product_draft && isStructurallyEqual(prev.product_draft, data)) return prev;
      return {
        ...prev,
        title: data.title || prev.title,
        current_stage: 'sell',
        status: 'working',
        product_draft: data,
        next_action: nextActionForStage('sell'),
        updated_at: nowIso(),
      };
    });
  }, []);

  const setSalesKit = useCallback((data: SalesKit) => {
    setActiveSessionState((prev) => {
      if (!prev) return null;
      if (prev.sales_kit && isStructurallyEqual(prev.sales_kit, data)) return prev;
      return {
        ...prev,
        current_stage: 'launch',
        status: 'needs_review',
        sales_kit: data,
        next_action: nextActionForStage('launch'),
        updated_at: nowIso(),
      };
    });
  }, []);

  const setLaunchReadiness = useCallback((data: LaunchReadiness) => {
    setActiveSessionState((prev) => {
      if (!prev) return null;
      if (prev.launch_readiness && isStructurallyEqual(prev.launch_readiness, data)) return prev;
      return {
        ...prev,
        current_stage: 'launch',
        status:
          data.readinessScore >= 85
            ? 'ready'
            : data.readinessScore >= 60
              ? 'needs_review'
              : 'working',
        launch_readiness: data,
        next_action: data.priorityFixes[0] ?? 'Open launch and review the final checklist.',
        updated_at: nowIso(),
      };
    });
  }, []);

  const resetActiveBuild = useCallback(() => {
    setActiveSessionState((prev) => (prev === null ? prev : null));
  }, []);

  const contextValue = useMemo(
    () => ({
      activeSession,
      setActiveSession,
      startBuildFromIdea,
      updateStage,
      setProductDraft,
      setSalesKit,
      setLaunchReadiness,
      resetActiveBuild,
    }),
    [
      activeSession,
      resetActiveBuild,
      setActiveSession,
      setLaunchReadiness,
      setProductDraft,
      setSalesKit,
      startBuildFromIdea,
      updateStage,
    ]
  );

  return (
    <ActiveBuildSessionContext.Provider value={contextValue}>
      {children}
    </ActiveBuildSessionContext.Provider>
  );
};

export const useActiveBuild = () => {
  const context = useContext(ActiveBuildSessionContext);

  if (!context) {
    throw new Error('useActiveBuild must be used within ActiveBuildSessionProvider');
  }

  return context;
};
