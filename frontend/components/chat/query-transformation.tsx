import { ArrowRight } from 'lucide-react';

interface QueryTransformationProps {
  original: string;
  rewritten?: string;
}

export function QueryTransformation({ original, rewritten }: QueryTransformationProps) {
  if (!rewritten || rewritten === original) return null;

  return (
    <div className="bg-card border border-border rounded-md p-2.5 mb-3">
      <div className="flex items-center gap-1.5 mb-2">
        <ArrowRight className="w-3 h-3 text-muted-foreground" />
        <span className="text-muted-foreground text-base uppercase tracking-wider">
          Query Rewritten
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <div>
          <div className="text-muted-foreground text-base mb-0.5">Original</div>
          <div className="text-muted-foreground text-base italic">&quot;{original}&quot;</div>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
        <div>
          <div className="text-muted-foreground text-base mb-0.5">Expanded</div>
          <div className="text-foreground text-base">&quot;{rewritten}&quot;</div>
        </div>
      </div>
    </div>
  );
}
