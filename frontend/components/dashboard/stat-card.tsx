import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  trend?: string;
  trendType?: 'up' | 'down' | 'neutral';
}

export function StatCard({ label, value, unit, trend, trendType = 'neutral' }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-3.5">
      <div className="text-muted-foreground text-base uppercase tracking-wider mb-1.5">{label}</div>
      <div className="text-foreground text-[22px] font-bold">
        {value}
        {unit && <span className="text-base text-muted-foreground font-normal ml-0.5">{unit}</span>}
      </div>
      {trend && (
        <div className={cn(
          'text-base mt-0.5',
          trendType === 'down' ? 'text-emerald-400' : trendType === 'up' ? 'text-red-400' : 'text-muted-foreground'
        )}>
          {trend}
        </div>
      )}
    </div>
  );
}
