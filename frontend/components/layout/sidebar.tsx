'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, FileText, LayoutDashboard, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Chat', icon: MessageSquare },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-[220px] bg-sidebar border-r border-sidebar-border flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-sidebar-border flex items-center gap-2.5">
        <div className="w-[30px] h-[30px] bg-primary rounded-[7px] flex items-center justify-center">
          <Layers className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <span className="text-foreground font-semibold text-sm">KnowledgeBase</span>
      </div>

      {/* Navigation */}
      <div className="px-2.5 py-3 border-t border-sidebar-border">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 px-2 py-[7px] rounded-md text-[11px] transition-colors',
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
