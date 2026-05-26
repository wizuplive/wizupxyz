'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/types';

type ActionResult = {
  error: string | null;
  success?: boolean;
};

type ProfilePreferences = {
  fullName: string;
  website: string;
  location: string;
  bio: string;
  displayName: string;
  category: string;
  audience: string;
  focus: string;
};

type SettingsPreferences = {
  workspaceName: string;
  defaultMarket: string;
  defaultProductType: string;
  defaultCurrency: string;
  theme: string;
  languageStyle: string;
  writingTone: string;
  autoSave: boolean;
};

type PreferencesEnvelope = Record<string, Json | undefined> & {
  profile?: Json;
  settings?: Json;
  accountSummary?: Json;
  productType?: Json;
  audience?: Json;
  market?: Json;
};

const DEFAULT_PROFILE: ProfilePreferences = {
  fullName: '',
  website: '',
  location: '',
  bio: '',
  displayName: '',
  category: '',
  audience: '',
  focus: '',
};

const DEFAULT_SETTINGS: SettingsPreferences = {
  workspaceName: "Sarah's Workspace",
  defaultMarket: 'Productivity',
  defaultProductType: 'printable-pdf',
  defaultCurrency: 'usd',
  theme: 'dark',
  languageStyle: 'simple',
  writingTone: 'clear',
  autoSave: true,
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function getBoolean(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== 'string') {
    return false;
  }

  return value === 'true' || value === 'on';
}

function asObject(value: Json | null | undefined): Record<string, Json | undefined> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, Json | undefined>;
  }

  return {};
}

function getStringValue(value: Json | undefined, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function getBooleanValue(value: Json | undefined, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function getDefaultProfilePreferences(
  preferences: PreferencesEnvelope,
  fullName: string
): ProfilePreferences {
  const storedProfile = asObject(preferences.profile);

  return {
    fullName: getStringValue(storedProfile.fullName, fullName),
    website: getStringValue(storedProfile.website),
    location: getStringValue(storedProfile.location),
    bio: getStringValue(storedProfile.bio),
    displayName: getStringValue(storedProfile.displayName),
    category: getStringValue(storedProfile.category, getStringValue(preferences.market)),
    audience: getStringValue(storedProfile.audience, getStringValue(preferences.audience)),
    focus: getStringValue(storedProfile.focus, getStringValue(preferences.productType)),
  };
}

function getDefaultSettingsPreferences(preferences: PreferencesEnvelope): SettingsPreferences {
  const storedSettings = asObject(preferences.settings);

  return {
    workspaceName: getStringValue(
      storedSettings.workspaceName,
      DEFAULT_SETTINGS.workspaceName
    ),
    defaultMarket: getStringValue(
      storedSettings.defaultMarket,
      getStringValue(preferences.market, DEFAULT_SETTINGS.defaultMarket)
    ),
    defaultProductType: getStringValue(
      storedSettings.defaultProductType,
      getStringValue(preferences.productType, DEFAULT_SETTINGS.defaultProductType)
    ),
    defaultCurrency: getStringValue(
      storedSettings.defaultCurrency,
      DEFAULT_SETTINGS.defaultCurrency
    ),
    theme: getStringValue(storedSettings.theme, DEFAULT_SETTINGS.theme),
    languageStyle: getStringValue(
      storedSettings.languageStyle,
      DEFAULT_SETTINGS.languageStyle
    ),
    writingTone: getStringValue(storedSettings.writingTone, DEFAULT_SETTINGS.writingTone),
    autoSave: getBooleanValue(storedSettings.autoSave, DEFAULT_SETTINGS.autoSave),
  };
}

async function getCurrentProfileRow() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { error: userError.message, user: null, profile: null };
  }

  if (!user) {
    return { error: 'Sign in to manage your profile.', user: null, profile: null };
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('email, full_name, onboarding_preferences, created_at')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    return { error: error.message, user, profile: null };
  }

  return { error: null, user, profile };
}

export async function loadProfile() {
  const { error, user, profile } = await getCurrentProfileRow();

  if (error) {
    return { error, fullName: '', email: '', onboardingPreferences: {}, createdAt: null };
  }

  const rawPreferences = asObject((profile?.onboarding_preferences as Json) ?? undefined);
  const preferences = rawPreferences as PreferencesEnvelope;
  const fullName = profile?.full_name ?? '';

  return {
    error: null,
    fullName,
    email: profile?.email ?? user?.email ?? '',
    onboardingPreferences: preferences,
    createdAt: profile?.created_at ?? null,
  };
}

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { error: userError.message };
  }

  if (!user) {
    return { error: 'Sign in to save profile changes.' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('onboarding_preferences')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    return { error: profileError.message };
  }

  const existingPreferences = asObject(
    (profile?.onboarding_preferences as Json) ?? undefined
  ) as PreferencesEnvelope;

  const fullName = getString(formData, 'fullName');
  const nextProfile: ProfilePreferences = {
    fullName,
    website: getString(formData, 'website'),
    location: getString(formData, 'location'),
    bio: getString(formData, 'bio'),
    displayName: getString(formData, 'displayName'),
    category: getString(formData, 'category'),
    audience: getString(formData, 'audience'),
    focus: getString(formData, 'focus'),
  };

  const mergedPreferences: Json = {
    ...existingPreferences,
    profile: nextProfile,
  };

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: fullName || null,
      onboarding_preferences: mergedPreferences,
    })
    .eq('id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/app', 'layout');
  revalidatePath('/app/profile');
  revalidatePath('/app/settings');

  return { error: null, success: true };
}

export async function loadSettings() {
  const { error, profile } = await getCurrentProfileRow();

  if (error) {
    return { error, settings: DEFAULT_SETTINGS };
  }

  const rawPreferences = asObject((profile?.onboarding_preferences as Json) ?? undefined);
  const preferences = rawPreferences as PreferencesEnvelope;

  return {
    error: null,
    settings: getDefaultSettingsPreferences(preferences),
  };
}

export async function updateSettings(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { error: userError.message };
  }

  if (!user) {
    return { error: 'Sign in to save settings.' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('onboarding_preferences')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    return { error: profileError.message };
  }

  const existingPreferences = asObject(
    (profile?.onboarding_preferences as Json) ?? undefined
  ) as PreferencesEnvelope;

  const nextSettings: SettingsPreferences = {
    workspaceName: getString(formData, 'workspaceName'),
    defaultMarket: getString(formData, 'defaultMarket'),
    defaultProductType: getString(formData, 'defaultProductType'),
    defaultCurrency: getString(formData, 'defaultCurrency'),
    theme: getString(formData, 'theme'),
    languageStyle: getString(formData, 'languageStyle'),
    writingTone: getString(formData, 'writingTone'),
    autoSave: getBoolean(formData, 'autoSave'),
  };

  const mergedPreferences: Json = {
    ...existingPreferences,
    settings: nextSettings,
  };

  const { error } = await supabase
    .from('profiles')
    .update({
      onboarding_preferences: mergedPreferences,
    })
    .eq('id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/app', 'layout');
  revalidatePath('/app/profile');
  revalidatePath('/app/settings');

  return { error: null, success: true };
}
