'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, FileText, LayoutDashboard, Layers, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSessions } from '@/hooks/use-sessions';

const navItems = [
  { href: '/', label: 'Chat', icon: MessageSquare },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sessions } = useSessions();

  return (
    <div className="w-[220px] bg-sidebar border-r border-sidebar-border flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-sidebar-border flex items-center gap-2.5">
        <div className="w-[30px] h-[30px] bg-primary rounded-[7px] flex items-center justify-center">
          <Layers className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <span className="text-foreground font-semibold text-base">KnowledgeBase</span>
      </div>

      {/* New Chat */}
      <div className="px-2.5 py-2.5">
        <Link
          href="/"
          className="bg-primary text-primary-foreground py-[7px] px-3 rounded-md text-base font-semibold block text-center hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
          New Chat
        </Link>
      </div>

      {/* Recent Sessions */}
      <div className="px-2.5 flex-1 overflow-y-auto">
        <div className="text-muted-foreground text-base uppercase tracking-wider mb-1.5 px-1">
          Recent
        </div>
        {sessions.slice(0, 8).map((session) => (
          <Link
            key={session.id}
            href={`/?session=${session.id}`}
            className="block px-2.5 py-[7px] text-muted-foreground text-base mb-0.5 rounded-md hover:bg-accent truncate transition-colors"
          >
            {session.title || 'Untitled session'}
          </Link>
        ))}
      </div>

      {/* Navigation */}
      <div className="px-2.5 py-1.5 border-t border-sidebar-border">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 px-2 py-[7px] rounded-md text-base transition-colors',
                active
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
