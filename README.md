# VEYRA — Your Business. Smarter.

A premium Next.js starter for an AI business intelligence dashboard. Includes a custom SVG brand identity, animated landing page, login/signup demo flows, dashboard routes within the client app, business analytics, CSV import, deterministic demo copilot, reports, goals, and a what-if simulator.

## Requirements

- Windows 10/11
- Node.js 20 LTS or newer (includes npm)
- Internet connection for first-time package installation

## Run on Windows

1. Extract `VEYRA.zip`.
2. Open the extracted `veyra` folder.
3. Click the address bar in File Explorer, type `cmd`, and press Enter.
4. Run:

```bash
npm install
npm run dev
```

5. Open http://localhost:3000 in your browser.

To create a production build:

```bash
npm run build
npm start
```

## Demo login roles

- **User login:** choose User login and enter any valid email plus a password (4+ characters) to enter the local demo workspace.
- **Admin login:** choose Admin login and use `admin@veyra.app` / `admin1234` to open the demo Admin Console.
- The app remembers the active demo session and current dashboard page across browser refreshes. Use **Sign out** to clear it.

**Security note:** these are front-end demo flows, not real authentication. The admin credentials are public demo credentials and must never be used for a deployed or sensitive system. Add server-side authentication and role-based authorization before production.

## Try it

- Click **Explore live demo** on the landing page, or
- Open **Sign in** and choose **Explore the demo workspace**.
- Use **Upload data** to import a CSV. Minimum requirement: a `revenue` or `sales` column. Recommended headers: `date, order_id, product, category, quantity, revenue, cost, customer, region`.
- Use **Ask VEYRA** (Decision Engine page) to chat with the copilot: live AI when a key is configured, local engine otherwise.
- Open **Reports** to download a CSV, **Goals** to set a revenue target, and the floating **What-if simulator** to test a price change.

Sample files are included for compatibility with the starter. For the Deviathon presentation, start with Operations, upload a ticket CSV, review forecast/backtest metrics, inspect ticket-level explanations, and compare the baseline with VEYRA recommendations.

## Demo mode vs production

This is a working local demo/starter, not a production-ready multi-user SaaS deployment.

- Login/signup screens are UX flows only. They do not verify passwords or create a secure account. The demo workspace is local client state.
- The **Ask VEYRA** copilot is live-AI capable: with `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, or `OPENAI_API_KEY` set, questions go to `/api/chat` and are answered by the model using your loaded business data plus the latest Operations analysis. Without a key (or if the provider errors) it falls back to the built-in deterministic engine and labels the reply "LOCAL ENGINE".
- CSV import updates in-memory state; reloading the browser restores the sample dataset.
- CSV export is implemented. PDF export uses the browser print dialog.
- CSV import is implemented. XLSX import is not yet implemented.
- Charts use sample trend/category data where indicated. Core KPI and product figures recalculate from the loaded transactions.
- Inventory alerts require inventory quantities; this starter deliberately does not invent stock data.
- Supabase and AI provider variables are placeholders only. No external service is configured by default.

## Enabling live AI (Google Gemini Interactions API, Claude, or OpenAI)

1. Copy `.env.example` to `.env.local`.
2. Set **one** of: `ANTHROPIC_API_KEY` (optional `ANTHROPIC_MODEL`, default `claude-sonnet-5-5`) or `OPENAI_API_KEY` (optional `OPENAI_MODEL`, `OPENAI_BASE_URL`). If both are set Anthropic wins unless `AI_PROVIDER=openai`.
3. Restart `npm run dev`.

Where AI is used:

| Feature | Route | Notes |
|---|---|---|
| Health check | `GET /api/health` | Reports app and AI configuration status without exposing secrets. |
| Ask VEYRA copilot | `POST /api/chat` | Sends the last 10 messages + aggregate business metrics + Operations summary (includes ticket IDs, no descriptions). `GET /api/chat` reports provider/model status. |
| AI ticket classifier | `POST /api/operations-insights` (`action: "classify"`) | Returns validated structured fields (category, urgency, sentiment, confidence...). |
| AI operations report | `POST /api/operations-insights` | Aggregate metrics + short redacted snippets only. |

All provider calls live in `lib/ai.ts` (server-only). Keys are never exposed to the browser. Routes have a basic in-memory rate limit (20 req/min per IP); use a shared store such as Redis/Upstash when deploying multiple instances.

## Add real services later

Copy `.env.example` to `.env.local` and configure a real authentication/database provider and server-side AI endpoint before enabling production use. Never expose private API keys in client-side code. For a production SaaS, add server-side validation, authorization, row-level security, rate limits, secure session handling, privacy/legal pages, and automated tests.

## Project structure

```text
veyra/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── VeyraApp.tsx
├── public/
│   ├── favicon.svg
│   ├── veyra-icon.svg
│   └── veyra-logo.svg
├── sample-data/
│   └── veyra-sample.csv
├── .env.example
├── package.json
└── README.md
```

## Deviathon-focused Operations Intelligence update

The primary workspace navigation is streamlined to the core prototype areas: Operations, Decision Engine, Reports, and Overview (Admin Console remains admin-only). Sales/revenue, inventory, pricing, and other starter routes are not promoted in the primary navigation. The user demo opens directly to Operations.

### Operations Intelligence Engine (Operations page)
The Operations page is the primary demo entry point and runs an analysis on ticket data (logic in `lib/opsEngine.ts`, UI in `components/OperationsEngine.tsx`):

- **Data:** a reproducible 1,000-ticket synthetic dataset loads by default. You can also upload your own CSV with the columns `ticket_id, created_at, due_at, priority, category, status, assignee, team, resolved_at, customer_impact` (template: `/operations-tickets-template.csv`, or use "Download sample CSV" on the page).
- **Patterns:** per-category volume, turnaround and SLA-breach rate, plus volume anomaly detection (z-score of the last 6 hours vs the same window on earlier days).
- **Bottleneck prediction:** hour-of-day arrival forecast with a trend factor, compared with team capacity; per-team utilisation flags Bottleneck / Watch / OK.
- **Explainable risk:** every open ticket gets an SLA-risk score with a plain-language reason (tickets ahead, handling time, deadline, historical breach rate). Click a row to read it.
- **Optimisation:** earliest-deadline-first assignment inside each team to the agent who is free first; tickets that can no longer be saved go last.
- **Impact:** baseline (each agent works their own queue first-in-first-out) vs recommended plan, replayed on the same open tickets: breaches, turnaround, backlog clear time, workload imbalance.

Limitations: handling time is estimated from the fastest quarter of past turnaround per category; the forecast is a statistical baseline, not a trained ML model; results are simulations, not guarantees. The synthetic dataset is generated, not real company data.

### Product direction
VEYRA is positioned around the Deviathon problem statement: identify recurring operational issues, flag bottlenecks, recommend actions with evidence, and compare baseline metrics with post-intervention outcomes. Existing visual branding, animations, login flow, admin/user separation, inventory module, theme support, and routes have been preserved.

### Forecast validation and optional live AI analyst

The Operations page now fits a transparent least-squares regression to the last 72 hourly ticket-count buckets, adjusts the next-eight-hour projection using a recent-vs-prior trend ratio, and displays rolling-origin backtest MAE, RMSE and MAPE (zero-arrival hours are excluded from MAPE). It also shows a heuristic SLA-risk precision/recall diagnostic on resolved history; this is a proxy evaluation, not a separately trained classifier or an unbiased held-out benchmark. This is a lightweight statistical regression baseline, not a deep-learning model; evaluate it on a larger real/public dataset before treating it as reliable.

The **AI ticket classifier** uses the same server-side endpoint to classify a user-pasted ticket description into category, urgency, sentiment, customer impact, confidence, rationale and next action. Ticket text is only sent to the configured provider after the user clicks Classify. The **Generate AI report** action uses the server-side `/api/operations-insights` endpoint. It sends aggregate counts, category/team metrics, risk summaries, and a small set of short ticket-description snippets (with email/phone-like strings redacted). It does not send ticket IDs or full ticket rows. The page explains this before you click the report button. To enable it:

1. Copy `.env.example` to `.env.local`.
2. Set `OPENAI_API_KEY` to your own server-side API key. Optionally set `OPENAI_MODEL` (default `gpt-4o-mini`) and `OPENAI_BASE_URL` for a compatible provider (base `/v1` URL or full `/chat/completions` URL).
3. Restart `npm run dev` and use **Generate AI report** on the Operations page.

Without a key, the rest of the local operations dashboard still works and the AI panel explains that live analysis is not configured. Never commit `.env.local` or expose the key in a `NEXT_PUBLIC_` variable.

### Public dataset validation workflow

Use **Upload ticket CSV** to import a publicly available or organization-approved dataset. The parser accepts the template headers (`ticket_id, created_at, due_at, priority, category, status, assignee, team, resolved_at, customer_impact`) and common aliases including `opened_at`, `id`, `subject`, `issue_description`, `queue`, `urgency`, `first_response_time`, `time_to_resolution`, and `satisfaction_rating` where data types permit. A suggested public benchmark is [Datanemics Support Tickets](https://datanemics.com/datasets/support-tickets/), described by its publisher as CC0 and synthetic; download the CSV and upload it from the Operations page. This source is a public benchmark, not real customer data. Some public datasets lack exact resolution timestamps or SLA deadlines, so imported metrics may be approximate; verify mappings before using results in a submission. The dashboard reports regression backtest error and baseline-vs-recommended simulation metrics. Keep the dataset's original source/license in your submission notes; do not describe synthetic sample results as results on real business data. For a credible evaluation, reserve the latest time period as a holdout set and compare predictions with observed arrivals/SLA outcomes.

### Additional decision-engine controls and metrics

- **Configurable capacity:** the Operations page has a per-agent planning-window capacity slider (1–16 hours) used by team utilisation estimates.
- **Impact-aware dispatch heuristic:** priority and deadline urgency are weighted with simple customer-impact keywords (for example, payment/refund/defect cases). This remains a transparent greedy heuristic, not a globally optimal ILP/OR-Tools solver.
- **Service quality:** first-response time and CSAT are shown when the imported dataset contains compatible fields. Synthetic demo values are clearly part of the generated demo only; imported data without these fields shows “Not supplied.” The impact section does not claim the assignment simulation improves these observed quality metrics.
- **Text classification:** the AI ticket classifier is LLM-backed when `OPENAI_API_KEY` is configured. It classifies the description entered into the classifier panel; it does not automatically rewrite every uploaded row.
