import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CirclePlay,
  FileText,
  Gem,
  Layers3,
  LayoutTemplate,
  Mail,
  NotebookTabs,
  Package2,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  SwatchBook,
} from "lucide-react";

const workflowSteps = [
  {
    accent: "from-sky-400/20 via-sky-400/6 to-transparent",
    border: "border-sky-400/20",
    icon: Search,
    kicker: "01",
    title: "Find a proven opportunity.",
    copy:
      "WIZUP surfaces digital product ideas backed by real demand so you start with market pull, not guesswork.",
    tint: "text-sky-300",
  },
  {
    accent: "from-violet-400/20 via-violet-400/6 to-transparent",
    border: "border-violet-400/20",
    icon: NotebookTabs,
    kicker: "02",
    title: "Generate the product.",
    copy:
      "Create the guide, workbook, checklist, templates, and structure that make the offer feel complete and valuable.",
    tint: "text-violet-300",
  },
  {
    accent: "from-amber-300/20 via-amber-300/6 to-transparent",
    border: "border-amber-300/20",
    icon: Send,
    kicker: "03",
    title: "Prepare to sell.",
    copy:
      "Package the launch kit with visuals, emails, social posts, and a sales page so the product is ready to go live.",
    tint: "text-amber-200",
  },
];

const packageItems = [
  { icon: FileText, label: "eBook PDF", tone: "sky" },
  { icon: NotebookTabs, label: "Workbook", tone: "violet" },
  { icon: Check, label: "Checklist", tone: "emerald" },
  { icon: SwatchBook, label: "Templates", tone: "amber" },
  { icon: Sparkles, label: "Cover Design", tone: "violet" },
  { icon: Package2, label: "Product Mockups", tone: "sky" },
  { icon: LayoutTemplate, label: "Sales Page", tone: "amber" },
  { icon: Mail, label: "Email Sequence", tone: "emerald" },
  { icon: Gem, label: "Social Post Pack", tone: "violet" },
];

const productExamples = [
  {
    title: "The Elastic Budget Planner",
    audience: "People who overspend and want a calmer money system.",
    format: "eBook, workbook, checklist, templates",
    price: "$19-$49",
    accent: "from-sky-400/18 via-sky-400/5 to-transparent",
    border: "border-sky-400/20",
  },
  {
    title: "The 30-Day Meal Prep Reset",
    audience: "Busy families who want a simpler weekly plan.",
    format: "PDF guide, planner, recipe pack, shopping list",
    price: "$17-$39",
    accent: "from-amber-300/18 via-amber-300/5 to-transparent",
    border: "border-amber-300/20",
  },
  {
    title: "The Freelancer Client Starter Kit",
    audience: "New freelancers who need their first client system.",
    format: "Guide, outreach scripts, proposal templates",
    price: "$29-$79",
    accent: "from-violet-400/18 via-violet-400/5 to-transparent",
    border: "border-violet-400/20",
  },
];

const benefits = [
  "Demand-first product ideas",
  "Complete product packages",
  "Launch-ready assets",
  "Export-ready files",
  "Simple workflow",
];

const pricingTiers = [
  {
    name: "Starter",
    subtitle: "For creators building their first product.",
    price: "$0",
    detail: "Explore the workflow and shape your first offer.",
  },
  {
    name: "Pro",
    subtitle: "For creators launching multiple product kits.",
    price: "$29",
    detail: "Build full product packages and launch assets faster.",
    featured: true,
  },
  {
    name: "Studio",
    subtitle: "For teams building a product library.",
    price: "$99",
    detail: "Collaborate across a growing catalog of premium offers.",
  },
];

function toneClasses(tone: string) {
  if (tone === "sky") {
    return "bg-sky-400/10 text-sky-200 ring-1 ring-sky-300/15";
  }

  if (tone === "amber") {
    return "bg-amber-300/10 text-amber-100 ring-1 ring-amber-200/15";
  }

  if (tone === "emerald") {
    return "bg-emerald-400/10 text-emerald-100 ring-1 ring-emerald-300/15";
  }

  return "bg-violet-400/10 text-violet-100 ring-1 ring-violet-300/15";
}

export default function HomepageV5PreviewPage() {
  return (
    <div className="min-h-screen bg-[#080A12] text-[#F8FAFC]">
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.20),transparent_30%),radial-gradient(circle_at_78%_24%,rgba(56,189,248,0.14),transparent_24%),radial-gradient(circle_at_60%_70%,rgba(245,158,11,0.10),transparent_18%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-white/8" />

        <header className="sticky top-0 z-30 border-b border-white/8 bg-[#080A12]/78 backdrop-blur-xl">
          <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6">
            <Link
              href="/preview/home-v5"
              className="text-[1.9rem] font-semibold tracking-[-0.05em] text-white"
            >
              WIZUP
            </Link>

            <nav className="hidden items-center gap-9 text-sm font-medium text-[#CBD5E1] md:flex">
              <a href="#workflow" className="transition hover:text-white">
                How it works
              </a>
              <a href="#examples" className="transition hover:text-white">
                Examples
              </a>
              <a href="#pricing" className="transition hover:text-white">
                Pricing
              </a>
              <a href="#faq-lite" className="transition hover:text-white">
                FAQ
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden text-sm font-medium text-white/88 transition hover:text-white sm:inline-flex"
              >
                Log in
              </Link>
              <Link
                href="/onboarding"
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#8B5CF6] px-5 text-sm font-semibold text-white transition hover:bg-[#7C50EB]"
              >
                Start building
              </Link>
            </div>
          </div>
        </header>

        <main>
          <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-16 px-6 pb-20 pt-16 md:pb-28 md:pt-24">
            <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-[#CBD5E1]">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                Digital products, packaged for launch
              </div>

              <h1 className="max-w-5xl text-[3.7rem] font-[780] leading-[0.96] tracking-[-0.07em] text-white md:text-[5.8rem]">
                Discover what sells.
                <span className="mt-2 block text-white/62">Build what wins.</span>
              </h1>

              <p className="mt-8 max-w-3xl text-[1.14rem] leading-8 text-[#CBD5E1] md:text-[1.28rem]">
                WIZUP finds proven opportunities, generates the product, creates
                the assets, and prepares everything needed to launch a sellable
                digital product package.
              </p>

              <div className="mt-10 flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/onboarding"
                  className="inline-flex h-14 items-center justify-center rounded-[18px] bg-[#8B5CF6] px-7 text-base font-semibold text-white transition hover:bg-[#7C50EB]"
                >
                  Start building
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <button
                  type="button"
                  className="inline-flex h-14 items-center justify-center rounded-[18px] border border-white/10 bg-white/4 px-7 text-base font-semibold text-white transition hover:bg-white/7"
                >
                  <CirclePlay className="mr-2 h-4 w-4 text-white/72" />
                  Watch demo
                </button>
              </div>
            </div>

            <div className="relative mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[#0D111C]/92 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.45)] md:p-8">
                <div className="mb-6 flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.18em] text-[#8B95A7]">
                  <span className="rounded-full bg-sky-400/10 px-3 py-1 text-sky-200">
                    Opportunity found
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-white/25" />
                  <span className="rounded-full bg-violet-400/10 px-3 py-1 text-violet-100">
                    Product generated
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-white/25" />
                  <span className="rounded-full bg-amber-300/10 px-3 py-1 text-amber-100">
                    Launch kit ready
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-[24px] border border-white/8 bg-[#121827] p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-[#8B95A7]">
                          Product package
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                          Freelancer Client Starter Kit
                        </h2>
                      </div>
                      <div className="rounded-2xl bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-200">
                        Ready to sell
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      {packageItems.slice(0, 6).map((item) => {
                        const Icon = item.icon;

                        return (
                          <div
                            key={item.label}
                            className={`rounded-[18px] border border-white/8 p-4 ${toneClasses(
                              item.tone
                            )}`}
                          >
                            <Icon className="h-4 w-4" />
                            <p className="mt-8 text-sm font-medium text-white">
                              {item.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="rounded-[24px] border border-white/8 bg-[#121827] p-5">
                      <p className="text-xs uppercase tracking-[0.22em] text-[#8B95A7]">
                        Demand snapshot
                      </p>
                      <div className="mt-4 grid gap-3">
                        <div className="rounded-[18px] bg-sky-400/10 p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-sky-100/72">
                            Search demand
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-white">
                            High intent niche
                          </p>
                        </div>
                        <div className="rounded-[18px] bg-white/[0.03] p-4">
                          <p className="text-sm text-[#CBD5E1]">
                            Includes the core product, launch assets, visuals,
                            and export-ready materials in one workflow.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-white/8 bg-[#121827] p-5">
                      <p className="text-xs uppercase tracking-[0.22em] text-[#8B95A7]">
                        Launch outputs
                      </p>
                      <div className="mt-4 space-y-3">
                        {packageItems.slice(6).map((item) => {
                          const Icon = item.icon;

                          return (
                            <div
                              key={item.label}
                              className="flex items-center gap-3 rounded-[16px] bg-white/[0.03] px-4 py-3"
                            >
                              <div
                                className={`flex h-9 w-9 items-center justify-center rounded-2xl ${toneClasses(
                                  item.tone
                                )}`}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <span className="text-sm font-medium text-white/88">
                                {item.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-[30px] border border-white/10 bg-[#0D111C]/92 p-6">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#8B95A7]">
                    Outcome
                  </p>
                  <h3 className="mt-4 text-[1.9rem] font-semibold tracking-[-0.05em]">
                    Go from no product to a complete sellable package.
                  </h3>
                  <p className="mt-4 text-base leading-7 text-[#CBD5E1]">
                    Instead of assembling disconnected tools, WIZUP moves from
                    opportunity to product to launch kit in one commercial
                    system.
                  </p>
                </div>

                <div className="rounded-[30px] border border-white/10 bg-[#0D111C]/92 p-6">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#8B95A7]">
                    Included outputs
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {[
                      "Guide",
                      "Workbook",
                      "Checklist",
                      "Cover",
                      "Mockups",
                      "Sales page",
                      "Emails",
                      "Social pack",
                    ].map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-[#CBD5E1]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            id="workflow"
            className="mx-auto w-full max-w-7xl px-6 py-20 md:py-28"
          >
            <div className="max-w-3xl">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#8B95A7]">
                How it works
              </p>
              <h2 className="mt-5 text-[2.7rem] font-semibold leading-[1.02] tracking-[-0.06em] md:text-[3.7rem]">
                From opportunity to launch in one workflow.
              </h2>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {workflowSteps.map((step) => {
                const Icon = step.icon;

                return (
                  <article
                    key={step.kicker}
                    className={`relative overflow-hidden rounded-[28px] border bg-[#0D111C] p-7 ${step.border}`}
                  >
                    <div
                      className={`absolute inset-x-0 top-0 h-36 bg-gradient-to-b ${step.accent}`}
                    />
                    <div className="relative">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-[0.22em] text-[#8B95A7]">
                          {step.kicker}
                        </span>
                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                          <Icon className={`h-5 w-5 ${step.tint}`} />
                        </div>
                      </div>
                      <h3 className="mt-12 text-2xl font-semibold tracking-[-0.05em] text-white">
                        {step.title}
                      </h3>
                      <p className="mt-4 text-base leading-7 text-[#CBD5E1]">
                        {step.copy}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="mx-auto w-full max-w-7xl px-6 py-20 md:py-28">
            <div className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
              <div className="max-w-xl">
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#8B95A7]">
                  Product package
                </p>
                <h2 className="mt-5 text-[2.7rem] font-semibold leading-[1.02] tracking-[-0.06em] md:text-[3.7rem]">
                  Everything you need to sell, packaged together.
                </h2>
                <p className="mt-6 text-lg leading-8 text-[#CBD5E1]">
                  WIZUP does not just create a document. It creates a commercial
                  product package with the assets people expect before they buy.
                </p>
              </div>

              <div className="grid auto-rows-[minmax(9rem,1fr)] gap-4 md:grid-cols-3">
                {packageItems.map((item, index) => {
                  const Icon = item.icon;
                  const wide =
                    index === 0 || index === 4 || index === 7 ? "md:col-span-2" : "";

                  return (
                    <div
                      key={item.label}
                      className={`rounded-[24px] border border-white/8 bg-[#121827] p-5 ${wide}`}
                    >
                      <div
                        className={`inline-flex rounded-2xl p-3 ${toneClasses(item.tone)}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-10 text-xl font-semibold tracking-[-0.04em] text-white">
                        {item.label}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[#8B95A7]">
                        Premium output designed to make the offer feel tangible,
                        complete, and ready to launch.
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section
            id="examples"
            className="mx-auto w-full max-w-7xl px-6 py-20 md:py-28"
          >
            <div className="max-w-3xl">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#8B95A7]">
                Examples
              </p>
              <h2 className="mt-5 text-[2.7rem] font-semibold leading-[1.02] tracking-[-0.06em] md:text-[3.7rem]">
                Products WIZUP can help you create.
              </h2>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {productExamples.map((example) => (
                <article
                  key={example.title}
                  className={`relative overflow-hidden rounded-[28px] border bg-[#0D111C] p-7 ${example.border}`}
                >
                  <div
                    className={`absolute inset-x-0 top-0 h-40 bg-gradient-to-b ${example.accent}`}
                  />
                  <div className="relative">
                    <div className="inline-flex rounded-full border border-white/8 bg-white/[0.03] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[#CBD5E1]">
                      Example product
                    </div>
                    <h3 className="mt-12 text-[1.85rem] font-semibold leading-tight tracking-[-0.05em]">
                      {example.title}
                    </h3>
                    <dl className="mt-6 space-y-5">
                      <div>
                        <dt className="text-xs uppercase tracking-[0.18em] text-[#8B95A7]">
                          Audience
                        </dt>
                        <dd className="mt-2 text-base leading-7 text-[#CBD5E1]">
                          {example.audience}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-[0.18em] text-[#8B95A7]">
                          Format
                        </dt>
                        <dd className="mt-2 text-base leading-7 text-[#CBD5E1]">
                          {example.format}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-[0.18em] text-[#8B95A7]">
                          Price range
                        </dt>
                        <dd className="mt-2 text-lg font-semibold text-white">
                          {example.price}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="mx-auto w-full max-w-7xl px-6 py-20 md:py-28">
            <div className="grid gap-10 rounded-[32px] border border-white/8 bg-[#0D111C] p-8 md:p-12 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#8B95A7]">
                  Why WIZUP
                </p>
                <h2 className="mt-5 text-[2.7rem] font-semibold leading-[1.02] tracking-[-0.06em] md:text-[3.7rem]">
                  Built for people who want to launch, not research forever.
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {benefits.map((benefit, index) => (
                  <div
                    key={benefit}
                    className="rounded-[22px] border border-white/8 bg-white/[0.03] p-5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-200">
                        <Check className="h-4 w-4" />
                      </div>
                      <span className="text-lg font-medium tracking-[-0.03em] text-white">
                        {benefit}
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-[#8B95A7]">
                      {index === 0 &&
                        "Start with real commercial signals before you commit to the build."}
                      {index === 1 &&
                        "Create a full offer, not a half-finished draft that still needs manual assembly."}
                      {index === 2 &&
                        "Move straight into launch materials that support publishing and promotion."}
                      {index === 3 &&
                        "Keep assets structured for handoff, editing, and storefront use."}
                      {index === 4 &&
                        "Use one calm workflow instead of juggling disconnected tools and tabs."}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section
            id="pricing"
            className="mx-auto w-full max-w-7xl px-6 py-20 md:py-28"
          >
            <div className="max-w-3xl">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#8B95A7]">
                Pricing preview
              </p>
              <h2 className="mt-5 text-[2.7rem] font-semibold leading-[1.02] tracking-[-0.06em] md:text-[3.7rem]">
                Simple plans for building digital product kits.
              </h2>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {pricingTiers.map((tier) => (
                <article
                  key={tier.name}
                  className={`rounded-[28px] border p-7 ${
                    tier.featured
                      ? "border-violet-400/30 bg-[#121827] shadow-[0_24px_80px_rgba(139,92,246,0.14)]"
                      : "border-white/8 bg-[#0D111C]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-[1.9rem] font-semibold tracking-[-0.05em] text-white">
                        {tier.name}
                      </h3>
                      <p className="mt-3 text-base leading-7 text-[#CBD5E1]">
                        {tier.subtitle}
                      </p>
                    </div>
                    {tier.featured ? (
                      <span className="rounded-full bg-violet-400/12 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-violet-100">
                        Most popular
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-10">
                    <span className="text-[3.4rem] font-semibold tracking-[-0.07em]">
                      {tier.price}
                    </span>
                    <span className="ml-2 text-base text-[#8B95A7]">
                      {tier.price === "$0" ? "/month" : "/month"}
                    </span>
                  </div>

                  <p className="mt-5 text-sm leading-6 text-[#8B95A7]">
                    {tier.detail}
                  </p>

                  <Link
                    href="/pricing"
                    className={`mt-10 inline-flex h-12 w-full items-center justify-center rounded-[18px] text-sm font-semibold transition ${
                      tier.featured
                        ? "bg-[#8B5CF6] text-white hover:bg-[#7C50EB]"
                        : "border border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    View pricing
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <section
            id="faq-lite"
            className="mx-auto w-full max-w-7xl px-6 pb-20 pt-10 md:pb-28"
          >
            <div className="rounded-[32px] border border-white/8 bg-[#0D111C] p-8 md:p-12">
              <div className="max-w-2xl">
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#8B95A7]">
                  FAQ
                </p>
                <h2 className="mt-5 text-[2.7rem] font-semibold leading-[1.02] tracking-[-0.06em] md:text-[3.7rem]">
                  Your next digital product starts here.
                </h2>
                <p className="mt-6 text-lg leading-8 text-[#CBD5E1]">
                  Find the opportunity. Generate the product. Prepare the
                  launch.
                </p>
              </div>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/onboarding"
                  className="inline-flex h-14 items-center justify-center rounded-[18px] bg-[#8B5CF6] px-7 text-base font-semibold text-white transition hover:bg-[#7C50EB]"
                >
                  Start building
                </Link>
                <Link
                  href="/faq"
                  className="inline-flex h-14 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.03] px-7 text-base font-semibold text-white transition hover:bg-white/[0.06]"
                >
                  Read FAQ
                </Link>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-white/8">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-6 px-6 py-10 text-sm text-[#8B95A7] md:flex-row">
            <div className="font-medium tracking-[-0.04em] text-white">WIZUP</div>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <Link href="/privacy" className="transition hover:text-white">
                Privacy Policy
              </Link>
              <Link href="/terms" className="transition hover:text-white">
                Terms of Service
              </Link>
              <Link href="/contact" className="transition hover:text-white">
                Contact
              </Link>
            </div>
            <div>© 2026 WIZUP</div>
          </div>
        </footer>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-black/18 to-transparent" />
      </div>

      <div className="border-t border-white/8 bg-[#070911] px-6 py-4 text-center text-xs tracking-[0.12em] text-[#8B95A7]">
        Preview route only. Current live homepage remains unchanged at `/`.
      </div>
    </div>
  );
}
