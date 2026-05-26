import Link from 'next/link';

export function MarketingFooter() {
  const links = [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <footer className="border-t border-white/10 px-6 py-10 relative z-10 bg-background">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-white">WIZUP</span>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/45">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-white/80">
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} WIZUP</p>
      </div>
    </footer>
  );
}
