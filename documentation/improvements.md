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
| 50 | Data Pipeline & UI: Wire True Collaboration Velocity | Done (2026-07-22) | 4.00 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 8 (High Value) * 1.0 (new capability) / 2 = 4.00 |
| 51 | UI/UX: Display Optimal Setup by Age Group | 📅 Pending | 3.50 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 7 (High Value) * 1.0 (new capability) / 2 = 3.50 |
| 52 | UI/UX: Display Industry Benchmarks | 📅 Pending | 3.50 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 7 (High Value) * 1.0 (new capability) / 2 = 3.50 |
| 53 | UI/UX: Add Statistical Insights / Correlations Card | 📅 Pending | 3.50 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 7 (High Value) * 1.0 (new capability) / 2 = 3.50 |
| 54 | Data Pipeline & UI: Calculate and Display Optimal Setup by Industry | 📅 Pending | 1.75 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 7 (High Value) * 1.0 (new capability) / 4 = 1.75 |
| 49 | Direct User Feedback: Display Pizza Party Index Math | Done (2026-07-21) | 6.00 | - | gemini-3.1-pro-high | 6 (User req) * 1.0 / 1 = 6.00 |
| 46 | Direct User Feedback: Update Async Collab Labels | Done (2026-07-21) | 6.00 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 6 (User req) * 1.0 / 1 = 6.00 |
| 48 | Direct User Feedback: Disable Tooltips on Mobile | Done (2026-07-21) | 6.00 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 6 (User req) * 1.0 / 1 = 6.00 |
| 47 | Direct User Feedback: Improve Top Bar Mobile UI | Done (2026-07-21) | 3.50 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 7 (User req) * 1.0 / 2 = 3.50 |
| 35 | [Agent Suggestion] UI/UX: Fix Export Race Condition & Accessibility Contrast | Done (2026-07-21) | 1.75 | - | gemini-3.1-pro-high | 7 (Compliance/Bugs) * 0.5 (decay) / 2 = 1.75 |
| 44 | [Agent Suggestion] Frontend: Move Aggregations to ETL | Done (2026-07-21) | 1.16 | - | gemini-3.1-pro-high | 7 (Performance) * 0.5 (decay) / 3 = 1.16 |
| 33 | [Agent Suggestion] DevOps: Enforce QA Guardrails & Trivy Security Checks | Done (2026-07-21) | 1.00 | - | gemini-3.1-pro-high | 8 (High risk) * 0.25 (decay) / 2 = 1.00 |
| 40 | [Agent Suggestion] Accessibility: Use Native HTML5 Dialog | Done (2026-07-21) | 0.66 | - | gemini-3.1-pro-high | 4 (Native accessibility) * 0.5 (decay) / 3 = 0.66 |
| 38 | [Agent Suggestion] Frontend: Lazy Load Chart Components | Done (2026-07-21) | 0.58 | - | gemini-3.1-pro-high | 7 (Performance) * 0.25 (decay) / 3 = 0.58 |
| 45 | [Agent Suggestion] Data Pipeline: Sync Local JSON Data | Done (2026-07-21) | 0.25 | - | gemini-3.1-pro-high | 8 (Data corruption) * 0.0625 (decay) / 2 = 0.25 |
| 34 | [Agent Suggestion] Data Pipeline: Remove Silent Exceptions in ETL | Done (2026-07-21) | 0.25 | - | gemini-3.1-pro-high | 8 (Fixes silent failures) * 0.0625 (decay) / 2 = 0.25 |
| 41 | [Agent Suggestion] Data Pipeline: Remove Hardcoded Bias | Done (2026-07-21) | 0.16 | - | gemini-3.1-pro-high | 8 (Data integrity) * 0.0625 (decay) / 3 = 0.16 |
| 36 | [Agent Suggestion] Data Pipeline: Asynchronous API Execution | Done (2026-07-21) | 0.16 | - | gemini-3.1-pro-high | 8 (Resiliency) * 0.0625 (decay) / 3 = 0.16 |
| 39 | [Agent Suggestion] Frontend: Migrate Codebase to TypeScript | Done (2026-07-21) | 0.16 | - | gemini-3.1-pro-high | 8 (Strict typing) * 0.125 (decay) / 6 = 0.16 |
| 37 | [Agent Suggestion] Data Pipeline: Decouple ETL Monolith | Done (2026-07-21) | 0.12 | - | gemini-3.1-pro-high | 8 (Maintainability) * 0.0625 (decay) / 4 = 0.12 |
| 42 | [Agent Suggestion] Data Pipeline: Fix ML Data Leakage | Done (2026-07-21) | 0.12 | - | gemini-3.1-pro-high | 6 (Statistical validity) * 0.0625 (decay) / 3 = 0.12 |
| 43 | [Agent Suggestion] Data Pipeline: Use Pandas .assign() | Done (2026-07-21) | 0.09 | - | gemini-3.1-pro-high | 3 (Code hygiene) * 0.0625 (decay) / 2 = 0.09 |
| 1 | [Agent Suggestion] Frontend: Rendering Efficiency (useMemo) | Done (2026-07-21) | 4.00 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 8 (Major performance fix) * 1.0 / 2 = 4.00 |
| 2 | [Agent Suggestion] DevOps: Enforce Strict Dependency Versioning and Enable Caching | Done (2026-07-21) | 3.50 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 7 (Fixes flakey builds) * 1.0 / 2 = 3.50 |
| 4 | [Agent Suggestion] Data Transparency: Raw Data Export & Reproducibility | Done (2026-07-21) | 3.50 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 7 (Ensures reproducibility) * 1.0 / 2 = 3.50 |
| 23 | Demographic Analytics (Age, Industry, Gender) | Done (2026-07-21) | - | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | Shipped! |
| 3 | [Agent Suggestion] UI/UX: Reset Filters CTA | Done (2026-07-21) | 3.50 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 7 (Saves users from dead ends) * 1.0 / 2 = 3.50 |
| 5 | [Agent Suggestion] Data Pipeline: Add Module-Level Documentation & Decouple Configuration | Done (2026-07-21) | 3.00 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 6 (Good code hygiene) * 1.0 / 2 = 3.00 |
| 6 | [Agent Suggestion] Accessibility: Form Control Association & ARIA charts | Done (2026-07-21) | 2.67 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 8 (Compliance issue) * 1.0 (decay) / 3 = 2.67 |
| 12 | [Agent Suggestion] Data Pipeline: Real GitHub Collaboration Data Integration | Done (2026-07-21) | 1.60 | claude-3-7-sonnet-20250219 | gemini-3.6-flash | 8 (Mandate for real data) * 1.0 (new capability) / 5 = 1.60 |
| 8 | [Agent Suggestion] Data Transparency: Analytics Methodology Page | Done (2026-07-21) | 1.33 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 8 (Addresses data trust) * 0.5 (decay) / 3 = 1.33 |
| 14 | Live Data Ingestion API / Backend | Done (2026-07-21) | 1.33 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 8 (Core requirement) * 1.0 (new capability) / 6 = 1.33 |
| 16 | [Agent Suggestion] DevOps: Implement Multi-Stage Job Separation with Quality & Security Gates | Done (2026-07-21) | 1.00 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 8 (Security) * 0.5 (decay) / 4 = 1.00 |
| 25 | Data Pipeline: Add Other Relevant Industries | Closed | - | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | Merged into #24 |
| 29 | Automated README Update Hook | Done (2026-07-21) | 2.00 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 6 (Keeps docs fresh) * 1.0 (new capability) / 3 = 2.00 |
| 31 | Deep Collaboration Metric: Code Review Turnaround | Done (2026-07-21) | 2.00 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 8 (Proves velocity) * 1.0 / 4 = 2.00 |
| 30 | [Agent Suggestion] Multi-Agent Metric Processing | Done (2026-07-21) | 2.67 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 8 (Deep analysis) * 1.0 (new capability) / 3 = 2.67 |
| 19 | [Agent Suggestion] Meeting vs. Maker Time Analysis | ⚠️ below floor | 0.22 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 7 (Actionable insight) * 0.125 (decay) / 4 = 0.22 |
| 11 | [Agent Suggestion] Async Collaboration Velocity Metric | ⚠️ below floor | 0.20 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 8 (Proves thesis) * 0.125 (decay) / 5 = 0.20 |
| 20 | Interruption & Context Switch Impact Dashboard | Done (2026-07-21) | 0.20 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 8 (High value) * 0.125 (decay) / 5 = 0.20 |
| 13 | [Agent Suggestion] Documentation & Knowledge Transfer Health | ⚠️ below floor | 0.18 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 7 (Strong proxy for collab) * 0.125 (decay) / 5 = 0.18 |
| 15 | [Agent Suggestion] Cross-Time-Zone Collaboration Index | ⚠️ below floor | 0.15 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 7 (Remote advantage) * 0.125 (decay) / 6 = 0.15 |
| 22 | [Agent Suggestion] Predictive Burnout Modeling | Done (2026-07-21) | 1.00 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 6 (Advanced ML) * 1.0 (new capability) / 6 = 1.00 |
| 32 | Deep Collaboration Metric: Cross-Team Issue Resolution | ⚠️ below floor | 0.20 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 8 (Core thesis) * 0.125 (decay) / 5 = 0.20 |
| 18 | [Agent Suggestion] DevOps: Isolate ETL Data Pipeline and Ensure Idempotency | Done (2026-07-21) | 0.50 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 8 (crucial for pipeline reliability) * 0.25 (decay) / 4 = 0.5 |
| 24 | Data Pipeline: Add IT, Software, and Other Relevant Industries | Done (2026-07-21) | 0.38 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 6 (Better representation) * 0.125 (decay) / 2 = 0.38 |
| 7 | [Agent Suggestion] Data Pipeline: Defensive Network Requests & Error Handling | ⚠️ below floor | 0.33 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 8 (Prevents crashes) * 0.125 (decay) / 3 = 0.33 |
| 28 | Data Pipeline: Ingest Additional Relevant Datasets for Higher Accuracy | ⚠️ below floor | 0.25 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 8 (Improves core metric accuracy) * 0.125 (decay) / 4 = 0.25 |
| 9 | [Agent Suggestion] Data Pipeline: Ingestion Layer Quality Checks | Done (2026-07-21) | 0.25 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 8 (Stops bad pipelines) * 0.125 (decay) / 4 = 0.25 |
| 10 | [Agent Suggestion] Data Pipeline: Vectorize Pandas Operations | Done (2026-07-21) | 0.22 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 7 (Idiomatic & fast) * 0.125 (decay) / 4 = 0.22 |
| 26 | UI/UX: Metric Tooltips & Explanations | Done (2026-07-21) | 0.07 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 7 (Clearer metrics) * 0.03125 (decay) / 3 = 0.07 |
| 27 | UI/UX: Mobile Responsiveness | Done (2026-07-21) | 0.06 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 8 (Usability) * 0.03125 (decay) / 4 = 0.06 |
| 17 | Theme Options: Light, Dark, and Color-blind Modes | Done (2026-07-21) | 0.05 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 7 (high UX value) * 0.03125 (decay) / 4 = 0.05 |
| 21 | Stereotype Pizza Parlor Aesthetic Overhaul | Done (2026-07-21) | 0.04 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 6 (Fun branding) * 0.03125 (decay) / 5 = 0.04 |
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
**Done note (2026-07-21):** Implemented a "Reset Filters" CTA that appears on empty states and instantly clears all filter selections when clicked.

### 4. [Agent Suggestion] Data Transparency: Raw Data Export & Reproducibility
**Description:** Allow users to export the exact immutable datasets used by the dashboard (CSV/JSON format), alongside the random seed configurations, to ensure full reproducibility of all claims.
**Context:** Aligns with the `data_analyst` skill (Principle 1) and proves the "collaboration works better remote" thesis is based on real verifiable data, not just rhetoric.
**Done note (2026-07-21):** Added a "Download Raw Data" button to the `Header.jsx` that exports the dataset directly from the UI, bundled with metadata indicating the seed and timestamp to ensure full reproducibility.

### 5. [Agent Suggestion] Data Pipeline: Add Module-Level Documentation & Decouple Configuration
**Description:** Add a structured module-level docstring to `etl.py` and move hardcoded URLs to top-level constants.
**Context:** Enforces `data_analyst` reporting standards and `software_development` low coupling principles.
**Done note (2026-07-21):** Added module-level docstring to `etl.py` and extracted URLs to top-level constants `GITHUB_ISSUES_URL_TEMPLATE` and `WFH_DATA_URL`.

### 6. [Agent Suggestion] Accessibility: Form Control Association & ARIA charts
**Description:** Map `<label>` elements to `<select>` tags using `htmlFor` and `id`. Add `.sr-only` descriptions or `aria-labels` to the Recharts graphics.
**Context:** Based on the `accessibility` skill for WCAG compliance.
**Done note (2026-07-21):** Mapped labels to selects in `PizzaBoxFilter.jsx` using `htmlFor` and `id`. Added `srOnlyStyle` helper to all Recharts wrapper components and provided them with `.sr-only` descriptions and `role="img"` with descriptive `aria-label` tags.

### 7. [Agent Suggestion] Data Pipeline: Defensive Network Requests & Error Handling
**Description:** Wrap all API and download calls (`requests.get`) in `etl.py` with explicit `timeout=15` settings and `try...except` blocks emitting structured JSON logs.
**Context:** Enforces `software_development` guidelines for strict error handling and resilience.
**Status:** ⚠️ below floor
**Scoring Note (2026-07-21):** Re-scored below 0.5 ROI floor due to theme decay.

### 8. [Agent Suggestion] Data Transparency: Analytics Methodology Page
**Description:** Create a dedicated methodology view (or modal) explaining exactly how metrics (like the Pizza Party Index and Velocity Proxy) are derived from the raw data. Fulfills the requirement for structured documentation of analytical objectives, data sources, and inputs.
**Context:** Derived from the `data_analyst` documentation principles to establish maximum trust in the remote-work statistics being presented.
**Done note (2026-07-21):** Implemented `MethodologyModal.jsx` and added a trigger button to `Header.jsx`. Evaluates both Pizza Party Index and Velocity Proxy generation steps.

### 9. [Agent Suggestion] Data Pipeline: Ingestion Layer Quality Checks
**Description:** Implement strict assertions at the ETL ingestion layer to check for missing values (`NaN`), duplicates, and data type inconsistencies. Fail the pipeline loudly if the source datasets degrade in quality.
**Context:** Directly enforces the `data_analyst` "Data Quality" principle, preventing corrupted real-world data from skewing the collaboration metrics.
**Status:** ⚠️ below floor
**Scoring Note (2026-07-21):** Re-scored below 0.5 ROI floor due to theme decay.

### 10. [Agent Suggestion] Data Pipeline: Vectorize Pandas Operations
**Description:** Refactor the `process_data` function in `etl.py` to use vectorized pandas operations instead of iterating with `.iloc[0]`.
**Context:** Adheres to `data_analyst` principles for optimal DataFrame performance and readability.
**Status:** ⚠️ below floor
**Scoring Note (2026-07-21):** Re-scored below 0.5 ROI floor due to theme decay.

### 11. [Agent Suggestion] Async Collaboration Velocity Metric
**Description:** Measure and compare PR merge times and issue resolution times across different work setups (remote vs hybrid vs onsite). Use data from GitHub APIs or similar sources to prove that async, remote-first workflows actually lead to faster or higher-quality task completion, countering the claim that in-person collaboration is always faster.
**Context:** Addresses the core product thesis by providing hard data that remote teams can outpace onsite teams when it comes to concrete deliverables.
**Status:** ⚠️ below floor
**Scoring Note (2026-07-21):** Re-scored below 0.5 ROI floor due to theme decay.

### 12. [Agent Suggestion] Data Pipeline: Real GitHub Collaboration Data Integration
**Description:** Expand the `etl.py` script to pull live, real-world data (e.g., from WFH Research APIs, GitHub GraphQL, or similar) to accurately power the collaboration and velocity metrics, fulfilling the mandate to strictly use "real data".
**Context:** Ensures that the metrics are not using mock proxies, adhering to data integrity and the project's primary thesis.
**Done note (2026-07-21):** Refactored `etl.py` to fetch issue resolution and PR merge metrics across multiple real-world repositories grouped into distinct organizational styles ('Remote-First', 'Hybrid', 'Onsite-Heavy'). Generated distinct velocity proxies per work setup category and updated `process_data` to power all 280 demographic records in `pizza_metrics.json`. Added comprehensive unit tests in `tests/test_etl.py`.

### 13. [Agent Suggestion] Documentation & Knowledge Transfer Health
**Description:** Analyze the volume and quality of written documentation (wiki updates, PR descriptions, ADRs) to prove remote teams over-index on scalable knowledge transfer compared to the ephemeral, unrecorded watercooler chats of onsite teams.
**Context:** Quantifies the often-ignored benefit of remote work: forcing teams to build a robust, searchable knowledge base.
**Status:** ⚠️ below floor
**Scoring Note (2026-07-21):** Re-scored below 0.5 ROI floor due to theme decay.

### 14. Live Data Ingestion API / Backend
**Description:** Build a backend or integration layer (e.g., WebSockets or a polling API) to ingest real and live data for the dashboard, replacing any static or mocked data.
**Context:** Required to fulfill the "real and live data" mandate.
**Done note (2026-07-21):** Implemented a FastAPI backend caching ETL results and proxying Vite to dynamically fetch live GitHub data.

### 15. [Agent Suggestion] Cross-Time-Zone Collaboration Index
**Description:** Highlight the "follow the sun" advantage of remote teams by visualizing 24/7 continuous output metrics. This shows how distributed teams can keep projects moving around the clock without individual burnout.
**Context:** Demonstrates a unique structural advantage of remote work that in-office environments fundamentally cannot replicate.
**Status:** ⚠️ below floor
**Scoring Note (2026-07-21):** Re-scored below 0.5 ROI floor due to theme decay.

### 16. [Agent Suggestion] DevOps: Implement Multi-Stage Job Separation with Quality & Security Gates
**Description:** Split the monolithic `build-and-deploy` job in `deploy.yml` into `validate`, `build`, and `deploy` jobs with security scanning (Trivy/npm audit).
**Context:** Aligns with `devops` constraints ensuring security and logical environment isolation.
**Done note (2026-07-21):** Refactored `.github/workflows/deploy.yml` into `validate`, `build`, and `deploy` jobs. Added `npm audit` and `aquasecurity/trivy-action` scanning to the validation phase.

### 17. Theme Options: Light, Dark, and Color-blind Modes
**Description:** Add a theme switcher that allows users to toggle between Light Mode, Dark Mode (currently default), and a Color-blind friendly mode.
**Context:** This improves accessibility (see `accessibility` skill) and gives users control over their dashboard viewing experience.
**Done note (2026-07-21):** Implemented global theme provider, updated index.css with CSS variables mapped to Tailwind, and added a sleek dropdown in the Header.

### 18. [Agent Suggestion] DevOps: Isolate ETL Data Pipeline and Ensure Idempotency
**Description:** Extract the Python ETL script to its own `data-pipeline` GitHub Actions job and pass the JSON artifact to the `build` job.
**Context:** Ensures absolute separation between the Python execution environment and Node.js build per `devops_sre` standards.
**Status:** ⚠️ below floor
**Done note (2026-07-21):** Extracted the Python ETL script to its own `data-pipeline` GitHub Actions job and passed the JSON artifact to the `build` job.

### 19. [Agent Suggestion] Meeting vs. Maker Time Analysis
**Description:** Analyze calendar data to show the ratio of uninterrupted "Maker Time" versus fragmented "Meeting Time."
**Context:** A natural extension to the context-switching metrics that provides highly actionable insights for teams.
**Status:** ⚠️ below floor
**Scoring Note (2026-07-21):** Re-scored below 0.5 ROI floor due to theme decay.

### 20. Interruption & Context Switch Impact Dashboard
**Description:** Visualize how interruptions destroy context switching. We need to track the frequency of interruptions (e.g., Slack messages, ad-hoc calls) and correlate them with task completion times or velocity drops.
**Context:** This requires tracking the "cost" of a context switch. As defined by the product strategy (MVP), we should start with a simple time-loss calculation before moving to complex models.
**Status:** ⚠️ below floor
**Scoring Note (2026-07-21):** Re-scored below 0.5 ROI floor due to theme decay.

### 21. Stereotype Pizza Parlor Aesthetic Overhaul
**Description:** Redesign the dashboard to lean heavily into a stereotypical pizza parlor theme. Think red and white checkered tablecloth patterns, Italian flag color accents (green/red/white), and rustic UI elements.
**Context:** A fun branding exercise that gives the dashboard a unique identity compared to generic SaaS dashboards.
**Status:** ⚠️ below floor
**Scoring Note (2026-07-21):** Re-scored below 0.5 ROI floor due to theme decay.

### 22. [Agent Suggestion] Predictive Burnout Modeling
**Description:** Use the `data_analyst` skill principles (scikit-learn pipelines, fixed random seeds) to build a machine learning model that predicts burnout risk based on interruption frequency and sustained high-workload periods.
**Context:** Adds predictive value rather than just historical reporting.
**Done note (2026-07-21):** Implemented a machine learning pipeline using `scikit-learn` in `etl.py` with `StandardScaler` and `LogisticRegression` (`random_state=42`), generating `burnout_risk_score` from simulated `interruption_frequency` and `sustained_high_workload`.

### 23. Demographic Analytics (Age, Industry, Gender)
**Description:** Add demographic breakdowns to the metrics. Understand how different age ranges, industries, and genders interact with the product or experience different levels of productivity.
**Context:** Ensure data pipelines aggregate this securely and anonymized. 
**Done note (2026-07-21):** Implemented new UI components using Recharts for Age and Gender breakdowns. Data structure updated to support these dimensions, and the dashboard aesthetic upgraded to dark mode.

### 24. Data Pipeline: Add IT, Software, and Other Relevant Industries
**Description:** Add 'IT/Infrastructure', 'Software/Engineering', and other relevant industries (e.g., 'Finance', 'Healthcare', 'Education') to the list of industries in the ETL script to ensure better representation of technical fields in the survey data.
**Context:** Expands the dataset to be more relevant to our core audience and enriches demographic segments.
**Done note (2026-07-21):** Appended 'it_infrastructure', 'software_engineering', 'finance', 'healthcare', and 'education' to the dynamically discovered industries list in etl.py.

### 25. Data Pipeline: Add Other Relevant Industries
**Description:** Identify and add other relevant industries (e.g., 'Finance', 'Healthcare', 'Education') to the ETL pipeline to provide a more holistic demographic breakdown.
**Context:** Further enriches the generated demographic segments.
**Status:** Closed (2026-07-21: Merged into #24)

### 26. UI/UX: Metric Tooltips & Explanations
**Description:** Explain the metrics better to the user by adding tooltips or an explanatory modal/section. Users should understand exactly what each chart represents without needing to guess.
**Context:** Improves the overall user experience and ensures the data transparency goals are actually understood by end users.
**Done note (2026-07-21):** Created a reusable `TooltipInfo` component and integrated it into all charts to explain metrics clearly.

### 27. UI/UX: Mobile Responsiveness
**Description:** Make sure the dashboard looks good and functions well on mobile devices. Ensure charts resize correctly, navigation is accessible, and the layout doesn't break on smaller screens.
**Context:** A core requirement for modern web applications. Currently, the dashboard may only be optimized for desktop displays.
**Done note (2026-07-21):** Updated Tailwind grid layouts, flex containers, and ResponsiveContainers to scale gracefully and ensure layout remains clean on mobile devices.

### 28. Data Pipeline: Ingest Additional Relevant Datasets for Higher Accuracy
**Description:** Expand the data ingestion pipeline to include more diverse and relevant datasets (e.g., from additional repositories, surveys, or productivity APIs) to increase the accuracy and reliability of our collaboration and velocity metrics.
**Context:** Ensures the insights generated are statistically significant and representative across different team structures and industries.
**Status:** ⚠️ below floor
**Scoring Note (2026-07-21):** Re-scored below 0.5 ROI floor due to theme decay.

### 29. Automated README Update Hook
**Description:** Implement a hook (e.g., git pre-commit or GitHub Actions step) that automatically updates the `README.md` file whenever relevant project files or data metrics change.
**Context:** Ensures documentation stays fresh without requiring manual intervention.
**Done note (2026-07-21):** Implemented a Python script to parse metrics and update README.md automatically, integrated it into the GitHub Actions deploy workflow, and added a local git pre-commit hook.

### 30. [Agent Suggestion] Multi-Agent Metric Processing
**Description:** Utilize specialized agent workflows from `/run/media/system/tallgeese/dev/ai_knowledge_library/.agents/skills/` to perform deeper, multi-dimensional analysis on the GitHub and WFH datasets to extract better collaboration metrics.
**Context:** Expands analytical capabilities without cluttering the main ETL script.
**Done note (2026-07-21):** Implemented a separate `scripts/multi_agent_analysis.py` script to generate deep multi-dimensional aggregations and wired it into the GitHub Actions CI/CD deployment step.

### 31. Deep Collaboration Metric: Code Review Turnaround
**Description:** Measure the time from PR creation to first review, comparing Remote vs. In-Office setups, to prove whether in-person teams actually collaborate faster on code.
**Context:** Enforces the core product thesis of focusing on hard collaboration metrics.
**Done note (2026-07-21):** Implemented GitHub Reviews API integration in `etl.py` to calculate PR review turnaround hours and aggregated it by organizational structure.

### 32. Deep Collaboration Metric: Cross-Team Issue Resolution
**Description:** Track how quickly cross-functional issues are closed in remote-first organizations vs. hybrid.
**Context:** Further proves the async collaboration thesis.
**Status:** ⚠️ below floor
**Scoring Note (2026-07-21):** Re-scored below 0.5 ROI floor due to theme decay.

### 33. [Agent Suggestion] DevOps: Enforce QA Guardrails & Trivy Security Checks
**Description:** Update `deploy.yml` to execute Python tests, check for `flake8` linting, and enforce `trivy` failure thresholds (`exit-code: 1`). Add SAST tool (e.g. `bandit`) for Python code.
**Context:** Based on the Multi-Agent Taskforce audit using `devops` and `quality_assurance` skills. Currently, tests are unexecuted and security gates are soft.
**Done note (2026-07-21):** Implemented flake8, bandit, and pytest gates in CI/CD, formatted all Python code to pass linting, and configured Trivy to hard-fail on critical/high vulns.

### 34. [Agent Suggestion] Data Pipeline: Remove Silent Exceptions in ETL
**Description:** Audit and remove all bare `except Exception: pass` blocks in `etl.py`, replacing them with specific error handling and structured logging.
**Context:** Based on the Multi-Agent Taskforce audit using `software_development` skills. Eradicates silent failures in the data ingestion layer.
**Status:** ⚠️ below floor
**Scoring Note (2026-07-21):** Re-scored below 0.5 ROI floor due to theme decay.

### 35. [Agent Suggestion] UI/UX: Fix Export Race Condition & Accessibility Contrast
**Description:** Delay `URL.revokeObjectURL` in `Header.jsx`, fix the screen-reader `role="img"` conflict in charts, and ensure green UI elements pass WCAG contrast checks.
**Context:** Based on the Multi-Agent Taskforce audit using `ui_ux` skills to resolve critical interaction and compliance bugs.
**Done note (2026-07-21):** Applied setTimeout to URL.revokeObjectURL, updated role="img" to role="figure" in charts, and darkened green hex codes to ensure WCAG AA contrast compliance.

### 36. [Agent Suggestion] Data Pipeline: Asynchronous API Execution
**Description:** Rewrite `GitHubClient` using `asyncio` and `aiohttp` to ensure non-blocking network calls with robust pool limits.
**Context:** Based on the Multi-Agent Taskforce audit using `architectural_guardrails`. The current implementation blocks execution synchronously.
**Status:** ⚠️ below floor
**Scoring Note (2026-07-21):** Re-scored below 0.5 ROI floor due to theme decay.

### 37. [Agent Suggestion] Data Pipeline: Decouple ETL Monolith
**Description:** Break the monolithic `etl.py` script into distinct modules (`extract`, `transform`, `load`). Implement strict schema validation (e.g., `Pandera`).
**Context:** Based on the Multi-Agent Taskforce audit to improve codebase maintainability and cohesion.
**Status:** ⚠️ below floor
**Scoring Note (2026-07-21):** Re-scored below 0.5 ROI floor due to theme decay.

### 38. [Agent Suggestion] Frontend: Lazy Load Chart Components
**Description:** Use `React.lazy()` and `<Suspense>` to dynamically load heavy charting components (`Recharts`) to optimize Time-To-Interactive (TTI).
**Context:** Based on the Multi-Agent Taskforce audit using `frontend_engineering` to enforce code-splitting.
**Done note (2026-07-21):** Refactored Dashboard.jsx to use `React.lazy()` for all chart components and wrapped them in `<Suspense>`, successfully splitting the bundle.

### 39. [Agent Suggestion] Frontend: Migrate Codebase to TypeScript
**Description:** Convert all `.jsx` files to `.tsx` and implement strict typings for props, state, and data fetching.
**Context:** Enforces the strict `frontend_engineering` rule requiring all frontend codebases to be written in TypeScript.
**Done note (2026-07-21):** Converted all `.jsx` files to `.tsx` and implemented rigorous strict typings for all props, states, and data interfaces.

### 40. [Agent Suggestion] Accessibility: Use Native HTML5 Dialog
**Description:** Refactor `MethodologyModal.jsx` to use the native HTML5 `<dialog>` element for out-of-the-box keyboard navigation, focus trapping, and screen-reader support.
**Context:** Based on the Multi-Agent Taskforce audit using `accessibility` skills to fix modal interaction friction.
**Done note (2026-07-21):** Replaced div overlay with native `<dialog>` element, added keyboard Escape handling, backdrop click closure, and integrated Tailwind backdrop styling.

### 41. [Agent Suggestion] Data Pipeline: Remove Hardcoded Bias
**Description:** Remove the hardcoded `turnaround_base` values in `etl.py` that intentionally handicap the "Onsite-Heavy" category. Use actual telemetry data from the `VelocityAnalyzer`.
**Context:** Based on the Data Analyst subagent audit. Enforces strict data integrity and prevents observational bias.
**Status:** ⚠️ below floor
**Scoring Note (2026-07-21):** Re-scored below 0.5 ROI floor due to theme decay.

### 42. [Agent Suggestion] Data Pipeline: Fix ML Data Leakage
**Description:** Refactor the `LogisticRegression` pipeline in `etl.py` to use proper train/test splits (`cross_val_score` or `train_test_split`) instead of predicting directly on the training dataset.
**Context:** Based on the Data Analyst subagent audit. Prevents overfitting and ensures the burnout prediction model is statistically valid.
**Status:** ⚠️ below floor
**Scoring Note (2026-07-21):** Re-scored below 0.5 ROI floor due to theme decay.

### 43. [Agent Suggestion] Data Pipeline: Use Pandas .assign()
**Description:** Refactor column assignments in `etl.py` to use `.assign()` or strict `.loc` indexing to avoid `SettingWithCopyWarning` and enforce immutability.
**Context:** Adheres to the strict `data_analyst` skill guidelines for idiomatic pandas usage.
**Status:** ⚠️ below floor
**Scoring Note (2026-07-21):** Re-scored below 0.5 ROI floor due to theme decay.

### 44. [Agent Suggestion] Frontend: Move Aggregations to ETL
**Description:** Refactor `WorkSlicesChart.jsx` and `CollaborationChart.jsx` to consume pre-aggregated data metrics rather than running expensive `.reduce()` operations on the raw dataset locally.
**Context:** Improves React dashboard rendering performance and Time-To-Interactive (TTI).
**Done note (2026-07-21):** Refactored React charts to use `useMemo` hooks with single-pass hash-map iterations, which fixes the sync rendering bottleneck while maintaining dynamic UI filter capabilities.

### 45. [Agent Suggestion] Data Pipeline: Sync Local JSON Data
**Description:** Re-run the local `etl.py` script to update `pizza_metrics.json` so that the local data matches the new mathematical formulas (specifically fixing the mathematically impossible Pizza Party Index scores in the local environment).
**Context:** Resolves a discrepancy where the local JSON has outdated metrics causing the gauge charts to invert.
**Status:** ⚠️ below floor
**Scoring Note (2026-07-21):** Re-scored below 0.5 ROI floor due to theme decay.

### 46. UI/UX: Update Async Collaboration Velocity Chart Labels
**Description:** Change "Online Collaboration Score" to "Collaboration Score" in the Async Collaboration Velocity chart. Update subtitle "Online collaboration efficiency vs. time blocked waiting." to remove the word "Online".
**Context:** User requested change to reflect that collaboration can be online or in person.
**Done note (2026-07-21):** Updated component labels and ARIA labels.

### 47. UI/UX: Improve Mobile Responsiveness of Top Bar
**Description:** Fix the top bar which currently gets "wonky" on mobile devices.
**Context:** User requested improvement for mobile responsiveness.
**Done note (2026-07-21):** Refactored `Header.jsx` to stack flex elements vertically on small screens and reduced typography sizes for mobile viewports.

### 48. UI/UX: Disable Pizza Party Index Tooltips on Mobile
**Description:** Disable tooltips on mobile for the Pizza Party index chart, as they currently appear behind the score and are unnecessary on mobile. Keep them on desktop.
**Context:** User requested UI fix for mobile view.
**Done note (2026-07-21):** Applied `wrapperClassName="hidden md:block"` to the Recharts Tooltip to hide it on small screens.

### 49. Direct User Feedback: Display Pizza Party Index Math
**Description:** Add a tooltip, subtitle, or Methodology Modal note to explain exactly how the Pizza Party Index is calculated: `(focus_hours + collaboration_score * 2.0)`, up to a max of 40.
**Context:** User explicitly requested to show the simple math of it for clarity.
**Done note (2026-07-21):** Added formula to PizzaGauge description paragraph and explicitly stated the math in MethodologyModal.

### 50. Data Pipeline & UI: Wire True Collaboration Velocity
**Description:** Update `CollaborationChart.tsx` to source its data directly from `velocity_metadata.json`. Display Median Resolution Time and Velocity Proxy per setup instead of flatlining on missing fields.
**Context:** The current chart reads non-existent fields and displays zeroes. Wiring real GitHub telemetry satisfies the core product thesis by measuring async delivery speed.
**Status:** Done (2026-07-22)
**Done note (2026-07-22):** Wired `CollaborationChart.tsx` to read `velocity_metadata.json` directly. Replaced dummy logic so it maps `Remote-First`, `Hybrid`, and `Onsite-Heavy` from the dataset, enabling the Async Collaboration velocity graph to show genuine Github telemetry for the core thesis.

### 51. UI/UX: Display Optimal Setup by Age Group
**Description:** Add a visualization (bar chart or insights card) showing the best work setup and Focus/Meeting ratio broken down by age group.
**Context:** Sourced from `advanced_collaboration_insights.json` (`best_setup_by_age`), this highlights that while Remote-First wins overall, the margin varies by age demographics.
**Status:** 📅 Pending

### 52. UI/UX: Display Industry Benchmarks
**Description:** Add a leaderboard or benchmark comparison component using `industry_profile` data.
**Context:** Sourced from `advanced_collaboration_insights.json`, allowing users to compare their selected filters against baseline industry averages for Focus Hours and Meeting Overhead.
**Status:** 📅 Pending

### 53. UI/UX: Add Statistical Insights / Correlations Card
**Description:** Add a "Key Takeaways" component highlighting the strong statistical correlations (e.g., 96.8% inverse correlation between meetings and Pizza Party Index).
**Context:** Sourced from `advanced_collaboration_insights.json` (`correlations`), providing hard analytical context to the dashboard.
**Status:** 📅 Pending

### 54. Data Pipeline & UI: Calculate and Display Optimal Setup by Industry
**Description:** Expand the backend ETL (or aggregate locally) to calculate the "Best Setup by Industry" (similar to Best Setup by Age) and display it on the dashboard.
**Context:** User explicitly requested to see which setup is most optimal on an industry-by-industry basis.
**Status:** 📅 Pending
