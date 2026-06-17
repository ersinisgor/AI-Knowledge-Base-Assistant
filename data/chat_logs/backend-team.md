# Slack Export — #backend-team

Channel: #backend-team | Exported: 2025-01-20

---

**alice** [2025-01-10 09:14]
JWT expiration is causing issues in the mobile app. Users are getting logged out every 15 minutes and it's frustrating them.

**bob** [2025-01-10 09:22]
Yeah, I've seen the reports. The 15-minute access token is working as designed, but we probably need to fix the silent refresh logic on the mobile side.

**alice** [2025-01-10 09:35]
Actually the refresh token isn't being sent correctly — the HttpOnly cookie isn't included in cross-origin requests on mobile WebView.

**charlie** [2025-01-10 10:02]
We should increase the refresh token duration as a short-term fix. Let's extend it to 14 days instead of 7.

**bob** [2025-01-10 10:15]
Agreed. That buys us time to fix the WebView CORS issue properly. I'll open a PR today.

**alice** [2025-01-11 14:30]
PR is up: [Fix JWT refresh duration and WebView CORS]. Please review when you have a moment.

**charlie** [2025-01-11 14:45]
On it. Also, should we rotate refresh tokens on every use? Currently we don't and it's a security concern.

**bob** [2025-01-11 15:00]
Yes, rotation should be enabled. I'll add that to the PR. The engineering handbook says RS256 is required — double checking we're using that.

**alice** [2025-01-11 15:10]
We are. RS256 is already configured in the JwtModule options.

---

**dave** [2025-01-14 11:00]
Quick heads up — database connection pool is hitting limits during peak hours (around 2pm UTC). We're seeing occasional timeouts.

**charlie** [2025-01-14 11:20]
What's the current pool size?

**dave** [2025-01-14 11:25]
It's set to 10. Supabase free tier limit is 20. We should increase it to at least 20 and add monitoring.

**bob** [2025-01-14 11:40]
Done. I increased it to 20 and added a Datadog alert for pool utilization > 80%.

---

**alice** [2025-01-17 09:00]
Reminder: on-call rotation starts today. Charlie is first on the rota. Check PagerDuty for the schedule.
