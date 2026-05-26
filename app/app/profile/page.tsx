'use client';

import React, { useEffect, useMemo, useState } from 'react';

import { loadProfile, updateProfile } from '@/app/actions/profile';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

function getInitials(fullName: string, email: string) {
  const trimmedName = fullName.trim();

  if (trimmedName) {
    const initials = trimmedName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');

    if (initials) {
      return initials;
    }
  }

  return (email.slice(0, 2) || 'WU').toUpperCase();
}

function getJoinedDate(createdAt: string | null) {
  if (!createdAt) {
    return 'Unknown';
  }

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getProfilePreferences(
  onboardingPreferences: Record<string, unknown>,
  fullName: string
) {
  const profile =
    onboardingPreferences.profile &&
    typeof onboardingPreferences.profile === 'object' &&
    !Array.isArray(onboardingPreferences.profile)
      ? (onboardingPreferences.profile as Record<string, unknown>)
      : {};

  return {
    fullName:
      typeof profile.fullName === 'string' && profile.fullName.trim()
        ? profile.fullName
        : fullName,
    website: typeof profile.website === 'string' ? profile.website : '',
    location: typeof profile.location === 'string' ? profile.location : '',
    bio: typeof profile.bio === 'string' ? profile.bio : '',
    displayName: typeof profile.displayName === 'string' ? profile.displayName : '',
    category:
      typeof profile.category === 'string'
        ? profile.category
        : typeof onboardingPreferences.market === 'string'
          ? onboardingPreferences.market
          : '',
    audience:
      typeof profile.audience === 'string'
        ? profile.audience
        : typeof onboardingPreferences.audience === 'string'
          ? onboardingPreferences.audience
          : '',
    focus:
      typeof profile.focus === 'string'
        ? profile.focus
        : typeof onboardingPreferences.productType === 'string'
          ? onboardingPreferences.productType
          : '',
  };
}

export default function ProfilePage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [category, setCategory] = useState('');
  const [audience, setAudience] = useState('');
  const [focus, setFocus] = useState('');
  const [plan, setPlan] = useState('Free');
  const [joinedDate, setJoinedDate] = useState('Unknown');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function hydrateProfile() {
      setLoading(true);
      setError(null);

      const result = await loadProfile();

      if (!active) {
        return;
      }

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      const preferences = getProfilePreferences(
        (result.onboardingPreferences ?? {}) as Record<string, unknown>,
        result.fullName ?? ''
      );
      const rawPreferences = (result.onboardingPreferences ?? {}) as Record<string, unknown>;
      const accountSummary =
        rawPreferences.accountSummary &&
        typeof rawPreferences.accountSummary === 'object' &&
        rawPreferences.accountSummary !== null &&
        !Array.isArray(rawPreferences.accountSummary)
          ? (rawPreferences.accountSummary as Record<string, unknown>)
          : {};

      setFullName(preferences.fullName);
      setEmail(result.email ?? '');
      setWebsite(preferences.website);
      setLocation(preferences.location);
      setBio(preferences.bio);
      setDisplayName(preferences.displayName);
      setCategory(preferences.category);
      setAudience(preferences.audience);
      setFocus(preferences.focus);
      setPlan(
        typeof accountSummary.plan === 'string' && accountSummary.plan.trim()
          ? accountSummary.plan
          : 'Free'
      );
      setJoinedDate(getJoinedDate(result.createdAt));
      setLoading(false);
    }

    hydrateProfile();

    return () => {
      active = false;
    };
  }, []);

  const initials = useMemo(() => getInitials(fullName, email), [email, fullName]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaveMessage(null);

    const formData = new FormData();
    formData.set('fullName', fullName);
    formData.set('website', website);
    formData.set('location', location);
    formData.set('bio', bio);
    formData.set('displayName', displayName);
    formData.set('category', category);
    formData.set('audience', audience);
    formData.set('focus', focus);

    const result = await updateProfile(formData);

    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    setSaveMessage('Profile saved.');
    setSaving(false);
  }

  return (
    <form
      className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-24 lg:pb-12"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1 lg:mb-2">Profile</h1>
          <p className="text-sm lg:text-base text-white/50">
            Manage your personal details and public creator profile.
          </p>
          {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
          {!error && saveMessage ? (
            <p className="mt-2 text-sm text-emerald-400">{saveMessage}</p>
          ) : null}
        </div>
        <Button
          className="w-full sm:w-auto h-12 sm:h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          disabled={loading || saving}
          type="submit"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          <div className="bg-[#121214] border border-white/5 rounded-2xl p-4 sm:p-6 lg:p-8">
            <h2 className="text-[15px] font-medium text-white mb-4 sm:mb-6">
              Personal details
            </h2>

            <div className="flex items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
              <Avatar className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-white/10 shrink-0">
                <AvatarFallback className="bg-gradient-to-tr from-gray-800 to-gray-600 text-lg sm:text-xl text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto bg-transparent border-white/10 hover:bg-white/5 text-white h-10 sm:h-8 text-xs font-medium"
                  type="button"
                >
                  Change avatar
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 mb-4 lg:mb-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-xs text-white/70">
                  Full name
                </Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="bg-[#0A0A0B] border-white/10 text-sm h-11 lg:h-10"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs text-white/70">
                  Email address
                </Label>
                <Input
                  id="email"
                  value={email}
                  className="bg-[#0A0A0B] border-white/10 text-sm h-11 lg:h-10"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website" className="text-xs text-white/70">
                  Website
                </Label>
                <Input
                  id="website"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  className="bg-[#0A0A0B] border-white/10 text-sm h-11 lg:h-10"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location" className="text-xs text-white/70">
                  Location
                </Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  className="bg-[#0A0A0B] border-white/10 text-sm h-11 lg:h-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-xs text-white/70">
                Bio
              </Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                className="bg-[#0A0A0B] border-white/10 text-sm min-h-[100px] resize-none"
                disabled={loading}
              />
            </div>
          </div>

          <div className="bg-[#121214] border border-white/5 rounded-2xl p-4 sm:p-6 lg:p-8">
            <h2 className="text-[15px] font-medium text-white mb-4 sm:mb-6">
              Creator profile
            </h2>
            <div className="space-y-4 lg:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-xs text-white/70">
                  Display name
                </Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="bg-[#0A0A0B] border-white/10 text-sm h-11 lg:h-10"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-xs text-white/70">
                    Creator category
                  </Label>
                  <Input
                    id="category"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="bg-[#0A0A0B] border-white/10 text-sm h-11 lg:h-10"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="audience" className="text-xs text-white/70">
                    Main audience
                  </Label>
                  <Input
                    id="audience"
                    value={audience}
                    onChange={(event) => setAudience(event.target.value)}
                    className="bg-[#0A0A0B] border-white/10 text-sm h-11 lg:h-10"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="focus" className="text-xs text-white/70">
                  Product focus
                </Label>
                <Input
                  id="focus"
                  value={focus}
                  onChange={(event) => setFocus(event.target.value)}
                  className="bg-[#0A0A0B] border-white/10 text-sm h-11 lg:h-10"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:space-y-6">
          <div className="bg-[#121214] border border-white/5 rounded-2xl p-4 sm:p-6">
            <h2 className="text-[15px] font-medium text-white mb-4 sm:mb-6">
              Account summary
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-xs text-white/50">Plan</span>
                <div className="inline-flex items-center rounded-md bg-white/5 border border-white/5 px-2 py-0.5 text-[10px] font-medium text-white/70">
                  {plan}
                </div>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-xs text-white/50">Workspace</span>
                <span className="text-sm font-medium text-white/90">Personal</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-white/50">Joined</span>
                <span className="text-sm text-white/90">{joinedDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
