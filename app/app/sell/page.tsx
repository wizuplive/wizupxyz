'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  Plus,
  Rocket,
  Sparkles,
  Target,
  Trash2,
} from 'lucide-react';

import {
  useActiveBuild,
  type SalesKit,
  type SalesKitEmail,
  type SalesKitFaqItem,
} from '@/app/context/ActiveBuildSessionContext';
import { EmptyWorkflowState, WorkflowNotice } from '@/components/workflow/workflow-panels';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type SellPageForm = {
  headline: string;
  subheadline: string;
  problemSection: string;
  benefitBullets: string;
  launchEmails: SalesKitEmail[];
  socialPosts: string;
  faq: SalesKitFaqItem[];
  pricingRationale: string;
  callToAction: string;
};

const cinematicInputClass =
  'border-white/10 bg-black/40 text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] transition-all placeholder:text-white/25 focus:border-primary/40 focus:bg-[#0A0A0B] focus:shadow-[0_0_12px_rgba(var(--primary),0.2)] focus-visible:ring-0';

function splitLines(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function createEmail(index: number): SalesKitEmail {
  return {
    subject: `Launch email ${index + 1}`,
    previewText: '',
    body: '',
  };
}

function createFaq(index: number): SalesKitFaqItem {
  return {
    question: `Question ${index + 1}`,
    answer: '',
  };
}

function withMinimumItems<T>(items: T[], createItem: (index: number) => T) {
  return items.length > 0 ? items : [createItem(0)];
}

function salesKitFromSession(productTitle: string, buyer: string, existingSalesKit: SalesKit | null): SellPageForm {
  if (existingSalesKit) {
    return {
      headline: existingSalesKit.headline,
      subheadline: existingSalesKit.subheadline,
      problemSection: existingSalesKit.problemSection,
      benefitBullets: existingSalesKit.benefitBullets.join('\n'),
      launchEmails: withMinimumItems(existingSalesKit.launchEmails, createEmail),
      socialPosts: existingSalesKit.socialPosts.join('\n'),
      faq: withMinimumItems(existingSalesKit.faq, createFaq),
      pricingRationale: existingSalesKit.pricingRationale,
      callToAction: existingSalesKit.callToAction,
    };
  }

  return {
    headline: `${productTitle} for ${buyer}`,
    subheadline: '',
    problemSection: '',
    benefitBullets: '',
    launchEmails: [createEmail(0)],
    socialPosts: '',
    faq: [createFaq(0)],
    pricingRationale: '',
    callToAction: '',
  };
}

export default function SellPage() {
  const router = useRouter();
  const { activeSession, setSalesKit, updateStage } = useActiveBuild();
  const productDraft = activeSession?.product_draft ?? null;
  const [form, setForm] = useState(() =>
    salesKitFromSession(productDraft?.title ?? '', productDraft?.targetBuyer ?? '', activeSession?.sales_kit ?? null)
  );
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    updateStage('sell');
  }, [updateStage]);

  useEffect(() => {
    setForm(
      salesKitFromSession(
        productDraft?.title ?? '',
        productDraft?.targetBuyer ?? '',
        activeSession?.sales_kit ?? null
      )
    );
  }, [productDraft, activeSession?.sales_kit]);

  if (!productDraft) {
    return (
      <div className="mx-auto max-w-4xl p-4 pb-24 sm:p-6 lg:p-8 lg:pb-8">
        <EmptyWorkflowState icon={Rocket} title="Create the product draft first">
          Sell depends on the product draft from Create.
        </EmptyWorkflowState>
        <div className="mt-4">
          <Link href="/app/create">
            <Button>Go to Create</Button>
          </Link>
        </div>
      </div>
    );
  }

  function handleChange(key: keyof SellPageForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateEmail(index: number, key: keyof SalesKitEmail, value: string) {
    setForm((current) => ({
      ...current,
      launchEmails: current.launchEmails.map((email, emailIndex) =>
        emailIndex === index ? { ...email, [key]: value } : email
      ),
    }));
  }

  function updateFaq(index: number, key: keyof SalesKitFaqItem, value: string) {
    setForm((current) => ({
      ...current,
      faq: current.faq.map((item, faqIndex) => (faqIndex === index ? { ...item, [key]: value } : item)),
    }));
  }

  function addEmail() {
    setForm((current) => ({
      ...current,
      launchEmails: [...current.launchEmails, createEmail(current.launchEmails.length)],
    }));
  }

  function removeEmail(index: number) {
    setForm((current) => ({
      ...current,
      launchEmails:
        current.launchEmails.length === 1
          ? [createEmail(0)]
          : current.launchEmails.filter((_, emailIndex) => emailIndex !== index),
    }));
  }

  function addFaq() {
    setForm((current) => ({
      ...current,
      faq: [...current.faq, createFaq(current.faq.length)],
    }));
  }

  function removeFaq(index: number) {
    setForm((current) => ({
      ...current,
      faq: current.faq.length === 1 ? [createFaq(0)] : current.faq.filter((_, faqIndex) => faqIndex !== index),
    }));
  }

  function handleSaveAndContinue() {
    const salesKit: SalesKit = {
      headline: form.headline.trim(),
      subheadline: form.subheadline.trim(),
      problemSection: form.problemSection.trim(),
      benefitBullets: splitLines(form.benefitBullets),
      launchEmails: form.launchEmails
        .map((email) => ({
          subject: email.subject.trim(),
          previewText: email.previewText.trim(),
          body: email.body.trim(),
        }))
        .filter((email) => email.subject || email.previewText || email.body),
      socialPosts: splitLines(form.socialPosts),
      faq: form.faq
        .map((item) => ({
          question: item.question.trim(),
          answer: item.answer.trim(),
        }))
        .filter((item) => item.question || item.answer),
      pricingRationale: form.pricingRationale.trim(),
      callToAction: form.callToAction.trim(),
    };

    setSalesKit(salesKit);
    setMessage('Sales kit saved to the active build session.');
    router.push('/app/launch');
  }

  const sourceBadges = [
    productDraft.category,
    `${productDraft.modules.length} module${productDraft.modules.length === 1 ? '' : 's'}`,
    `${productDraft.keyFeatures.length} feature${productDraft.keyFeatures.length === 1 ? '' : 's'}`,
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-[1500px] px-4 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
        <aside className="lg:sticky lg:top-8 lg:w-80">
          <Card className="overflow-hidden border-white/10 bg-white/[0.04] backdrop-blur-md">
            <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.01))] p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">
                  Source draft
                </Badge>
                <Badge variant="outline" className="border-white/10 bg-white/5 text-white/70">
                  {productDraft.recommendedPrice || 'Pricing pending'}
                </Badge>
              </div>
              <h1 className="text-2xl font-medium tracking-tight text-white">Copywriting cockpit</h1>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Keep the offer context pinned while you shape the headline, launch sequence, and objection handling.
              </p>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.28em] text-white/35">Product title</p>
                <h2 className="text-lg font-medium text-white">{productDraft.title}</h2>
                {productDraft.subtitle ? (
                  <p className="mt-2 text-sm leading-6 text-white/55">{productDraft.subtitle}</p>
                ) : null}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-md">
                <p className="mb-2 text-[11px] uppercase tracking-[0.28em] text-white/35">Core promise</p>
                <p className="text-sm leading-6 text-white/75">{productDraft.promise}</p>
              </div>

              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.28em] text-white/35">Format badges</p>
                <div className="flex flex-wrap gap-2">
                  {sourceBadges.map((badge) => (
                    <Badge
                      key={badge}
                      variant="outline"
                      className="border-white/10 bg-white/[0.03] px-3 py-1 text-white/70"
                    >
                      {badge}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                <SidebarMetric label="Buyer" value={productDraft.targetBuyer} icon={Target} />
                <SidebarMetric
                  label="Proof stack"
                  value={
                    productDraft.proofPoints[0] ||
                    productDraft.differentiator ||
                    'Add concrete proof in Create to strengthen this page.'
                  }
                  icon={Sparkles}
                />
              </div>
            </div>
          </Card>
        </aside>

        <main className="min-w-0">
          <div className="mb-6 flex flex-col gap-3 lg:mb-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">
                Sell stage
              </Badge>
              <Badge variant="outline" className="border-white/10 bg-white/5 text-white/70">
                Premium cinematic SaaS
              </Badge>
            </div>
            <div className="max-w-4xl">
              <h2 className="text-3xl font-medium tracking-tight text-white lg:text-[2.5rem]">
                Build the buyer-facing narrative in one focused canvas.
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/60 lg:text-base">
                Draft the hero, sharpen the promise, script the launch sequence, and stack answers to objections
                without losing the source offer context.
              </p>
            </div>
          </div>

          {message ? (
            <div className="mb-5">
              <WorkflowNotice tone="success">{message}</WorkflowNotice>
            </div>
          ) : null}

          <div className="space-y-6">
            <StudioCard
              title="Narrative spine"
              description="Lock the core message first. This becomes the frame every asset inherits."
              icon={Rocket}
            >
              <div className="grid gap-4 xl:grid-cols-2">
                <Field label="Headline">
                  <Input
                    value={form.headline}
                    onChange={(event) => handleChange('headline', event.target.value)}
                    className={cinematicInputClass}
                  />
                </Field>
                <Field label="Call to action">
                  <Input
                    value={form.callToAction}
                    onChange={(event) => handleChange('callToAction', event.target.value)}
                    className={cinematicInputClass}
                  />
                </Field>
              </div>

              <div className="mt-4 grid gap-4">
                <Field label="Subheadline">
                  <Textarea
                    value={form.subheadline}
                    onChange={(event) => handleChange('subheadline', event.target.value)}
                    className={`min-h-24 ${cinematicInputClass}`}
                  />
                </Field>
                <Field label="Problem section">
                  <Textarea
                    value={form.problemSection}
                    onChange={(event) => handleChange('problemSection', event.target.value)}
                    className={`min-h-32 ${cinematicInputClass}`}
                  />
                </Field>
              </div>
            </StudioCard>

            <StudioCard
              title="Offer architecture"
              description="Turn the draft into scannable landing-page structure and pricing logic."
              icon={Target}
            >
              <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <Field label="Benefit bullets">
                  <Textarea
                    value={form.benefitBullets}
                    onChange={(event) => handleChange('benefitBullets', event.target.value)}
                    placeholder="One buyer outcome per line"
                    className={`min-h-40 ${cinematicInputClass}`}
                  />
                </Field>
                <Field label="Pricing rationale">
                  <Textarea
                    value={form.pricingRationale}
                    onChange={(event) => handleChange('pricingRationale', event.target.value)}
                    className={`min-h-40 ${cinematicInputClass}`}
                  />
                </Field>
              </div>
            </StudioCard>

            <StudioCard
              title="Launch email sequence"
              description="Draft each email as its own artifact so subject line, preview, and body can evolve independently."
              icon={Mail}
              action={
                <Button onClick={addEmail} variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10">
                  <Plus className="h-4 w-4" />
                  Add item
                </Button>
              }
            >
              <div className="space-y-4">
                {form.launchEmails.map((email, index) => (
                  <div
                    key={`email-${index}`}
                    className="rounded-xl border border-white/5 bg-white/[0.02] p-4 backdrop-blur-md"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">Email {index + 1}</p>
                        <p className="text-xs uppercase tracking-[0.24em] text-white/35">Sequence asset</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeEmail(index)}
                        className="text-white/55 hover:bg-white/5 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove item
                      </Button>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-2">
                      <Field label="Subject">
                        <Input
                          value={email.subject}
                          onChange={(event) => updateEmail(index, 'subject', event.target.value)}
                          className={cinematicInputClass}
                        />
                      </Field>
                      <Field label="Preview">
                        <Input
                          value={email.previewText}
                          onChange={(event) => updateEmail(index, 'previewText', event.target.value)}
                          className={cinematicInputClass}
                        />
                      </Field>
                    </div>

                    <div className="mt-4">
                      <Field label="Body">
                        <Textarea
                          value={email.body}
                          onChange={(event) => updateEmail(index, 'body', event.target.value)}
                          className={`min-h-36 ${cinematicInputClass}`}
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </StudioCard>

            <StudioCard
              title="Social and FAQ"
              description="Package short-form distribution copy and objection handling in parallel."
              icon={Sparkles}
              action={
                <Button onClick={addFaq} variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10">
                  <Plus className="h-4 w-4" />
                  Add item
                </Button>
              }
            >
              <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <Field label="Social posts">
                  <Textarea
                    value={form.socialPosts}
                    onChange={(event) => handleChange('socialPosts', event.target.value)}
                    placeholder="One post per line"
                    className={`min-h-[28rem] ${cinematicInputClass}`}
                  />
                </Field>

                <div className="space-y-4">
                  {form.faq.map((item, index) => (
                    <div
                      key={`faq-${index}`}
                      className="rounded-xl border border-white/5 bg-white/[0.02] p-4 backdrop-blur-md"
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">FAQ {index + 1}</p>
                          <p className="text-xs uppercase tracking-[0.24em] text-white/35">Objection handling</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeFaq(index)}
                          className="text-white/55 hover:bg-white/5 hover:text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove item
                        </Button>
                      </div>

                      <div className="grid gap-4">
                        <Field label="Question">
                          <Input
                            value={item.question}
                            onChange={(event) => updateFaq(index, 'question', event.target.value)}
                            className={cinematicInputClass}
                          />
                        </Field>
                        <Field label="Answer">
                          <Textarea
                            value={item.answer}
                            onChange={(event) => updateFaq(index, 'answer', event.target.value)}
                            className={`min-h-28 ${cinematicInputClass}`}
                          />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </StudioCard>

            <div className="sticky bottom-0 z-10 rounded-2xl border border-white/10 bg-background/80 px-4 py-4 backdrop-blur-xl">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-white/55">
                  Save the structured sales kit and move into launch readiness.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link href="/app/create">
                    <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5 sm:w-auto">
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                  </Link>
                  <Button
                    onClick={handleSaveAndContinue}
                    className="w-full bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.3)] sm:w-auto"
                  >
                    Save and continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Target;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
      <div className="mb-2 flex items-center gap-2 text-white/35">
        <Icon className="h-4 w-4" />
        <p className="text-[11px] uppercase tracking-[0.28em]">{label}</p>
      </div>
      <p className="text-sm leading-6 text-white/72">{value}</p>
    </div>
  );
}

function StudioCard({
  title,
  description,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  description: string;
  icon: typeof Rocket;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="border-white/10 bg-white/[0.03] p-5 backdrop-blur-md lg:p-6">
      <div className="mb-5 flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-full border border-primary/20 bg-primary/10 p-2 text-primary">
              <Icon className="h-4 w-4" />
            </div>
            <h3 className="text-xl font-medium text-white">{title}</h3>
          </div>
          <p className="text-sm leading-6 text-white/55">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium uppercase tracking-[0.24em] text-white/40">{label}</label>
      {children}
    </div>
  );
}
