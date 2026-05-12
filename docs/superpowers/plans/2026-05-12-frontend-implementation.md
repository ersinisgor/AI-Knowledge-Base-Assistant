# Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the project into backend/frontend monorepo and build a production-grade Next.js frontend with enterprise AI operations UI.

**Architecture:** Existing NestJS backend moves into `backend/`. New Next.js 15 App Router frontend in `frontend/` with shadcn/ui dark theme. API routes proxy all requests to the backend. Three pages: Chat (streaming with sources panel), Documents (ingestion lifecycle), Dashboard (AI metrics).

**Tech Stack:** Next.js 15, shadcn/ui, Tailwind CSS v4, Lucide React, Recharts, TypeScript strict mode

---

## Task 1: Create Branch and Restructure Project

**Files:**
- Move: all project files → `backend/`
- Modify: `.gitignore`
- Modify: `README.md`

- [ ] **Step 1: Create feature branch**

```bash
git checkout -b feature/frontend
```

- [ ] **Step 2: Create backend directory and move files**

Move all backend-related files into `backend/`. Keep `.gitignore`, `README.md`, and `docs/` at the root.

```bash
mkdir -p backend
git mv src backend/
git mv test backend/
git mv nest-cli.json backend/
git mv tsconfig.json backend/
git mv tsconfig.build.json backend/
git mv package.json backend/
git mv package-lock.json backend/
git mv .env backend/
```

Do NOT move: `.gitignore`, `README.md`, `docs/`, `.DS_Store`, `node_modules/`, `dist/`.

- [ ] **Step 3: Verify backend still works**

```bash
cd backend && npm run build
```

Expected: Build succeeds. If there are path issues in `nest-cli.json`, the `src` root is relative to the `nest-cli.json` location so it should work as-is.

- [ ] **Step 4: Update .gitignore for monorepo**

Update root `.gitignore`:

```gitignore
node_modules/
dist/
.claude

# Supabase
.branches
.temp
supabase/.temp/
.mcp.json

# dotenvx
.env
.env.keys
.env.local
.env.*.local

.DS_Store

# Visual companion
.superpowers/

# Backend
backend/node_modules/
backend/dist/

# Frontend
frontend/node_modules/
frontend/.next/
frontend/out/
frontend/.env.local
```

- [ ] **Step 5: Commit restructuring**

```bash
git add -A
git commit -m "refactor: restructure project into backend/ directory

Move NestJS backend code into backend/ folder to prepare for
frontend/ monorepo structure. No code changes, only file moves."
```

---

## Task 2: Backend Enhancements — Update Chat Response DTO

**Files:**
- Modify: `backend/src/modules/chat/dto/chat-response.dto.ts`
- Modify: `backend/src/modules/rag/dto/rag-response.dto.ts`

- [ ] **Step 1: Update rag-response.dto.ts to add new fields**

Read the current file, then replace its contents:

```typescript
// backend/src/modules/rag/dto/rag-response.dto.ts

export interface SourceCitation {
  document_name: string;
  source_type: string;
  similarity: number;
  chunk_index: number;
  chunk_content?: string;
}

export interface RetrievalMetadata {
  strategy: string;
  latency_ms: number;
  sources_found: number;
  confidence: 'high' | 'medium' | 'low';
  rewritten_query?: string;
}

export interface RagResponseDto {
  answer: string;
  sources: SourceCitation[];
  session_id: string;
  tokens_used: number;
  retrieval_confidence: 'high' | 'medium' | 'low';
  retrieval_metadata?: RetrievalMetadata;
  model?: string;
  latency_ms?: number;
}
```

- [ ] **Step 2: Update chat-response.dto.ts**

```typescript
// backend/src/modules/chat/dto/chat-response.dto.ts

import { SourceCitation, RetrievalMetadata } from '../../rag/dto/rag-response.dto';

export class ChatResponseDto {
  answer: string;
  sources: SourceCitation[];
  session_id: string;
  tokens_used: number;
  retrieval_confidence: 'high' | 'medium' | 'low';
  retrieval_metadata?: RetrievalMetadata;
  model?: string;
  latency_ms?: number;
}
```

- [ ] **Step 3: Update rag-pipeline.service.ts to populate new fields**

In `backend/src/modules/rag/rag-pipeline.service.ts`, find the method that constructs the response. Add timing and model tracking:

At the top of the `execute` method (or equivalent entry point), add:
```typescript
const startTime = Date.now();
```

At the point where the response object is constructed, add the new fields:
```typescript
retrieval_metadata: {
  strategy: 'Hybrid (BM25 + Vector)',
  latency_ms: Date.now() - startTime,
  sources_found: validatedRetrieval.sources.length,
  confidence: validatedRetrieval.confidence,
  rewritten_query: rewrittenQuery,
},
model: 'GPT-4.1-mini',
latency_ms: Date.now() - startTime,
```

- [ ] **Step 4: Update SourceCitation to include chunk_content**

In `backend/src/modules/rag/citation.service.ts` (or wherever sources are formatted), ensure each `SourceCitation` includes a `chunk_content` field with the actual text snippet.

- [ ] **Step 5: Build and verify**

```bash
cd backend && npm run build
```

Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add backend/src/modules/rag/dto/rag-response.dto.ts backend/src/modules/chat/dto/chat-response.dto.ts backend/src/modules/rag/rag-pipeline.service.ts
git commit -m "feat(rag): add retrieval metadata, model info, and latency to response DTO"
```

---

## Task 3: Backend Enhancement — Add Sessions Endpoint

**Files:**
- Modify: `backend/src/modules/chat/chat.controller.ts`
- Modify: `backend/src/modules/chat/chat.service.ts`

- [ ] **Step 1: Add sessions method to ChatService**

In `backend/src/modules/chat/chat.service.ts`, add a new method:

```typescript
async getSessions() {
  const { data, error } = await this.supabase.getClient()
    .from('chat_sessions')
    .select('id, title, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(`Failed to fetch sessions: ${error.message}`);
  }
  return data;
}
```

- [ ] **Step 2: Add sessions endpoint to ChatController**

In `backend/src/modules/chat/chat.controller.ts`, add:

```typescript
@Get('sessions')
async getSessions() {
  return this.chatService.getSessions();
}
```

Also add the `@Get` import from `@nestjs/common` if not already present.

- [ ] **Step 3: Build and verify**

```bash
cd backend && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/chat/chat.controller.ts backend/src/modules/chat/chat.service.ts
git commit -m "feat(chat): add GET /chat/sessions endpoint for session listing"
```

---

## Task 4: Backend Enhancement — Add Document Status Field

**Files:**
- Modify: `backend/src/modules/documents/dto/document-response.dto.ts`
- Modify: `backend/src/modules/documents/documents.service.ts`

- [ ] **Step 1: Update DocumentResponseDto**

```typescript
// backend/src/modules/documents/dto/document-response.dto.ts

export class DocumentResponseDto {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  source_type: string;
  created_at: string;
  chunk_count?: number;
  status: 'uploaded' | 'parsing' | 'chunking' | 'embedding' | 'indexed' | 'failed';
}
```

- [ ] **Step 2: Update DocumentsService to include status and chunk_count**

In the `findAll` method, also fetch chunk counts from the `document_chunks` table. For the status field, if a document has chunks, set status to `'indexed'`, otherwise `'uploaded'`:

```typescript
async findAll() {
  const { data: documents, error: docError } = await this.supabase.getClient()
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (docError) {
    throw new Error(`Failed to fetch documents: ${docError.message}`);
  }

  const documentsWithStats = await Promise.all(
    (documents || []).map(async (doc) => {
      const { count } = await this.supabase.getClient()
        .from('document_chunks')
        .select('*', { count: 'exact', head: true })
        .eq('document_id', doc.id);

      return {
        ...doc,
        chunk_count: count || 0,
        status: count > 0 ? 'indexed' as const : 'uploaded' as const,
      };
    })
  );

  return documentsWithStats;
}
```

- [ ] **Step 3: Build and verify**

```bash
cd backend && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/documents/
git commit -m "feat(documents): add status and chunk_count fields to document response"
```

---

## Task 5: Scaffold Next.js Frontend

**Files:**
- Create: `frontend/` (entire directory via create-next-app)

- [ ] **Step 1: Create Next.js app**

From the project root:

```bash
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```

Accept defaults. This creates `frontend/` with App Router, TypeScript, Tailwind.

- [ ] **Step 2: Clean up default files**

Delete the default Next.js boilerplate that we don't need:

```bash
rm frontend/app/page.module.css 2>/dev/null || true
rm -rf frontend/public 2>/dev/null || true
mkdir -p frontend/public
```

- [ ] **Step 3: Verify dev server starts**

```bash
cd frontend && npm run dev
```

Expected: Server starts on port 3000 (we'll change this later). Open http://localhost:3000 — should see default Next.js page. Stop the server.

- [ ] **Step 4: Change default port to 3001**

Create `frontend/.env.local`:

```
PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001/api
BACKEND_URL=http://localhost:3000
```

- [ ] **Step 5: Update next.config.ts**

```typescript
// frontend/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [],
};

export default nextConfig;
```

- [ ] **Step 6: Commit**

```bash
git add frontend/
git commit -m "chore: scaffold Next.js 15 frontend with TypeScript and Tailwind"
```

---

## Task 6: Install Dependencies and Initialize shadcn/ui

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/components.json`
- Create: `frontend/lib/utils.ts`

- [ ] **Step 1: Install additional dependencies**

```bash
cd frontend
npm install lucide-react recharts
```

- [ ] **Step 2: Initialize shadcn/ui**

```bash
cd frontend
npx shadcn@latest init
```

When prompted:
- Style: New York
- Base color: Slate
- CSS variables: yes

This creates `components.json` and `lib/utils.ts`.

- [ ] **Step 3: Install required shadcn components**

```bash
cd frontend
npx shadcn@latest add button input card badge sheet separator scroll-area skeleton textarea
```

- [ ] **Step 4: Configure dark theme as default**

In `frontend/app/globals.css`, replace the content with the dark theme configuration using the design tokens from the spec. The shadcn init should have set up CSS variables. Update the `:root` and `.dark` selectors to force dark mode:

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

:root {
  --radius: 0.625rem;
  --background: oklch(0.13 0.028 261);
  --foreground: oklch(0.96 0.01 261);
  --card: oklch(0.17 0.028 261);
  --card-foreground: oklch(0.96 0.01 261);
  --popover: oklch(0.17 0.028 261);
  --popover-foreground: oklch(0.96 0.01 261);
  --primary: oklch(0.78 0.14 195);
  --primary-foreground: oklch(0.13 0.028 261);
  --secondary: oklch(0.22 0.03 261);
  --secondary-foreground: oklch(0.96 0.01 261);
  --muted: oklch(0.22 0.03 261);
  --muted-foreground: oklch(0.65 0.02 261);
  --accent: oklch(0.22 0.03 261);
  --accent-foreground: oklch(0.96 0.01 261);
  --destructive: oklch(0.55 0.2 27);
  --border: oklch(0.30 0.03 261);
  --input: oklch(0.30 0.03 261);
  --ring: oklch(0.78 0.14 195);
  --chart-1: oklch(0.78 0.14 195);
  --chart-2: oklch(0.65 0.15 160);
  --chart-3: oklch(0.70 0.15 50);
  --chart-4: oklch(0.75 0.15 27);
  --chart-5: oklch(0.70 0.15 300);
  --sidebar: oklch(0.17 0.028 261);
  --sidebar-foreground: oklch(0.96 0.01 261);
  --sidebar-primary: oklch(0.78 0.14 195);
  --sidebar-primary-foreground: oklch(0.13 0.028 261);
  --sidebar-accent: oklch(0.22 0.03 261);
  --sidebar-accent-foreground: oklch(0.96 0.01 261);
  --sidebar-border: oklch(0.30 0.03 261);
  --sidebar-ring: oklch(0.78 0.14 195);
}

body {
  background: var(--background);
  color: var(--foreground);
}
```

- [ ] **Step 5: Verify dark theme renders**

```bash
cd frontend && npm run dev
```

Open http://localhost:3001 — should see dark background with light text. Stop server.

- [ ] **Step 6: Commit**

```bash
git add frontend/
git commit -m "chore: add shadcn/ui, lucide-react, recharts with dark theme config"
```

---

## Task 7: Create Shared Types and API Client

**Files:**
- Create: `frontend/lib/types.ts`
- Create: `frontend/lib/api.ts`

- [ ] **Step 1: Create types file**

```typescript
// frontend/lib/types.ts

export interface SourceCitation {
  document_name: string;
  source_type: string;
  similarity: number;
  chunk_index: number;
  chunk_content?: string;
}

export interface RetrievalMetadata {
  strategy: string;
  latency_ms: number;
  sources_found: number;
  confidence: 'high' | 'medium' | 'low';
  rewritten_query?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: SourceCitation[];
  retrieval_metadata?: RetrievalMetadata;
  model?: string;
  latency_ms?: number;
  tokens_used?: number;
  retrieval_confidence?: 'high' | 'medium' | 'low';
}

export interface ChatResponse {
  answer: string;
  sources: SourceCitation[];
  session_id: string;
  tokens_used: number;
  retrieval_confidence: 'high' | 'medium' | 'low';
  retrieval_metadata?: RetrievalMetadata;
  model?: string;
  latency_ms?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  source_type: string;
  created_at: string;
  chunk_count?: number;
  status: 'uploaded' | 'parsing' | 'chunking' | 'embedding' | 'indexed' | 'failed';
}

export interface IngestResponse {
  success: boolean;
  document_id: string;
  chunk_count: number;
  message: string;
}

export type IngestionStatus = 'uploaded' | 'parsing' | 'chunking' | 'embedding' | 'indexed' | 'failed';
```

- [ ] **Step 2: Create API client**

```typescript
// frontend/lib/api.ts

import type {
  ChatResponse,
  Document,
  IngestResponse,
  ChatSession,
} from './types';

const API_BASE = '/api';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  chat: {
    send(message: string, sessionId?: string): Promise<ChatResponse> {
      return fetchAPI('/chat', {
        method: 'POST',
        body: JSON.stringify({ message, session_id: sessionId }),
      });
    },
    getSessions(): Promise<ChatSession[]> {
      return fetchAPI('/sessions');
    },
  },

  documents: {
    list(): Promise<Document[]> {
      return fetchAPI('/documents');
    },
    create(data: { content: string; source_type: string; metadata?: Record<string, unknown> }): Promise<Document> {
      return fetchAPI('/documents', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  ingestion: {
    process(data: { content: string; source_type: string; fileName?: string; metadata?: Record<string, unknown> }): Promise<IngestResponse> {
      return fetchAPI('/ingestion', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },
};
```

- [ ] **Step 3: Commit**

```bash
git add frontend/lib/types.ts frontend/lib/api.ts
git commit -m "feat: add shared TypeScript types and API client for backend proxy"
```

---

## Task 8: Create API Proxy Routes

**Files:**
- Create: `frontend/app/api/chat/route.ts`
- Create: `frontend/app/api/documents/route.ts`
- Create: `frontend/app/api/ingestion/route.ts`
- Create: `frontend/app/api/sessions/route.ts`

- [ ] **Step 1: Create chat proxy route**

```typescript
// frontend/app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const res = await fetch(`${BACKEND_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return NextResponse.json(
      { message: 'Backend request failed' },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
```

- [ ] **Step 2: Create documents proxy route**

```typescript
// frontend/app/api/documents/route.ts

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

export async function GET() {
  const res = await fetch(`${BACKEND_URL}/documents`);
  const data = await res.json();
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const res = await fetch(`${BACKEND_URL}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data);
}
```

- [ ] **Step 3: Create ingestion proxy route**

```typescript
// frontend/app/api/ingestion/route.ts

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const res = await fetch(`${BACKEND_URL}/ingestion/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data);
}
```

- [ ] **Step 4: Create sessions proxy route**

```typescript
// frontend/app/api/sessions/route.ts

import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

export async function GET() {
  const res = await fetch(`${BACKEND_URL}/chat/sessions`);
  const data = await res.json();
  return NextResponse.json(data);
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/app/api/
git commit -m "feat: add API proxy routes for chat, documents, ingestion, sessions"
```

---

## Task 9: Create Layout with Sidebar Navigation

**Files:**
- Create: `frontend/components/layout/sidebar.tsx`
- Modify: `frontend/app/layout.tsx`
- Modify: `frontend/app/page.tsx`

- [ ] **Step 1: Create sidebar component**

```tsx
// frontend/components/layout/sidebar.tsx

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
```

- [ ] **Step 2: Update root layout**

```tsx
// frontend/app/layout.tsx

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Sidebar } from '@/components/layout/sidebar';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'KnowledgeBase — AI Knowledge Assistant',
  description: 'Enterprise AI operations and knowledge intelligence platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex h-screen overflow-hidden`}>
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Create placeholder page.tsx**

```tsx
// frontend/app/page.tsx

export default function ChatPage() {
  return (
    <div className="h-full flex items-center justify-center">
      <p className="text-muted-foreground">Chat interface loading...</p>
    </div>
  );
}
```

- [ ] **Step 4: Verify sidebar renders**

```bash
cd frontend && npm run dev
```

Open http://localhost:3001 — should see dark sidebar with logo and three nav links. Clicking Documents/Dashboard will 404 (expected). Stop server.

- [ ] **Step 5: Commit**

```bash
git add frontend/components/layout/ frontend/app/layout.tsx frontend/app/page.tsx
git commit -m "feat: add root layout with sidebar navigation and dark theme"
```

---

## Task 10: Create Chat Hooks

**Files:**
- Create: `frontend/hooks/use-chat.ts`
- Create: `frontend/hooks/use-sessions.ts`

- [ ] **Step 1: Create use-chat hook**

```typescript
// frontend/hooks/use-chat.ts

'use client';

import { useState, useCallback, useRef } from 'react';
import type { ChatMessage, ChatResponse, SourceCitation } from '@/lib/types';
import { api } from '@/lib/api';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [lastResponse, setLastResponse] = useState<ChatResponse | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sessionIdRef = useRef<string | undefined>();

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: ChatMessage = { role: 'user', content };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingContent('');
    setLastResponse(null);

    try {
      const response = await api.chat.send(content, sessionIdRef.current);
      sessionIdRef.current = response.session_id;
      setLastResponse(response);

      // Simulate streaming by revealing the answer character by character
      const fullText = response.answer;
      let revealed = '';
      for (let i = 0; i < fullText.length; i++) {
        if (abortRef.current?.signal.aborted) break;
        revealed += fullText[i];
        setStreamingContent(revealed);
        await new Promise((r) => setTimeout(r, 15));
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: fullText,
        sources: response.sources,
        retrieval_metadata: response.retrieval_metadata,
        model: response.model,
        latency_ms: response.latency_ms,
        tokens_used: response.tokens_used,
        retrieval_confidence: response.retrieval_confidence,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent('');
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: 'Sorry, an error occurred. Please try again.',
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setStreamingContent('');
    setLastResponse(null);
    sessionIdRef.current = undefined;
  }, []);

  return {
    messages,
    isLoading,
    streamingContent,
    lastResponse,
    sessionId: sessionIdRef.current,
    sendMessage,
    stopGeneration,
    clearChat,
  };
}
```

- [ ] **Step 2: Create use-sessions hook**

```typescript
// frontend/hooks/use-sessions.ts

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ChatSession } from '@/lib/types';
import { api } from '@/lib/api';

export function useSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    try {
      const data = await api.chat.getSessions();
      setSessions(data);
    } catch {
      // Sessions are non-critical, silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, loading, refetch: fetchSessions };
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/hooks/
git commit -m "feat: add use-chat and use-sessions hooks for chat state management"
```

---

## Task 11: Create Chat Components

**Files:**
- Create: `frontend/components/chat/model-badge.tsx`
- Create: `frontend/components/chat/retrieval-status.tsx`
- Create: `frontend/components/chat/query-transformation.tsx`
- Create: `frontend/components/chat/confidence-warning.tsx`
- Create: `frontend/components/chat/streaming-indicator.tsx`
- Create: `frontend/components/chat/chat-message.tsx`
- Create: `frontend/components/chat/chat-input.tsx`
- Create: `frontend/components/chat/chat-area.tsx`

- [ ] **Step 1: Create model-badge component**

```tsx
// frontend/components/chat/model-badge.tsx

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
    <span className="text-muted-foreground text-[11px] inline-flex items-center gap-1">
      <Settings className="w-2.5 h-2.5" />
      {parts.join(' · ')}
    </span>
  );
}
```

- [ ] **Step 2: Create retrieval-status component**

```tsx
// frontend/components/chat/retrieval-status.tsx

import { Loader2, Check } from 'lucide-react';
import type { RetrievalMetadata } from '@/lib/types';

interface RetrievalStatusProps {
  isLoading: boolean;
  metadata?: RetrievalMetadata;
}

export function RetrievalStatus({ isLoading, metadata }: RetrievalStatusProps) {
  return (
    <div className="mb-4 flex flex-col gap-1.5">
      {isLoading && (
        <div className="flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
          <span className="text-primary text-xs">Searching indexed knowledge base...</span>
        </div>
      )}
      {metadata && (
        <>
          <div className="flex items-center gap-2 pl-1">
            <Check className="w-3 h-3 text-emerald-400" />
            <span className="text-muted-foreground text-xs">
              Retrieved {metadata.sources_found} relevant sources
            </span>
          </div>
          <div className="flex items-center gap-2 pl-1">
            <Check className="w-3 h-3 text-emerald-400" />
            <span className="text-muted-foreground text-xs">
              {metadata.confidence === 'high' ? 'High' : metadata.confidence === 'medium' ? 'Medium' : 'Low'} confidence retrieval ({metadata.sources_found} sources)
            </span>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create query-transformation component**

```tsx
// frontend/components/chat/query-transformation.tsx

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
        <span className="text-muted-foreground text-[10px] uppercase tracking-wider">
          Query Rewritten
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <div>
          <div className="text-muted-foreground text-[10px] mb-0.5">Original</div>
          <div className="text-muted-foreground text-[11px] italic">&quot;{original}&quot;</div>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
        <div>
          <div className="text-muted-foreground text-[10px] mb-0.5">Expanded</div>
          <div className="text-foreground text-[11px]">&quot;{rewritten}&quot;</div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create confidence-warning component**

```tsx
// frontend/components/chat/confidence-warning.tsx

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
```

- [ ] **Step 5: Create streaming-indicator component**

```tsx
// frontend/components/chat/streaming-indicator.tsx

import { X } from 'lucide-react';

interface StreamingIndicatorProps {
  content: string;
  onStop: () => void;
}

export function StreamingIndicator({ content, onStop }: StreamingIndicatorProps) {
  return (
    <div className="flex gap-3 mb-6">
      <div className="w-[26px] h-[26px] bg-primary rounded-md flex items-center justify-center shrink-0 mt-0.5">
        <Layers className="w-3 h-3 text-primary-foreground" />
      </div>
      <div className="flex-1">
        <div className="text-foreground text-[13.5px] leading-relaxed">
          {content}
          <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 align-text-bottom animate-pulse" />
        </div>
        <div className="mt-2">
          <button
            onClick={onStop}
            className="bg-red-500/15 border border-red-500/30 text-red-400 px-2.5 py-1 rounded text-[11px] inline-flex items-center gap-1 hover:bg-red-500/25 transition-colors"
          >
            <X className="w-2.5 h-2.5" />
            Stop generating
          </button>
        </div>
      </div>
    </div>
  );
}
```

Note: The `Layers` import needs to be added: `import { X, Layers } from 'lucide-react';`

- [ ] **Step 6: Create chat-message component**

```tsx
// frontend/components/chat/chat-message.tsx

import { Layers } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { ModelBadge } from './model-badge';
import { ConfidenceWarning } from './confidence-warning';

interface ChatMessageProps {
  message: ChatMessageType;
  onSourceClick?: (index: number) => void;
}

export function ChatMessage({ message, onSourceClick }: ChatMessageProps) {
  if (message.role === 'user') {
    return (
      <div className="mb-6 max-w-[75%] ml-auto">
        <div className="bg-secondary text-foreground px-4 py-3 rounded-lg text-[13px] leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 flex gap-3">
      <div className="w-[26px] h-[26px] bg-primary rounded-md flex items-center justify-center shrink-0 mt-0.5">
        <Layers className="w-3 h-3 text-primary-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <ConfidenceWarning
          confidence={message.retrieval_confidence}
          sourcesCount={message.sources?.length}
        />
        <div className="text-foreground text-[13.5px] leading-relaxed">
          {message.content}
        </div>
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2.5 flex gap-1.5 flex-wrap items-center">
            {message.sources.map((source, i) => (
              <button
                key={i}
                onClick={() => onSourceClick?.(i)}
                className="bg-primary/10 border border-primary/20 text-primary px-2.5 py-[3px] rounded text-[11px] hover:bg-primary/20 transition-colors"
              >
                [{i + 1}] {source.document_name}
              </button>
            ))}
            {(message.model || message.latency_ms || message.tokens_used) && (
              <>
                <span className="text-border text-[11px]">|</span>
                <ModelBadge
                  model={message.model}
                  latencyMs={message.latency_ms}
                  tokensUsed={message.tokens_used}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Create chat-input component**

```tsx
// frontend/components/chat/chat-input.tsx

'use client';

import { useState, useCallback } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = value.trim();
      if (!trimmed || disabled) return;
      onSend(trimmed);
      setValue('');
    },
    [value, disabled, onSend]
  );

  return (
    <div className="px-7 py-3.5 border-t border-border">
      <form onSubmit={handleSubmit}>
        <div className="bg-card border border-border rounded-[10px] px-4 py-3 flex items-center gap-2.5">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ask a question about your knowledge base..."
            disabled={disabled}
            className="flex-1 bg-transparent text-foreground text-[13px] placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={disabled || !value.trim()}
            className="bg-primary w-[30px] h-[30px] rounded-[7px] flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5 text-primary-foreground" />
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 8: Create chat-area component (main container)**

```tsx
// frontend/components/chat/chat-area.tsx

'use client';

import { useState } from 'react';
import { useChat } from '@/hooks/use-chat';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { RetrievalStatus } from './retrieval-status';
import { QueryTransformation } from './query-transformation';
import { StreamingIndicator } from './streaming-indicator';
import { SourcesPanel } from '@/components/sources/sources-panel';

export function ChatArea() {
  const {
    messages,
    isLoading,
    streamingContent,
    lastResponse,
    sendMessage,
    stopGeneration,
  } = useChat();

  const [showSources, setShowSources] = useState(true);
  const [selectedSourceIndex, setSelectedSourceIndex] = useState<number | null>(null);

  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');

  return (
    <div className="h-full flex">
      {/* Chat Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="px-5 py-3 border-b border-border flex justify-between items-center">
          <span className="text-foreground font-medium text-[13px]">
            {messages.length > 0 ? 'Conversation' : 'New Chat'}
          </span>
          <button
            onClick={() => setShowSources(!showSources)}
            className="px-2.5 py-1 bg-card border border-border rounded-md text-muted-foreground text-[11px] flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" />
            </svg>
            Sources
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-7 py-5">
          {messages.map((msg, i) => (
            <ChatMessage
              key={i}
              message={msg}
              onSourceClick={(idx) => setSelectedSourceIndex(idx)}
            />
          ))}

          {/* Retrieval status */}
          {isLoading && !streamingContent && (
            <RetrievalStatus
              isLoading={true}
              metadata={undefined}
            />
          )}

          {/* Query transformation */}
          {lastResponse?.retrieval_metadata?.rewritten_query && lastUserMessage && (
            <QueryTransformation
              original={lastUserMessage.content}
              rewritten={lastResponse.retrieval_metadata.rewritten_query}
            />
          )}

          {/* Streaming indicator */}
          {streamingContent && (
            <StreamingIndicator content={streamingContent} onStop={stopGeneration} />
          )}

          {/* Empty state */}
          {messages.length === 0 && !isLoading && (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-foreground font-medium text-sm">Ask a question</p>
                <p className="text-muted-foreground text-xs mt-1">Query your knowledge base for accurate, cited answers</p>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput onSend={sendMessage} disabled={isLoading} />
      </div>

      {/* Sources Panel */}
      {showSources && (
        <SourcesPanel
          sources={lastResponse?.sources || lastAssistantMessage?.sources || []}
          metadata={lastResponse?.retrieval_metadata}
          selectedIndex={selectedSourceIndex}
          onSelect={(idx) => setSelectedSourceIndex(idx)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 9: Commit**

```bash
git add frontend/components/chat/
git commit -m "feat: add chat components — messages, streaming, retrieval status, model badge"
```

---

## Task 12: Create Sources Panel Components

**Files:**
- Create: `frontend/components/sources/retrieval-config.tsx`
- Create: `frontend/components/sources/source-card.tsx`
- Create: `frontend/components/sources/source-preview.tsx`
- Create: `frontend/components/sources/sources-panel.tsx`

- [ ] **Step 1: Create retrieval-config component**

```tsx
// frontend/components/sources/retrieval-config.tsx

import type { RetrievalMetadata } from '@/lib/types';

export function RetrievalConfig({ metadata }: { metadata?: RetrievalMetadata }) {
  const configEntries = [
    { label: 'Strategy', value: 'Hybrid (BM25 + Vector)' },
    { label: 'Embedding', value: 'text-embedding-3-small' },
    { label: 'Vector DB', value: 'pgvector (HNSW)' },
    { label: 'Reranker', value: 'Cohere Rerank v3' },
  ];

  return (
    <div className="px-3.5 py-2.5 border-b border-border">
      <div className="text-muted-foreground text-[9px] uppercase tracking-wider mb-2">
        Retrieval Configuration
      </div>
      <div className="flex flex-col gap-1.5">
        {configEntries.map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center">
            <span className="text-muted-foreground text-[10px]">{label}</span>
            <span className="text-foreground text-[10px] font-medium">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create source-card component**

```tsx
// frontend/components/sources/source-card.tsx

import { FileText } from 'lucide-react';
import type { SourceCitation } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SourceCardProps {
  source: SourceCitation;
  index: number;
  selected?: boolean;
  onClick: () => void;
}

function getSourceTypeColor(sourceType: string) {
  switch (sourceType) {
    case 'pdf': return 'text-amber-400';
    case 'markdown': return 'text-primary';
    default: return 'text-muted-foreground';
  }
}

function getSimilarityColor(similarity: number) {
  if (similarity >= 0.85) return 'bg-emerald-900 text-emerald-400';
  if (similarity >= 0.7) return 'bg-amber-900 text-amber-400';
  return 'bg-red-900 text-red-400';
}

export function SourceCard({ source, index, selected, onClick }: SourceCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-background border rounded-md p-2.5 mb-2 cursor-pointer transition-colors',
        selected ? 'border-primary/50' : 'border-border hover:border-border/80'
      )}
    >
      <div className="flex justify-between items-center mb-1.5">
        <div className="flex items-center gap-1.5">
          <FileText className={cn('w-3 h-3', getSourceTypeColor(source.source_type))} />
          <span className={cn('text-[11px] font-medium', getSourceTypeColor(source.source_type))}>
            {source.document_name}
          </span>
        </div>
        <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-semibold', getSimilarityColor(source.similarity))}>
          {Math.round(source.similarity * 100)}%
        </span>
      </div>
      {source.chunk_content && (
        <div className="text-muted-foreground text-[11px] leading-relaxed mb-1.5 line-clamp-2">
          {source.chunk_content.substring(0, 150)}...
        </div>
      )}
      <div className="flex gap-2 items-center text-muted-foreground text-[9px]">
        <span>chunk {source.chunk_index}</span>
        <span className="text-border">·</span>
        <span>{source.source_type}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create source-preview component (drawer)**

```tsx
// frontend/components/sources/source-preview.tsx

'use client';

import { FileText, X, ChevronDown } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { SourceCitation } from '@/lib/types';

interface SourcePreviewProps {
  source: SourceCitation | null;
  open: boolean;
  onClose: () => void;
}

export function SourcePreview({ source, open, onClose }: SourcePreviewProps) {
  if (!source) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-[420px] bg-card border-border p-0">
        <SheetHeader className="px-4 py-3 border-b border-border flex flex-row justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-primary" />
            <SheetTitle className="text-foreground text-[13px] font-semibold">
              {source.document_name}
            </SheetTitle>
          </div>
        </SheetHeader>
        <div className="p-4 flex-1 overflow-y-auto">
          {/* Metadata badges */}
          <div className="flex gap-2 mb-3.5 flex-wrap">
            <span className="bg-background border border-border px-2.5 py-[3px] rounded text-[10px] text-muted-foreground">
              {source.source_type}
            </span>
            <span className="bg-background border border-border px-2.5 py-[3px] rounded text-[10px] text-muted-foreground">
              Chunk {source.chunk_index}
            </span>
            <span className="bg-emerald-900 border border-emerald-900 px-2.5 py-[3px] rounded text-[10px] text-emerald-400">
              {Math.round(source.similarity * 100)}% similar
            </span>
          </div>

          {/* Chunk content */}
          <div className="text-foreground/80 text-xs leading-relaxed bg-background rounded-md p-3 border border-border">
            {source.chunk_content || 'No content available'}
          </div>

          {/* Context toggle */}
          <button className="mt-2.5 text-primary text-[11px] flex items-center gap-1 hover:underline">
            <ChevronDown className="w-3 h-3" />
            Show surrounding context
          </button>
        </div>
        <div className="px-4 py-2.5 border-t border-border flex justify-between items-center">
          <span className="text-muted-foreground text-[10px]">Source document</span>
          <span className="text-primary text-[11px] cursor-pointer hover:underline">
            View full document →
          </span>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 4: Create sources-panel component**

```tsx
// frontend/components/sources/sources-panel.tsx

'use client';

import { useState } from 'react';
import type { SourceCitation, RetrievalMetadata } from '@/lib/types';
import { RetrievalConfig } from './retrieval-config';
import { SourceCard } from './source-card';
import { SourcePreview } from './source-preview';

interface SourcesPanelProps {
  sources: SourceCitation[];
  metadata?: RetrievalMetadata;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export function SourcesPanel({ sources, metadata, selectedIndex, onSelect }: SourcesPanelProps) {
  const [previewSource, setPreviewSource] = useState<SourceCitation | null>(null);

  if (sources.length === 0 && !metadata) {
    return (
      <div className="w-[290px] bg-card border-l border-border flex items-center justify-center shrink-0">
        <p className="text-muted-foreground text-xs">No sources yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="w-[290px] bg-card border-l border-border flex flex-col shrink-0">
        {/* Header */}
        <div className="px-3.5 py-3 border-b border-border flex justify-between items-center">
          <span className="text-foreground text-xs font-semibold">Sources</span>
          {sources.length > 0 && (
            <span className="bg-primary/15 text-primary px-2 py-0.5 rounded text-[10px]">
              {sources.length} found
            </span>
          )}
        </div>

        {/* Retrieval config */}
        <RetrievalConfig metadata={metadata} />

        {/* Source cards */}
        <div className="flex-1 overflow-y-auto p-2.5">
          {sources.map((source, i) => (
            <SourceCard
              key={i}
              source={source}
              index={i}
              selected={selectedIndex === i}
              onClick={() => {
                onSelect(i);
                setPreviewSource(source);
              }}
            />
          ))}
        </div>
      </div>

      {/* Preview drawer */}
      <SourcePreview
        source={previewSource}
        open={!!previewSource}
        onClose={() => setPreviewSource(null)}
      />
    </>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/components/sources/
git commit -m "feat: add sources panel with retrieval config, source cards, and preview drawer"
```

---

## Task 13: Wire Up Chat Page

**Files:**
- Modify: `frontend/app/page.tsx`
- Modify: `frontend/components/layout/sidebar.tsx` (add session list)

- [ ] **Step 1: Update page.tsx to use ChatArea**

```tsx
// frontend/app/page.tsx

import { ChatArea } from '@/components/chat/chat-area';

export default function ChatPage() {
  return <ChatArea />;
}
```

- [ ] **Step 2: Update sidebar to show session list**

Replace the sidebar component to include a "New Chat" button and recent sessions:

```tsx
// frontend/components/layout/sidebar.tsx

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, FileText, LayoutDashboard, Layers, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSessions } from '@/hooks/use-sessions';

const navItems = [
  { href: '/', label: 'Chat', icon: MessageSquare },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sessions } = useSessions();

  return (
    <div className="w-[220px] bg-sidebar border-r border-sidebar-border flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-sidebar-border flex items-center gap-2.5">
        <div className="w-[30px] h-[30px] bg-primary rounded-[7px] flex items-center justify-center">
          <Layers className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <span className="text-foreground font-semibold text-sm">KnowledgeBase</span>
      </div>

      {/* New Chat */}
      <div className="px-2.5 py-2.5">
        <Link
          href="/"
          className="bg-primary text-primary-foreground py-[7px] px-3 rounded-md text-xs font-semibold block text-center hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
          New Chat
        </Link>
      </div>

      {/* Recent Sessions */}
      <div className="px-2.5 flex-1 overflow-y-auto">
        <div className="text-muted-foreground text-[9px] uppercase tracking-wider mb-1.5 px-1">
          Recent
        </div>
        {sessions.slice(0, 8).map((session) => (
          <Link
            key={session.id}
            href={`/?session=${session.id}`}
            className="block px-2.5 py-[7px] text-muted-foreground text-[11px] mb-0.5 rounded-md hover:bg-accent truncate transition-colors"
          >
            {session.title || 'Untitled session'}
          </Link>
        ))}
      </div>

      {/* Navigation */}
      <div className="px-2.5 py-1.5 border-t border-sidebar-border">
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
```

- [ ] **Step 3: Verify chat page works**

```bash
cd backend && npm run start:dev &
cd frontend && npm run dev
```

Open http://localhost:3001 — should see sidebar, chat area with empty state, and sources panel. Type a message and send (will need backend running).

- [ ] **Step 4: Commit**

```bash
git add frontend/app/page.tsx frontend/components/layout/sidebar.tsx
git commit -m "feat: wire up chat page with ChatArea and session-aware sidebar"
```

---

## Task 14: Create Documents Page

**Files:**
- Create: `frontend/components/documents/upload-zone.tsx`
- Create: `frontend/components/documents/ingestion-progress.tsx`
- Create: `frontend/components/documents/document-list.tsx`
- Create: `frontend/hooks/use-documents.ts`
- Create: `frontend/app/documents/page.tsx`

- [ ] **Step 1: Create upload-zone component**

```tsx
// frontend/components/documents/upload-zone.tsx

'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload } from 'lucide-react';

interface UploadZoneProps {
  onUpload: (content: string, fileName: string) => Promise<void>;
}

export function UploadZone({ onUpload }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setIsUploading(true);
      try {
        const content = await file.text();
        await onUpload(content, file.name);
      } catch (err) {
        console.error('Upload failed:', err);
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-[10px] p-5 text-center mb-4 cursor-pointer transition-colors ${
        isDragging ? 'border-primary bg-primary/5' : 'border-border'
      }`}
    >
      <Upload className="w-5 h-5 text-primary mx-auto mb-1.5" />
      <div className="text-primary text-[13px] font-medium">
        {isUploading ? 'Uploading...' : 'Drop files here or click to upload'}
      </div>
      <div className="text-muted-foreground text-[11px]">PDF, Markdown, Text — max 10MB</div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.md,.txt,.markdown"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Create ingestion-progress component**

```tsx
// frontend/components/documents/ingestion-progress.tsx

import { cn } from '@/lib/utils';
import type { IngestionStatus } from '@/lib/types';

const STAGES: IngestionStatus[] = ['uploaded', 'parsing', 'chunking', 'embedding', 'indexed'];

function getStageIndex(status: IngestionStatus): number {
  return STAGES.indexOf(status);
}

function getStageColor(stageIndex: number, status: IngestionStatus, isActive: boolean) {
  const currentIdx = getStageIndex(status);
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
```

- [ ] **Step 3: Create document-list component**

```tsx
// frontend/components/documents/document-list.tsx

import { FileText } from 'lucide-react';
import type { Document } from '@/lib/types';
import { IngestionProgress } from './ingestion-progress';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  indexed: 'bg-emerald-900 text-emerald-400',
  embedding: 'bg-amber-900 text-amber-400',
  chunking: 'bg-amber-900 text-amber-400',
  parsing: 'bg-amber-900 text-amber-400',
  uploaded: 'bg-muted text-muted-foreground',
  failed: 'bg-red-900 text-red-400',
};

function getSourceTypeIcon(sourceType: string) {
  return sourceType === 'pdf' ? 'text-amber-400' : 'text-primary';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface DocumentListProps {
  documents: Document[];
}

export function DocumentList({ documents }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-xs">
        No documents yet. Upload your first file above.
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_0.8fr] px-3.5 py-2 border-b border-border text-muted-foreground text-[10px] uppercase tracking-wider">
        <span>Document</span>
        <span>Ingestion Progress</span>
        <span>Status</span>
        <span>Chunks</span>
        <span>Uploaded</span>
      </div>

      {/* Rows */}
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="grid grid-cols-[2fr_1.5fr_1fr_1fr_0.8fr] px-3.5 py-2.5 border-b border-border last:border-b-0 items-center"
        >
          <div className="flex items-center gap-2">
            <FileText className={cn('w-3.5 h-3.5', getSourceTypeIcon(doc.source_type))} />
            <span className="text-foreground text-xs truncate">{doc.metadata?.fileName as string || `document-${doc.id.slice(0, 8)}`}</span>
          </div>
          <IngestionProgress status={doc.status} />
          <span className={cn('px-2 py-0.5 rounded text-[10px] font-medium w-fit', statusStyles[doc.status] || statusStyles.uploaded)}>
            {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
          </span>
          <span className="text-foreground text-xs">{doc.chunk_count ?? '—'}</span>
          <span className="text-muted-foreground text-[11px]">{timeAgo(doc.created_at)}</span>
        </div>
      ))}

      {/* Legend */}
      <div className="px-3.5 py-2 flex gap-3">
        {['Uploaded', 'Parsing', 'Chunking', 'Embedding', 'Indexed'].map((stage) => (
          <span key={stage} className="text-muted-foreground text-[10px] flex items-center gap-1">
            <div className={cn(
              'w-1.5 h-1.5 rounded-full',
              stage === 'Embedding' ? 'bg-amber-400' : 'bg-emerald-400'
            )} />
            {stage}
          </span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create use-documents hook**

```typescript
// frontend/hooks/use-documents.ts

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Document } from '@/lib/types';
import { api } from '@/lib/api';

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    try {
      const data = await api.documents.list();
      setDocuments(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const uploadDocument = useCallback(
    async (content: string, fileName: string) => {
      const ext = fileName.split('.').pop()?.toLowerCase();
      const sourceType = ext === 'pdf' ? 'pdf' : 'markdown';

      const result = await api.ingestion.process({
        content,
        source_type: sourceType,
        fileName,
        metadata: { fileName },
      });

      // Refresh document list after upload
      await fetchDocuments();
      return result;
    },
    [fetchDocuments]
  );

  return { documents, loading, uploadDocument, refetch: fetchDocuments };
}
```

- [ ] **Step 5: Create documents page**

```tsx
// frontend/app/documents/page.tsx

'use client';

import { UploadZone } from '@/components/documents/upload-zone';
import { DocumentList } from '@/components/documents/document-list';
import { useDocuments } from '@/hooks/use-documents';

export default function DocumentsPage() {
  const { documents, loading, uploadDocument } = useDocuments();

  return (
    <div className="h-full overflow-y-auto p-5">
      <h1 className="text-foreground font-semibold text-lg mb-4">Documents</h1>
      <UploadZone onUpload={uploadDocument} />
      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-xs">Loading documents...</div>
      ) : (
        <DocumentList documents={documents} />
      )}
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add frontend/components/documents/ frontend/hooks/use-documents.ts frontend/app/documents/
git commit -m "feat: add documents page with upload zone, ingestion lifecycle, and document list"
```

---

## Task 15: Create Dashboard Page

**Files:**
- Create: `frontend/components/dashboard/stat-card.tsx`
- Create: `frontend/components/dashboard/latency-chart.tsx`
- Create: `frontend/components/dashboard/pipeline-stats.tsx`
- Create: `frontend/components/dashboard/system-config.tsx`
- Create: `frontend/components/dashboard/activity-feed.tsx`
- Create: `frontend/app/dashboard/page.tsx`

- [ ] **Step 1: Create stat-card component**

```tsx
// frontend/components/dashboard/stat-card.tsx

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
      <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1.5">{label}</div>
      <div className="text-foreground text-[22px] font-bold">
        {value}
        {unit && <span className="text-[12px] text-muted-foreground font-normal ml-0.5">{unit}</span>}
      </div>
      {trend && (
        <div className={cn(
          'text-[10px] mt-0.5',
          trendType === 'down' ? 'text-emerald-400' : trendType === 'up' ? 'text-red-400' : 'text-muted-foreground'
        )}>
          {trend}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create latency-chart component**

```tsx
// frontend/components/dashboard/latency-chart.tsx

'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts';

// Mock data — will be replaced with real data from API
const data = [
  { day: 'Mon', latency: 420 },
  { day: 'Tue', latency: 380 },
  { day: 'Wed', latency: 450 },
  { day: 'Thu', latency: 340 },
  { day: 'Fri', latency: 370 },
  { day: 'Sat', latency: 310 },
  { day: 'Sun', latency: 290 },
];

export function LatencyChart() {
  return (
    <div className="bg-card border border-border rounded-lg p-3.5">
      <div className="flex justify-between items-center mb-3">
        <span className="text-muted-foreground text-[10px] uppercase tracking-wider">
          Retrieval Latency (7 days)
        </span>
        <div className="flex gap-2">
          <span className="flex items-center gap-1 text-[10px] text-primary">
            <span className="w-2 h-0.5 bg-primary rounded inline-block" />
            Latency
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="w-2 h-0.5 bg-muted-foreground/50 rounded inline-block border-t border-dashed border-muted-foreground" />
            Target
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={130}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} unit="ms" />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', fontSize: '11px' }}
            labelStyle={{ color: '#94a3b8' }}
            itemStyle={{ color: '#22d3ee' }}
          />
          <Area type="monotone" dataKey="latency" stroke="#22d3ee" strokeWidth={2} fill="url(#latencyGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 3: Create pipeline-stats component**

```tsx
// frontend/components/dashboard/pipeline-stats.tsx

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
      <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-2.5">
        Ingestion Pipeline
      </div>
      <div className="flex flex-col gap-2">
        {stats.map(({ label, value, highlight }) => (
          <div key={label} className="flex justify-between">
            <span className="text-muted-foreground text-[11px]">{label}</span>
            <span className={highlight ? 'text-red-400 text-[11px] font-semibold' : 'text-foreground text-[11px] font-semibold'}>
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create system-config component**

```tsx
// frontend/components/dashboard/system-config.tsx

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
```

- [ ] **Step 5: Create activity-feed component**

```tsx
// frontend/components/dashboard/activity-feed.tsx

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
```

- [ ] **Step 6: Create dashboard page**

```tsx
// frontend/app/dashboard/page.tsx

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
        setDocuments(docs);
        setSessions(sess);
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

      {/* Metric Cards */}
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

      {/* Chart + Pipeline */}
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

      {/* Activity Feed */}
      <ActivityFeed items={activityItems} />
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add frontend/components/dashboard/ frontend/app/dashboard/
git commit -m "feat: add dashboard page with metrics cards, latency chart, pipeline stats, and activity feed"
```

---

## Task 16: Final Integration Testing and Polish

**Files:**
- Possibly modify any components that need fixes from testing

- [ ] **Step 1: Start both servers**

```bash
# Terminal 1: Backend
cd backend && npm run start:dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

- [ ] **Step 2: Verify all three pages render**

1. Open http://localhost:3001 — Chat page with sidebar, empty state
2. Navigate to /documents — Upload zone and document list
3. Navigate to /dashboard — Stats cards and chart

- [ ] **Step 3: Test chat flow end-to-end**

1. Type a question and send
2. Verify retrieval status indicators appear
3. Verify streaming text appears
4. Verify sources panel populates
5. Click a source to open preview drawer

- [ ] **Step 4: Test document upload**

1. Drop a .md file into the upload zone
2. Verify document appears in the list with status
3. Verify ingestion progress bar shows

- [ ] **Step 5: Fix any issues found during testing**

Address any TypeScript errors, missing imports, or visual bugs.

- [ ] **Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix: address integration issues found during testing"
```

---

## Task 17: Update Root README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update README for monorepo structure**

Add sections for the frontend setup alongside existing backend documentation. Include:
- Updated project structure showing backend/ and frontend/
- Frontend setup instructions (cd frontend, npm install, npm run dev)
- Updated API reference noting the proxy architecture
- Link to the design spec

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update README for monorepo structure with frontend setup instructions"
```
