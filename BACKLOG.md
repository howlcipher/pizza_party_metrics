# Pizza Party Metrics — Engineering Backlog

## 1. Purpose and scope

This is the authoritative, audit-derived backlog for correctness, trust, and reliability work on Pizza Party Metrics. It is distinct from `documentation/issues.md` (bug tracker) and `documentation/improvements.md` (feature/DX backlog scored by the `groom_backlog.py` ROI model) — those two documents track feature and polish work; this document tracks findings from a full-repository engineering audit focused on data correctness, test confidence, methodology defensibility, CI/CD reliability, and type safety, per the standing audit protocol. Do not merge these documents; cross-reference by ID instead.

Every item below was verified against the current repository state on 2026-07-31 (see Audit Notes, section 9) — nothing here is accepted on the audit prompt's say-so alone. Several of the prompt's "suspected findings" turned out to already be fixed (documented in section 9); those are **not** included as open items.

## 2. Current system summary

- **Data pipeline** (`scripts/etl/`): `WFHDataExtractor` downloads/reads a Stanford WFH Research (SWAA) monthly workbook; `GitHubClient` + `VelocityAnalyzer` pull PR/issue/review telemetry from a fixed basket of public repos per work-setup category (Remote-First / Hybrid / Onsite-Heavy); `MetricsProcessor` Monte-Carlo samples 5,000 synthetic "respondents," derives Focus Hours / Meeting Overhead / Pizza Party Index / a scikit-learn "burnout risk score," and writes `src/data/pizza_metrics.json` + `src/data/velocity_metadata.json`.
- **Advanced insights**: `scripts/multi_agent_analysis.py` aggregates the generated dataset into `src/data/advanced_collaboration_insights.json` (industry/age/industry-best-setup profiles, a correlation matrix, burnout/productivity rollups).
- **Frontend**: React 19 + Vite 8 + Tailwind 4, TypeScript with `strict: false`, statically imports the generated JSON at build time (no runtime fetch), Recharts-based dashboard.
- **CI/CD** (`.github/workflows/deploy.yml`): `validate` (pytest, flake8, bandit, `npm audit`, Trivy) → `data-pipeline` (runs ETL + multi-agent analysis + `update_readme.py`, uploads `src/data/` artifact) → `build` (downloads artifact, `npm run build`) → `deploy` (GitHub Pages). Runs on push to `main` and daily via cron.
- **Local-only backend**: `server/main.py` (FastAPI) exposes a live `/api/metrics` endpoint; it is not wired into the deployed static site, CI, or `package.json`, and appears unused by the shipped product.
- **Meta-tooling**: `documentation/issues.md`, `documentation/improvements.md`, and `scripts/update_improvements.py`/`scripts/groom_backlog.py` implement a separate ROI-scored backlog process for feature/DX work, already in active use.

## 3. Prioritization rules

Priorities follow the standing mandate: (1) data correctness and source freshness, (2) tests that provide real confidence, (3) accurate and defensible methodology, (4) CI/CD reliability and reproducibility, (5) type safety and runtime robustness, (6) accessibility/performance/maintainability, (7) lower-priority design/DX. Within a priority tier, items are ordered by severity × confidence, then by how many other items depend on them.

## 4. Backlog summary table

| ID | Title | Type | Priority | Severity | Confidence | Est. Size | Risk | Dependencies | Status |
|---|---|---|---|---|---|---|---|---|---|
| PPM-001 | Stop silent stale-workbook reuse; add freshness policy | Data Integrity | P0 | High | High | M | Low | none | Ready |
| PPM-002 | Repair silently-skipped, stale ETL integration tests | Testing | P0 | High | High | M | Low | PPM-001 (fixture path) | Ready |
| PPM-003 | Don't cache failed GitHub API responses as valid empty data | Bug | P0 | High | High | S | Low | none | Ready |
| PPM-004 | Correct "perfectly weighted / statistically accurate" synthetic-data claims | Data Integrity | P0 | High | High | M | Low | none | Ready |
| PPM-005 | Remove unsupported developer-satisfaction claim | Documentation | P0 | Medium | High | XS | Low | none | Ready |
| PPM-006 | Surface `is_fallback` telemetry state in the UI | Data Integrity | P0 | High | High | S | Low | none | Ready |
| PPM-007 | Make README metric automation truthful and persistent | CI/CD | P1 | Medium | High | S | Low | none | Ready |
| PPM-008 | Replace or clearly relabel the decorative burnout classifier | Methodology | P1 | Medium | High | M | Medium | none | Ready |
| PPM-009 | Add strict generated-data types + runtime schema validation | Testing | P1 | Medium | High | M | Medium | PPM-002 | Ready |
| PPM-010 | Add frontend lint/typecheck/test to CI | CI/CD | P1 | Medium | High | S | Low | none | Ready |
| PPM-011 | Fix GitHub cache key to include request parameters | Bug | P1 | Low | High | XS | Low | none | Ready |
| PPM-012 | Generate a machine-readable data provenance manifest | Feature | P1 | Medium | Medium | M | Low | PPM-001 | Proposed |
| PPM-013 | Remove imported-data empty-state flash in Dashboard | Frontend | P2 | Low | High | XS | Low | none | Ready |
| PPM-014 | Move `lucide-react` to runtime dependencies | Developer Experience | P2 | Low | High | XS | Low | none | Ready |
| PPM-015 | Pin/split Python dependencies; drop unused server deps from prod path | Developer Experience | P2 | Low | Medium | S | Low | none | Proposed |
| PPM-016 | Pin Trivy Action off the floating `master` ref | Security | P2 | Medium | High | XS | Low | none | Ready |
| PPM-017 | Document rationale for hand-tuned metric constants | Methodology | P2 | Low | High | S | Low | none | Proposed |
| PPM-018 | Remove duplicate committed workbook binary | Data Integrity | P2 | Low | High | XS | Low | PPM-001 | Proposed |
| PPM-019 | Add `workflow_dispatch` to deploy workflow | CI/CD | P3 | Low | High | XS | Low | none | Ready |
| PPM-020 | Scope workflow permissions per job | Security | P3 | Low | Medium | XS | Low | none | Proposed |
| PPM-021 | Clean up unused-import/unused-var lint warnings | Developer Experience | P3 | Low | High | XS | Low | PPM-010 | Proposed |
| PPM-022 | Display sample sizes / robustness caveats for mean-based stats | Feature | P3 | Low | Medium | M | Low | none | Proposed |

## 5. Detailed backlog items

### PPM-001: Stop silent stale-workbook reuse; add freshness policy

**Problem statement:** `WFHDataExtractor.download()` returns the existing file path immediately whenever `raw_data/wfh_data.xlsx` exists, without checking its age or the source's latest available date. Because that file is committed to git, this download path can never actually fire in CI — the pipeline will keep re-reading the same committed snapshot indefinitely, even though the site's copy and the README both imply monthly freshness ("we parse the latest monthly Excel timeseries").

**Evidence and affected files:**
- `scripts/etl/wfh_extractor.py:13-15` — `if os.path.exists(filepath): return filepath` before any network call.
- `git ls-files raw_data/` confirms `raw_data/wfh_data.xlsx` (and a duplicate `raw_data/wfh.xlsx`, see PPM-018) are committed, not gitignored.
- The workbook's latest row is currently 2026-06-01 (verified via `pd.read_excel`), so today (2026-07-31) it is not yet badly stale, but nothing in the pipeline would detect or fix it once it becomes stale — there is no TTL, checksum, or source-date comparison anywhere in the code path.
- `tests/test_etl.py::TestDownloadWfhData::test_skips_download_if_file_exists` only asserts the existence-skip behavior; there is no test for a freshness/TTL policy because none exists.

**User or system impact:** The dashboard's core "empirical, monthly-refreshed" data claim (README line 43, "we parse the latest monthly Excel timeseries") silently stops being true after the committed snapshot ages, with no error, warning, or visible signal to users or maintainers.

**Root-cause hypothesis:** The existence check was written as a cheap local-dev cache guard and never revisited after the workbook was committed to the repo for reproducibility/offline-dev convenience — the two purposes (dev cache vs. production freshness gate) were conflated into one check.

**Proposed solution:** Replace the existence-only check with an explicit policy: (a) always attempt the network fetch first in CI (env-gated, e.g. `PPM_OFFLINE=1` to force local-file reuse for offline dev), (b) if the fetch succeeds, compare the new workbook's latest `date` row against the cached copy's and only overwrite if newer or checksum differs, (c) write the download atomically (temp file + rename) and validate the workbook opens and contains the expected sheet before accepting it, (d) if the fetch fails, fall back to the existing local file but return a structured flag indicating fallback-to-cached-copy was used, and (e) record the resulting source date/checksum for PPM-012's provenance manifest.

**Alternatives considered:** A pure TTL-based cache (re-download every N hours regardless of content) was considered but rejected — it doesn't guard against silently accepting a bad/empty download over a good cached copy, whereas date/checksum comparison does.

**Explicit non-goals:** Not building a general-purpose caching library; not changing where the workbook lives on disk; not removing the offline-fallback capability (network access in CI/sandboxes cannot be assumed reliable).

**Dependencies:** None. PPM-002 and PPM-018 depend on this item's fixture/path decisions.

**Risk and migration concerns:** If the real `wfhresearch.com` URLs in `config.py` (which include a not-yet-verified `2026/07` path) 404, the fallback chain must degr15 gracefully to the next URL and finally to the local copy without crashing the pipeline — this must be tested explicitly, not just assumed from the existing `try/except` loop.

**Acceptance criteria:**
1. `WFHDataExtractor.download()` no longer short-circuits on existence alone; it attempts a fetch unless an explicit offline flag is set.
2. A successful new download only replaces the local file if its parsed latest `date` is newer (or checksum differs) — never silently overwrites with older/equal data.
3. Download failure paths return/raise a distinguishable "used cached fallback" signal that a caller (ETL pipeline) can propagate into metadata.
4. Unit tests cover: fresh download when local file is stale, no-op when local file is already current, atomic-write-on-failure (no partial file left behind), and offline-mode short-circuit.
5. `raw_data/wfh_data.xlsx` freshness behavior is documented in `README.md`'s "Ingredients" section, replacing the current unconditional "latest monthly" phrasing with an accurate description of the fetch/fallback policy.

**Required tests:** New unit tests in `tests/test_etl.py::TestDownloadWfhData` for: newer-remote-replaces-local, older-remote-does-not-replace-local, checksum-validation-rejects-corrupt-download, offline-flag-skips-network.

**Required documentation changes:** README "Ingredients" section; a short docstring on `WFHDataExtractor.download()` explaining the policy.

**Suggested model:** Sonnet.
**Suggested permission mode:** default (file edits + local test runs only; no network-dependent assertions in CI).
**Estimated size:** M.

---

### PPM-002: Repair silently-skipped, stale ETL integration tests

**Problem statement:** `tests/test_etl.py::TestProcessData` looks for a workbook at `wfh_data.xlsx` (repository root) and calls `self.skipTest(...)` if it's absent. The actual file lives at `raw_data/wfh_data.xlsx`. Verified by running the suite: 10 of 21 tests in `tests/test_etl.py` are skipped, all in `TestProcessData` — the class that actually exercises `MetricsProcessor.process()`, the core of the ETL pipeline. Additionally, `test_record_count` asserts `len(self._run()) == 170`, which cannot pass against the current `ETL_SETTINGS['synthetic_n_size'] = 5000` (verified: `src/data/pizza_metrics.json` has exactly 5,000 records) — the assertion is stale and would fail immediately if the skip were fixed today.

**Evidence and affected files:**
- `tests/test_etl.py:129` — `WFH_FILE = 'wfh_data.xlsx'` (root, not `raw_data/`).
- `tests/test_etl.py:131-134` — `setUp` skips the entire class on absence.
- Ran `python3 -m pytest tests/ -v`: `11 passed, 10 skipped` — every `TestProcessData` test skipped.
- `tests/test_etl.py:153` — `self.assertEqual(len(self._run()), 170)` vs. actual current output of 5,000 records.
- CI (`deploy.yml`) runs `pytest` with no `-ra`/failure-on-skip gate, so this passes "green" without exercising `MetricsProcessor` at all.

**User or system impact:** CI reports success while the single most important transformation in the codebase — the one that produces every number on the dashboard — has zero automated regression coverage. A change that broke `MetricsProcessor.process()` (wrong column, NaN propagation, broken percentage math) would not be caught before merge or deploy.

**Root-cause hypothesis:** The workbook's location moved to `raw_data/` (likely alongside the PPM-001 caching change) without updating the test fixture path, and the record count was never updated after `synthetic_n_size` was raised from an earlier smaller value to 5,000.

**Proposed solution:** Do not depend on the committed real workbook as a test fixture at all (that couples a unit-level test to a specific external dataset's shape and revives the freshness-coupling problem from PPM-001). Instead, build a small deterministic synthetic `.xlsx` fixture in a `setUp`/pytest fixture with a `Work Arrangements by Industry` sheet containing 2-3 industries' worth of `full_onsite_*`/`hybrid_*`/`full_remote_*`/`date` columns, write it to a temp path, and run `MetricsProcessor` against that. This removes the skip entirely, makes the test hermetic and fast, and decouples "does the transform logic work" from "is today's real workbook present." Fix `test_record_count` to assert against `config.ETL_SETTINGS['synthetic_n_size']` rather than a hardcoded literal, so it can't drift again silently.

**Alternatives considered:** Keeping the real-workbook dependency and just fixing the path was considered and rejected — it still leaves the test suite skippable (git-ignored/CI-cache-miss scenarios), and it means test failures are entangled with real dataset column drift instead of pipeline-logic bugs.

**Explicit non-goals:** Not adding golden-file end-to-end snapshot testing of the full 5,000-row output; not testing the real `wfhresearch.com` workbook's actual current schema (that's a separate contract/schema-validation concern, see PPM-009).

**Dependencies:** Should land alongside or after PPM-001 so the fixture strategy doesn't conflict with any download-path changes.

**Risk and migration concerns:** Low — this only touches test code. Ensure the new fixture's column names exactly match what `MetricsProcessor.process()` expects (`full_onsite_<industry>`, `hybrid_<industry>`, `full_remote_<industry>`, `date`), including at least one industry in `config.EXCLUDED_INDUSTRIES` and one in `config.ADDITIONAL_INDUSTRIES` to exercise those branches.

**Acceptance criteria:**
1. No test in `tests/test_etl.py` is skipped when run in a clean checkout/CI environment with no real workbook present.
2. `TestProcessData` runs against a small in-test-generated `.xlsx` fixture, not a path-dependent real file.
3. `test_record_count` (or equivalent) asserts against `config.ETL_SETTINGS['synthetic_n_size']`, not a hardcoded stale number.
4. `pytest --strict-markers -ra tests/` shows 0 skipped in a fresh environment.
5. `Makefile`'s `test` target and CI's `pytest` step require no environment setup beyond `pip install -r requirements.txt`.

**Required tests:** The rewritten `TestProcessData` suite itself is the deliverable; also add a CI-level assertion (or note in the workflow) that fails the build if any test is skipped (`pytest -ra --strict-markers` plus a `grep`-based guard, or `pytest --no-skip`-equivalent via a custom marker check).

**Required documentation changes:** None beyond inline test comments explaining the synthetic fixture's shape.

**Suggested model:** Sonnet.
**Suggested permission mode:** default.
**Estimated size:** M.

---

### PPM-003: Don't cache failed GitHub API responses as valid empty data

**Problem statement:** `GitHubClient.fetch_endpoint()` treats a failed fetch (`None` from `_fetch_with_backoff`, e.g. after retries are exhausted, or an immediate non-200/429/403/5xx response) the same as a genuinely empty result set: `items = await self._fetch_with_backoff(...); if items is None: items = []; _save_cache(cache_path, items)`. A transient GitHub API failure, rate-limit exhaustion beyond `MAX_RETRIES`, or an unexpected 4xx therefore gets written to disk as a cached `[]` for `CACHE_TTL_HOURS` (12 hours), indistinguishable from "this repo genuinely has zero matching PRs/issues."

**Evidence and affected files:**
- `scripts/etl/github_client.py:59-75` (`fetch_endpoint`) and `77-111` (`_fetch_with_backoff`).
- `_fetch_with_backoff` returns `None` on: retry exhaustion after 429/403/5xx, any other non-200 status, or an unhandled exception after all retries.
- `_save_cache` is called unconditionally with the coerced `[]`, with no distinction recorded between "confirmed empty" and "fetch failed."
- `VelocityAnalyzer.analyze()` already computes `is_fallback` from `median_h is None`, so a cached-empty-on-failure result does get flagged as fallback in metadata — but the *cache* itself has no failure marker, so the next run within 12 hours reuses the same false-empty result without retrying, even though the original failure may have been transient (e.g., a momentary rate limit).

**User or system impact:** A single bad API window (rate limit, GitHub outage, network blip during CI) can pin a work-setup category's collaboration metrics to fallback values for up to 12 hours across potentially multiple pipeline runs, without any retry-on-next-run recovery, because the empty cache masks the fact that a fetch never actually succeeded.

**Root-cause hypothesis:** `fetch_endpoint`'s `None → []` coercion was written to simplify downstream consumers (which expect a list, not `Optional[list]`), but the simplification erased the success/failure distinction before it reached the cache layer.

**Proposed solution:** Only write to `_save_cache` when `_fetch_with_backoff` returns a non-`None` result (i.e., a confirmed successful response, including a legitimately empty `[]` from GitHub). On failure, skip the cache write, log/return a structured failure marker, and let `fetch_endpoint` return `[]` to the caller for that run only (so downstream code doesn't need to change its list-handling contract), while ensuring the *next* invocation retries the network call instead of hitting a false-empty cache entry.

**Alternatives considered:** Caching failures with a short negative-cache TTL (e.g. 5 minutes) was considered as a compromise to avoid hammering a genuinely down API; rejected in favor of simplicity — `MAX_RETRIES` + exponential backoff already provides in-run protection, and cross-run negative caching adds complexity for a scheduled-once-daily pipeline where retry-next-run is cheap.

**Explicit non-goals:** Not building a circuit breaker; not changing the retry/backoff parameters themselves.

**Dependencies:** None.

**Risk and migration concerns:** Existing `.cache/*.json` files on disk (or in CI cache) that were written under the old behavior could still contain false-empty entries within their TTL window after this fix ships — acceptable, since they'll naturally expire within 12 hours and the fix prevents new false-empty entries.

**Acceptance criteria:**
1. `_save_cache` is never called with data resulting from a failed fetch (only from a confirmed HTTP 200 response body, including legitimately empty lists).
2. A unit test simulates a fetch that exhausts retries and asserts no cache file is written.
3. A unit test simulates a genuinely empty `200 []` response and asserts it *is* cached (preserving current behavior for the true-empty case).
4. A follow-on call after a failed fetch (within what would have been the TTL window) retries the network request rather than returning a stale empty cache.

**Required tests:** New cases in `tests/test_etl.py::TestCacheHelpers`/a new `TestFetchEndpoint` class, mocking `aiohttp` responses for: retry-exhaustion, immediate 404, genuine empty-200.

**Required documentation changes:** Brief docstring/comment on `fetch_endpoint` clarifying the failure-vs-empty cache contract.

**Suggested model:** Sonnet.
**Suggested permission mode:** default.
**Estimated size:** S.

---

### PPM-004: Correct "perfectly weighted / statistically accurate" synthetic-data claims

**Problem statement:** README states the 5,000 synthetic respondents are "perfectly weighted against the true empirical distributions of the underlying raw data (industry, age, and gender percentages)" and that this "ensures the dashboard's simulated dataset is statistically accurate to the real-world macro data." Verified against the source workbook and the generation code: this is not true for two of the three named dimensions.

**Evidence and affected files:**
- `README.md:51` (the "Note on Data Synthesis" paragraph).
- `scripts/etl/metrics_processor.py:76-78` — `'industry_raw': np.random.choice(sorted(industries), size=N)` passes **no `p=` weighting parameter**, so each industry (however many survive filtering) is sampled with equal probability, not weighted by its actual share of the workforce. (The *within-industry* onsite/hybrid/remote percentages are correctly read per-industry from the workbook — that part is accurate — but the population weight assigned to each industry is uniform.)
- `scripts/config.py:64-69` — `DEMOGRAPHICS['age_distribution']` and `['gender_distribution']` are hardcoded Python literals with no citation.
- Verified directly against the source workbook (`raw_data/wfh_data.xlsx`, sheet `Work Arrangements by Industry`, all 46 columns enumerated): there are **no age or gender columns, and no industry-workforce-share column, anywhere in the source data**. The hardcoded age/gender splits in `config.py` cannot be "weighted against" a source that doesn't contain that information — they are an illustrative assumption presented as if empirically derived.

**User or system impact:** The dashboard's central data-trust claim — the thing that distinguishes it from "we made up some numbers" — is factually inaccurate for 2 of the 3 dimensions it cites, and partially inaccurate for the third (industry share, not just onsite/hybrid/remote mix within an industry). This is a direct violation of the standing instruction to treat claims presented to users as part of application correctness.

**Root-cause hypothesis:** The claim was likely written aspirationally when the industry-level onsite/hybrid/remote percentages (which *are* correctly sourced) were implemented, and never revisited when age/gender sampling (which has no source backing at all) and uniform industry sampling were added.

**Proposed solution:** Two-part fix. (a) Code: either source real industry-share weights if obtainable from WFH Research's published documentation (check their site/methodology notes for a workforce-share table before assuming none exists), or explicitly document that industry selection is uniform-by-design (one "virtual respondent slot" per industry category, not population-weighted) — pick whichever is true and make the code match a defensible choice. (b) Copy: rewrite the README/MethodologyModal claim to state precisely what is and isn't empirically sourced: within-industry work-arrangement percentages are from the real SWAA workbook; industry selection is uniform across included industries (not population-weighted); age and gender splits are illustrative assumptions, not sourced from the WFH Research dataset (which contains no demographic breakdown). Do not use "perfectly weighted" or "statistically accurate to real-world macro data" for the age/gender dimensions.

**Alternatives considered:** Fabricating a plausible age/gender distribution sourced from a different public dataset (e.g. BLS) was considered; rejected as out of scope for this item (it's a data-sourcing decision, not a correctness fix) — flagged as a possible follow-up in Deferred Ideas if the user wants to pursue it.

**Explicit non-goals:** Not redesigning the Monte Carlo sampling approach; not removing synthetic respondents in favor of aggregate-only presentation (that's the more invasive alternative noted in the audit brief — leave that decision to the user if they want it explored separately).

**Dependencies:** None, but shares research territory with PPM-012 (provenance manifest) — do them in either order, but keep the wording changes here in sync with whatever the manifest ends up asserting.

**Risk and migration concerns:** Low — text and a `p=` parameter (or explicit no-op comment) change only, no schema changes.

**Acceptance criteria:**
1. README's "Note on Data Synthesis" paragraph accurately distinguishes sourced-from-workbook (per-industry onsite/hybrid/remote mix) from not-sourced-from-workbook (age, gender, industry population share) data.
2. `MethodologyModal.tsx`'s "Data Ingredients" section is updated to match.
3. Either `metrics_processor.py` gains a real `p=` weighting for `industry_raw` backed by a cited source, or a code comment explicitly states industry sampling is uniform-by-design and why.
4. No remaining occurrence of "perfectly weighted" or "statistically accurate to the real-world macro data" describing the age/gender dimensions.
5. `config.py`'s `DEMOGRAPHICS` dict gains a comment stating explicitly that these are illustrative assumptions not present in the source workbook (mirroring the existing good practice already done for `ADDITIONAL_INDUSTRIES`/`EXCLUDED_INDUSTRIES` comments in the same file).

**Required tests:** None required (documentation/comment correctness); if a real industry-share weighting is added, add a unit test asserting the sampled distribution approximates the configured weights within tolerance.

**Required documentation changes:** `README.md`, `src/components/Dashboard/MethodologyModal.tsx`, `scripts/config.py` comments.

**Suggested model:** Sonnet.
**Suggested permission mode:** default.
**Estimated size:** M.

---

### PPM-005: Remove unsupported developer-satisfaction claim

**Problem statement:** `StatisticalInsightsCard.tsx` states as a "Strategic Takeaway": *"Reducing weekly meetings by 2 hours improves developer satisfaction faster than social events."* No satisfaction metric of any kind exists anywhere in the pipeline or dataset (verified: no `satisfaction` field in `pizza_metrics.json`, `velocity_metadata.json`, or `advanced_collaboration_insights.json`, and no such measurement is computed anywhere in `scripts/`).

**Evidence and affected files:**
- `src/components/Charts/StatisticalInsightsCard.tsx:249` — the specific sentence.
- `grep -rn "satisfaction" src/` (only this one prose occurrence; no data field).

**User or system impact:** A specific, quantified-sounding causal claim ("faster than social events") is presented as a strategic takeaway to users with zero supporting data — the exact class of claim the standing audit brief singles out for removal.

**Root-cause hypothesis:** Likely a leftover/generated aspirational copy line from an earlier iteration of the card that was never checked against what the dataset can actually support, unlike its sibling takeaways in the same component (which the codebase has otherwise been careful to caveat — see the well-hedged `summary` text in the same file for the other two cards).

**Proposed solution:** Replace the claim with one the data can actually support (e.g., restate the real, already-computed Meeting Overhead ↔ Pizza Party Index correlation finding already used elsewhere in the same component, appropriately caveated the same way its neighbors are), or remove the takeaway entirely if no defensible replacement exists.

**Alternatives considered:** Softening the language ("may improve...") was considered and rejected — softening a fabricated claim doesn't fix that it's fabricated; the underlying data simply doesn't speak to satisfaction at all.

**Explicit non-goals:** Not adding a satisfaction metric to the pipeline as part of this fix (that's a much larger, separate feature decision).

**Dependencies:** None.

**Risk and migration concerns:** None — copy-only change in one component.

**Acceptance criteria:**
1. No claim about "satisfaction" (developer, employee, or otherwise) appears anywhere in the frontend unless a corresponding measured field backs it.
2. The replacement takeaway (if any) is phrased with the same evidentiary care as the other two cards in `StatisticalInsightsCard.tsx` (i.e., it states what's measured and what the correlation caveat is).

**Required tests:** None (copy change); optionally a grep-based lint/test asserting the word "satisfaction" doesn't appear in `src/` without a corresponding `satisfaction` data field, to prevent regression.

**Required documentation changes:** None beyond the component copy itself.

**Suggested model:** Sonnet (or Haiku — trivial copy fix).
**Suggested permission mode:** default.
**Estimated size:** XS.

---

### PPM-006: Surface `is_fallback` telemetry state in the UI

**Problem statement:** `VelocityAnalyzer.analyze()` already computes and writes an `is_fallback` boolean per work-setup category into `src/data/velocity_metadata.json` (good — this part of the original audit concern is already implemented). But verified via `git grep`, this flag is never read or displayed anywhere in the frontend. Right now, in the currently-committed `velocity_metadata.json`, **one of the three categories (`Onsite-Heavy`) has `is_fallback: true`** — meaning its Task Completion Rate / Communication Turnaround figures are hardcoded conservative constants from `config.FALLBACK_VELOCITIES`, not real GitHub telemetry — yet `CollaborationChart.tsx` renders it identically to the two categories that do have live data, with no visual distinction.

**Evidence and affected files:**
- `src/data/velocity_metadata.json:79` — `"is_fallback": true` for the Onsite-Heavy category, present in the currently-committed dataset (not a hypothetical).
- `src/components/Charts/CollaborationChart.tsx:36-43` — maps `velocityMetadata[setup]` into chart rows without reading `.is_fallback` at all.
- `grep -rn "is_fallback" src/` shows the field is read nowhere in `src/components/`.

**User or system impact:** The dashboard is, right now, presenting a fallback/estimated number as if it were the same live-measured GitHub telemetry as its peers, in the exact chart (`CollaborationChart`) whose own methodology copy (`MethodologyModal.tsx`) promises "real pull request and issue activity." This is a live, currently-reproducible instance of the "silently using stale/synthetic data while describing it as current" failure mode the audit brief warns about.

**Root-cause hypothesis:** The metadata-generation side of this feature (computing `is_fallback`) was implemented, but the corresponding UI-consumption side was not — a partially-completed feature, not a design decision.

**Proposed solution:** In `CollaborationChart.tsx`, read `meta.is_fallback` per category and render a visible marker (e.g. a badge/asterisk on the bar/label, plus a line in the existing `TooltipInfo` copy) indicating "estimated — live GitHub data unavailable at last refresh" for any fallback category. Extend `PizzaGauge.tsx`'s best-setup determination and `StatisticalInsightsCard.tsx`'s correlation caveats similarly if the "Best" setup happens to be a fallback category, since the Index math depends on the same numbers.

**Alternatives considered:** Silently excluding fallback categories from the charts entirely was considered and rejected — that would hide a whole work-setup category rather than being transparent about data quality, which is worse than a clearly labeled estimate.

**Explicit non-goals:** Not changing when/why a category falls back (that's PPM-003's concern); this item is purely about disclosure.

**Dependencies:** None (can ship independently of PPM-003, though PPM-003 reduces how often fallback triggers).

**Risk and migration concerns:** Low, additive UI change. Ensure the badge doesn't break existing `aria-label`/`role="figure"` accessibility text — update the screen-reader-only description string alongside the visible badge.

**Acceptance criteria:**
1. Any work-setup category with `is_fallback: true` in `velocity_metadata.json` is visibly marked as an estimate in `CollaborationChart.tsx`.
2. The chart's `aria-label`/sr-only description text includes the same disclosure for screen reader users.
3. `MethodologyModal.tsx`'s "Task Completion Rate" section gains a sentence explaining what triggers fallback mode and what it means for the displayed numbers.
4. A component-level test (see PPM-010 for test infra) asserts the fallback badge renders when `is_fallback: true` is present in the data and does not render otherwise.

**Required tests:** New frontend component test for `CollaborationChart` covering both fallback and non-fallback metadata inputs (depends on PPM-010 establishing frontend test tooling).

**Required documentation changes:** `MethodologyModal.tsx`.

**Suggested model:** Sonnet.
**Suggested permission mode:** default.
**Estimated size:** S.

---

### PPM-007: Make README metric automation truthful and persistent

**Problem statement:** `deploy.yml`'s `data-pipeline` job runs `python scripts/update_readme.py`, which edits `README.md` on disk inside that job's ephemeral runner. But the workflow's top-level `permissions:` block grants only `contents: read`, the job never commits or pushes the change, and the job's only artifact upload (`actions/upload-artifact` with `path: src/data/`) does not include `README.md`. The edited README is therefore discarded when the runner is torn down. Meanwhile, README line 37 claims "*(These metrics are automatically updated by our automated ETL pipeline!)*" — true only via the separate local `.githooks/pre-commit` hook (which most contributors won't have installed unless they've run `scripts/install_hooks.sh`), not via CI at all.

**Evidence and affected files:**
- `.github/workflows/deploy.yml:11-14` (`permissions: contents: read, ...`), `:101-108` (`Update README` step + artifact upload scoped to `src/data/` only).
- `scripts/update_readme.py` (writes `README.md` in place, no git operations).
- `.githooks/pre-commit` — the only mechanism that actually persists README updates, and only for contributors who ran `scripts/install_hooks.sh` locally.
- `README.md:37` — the automation claim.

**User or system impact:** README's live-looking metrics block can silently drift from the actual deployed dashboard's data over time for any contributor/PR that doesn't go through the local pre-commit hook (e.g. a GitHub web UI edit, or a contributor who skipped hook installation), while the CI badge and workflow name imply this is automated and reliable.

**Root-cause hypothesis:** The CI step was added to mirror the local pre-commit hook's behavior but without the permissions/commit-back logic needed to actually persist a runner-side file edit to the repository — an incomplete port of a local automation into CI.

**Proposed solution:** Pick one of two truthful designs and implement it fully: (a) grant `data-pipeline` (or a dedicated job) `contents: write`, and have it commit README.md (and ideally the regenerated `src/data/*.json`) back to `main` with `[skip ci]` in the commit message to avoid triggering a recursive workflow run, guarded so it only runs on the `push`/`schedule` triggers (not on PRs from forks, where `contents: write` tokens aren't available) — or (b) drop the CI-side README update step entirely, rely solely on the local pre-commit hook, and change the README wording from "automatically updated by our automated ETL pipeline" to something accurate about the pre-commit-hook mechanism (and document `scripts/install_hooks.sh` as a setup step in the README's "Local Development" section, where it's currently not mentioned at all).

**Alternatives considered:** Using a separate scheduled workflow purely for README sync was considered; rejected as unnecessary complexity when the existing `data-pipeline` job already has the data in hand.

**Explicit non-goals:** Not changing what metrics the README displays; not building a general docs-sync framework.

**Dependencies:** None.

**Risk and migration concerns:** If option (a) is chosen, the `[skip ci]`/recursion guard is safety-critical — a misconfigured commit-back step that doesn't skip CI will loop the deploy workflow. Must be tested against the concurrency group already defined (`group: "pages"`) to confirm it doesn't produce a runaway queue.

**Acceptance criteria:**
1. After this fix, either README.md's automated metrics block is verifiably updated by a successful CI run (visible in the commit history as a bot commit, without triggering an infinite workflow loop), or the "automatically updated" claim is removed/corrected and replaced with accurate instructions for the actual (pre-commit-hook-based) mechanism.
2. `scripts/install_hooks.sh` is referenced in the README's local-development steps if the pre-commit-hook path is kept as the source of truth.
3. No change introduces a recursive/looping workflow trigger.

**Required tests:** If commit-back is implemented, a manual/documented verification run (workflow dispatch, see PPM-019) confirming a single commit lands and no second workflow run is triggered by it.

**Required documentation changes:** `README.md` (automation claim + local dev steps), possibly `.github/workflows/deploy.yml` inline comments.

**Suggested model:** Sonnet.
**Suggested permission mode:** default (review any `contents: write` grant carefully before merging — this is a CI permissions change).
**Estimated size:** S.

---

### PPM-008: Replace or clearly relabel the decorative burnout classifier

**Problem statement:** `MetricsProcessor.process()` builds a `burnout_risk_score` via a scikit-learn `LogisticRegression` pipeline, but the "ground truth" target it's trained on is itself algebraically derived from the same two features used to predict it: `target = (interruption_frequency * 0.5 + sustained_high_workload * 2.0 + noise) > 5.0`, and the model is fit on `X_train`/`y_train` from `train_test_split` but then scored/predicted on the **full** `features` DataFrame (`pipeline.predict_proba(features)`), not `X_test`. The train/test split exists in the code but is never used for evaluation.

**Evidence and affected files:**
- `scripts/etl/metrics_processor.py:204-225`.
- `target = ((df_results['interruption_frequency'] * 0.5 + df_results['sustained_high_workload'] * 2.0 + np.random.normal(0, 1, N)) > 5.0).astype(int)` — target is a near-deterministic function of the exact two input features.
- `X_train, X_test, y_train, y_test = train_test_split(...)` followed immediately by `pipeline.fit(X_train, y_train)` then `pipeline.predict_proba(features)` — `X_test`/`y_test` are computed and discarded.
- README (`README.md:60`) markets this as "Burnout Risk Scores" under "Advanced Insights... Python + scikit-learn."

**User or system impact:** The model cannot discover anything — it is reconstructing a rule the pipeline itself just wrote down, dressed up as a trained classifier with a train/test split that implies validated predictive performance. Presenting this as a predictive model (rather than a documented heuristic) misleads anyone inspecting the methodology into thinking it has been validated against held-out data, which it explicitly has not (the discarded `X_test`/`y_test` prove the split was never actually used to check anything).

**Root-cause hypothesis:** This was very likely built to satisfy a backlog item requiring "advanced insights... scikit-learn pipelines" (see `documentation/improvements.md` item #22, "Predictive Burnout Modeling," done note: "Implemented a machine learning pipeline...") as a demonstration of technique rather than as a genuine predictive task — there is no independent burnout-outcome label anywhere in the source data for the model to actually learn from.

**Proposed solution:** Per the audit brief's explicit menu, choose the "replace with an explicitly documented heuristic score" path (the other two — validated external outcome dataset, or removing the feature entirely — are larger scope decisions than a single backlog item should make unilaterally; flag them in Deferred Ideas for the user to weigh in on). Concretely: drop the `sklearn` `Pipeline`/`LogisticRegression`/`train_test_split` machinery, compute `burnout_risk_score` as a directly documented weighted formula (the same `interruption_frequency`/`sustained_high_workload` inputs, openly stated weights, no pretense of being "trained"), and update every place that describes this as ML (README's "Advanced Insights" row, any in-app copy) to call it a heuristic score with its formula shown, the same way the Fatigue Penalty and Pizza Party Index formulas are already transparently documented in `MethodologyModal.tsx`.

**Alternatives considered:** Sourcing a real external burnout-outcome dataset to train against was considered (per the audit menu) but is a materially larger scope — it requires new data ingestion, licensing/attribution research, and schema work — and is deferred to a separate backlog item (see Deferred Ideas) rather than bundled here. Removing the feature outright was also considered; deferred to the user since it's a product-scope decision, not a pure correctness fix.

**Explicit non-goals:** Not sourcing new external data as part of this item; not removing the feature outright without user sign-off (both are flagged as decisions needed — see section 6).

**Dependencies:** None technically, but this is one of the items requiring a product/methodology decision before implementation — see section 6.

**Risk and migration concerns:** `advanced_collaboration_insights.json`'s `burnout_risk_profile` and `MetricsProcessor`'s schema validation (`validate_schema` requires `burnout_risk_score: float`) both depend on this field continuing to exist with the same name/range — a heuristic replacement must keep the same column name and a comparable [0, 1] range to avoid touching every downstream consumer.

**Acceptance criteria:**
1. No `sklearn` classifier is fit/predicted where the training target is an algebraic function of the same features used for prediction.
2. `burnout_risk_score` is computed via an explicit, documented formula (weights and rationale stated in a code comment and in `MethodologyModal.tsx`), not presented as machine-learned.
3. README's "Advanced Insights" row and any other "scikit-learn... Burnout Risk Scores" language is corrected to describe the actual heuristic method.
4. `MetricsProcessor.validate_schema()` and all downstream consumers (`multi_agent_analysis.py`'s `burnout_risk_profile`, frontend if applicable) continue to receive a `burnout_risk_score` field of the same name/shape.
5. Existing tests (`test_burnout_risk_score_range`) still pass unmodified in intent (score stays in [0, 1]) once PPM-002's fixture-based rewrite lands.

**Required tests:** Update/add a deterministic unit test asserting `burnout_risk_score` matches the documented formula for known inputs.

**Required documentation changes:** `README.md` "Advanced Insights" row, `MethodologyModal.tsx` (add a section, mirroring the Fatigue Penalty section's format).

**Suggested model:** Opus (methodology judgment call on the replacement formula's weights/framing).
**Suggested permission mode:** default.
**Estimated size:** M.

---

### PPM-009: Add strict generated-data types + runtime schema validation

**Problem statement:** `src/types.ts`'s `PizzaData` interface makes nearly every field optional and includes `[key: string]: any`, which defeats TypeScript's ability to catch malformed generated data at compile time, and `tsconfig.json` has `"strict": false`. Because the frontend statically imports the generated JSON with no runtime validation layer, a malformed ETL output (wrong type, missing field, NaN) would silently propagate into the UI as `undefined`/`NaN` rendering rather than failing loudly anywhere.

**Evidence and affected files:**
- `src/types.ts:2-19` — every field is `?:` optional, plus the catch-all index signature.
- `tsconfig.json:13` — `"strict": false`.
- No JSON Schema/Zod/Pydantic validation exists anywhere between `MetricsProcessor.process()`'s output and the frontend's `import pizzaMetricsData from '../../data/pizza_metrics.json'`. `MetricsProcessor.validate_schema()` (Python side) does check for required columns and null values, which is good, but it validates DataFrame column presence, not per-record value ranges/enums/finiteness, and nothing validates the JSON on the TypeScript side at all.

**User or system impact:** Type errors and malformed-data bugs (e.g., a future ETL change that emits `NaN` for `focus_hours`, or a typo'd `work_setup_category` value) would not be caught by `tsc`, by tests, or by CI — they'd surface as silent chart glitches in production.

**Root-cause hypothesis:** `PizzaData` was likely widened to `any`-permissive during the TypeScript migration (`documentation/improvements.md` item #39) as a fast way to get the JSX→TSX conversion compiling, and never tightened afterward.

**Proposed solution:** Incrementally, in this order to avoid a single large risky change: (1) narrow `PizzaData` to required (non-optional) fields matching what `MetricsProcessor` actually always emits (verified via `validate_schema`'s `required_columns`), removing the `[key: string]: any` escape hatch; (2) enable `tsconfig.json` `strict: true` and fix whatever compile errors surface (expect them concentrated in a handful of chart components doing loose property access); (3) add a lightweight runtime validator (Zod is a reasonable, dependency-light choice already common in the Vite/React ecosystem) at the point where `pizza_metrics.json` is imported, so a schema violation fails fast in dev/build rather than silently rendering garbage. Do this as a follow-up sub-item stack rather than one PR — split `strict: true` enablement from the Zod validation addition if either turns out larger than expected (per the mode contract's instruction to split oversized items before implementing).

**Alternatives considered:** Generating TypeScript types directly from the Python/Pydantic schema (single source of truth) was considered; noted as a nice-to-have for a later DX item rather than required for this correctness fix, since it adds a codegen step to the build.

**Explicit non-goals:** Not migrating to Pydantic on the Python ETL side as part of this item (the existing `validate_schema` check already provides comparable protection there); not adding validation to every intermediate JSON (only the frontend-facing `pizza_metrics.json` boundary is in scope here, matching the audit brief's "ETL boundary and, where appropriate, the frontend boundary").

**Dependencies:** Benefits from PPM-002 landing first (so type-narrowing work happens against a codebase with real ETL test coverage to catch regressions).

**Risk and migration concerns:** Enabling `strict: true` is very likely to surface a non-trivial number of pre-existing implicit-`any`/null-safety issues across chart components — budget for a real cleanup pass, not a one-line flag flip. Recommend landing `strict: true` and the type-narrowing as one sub-item and the runtime Zod validation as a second, smaller sub-item, per the "split oversized items" instruction.

**Acceptance criteria:**
1. `PizzaData` in `src/types.ts` has only the fields that `MetricsProcessor.validate_schema()` guarantees always present, without `[key: string]: any`.
2. `tsconfig.json` has `"strict": true` and `npx tsc --noEmit` passes with zero errors.
3. A runtime validator rejects (with a clear error, not a silent pass-through) a `pizza_metrics.json` payload missing a required field or containing a non-finite number in a numeric field.
4. `npm run build` continues to succeed.

**Required tests:** A test (Vitest or equivalent, see PPM-010) feeding the runtime validator a deliberately malformed payload (missing field, NaN, out-of-enum `work_setup_category`) and asserting it's rejected.

**Required documentation changes:** Note the validation boundary and its guarantees in a short comment near the import site.

**Suggested model:** Sonnet.
**Suggested permission mode:** default.
**Estimated size:** M (recommend splitting into PPM-009a `strict: true` + type narrowing, and PPM-009b runtime validation, at implementation time if either proves larger than a single session).

---

### PPM-010: Add frontend lint/typecheck/test to CI

**Problem statement:** `.github/workflows/deploy.yml`'s `validate` job runs Python tests/lint/security scans and `npm audit`, but never runs `npm run lint` (oxlint), any TypeScript typecheck, or any frontend unit/component test. There is also no `npm run typecheck` script in `package.json` at all, and no frontend test runner (Vitest, Jest, etc.) is installed. Verified: `npm run typecheck` fails with "Missing script"; `npx oxlint` (not run in CI) currently reports 10 real warnings (unused imports/vars across `CommuterCostCard.tsx`, `CommuteTimeCard.tsx`, `CommuteCO2Card.tsx`, `StatisticalInsightsCard.tsx`).

**Evidence and affected files:**
- `.github/workflows/deploy.yml:22-68` (`validate` job) — no `npm run lint`, no `tsc`, no frontend test step.
- `package.json:6-11` — `scripts` only has `dev`, `build`, `lint` (oxlint only), `preview`; no `typecheck`, no `test`.
- Ran `npx oxlint` locally: 10 warnings, 0 errors currently (see PPM-021).
- Ran `npx tsc --noEmit -p tsconfig.json`: passes today (0 errors) only because `strict: false` and the permissive `PizzaData` type hide most of what strict mode would catch — this will start actually meaning something once PPM-009 lands.

**User or system impact:** Frontend regressions (lint violations, type errors once strict mode is on, broken component logic) can merge and deploy without any CI signal — the `validate` job's green checkmark currently says nothing about frontend code quality at all, only about the Python pipeline and dependency vulnerabilities.

**Root-cause hypothesis:** CI was built up incrementally alongside Python-side quality gates (`documentation/improvements.md` item #33 explicitly added flake8/bandit/pytest gates) without a parallel pass for the frontend once TypeScript/Vite were introduced.

**Proposed solution:** Add `"typecheck": "tsc --noEmit"` to `package.json` scripts. Add a `validate`-job (or new parallel job) step running `npm run lint` and `npm run typecheck` after `npm ci`. Introduce a minimal frontend test runner (Vitest pairs naturally with Vite) with at least a smoke test suite for pure aggregation/utility logic (not full Recharts rendering, per the audit brief's guidance to keep aggregation testable outside chart components) and wire `npm run test` into CI. This item establishes the test infrastructure that PPM-006 and PPM-009's acceptance criteria depend on.

**Alternatives considered:** Running `npm run build` alone as a proxy for "frontend is fine" was considered (and is already done in the `build` job) — rejected as insufficient, since Vite/esbuild's transpile-only build does not perform full type checking and would not catch most `strict: true` violations.

**Explicit non-goals:** Not achieving full component test coverage in this item — just the CI wiring plus a minimal starter suite; broader test coverage is follow-up work tracked implicitly by PPM-006/PPM-009's own test requirements.

**Dependencies:** None blocking, but PPM-006 and PPM-009 assume this test infrastructure exists — sequence this first if doing all three.

**Risk and migration concerns:** Adding `npm run lint`/`typecheck` as required CI steps will surface the existing 10 oxlint warnings (PPM-021) — decide whether to fix them in this item or treat lint as warn-only initially and fix separately; recommend fixing them in the same item since it's a handful of trivial unused-import removals (see PPM-021, sized XS).

**Acceptance criteria:**
1. `package.json` has a working `typecheck` script.
2. CI's `validate` job (or a new job) runs `npm run lint`, `npm run typecheck`, and a new `npm run test` step, and fails the build on any failure.
3. A minimal Vitest (or equivalent) setup exists with at least one real passing test exercising non-trivial logic (not a placeholder `expect(true).toBe(true)`).
4. Existing oxlint warnings are resolved so `npm run lint` is clean (or the CI step explicitly documents why any remaining warning is acceptable).

**Required tests:** The CI wiring itself, plus the starter Vitest suite described above.

**Required documentation changes:** `README.md`'s "Kitchen Architecture" table row for DevOps/CI, if it enumerates specific gates.

**Suggested model:** Sonnet.
**Suggested permission mode:** default.
**Estimated size:** S.

---

### PPM-011: Fix GitHub cache key to include request parameters

**Problem statement:** `GitHubClient._cache_key(repo, endpoint)` hashes only `f"{repo}_{endpoint}"`. The `endpoint` string passed in (`'pulls'`, `'issues'`, `f"pulls_{pr['number']}_reviews"`) does not encode the `limit`/`per_page` value baked into the actual request URL (`config.GITHUB_PULLS_URL_TEMPLATE.format(repo=repo, limit=num_pulls)`). `VelocityAnalyzer.analyze()` accepts optional `issues_per_repo`/`pulls_per_repo` overrides, so two calls with different limits for the same repo would collide on the same cache file and silently return whichever result was cached first.

**Evidence and affected files:**
- `scripts/etl/github_client.py:52-57` (`_cache_key`) and `:65` (`fetch_endpoint` calling `self._cache_key(*cache_id)` where `cache_id` never includes `limit`).
- `scripts/etl/velocity_analyzer.py:34-38` — `analyze(self, setup_repos=None, issues_per_repo=None, pulls_per_repo=None)` demonstrates the parameter is meant to be variable, not just a fixed config constant.

**User or system impact:** Currently latent (only one call site uses the default `config.GITHUB_ISSUES_PER_REPO`/`GITHUB_PULLS_PER_REPO` today), but any future caller — including a reasonable test or a future "sample more PRs" tuning change — passing a different limit would get a wrong cached result for up to 12 hours with no error.

**Root-cause hypothesis:** The cache key was designed around "one endpoint per repo" before the `issues_per_repo`/`pulls_per_repo` override parameters were added to `analyze()`, and the key derivation wasn't revisited when that flexibility was introduced.

**Proposed solution:** Include the actual request parameters (e.g., the full resolved URL, or explicitly `limit`) in the string hashed by `_cache_key`, e.g. change `cache_id` tuples to include the limit: `(repo, f"pulls_limit{num_pulls}")` etc., or simplest — hash the full request URL instead of a hand-assembled `repo_endpoint` string.

**Alternatives considered:** Removing the `issues_per_repo`/`pulls_per_repo` parameters entirely (since only one call site uses non-default values today) was considered; rejected — those parameters exist for testability/flexibility and removing them just to avoid fixing the cache key would reduce, not improve, the codebase.

**Explicit non-goals:** Not changing the cache TTL or storage format.

**Dependencies:** None.

**Risk and migration concerns:** None — purely additive to the hash input, existing cache files just become orphaned (harmless, will age out naturally).

**Acceptance criteria:**
1. Two calls to `fetch_endpoint`/`analyze()` for the same repo/endpoint but different `limit` values produce different cache files and never share a cached result.
2. A unit test constructs two `_cache_key` calls with differing parameters and asserts the resulting paths differ.

**Required tests:** New case in `tests/test_etl.py` (or a new `TestCacheKey` class) covering this directly.

**Required documentation changes:** None.

**Suggested model:** Haiku or Sonnet (small, mechanical fix).
**Suggested permission mode:** default.
**Estimated size:** XS.

---

### PPM-012: Generate a machine-readable data provenance manifest

**Problem statement:** Nothing in the generated `src/data/*.json` outputs records how/when/from-what-source they were produced. There is no single machine-readable artifact capturing generation timestamp, source URL, source workbook date, checksum, transformation version, random seed, sample size, source column names, sampled GitHub repos, or fallback flags — all of which the standing audit brief calls for and which would make PPM-001's freshness policy and PPM-006's fallback disclosure independently verifiable rather than trusted on faith.

**Evidence and affected files:**
- `scripts/etl/main.py` writes only `velocity_metadata.json` and `pizza_metrics.json`; neither embeds pipeline-level provenance (source workbook date, checksum, seed).
- `config.ETL_SETTINGS['random_seed']` (42) is used but never surfaced in any output artifact.

**User or system impact:** Without this, PPM-001's "was the workbook actually fresh at build time" and PPM-006's "is this category on fallback" claims are only verifiable by reading source code — a user or future auditor has no artifact to check against the live dashboard.

**Root-cause hypothesis:** Provenance tracking was never a requirement when the pipeline was first built incrementally feature-by-feature; each script writes only what its immediate consumer needs.

**Proposed solution:** Add a `scripts/etl/provenance.py` (or extend `main.py`) that assembles a `src/data/provenance.json` manifest after a pipeline run, containing: generation timestamp (UTC), WFH source URL actually used (post PPM-001's fetch-vs-fallback resolution) and its checksum + latest `date` row, `ETL_SETTINGS['random_seed']`, `synthetic_n_size`, the list of source columns consumed, the `SETUP_REPOS` sampled per category, per-category sample counts and `is_fallback` flags (reusing `velocity_metadata.json`'s existing per-category data rather than duplicating logic), and a short free-text "known limitations" field mirroring PPM-004's corrected claims. Surface at least the freshness/fallback-relevant subset of this in the UI (a small footer note or methodology-modal section), not just as a build artifact nobody looks at.

**Alternatives considered:** Embedding provenance fields directly into `pizza_metrics.json` per-record was considered; rejected as wasteful (5,000x duplication of pipeline-level, not record-level, metadata) in favor of one shared manifest file.

**Explicit non-goals:** Not building a general audit-log/history system across multiple pipeline runs — one manifest reflecting the current build's provenance is sufficient scope.

**Dependencies:** Should land after PPM-001 (so there's a real freshness/fallback signal to report) and can share plumbing with PPM-006's UI disclosure work.

**Risk and migration concerns:** Low — new file, additive.

**Acceptance criteria:**
1. A `src/data/provenance.json` (or equivalently named) artifact is produced by every ETL run containing at minimum: generation timestamp, source URL, source workbook date, checksum, transformation/code version marker, random seed, sample size, source column names, sampled GitHub repos, per-category sample counts, fallback flags, and a known-limitations text field.
2. At least a summary of this (freshness + fallback state) is rendered somewhere in the UI, not only written to disk.
3. A unit test asserts the manifest is well-formed JSON containing all required keys after a pipeline run against the PPM-002 test fixture.

**Required tests:** New unit test asserting manifest shape/keys.

**Required documentation changes:** README/MethodologyModal reference to the manifest's existence and purpose.

**Suggested model:** Sonnet.
**Suggested permission mode:** default.
**Estimated size:** M.

---

### PPM-013: Remove imported-data empty-state flash in Dashboard

**Problem statement:** `Dashboard.tsx` statically imports `pizzaMetricsData` (a build-time constant, not an async fetch), yet initializes `const [rawData, setRawData] = useState([])` and only populates it via a `useEffect` on mount (`setRawData(pizzaMetricsData)`). Because the import is already fully resolved at module-load time, this produces one unnecessary render with an empty array before the effect fires, and — since `filteredData` and every chart derive from `rawData` — a brief empty-dashboard flash on every load.

**Evidence and affected files:**
- `src/components/Dashboard/Dashboard.tsx:4` (static import), `:18` (`useState([])`), `:35-38` (`useEffect` copy-in).

**User or system impact:** Minor but real — an avoidable extra render and a visible empty-state flash (including the "No slices left!" reset-filters block briefly rendering, since `filteredData.length === 0` is true on the first render) on every page load, for data that is already available synchronously.

**Root-cause hypothesis:** Likely copied from an earlier version of the component that did fetch data asynchronously (matching `documentation/improvements.md` item #14's "Live Data Ingestion API"), before the switch to static JSON import for GitHub Pages compatibility (Dashboard.tsx's own comment: "Load local JSON data instead of fetching from API for GitHub Pages compatibility") — the state/effect pattern wasn't simplified back down after that switch.

**Proposed solution:** Initialize `rawData` directly from the imported constant: `useState(pizzaMetricsData)` (or, since it's never reassigned, drop the state wrapper entirely and reference `pizzaMetricsData` directly wherever `rawData` is read), removing the now-unnecessary `useEffect`.

**Alternatives considered:** Keeping a loading state was considered per the audit brief's guidance ("initialize immutable imported data directly, or introduce a real loading state only if loading is asynchronous") — rejected because loading is not asynchronous here; a loading state would be pure theater.

**Explicit non-goals:** Not reintroducing async data fetching (that's out of scope and contradicts the GitHub Pages static-hosting constraint noted in the component's own comment).

**Dependencies:** None.

**Risk and migration concerns:** None — confirm `Header.tsx`'s CSV export (which reads `rawData`) still works identically once the state is initialized synchronously.

**Acceptance criteria:**
1. `rawData` (or its replacement) is populated on the very first render, with no intermediate empty-array render.
2. The "No slices left!" empty-state block never flashes on a normal page load with non-empty data.
3. `npm run build` succeeds and the dashboard renders identically to before, minus the flash.

**Required tests:** A simple render test (once PPM-010 infra exists) asserting the dashboard's first render already contains chart content, not the empty state.

**Required documentation changes:** None.

**Suggested model:** Haiku or Sonnet.
**Suggested permission mode:** default.
**Estimated size:** XS.

---

### PPM-014: Move `lucide-react` to runtime dependencies

**Problem statement:** `lucide-react` is listed in `package.json`'s `devDependencies`, but it's imported by 13 files under `src/` (production chart/UI components render its icons), meaning it's a runtime dependency of the shipped bundle, not a dev-only tool.

**Evidence and affected files:**
- `package.json:19-27` — `lucide-react` under `devDependencies`.
- `grep -rl "lucide-react" src/` → 13 files.

**User or system impact:** Functionally the build still works today (Vite bundles whatever's in `node_modules` regardless of the `dependencies`/`devDependencies` split), but this misclassification is exactly the kind of drift that breaks a future minimal-install/production-only `npm install --omit=dev` deployment path, and misrepresents the project's actual runtime footprint to anyone auditing dependencies.

**Root-cause hypothesis:** Likely added at whatever point icons were introduced without checking which dependency bucket new packages were landing in.

**Proposed solution:** Move `"lucide-react"` from `devDependencies` to `dependencies` in `package.json`.

**Alternatives considered:** None needed — this is an unambiguous classification fix.

**Explicit non-goals:** Not auditing every other dependency's bucket placement as part of this item (scope stays narrow, per instructions).

**Dependencies:** None.

**Risk and migration concerns:** None; re-run `npm install`/`npm ci` and `npm run build` after the change to confirm lockfile consistency.

**Acceptance criteria:**
1. `lucide-react` appears under `dependencies` in `package.json`, not `devDependencies`.
2. `package-lock.json` is regenerated/consistent (`npm install` run, diff reviewed for no unrelated changes).
3. `npm run build` still succeeds.

**Required tests:** None beyond the build check.

**Required documentation changes:** None.

**Suggested model:** Haiku.
**Suggested permission mode:** default.
**Estimated size:** XS.

---

### PPM-015: Pin/split Python dependencies; drop unused server deps from prod path

**Problem statement:** `requirements.txt` lists `pandas`, `requests`, `openpyxl`, `numpy`, `fastapi`, `uvicorn`, `scikit-learn`, `pytest`, `flake8`, `bandit`, `aiohttp` with no version pins and no separation between runtime (ETL) dependencies and dev/test/lint/security tooling. Additionally, `fastapi`/`uvicorn` back `server/main.py`, which is not referenced anywhere in `deploy.yml`, `package.json`, or the deployed static site (the frontend loads local JSON directly, per `Dashboard.tsx`'s own comment) — it appears to be a standalone local-dev convenience never wired into the actual production data flow.

**Evidence and affected files:**
- `requirements.txt` (11 unpinned lines, no grouping).
- `server/main.py` exists but `grep -rn "server" .github/workflows/ package.json` shows no reference; `README.md`'s local-dev steps never mention starting it.

**User or system impact:** Unpinned dependencies risk non-reproducible CI builds (a transitive or direct version bump can silently change ETL numerical output or test behavior between runs). Mixing test/lint/security tools into the same file installed for every ETL run (including the `data-pipeline` CI job, which doesn't need `pytest`/`flake8`/`bandit`) wastes CI time and obscures which packages are actually load-bearing for production data generation.

**Root-cause hypothesis:** Organic growth — every new tool/feature (FastAPI backend experiment, scikit-learn burnout model, bandit security gate) appended a line to the one file that already existed.

**Proposed solution:** Split into `requirements.txt` (runtime: `pandas`, `requests`, `openpyxl`, `numpy`, `aiohttp`; add `scikit-learn` only if PPM-008 keeps a real ML dependency, otherwise drop it) and `requirements-dev.txt` (`pytest`, `flake8`, `bandit`, plus `fastapi`/`uvicorn` if `server/main.py` is kept as a documented local-dev tool rather than removed). Pin all versions (exact `==` pins, or `~=` compatible-release pins at minimum) and update `deploy.yml`'s install steps accordingly (`data-pipeline` job installs only `requirements.txt`; `validate` job installs both). Decide and document whether `server/main.py` is a kept dev convenience (documented in README) or dead code to remove — flagged as a product decision in section 6 if the user wants to keep it as a future live-API path.

**Alternatives considered:** Migrating to a fully managed `pyproject.toml` + lockfile (e.g. `uv`/`poetry`) was considered, matching the audit brief's suggestion; noted as the more thorough option but deferred to Deferred Ideas as a larger, separate DX investment rather than bundled into this correctness-focused split-and-pin fix.

**Explicit non-goals:** Not adopting a new Python packaging tool as part of this item; not removing `server/main.py` unilaterally without user confirmation it's actually unused/unwanted.

**Dependencies:** None.

**Risk and migration concerns:** Pinning versions requires verifying the pinned versions are compatible with the Python version CI uses (`3.10`, per `deploy.yml`) and don't break the ETL's numeric output — run the full test suite after pinning, not just an install check.

**Acceptance criteria:**
1. `requirements.txt` contains only runtime ETL dependencies, all version-pinned.
2. A separate dev/test requirements file contains lint/security/test tooling, version-pinned.
3. `deploy.yml`'s `data-pipeline` job installs only the runtime file; `validate` installs both.
4. `server/main.py`'s status (kept-and-documented vs. removed) is explicitly decided and reflected consistently across `requirements*.txt`, README, and the file's own presence.
5. Full pytest + `npm run build` pass after the pin.

**Required tests:** Existing suite re-run after pinning; no new tests strictly required.

**Required documentation changes:** README's install instructions (`pip install -r requirements.txt` vs. dev extras); a decision note on `server/main.py`'s status.

**Suggested model:** Sonnet.
**Suggested permission mode:** default.
**Estimated size:** S.

---

### PPM-016: Pin Trivy Action off the floating `master` ref

**Problem statement:** `deploy.yml`'s `validate` job uses `uses: aquasecurity/trivy-action@master` — a floating branch reference, not a version tag or commit SHA. Any change (including a breaking or malicious one) pushed to that action's `master` branch is picked up automatically on the next CI run with no review.

**Evidence and affected files:**
- `.github/workflows/deploy.yml:63-68`.

**User or system impact:** Supply-chain risk (an upstream action change could alter scan behavior, introduce a vulnerability, or break the build) and reproducibility risk (a build that passed yesterday could fail or behave differently today with no local change).

**Root-cause hypothesis:** `@master` is a common copy-paste default from action READMEs/examples that predates the now-standard guidance to pin third-party actions.

**Proposed solution:** Pin to a specific released version tag (e.g. `aquasecurity/trivy-action@0.28.0` or whatever the current stable release is at implementation time) or, for maximum supply-chain hardening, an immutable commit SHA with a version comment. Verify the pinned version supports the same `scan-type`/`exit-code` options currently used.

**Alternatives considered:** Pinning all actions (`actions/checkout@v4` etc.) to commit SHAs was considered per the audit brief's broader suggestion; scoped down to just the Trivy action here since it's the only floating-branch reference in the workflow (the others are already on stable major-version tags, which is a reasonable, lower-risk baseline) — full SHA-pinning of every action is noted as a lower-priority follow-up (PPM-020's neighborhood) rather than bundled here.

**Explicit non-goals:** Not re-pinning already-stable-tagged actions (`actions/checkout@v4`, `actions/setup-python@v5`, etc.) in this item.

**Dependencies:** None.

**Risk and migration concerns:** Confirm the pinned version's scan behavior/exit codes match current expectations so `exit-code: '1'` still fails the build on the same severity thresholds as before.

**Acceptance criteria:**
1. `aquasecurity/trivy-action` is referenced by a specific version tag or commit SHA, not `@master`.
2. `validate` job still runs and fails appropriately on high/critical findings (verified via a CI run).

**Required tests:** A CI run post-change confirming the step still executes successfully.

**Required documentation changes:** None.

**Suggested model:** Haiku.
**Suggested permission mode:** default.
**Estimated size:** XS.

---

### PPM-017: Document rationale for hand-tuned metric constants

**Problem statement:** Several formula constants in `metrics_processor.py` are hand-tuned magic numbers with no comment explaining their derivation, even though sibling constants in the same codebase (e.g. `config.py`'s `ADDITIONAL_INDUSTRIES`/`EXCLUDED_INDUSTRIES` comments, or `MethodologyModal.tsx`'s Fatigue Penalty section) already demonstrate the project's own standard for this. Specifically: the `cat_factor` weights (`0.55 + remote_pct*0.20`, `0.45 + hybrid_pct*0.15`, `0.35 + onsite_pct*0.10`), the collaboration-score formula (`24.0 / turnaround * 10`), and the meeting-overhead 5-hour floor (`np.maximum(5.0, base_h - focus_hours)`) have no in-code or in-UI explanation of why those specific numbers were chosen.

**Evidence and affected files:**
- `scripts/etl/metrics_processor.py:126-149`.
- Cross-checked `MethodologyModal.tsx`: the Fatigue Penalty section documents its constants well; the Focus Hours formula is shown but `cat_factor`'s base weights (0.55/0.45/0.35 and the 0.20/0.15/0.10 multipliers) aren't explained anywhere, nor is the collaboration-score `24/turnaround*10` formula's rationale (why 24, why ×10) beyond being shown as a bare formula.

**User or system impact:** Lower severity than the data/methodology items above, but every unexplained constant is a spot where a future contributor (or the audit process itself) cannot tell "illustrative assumption" from "empirically derived" — exactly the ambiguity the standing brief asks to eliminate project-wide.

**Root-cause hypothesis:** These constants were tuned by trial-and-error to produce a plausible-looking Remote-First-favoring spread during initial feature development and never retroactively documented, unlike the Fatigue Penalty constants which happened to get writeup treatment when that feature shipped (`documentation/improvements.md` item #59).

**Proposed solution:** Add code comments in `metrics_processor.py` next to each constant stating it is an "illustrative assumption, not derived from source data" (matching the honest framing this codebase already uses elsewhere, e.g. `config.py`'s industry-exclusion comments), and extend `MethodologyModal.tsx` with a short "Category Factor" note alongside the existing Focus Hours Formula bullet, explaining that the 0.55/0.45/0.35 base weights and 0.20/0.15/0.10 multipliers are hand-chosen to produce a Remote-First-favoring spread for illustrative purposes, not measured values, and similarly labeling the `24/turnaround*10` collaboration-score scaling constant.

**Alternatives considered:** Deriving these weights from some real dataset was considered out of scope — no such dataset is proposed by the audit, and inventing one to justify the constants would be worse than honestly labeling them as illustrative.

**Explicit non-goals:** Not changing the constants' actual values or the resulting score distribution — this is a documentation-only item.

**Dependencies:** None; pairs naturally with PPM-004's wording pass but is independently shippable.

**Risk and migration concerns:** None.

**Acceptance criteria:**
1. Every hand-tuned constant in `metrics_processor.py`'s scoring formulas has an adjacent comment stating its status (illustrative vs. sourced) and brief rationale.
2. `MethodologyModal.tsx` reflects the same honesty for the Category Factor and Collaboration Score formulas that it already provides for the Fatigue Penalty.

**Required tests:** None (documentation-only).

**Required documentation changes:** `metrics_processor.py` comments, `MethodologyModal.tsx`.

**Suggested model:** Sonnet.
**Suggested permission mode:** default.
**Estimated size:** S.

---

### PPM-018: Remove duplicate committed workbook binary

**Problem statement:** `raw_data/wfh.xlsx` and `raw_data/wfh_data.xlsx` are both committed, both exactly 98,734 bytes (verified identical size; git history shows both added in the same commit, `79c8d7c`). Only `wfh_data.xlsx` is referenced anywhere in code (`WFHDataExtractor`'s default filepath and `MetricsProcessor`). `wfh.xlsx` appears to be an unused leftover copy.

**Evidence and affected files:**
- `git ls-files raw_data/` → both files tracked.
- `ls -la raw_data/` → identical byte sizes.
- `grep -rn "wfh.xlsx" scripts/ tests/ server/` (excluding `wfh_data.xlsx` matches) → no references to the bare `wfh.xlsx` filename anywhere in code.

**User or system impact:** Minor repo hygiene/confusion risk — a future contributor could reasonably wonder which file is authoritative, or accidentally point new code at the unused copy.

**Root-cause hypothesis:** Likely an artifact of an earlier download/rename step during initial data integration that left the original download alongside its renamed copy.

**Proposed solution:** Delete `raw_data/wfh.xlsx` after confirming (via grep, done above) that nothing references it.

**Alternatives considered:** None needed.

**Explicit non-goals:** N/A.

**Dependencies:** Sequence after PPM-001 in case that item's atomic-download implementation intentionally wants a "previous download" staging file with a similar name — confirm no naming collision before deleting.

**Risk and migration concerns:** Low; verify one more time immediately before deletion that no uncommitted local script references it.

**Acceptance criteria:**
1. `raw_data/wfh.xlsx` is removed from the repository.
2. `pytest` and the ETL pipeline still run successfully afterward.

**Required tests:** None beyond existing suite passing post-removal.

**Required documentation changes:** None.

**Suggested model:** Haiku.
**Suggested permission mode:** default.
**Estimated size:** XS.

---

### PPM-019: Add `workflow_dispatch` to deploy workflow

**Problem statement:** `deploy.yml` triggers only on `push` to `main` and a daily `schedule` — there is no `workflow_dispatch`, so a maintainer cannot manually trigger a rebuild/redeploy (e.g., to pick up a fresh WFH workbook per PPM-001, or to verify PPM-007's README commit-back logic) without pushing an empty commit.

**Evidence and affected files:**
- `.github/workflows/deploy.yml:3-8` (`on:` block).

**User or system impact:** Minor operational inconvenience; also directly needed to manually verify several of the fixes above (PPM-001, PPM-007) without waiting for the next scheduled run or crafting a throwaway commit.

**Root-cause hypothesis:** Simply never added; the workflow was likely modeled on a basic push+schedule template.

**Proposed solution:** Add `workflow_dispatch:` to the `on:` block.

**Alternatives considered:** None needed.

**Explicit non-goals:** N/A.

**Dependencies:** None; useful to land before PPM-001/PPM-007 verification.

**Risk and migration concerns:** None.

**Acceptance criteria:**
1. `deploy.yml`'s `on:` block includes `workflow_dispatch`.
2. A manual run via the Actions UI succeeds.

**Required tests:** A manual trigger verification.

**Required documentation changes:** Optionally note in README that the workflow supports manual dispatch.

**Suggested model:** Haiku.
**Suggested permission mode:** default.
**Estimated size:** XS.

---

### PPM-020: Scope workflow permissions per job

**Problem statement:** `deploy.yml` sets `permissions: contents: read, pages: write, id-token: write` once at the workflow level, which applies to every job by default (including `validate` and `data-pipeline`, neither of which needs `pages: write`/`id-token: write`).

**Evidence and affected files:**
- `.github/workflows/deploy.yml:10-14`.

**User or system impact:** Minor defense-in-depth gap — if `validate` or `data-pipeline` were ever compromised (e.g. via a malicious dependency in `npm audit`'s install step), they'd have Pages-deploy-capable tokens they don't need.

**Root-cause hypothesis:** Workflow-level permissions are the simpler default to write and were likely never revisited once the multi-job split (from `documentation/improvements.md` item #16) was done.

**Proposed solution:** Move `permissions:` blocks to per-job scope: `validate` and `data-pipeline` get `contents: read` only; `build` gets `contents: read`; `deploy` keeps `contents: read, pages: write, id-token: write` (or just `pages: write, id-token: write` if it doesn't need repo contents).

**Alternatives considered:** None needed — this is a standard least-privilege refactor with no behavioral tradeoff.

**Explicit non-goals:** N/A.

**Dependencies:** Coordinate with PPM-007 if that item adds `contents: write` to `data-pipeline` — the two changes touch the same block.

**Risk and migration concerns:** Verify each job still has exactly the permissions it needs after the split (a too-narrow scope would break the `deploy` job's Pages publish step).

**Acceptance criteria:**
1. No job has broader permissions than it uses.
2. A full workflow run (push or manual dispatch) still succeeds end-to-end.

**Required tests:** A full CI run post-change.

**Required documentation changes:** None.

**Suggested model:** Sonnet.
**Suggested permission mode:** default.
**Estimated size:** XS.

---

### PPM-021: Clean up unused-import/unused-var lint warnings

**Problem statement:** `npx oxlint` currently reports 10 `no-unused-vars` warnings across `CommuterCostCard.tsx`, `CommuteTimeCard.tsx` (×4), `CommuteCO2Card.tsx` (×2), and `StatisticalInsightsCard.tsx` (×3) — unused icon imports and unused local variables.

**Evidence and affected files:** Full list from `npx oxlint` run: `CommuterCostCard.tsx:14` (`Info`), `CommuteTimeCard.tsx:21` (`Heart`), `:22` (`Award`), `:212` (`fiveYearCommuteHours`), `:539` (`percentageOfTotal`), `CommuteCO2Card.tsx:13` (`MapPin`), `:14` (`ArrowRight`), `StatisticalInsightsCard.tsx:8` (`TrendingUp`), `:9` (`TrendingDown`), `:10` (`AlertCircle`).

**User or system impact:** Cosmetic/maintainability only — dead code and slightly inflated bundle imports (tree-shaking likely removes the unused icon imports from the final bundle, but the dead local variables are pure noise).

**Root-cause hypothesis:** Normal incremental-development leftovers from iterating on these components' UI (icons swapped out, calculations refactored) without a lint gate in CI to catch it (see PPM-010).

**Proposed solution:** Remove the 10 unused imports/variables identified above.

**Alternatives considered:** None needed.

**Explicit non-goals:** N/A.

**Dependencies:** Do this alongside or right after PPM-010 so `npm run lint` is clean when it becomes a required CI gate.

**Risk and migration concerns:** None — verify none of the "unused" variables were actually meant to be used (i.e., check for a missed intended usage before deleting, not just blind removal) especially `fiveYearCommuteHours`/`percentageOfTotal`, which sound like they might be intended for a display that's currently missing rather than pure dead code.

**Acceptance criteria:**
1. `npx oxlint` reports zero warnings.
2. Manual verification that removed variables weren't silently supposed to be displayed somewhere (fix the display instead of deleting, if so).

**Required tests:** None beyond lint passing; `npm run build` re-verified.

**Required documentation changes:** None.

**Suggested model:** Haiku.
**Suggested permission mode:** default.
**Estimated size:** XS.

---

### PPM-022: Display sample sizes / robustness caveats for mean-based stats

**Problem statement:** Every aggregate figure shown on the dashboard (industry profiles, best-setup-by-age/industry, correlations) is a plain mean with no displayed sample size, confidence interval, or robustness caveat (e.g. sensitivity to outliers). `multi_agent_analysis.py`'s `.agg(...).mean()` calls and the frontend cards that render them show point estimates only.

**Evidence and affected files:**
- `scripts/multi_agent_analysis.py:37-46` (industry_profile `.mean()`), and equivalent aggregations elsewhere in the same file.
- `src/components/Charts/IndustryBenchmarksChart.tsx`, `DemographicsChart.tsx` render these means with no `n=` or spread indicator.

**User or system impact:** Lowest severity of the open items — the underlying data is synthetic with a large, evenly-distributed sample (5,000 records), so this is more a best-practice/statistical-transparency gap than an active correctness bug today. Still worth addressing given the standing instruction to review "whether uncertainty intervals and sample sizes should be displayed."

**Root-cause hypothesis:** Never prioritized — the dashboard was built feature-by-feature (per `documentation/improvements.md`'s history) without a statistics-presentation pass.

**Proposed solution:** Add a per-group `n=` (record count) alongside each aggregate figure in `multi_agent_analysis.py`'s output groups and surface it in the corresponding chart tooltips/cards. Given the underlying data is synthetic (not measurement-error-prone survey responses), full confidence intervals are lower priority than simply showing sample sizes — recommend `n=` display as the concrete deliverable for this item, and leave true statistical confidence intervals as a Deferred Idea unless the user wants both bundled.

**Alternatives considered:** Median instead of mean for robustness against outliers was considered per the audit brief; deferred as a separate, more invasive methodology decision (affects every displayed number's exact value) rather than bundled into this transparency-focused item — flagged in Deferred Ideas.

**Explicit non-goals:** Not switching means to medians as part of this item; not implementing full confidence-interval statistics.

**Dependencies:** None.

**Risk and migration concerns:** None — additive display only.

**Acceptance criteria:**
1. Every aggregate figure surfaced from `multi_agent_analysis.py` groupings includes a companion `n=` (sample size) field in the output JSON.
2. At least `IndustryBenchmarksChart.tsx` and `DemographicsChart.tsx` display the sample size alongside (or in the tooltip of) each aggregate figure.

**Required tests:** Update `tests/test_multi_agent.py` to assert the new `n=` field is present in output groups.

**Required documentation changes:** `MethodologyModal.tsx` brief note on what `n=` represents.

**Suggested model:** Sonnet.
**Suggested permission mode:** default.
**Estimated size:** M.

---

## 6. Recommended implementation order

1. PPM-002 (repair test suite) — do this early since it de-risks every subsequent ETL change by giving them real regression coverage.
2. PPM-003 (don't cache failures as empty) — small, high-value, no dependencies.
3. PPM-001 (stale workbook / freshness policy) — foundational for PPM-012 and PPM-018.
4. PPM-006 (surface `is_fallback`) — currently live and user-visible; independent of the above.
5. PPM-005 (remove satisfaction claim) — trivial, do opportunistically alongside any of the above.
6. PPM-004 (correct synthetic-data claims) — needs a product decision on industry weighting (see below) before "Ready."
7. PPM-011 (cache key fix) — trivial, any time.
8. PPM-010 (frontend CI gates) — unlocks proper test coverage for PPM-006/PPM-009's acceptance criteria.
9. PPM-021 (lint cleanup) — do alongside PPM-010.
10. PPM-007 (README automation) — needs a design decision (commit-back vs. hook-only), see below.
11. PPM-008 (burnout classifier) — needs a product decision (heuristic vs. remove vs. real dataset), see below.
12. PPM-009 (strict types + runtime validation) — larger, split at implementation time if needed.
13. PPM-012 (provenance manifest) — after PPM-001.
14. PPM-014, PPM-016, PPM-018, PPM-019 — trivial, batch together.
15. PPM-015, PPM-020 — batch together (both touch CI config/permissions).
16. PPM-017, PPM-022 — lower priority, do when convenient.

## 7. Deferred ideas

These came up during the audit but require a product/scope decision beyond a single backlog item, or are explicitly out of this audit's scope:

- **Full external burnout-outcome dataset integration** (alternative to PPM-008's heuristic approach) — would require sourcing, licensing, and schema work for a genuinely independent burnout-outcome label.
- **Fully removing the burnout feature** rather than replacing it with a heuristic — a product decision, not purely technical.
- **Sourcing real industry-workforce-share weights** (from WFH Research's published methodology or another source) instead of uniform industry sampling, referenced in PPM-004.
- **Migrating Python dependency management to `pyproject.toml` + a managed lock tool** (uv/poetry) — larger DX investment than PPM-015's scope.
- **Full SHA-pinning of every third-party GitHub Action** (not just Trivy) — noted in PPM-016 as a possible broader follow-up.
- **Switching aggregate statistics from means to medians/robust estimators** — a methodology decision affecting every displayed number, deferred from PPM-022.
- **Full confidence-interval statistics** (beyond the `n=` sample-size display in PPM-022).
- Feature/DX items already tracked in `documentation/improvements.md` (e.g. items #11, #13, #15, #20, #32) are intentionally not duplicated here — that document remains the place for new-capability work.

## 8. Completed items

None yet — this is the initial creation of `BACKLOG.md`. (Note: several items suspected by the standing audit brief were found, during verification, to already be resolved in the current codebase — see section 9 for the list, so they are not entered here as "completed backlog items" since they were never opened as items in this document.)

## 9. Audit notes and limitations

**Suspected findings from the audit brief that were verified as already resolved** (not included as open items):
- GitHub cache-failure-vs-success distinction for `is_fallback` metadata computation: already implemented in `velocity_analyzer.py` (only the *disclosure to users*, PPM-006, and the *cache-write-on-failure*, PPM-003, remain open).
- Unmerged-PR-uses-`closed_at` test: `test_pr_without_merged_at_falls_back_to_closed_at` already correctly tests the intended fallback behavior (a PR with no `merged_at` legitimately falls back to `closed_at`) — the brief's suspicion that this was a bug turned out to describe intended, tested behavior, not a defect.
- "Work-style labels... clearly described as proxies": `MethodologyModal.tsx`'s "Task Completion Rate" section already contains explicit, well-hedged caveats about this being a fixed-basket proxy shared across industries.
- Bot/self-review handling in `VelocityAnalyzer._pr_review_turnaround_hours`: already excludes the PR author's own reviews (`r.get('user', {}).get('login') != pr_author`).
- "Multi-Agent Analysis" naming: acknowledged as a deterministic pandas script rather than literal multi-agent orchestration, but is scoped as a lower-priority rename not pursued in this pass given the higher-priority findings above; revisit if the user wants it addressed.
- Gauge rescaling transparency: `PizzaGauge.tsx` and its tooltip already explicitly document that the scale is relative to the current dataset, not a fixed ceiling — this matches the audit brief's own suggested fix, already shipped.
- Correlation-by-definition labeling: `StatisticalInsightsCard.tsx` already labels the Focus Hours / Meeting Overhead correlation as "Correlation by Definition" with explanatory copy, matching the brief's requirement.
- Native `<dialog>` element for the methodology modal: already implemented.
- Test suite for resolution-hours edge cases (missing dates, below/above min/max window): already present and passing in `TestResolutionHours`.

**What was verified directly (not just read):**
- Ran `pytest tests/` (11 passed, 10 skipped — confirms PPM-002).
- Ran `flake8`/`bandit` per the CI command exactly as configured (both clean).
- Ran `npx oxlint` (10 warnings — confirms PPM-021).
- Ran `npx tsc --noEmit` (0 errors, but expected given `strict: false` — informs PPM-009).
- Ran `npm run build` (succeeds; ~2.3MB main chunk warning, noted but not entered as a separate backlog item since it wasn't part of the audit brief's scope — flagged here for visibility only).
- Read `raw_data/wfh_data.xlsx` directly with pandas/openpyxl: confirmed 46 columns, no age/gender columns, latest date row is 2026-06-01 — this directly grounds PPM-004.
- Confirmed `src/data/pizza_metrics.json` has exactly 5,000 records (grounds PPM-002's stale-170-count finding) and inspected `velocity_metadata.json` directly, finding a live `is_fallback: true` entry (grounds PPM-006 as a current, not hypothetical, issue).
- Confirmed via `git ls-files`/`ls -la` that both `raw_data/wfh.xlsx` and `raw_data/wfh_data.xlsx` are committed and byte-identical in size (grounds PPM-018).

**What could not be inspected:**
- Live network access to `wfhresearch.com` was not exercised — the `2026/07`-dated URL in `config.py`'s `WFH_DATA_URLS` was not verified to actually resolve; PPM-001's implementation should verify this directly rather than assume it.
- GitHub API live rate-limit/failure behavior was not exercised end-to-end (no live `GITHUB_TOKEN` calls were made) — PPM-003's tests should mock these paths rather than rely on live API behavior.
- CI environment behavior (GitHub Actions runners) was not directly observed; all CI-related findings are based on static reading of `deploy.yml` plus local reproduction of the same commands the workflow runs.
- `server/main.py`'s FastAPI backend was read but not run/exercised live; its "is it actually used by anyone" status (informing PPM-015) is inferred from absence of references elsewhere in the repo, not confirmed with the user.

**Per the mode contract, no production code was modified during this run.** Two local-environment-only actions were taken to support verification and are not repository changes: `pip install --user openpyxl` (to inspect the workbook directly) and `npm ci` (to install frontend tooling for `tsc`/`oxlint`/`build` checks) — neither touched any tracked file.
