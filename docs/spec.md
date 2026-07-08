# Spec: AI for Constituency Development Planning

**Status:** Draft v1
**Stack:** Next.js · FastAPI (Python) · Supabase · Vercel

---

## 1. Problem Statement
MPs receive development requests through many disconnected channels — public meetings, letters, social media, grievance portals, direct representations — while local development plans already contain dozens of competing proposed projects. There is no objective way to:
- Consolidate citizen feedback across channels and languages
- Spot recurring needs / demand patterns
- Weigh competing proposals against real demand data (e.g. school-upgrade requests vs. enrollment + travel-distance data vs. a proposed vocational centre)

## 2. Goal
Build a multilingual AI platform where citizens submit development suggestions via **voice, text, photos, or messaging apps**. The system analyzes submissions to surface recurring themes, maps demand hotspots, and combines citizen feedback with demographic data, infrastructure gaps, local development plans, and public datasets to **recommend and rank high-priority development works** an MP's office can act on.

### Non-Goals (v1)
- Automated fund disbursement or procurement workflows
- Legal/binding prioritization decisions (system recommends, humans decide)
- Full citizen-facing case-tracking / grievance-redressal portal (only a lightweight submission + status view)

## 3. Users & Personas
- **Citizen**: Submit a suggestion/complaint quickly, in their language, with minimal literacy/tech burden.
- **MP / Constituency Office Staff**: See ranked, evidence-backed priorities; drill into raw submissions; export reports.
- **Field Coordinator / Volunteer**: Bulk-enter submissions collected offline (meetings, letters).
- **Admin**: Manage users, data sources, moderation, scoring weights.

## 4. Core Features
### 4.1 Multi-channel Submission
- Web form (text + photo upload)
- Voice note upload/recording → transcription
- WhatsApp / Telegram bot ingestion (webhook-based)
- Bulk CSV/manual entry for offline-collected letters
- Auto language detection; supports major regional languages via translation pipeline

### 4.2 NLP Processing Pipeline
- Speech-to-text (voice notes)
- Translation to a canonical working language (configurable)
- PII redaction (phone numbers, national IDs) before storage/analytics
- Entity/category extraction (sector: education, water, roads, health, electricity, etc.)
- Embedding generation for semantic clustering
- Theme clustering (recurring needs across submissions)
- Photo analysis: tag infrastructure condition (e.g., "damaged road", "no classroom roof") via vision model

### 4.3 Demand Hotspot Mapping
- Geocode submissions (village/ward/GPS if shared)
- Cluster density heatmap by sector and location
- Overlay with constituency boundary / ward shapefiles

### 4.4 Data Fusion Layer
Combine citizen submissions with:
- Demographic data (population, literacy, school enrollment, etc.)
- Infrastructure gap datasets (school/hospital distance, road condition)
- Existing local development plan (list of proposed projects, budgets, status)
- Public open datasets (census, government scheme data) — pluggable ingestion connectors

### 4.5 Prioritization / Ranking Engine
Scoring model combining, per proposed project/theme:
- Demand volume (# submissions, recency-weighted)
- Demand intensity (sentiment/urgency signals)
- Population impact (beneficiaries reachable)
- Existing gap severity (e.g., travel-distance, enrollment/seat ratio)
- Cost-to-impact estimate (if budget data available)
- Duplicate/overlap detection against existing development-plan proposals
- **Output**: ranked list per sector/ward with a transparent score breakdown (explainability is required — no black-box-only ranking).

### 4.6 MP Dashboard
- Ranked priority list with filters (sector, ward, time range)
- Map view of hotspots
- Drill-down to raw submissions supporting each ranked item
- Comparison view: "Proposal A vs Proposal B" evidence side-by-side
- Export to PDF/CSV for offline briefing

## 5. System Architecture
```
Citizens ──▶ Channels (Web, WhatsApp/Telegram webhook, Bulk upload)
│
▼
FastAPI Ingestion API ──▶ Supabase Storage (raw audio/photo)
│ │
▼ ▼
Processing Queue/Worker Supabase Postgres (submissions, metadata)
(transcribe, translate,
redact PII, embed, tag)
│
▼
Supabase Postgres + pgvector (processed data, embeddings)
│
▼
Scoring/Ranking Service (FastAPI) ──▶ Ranked priorities table
│
▼
Next.js Dashboard (MP/staff) ◀── Supabase Auth (RLS-scoped access)
```
- **Frontend**: Next.js (App Router) + Tailwind, deployed on Vercel
- **Backend**: FastAPI (Python), deployed as containerized service (Vercel Python functions for light endpoints; Fly.io/Render/Railway for long-running worker queue).
- **Database**: Supabase (Postgres + Auth + Storage + pgvector extension)
- **AI services**: pluggable — speech-to-text, translation, and embedding/LLM calls go through a provider-agnostic interface so the underlying model vendor can be swapped.

## 6. Data Model (initial)
- `submissions` (id, citizen_ref, channel, raw_text, raw_media_url, language, translated_text, sector, ward_id, lat, lng, status, created_at)
- `submission_embeddings` (submission_id, embedding vector)
- `themes` (id, label, sector, ward_id, submission_count, score, score_breakdown_json)
- `development_plan_projects` (id, title, sector, ward_id, budget, status, source)
- `wards` (id, name, boundary_geojson, population, demographic_json)
- `datasets` (id, name, source_url, ingested_at, schema_json)
- `users` (id, role: citizen/staff/mp/admin, ward_scope)

## 7. Non-Functional Requirements
- **Multilingual**: UI + submission pipeline must support at least the constituency's dominant languages.
- **Privacy**: PII redaction before any analytics use; RLS in Supabase to scope data access by role/ward.
- **Explainability**: every ranked item shows its score inputs.
- **Availability**: ingestion endpoints must degrade gracefully (queue and retry) if AI providers are slow/down.
- **Auditability**: all scoring changes and manual overrides logged.

## 8. Constraints & Open Decisions
- Frontend: **Next.js** (confirmed)
- Backend: **FastAPI / Python** (confirmed)
- Database: **Supabase** (confirmed)
- Deployment: **Vercel** (confirmed for frontend)
- Messaging integrations (WhatsApp Business API / Telegram Bot API) require API keys and business verification — treat as an external dependency with lead time.

## 9. Testing Strategy (Two Layers)
1. **Layer 1 — Unit/Component tests** (fast, run on every commit)
   - Backend: pytest for scoring logic, PII redaction, API request/response validation
   - Frontend: component tests (Vitest/Testing Library) for dashboard widgets, forms
2. **Layer 2 — Integration/E2E tests** (run pre-merge / pre-deploy, gated)
   - API integration tests against a seeded Supabase test project
   - End-to-end flow: submission → processing → appears in ranked dashboard (Playwright)
   - Contract tests for external AI provider calls (mocked + occasional live smoke test)

## 10. Success Metrics
- % of submissions successfully processed (transcribed/translated/tagged) without manual intervention
- Time from submission to appearing in dashboard
- MP office adoption: # of ranked items acted on per month
- Reduction in duplicate/redundant proposals reaching the development plan

## 11. Risks
- Low-quality speech-to-text for regional dialects
- Citizen trust / privacy concerns with photo and voice submission
- Data quality of public/government datasets (staleness, format drift)
- Gaming the system (coordinated mass submissions skewing demand signal)
