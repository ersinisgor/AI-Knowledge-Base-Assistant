import { cn } from '@/lib/utils';
import type { IngestionStatus } from '@/lib/types';

const STAGES: IngestionStatus[] = ['uploaded', 'parsing', 'chunking', 'embedding', 'indexed'];

function getStageColor(stageIndex: number, status: IngestionStatus, isActive: boolean) {
  const currentIdx = STAGES.indexOf(status);
  if (status === 'failed') {
    return stageIndex === 0 ? 'bg-emerald-400' : stageIndex === 1 ? 'bg-red-400' : 'bg-muted';
  }
  if (stageIndex < currentIdx) return 'bg-emerald-400';
  if (stageIndex === currentIdx && isActive) return 'bg-amber-400 animate-pulse';
  if (stageIndex === currentIdx) return 'bg-emerald-400';
  return 'bg-muted';
}

interface IngestionProgressProps {
  status: IngestionStatus;
}

export function IngestionProgress({ status }: IngestionProgressProps) {
  const isActive = status === 'embedding' || status === 'parsing' || status === 'chunking';

  return (
    <div className="flex items-center gap-0.5">
      {STAGES.map((stage, i) => (
        <div
          key={stage}
          className={cn('w-4 h-[3px] rounded-sm', getStageColor(i, status, isActive))}
        />
      ))}
    </div>
  );
}
