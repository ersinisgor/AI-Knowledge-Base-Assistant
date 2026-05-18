# Backend Team Discussion — #backend-team Slack Channel

[2025-01-10 09:15] alice: Hey team, JWT expiration is causing issues in the mobile app. Users are getting logged out mid-session.

[2025-01-10 09:22] bob: I noticed that too. The 15-minute access token expiry is too aggressive for mobile. We should increase the refresh token duration.

[2025-01-10 09:30] charlie: Agreed. Let us extend refresh token duration to 14 days instead of 7 days. That should fix the mobile experience.

[2025-01-10 09:45] alice: Also, the refresh mechanism itself has a race condition. If two API calls happen simultaneously when the token is about to expire, both try to refresh and one fails.

[2025-01-10 10:00] bob: We can fix that with a mutex/lock on the refresh flow. I have seen this pattern before. Only one refresh request at a time, others wait.

[2025-01-10 10:15] charlie: I will create a ticket for the mutex fix. Priority P2 since it affects power users with many tabs open.

[2025-01-11 14:00] john: Hey, I fixed the JWT expiration bug yesterday. The refresh token duration is now 14 days as discussed. PR #847 is ready for review.

[2025-01-11 14:15] alice: Thanks John! I will review it today.

[2025-01-11 16:30] alice: PR #847 looks good. Approved and merged. Deploying to staging.

[2025-01-15 11:00] charlie: The RAG pipeline retrieval accuracy has dropped 15% since last week. I think it is because we added too many documents without proper chunking.

[2025-01-15 11:15] alice: Can you check the chunk overlap settings? We might need to increase from 80 to 120 characters.

[2025-01-15 11:30] charlie: Good idea. I will run some benchmarks with different overlap values and share results.

[2025-01-20 09:00] bob: Heads up, I am migrating the database connection pool configuration. Pool size is going from 10 to 30 connections.

[2025-01-20 09:05] alice: Why the increase? Are we hitting limits?

[2025-01-20 09:10] bob: Yes, we hit pool exhaustion last Friday during peak hours. The API was sluggish for about 15 minutes. Increasing pool size should prevent that.
