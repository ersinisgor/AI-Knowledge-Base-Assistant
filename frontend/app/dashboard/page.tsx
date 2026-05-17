'use client';

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/dashboard/stat-card';
import { LatencyChart } from '@/components/dashboard/latency-chart';
import { PipelineStats } from '@/components/dashboard/pipeline-stats';
import { SystemConfig } from '@/components/dashboard/system-config';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import type { Document, ChatSession } from '@/lib/types';
import { api } from '@/lib/api';

export default function DashboardPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    Promise.all([api.documents.list(), api.chat.getSessions()]).then(
      ([docs, sess]) => {
        setDocuments(Array.isArray(docs) ? docs : []);
        setSessions(Array.isArray(sess) ? sess : []);
      }
    ).catch(() => {});
  }, []);

  const indexedDocs = documents.filter((d) => d.status === 'indexed');
  const totalChunks = indexedDocs.reduce((sum, d) => sum + (d.chunk_count || 0), 0);
  const failedDocs = documents.filter((d) => d.status === 'failed').length;

  const activityItems = [
    ...documents.slice(0, 3).map((d) => ({
      type: (d.status === 'failed' ? 'error' : 'document') as 'document' | 'error',
      message: `${d.metadata?.fileName || 'Document'} ${d.status === 'failed' ? 'failed ingestion' : `indexed (${d.chunk_count} chunks)`}`,
      time: new Date(d.created_at).toLocaleDateString(),
    })),
    ...sessions.slice(0, 3).map((s) => ({
      type: 'chat' as const,
      message: `Chat: ${s.title || 'Untitled'}`,
      time: new Date(s.updated_at).toLocaleDateString(),
    })),
  ].slice(0, 6);

  return (
    <div className="h-full overflow-y-auto p-5">
      <h1 className="text-foreground font-semibold text-lg mb-4">Dashboard</h1>

      <div className="grid grid-cols-4 gap-2.5 mb-3.5">
        <StatCard
          label="Documents"
          value={String(documents.length)}
          trend={`+${indexedDocs.length} indexed`}
          trendType="down"
        />
        <StatCard
          label="Chat Sessions"
          value={String(sessions.length)}
          trend={`+${sessions.length} total`}
          trendType="neutral"
        />
        <StatCard
          label="Total Chunks"
          value={String(totalChunks)}
          trend="Across all docs"
          trendType="neutral"
        />
        <StatCard
          label="Avg Confidence"
          value="87"
          unit="%"
          trend="Last 7 days"
          trendType="neutral"
        />
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-2.5 mb-3.5">
        <LatencyChart />
        <div className="flex flex-col gap-2.5">
          <PipelineStats
            documentCount={documents.length}
            totalChunks={totalChunks}
            failures={failedDocs}
            avgProcessingTime="2.3s"
          />
          <div className="bg-card border border-border rounded-lg p-3.5">
            <SystemConfig />
          </div>
        </div>
      </div>

      <ActivityFeed items={activityItems} />
    </div>
  );
}
