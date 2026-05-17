interface PipelineStatsProps {
  documentCount: number;
  totalChunks: number;
  failures: number;
  avgProcessingTime: string;
}

export function PipelineStats({ documentCount, totalChunks, failures, avgProcessingTime }: PipelineStatsProps) {
  const stats = [
    { label: 'Documents processed', value: documentCount },
    { label: 'Total chunks indexed', value: totalChunks },
    { label: 'Pipeline failures', value: failures, highlight: failures > 0 },
    { label: 'Avg processing time', value: avgProcessingTime },
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-3.5">
      <div className="text-muted-foreground text-base uppercase tracking-wider mb-2.5">
        Ingestion Pipeline
      </div>
      <div className="flex flex-col gap-2">
        {stats.map(({ label, value, highlight }) => (
          <div key={label} className="flex justify-between">
            <span className="text-muted-foreground text-base">{label}</span>
            <span className={highlight ? 'text-red-400 text-base font-semibold' : 'text-foreground text-base font-semibold'}>
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
