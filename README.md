# 🤖 AI Knowledge Base Assistant

## 📌 Overview

**AI Knowledge Base Assistant** is a backend-focused project that simulates a real-world **internal company AI assistant**.

The goal of this system is to allow users to:

- Ask questions about company knowledge
- Retrieve information from multiple data sources
- Get accurate, context-aware answers powered by AI

This project is being built step-by-step as a **production-grade system**, not a tutorial.

---

## 🎯 Project Goals

This project aims to demonstrate:

- Building a **scalable backend architecture** with NestJS
- Designing a **Retrieval-Augmented Generation (RAG)** system
- Working with **vector databases (Supabase + pgvector)**
- Implementing **AI-powered search and question answering**
- Managing **context window and document retrieval**
- Streaming responses using **WebSocket (real-time AI responses)**

---

## 🧠 What Will This Project Do?

In its final form, the system will:

1. Accept document uploads (PDF, Markdown, JSON, etc.)
2. Process and store documents
3. Convert documents into embeddings
4. Store embeddings in a vector database
5. Retrieve relevant information based on user queries
6. Generate AI responses using LLM + context
7. Stream responses to the client in real time

---

## 🏗️ Architecture (High-Level)

User
↓
Frontend (future)
↓
Backend API (NestJS)
↓
Core Services
Chat Service
Document Service
Ingestion Service
(RAG Service - future)
↓
Supabase (PostgreSQL)

> Note: AI (RAG, embeddings, LLM) will be added in later phases.

---

## ⚙️ Tech Stack

### Backend

- NestJS (Node.js framework)
- TypeScript

### Database

- Supabase (PostgreSQL)

### AI (Planned)

- LangChain
- OpenAI (or compatible LLM)
- pgvector (vector search)

### Realtime (Planned)

- WebSocket (Socket.io)

---

## 📂 Project Structure (Current)

src/
├── modules/
│ ├── documents/
│ ├── chat/
│ ├── ingestion/
│
├── lib/
│ └── supabase.client.ts
│
├── config/
├── main.ts

---

## 🚀 Current Status

🔹 Phase 1: Backend Foundation (In Progress)

Implemented / Planned:

- [x] Project setup (NestJS)
- [x] Supabase connection
- [x] Basic module structure
- [ ] Document APIs
- [ ] Chat API (basic)
- [ ] Ingestion (basic)

---

## 🔮 Upcoming Features

- Document ingestion pipeline (PDF, Markdown, JSON)
- Embedding generation
- Vector search (pgvector)
- RAG pipeline (LangChain)
- Context-aware AI responses
- WebSocket streaming
- Multi-source knowledge (Slack, GitHub, incidents)

---

## 💡 Why This Project?

Most AI tutorials focus only on simple demos.

This project is different:

- It simulates a **real internal company system**
- Uses **multiple data sources**
- Follows **production-grade architecture**
- Focuses on **backend + AI engineering**

---

## 🧑‍💻 Development Approach

This project is built:

- step-by-step in phases
- with clean architecture principles
- with junior-friendly but scalable code
- focusing on real-world engineering practices

---

## 📌 Notes

This README is temporary and will be expanded as the project evolves.

---

## ⭐ Future Improvements

- Full RAG implementation
- Advanced retrieval (reranking, hybrid search)
- Evaluation system (RAG quality metrics)
- Frontend interface

---

## 📬 Contact

This project is being developed as part of a learning journey into **AI Engineering and Backend Development**.
