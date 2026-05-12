'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Lightbulb,
  Layers,
  Hammer,
  Rocket,
  Store,
  Archive,
  Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut } from '@/app/actions/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navItems = [
  { href: '/app', label: 'Home', icon: LayoutDashboard },
  { href: '/app/ideas', label: 'Ideas', icon: Lightbulb },
  { href: '/app/examples', label: 'Examples', icon: Layers },
  { href: '/app/product', label: 'Product', icon: Hammer },
  { href: '/app/sales-kit', label: 'Sales Kit', icon: Rocket },
  { href: '/app/store', label: 'Store', icon: Store },
  { href: '/app/saved', label: 'Saved', icon: Archive },
  { href: '/app/ai-team', label: 'AI Team', icon: Bot },
];

const profileMenuItems = [
  { href: '/app/profile', label: 'Profile' },
  { href: '/app/billing', label: 'Billing' },
  { href: '/app/settings', label: 'Settings' },
  { href: '/app/help', label: 'Help' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, startSignOutTransition] = useTransition();
  const isNavItemActive = (href: string) => {
    if (href === '/app') {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };
  const handleSignOut = () => {
    startSignOutTransition(() => {
      void signOut();
    });
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-white/5 bg-background flex-col shrink-0 z-20 hidden lg:flex p-6">
        <div className="flex items-center gap-3 mb-12">
          <Link href="/app" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white rounded-sm rotate-45 transition-transform group-hover:rotate-90"></div>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">WIZUP<span className="text-primary">.</span></span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto space-y-1 flex flex-col gap-1 -mx-3">
          {navItems.map((item) => {
            const isActive = isNavItemActive(item.href);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-white/5 text-white" 
                    : "text-white/50 hover:text-white"
                )}
              >
                {isActive ? (
                  <div className="w-4 h-4 rounded-full border border-primary/50 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-primary rounded-full"></div></div>
                ) : (
                  <item.icon className="w-4 h-4" />
                )}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-white/5 -mx-6 px-6 relative">
           <div className="p-4 bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 rounded-xl mb-4">
             <p className="text-xs text-fuchsia-200 font-medium mb-2">Ready to build?</p>
             <p className="text-[10px] text-white/50 leading-relaxed mb-3">Find ideas people already want.</p>
             <Link href="/app/ideas">
               <button className="w-full py-2 bg-primary hover:bg-primary/90 text-white text-[11px] font-semibold rounded-lg shadow-lg shadow-primary/20 transition-all">Start Scan</button>
             </Link>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden pb-16 lg:pb-0">
        
        {/* Desktop Header */}
        <header className="h-16 border-b border-white/5 items-center justify-between px-8 shrink-0 hidden lg:flex">
          <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-full border border-white/5 w-80">
            <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <span className="text-sm text-white/30">Search for niches, problems...</span>
            <span className="ml-auto text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/50">⌘K</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              <div className="w-7 h-7 rounded-full bg-emerald-500 border-2 border-[#0A0A0B] flex items-center justify-center text-[10px] font-bold text-white">S</div>
              <div className="w-7 h-7 rounded-full bg-amber-500 border-2 border-[#0A0A0B] flex items-center justify-center text-[10px] font-bold text-white">A</div>
              <div className="w-7 h-7 rounded-full bg-primary border-2 border-[#0A0A0B] flex items-center justify-center text-[10px] font-bold text-white">C</div>
            </div>
            <div className="h-8 w-[1px] bg-white/5 mx-1"></div>
            
            <DropdownMenu>
              <DropdownMenuTrigger className="group flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-full hover:bg-white/5 data-open:bg-white/5 border border-transparent transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/20">
                <div className="text-right">
                  <p className="text-[13px] font-medium text-white/90 leading-none mb-1">Sarah Jenkins</p>
                  <p className="text-[11px] text-white/50 leading-none">Pro Creator</p>
                </div>
                <Avatar className="w-8 h-8 rounded-full border border-white/10 ml-1">
                  <AvatarFallback className="bg-gradient-to-tr from-gray-800 to-gray-600 text-[10px] text-white">SJ</AvatarFallback>
                </Avatar>
                <svg className="w-4 h-4 text-white/30 group-hover:text-white/50 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 bg-[#121214] text-white border-white/5 mt-1.5 shadow-2xl p-1 rounded-xl">
                <div className="flex flex-col gap-0.5">
                  {profileMenuItems.map((item) => (
                    <DropdownMenuItem key={item.href} onClick={() => router.push(item.href)} className="text-white/70 hover:text-white focus:text-white focus:bg-white/5 cursor-pointer rounded-lg text-[13px] py-1.5 px-2.5 outline-none transition-colors">
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </div>
                <DropdownMenuSeparator className="bg-white/5 mx-1 my-1" />
                <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut} className="text-white/70 hover:text-white focus:text-white focus:bg-white/5 cursor-pointer rounded-lg text-[13px] py-1.5 px-2.5 outline-none transition-colors">
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="h-14 border-b border-white/5 flex items-center justify-between px-4 shrink-0 lg:hidden bg-[#0A0A0B] relative z-30">
          <Link href="/app" className="flex items-center gap-2 group">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <div className="w-3.5 h-3.5 border-2 border-white rounded-sm rotate-45"></div>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none focus:ring-2 focus:ring-primary/50 rounded-full">
                <Avatar className="w-8 h-8 rounded-full border border-white/10">
                  <AvatarFallback className="bg-gradient-to-tr from-gray-800 to-gray-600 text-[10px] text-white">SJ</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 bg-[#121214] text-white border-white/5 mt-1.5 shadow-2xl p-1 rounded-xl">
                <div className="flex flex-col gap-0.5">
                  {profileMenuItems.map((item) => (
                    <DropdownMenuItem key={item.href} onClick={() => router.push(item.href)} className="text-white/70 hover:text-white focus:text-white focus:bg-white/5 cursor-pointer rounded-lg text-[13px] py-1.5 px-2.5 outline-none transition-colors">
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </div>
                <DropdownMenuSeparator className="bg-white/5 mx-1 my-1" />
                <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut} className="text-white/70 hover:text-white focus:text-white focus:bg-white/5 cursor-pointer rounded-lg text-[13px] py-1.5 px-2.5 outline-none transition-colors">
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden absolute bottom-0 left-0 right-0 h-16 bg-[#0A0A0B]/95 backdrop-blur-xl border-t border-white/5 flex items-center justify-around z-40 px-1 pb-safe">
          {navItems.filter(item => ['Home', 'Ideas', 'Product', 'Sales Kit', 'Store'].includes(item.label)).map((item) => {
            const isActive = isNavItemActive(item.href);
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center w-full h-full gap-1 p-1">
                <div className={cn("p-1 rounded-full transition-colors", isActive ? "bg-white/10" : "transparent")}>
                  <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-white/40")} />
                </div>
                <span className={cn("text-[9px] font-medium transition-colors", isActive ? "text-white" : "text-white/40")}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex-1 overflow-y-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
