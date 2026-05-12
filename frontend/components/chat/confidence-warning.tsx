import { AlertTriangle } from 'lucide-react';

interface ConfidenceWarningProps {
  confidence?: 'high' | 'medium' | 'low';
  sourcesCount?: number;
}

export function ConfidenceWarning({ confidence, sourcesCount = 0 }: ConfidenceWarningProps) {
  if (!confidence || confidence !== 'low') return null;

  return (
    <div className="bg-amber-500/8 border border-amber-500/20 rounded-md p-2 px-3 mb-2 flex items-start gap-2">
      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
      <div>
        <span className="text-amber-400 text-[11px] font-medium">
          Low confidence answer — partial context only
        </span>
        {sourcesCount < 3 && (
          <div className="text-muted-foreground text-[11px] mt-0.5">
            Only {sourcesCount} source{sourcesCount === 1 ? '' : 's'} found. Response may be incomplete.
          </div>
        )}
      </div>
    </div>
  );
}
