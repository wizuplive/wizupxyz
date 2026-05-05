export function MarketingFooter() {
  return (
    <footer className="border-t border-white/10 py-12 px-6 relative z-10 bg-background">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-white">WIZUP</span>
        </div>
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} WIZUP Studio. All rights reserved.</p>
      </div>
    </footer>
  );
}
