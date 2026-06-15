import Link from 'next/link';

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/10 px-6 py-10 relative z-10 bg-background">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-white">WIZUP</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/50">
          <Link
            href="/privacy"
            className="transition hover:text-white"
          >
            Privacy Policy
          </Link>

          <Link
            href="/terms"
            className="transition hover:text-white"
          >
            Terms of Service
          </Link>

          <Link
            href="/contact"
            className="transition hover:text-white"
          >
            Contact
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} WIZUP</p>
      </div>
    </footer>
  );
}
