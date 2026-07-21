import re

with open('improvements.md', 'r') as f:
    content = f.read()

# We need to recalculate the score for all pending items.
# Themes:
# Frontend/UI UX: #1, #3, #6, #8, #23 (5 items) -> Decay: 0.5^4 (wait, halving per *already shipped* item in the same theme. So 1st = 1.0, 2nd = 0.5, 3rd = 0.25, 4th = 0.125, 5th = 0.0625. If 5 are shipped, the next one is the 6th, so decay is 0.5^5 = 0.03125)
# DevOps: #2, #16 (2 items) -> Decay: 0.5^2 = 0.25
# Data Pipeline: #5, #12, #14 (3 items) -> Decay: 0.5^3 = 0.125
# Data Transparency: #4, #8 (wait, 8 was UI/UX and Data Transparency. Let's count it as Data Transparency). 4 and 8 shipped. Decay: 0.5^2 = 0.25
# Collaboration Metrics: 11, 13, 15, 19, 20. None shipped yet. Decay: 1.0.

new_table = """
| # | Improvement | Status | Score (V×D÷E) | Claude model | Gemini model | ROI rationale |
| --- | --- | --- | --- | --- | --- | --- |
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
| 29 | Automated README Update Hook | Pending | 2.00 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 6 (Keeps docs fresh) * 1.0 (new capability) / 3 = 2.00 |
| 19 | [Agent Suggestion] Meeting vs. Maker Time Analysis | Pending | 1.75 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 7 (Actionable insight) * 1.0 (decay) / 4 = 1.75 |
| 11 | [Agent Suggestion] Async Collaboration Velocity Metric | Pending | 1.60 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 8 (Proves thesis) * 1.0 (decay) / 5 = 1.60 |
| 20 | Interruption & Context Switch Impact Dashboard | Pending | 1.60 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 8 (High value) * 1.0 (decay) / 5 = 1.60 |
| 13 | [Agent Suggestion] Documentation & Knowledge Transfer Health | Pending | 1.40 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 7 (Strong proxy for collab) * 1.0 (decay) / 5 = 1.40 |
| 15 | [Agent Suggestion] Cross-Time-Zone Collaboration Index | Pending | 1.17 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 7 (Remote advantage) * 1.0 (decay) / 6 = 1.17 |
| 22 | [Agent Suggestion] Predictive Burnout Modeling | Pending | 1.00 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 6 (Advanced ML) * 1.0 (new capability) / 6 = 1.00 |
| 18 | [Agent Suggestion] DevOps: Isolate ETL Data Pipeline and Ensure Idempotency | ⚠️ below floor | 0.44 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 7 (Decouples failure) * 0.25 (decay) / 4 = 0.44 |
| 24 | Data Pipeline: Add IT, Software, and Other Relevant Industries | ⚠️ below floor | 0.38 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 6 (Better representation) * 0.125 (decay) / 2 = 0.38 |
| 7 | [Agent Suggestion] Data Pipeline: Defensive Network Requests & Error Handling | ⚠️ below floor | 0.33 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 8 (Prevents crashes) * 0.125 (decay) / 3 = 0.33 |
| 28 | Data Pipeline: Ingest Additional Relevant Datasets for Higher Accuracy | ⚠️ below floor | 0.25 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 8 (Improves core metric accuracy) * 0.125 (decay) / 4 = 0.25 |
| 9 | [Agent Suggestion] Data Pipeline: Ingestion Layer Quality Checks | ⚠️ below floor | 0.25 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 8 (Stops bad pipelines) * 0.125 (decay) / 4 = 0.25 |
| 10 | [Agent Suggestion] Data Pipeline: Vectorize Pandas Operations | ⚠️ below floor | 0.22 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 7 (Idiomatic & fast) * 0.125 (decay) / 4 = 0.22 |
| 26 | UI/UX: Metric Tooltips & Explanations | ⚠️ below floor | 0.07 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 7 (Clearer metrics) * 0.03125 (decay) / 3 = 0.07 |
| 27 | UI/UX: Mobile Responsiveness | ⚠️ below floor | 0.06 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 8 (Usability) * 0.03125 (decay) / 4 = 0.06 |
| 17 | Theme Options: Light, Dark, and Color-blind Modes | ⚠️ below floor | 0.05 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 7 (high UX value) * 0.03125 (decay) / 4 = 0.05 |
| 21 | Stereotype Pizza Parlor Aesthetic Overhaul | ⚠️ below floor | 0.04 | claude-3-7-sonnet-20250219 | gemini-3.1-pro-high | 6 (Fun branding) * 0.03125 (decay) / 5 = 0.04 |"""

# Add detail for #29
new_detail = """### 29. Automated README Update Hook
**Description:** Implement a hook (e.g., git pre-commit or GitHub Actions step) that automatically updates the `README.md` file whenever relevant project files or data metrics change.
**Context:** Ensures documentation stays fresh without requiring manual intervention.
"""

content = re.sub(r'\| # \| Improvement \| Status.*?\| 28 \|.*?\|\n', new_table.strip() + '\n', content, flags=re.DOTALL)
content += f"\n{new_detail}"

# We need to update the statuses of the below floor items with scoring notes
for item in [18, 24, 7, 28, 9, 10, 26, 27, 17, 21]:
    if f"### {item}. " in content:
        # replace Status: Pending with Status: ⚠️ below floor
        content = re.sub(rf"(### {item}\. .*?\n.*?Context:.*?\n)(?:.*?)(?=\n### |\Z)", rf"\1**Status:** ⚠️ below floor\n**Scoring Note (2026-07-21):** Re-scored below 0.5 ROI floor due to theme decay.\n", content, flags=re.DOTALL)

with open('improvements.md', 'w') as f:
    f.write(content)
