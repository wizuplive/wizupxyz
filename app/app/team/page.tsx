import { Bot, CheckCircle2, Lock, ShieldCheck } from 'lucide-react';

import { Card } from '@/components/ui/card';

const trustLayers = [
  {
    title: 'Human approval stays in control',
    detail:
      'WIZUP can draft ideas, offers, and launch assets, but the operator chooses what ships and what gets discarded.',
    icon: CheckCircle2,
  },
  {
    title: 'No hidden deployment actions',
    detail:
      'The guided flow stops at launch readiness. It does not deploy, attach external hosting, or create secrets on your behalf.',
    icon: Lock,
  },
  {
    title: 'Structured session memory only',
    detail:
      'The active build stores the selected idea, product draft, sales kit, and launch checklist so each stage has explicit context.',
    icon: Bot,
  },
  {
    title: 'Trust signals are visible',
    detail:
      'Launch surfaces missing proof, FAQ gaps, and incomplete messaging before anything is treated as ready.',
    icon: ShieldCheck,
  },
];

export default function TeamPage() {
  return (
    <div className="mx-auto max-w-5xl p-4 pb-24 sm:p-6 lg:p-8 lg:pb-8">
      <div className="mb-8">
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-primary/80">Trust layer</p>
        <h1 className="mb-2 text-3xl font-medium text-white">How the guided team behaves</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground lg:text-base">
          This page is intentionally static. It explains the product boundaries and the guardrails around the guided flow.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {trustLayers.map((layer) => (
          <Card key={layer.title} className="border-white/5 bg-card p-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <layer.icon className="h-5 w-5 text-primary" />
            </div>
            <h2 className="mb-2 text-lg font-medium text-white">{layer.title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{layer.detail}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
