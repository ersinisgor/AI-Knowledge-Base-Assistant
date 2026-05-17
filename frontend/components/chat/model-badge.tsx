import { Settings } from 'lucide-react';

interface ModelBadgeProps {
  model?: string;
  latencyMs?: number;
  tokensUsed?: number;
}

export function ModelBadge({ model, latencyMs, tokensUsed }: ModelBadgeProps) {
  if (!model && !latencyMs && !tokensUsed) return null;

  const parts: string[] = [];
  if (model) parts.push(model);
  if (latencyMs) parts.push(`${(latencyMs / 1000).toFixed(1)}s`);
  if (tokensUsed) parts.push(`${tokensUsed} tokens`);

  return (
    <span className="text-muted-foreground text-base inline-flex items-center gap-1">
      <Settings className="w-2.5 h-2.5" />
      {parts.join(' · ')}
    </span>
  );
}
