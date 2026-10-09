# Akwaaba Night Voting — Starter

This repository contains the initial user-interface scaffold for the Akwaaba Night voting portal.

## Current status

- Responsive landing page and placeholder award categories.
- Next.js and TypeScript project configuration.
- Environment variable template with placeholder values only.
- No live voting, database, payment processing, USSD, authentication, or admin dashboard is implemented.
- Do not collect real votes or payments using this starter.

## Requirements

- Node.js 20.9 or later
- npm

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Before production

1. Confirm the official award categories, nominees, eligibility and voting rules.
2. Create and secure a database, including migrations and row-level access policies.
3. Implement server-side payment initialization and verify every payment with Paystack before recording a vote.
4. Verify webhook signatures, handle retries idempotently, and enforce the chosen voting rule in the database transaction.
5. Never expose secret keys in browser code or commit real secrets to GitHub.
6. Add administrator authentication, audit logs, privacy notices, rate limits and abuse protections.
7. Test with payment-provider test credentials before any production activation.
8. Complete provider approval, deployment configuration and security review before launch.

The `.env.example` file contains placeholders only. Copy it to `.env.local` for local work and fill values privately when services are configured.
