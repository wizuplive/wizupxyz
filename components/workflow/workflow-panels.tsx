import type { ComponentType, ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

type NoticeTone = 'info' | 'success' | 'error';

const noticeStyles: Record<NoticeTone, string> = {
  info: 'border-primary/20 bg-primary/10 text-fuchsia-100',
  success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100',
  error: 'border-red-500/20 bg-red-500/10 text-red-100',
};

const noticeIcons = {
  info: Info,
  success: CheckCircle2,
  error: AlertCircle,
};

export function WorkflowNotice({
  tone = 'info',
  children,
}: {
  tone?: NoticeTone;
  children: ReactNode;
}) {
  const Icon = noticeIcons[tone];

  return (
    <div
      className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs sm:text-sm ${noticeStyles[tone]}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

export function AiSourceBadge({
  source,
  fallbackReason,
}: {
  source: string;
  fallbackReason?: string;
}) {
  const isMock = source === 'mock';

  return (
    <Badge
      variant="outline"
      title={fallbackReason}
      className={
        isMock
          ? 'border-amber-500/20 bg-amber-500/10 text-amber-300'
          : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
      }
    >
      {isMock ? 'Mock fallback' : 'Gemini'}
    </Badge>
  );
}

export function EmptyWorkflowState({
  icon: Icon,
  title,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="border-white/5 bg-card p-6 text-center">
      <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-white/5">
        <Icon className="h-5 w-5 text-white/50" />
      </div>
      <h3 className="mb-2 text-base font-medium text-white">{title}</h3>
      <div className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </Card>
  );
}

export function InlineSpinner({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </span>
  );
}
