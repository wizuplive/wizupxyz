import {
  Activity,
  ArrowRight,
  Check,
  CircleDot,
  Clock3,
  Crosshair,
  Gem,
  Grid3X3,
  Hexagon,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

const agents = [
  {
    name: 'Scout',
    role: 'Finds buyer demand and hidden pain points.',
    state: 'Scanning demand signals',
    accent: '#00D9FF',
    tint: 'cyan',
    icon: 'radar',
  },
  {
    name: 'Strategist',
    role: 'Shapes the market angle and offer position.',
    state: 'Mapping product angles',
    accent: '#8B5CF6',
    tint: 'violet',
    icon: 'queen',
  },
  {
    name: 'Creator',
    role: 'Builds product drafts, assets, and systems.',
    state: 'Assembling product sections',
    accent: '#FF7A1A',
    tint: 'orange',
    icon: 'cube',
  },
  {
    name: 'Analyst',
    role: 'Reads traction and explains what changed.',
    state: 'Reading performance patterns',
    accent: '#00D9FF',
    tint: 'teal',
    icon: 'prism',
  },
  {
    name: 'Reviewer',
    role: 'Improves clarity, UX, and customer trust.',
    state: 'Polishing launch copy',
    accent: '#FF4FD8',
    tint: 'magenta',
    icon: 'shield',
  },
];

const activity = [
  {
    agent: 'Scout',
    time: 'Just now',
    text: 'Found buyer questions about calm productivity systems.',
    detail: 'Demand is strongest around simple reset routines.',
  },
  {
    agent: 'Strategist',
    time: '4m ago',
    text: 'Positioned the ADHD Planner around easier daily restarts.',
    detail: 'Clear angle: less planning pressure, more forward motion.',
  },
  {
    agent: 'Creator',
    time: '16m ago',
    text: 'Built three product sections for the first draft.',
    detail: 'Focus reset, weekly plan, and small win tracker.',
  },
  {
    agent: 'Reviewer',
    time: '1h ago',
    text: 'Simplified the sales page intro.',
    detail: 'Copy now reads faster and feels more human.',
  },
];

const insights = ['Buyer demand rising', 'Launch copy improved', 'Checkout page ready'];

export function AITeamWorkspace() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-7">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.075] bg-[linear-gradient(145deg,rgba(255,255,255,0.068),rgba(255,255,255,0.023)_39%,rgba(6,6,12,0.93))] p-5 shadow-[0_32px_108px_-74px_rgba(217,70,239,0.86)] backdrop-blur-2xl sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_34%_20%,rgba(200,77,255,0.14),transparent_32%),radial-gradient(circle_at_86%_12%,rgba(0,217,255,0.08),transparent_30%),radial-gradient(circle_at_58%_0%,rgba(124,58,237,0.12),transparent_36%)]" />
        <div className="absolute left-12 top-12 h-40 w-40 rounded-full bg-fuchsia-400/10 blur-3xl" />
        <div className="relative grid gap-7 xl:grid-cols-[1fr_350px] xl:items-stretch">
          <div className="flex flex-col justify-between gap-7">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-fuchsia-300/16 bg-fuchsia-400/[0.07] px-3 py-1.5 text-xs font-medium text-fuchsia-100">
                <Sparkles className="h-3.5 w-3.5" />
                AI product studio
              </div>
              <h1 className="max-w-3xl text-4xl font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">
                Your Product <span className="text-fuchsia-200 drop-shadow-[0_0_22px_rgba(200,77,255,0.34)]">Team</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/64 sm:text-lg">
                Meet your AI team. Each agent has a role. Together, they turn ideas into real products people already want.
              </p>
            </div>

            <ProductStatusCard />
          </div>

          <aside className="rounded-[1.5rem] border border-white/[0.075] bg-white/[0.038] p-5 shadow-[0_28px_84px_-64px_rgba(217,70,239,0.72)] backdrop-blur-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-[-0.03em] text-white">Next Up</h2>
                <p className="mt-1 text-sm leading-5 text-white/48">Review the product draft before publishing.</p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-fuchsia-300/16 bg-fuchsia-400/[0.08] text-fuchsia-100">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
            <div className="space-y-3">
              {['Confirm product sections', 'Polish sales angle', 'Prepare launch assets'].map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-black/18 p-3">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg border ${index === 0 ? 'border-fuchsia-300/18 bg-fuchsia-400/[0.1] text-fuchsia-100' : 'border-white/[0.07] bg-white/[0.03] text-white/36'}`}>
                    {index === 0 ? <Zap className="h-3.5 w-3.5" /> : index + 1}
                  </div>
                  <span className="text-sm text-white/68">{item}</span>
                </div>
              ))}
            </div>
            <Button className="mt-5 h-11 w-full rounded-2xl bg-fuchsia-500 font-semibold text-white shadow-[0_0_28px_-12px_rgba(217,70,239,0.88)] hover:bg-fuchsia-400">
              Continue Build
              <ArrowRight className="h-4 w-4" />
            </Button>
          </aside>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_350px]">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {agents.map((agent) => (
              <AgentCard key={agent.name} agent={agent} />
            ))}
          </div>

          <LiveActivityFeed />
        </div>

        <aside className="space-y-5">
          <TeamPulse />
          <RailPanel title="Saved Insights">
            <div className="space-y-2.5">
              {insights.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3 text-sm text-white/70">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-fuchsia-300/12 bg-fuchsia-400/[0.07] text-fuchsia-100">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </RailPanel>
        </aside>
      </section>
    </div>
  );
}

function ProductStatusCard() {
  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-white/[0.075] bg-white/[0.038] p-5 shadow-[0_26px_88px_-66px_rgba(217,70,239,0.78)] backdrop-blur-xl">
      <div className="absolute -right-12 -top-14 h-32 w-32 rounded-full bg-fuchsia-400/12 blur-3xl" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-fuchsia-300/16 bg-[radial-gradient(circle_at_34%_22%,rgba(200,77,255,0.26),rgba(255,255,255,0.055)_50%,rgba(0,0,0,0.18))] text-fuchsia-100 shadow-[inset_0_0_26px_rgba(200,77,255,0.12)]">
          <Gem className="h-8 w-8" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-300/14 bg-emerald-400/[0.07] px-3 py-1 text-xs font-medium text-emerald-100/90">In progress</span>
            <span className="rounded-full border border-fuchsia-300/14 bg-fuchsia-400/[0.07] px-3 py-1 text-xs font-medium text-fuchsia-100/90">Build phase</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">ADHD Planner System</h2>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.065]">
            <div className="h-full w-[72%] rounded-full bg-fuchsia-400 shadow-[0_0_16px_rgba(217,70,239,0.62)]" />
          </div>
        </div>
        <div className="grid min-w-[19rem] grid-cols-3 gap-2.5">
          <StatusMetric label="Phase" value="Build" />
          <StatusMetric label="Launch target" value="May 31" />
          <StatusMetric label="Updated" value="12m ago" />
        </div>
      </div>
    </div>
  );
}

function AgentCard({ agent }: { agent: (typeof agents)[number] }) {
  return (
    <article className="group relative overflow-hidden rounded-[1.5rem] border border-white/[0.075] bg-[linear-gradient(145deg,rgba(255,255,255,0.058),rgba(255,255,255,0.023)_45%,rgba(7,7,12,0.92))] p-5 shadow-[0_28px_84px_-66px_rgba(217,70,239,0.68)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.12] hover:shadow-[0_34px_96px_-66px_rgba(217,70,239,0.86)]">
      <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full opacity-20 blur-3xl transition-opacity duration-300 group-hover:opacity-30" style={{ backgroundColor: agent.accent }} />
      <div className="relative mx-auto mb-5 flex h-40 items-center justify-center rounded-[1.25rem] border border-white/[0.065] bg-black/24 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
        <AgentIcon type={agent.icon} accent={agent.accent} />
      </div>
      <div className="relative text-center">
        <h3 className="text-xl font-semibold tracking-[-0.035em] text-white">{agent.name}</h3>
        <p className="mx-auto mt-2 min-h-10 max-w-[15rem] text-sm leading-5 text-white/55">{agent.role}</p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.035] px-3 py-1.5 text-xs text-white/62">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: agent.accent, boxShadow: `0 0 12px ${agent.accent}` }} />
          {agent.state}
        </div>
      </div>
    </article>
  );
}

function AgentIcon({ type, accent }: { type: string; accent: string }) {
  if (type === 'radar') {
    return (
      <div className="relative h-28 w-28">
        <div className="absolute inset-0 rounded-full border border-cyan-200/20" />
        <div className="absolute inset-4 rounded-full border border-cyan-200/18" />
        <div className="absolute inset-8 rounded-full border border-cyan-200/16" />
        <div className="absolute left-1/2 top-1/2 h-14 w-0.5 origin-bottom -translate-x-1/2 -translate-y-full rotate-45 rounded-full bg-cyan-200/80 shadow-[0_0_18px_rgba(0,217,255,0.9)]" />
        <div className="absolute inset-0 rounded-full bg-cyan-300/10 blur-xl" />
        <Radar className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 text-cyan-100" />
      </div>
    );
  }

  if (type === 'queen') {
    return (
      <div className="relative flex h-28 w-28 items-center justify-center">
        <div className="absolute inset-2 rotate-45 rounded-2xl border border-violet-200/18 bg-violet-400/8" />
        <div className="absolute inset-x-5 bottom-4 h-12 rounded-t-[2rem] border border-violet-200/22 bg-violet-300/10 shadow-[0_0_28px_rgba(139,92,246,0.32)]" />
        <div className="absolute top-5 flex gap-1.5">
          {[0, 1, 2].map((item) => <span key={item} className="h-3 w-3 rotate-45 rounded-sm bg-violet-200/80 shadow-[0_0_14px_rgba(139,92,246,0.76)]" />)}
        </div>
        <Target className="relative h-10 w-10 text-violet-100" />
      </div>
    );
  }

  if (type === 'cube') {
    return (
      <div className="relative flex h-28 w-28 items-center justify-center">
        <div className="absolute h-20 w-20 rotate-45 rounded-xl border border-orange-200/22 bg-orange-400/10 shadow-[0_0_32px_rgba(255,122,26,0.36)]" />
        <div className="absolute h-14 w-14 -rotate-12 rounded-xl border border-orange-100/18 bg-black/16" />
        <div className="absolute h-8 w-8 rounded-lg bg-orange-300/40 blur-md" />
        <Hexagon className="relative h-12 w-12 text-orange-100" />
      </div>
    );
  }

  if (type === 'prism') {
    return (
      <div className="relative flex h-28 w-28 items-center justify-center">
        <div className="absolute h-24 w-16 skew-x-[-10deg] rounded-xl border border-cyan-100/20 bg-cyan-300/8 shadow-[0_0_30px_rgba(0,217,255,0.24)]" />
        <svg viewBox="0 0 90 70" className="relative h-20 w-24 overflow-visible">
          <path d="M8 52 L26 38 L42 45 L58 20 L78 28" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
          {[8, 26, 42, 58, 78].map((x, index) => (
            <circle key={x} cx={x} cy={[52, 38, 45, 20, 28][index]} r="4" fill="#cffafe" />
          ))}
        </svg>
      </div>
    );
  }

  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      <div className="absolute h-24 w-20 rounded-[2rem] border border-pink-200/22 bg-pink-400/8 shadow-[0_0_32px_rgba(255,79,216,0.34)]" />
      <div className="absolute h-16 w-16 rounded-full bg-pink-300/12 blur-xl" />
      <ShieldCheck className="relative h-14 w-14 text-pink-100" />
    </div>
  );
}

function LiveActivityFeed() {
  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-white/[0.075] bg-white/[0.038] shadow-[0_28px_84px_-64px_rgba(217,70,239,0.72)] backdrop-blur-xl">
      <div className="flex items-center gap-3 border-b border-white/[0.06] bg-white/[0.02] p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-fuchsia-300/14 bg-fuchsia-400/[0.075] text-fuchsia-100">
          <Activity className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.03em] text-white">Live Activity Feed</h2>
          <p className="text-sm text-white/42">What the team is working on now.</p>
        </div>
        <span className="ml-auto hidden items-center gap-2 rounded-full border border-emerald-300/14 bg-emerald-400/[0.07] px-3 py-1 text-xs text-emerald-100 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.85)]" />
          Active
        </span>
      </div>
      <div className="divide-y divide-white/[0.055]">
        {activity.map((item) => (
          <div key={`${item.agent}-${item.time}`} className="flex gap-4 p-5 transition-colors hover:bg-white/[0.025]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-black/20 text-white/54">
              <CircleDot className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className="font-medium text-white">{item.agent}</span>
                <span className="shrink-0 text-xs text-white/34">{item.time}</span>
              </div>
              <p className="text-sm leading-6 text-white/78">{item.text}</p>
              <p className="mt-2 rounded-xl border border-white/[0.055] bg-black/18 px-3 py-2 text-sm leading-5 text-white/46">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TeamPulse() {
  return (
    <RailPanel title="Team Pulse">
      <div className="flex items-center gap-5">
        <div className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-black/24">
          <div className="absolute inset-3 rounded-full border-[10px] border-white/[0.05]" />
          <div className="absolute inset-3 rounded-full border-[10px] border-fuchsia-400/70 [clip-path:polygon(50%_50%,100%_0,100%_100%,50%_100%)] shadow-[0_0_22px_rgba(217,70,239,0.34)]" />
          <div className="absolute inset-6 rounded-full border-[8px] border-cyan-300/45 [clip-path:polygon(50%_50%,0_0,100%_0,100%_50%)]" />
          <div className="relative text-center">
            <p className="text-2xl font-semibold text-white">92%</p>
            <p className="text-[10px] uppercase tracking-[0.12em] text-white/36">active</p>
          </div>
        </div>
        <div className="space-y-2.5">
          <PulseLegend color="bg-fuchsia-300" label="Building" />
          <PulseLegend color="bg-cyan-300" label="Scanning" />
          <PulseLegend color="bg-orange-300" label="Polishing" />
        </div>
      </div>
    </RailPanel>
  );
}

function RailPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[1.5rem] border border-white/[0.075] bg-white/[0.038] p-5 shadow-[0_28px_84px_-64px_rgba(217,70,239,0.72)] backdrop-blur-xl">
      <h2 className="mb-4 text-lg font-semibold tracking-[-0.03em] text-white">{title}</h2>
      {children}
    </section>
  );
}

function PulseLegend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-white/58">
      <span className={`h-2 w-2 rounded-full ${color} shadow-[0_0_10px_currentColor]`} />
      {label}
    </div>
  );
}

function StatusMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/18 p-3">
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-white/32">{label}</p>
      <p className="truncate text-sm font-semibold text-white/82">{value}</p>
    </div>
  );
}
