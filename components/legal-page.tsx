import { MarketingFooter } from '@/components/marketing-footer';
import { MarketingHeader } from '@/components/marketing-header';

type Section = {
  title: string;
  body: string[];
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  updated: string;
  intro: string;
  sections: Section[];
};

export function LegalPage({ eyebrow, title, updated, intro, sections }: LegalPageProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] h-[45%] w-[45%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <MarketingHeader />
      <main className="relative z-10 flex-1 px-6 py-20">
        <article className="mx-auto max-w-3xl">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-white/35">{eyebrow}</p>
          <h1 className="mb-5 text-4xl font-semibold tracking-tight text-white md:text-6xl">{title}</h1>
          <p className="mb-10 text-sm text-white/40">Last updated {updated}</p>
          <p className="mb-14 text-base leading-8 text-white/65 md:text-lg">{intro}</p>

          <div className="space-y-10">
            {sections.map((section) => (
              <section key={section.title} className="border-t border-white/10 pt-8">
                <h2 className="mb-4 text-xl font-medium text-white">{section.title}</h2>
                <div className="space-y-4 text-sm leading-7 text-white/58">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>
      </main>
      <MarketingFooter />
    </div>
  );
}
