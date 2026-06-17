# Slack Export — #product-team

Channel: #product-team | Exported: 2025-01-20

---

**emma** [2025-01-12 10:05]
Users are requesting better notifications. The current 30-second polling delay is causing complaints — people are missing task assignments.

**liam** [2025-01-12 10:18]
We should implement real-time updates using WebSockets. We already have a Socket.io gateway in the backend, we just need to hook it up to task events.

**emma** [2025-01-12 10:30]
Great. What events should we support in the first release?

**liam** [2025-01-12 10:45]
At minimum: task assigned, comment added, status changed. We can add deadline reminders in a follow-up.

**emma** [2025-01-12 11:00]
Agreed. I'll write up the PRD today. Should notification preferences be configurable per user?

**liam** [2025-01-12 11:05]
Yes, definitely. Users should be able to mute specific notification types.

---

**emma** [2025-01-15 14:00]
Sharing early feedback on the AI Assistant from the beta group: users love the source citations. The "LOW confidence" warning is confusing some people though — they think it means the answer is wrong.

**sophia** [2025-01-15 14:15]
Maybe we reword it to "Limited information available" instead of showing a raw confidence score?

**liam** [2025-01-15 14:20]
Or we could show a banner: "Answer based on limited documentation — verify before acting."

**emma** [2025-01-15 14:35]
I like Liam's version. Let's go with that. Filing a ticket now.

---

**emma** [2025-01-18 09:00]
Q2 planning: multi-language support is moving up in priority. We have 3 enterprise customers in Turkey and Germany requesting it.

**sophia** [2025-01-18 09:20]
Do we support RTL languages?

**emma** [2025-01-18 09:30]
Not yet — that's a bigger effort. Let's start with LTR languages: English, Turkish, German, French.

**liam** [2025-01-18 09:45]
For the AI assistant, should it respond in the user's language automatically?

**emma** [2025-01-18 10:00]
Yes, that should be the default behavior. We'll use the user's language preference setting to instruct the LLM.
