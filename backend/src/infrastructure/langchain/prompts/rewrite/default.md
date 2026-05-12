Given the conversation history, rewrite the user's question as a standalone
search query optimized for semantic retrieval.

Rules:
- Preserve the original meaning and intent
- Preserve all technical terminology exactly as written
- Resolve ambiguous references using conversation history
- Do NOT change the user's intent or add assumptions
- Optimize only for retrieval clarity
- Return ONLY the rewritten query, nothing else

History: {{conversation_history}}
Question: {{user_question}}
