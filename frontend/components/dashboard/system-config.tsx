export function SystemConfig() {
  const config = [
    { label: 'LLM', value: 'GPT-4.1-mini' },
    { label: 'Embedding', value: 'text-emb-3-small' },
    { label: 'Vector DB', value: 'pgvector' },
    { label: 'Strategy', value: 'Hybrid (BM25 + Vector)' },
  ];

  return (
    <div className="border-t border-border pt-2 mt-2">
      <div className="text-muted-foreground text-[9px] uppercase tracking-wider mb-1.5">System Config</div>
      {config.map(({ label, value }) => (
        <div key={label} className="flex justify-between mt-0.5">
          <span className="text-muted-foreground text-[10px]">{label}</span>
          <span className="text-foreground text-[10px] font-medium">{value}</span>
        </div>
      ))}
    </div>
  );
}
