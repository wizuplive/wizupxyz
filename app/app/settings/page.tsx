'use client';

import React, { useEffect, useState } from 'react';

import { loadSettings, updateSettings } from '@/app/actions/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

type SettingsState = {
  workspaceName: string;
  defaultMarket: string;
  defaultProductType: string;
  defaultCurrency: string;
  theme: string;
  languageStyle: string;
  writingTone: string;
  autoSave: boolean;
};

const DEFAULT_SETTINGS: SettingsState = {
  workspaceName: 'My Workspace',
  defaultMarket: 'Productivity',
  defaultProductType: 'printable-pdf',
  defaultCurrency: 'usd',
  theme: 'dark',
  languageStyle: 'simple',
  writingTone: 'clear',
  autoSave: true,
};

export default function SettingsPage() {
  const [workspaceName, setWorkspaceName] = useState(DEFAULT_SETTINGS.workspaceName);
  const [defaultMarket, setDefaultMarket] = useState(DEFAULT_SETTINGS.defaultMarket);
  const [defaultProductType, setDefaultProductType] = useState(
    DEFAULT_SETTINGS.defaultProductType
  );
  const [defaultCurrency, setDefaultCurrency] = useState(DEFAULT_SETTINGS.defaultCurrency);
  const [theme, setTheme] = useState(DEFAULT_SETTINGS.theme);
  const [languageStyle, setLanguageStyle] = useState(DEFAULT_SETTINGS.languageStyle);
  const [writingTone, setWritingTone] = useState(DEFAULT_SETTINGS.writingTone);
  const [autoSave, setAutoSave] = useState(DEFAULT_SETTINGS.autoSave);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function hydrateSettings() {
      setLoading(true);
      setError(null);

      const result = await loadSettings();

      if (!active) {
        return;
      }

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      const settings = result.settings ?? DEFAULT_SETTINGS;
      setWorkspaceName(settings.workspaceName);
      setDefaultMarket(settings.defaultMarket);
      setDefaultProductType(settings.defaultProductType);
      setDefaultCurrency(settings.defaultCurrency);
      setTheme(settings.theme);
      setLanguageStyle(settings.languageStyle);
      setWritingTone(settings.writingTone);
      setAutoSave(settings.autoSave);
      setLoading(false);
    }

    hydrateSettings();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaveMessage(null);

    const formData = new FormData();
    formData.set('workspaceName', workspaceName);
    formData.set('defaultMarket', defaultMarket);
    formData.set('defaultProductType', defaultProductType);
    formData.set('defaultCurrency', defaultCurrency);
    formData.set('theme', theme);
    formData.set('languageStyle', languageStyle);
    formData.set('writingTone', writingTone);
    formData.set('autoSave', String(autoSave));

    const result = await updateSettings(formData);

    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    setSaveMessage('Settings saved.');
    setSaving(false);
  }

  return (
    <form
      className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-24 lg:pb-12"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1 lg:mb-2">Settings</h1>
          <p className="text-sm lg:text-base text-white/50">
            Control your workspace, preferences, and notifications.
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
          {saving ? 'Saving...' : 'Save settings'}
        </Button>
      </div>

      <div className="space-y-4 lg:space-y-6">
        <div className="bg-[#121214] border border-white/5 rounded-2xl p-4 sm:p-6 lg:p-8">
          <h2 className="text-[15px] font-medium text-white mb-4 sm:mb-6">Workspace</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
            <div className="space-y-2">
              <Label htmlFor="workspaceName" className="text-xs text-white/70">
                Workspace name
              </Label>
              <Input
                id="workspaceName"
                value={workspaceName}
                onChange={(event) => setWorkspaceName(event.target.value)}
                className="bg-[#0A0A0B] border-white/10 text-sm h-11 lg:h-10"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultMarket" className="text-xs text-white/70">
                Default market
              </Label>
              <Input
                id="defaultMarket"
                value={defaultMarket}
                onChange={(event) => setDefaultMarket(event.target.value)}
                className="bg-[#0A0A0B] border-white/10 text-sm h-11 lg:h-10"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultProductType" className="text-xs text-white/70">
                Default product type
              </Label>
              <Select
                value={defaultProductType}
                onValueChange={(value) => setDefaultProductType(value ?? '')}
              >
                <SelectTrigger
                  id="defaultProductType"
                  className="bg-[#0A0A0B] border-white/10 text-sm h-11 lg:h-10 w-full"
                >
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-[#121214] border-white/10">
                  <SelectItem value="printable-pdf">Printable PDF</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                  <SelectItem value="ebook">eBook</SelectItem>
                  <SelectItem value="course">Course</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultCurrency" className="text-xs text-white/70">
                Default currency
              </Label>
              <Select
                value={defaultCurrency}
                onValueChange={(value) => setDefaultCurrency(value ?? '')}
              >
                <SelectTrigger
                  id="defaultCurrency"
                  className="bg-[#0A0A0B] border-white/10 text-sm h-11 lg:h-10 w-full"
                >
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className="bg-[#121214] border-white/10">
                  <SelectItem value="usd">USD ($)</SelectItem>
                  <SelectItem value="eur">EUR (€)</SelectItem>
                  <SelectItem value="gbp">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="bg-[#121214] border border-white/5 rounded-2xl p-4 sm:p-6 lg:p-8">
          <h2 className="text-[15px] font-medium text-white mb-4 sm:mb-6">Preferences</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
            <div className="space-y-2">
              <Label htmlFor="theme" className="text-xs text-white/70">
                Theme
              </Label>
              <Select value={theme} onValueChange={(value) => setTheme(value ?? '')}>
                <SelectTrigger
                  id="theme"
                  className="bg-[#0A0A0B] border-white/10 text-sm h-11 lg:h-10 w-full"
                >
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent className="bg-[#121214] border-white/10">
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="languageStyle" className="text-xs text-white/70">
                Language style
              </Label>
              <Select
                value={languageStyle}
                onValueChange={(value) => setLanguageStyle(value ?? '')}
              >
                <SelectTrigger
                  id="languageStyle"
                  className="bg-[#0A0A0B] border-white/10 text-sm h-11 lg:h-10 w-full"
                >
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent className="bg-[#121214] border-white/10">
                  <SelectItem value="simple">Simple</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 lg:col-span-1 sm:col-span-2">
              <Label htmlFor="writingTone" className="text-xs text-white/70">
                Default writing tone
              </Label>
              <Select
                value={writingTone}
                onValueChange={(value) => setWritingTone(value ?? '')}
              >
                <SelectTrigger
                  id="writingTone"
                  className="bg-[#0A0A0B] border-white/10 text-sm h-11 lg:h-10 w-full"
                >
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent className="bg-[#121214] border-white/10">
                  <SelectItem value="clear">Clear</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 py-4 border-t border-white/5">
            <div>
              <p className="text-sm font-medium text-white mb-0.5 sm:mb-0">Auto-save</p>
              <p className="text-xs text-white/50">
                Automatically save your changes in the background
              </p>
            </div>
            <Switch checked={autoSave} onCheckedChange={setAutoSave} disabled={loading} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <div className="bg-[#121214] border border-white/5 rounded-2xl p-4 sm:p-6 lg:p-8">
            <h2 className="text-[15px] font-medium text-white mb-4 sm:mb-6">Notifications</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <Label className="text-sm font-normal text-white/90">Idea scan complete</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label className="text-sm font-normal text-white/90">Product draft ready</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label className="text-sm font-normal text-white/90">Sales kit ready</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label className="text-sm font-normal text-white/90">Store updated</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label className="text-sm font-normal text-white/90">Weekly summary</Label>
                <Switch defaultChecked />
              </div>
            </div>
          </div>

          <div className="bg-[#121214] border border-white/5 rounded-2xl p-4 sm:p-6 lg:p-8">
            <h2 className="text-[15px] font-medium text-white mb-4 sm:mb-6">AI Team</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <Label className="text-sm font-normal text-white/90">Show AI team updates</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label className="text-sm font-normal text-white/90">
                  Review copy for clarity
                </Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label className="text-sm font-normal text-white/90">
                  Warn me about risky claims
                </Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label className="text-sm font-normal text-white/90">Keep language simple</Label>
                <Switch defaultChecked />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#121214] border border-white/5 rounded-2xl p-4 sm:p-6 lg:p-8">
          <h2 className="text-[15px] font-medium text-white mb-4 sm:mb-6">
            Data and exports
          </h2>

          <div className="space-y-3 sm:space-y-0 sm:flex sm:gap-3 lg:gap-4">
            <Button
              variant="outline"
              className="bg-transparent border-white/10 hover:bg-white/5 text-white w-full sm:w-auto h-11 sm:h-10"
              type="button"
            >
              Export saved work
            </Button>
            <Button
              variant="outline"
              className="bg-transparent border-white/10 hover:bg-white/5 text-white w-full sm:w-auto h-11 sm:h-10"
              type="button"
            >
              Export as Markdown
            </Button>
            <Button
              variant="outline"
              className="bg-transparent border-white/10 hover:bg-white/5 text-white w-full sm:w-auto h-11 sm:h-10"
              type="button"
            >
              Download account data
            </Button>
          </div>
        </div>

        <div className="pt-4 lg:pt-8 mb-8 lg:mb-12">
          <h2 className="text-xs sm:text-sm font-medium text-white/50 mb-3 sm:mb-4 px-2">Account</h2>
          <div className="bg-transparent border border-red-500/10 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white mb-0.5 sm:mb-0">Delete account</p>
              <p className="text-xs text-white/50">
                Permanently remove your account and all data
              </p>
            </div>
            <Button
              variant="destructive"
              className="w-full sm:w-auto bg-red-500/10 hover:bg-red-500/20 text-red-500 border-0 h-11 sm:h-10"
              type="button"
            >
              Delete account
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
