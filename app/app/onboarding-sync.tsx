'use client';

import { useEffect, useRef } from 'react';

import {
  persistOnboardingAnswers,
  type OnboardingAnswers,
} from '@/app/actions/auth';

const STORAGE_KEY = 'wizup:onboarding-answers';

export function OnboardingSync() {
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (hasAttempted.current) {
      return;
    }

    hasAttempted.current = true;

    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    let parsed: OnboardingAnswers | null = null;

    try {
      parsed = JSON.parse(raw) as OnboardingAnswers;
    } catch {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return;
    }

    if (
      !parsed ||
      !parsed.productType ||
      !parsed.audience ||
      !parsed.market ||
      !parsed.startingPoint
    ) {
      return;
    }

    void persistOnboardingAnswers(parsed).then((result) => {
      if (!result.error) {
        window.sessionStorage.removeItem(STORAGE_KEY);
      }
    });
  }, []);

  return null;
}
