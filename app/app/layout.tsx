'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Hammer,
  Rocket,
  Store,
  Archive,
  Bot,
  Check,
  Compass,
  Search,
  Bell,
  ChevronDown,
  Target,
  CircleUserRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut } from '@/app/actions/auth';
import { ActiveBuildSessionProvider } from '@/app/context/ActiveBuildSessionContext';
import { OnboardingSync } from './onboarding-sync';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useActiveBuild, type BuildStage } from '@/app/context/ActiveBuildSessionContext';

const navItems = [
  { href: '/app', label: 'Discover', icon: Compass },
  { href: '/app/strategy', label: 'Strategy', icon: Target },
  { href: '/app/build', label: 'Build', icon: Hammer },
  { href: '/app/publish', label: 'Publish', icon: Rocket },
  { href: '/app/store', label: 'Store', icon: Store },
  { href: '/app/saved', label: 'Saved', icon: Archive },
  { href: '/app/ai-team', label: 'AI Team', icon: Bot },
];

const journeySteps = [
  { label: 'Discover', href: '/app', stage: 'find' as BuildStage, paths: ['/app', '/app/ideas', '/app/find'] },
  { label: 'Strategy', href: '/app/strategy', stage: 'strategy' as BuildStage, paths: ['/app/strategy', '/app/create'] },
  { label: 'Build', href: '/app/build', stage: 'build' as BuildStage, paths: ['/app/build', '/app/product'] },
  { label: 'Publish', href: '/app/publish', stage: 'publish' as BuildStage, paths: ['/app/publish', '/app/sales-kit', '/app/sell'] },
  { label: 'Store', href: '/app/store', stage: 'launch' as BuildStage, paths: ['/app/launch', '/app/store'] },
];

const profileMenuItems = [
  { href: '/app/profile', label: 'Profile' },
  { href: '/app/billing', label: 'Billing' },
  { href: '/app/settings', label: 'Settings' },
  { href: '/app/help', label: 'Help' },
];

type AccountMenuProfile = {
  fullName: string;
  plan: string;
  initials: string;
};

function getDefaultAccountProfile() {
  return {
    fullName: 'Your Workspace',
    plan: 'Creator',
    initials: 'WU',
  } satisfies AccountMenuProfile;
}

function getProfileInitials(fullName: string, email: string) {
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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ActiveBuildSessionProvider>
      <AppShell>{children}</AppShell>
    </ActiveBuildSessionProvider>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { activeSession, updateStage } = useActiveBuild();
  const [isSigningOut, startSignOutTransition] = useTransition();
  const isNavItemActive = (href: string) => {
    if (href === '/app') {
      return pathname === href || pathname === '/preview/discover-v7';
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };
  const handleSignOut = () => {
    startSignOutTransition(() => {
      void signOut();
    });
  };
  const routeJourneyIndex = journeySteps.findIndex((step) =>
    step.paths.some((path) => pathname === path || pathname.startsWith(`${path}/`)) ||
    (step.href === '/app' && pathname === '/preview/discover-v7')
  );
  const activeJourneyIndex = routeJourneyIndex === -1 ? 0 : routeJourneyIndex;
  const sessionStageIndex = activeSession
    ? Math.max(
        0,
        journeySteps.findIndex((step) => step.stage === activeSession.current_stage)
      )
    : 0;
  const [accountProfile, setAccountProfile] = useState<AccountMenuProfile>(getDefaultAccountProfile);

  useEffect(() => {
    let supabase: ReturnType<typeof createClient> | null = null;

    try {
      supabase = createClient();
    } catch (error) {
      console.error('[app-shell] supabase client init failed', {
        error: error instanceof Error ? error.message : 'unknown',
      });
      setAccountProfile(getDefaultAccountProfile());
      return;
    }

    async function hydrateAccountProfile(userId?: string | null, email?: string | null) {
      if (!userId || !supabase) {
        setAccountProfile({
          ...getDefaultAccountProfile(),
          initials: getProfileInitials('', email ?? ''),
        });
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, onboarding_preferences')
          .eq('id', userId)
          .maybeSingle();

        const fullNameFromProfile =
          typeof profile?.full_name === 'string' ? profile.full_name.trim() : '';
        const fullName =
          fullNameFromProfile ||
          email?.trim() ||
          'Your Workspace';
        const preferences =
          profile?.onboarding_preferences &&
          typeof profile.onboarding_preferences === 'object' &&
          !Array.isArray(profile.onboarding_preferences)
            ? (profile.onboarding_preferences as Record<string, unknown>)
            : {};
        const accountSummary =
          preferences.accountSummary &&
          typeof preferences.accountSummary === 'object' &&
          !Array.isArray(preferences.accountSummary)
            ? (preferences.accountSummary as Record<string, unknown>)
            : {};
        const plan =
          typeof accountSummary.plan === 'string' && accountSummary.plan.trim()
            ? accountSummary.plan
            : 'Creator';

        setAccountProfile({
          fullName,
          plan,
          initials: getProfileInitials(fullName, email ?? ''),
        });
      } catch (error) {
        console.error('[app-shell] profile hydration failed', {
          userId,
          error: error instanceof Error ? error.message : 'unknown',
        });
        const fallbackFullName = email?.trim() || 'Your Workspace';
        setAccountProfile({
          fullName: fallbackFullName,
          plan: 'Creator',
          initials: getProfileInitials(fallbackFullName, email ?? ''),
        });
      }
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      void hydrateAccountProfile(user?.id ?? null, user?.email ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void hydrateAccountProfile(session?.user?.id ?? null, session?.user?.email ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <OnboardingSync />
      <div className="relative flex h-screen overflow-hidden bg-[radial-gradient(circle_at_45%_-10%,rgba(192,38,211,0.16),transparent_34%),linear-gradient(135deg,#050507_0%,#0a0a0e_46%,#08060d_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20" />
      {/* Sidebar Navigation */}
      <aside className="relative z-20 hidden w-64 shrink-0 flex-col border-r border-white/[0.08] bg-black/35 p-5 shadow-[18px_0_70px_-50px_rgba(216,70,239,0.45)] backdrop-blur-2xl lg:flex">
        <div className="mb-11 flex items-center px-1">
          <Link href="/app" className="group inline-flex items-baseline">
            <span className="text-[1.65rem] font-black leading-none tracking-[-0.055em] text-white transition-colors group-hover:text-white/92">WIZUP</span>
            <span className="ml-0.5 text-[1.7rem] font-black leading-none text-fuchsia-300 drop-shadow-[0_0_16px_rgba(217,70,239,0.65)]">.</span>
          </Link>
        </div>

        <nav className="-mx-1 flex flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(217,70,239,0.28)_transparent]">
          {navItems.map((item) => {
            const isActive = isNavItemActive(item.href);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl border px-3.5 py-3 text-sm font-medium transition-all duration-300 will-change-transform",
                  isActive 
                    ? "border-fuchsia-300/25 bg-fuchsia-400/[0.12] text-white shadow-[0_0_28px_-16px_rgba(217,70,239,0.95)]" 
                    : "border-transparent text-white/48 hover:border-white/[0.08] hover:bg-white/[0.04] hover:text-white/86"
                )}
              >
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg border transition-all", isActive ? "border-fuchsia-300/30 bg-black/30 text-fuchsia-200" : "border-white/[0.06] bg-white/[0.03] text-white/45 group-hover:text-white/80")}>
                  <item.icon className="h-4 w-4" />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="relative -mx-1 mt-auto border-t border-white/[0.07] pt-5">
           <div className="relative overflow-hidden rounded-2xl border border-fuchsia-300/18 bg-[linear-gradient(145deg,rgba(192,38,211,0.16),rgba(255,255,255,0.035)_45%,rgba(0,0,0,0.28))] p-4 shadow-[0_22px_60px_-38px_rgba(217,70,239,0.8)]">
             <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-fuchsia-400/20 blur-3xl" />
             <p className="mb-2 text-xs font-semibold text-fuchsia-100">Find the signal</p>
             <p className="mb-3 text-[11px] leading-relaxed text-white/58">See what people already want, then build with focus.</p>
             <Link href="/app">
               <button className="w-full rounded-xl bg-fuchsia-500 px-3 py-2.5 text-[12px] font-semibold text-white shadow-[0_0_24px_-8px_rgba(217,70,239,0.9)] transition-all hover:bg-fuchsia-400">Start Scan</button>
             </Link>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="relative z-10 flex h-screen min-w-0 flex-1 flex-col overflow-hidden pb-16 lg:pb-0">
        
        {/* Desktop Header */}
        <header className="hidden h-[78px] shrink-0 items-center justify-between border-b border-white/[0.07] bg-black/10 px-6 backdrop-blur-xl xl:px-8 lg:flex">
          <div className="flex min-w-0 items-center gap-2 overflow-x-auto pr-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {journeySteps.map((step, index) => {
              const isActive = index === activeJourneyIndex;
              const isComplete = sessionStageIndex > index || activeJourneyIndex > index;
              return (
                <div key={step.label} className="flex shrink-0 items-center gap-2.5">
                  <Link
                    href={step.href}
                    onClick={() => {
                      if (activeSession) {
                        updateStage(step.stage);
                      }
                    }}
                    className={cn("flex items-center gap-2 rounded-full px-3 py-2 text-sm transition-all duration-300 hover:bg-white/[0.04] hover:text-white", isActive ? "bg-fuchsia-400/[0.12] text-white shadow-[0_0_28px_-14px_rgba(217,70,239,0.9)]" : isComplete ? "text-white/70" : "text-white/45")}
                  >
                    <span className={cn("flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold", isActive ? "border-fuchsia-300/40 bg-fuchsia-400 text-white" : isComplete ? "border-fuchsia-300/24 bg-fuchsia-400/[0.12] text-fuchsia-100" : "border-white/10 bg-white/[0.04] text-white/50")}>
                      {isComplete ? <Check className="h-3.5 w-3.5" /> : index + 1}
                    </span>
                    {step.label}
                  </Link>
                  {index < journeySteps.length - 1 ? <div className="h-px w-6 bg-gradient-to-r from-white/15 to-transparent" /> : null}
                </div>
              );
            })}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden w-60 items-center gap-3 rounded-full border border-white/[0.08] bg-white/[0.045] px-4 py-2.5 text-white/42 shadow-inner xl:flex">
              <Search className="h-4 w-4" />
              <span className="text-sm">Search markets...</span>
              <span className="ml-auto rounded-md bg-white/[0.07] px-1.5 py-0.5 text-[10px] text-white/38">⌘K</span>
            </div>
            <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white">
              <Bell className="h-4 w-4" />
            </button>
            
            <DropdownMenu>
              <DropdownMenuTrigger className="group relative flex cursor-pointer items-center rounded-full outline-none transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-white/20">
                <span className="absolute inset-0 rounded-full bg-[conic-gradient(from_210deg,rgba(244,114,182,0.55),rgba(168,85,247,0.14),rgba(34,211,238,0.2),rgba(244,114,182,0.55))] p-px opacity-85 transition-opacity group-hover:opacity-100">
                  <span className="block h-full w-full rounded-full bg-[#09090d]" />
                </span>
                <Avatar className="relative h-10 w-10 rounded-full border border-white/10 bg-[linear-gradient(145deg,rgba(17,24,39,0.96),rgba(88,28,135,0.4))] shadow-[0_0_22px_-12px_rgba(217,70,239,0.88)]">
                  <AvatarFallback className="bg-transparent text-[11px] text-white">{accountProfile.initials}</AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-[#09090d] bg-white/[0.08] text-white/56 backdrop-blur">
                  <ChevronDown className="h-3 w-3" />
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 bg-[#121214] text-white border-white/5 mt-1.5 shadow-2xl p-1 rounded-xl">
                <div className="flex items-center gap-3 rounded-lg px-2.5 py-2">
                  <Avatar className="h-9 w-9 rounded-full border border-fuchsia-200/15">
                    <AvatarFallback className="bg-gradient-to-tr from-fuchsia-950 to-zinc-700 text-[11px] text-white">{accountProfile.initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-white/90">{accountProfile.fullName}</p>
                    <p className="text-[11px] text-white/50">{accountProfile.plan}</p>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-white/5 mx-1 my-1" />
                <div className="flex flex-col gap-0.5">
                  {profileMenuItems.map((item) => (
                    <DropdownMenuItem key={item.href} onClick={() => router.push(item.href)} className="text-white/70 hover:text-white focus:text-white focus:bg-white/5 cursor-pointer rounded-lg text-[13px] py-1.5 px-2.5 outline-none transition-colors">
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </div>
                <DropdownMenuSeparator className="bg-white/5 mx-1 my-1" />
                <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut} className="text-white/70 hover:text-white focus:text-white focus:bg-white/5 cursor-pointer rounded-lg text-[13px] py-1.5 px-2.5 outline-none transition-colors">
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="relative z-30 flex h-14 shrink-0 items-center justify-between border-b border-white/[0.07] bg-[#07070a]/92 px-4 backdrop-blur-xl lg:hidden">
          <Link href="/app" className="group flex min-w-0 items-center gap-2">
            <span className="text-xl font-black tracking-[-0.055em] text-white">WIZUP<span className="text-fuchsia-300">.</span></span>
            <span className="hidden items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.035] px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/45 sm:inline-flex">
              <CircleUserRound className="h-3 w-3" />
              {journeySteps[activeJourneyIndex]?.label ?? 'Discover'}
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none focus:ring-2 focus:ring-primary/50 rounded-full">
                <Avatar className="w-8 h-8 rounded-full border border-white/10">
                  <AvatarFallback className="bg-gradient-to-tr from-gray-800 to-gray-600 text-[10px] text-white">{accountProfile.initials}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 bg-[#121214] text-white border-white/5 mt-1.5 shadow-2xl p-1 rounded-xl">
                <div className="flex flex-col gap-0.5">
                  {profileMenuItems.map((item) => (
                    <DropdownMenuItem key={item.href} onClick={() => router.push(item.href)} className="text-white/70 hover:text-white focus:text-white focus:bg-white/5 cursor-pointer rounded-lg text-[13px] py-1.5 px-2.5 outline-none transition-colors">
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </div>
                <DropdownMenuSeparator className="bg-white/5 mx-1 my-1" />
                <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut} className="text-white/70 hover:text-white focus:text-white focus:bg-white/5 cursor-pointer rounded-lg text-[13px] py-1.5 px-2.5 outline-none transition-colors">
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Mobile Bottom Navigation */}
        <nav className="absolute bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-white/[0.07] bg-[#07070a]/95 px-1 backdrop-blur-xl pb-safe lg:hidden">
          {navItems.filter(item => ['Discover', 'Strategy', 'Build', 'Publish', 'Store'].includes(item.label)).map((item) => {
            const isActive = isNavItemActive(item.href);
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center w-full h-full gap-1 p-1">
                <div className={cn("rounded-full p-1.5 transition-colors", isActive ? "bg-fuchsia-400/15" : "transparent")}>
                  <item.icon className={cn("h-5 w-5", isActive ? "text-fuchsia-100" : "text-white/40")} />
                </div>
                <span className={cn("text-[9px] font-medium transition-colors", isActive ? "text-white" : "text-white/40")}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex-1 overflow-y-auto w-full">
          {children}
        </div>
      </main>
    </div>
    </>
  );
}
