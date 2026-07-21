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
| 1 | Demographic Analytics (Age, Industry, Gender) | Done (2026-07-21) | 1.75 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 7 (Good segmentation value) * 1.0 / 4 (Standard UI/Data implementation) = 1.75 |
| 2 | [Agent Suggestion] Meeting vs. Maker Time Analysis | Pending | 1.75 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 7 (Actionable insight) * 1.0 / 4 (Can piggyback on interruption data) = 1.75 |
| 3 | Interruption & Context Switch Impact Dashboard | Pending | 1.60 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 8 (High value for productivity insights) * 1.0 / 5 (Complex live data correlation) = 1.6 |
| 4 | Live Data Ingestion API / Backend | Pending | 1.33 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 8 (Core requirement for live data) * 1.0 / 6 (Significant backend work) = 1.33 |
| 5 | [Agent Suggestion] Predictive Burnout Modeling | Pending | 1.00 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 6 (Advanced ML feature) * 1.0 / 6 (Requires data_analyst pipeline & scikit-learn) = 1.0 |

## Details

### 1. Demographic Analytics (Age, Industry, Gender)
**Description:** Add demographic breakdowns to the metrics. Understand how different age ranges, industries, and genders interact with the product or experience different levels of productivity.
**Context:** Ensure data pipelines aggregate this securely and anonymized. 
**Done note (2026-07-21):** Implemented new UI components using Recharts for Age and Gender breakdowns. Data structure updated to support these dimensions, and the dashboard aesthetic upgraded to dark mode.

### 2. [Agent Suggestion] Meeting vs. Maker Time Analysis
**Description:** Analyze calendar data to show the ratio of uninterrupted "Maker Time" versus fragmented "Meeting Time."
**Context:** A natural extension to the context-switching metrics that provides highly actionable insights for teams.

### 3. Interruption & Context Switch Impact Dashboard
**Description:** Visualize how interruptions destroy context switching. We need to track the frequency of interruptions (e.g., Slack messages, ad-hoc calls) and correlate them with task completion times or velocity drops.
**Context:** This requires tracking the "cost" of a context switch. As defined by the product strategy (MVP), we should start with a simple time-loss calculation before moving to complex models.

### 4. Live Data Ingestion API / Backend
**Description:** Build a backend or integration layer (e.g., WebSockets or a polling API) to ingest real and live data for the dashboard, replacing any static or mocked data.
**Context:** Required to fulfill the "real and live data" mandate.

### 5. [Agent Suggestion] Predictive Burnout Modeling
**Description:** Use the `data_analyst` skill principles (scikit-learn pipelines, fixed random seeds) to build a machine learning model that predicts burnout risk based on interruption frequency and sustained high-workload periods.
**Context:** Adds predictive value rather than just historical reporting.
