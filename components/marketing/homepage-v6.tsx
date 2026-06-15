"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  CirclePlay,
  FileText,
  Gem,
  LayoutTemplate,
  Mail,
  Menu,
  NotebookTabs,
  Package2,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  SwatchBook,
  X,
} from "lucide-react";

type HomepageV6Props = {
  homeHref?: string;
  showPreviewFooter?: boolean;
};

const navItems = [
  { href: "#workflow", label: "How it works" },
  { href: "#examples", label: "Examples" },
  { href: "#pricing", label: "Pricing" },
  { href: "#final-cta", label: "FAQ" },
];

const orbitItems = [
  {
    label: "Opportunity Found",
    icon: Search,
    tone: "sky",
    mobileStyle: "left-3 top-4",
    desktopStyle: "md:left-[5%] md:top-[10%]",
  },
  {
    label: "eBook PDF",
    icon: FileText,
    tone: "violet",
    mobileStyle: "right-3 top-4",
    desktopStyle: "md:right-[7%] md:top-[11%]",
  },
  {
    label: "Workbook",
    icon: NotebookTabs,
    tone: "aqua",
    mobileStyle: "left-2 top-[34%]",
    desktopStyle: "md:left-[2%] md:top-[37%]",
  },
  {
    label: "Checklist",
    icon: Check,
    tone: "emerald",
    mobileStyle: "right-2 top-[34%]",
    desktopStyle: "md:right-[3%] md:top-[39%]",
  },
  {
    label: "Cover Design",
    icon: Sparkles,
    tone: "rose",
    mobileStyle: "left-5 bottom-[9%]",
    desktopStyle: "md:left-[18%] md:bottom-[8%]",
  },
  {
    label: "Product Mockups",
    icon: Package2,
    tone: "violet",
    mobileStyle: "right-5 bottom-[9%]",
    desktopStyle: "md:right-[18%] md:bottom-[8%]",
  },
];

const orbitOutputs = ["Sales Page", "Email Sequence", "Social Pack", "Store Page"];

const packageItems = [
  {
    label: "eBook PDF",
    copy: "Signature guide with the core idea and transformation.",
    icon: FileText,
    tone: "sky",
    span: "xl:col-span-3",
  },
  {
    label: "Workbook",
    copy: "Interactive pages that make the product useful on day one.",
    icon: NotebookTabs,
    tone: "violet",
    span: "xl:col-span-3",
  },
  {
    label: "Checklist",
    copy: "Quick-start assets for immediate traction.",
    icon: Check,
    tone: "emerald",
    span: "xl:col-span-2",
  },
  {
    label: "Templates",
    copy: "Done-for-you structure that saves production time.",
    icon: SwatchBook,
    tone: "gold",
    span: "xl:col-span-2",
  },
  {
    label: "Cover Design",
    copy: "Premium presentation that makes the product feel real.",
    icon: Sparkles,
    tone: "rose",
    span: "xl:col-span-2",
  },
  {
    label: "Product Mockups",
    copy: "Sellable product scenes for the sales page and launch assets.",
    icon: Package2,
    tone: "violet",
    span: "xl:col-span-3",
  },
  {
    label: "Sales Page",
    copy: "Commercial copy and layout foundations for conversion.",
    icon: LayoutTemplate,
    tone: "gold",
    span: "xl:col-span-3",
  },
  {
    label: "Email Sequence",
    copy: "Launch emails that move from interest to purchase.",
    icon: Mail,
    tone: "emerald",
    span: "xl:col-span-2",
  },
  {
    label: "Social Post Pack",
    copy: "Promotion-ready visuals and short-form launch assets.",
    icon: Gem,
    tone: "aqua",
    span: "xl:col-span-2",
  },
  {
    label: "Store Page",
    copy: "A polished storefront-ready destination to publish the offer.",
    icon: Store,
    tone: "sky",
    span: "xl:col-span-2",
  },
];

const transformations = [
  {
    kicker: "01",
    title: "Find a proven opportunity.",
    copy:
      "WIZUP surfaces digital product ideas backed by real demand so you begin with traction instead of hunches.",
    tone: "sky",
  },
  {
    kicker: "02",
    title: "Generate the product.",
    copy:
      "Create the guide, workbook, checklist, templates, and structure that turn a strong idea into a complete offer.",
    tone: "violet",
  },
  {
    kicker: "03",
    title: "Prepare to sell.",
    copy:
      "Package the sales page, emails, social posts, product visuals, and store page in one launch-ready system.",
    tone: "gold",
  },
];

const exampleBusinesses = [
  {
    name: "The Elastic Budget Planner",
    audience: "People who overspend and want a calmer money system.",
    format: "eBook, workbook, checklist, templates",
    price: "$19-$49",
    assets: "Cover, mockups, sales page, email launch kit",
    tone: "sky",
  },
  {
    name: "The 30-Day Meal Prep Reset",
    audience: "Busy families who want a simpler weekly plan.",
    format: "PDF guide, planner, recipe pack, shopping list",
    price: "$17-$39",
    assets: "Recipe visuals, emails, social pack, store page",
    tone: "gold",
  },
  {
    name: "The Freelancer Client Starter Kit",
    audience: "New freelancers who need their first client system.",
    format: "Guide, outreach scripts, proposal templates",
    price: "$29-$79",
    assets: "Mockups, landing assets, social pack, cover design",
    tone: "violet",
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
    copy: "Get into the workflow and shape your first commercial idea.",
  },
  {
    name: "Pro",
    subtitle: "For creators launching multiple product kits.",
    price: "$29",
    copy: "Build full product packages and launch assets with less friction.",
    featured: true,
  },
  {
    name: "Studio",
    subtitle: "For teams building a product library.",
    price: "$99",
    copy: "Coordinate a growing catalog of premium digital products.",
  },
];

function toneChip(tone: string) {
  if (tone === "sky") {
    return "border-sky-300/18 bg-sky-400/10 text-sky-100";
  }

  if (tone === "aqua") {
    return "border-cyan-300/18 bg-cyan-400/10 text-cyan-100";
  }

  if (tone === "emerald") {
    return "border-emerald-300/18 bg-emerald-400/10 text-emerald-100";
  }

  if (tone === "gold") {
    return "border-amber-200/18 bg-amber-300/10 text-amber-100";
  }

  if (tone === "rose") {
    return "border-pink-300/18 bg-pink-400/10 text-pink-100";
  }

  return "border-violet-300/18 bg-violet-400/10 text-violet-100";
}

function toneGlow(tone: string) {
  if (tone === "sky") {
    return "bg-[radial-gradient(circle,rgba(56,189,248,0.18),transparent_70%)]";
  }

  if (tone === "aqua") {
    return "bg-[radial-gradient(circle,rgba(34,211,238,0.16),transparent_70%)]";
  }

  if (tone === "emerald") {
    return "bg-[radial-gradient(circle,rgba(52,211,153,0.14),transparent_70%)]";
  }

  if (tone === "gold") {
    return "bg-[radial-gradient(circle,rgba(246,184,75,0.16),transparent_70%)]";
  }

  if (tone === "rose") {
    return "bg-[radial-gradient(circle,rgba(244,114,182,0.14),transparent_70%)]";
  }

  return "bg-[radial-gradient(circle,rgba(139,92,246,0.18),transparent_70%)]";
}

export function HomepageV6({
  homeHref = "/",
  showPreviewFooter = false,
}: HomepageV6Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#070812] text-[#F8FAFC]">
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(56,189,248,0.13),transparent_24%),radial-gradient(circle_at_76%_14%,rgba(139,92,246,0.18),transparent_26%),radial-gradient(circle_at_78%_62%,rgba(246,184,75,0.09),transparent_18%),radial-gradient(circle_at_25%_82%,rgba(34,211,238,0.08),transparent_18%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.22)_65%,rgba(0,0,0,0.35))]" />

        <header className="sticky top-0 z-30 border-b border-white/8 bg-[#070812]/80 backdrop-blur-xl">
          <div className="mx-auto flex min-h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
            <Link
              href={homeHref}
              className="text-[1.65rem] font-semibold tracking-[-0.05em] text-white sm:text-[1.9rem]"
              onClick={closeMenu}
            >
              WIZUP
            </Link>

            <nav className="hidden items-center gap-9 text-sm font-medium text-[#C6D0E1] md:flex">
              {navItems.map((item) => (
                <a key={item.label} href={item.href} className="transition hover:text-white">
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="hidden items-center gap-3 md:flex">
              <Link
                href="/login"
                className="text-sm font-medium text-white/88 transition hover:text-white"
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

            <div className="flex items-center gap-2 md:hidden">
              <Link
                href="/onboarding"
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-[#8B5CF6] px-4 text-sm font-semibold text-white transition hover:bg-[#7C50EB]"
              >
                Start
              </Link>
              <button
                type="button"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white transition hover:bg-white/[0.06]"
                onClick={() => setMobileMenuOpen((open) => !open)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div
            id="mobile-menu"
            className={`overflow-hidden border-t border-white/8 transition-all duration-300 md:hidden ${
              mobileMenuOpen ? "max-h-[24rem] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="space-y-2 px-4 py-4 sm:px-6">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex h-12 items-center rounded-2xl border border-white/8 bg-white/[0.03] px-4 text-base font-medium text-[#C6D0E1] transition hover:bg-white/[0.06] hover:text-white"
                  onClick={closeMenu}
                >
                  {item.label}
                </a>
              ))}
              <Link
                href="/login"
                className="flex h-12 items-center rounded-2xl border border-white/8 bg-white/[0.03] px-4 text-base font-medium text-[#C6D0E1] transition hover:bg-white/[0.06] hover:text-white"
                onClick={closeMenu}
              >
                Log in
              </Link>
            </div>
          </div>
        </header>

        <main>
          <section className="relative mx-auto w-full max-w-7xl px-4 pb-18 pt-12 sm:px-6 sm:pb-20 sm:pt-14 md:pb-32 md:pt-24">
            <div className="mx-auto max-w-4xl text-center">
              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-[#C6D0E1] sm:text-xs sm:tracking-[0.22em]">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
                <span className="truncate">Digital products, packaged for launch</span>
              </div>

              <h1 className="mx-auto mt-7 max-w-5xl text-[3.05rem] font-[800] leading-[0.96] tracking-[-0.075em] text-white min-[375px]:text-[3.35rem] min-[414px]:text-[3.65rem] sm:text-[4.15rem] md:text-[6rem]">
                Discover what sells.
                <span className="mt-2 block text-white/64">Build what wins.</span>
              </h1>

              <p className="mx-auto mt-7 max-w-[42rem] text-[1rem] leading-7 text-[#C6D0E1] min-[390px]:text-[1.04rem] sm:text-[1.12rem] sm:leading-8 md:text-[1.28rem]">
                WIZUP finds proven opportunities, generates the product, creates
                the assets, and prepares everything needed to launch a sellable
                digital product package.
              </p>

              <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
                <Link
                  href="/onboarding"
                  className="inline-flex h-14 items-center justify-center rounded-[18px] bg-[#8B5CF6] px-7 text-base font-semibold text-white transition hover:bg-[#7C50EB]"
                >
                  Start building
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <button
                  type="button"
                  className="inline-flex h-14 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.03] px-7 text-base font-semibold text-white transition hover:bg-white/[0.06]"
                >
                  <CirclePlay className="mr-2 h-4 w-4 text-white/72" />
                  Watch demo
                </button>
              </div>
            </div>

            <div className="relative mx-auto mt-14 flex min-h-[34rem] max-w-6xl items-center justify-center overflow-hidden rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(11,16,32,0.96),rgba(11,16,32,0.88))] px-3 py-6 shadow-[0_40px_120px_rgba(0,0,0,0.45)] sm:px-4 sm:py-8 md:min-h-[42rem] md:rounded-[36px]">
              <div className="absolute inset-0 opacity-70">
                <div className="absolute left-1/2 top-1/2 h-[88%] w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/8 md:h-[78%] md:w-[78%]" />
                <div className="absolute left-1/2 top-1/2 h-[66%] w-[66%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/7 md:h-[58%] md:w-[58%]" />
                <div className="absolute left-1/2 top-1/2 h-[42%] w-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/6 md:h-[36%] md:w-[36%]" />
              </div>

              <div className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.16),transparent_38%),radial-gradient(circle_at_30%_38%,rgba(56,189,248,0.16),transparent_24%),radial-gradient(circle_at_72%_72%,rgba(246,184,75,0.12),transparent_18%)] blur-2xl md:h-[44rem] md:w-[44rem]" />

              {orbitItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className={`absolute ${item.mobileStyle} ${item.desktopStyle}`}
                  >
                    <div className="relative">
                      <div
                        className={`absolute inset-0 scale-[1.25] blur-2xl md:scale-[1.35] ${toneGlow(
                          item.tone
                        )}`}
                      />
                      <div
                        className={`relative flex items-center gap-2 rounded-[18px] border bg-white/[0.035] px-3 py-3 backdrop-blur-xl min-[375px]:gap-3 min-[375px]:px-3.5 sm:min-w-[11rem] sm:px-4 sm:py-4 sm:rounded-[22px] ${toneChip(
                          item.tone
                        )}`}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-black/12 sm:h-10 sm:w-10">
                          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </div>
                        <span className="text-[0.72rem] font-medium text-white min-[375px]:text-xs sm:text-sm">
                          {item.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="relative z-10 mx-auto w-full max-w-[17rem] rounded-[26px] border border-white/10 bg-[#111827]/88 p-5 text-center backdrop-blur-xl min-[375px]:max-w-[18rem] min-[375px]:p-6 sm:max-w-[20rem] sm:rounded-[30px] sm:p-7 md:max-w-[25rem] md:rounded-[32px] md:p-9">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-violet-400/12 text-violet-100 sm:h-16 sm:w-16 sm:rounded-[22px]">
                  <Package2 className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <p className="mt-5 text-[0.65rem] uppercase tracking-[0.22em] text-[#7F8AA3] sm:mt-6 sm:text-xs sm:tracking-[0.24em]">
                  Product Orbit
                </p>
                <h2 className="mt-4 text-[1.85rem] font-semibold tracking-[-0.06em] text-white min-[375px]:text-[2rem] sm:text-[2.25rem] md:text-[2.8rem]">
                  Digital Product Kit
                </h2>
                <p className="mt-4 text-sm leading-6 text-[#C6D0E1] min-[375px]:text-[0.96rem] sm:mt-5 sm:text-base sm:leading-7">
                  WIZUP assembles the opportunity, product, launch assets, and
                  storefront pieces that make a digital product business feel real.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-2 text-left text-[0.78rem] text-[#C6D0E1] sm:mt-7 sm:gap-3 sm:text-sm">
                  {orbitOutputs.map((item) => (
                    <div
                      key={item}
                      className="rounded-[16px] border border-white/8 bg-white/[0.035] px-3 py-3 sm:rounded-[18px] sm:px-4"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section
            id="workflow"
            className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 md:py-28"
          >
            <div className="max-w-3xl">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#7F8AA3]">
                Transformation
              </p>
              <h2 className="mt-5 max-w-[12ch] text-[2.35rem] font-semibold leading-[1.02] tracking-[-0.065em] text-white min-[375px]:text-[2.6rem] sm:max-w-none sm:text-[3.2rem] md:text-[4rem]">
                From opportunity to launch in one workflow.
              </h2>
            </div>

            <div className="mt-12 space-y-5 sm:mt-14 sm:space-y-6">
              {transformations.map((step, index) => (
                <article
                  key={step.kicker}
                  className="relative grid gap-5 overflow-hidden rounded-[28px] border border-white/8 bg-[#0B1020]/88 p-5 sm:rounded-[30px] sm:p-6 md:grid-cols-[1fr_1.15fr] md:gap-6 md:rounded-[34px] md:p-8"
                >
                  {index < transformations.length - 1 ? (
                    <div className="pointer-events-none absolute bottom-[-1.8rem] left-1/2 h-8 w-px -translate-x-1/2 bg-gradient-to-b from-white/15 to-transparent md:hidden" />
                  ) : null}

                  <div className="flex flex-col justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[#7F8AA3]">
                        {step.kicker}
                      </p>
                      <h3 className="mt-7 text-[1.8rem] font-semibold leading-tight tracking-[-0.055em] text-white min-[375px]:text-[2rem] sm:text-[2.2rem] md:mt-8 md:text-[2.5rem]">
                        {step.title}
                      </h3>
                      <p className="mt-4 max-w-xl text-[0.98rem] leading-7 text-[#C6D0E1] sm:mt-5 sm:text-base sm:leading-8">
                        {step.copy}
                      </p>
                    </div>
                  </div>

                  <div className="relative min-h-[12.5rem] overflow-hidden rounded-[24px] border border-white/8 bg-[#111827] sm:min-h-[15rem] sm:rounded-[28px]">
                    <div
                      className={`absolute inset-0 ${
                        step.tone === "sky"
                          ? "bg-[radial-gradient(circle_at_30%_30%,rgba(56,189,248,0.18),transparent_30%),linear-gradient(135deg,rgba(56,189,248,0.08),transparent_55%)]"
                          : step.tone === "gold"
                            ? "bg-[radial-gradient(circle_at_72%_34%,rgba(246,184,75,0.18),transparent_30%),linear-gradient(135deg,rgba(246,184,75,0.08),transparent_55%)]"
                            : "bg-[radial-gradient(circle_at_55%_28%,rgba(139,92,246,0.20),transparent_30%),linear-gradient(135deg,rgba(139,92,246,0.10),transparent_55%)]"
                      }`}
                    />
                    <div className="relative flex h-full flex-col justify-between p-4 sm:p-6">
                      <div className="flex items-center justify-between text-[0.68rem] uppercase tracking-[0.18em] text-[#7F8AA3] sm:text-xs">
                        <span>{step.kicker}</span>
                        <span>Commercial workflow</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        {[0, 1, 2].map((column) => (
                          <div
                            key={`${step.kicker}-${column}`}
                            className="space-y-2 rounded-[18px] border border-white/8 bg-white/[0.03] p-3 sm:space-y-3 sm:rounded-[22px] sm:p-4"
                          >
                            <div className="h-2 w-10 rounded-full bg-white/12 sm:w-16" />
                            <div className="h-12 rounded-[14px] bg-white/[0.05] sm:h-16 sm:rounded-[18px]" />
                            <div className="h-2 w-12 rounded-full bg-white/10 sm:w-20" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 md:py-28">
            <div className="grid gap-10 md:gap-12 lg:grid-cols-[0.88fr_1.12fr]">
              <div className="max-w-xl">
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#7F8AA3]">
                  Product package
                </p>
                <h2 className="mt-5 text-[2.35rem] font-semibold leading-[1.02] tracking-[-0.065em] text-white min-[375px]:text-[2.6rem] sm:text-[3.2rem] md:text-[4rem]">
                  Everything you need to sell, packaged together.
                </h2>
                <p className="mt-5 text-[1rem] leading-7 text-[#C6D0E1] sm:mt-6 sm:text-lg sm:leading-8">
                  WIZUP does not just create a document. It creates a complete
                  commercial product package that feels tangible, premium, and
                  ready to launch.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 min-[390px]:grid-cols-2 xl:grid-cols-6">
                {packageItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className={`relative min-h-[13rem] overflow-hidden rounded-[24px] border border-white/8 bg-[#111827] p-5 sm:min-h-[14rem] sm:rounded-[26px] xl:min-h-[15rem] ${item.span}`}
                    >
                      <div
                        className={`absolute right-[-10%] top-[-10%] h-28 w-28 blur-2xl ${toneGlow(
                          item.tone
                        )}`}
                      />
                      <div
                        className={`relative inline-flex rounded-2xl border px-3 py-3 ${toneChip(
                          item.tone
                        )}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="relative mt-8 text-[1.45rem] font-semibold tracking-[-0.045em] text-white sm:mt-10 sm:text-xl">
                        {item.label}
                      </h3>
                      <p className="relative mt-3 text-sm leading-6 text-[#7F8AA3]">
                        {item.copy}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section
            id="examples"
            className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 md:py-28"
          >
            <div className="max-w-3xl">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#7F8AA3]">
                Example businesses
              </p>
              <h2 className="mt-5 max-w-[11ch] text-[2.35rem] font-semibold leading-[1.02] tracking-[-0.065em] text-white min-[375px]:text-[2.6rem] sm:max-w-none sm:text-[3.2rem] md:text-[4rem]">
                Products WIZUP can help you create.
              </h2>
            </div>

            <div className="mt-10 grid gap-5 sm:mt-12 sm:gap-6 lg:grid-cols-3">
              {exampleBusinesses.map((item) => (
                <article
                  key={item.name}
                  className="overflow-hidden rounded-[26px] border border-white/8 bg-[#0B1020]/88 sm:rounded-[30px]"
                >
                  <div
                    className={`h-28 sm:h-40 ${
                      item.tone === "sky"
                        ? "bg-[radial-gradient(circle_at_28%_34%,rgba(56,189,248,0.22),transparent_30%),linear-gradient(135deg,#111827,rgba(56,189,248,0.08))]"
                        : item.tone === "gold"
                          ? "bg-[radial-gradient(circle_at_72%_28%,rgba(246,184,75,0.20),transparent_30%),linear-gradient(135deg,#111827,rgba(246,184,75,0.08))]"
                          : "bg-[radial-gradient(circle_at_44%_32%,rgba(139,92,246,0.24),transparent_30%),linear-gradient(135deg,#111827,rgba(139,92,246,0.08))]"
                    }`}
                  />
                  <div className="p-5 sm:p-7">
                    <h3 className="max-w-[12ch] text-[1.75rem] font-semibold leading-tight tracking-[-0.055em] text-white sm:max-w-none sm:text-[1.9rem]">
                      {item.name}
                    </h3>
                    <dl className="mt-5 space-y-4 sm:mt-6 sm:space-y-5">
                      <div>
                        <dt className="text-xs uppercase tracking-[0.18em] text-[#7F8AA3]">
                          Audience
                        </dt>
                        <dd className="mt-2 text-[0.98rem] leading-7 text-[#C6D0E1] sm:text-base">
                          {item.audience}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-[0.18em] text-[#7F8AA3]">
                          Format
                        </dt>
                        <dd className="mt-2 text-[0.98rem] leading-7 text-[#C6D0E1] sm:text-base">
                          {item.format}
                        </dd>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <dt className="text-xs uppercase tracking-[0.18em] text-[#7F8AA3]">
                            Price Range
                          </dt>
                          <dd className="mt-2 text-lg font-semibold text-white">
                            {item.price}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-[0.18em] text-[#7F8AA3]">
                            Included Assets
                          </dt>
                          <dd className="mt-2 text-sm leading-6 text-[#C6D0E1]">
                            {item.assets}
                          </dd>
                        </div>
                      </div>
                    </dl>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 md:py-28">
            <div className="grid gap-8 rounded-[28px] border border-white/8 bg-[#0B1020]/90 p-6 sm:gap-10 sm:rounded-[34px] sm:p-8 md:p-12 lg:grid-cols-[0.92fr_1.08fr]">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#7F8AA3]">
                  Why WIZUP
                </p>
                <h2 className="mt-5 max-w-[10ch] text-[2.35rem] font-semibold leading-[1.02] tracking-[-0.065em] text-white min-[375px]:text-[2.6rem] sm:max-w-none sm:text-[3.2rem] md:text-[4rem]">
                  Built for people who want to launch, not research forever.
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {benefits.map((item, index) => (
                  <div
                    key={item}
                    className="rounded-[22px] border border-white/8 bg-white/[0.03] p-5 sm:rounded-[24px]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-100">
                        <Check className="h-4 w-4" />
                      </div>
                      <span className="text-lg font-medium tracking-[-0.04em] text-white">
                        {item}
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-[#7F8AA3]">
                      {index === 0 &&
                        "Start with commercial signals instead of building in the dark."}
                      {index === 1 &&
                        "Create a full offer, not a draft that still needs five more tools."}
                      {index === 2 &&
                        "Move into launch materials that support selling, not just writing."}
                      {index === 3 &&
                        "Keep every output structured for handoff, editing, and publishing."}
                      {index === 4 &&
                        "Use one calm system instead of a scattered stack of disconnected apps."}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section
            id="pricing"
            className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 md:py-28"
          >
            <div className="max-w-3xl">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#7F8AA3]">
                Pricing preview
              </p>
              <h2 className="mt-5 max-w-[12ch] text-[2.35rem] font-semibold leading-[1.02] tracking-[-0.065em] text-white min-[375px]:text-[2.6rem] sm:max-w-none sm:text-[3.2rem] md:text-[4rem]">
                Simple plans for building digital product kits.
              </h2>
            </div>

            <div className="mt-10 grid gap-5 sm:mt-12 sm:gap-6 lg:grid-cols-3">
              {pricingTiers.map((tier) => (
                <article
                  key={tier.name}
                  className={`rounded-[26px] border p-5 sm:rounded-[30px] sm:p-7 ${
                    tier.featured
                      ? "border-violet-400/24 bg-[#111827] shadow-[0_24px_100px_rgba(139,92,246,0.10)]"
                      : "border-white/8 bg-[#0B1020]/88"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-[1.7rem] font-semibold tracking-[-0.055em] text-white sm:text-[1.9rem]">
                        {tier.name}
                      </h3>
                      <p className="mt-3 text-[0.98rem] leading-7 text-[#C6D0E1] sm:text-base">
                        {tier.subtitle}
                      </p>
                    </div>
                    {tier.featured ? (
                      <span className="rounded-full bg-violet-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-violet-100">
                        Pro
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-8 sm:mt-10">
                    <span className="text-[3.1rem] font-semibold tracking-[-0.07em] text-white sm:text-[3.5rem]">
                      {tier.price}
                    </span>
                    <span className="ml-2 text-base text-[#7F8AA3]">/month</span>
                  </div>

                  <p className="mt-5 text-sm leading-6 text-[#7F8AA3]">{tier.copy}</p>

                  <Link
                    href="/pricing"
                    className={`mt-8 inline-flex h-12 w-full items-center justify-center rounded-[18px] text-sm font-semibold transition sm:mt-10 ${
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
            id="final-cta"
            className="mx-auto w-full max-w-7xl px-4 pb-20 pt-8 sm:px-6 sm:pb-24 sm:pt-10 md:pb-32"
          >
            <div className="rounded-[28px] border border-white/8 bg-[#0B1020]/92 p-6 sm:rounded-[32px] sm:p-8 md:rounded-[36px] md:p-12">
              <div className="max-w-3xl">
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#7F8AA3]">
                  Final CTA
                </p>
                <h2 className="mt-5 max-w-[11ch] text-[2.35rem] font-semibold leading-[1.02] tracking-[-0.065em] text-white min-[375px]:text-[2.6rem] sm:max-w-none sm:text-[3.2rem] md:text-[4rem]">
                  Your next digital product starts here.
                </h2>
                <p className="mt-5 text-[1rem] leading-7 text-[#C6D0E1] sm:mt-6 sm:text-lg sm:leading-8">
                  Find the opportunity. Generate the product. Prepare the launch.
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4">
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
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-5 px-4 py-8 text-sm text-[#7F8AA3] sm:px-6 md:flex-row md:py-10">
            <div className="font-medium tracking-[-0.04em] text-white">WIZUP</div>
            <div className="flex flex-wrap items-center justify-center gap-5 text-center sm:gap-6">
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

        {showPreviewFooter ? (
          <div className="border-t border-white/8 bg-[#06070F] px-6 py-4 text-center text-xs tracking-[0.12em] text-[#7F8AA3]">
            Preview route only. Compare V5 at /preview/home-v5 and V6 at /preview/home-v6.
          </div>
        ) : null}
      </div>
    </div>
  );
}
