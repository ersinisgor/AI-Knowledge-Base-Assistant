# Test Questions — TechNova Solutions Knowledge Base

Use these questions after uploading all documents to verify that the RAG pipeline retrieves and answers correctly.

---

## Engineering

- How does authentication work?
- What is the deployment process?
- What are the coding standards?
- What is the JWT access token expiry?
- What are the password policy requirements?

## Architecture & Database

- How does the RAG pipeline work end-to-end?
- What is the token budget for retrieved chunks?
- What vector index is used and why?
- What tables exist in the database schema?

## Context + Slack Discussions

- Why did we change JWT expiration?
- What did the backend team discuss about tokens?
- What was discussed about real-time notifications?
- Why was the connection pool size changed?

## Incidents

- Why did the API go down?
- What caused the data migration failure?
- Who was the incident commander for the P1 outage?

## GitHub Commits

- Who worked on the WebSocket feature?
- What changes did Charlie make?
- What was fixed in PR #847?

## Product & Business

- What features are planned in the roadmap?
- What are the KPI targets?
- What were the MAU numbers in January 2025?
- What is the Q2 analytics dashboard plan?

## Onboarding (PDF)

- What should a new backend engineer do on day 1?
- Who is the engineering lead?
- Where is the wiki?

## Security Policy (PDF)

- What is the account lockout policy?
- How long are refresh tokens valid?
- What compliance certifications does TechNova have?

---

## Cross-Document Retrieval (Advanced)

These questions require the RAG system to combine information from multiple documents — good for stress-testing retrieval quality:

- Why was the connection pool size changed? *(Slack + incident report + GitHub commit)*
- What security measures protect the authentication system? *(Engineering handbook + security policy)*
- What did the team ship in January 2025 and how did it affect KPIs? *(Slack + GitHub commits + KPI report)*
- What onboarding steps relate to the RAG pipeline? *(Onboarding guide + system architecture)*
