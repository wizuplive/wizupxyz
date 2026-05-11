import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function MarketingHeader() {
  return (
    <header className="px-6 h-20 flex items-center justify-between border-b border-white/5 relative z-10 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <Link href="/" className="font-bold text-xl tracking-tight text-white">WIZUP</Link>
      </div>
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
        <Link href="/how-it-works" className="hover:text-white transition-colors">How it works</Link>
        <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
        <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
      </nav>
      <div className="flex items-center gap-4">
        <Link href="/auth/login">
          <Button variant="ghost" className="text-white hover:bg-white/10 hidden sm:flex">Log in</Button>
        </Link>
        <Link href="/auth/login">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
            Start building
          </Button>
        </Link>
      </div>
    </header>
  );
}
