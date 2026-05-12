interface ActivityItem {
  type: 'document' | 'chat' | 'error';
  message: string;
  time: string;
}

interface ActivityFeedProps {
  items: ActivityItem[];
}

const dotColors: Record<string, string> = {
  document: 'bg-emerald-400',
  chat: 'bg-primary',
  error: 'bg-red-400',
};

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-3.5">
      <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-2.5">Activity Feed</div>
      <div className="flex flex-col gap-2.5">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-[11px]">No recent activity</p>
        ) : (
          items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[item.type]}`} />
              <span className="text-foreground text-[11px] flex-1">{item.message}</span>
              <span className="text-muted-foreground text-[10px]">{item.time}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
