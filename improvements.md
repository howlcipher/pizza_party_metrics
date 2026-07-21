# 🚀 Improvement Backlog

This document is the authoritative, ranked backlog for the Pizza Party Metrics project.

## Working Protocol

1. **Open a task journal.** Update it and commit at every milestone.
2. **Re-evaluate the model.** Pick the least expensive available model that can do the job well.
3. **Route the crafted skills.** Check the skills manifest for skills matching the task.
4. **Scan for helpful free tools.** Consider whether a free or open source tool would materially improve the work.
5. **Finish the loop.** Every code change ships with relevant automated tests. Verify the change works end to end, commit, and push.

## Ranked Backlog (best ROI first)

Pending rows are ranked by a diminishing-returns score, recomputed at every groom:

**Score = (Value × Decay) ÷ Effort**

- **Value (1–8):** pain or risk removed if the item ships.
- **Decay:** geometric halving per already-shipped item in the same theme (1.0 → 0.5 → 0.25 …).
- **Effort (1–8):** roughly log-scale; 1 = minutes, 8 = weeks.
- **ROI floor = 0.5:** items scoring below the floor stay open but are flagged ⚠️.

| # | Improvement | Status | Score (V×D÷E) | Claude model | Gemini model | ROI rationale |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | [Agent Suggestion] Frontend: Rendering Efficiency (useMemo) | Done (2026-07-21) | 4.00 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 8 (Major performance fix) * 1.0 / 2 = 4.00 |
| 2 | [Agent Suggestion] DevOps: Enforce Strict Dependency Versioning and Enable Caching | Done (2026-07-21) | 3.50 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 7 (Fixes flakey builds) * 1.0 / 2 = 3.50 |
| 4 | [Agent Suggestion] Data Transparency: Raw Data Export & Reproducibility | Pending | 3.50 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 7 (Ensures reproducibility) * 1.0 / 2 = 3.50 |
| 5 | [Agent Suggestion] Data Pipeline: Add Module-Level Documentation & Decouple Configuration | Pending | 3.00 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 6 (Good code hygiene) * 1.0 / 2 = 3.00 |
| 6 | [Agent Suggestion] Accessibility: Form Control Association & ARIA charts | Pending | 2.66 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 8 (Compliance issue) * 1.0 / 3 = 2.66 |
| 7 | [Agent Suggestion] Data Pipeline: Defensive Network Requests & Error Handling | Pending | 2.66 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 8 (Prevents crashes) * 1.0 / 3 = 2.66 |
| 8 | [Agent Suggestion] Data Transparency: Analytics Methodology Page | Pending | 2.66 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 8 (Addresses data trust) * 1.0 / 3 = 2.66 |
| 9 | [Agent Suggestion] Data Pipeline: Ingestion Layer Quality Checks | Pending | 2.00 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 8 (Stops bad pipelines) * 1.0 / 4 = 2.00 |
| 3 | [Agent Suggestion] UI/UX: Reset Filters CTA | Pending | 1.75 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 7 (Saves users from dead ends) * 0.5 (decay) / 2 = 1.75 |
| 10 | [Agent Suggestion] Data Pipeline: Vectorize Pandas Operations | Pending | 1.75 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 7 (Idiomatic & fast) * 1.0 / 4 = 1.75 |
| 11 | [Agent Suggestion] Async Collaboration Velocity Metric | Pending | 1.60 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 8 (Proves thesis) * 1.0 / 5 = 1.60 |
| 12 | [Agent Suggestion] Data Pipeline: Real GitHub Collaboration Data Integration | Pending | 1.60 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 8 (Mandate for real data) * 1.0 / 5 = 1.60 |
| 13 | [Agent Suggestion] Documentation & Knowledge Transfer Health | Pending | 1.40 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 7 (Strong proxy for collab) * 1.0 / 5 = 1.40 |
| 14 | Live Data Ingestion API / Backend | Pending | 1.33 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 8 (Core requirement) * 1.0 / 6 = 1.33 |
| 15 | [Agent Suggestion] Cross-Time-Zone Collaboration Index | Pending | 1.16 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 7 (Remote advantage) * 1.0 / 6 = 1.16 |
| 16 | [Agent Suggestion] DevOps: Implement Multi-Stage Job Separation with Quality & Security Gates | Pending | 1.00 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 8 (Security) * 0.5 (decay) / 4 = 1.00 |
| 17 | Theme Options: Light, Dark, and Color-blind Modes | Pending | 0.88 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 7 (high UX value) * 0.5 (decay) / 4 = 0.88 |
| 18 | [Agent Suggestion] DevOps: Isolate ETL Data Pipeline and Ensure Idempotency | Pending | 0.88 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 7 (Decouples failure) * 0.5 (decay) / 4 = 0.88 |
| 19 | [Agent Suggestion] Meeting vs. Maker Time Analysis | Pending | 0.88 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 7 (Actionable insight) * 0.5 (decay) / 4 = 0.88 |
| 20 | Interruption & Context Switch Impact Dashboard | Pending | 0.80 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 8 (High value) * 0.5 (decay) / 5 = 0.80 |
| 21 | Stereotype Pizza Parlor Aesthetic Overhaul | Pending | 0.60 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 6 (Fun branding) * 0.5 (decay) / 5 = 0.60 |
| 22 | [Agent Suggestion] Predictive Burnout Modeling | Pending | 0.50 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 6 (Advanced ML) * 0.5 (decay) / 6 = 0.50 |
| 23 | Demographic Analytics (Age, Industry, Gender) | Done (2026-07-21) | - | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | Shipped! |

## Details

### 1. [Agent Suggestion] Frontend: Rendering Efficiency (useMemo)
**Description:** Extract the unique options lists (industries, ageGroups, workSetups) into a `useMemo` hook in `PizzaBoxFilter.jsx` to prevent calculating a 100KB dataset on every re-render.
**Context:** Based on the `frontend_engineering` skill. Currently recalculates `[...new Set(...)]` on every re-render, creating severe UI lag.
**Done note (2026-07-21):** Extracted `industries`, `ageGroups`, and `workSetups` computations into a single `useMemo` hook dependent on `data` to prevent recalculation on every re-render.

### 2. [Agent Suggestion] DevOps: Enforce Strict Dependency Versioning and Enable Caching
**Description:** Update `deploy.yml` to use `npm ci` exclusively and enable caching for both `setup-python` (`cache: 'pip'`) and `setup-node` (`cache: 'npm'`).
**Context:** Based on the `devops` skill. Prevents unverified versions from breaking builds and improves speed.
**Done note (2026-07-21):** Added caching for pip and npm and changed the frontend install step to strictly use npm ci.

### 3. [Agent Suggestion] UI/UX: Reset Filters CTA
**Description:** Add a "Reset Filters" CTA button when a combination of filters yields no results ("No slices left!").
**Context:** Based on the `ui_ux` skill to reduce friction and cognitive load for the user trying to exit a dead-end state.

### 4. [Agent Suggestion] Data Transparency: Raw Data Export & Reproducibility
**Description:** Allow users to export the exact immutable datasets used by the dashboard (CSV/JSON format), alongside the random seed configurations, to ensure full reproducibility of all claims.
**Context:** Aligns with the `data_analyst` skill (Principle 1) and proves the "collaboration works better remote" thesis is based on real verifiable data, not just rhetoric.

### 5. [Agent Suggestion] Data Pipeline: Add Module-Level Documentation & Decouple Configuration
**Description:** Add a structured module-level docstring to `etl.py` and move hardcoded URLs to top-level constants.
**Context:** Enforces `data_analyst` reporting standards and `software_development` low coupling principles.

### 6. [Agent Suggestion] Accessibility: Form Control Association & ARIA charts
**Description:** Map `<label>` elements to `<select>` tags using `htmlFor` and `id`. Add `.sr-only` descriptions or `aria-labels` to the Recharts graphics.
**Context:** Based on the `accessibility` skill for WCAG compliance.

### 7. [Agent Suggestion] Data Pipeline: Defensive Network Requests & Error Handling
**Description:** Wrap all API and download calls (`requests.get`) in `etl.py` with explicit `timeout=15` settings and `try...except` blocks emitting structured JSON logs.
**Context:** Enforces `software_development` guidelines for strict error handling and resilience.

### 8. [Agent Suggestion] Data Transparency: Analytics Methodology Page
**Description:** Create a dedicated methodology view (or modal) explaining exactly how metrics (like the Pizza Party Index and Velocity Proxy) are derived from the raw data. Fulfills the requirement for structured documentation of analytical objectives, data sources, and inputs.
**Context:** Derived from the `data_analyst` documentation principles to establish maximum trust in the remote-work statistics being presented.

### 9. [Agent Suggestion] Data Pipeline: Ingestion Layer Quality Checks
**Description:** Implement strict assertions at the ETL ingestion layer to check for missing values (`NaN`), duplicates, and data type inconsistencies. Fail the pipeline loudly if the source datasets degrade in quality.
**Context:** Directly enforces the `data_analyst` "Data Quality" principle, preventing corrupted real-world data from skewing the collaboration metrics.

### 10. [Agent Suggestion] Data Pipeline: Vectorize Pandas Operations
**Description:** Refactor the `process_data` function in `etl.py` to use vectorized pandas operations instead of iterating with `.iloc[0]`.
**Context:** Adheres to `data_analyst` principles for optimal DataFrame performance and readability.

### 11. [Agent Suggestion] Async Collaboration Velocity Metric
**Description:** Measure and compare PR merge times and issue resolution times across different work setups (remote vs hybrid vs onsite). Use data from GitHub APIs or similar sources to prove that async, remote-first workflows actually lead to faster or higher-quality task completion, countering the claim that in-person collaboration is always faster.
**Context:** Addresses the core product thesis by providing hard data that remote teams can outpace onsite teams when it comes to concrete deliverables.

### 12. [Agent Suggestion] Data Pipeline: Real GitHub Collaboration Data Integration
**Description:** Expand the `etl.py` script to pull live, real-world data (e.g., from WFH Research APIs, GitHub GraphQL, or similar) to accurately power the collaboration and velocity metrics, fulfilling the mandate to strictly use "real data".
**Context:** Ensures that the metrics are not using mock proxies, adhering to data integrity and the project's primary thesis.

### 13. [Agent Suggestion] Documentation & Knowledge Transfer Health
**Description:** Analyze the volume and quality of written documentation (wiki updates, PR descriptions, ADRs) to prove remote teams over-index on scalable knowledge transfer compared to the ephemeral, unrecorded watercooler chats of onsite teams.
**Context:** Quantifies the often-ignored benefit of remote work: forcing teams to build a robust, searchable knowledge base.

### 14. Live Data Ingestion API / Backend
**Description:** Build a backend or integration layer (e.g., WebSockets or a polling API) to ingest real and live data for the dashboard, replacing any static or mocked data.
**Context:** Required to fulfill the "real and live data" mandate.

### 15. [Agent Suggestion] Cross-Time-Zone Collaboration Index
**Description:** Highlight the "follow the sun" advantage of remote teams by visualizing 24/7 continuous output metrics. This shows how distributed teams can keep projects moving around the clock without individual burnout.
**Context:** Demonstrates a unique structural advantage of remote work that in-office environments fundamentally cannot replicate.

### 16. [Agent Suggestion] DevOps: Implement Multi-Stage Job Separation with Quality & Security Gates
**Description:** Split the monolithic `build-and-deploy` job in `deploy.yml` into `validate`, `build`, and `deploy` jobs with security scanning (Trivy/npm audit).
**Context:** Aligns with `devops` constraints ensuring security and logical environment isolation.

### 17. Theme Options: Light, Dark, and Color-blind Modes
**Description:** Add a theme switcher that allows users to toggle between Light Mode, Dark Mode (currently default), and a Color-blind friendly mode.
**Context:** This improves accessibility (see `accessibility` skill) and gives users control over their dashboard viewing experience.

### 18. [Agent Suggestion] DevOps: Isolate ETL Data Pipeline and Ensure Idempotency
**Description:** Extract the Python ETL script to its own `data-pipeline` GitHub Actions job and pass the JSON artifact to the `build` job.
**Context:** Ensures absolute separation between the Python execution environment and Node.js build per `devops_sre` standards.

### 19. [Agent Suggestion] Meeting vs. Maker Time Analysis
**Description:** Analyze calendar data to show the ratio of uninterrupted "Maker Time" versus fragmented "Meeting Time."
**Context:** A natural extension to the context-switching metrics that provides highly actionable insights for teams.

### 20. Interruption & Context Switch Impact Dashboard
**Description:** Visualize how interruptions destroy context switching. We need to track the frequency of interruptions (e.g., Slack messages, ad-hoc calls) and correlate them with task completion times or velocity drops.
**Context:** This requires tracking the "cost" of a context switch. As defined by the product strategy (MVP), we should start with a simple time-loss calculation before moving to complex models.

### 21. Stereotype Pizza Parlor Aesthetic Overhaul
**Description:** Redesign the dashboard to lean heavily into a stereotypical pizza parlor theme. Think red and white checkered tablecloth patterns, Italian flag color accents (green/red/white), and rustic UI elements.
**Context:** A fun branding exercise that gives the dashboard a unique identity compared to generic SaaS dashboards.

### 22. [Agent Suggestion] Predictive Burnout Modeling
**Description:** Use the `data_analyst` skill principles (scikit-learn pipelines, fixed random seeds) to build a machine learning model that predicts burnout risk based on interruption frequency and sustained high-workload periods.
**Context:** Adds predictive value rather than just historical reporting.

### 23. Demographic Analytics (Age, Industry, Gender)
**Description:** Add demographic breakdowns to the metrics. Understand how different age ranges, industries, and genders interact with the product or experience different levels of productivity.
**Context:** Ensure data pipelines aggregate this securely and anonymized. 
**Done note (2026-07-21):** Implemented new UI components using Recharts for Age and Gender breakdowns. Data structure updated to support these dimensions, and the dashboard aesthetic upgraded to dark mode.
