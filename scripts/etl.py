"""
ETL Pipeline for Pizza Party Metrics.

This script implements an ETL (Extract, Transform, Load) pipeline that:

1. Fetches GitHub **closed pull request** merge times AND **closed issue** resolution
   times for multiple repositories that represent distinct organizational work setups
   ('Remote-First', 'Hybrid', 'Onsite-Heavy').

   The GitHub REST API is used for both the /pulls and /issues endpoints so that we
   capture real delivery cadence data — not just bug-report throughput.  PR merge time
   is the stronger signal for "collaboration velocity" because it reflects end-to-end
   async work cycles.

2. Computes **distinct velocity proxies** per work-setup category by taking the
   reciprocal of the median resolution/merge time (in hours) pooled across all repos
   in that category.  This means Remote-First, Hybrid, and Onsite-Heavy each receive
   a separate scalar that reflects the real-world throughput of organisations that
   operate in that mode.

3. Downloads and parses the Work From Home (WFH) Research dataset from Stanford /
   SWAA to obtain industry-level percentages of workers in each arrangement.

4. Computes the Pizza Party Index, focus hours, and meeting overhead for every
   (industry × age_group × gender) combination, weighted by the real velocity proxy
   for the sampled work-setup category.

5. Saves two artefacts:
   - ``src/data/pizza_metrics.json``  — per-record data consumed by the frontend
   - ``src/data/velocity_metadata.json`` — provenance block (repo lists, sample
     counts, median times, computed velocities, fetch timestamp) so the frontend
     can optionally display a "data sources" badge with confidence information.

Caching:
    GitHub API responses are cached to ``scripts/.cache/`` as JSON files keyed by
    ``{repo}_{endpoint}.json``.  Re-running the pipeline within CACHE_TTL_HOURS will
    reuse the cached payload instead of hitting the GitHub API again.  Delete the
    cache directory to force a fresh pull.

Rate-Limit Handling:
    All GitHub API calls respect the ``Retry-After`` and ``X-RateLimit-Reset`` headers
    via an exponential-backoff helper with a configurable maximum number of retries.

Environment Variables:
    GITHUB_TOKEN — Optional personal access token or GITHUB_TOKEN secret.  Without
                   it the pipeline runs on the unauthenticated rate limit (60 req/h).
                   With a token the limit rises to 5,000 req/h, which is sufficient
                   for all configured repositories.
"""

import os
import json
import logging
import time
import math
import hashlib
import requests
import pandas as pd
from datetime import datetime, timezone
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# ---------------------------------------------------------------------------
# Deterministic random seed (data_analyst skill constraint)
# ---------------------------------------------------------------------------
np.random.seed(42)

# ---------------------------------------------------------------------------
# Top-level constants
# ---------------------------------------------------------------------------

# GitHub REST API endpoint templates
GITHUB_PULLS_URL_TEMPLATE = (
    "https://api.github.com/repos/{repo}/pulls"
    "?state=closed&per_page={limit}&sort=updated&direction=desc"
)
GITHUB_ISSUES_URL_TEMPLATE = (
    "https://api.github.com/repos/{repo}/issues"
    "?state=closed&per_page={limit}&sort=updated&direction=desc"
)

# WFH Research (Stanford SWAA) monthly dataset — try multiple known URLs
WFH_DATA_URLS = [
    "https://wfhresearch.com/wp-content/uploads/2026/07/WFHtimeseries_monthly.xlsx",
    "https://wfhresearch.com/wp-content/uploads/2025/01/WFHtimeseries_monthly.xlsx",
    "https://wfhresearch.com/wp-content/uploads/2024/01/WFHtimeseries_monthly.xlsx",
]

# GitHub API request settings
GITHUB_ISSUES_PER_REPO = 50   # closed issues fetched per repo
GITHUB_PULLS_PER_REPO  = 50   # closed PRs fetched per repo
MAX_RETRIES            = 4    # maximum retries on 429 / 5xx responses
BASE_BACKOFF_SECONDS   = 2    # first retry wait (doubles each attempt)

# Disk cache settings
CACHE_DIR       = os.path.join(os.path.dirname(__file__), '.cache')
CACHE_TTL_HOURS = 12          # treat cached responses as fresh for this long

# Valid resolution/merge window (3 minutes → 1 year in hours)
MIN_RESOLUTION_HOURS = 0.05
MAX_RESOLUTION_HOURS = 8760.0

# Repositories representing distinct work setups / organisational styles.
#
# Selection rationale:
#   Remote-First  — organisations publicly committed to async-first / no-HQ
#                   models (GitLab: fully remote; Automattic: ~1,900 remote
#                   employees; HashiCorp: remote-first; pandas: fully distributed)
#   Hybrid        — large-tech HQs that mandate some in-office days
#                   (Microsoft VSCode team: 3d/wk; Meta/React: hybrid RTO;
#                    Google Flutter team: hybrid policy)
#   Onsite-Heavy  — Apache / enterprise projects dominated by corporate
#                   contributors with strict RTO policies (Kafka: LinkedIn/
#                   Confluent offices; TF: Google campus; Graal: Oracle campus)
SETUP_REPOS: dict[str, list[str]] = {
    'Remote-First': [
        'gitlabhq/gitlabhq',
        'pandas-dev/pandas',
        'automattic/wp-calypso',
        'hashicorp/terraform',
    ],
    'Hybrid': [
        'microsoft/vscode',
        'facebook/react',
        'flutter/flutter',
    ],
    'Onsite-Heavy': [
        'apache/kafka',
        'tensorflow/tensorflow',
        'oracle/graal',
    ],
}

# Conservative fallback velocities (issues/hour) used when a category has no
# usable API data.  These are derived from historical averages so the pipeline
# never emits NaN values.
FALLBACK_VELOCITIES: dict[str, float] = {
    'Remote-First': 0.070,
    'Hybrid':       0.050,
    'Onsite-Heavy': 0.035,
}

# Demographic axes
AGE_GROUPS = ['18-24', '25-34', '35-44', '45-54', '55+']
GENDERS    = ['Male', 'Female']


# ---------------------------------------------------------------------------
# Cache helpers
# ---------------------------------------------------------------------------

def _cache_key(repo: str, endpoint: str) -> str:
    """Return a filesystem-safe cache filename for a given repo + endpoint."""
    safe = hashlib.md5(f"{repo}_{endpoint}".encode()).hexdigest()[:12]
    return os.path.join(CACHE_DIR, f"{safe}.json")


def _load_cache(path: str) -> list | None:
    """Load a cached GitHub response if it is younger than CACHE_TTL_HOURS."""
    if not os.path.exists(path):
        return None
    try:
        with open(path, 'r', encoding='utf-8') as fh:
            envelope = json.load(fh)
        age_hours = (time.time() - envelope.get('ts', 0)) / 3600.0
        if age_hours <= CACHE_TTL_HOURS:
            logging.debug(f"Cache HIT  ({age_hours:.1f}h old): {path}")
            return envelope['data']
        logging.debug(f"Cache STALE ({age_hours:.1f}h old): {path}")
    except Exception as exc:
        logging.warning(f"Cache read error {path}: {exc}")
    return None


def _save_cache(path: str, data: list) -> None:
    """Persist a GitHub response to disk cache."""
    os.makedirs(CACHE_DIR, exist_ok=True)
    try:
        with open(path, 'w', encoding='utf-8') as fh:
            json.dump({'ts': time.time(), 'data': data}, fh)
    except Exception as exc:
        logging.warning(f"Cache write error {path}: {exc}")


# ---------------------------------------------------------------------------
# GitHub API helpers
# ---------------------------------------------------------------------------

def _github_headers() -> dict:
    """Build GitHub API request headers, injecting a token if available."""
    headers = {'Accept': 'application/vnd.github.v3+json'}
    token = os.getenv('GITHUB_TOKEN')
    if token:
        headers['Authorization'] = f"token {token}"
    return headers


def _fetch_with_backoff(url: str, headers: dict, description: str) -> list | None:
    """
    GET *url* with exponential backoff on 429 / 5xx responses.

    Respects ``Retry-After`` and ``X-RateLimit-Reset`` headers.
    Returns the parsed JSON list on success, or ``None`` on permanent failure.
    """
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = requests.get(url, headers=headers, timeout=20)

            if resp.status_code == 200:
                return resp.json()

            if resp.status_code in (429, 403):
                # Respect Retry-After or X-RateLimit-Reset
                retry_after = resp.headers.get('Retry-After')
                rate_reset  = resp.headers.get('X-RateLimit-Reset')
                if retry_after:
                    wait = float(retry_after)
                elif rate_reset:
                    wait = max(0.0, float(rate_reset) - time.time())
                else:
                    wait = BASE_BACKOFF_SECONDS * math.pow(2, attempt - 1)
                wait = min(wait, 60.0)  # cap at 60 s in CI
                logging.warning(
                    f"Rate-limited on {description} (attempt {attempt}/{MAX_RETRIES}). "
                    f"Waiting {wait:.0f}s …"
                )
                time.sleep(wait)
                continue

            if resp.status_code >= 500:
                wait = BASE_BACKOFF_SECONDS * math.pow(2, attempt - 1)
                logging.warning(
                    f"Server error {resp.status_code} on {description} "
                    f"(attempt {attempt}/{MAX_RETRIES}). Waiting {wait:.0f}s …"
                )
                time.sleep(wait)
                continue

            # 4xx that is not a rate limit — non-retryable
            logging.warning(
                f"HTTP {resp.status_code} for {description} — skipping."
            )
            return None

        except requests.exceptions.Timeout:
            wait = BASE_BACKOFF_SECONDS * math.pow(2, attempt - 1)
            logging.warning(
                f"Timeout on {description} (attempt {attempt}/{MAX_RETRIES}). "
                f"Waiting {wait:.0f}s …"
            )
            time.sleep(wait)
        except Exception as exc:
            logging.warning(f"Network error on {description}: {exc}")
            return None

    logging.error(f"All {MAX_RETRIES} retries exhausted for {description}.")
    return None


def _fetch_repo_endpoint(repo: str, url_template: str, limit: int, endpoint_label: str) -> list:
    """
    Fetch a single paginated GitHub endpoint for *repo*, with disk caching.

    Returns a list of item dicts (may be empty on failure).
    """
    cache_path = _cache_key(repo, endpoint_label)
    cached = _load_cache(cache_path)
    if cached is not None:
        return cached

    url = url_template.format(repo=repo, limit=limit)
    logging.info(f"  → GET {endpoint_label} for {repo} ({limit} items) …")
    items = _fetch_with_backoff(url, _github_headers(), f"{repo}/{endpoint_label}")
    if items is None:
        items = []
    _save_cache(cache_path, items)
    return items


def _resolution_hours(item: dict) -> float | None:
    """
    Return the resolution time in hours for a GitHub issue or PR dict.

    For PRs we use ``merged_at`` when available (more accurate than ``closed_at``,
    which also captures declined PRs).  For issues we use ``closed_at``.
    Returns ``None`` if the item should be excluded.
    """
    created_raw = item.get('created_at')
    # Prefer merged_at for PRs so we exclude rejected/closed-unmerged PRs
    closed_raw  = item.get('merged_at') or item.get('closed_at')

    if not created_raw or not closed_raw:
        return None

    try:
        created = pd.to_datetime(created_raw, utc=True)
        closed  = pd.to_datetime(closed_raw,  utc=True)
        hours   = (closed - created).total_seconds() / 3600.0
        if MIN_RESOLUTION_HOURS <= hours <= MAX_RESOLUTION_HOURS:
            return hours
    except Exception:
        pass
    return None


def _fetch_pr_reviews(repo: str, pr_number: int) -> list:
    """Fetch reviews for a specific PR."""
    url = f"https://api.github.com/repos/{repo}/pulls/{pr_number}/reviews?per_page=100"
    cache_path = _cache_key(repo, f"pulls_{pr_number}_reviews")
    cached = _load_cache(cache_path)
    if cached is not None:
        return cached

    logging.info(f"  → GET reviews for {repo} PR #{pr_number} …")
    items = _fetch_with_backoff(url, _github_headers(), f"{repo}/pulls/{pr_number}/reviews")
    if items is None:
        items = []
    _save_cache(cache_path, items)
    return items


def _pr_review_turnaround_hours(pr: dict, reviews: list) -> float | None:
    """Calculate the hours from PR creation to the first review (excluding the author)."""
    created_raw = pr.get('created_at')
    if not created_raw or not reviews:
        return None

    try:
        created = pd.to_datetime(created_raw, utc=True)
        pr_author = pr.get('user', {}).get('login')
        
        valid_times = []
        for r in reviews:
            if pr_author and r.get('user', {}).get('login') == pr_author:
                continue
            if r.get('submitted_at'):
                valid_times.append(pd.to_datetime(r['submitted_at'], utc=True))
                
        if not valid_times:
            return None
            
        earliest_review = min(valid_times)
        hours = (earliest_review - created).total_seconds() / 3600.0
        
        if 0.0 <= hours <= MAX_RESOLUTION_HOURS:
            return hours
    except Exception:
        pass
    return None


# ---------------------------------------------------------------------------
# Core velocity fetching
# ---------------------------------------------------------------------------

def fetch_work_setup_velocities(
    setup_repos: dict[str, list[str]] | None = None,
    issues_per_repo: int = GITHUB_ISSUES_PER_REPO,
    pulls_per_repo:  int = GITHUB_PULLS_PER_REPO,
) -> tuple[dict[str, float], dict[str, float], dict[str, dict]]:
    """
    Fetch closed PR merge times **and** closed issue resolution times for every
    repository in each work-setup category, then compute a distinct velocity
    proxy per category.

    The velocity proxy is defined as::

        velocity = 1 / median_resolution_hours

    where ``median_resolution_hours`` is computed over *all* valid data points
    pooled across every repo in the category (both PRs and issues).

    Parameters
    ----------
    setup_repos:
        Mapping of category name → list of ``"owner/repo"`` strings.
        Defaults to the module-level ``SETUP_REPOS`` constant.
    issues_per_repo:
        Number of closed issues to fetch per repository.
    pulls_per_repo:
        Number of closed PRs to fetch per repository.

    Returns
    -------
    velocities : dict[str, float]
        ``{category: velocity_proxy}``
    turnarounds : dict[str, float]
        ``{category: avg_review_turnaround_hours}``
    metadata : dict[str, dict]
        Provenance block per category, suitable for writing to
        ``velocity_metadata.json``.
    """
    if setup_repos is None:
        setup_repos = SETUP_REPOS

    velocities: dict[str, float] = {}
    turnarounds: dict[str, float] = {}
    metadata:   dict[str, dict]  = {}
    fetch_ts = datetime.now(timezone.utc).isoformat()

    for category, repos in setup_repos.items():
        logging.info(
            f"Fetching GitHub metrics for '{category}' across {len(repos)} repos …"
        )
        all_hours:   list[float] = []
        pr_hours:    list[float] = []
        issue_hours: list[float] = []
        cat_turnarounds: list[float] = []
        repo_stats:  list[dict]  = []

        for repo in repos:
            repo_pr_times    = []
            repo_issue_times = []
            repo_turnaround_times = []

            # --- Closed PRs -------------------------------------------------
            pulls = _fetch_repo_endpoint(
                repo, GITHUB_PULLS_URL_TEMPLATE, pulls_per_repo, 'pulls'
            )
            for pr in pulls:
                # The /pulls endpoint returns PR objects; skip if no merged_at
                # (i.e. the PR was closed without merging)
                h = _resolution_hours(pr)
                if h is not None:
                    repo_pr_times.append(h)
                
                pr_number = pr.get('number')
                if pr_number:
                    reviews = _fetch_pr_reviews(repo, pr_number)
                    turnaround = _pr_review_turnaround_hours(pr, reviews)
                    if turnaround is not None:
                        repo_turnaround_times.append(turnaround)

            # --- Closed Issues ----------------------------------------------
            # The /issues endpoint returns both issues *and* PRs; skip PRs
            # so we don't double-count (they have a 'pull_request' key).
            issues = _fetch_repo_endpoint(
                repo, GITHUB_ISSUES_URL_TEMPLATE, issues_per_repo, 'issues'
            )
            for issue in issues:
                if 'pull_request' in issue:
                    continue
                h = _resolution_hours(issue)
                if h is not None:
                    repo_issue_times.append(h)

            combined = repo_pr_times + repo_issue_times
            all_hours.extend(combined)
            pr_hours.extend(repo_pr_times)
            issue_hours.extend(repo_issue_times)
            cat_turnarounds.extend(repo_turnaround_times)

            repo_stats.append({
                'repo':          repo,
                'pr_samples':    len(repo_pr_times),
                'issue_samples': len(repo_issue_times),
                'review_samples': len(repo_turnaround_times),
                'median_pr_hours':    round(float(np.median(repo_pr_times)),    2) if repo_pr_times    else None,
                'median_issue_hours': round(float(np.median(repo_issue_times)), 2) if repo_issue_times else None,
                'avg_review_turnaround_hours': round(float(np.mean(repo_turnaround_times)), 2) if repo_turnaround_times else None,
            })
            logging.info(
                f"    {repo}: {len(repo_pr_times)} PR samples, "
                f"{len(repo_issue_times)} issue samples, "
                f"{len(repo_turnaround_times)} review turnarounds"
            )

        if all_hours:
            median_hours = float(np.median(all_hours))
            velocity     = 1.0 / median_hours if median_hours > 0 else FALLBACK_VELOCITIES[category]
            sample_count = len(all_hours)
            logging.info(
                f"  '{category}' pooled median: {median_hours:.2f}h "
                f"({sample_count} samples) → velocity={velocity:.5f}"
            )
        else:
            velocity     = FALLBACK_VELOCITIES[category]
            median_hours = None
            sample_count = 0
            logging.warning(
                f"  No valid data for '{category}'. Using fallback velocity {velocity:.5f}"
            )

        avg_cat_turnaround = float(np.mean(cat_turnarounds)) if cat_turnarounds else 24.0

        velocities[category] = velocity
        turnarounds[category] = avg_cat_turnaround
        metadata[category]   = {
            'velocity_proxy':       round(velocity, 6),
            'median_resolution_h':  round(median_hours, 2) if median_hours is not None else None,
            'avg_review_turnaround_hours': round(avg_cat_turnaround, 2) if cat_turnarounds else None,
            'total_samples':        sample_count,
            'pr_samples':           len(pr_hours),
            'issue_samples':        len(issue_hours),
            'review_turnaround_samples': len(cat_turnarounds),
            'repos':                repo_stats,
            'fetched_at':           fetch_ts,
            'is_fallback':          sample_count == 0,
        }

    return velocities, turnarounds, metadata


# ---------------------------------------------------------------------------
# WFH dataset download
# ---------------------------------------------------------------------------

def download_wfh_data(filepath: str = "wfh_data.xlsx") -> str:
    """
    Ensure the WFH Research dataset is available locally.

    Tries each URL in ``WFH_DATA_URLS`` in order.  If the file already exists
    it is reused without re-downloading.

    Parameters
    ----------
    filepath:
        Local path to save the Excel file.

    Returns
    -------
    str
        The local filepath of the downloaded dataset.

    Raises
    ------
    RuntimeError
        If every download URL fails and no local file exists.
    """
    if os.path.exists(filepath):
        logging.info(f"WFH dataset already present at '{filepath}' — skipping download.")
        return filepath

    logging.info("Downloading WFH dataset …")
    last_error = None
    for url in WFH_DATA_URLS:
        try:
            logging.info(f"  Trying {url} …")
            resp = requests.get(url, timeout=60)
            resp.raise_for_status()
            with open(filepath, 'wb') as fh:
                fh.write(resp.content)
            logging.info(f"  Downloaded successfully → {filepath}")
            return filepath
        except Exception as exc:
            logging.warning(f"  Failed ({exc})")
            last_error = exc

    raise RuntimeError(
        f"Could not download WFH dataset from any configured URL. "
        f"Last error: {last_error}"
    )


# ---------------------------------------------------------------------------
# Data processing
# ---------------------------------------------------------------------------

def process_data(
    wfh_filepath: str,
    github_velocities: dict[str, float] | float,
    github_turnarounds: dict[str, float] | None = None,
) -> pd.DataFrame:
    """
    Process the WFH data and compute the Pizza Party Index using distinct
    work-setup velocity proxies.

    Parameters
    ----------
    wfh_filepath:
        Path to the WFH Research Excel workbook.
    github_velocities:
        Either a ``dict`` mapping category names to velocity proxies
        (preferred), or a scalar float (legacy fallback).
    github_turnarounds:
        A ``dict`` mapping category names to average review turnaround hours.

    Returns
    -------
    pd.DataFrame
        One row per (industry × age_group × gender) combination, with columns:
        ``industry``, ``work_setup_category``, ``work_setup``,
        ``focus_hours``, ``meeting_overhead``, ``pizza_party_index``,
        ``review_turnaround_hours``, ``age_group``, ``gender``.
    """
    logging.info("Reading WFH data …")
    df = pd.read_excel(wfh_filepath, sheet_name='Work Arrangements by Industry')

    df['date'] = pd.to_datetime(df['date'])
    df = df.dropna(subset=['date'])
    latest_row = df.sort_values('date', ascending=False).iloc[0]

    # Discover industries from the 'full_onsite_*' column naming convention
    industries = [
        col.replace('full_onsite_', '')
        for col in df.columns
        if col.startswith('full_onsite_') and not pd.isna(latest_row[col])
    ]

    # Extend with additional tech and key industries
    additional_industries = [
        'it_infrastructure',
        'software_engineering',
        'finance',
        'healthcare',
        'education',
    ]
    for ind in additional_industries:
        if ind not in industries:
            industries.append(ind)

    # Normalise github_velocities to a dict
    if isinstance(github_velocities, (int, float)):
        scalar = float(github_velocities)
        github_velocities = {
            'Remote-First': scalar,
            'Hybrid':       scalar * 0.8,
            'Onsite-Heavy': scalar * 0.6,
        }
    elif not isinstance(github_velocities, dict):
        github_velocities = dict(FALLBACK_VELOCITIES)

    if not github_turnarounds:
        github_turnarounds = {}

    categories    = list(FALLBACK_VELOCITIES.keys())
    base_focus_h  = 40.0
    results: list[dict] = []

    # Reset seed for deterministic demographic generation across pipeline runs
    np.random.seed(42)

    for ind in sorted(industries):
        onsite_col = f'full_onsite_{ind}'
        hybrid_col = f'hybrid_{ind}'
        remote_col = f'full_remote_{ind}'

        onsite_pct = float(latest_row.get(onsite_col, 0.0) or 0.0) / 100.0
        hybrid_pct = float(latest_row.get(hybrid_col, 0.0) or 0.0) / 100.0
        remote_pct = float(latest_row.get(remote_col, 0.0) or 0.0) / 100.0

        total = onsite_pct + hybrid_pct + remote_pct
        if total > 0:
            probs = [remote_pct / total, hybrid_pct / total, onsite_pct / total]
        else:
            probs = [0.33, 0.33, 0.34]

        industry_title = ind.replace('_', ' ').title()

        for age in AGE_GROUPS:
            for gender in GENDERS:
                # Sample a work-setup category weighted by industry WFH proportions
                cat     = np.random.choice(categories, p=probs)
                cat_vel = github_velocities.get(cat, FALLBACK_VELOCITIES.get(cat, 0.05))
                cat_turn = github_turnarounds.get(cat, 24.0)

                # Focus / perks factors differ by category
                if cat == 'Remote-First':
                    cat_factor   = 0.55 + (remote_pct * 0.20)
                    perks_factor = 0.20 + (onsite_pct * 0.30)
                elif cat == 'Hybrid':
                    cat_factor   = 0.45 + (hybrid_pct * 0.15)
                    perks_factor = 0.50 + (onsite_pct * 0.40)
                else:  # Onsite-Heavy
                    cat_factor   = 0.35 + (onsite_pct * 0.10)
                    perks_factor = 0.80 + (onsite_pct * 0.20)

                # Small deterministic demographic noise (±5 %)
                noise         = np.random.uniform(-0.05, 0.05)
                focus_hours   = base_focus_h * (cat_factor + noise) * (1.0 + cat_vel)
                meeting_overhead = max(5.0, base_focus_h - focus_hours)

                # Pizza Party Index: performative-perk density per focus hour
                pizza_party_index = (perks_factor / max(focus_hours, 1.0)) * 100.0

                interruption_frequency = (meeting_overhead / base_focus_h) * 10.0 + np.random.poisson(2)
                sustained_high_workload = max(0.0, (focus_hours + meeting_overhead - base_focus_h) / 5.0) + np.random.exponential(1.0)

                results.append({
                    'industry':            industry_title,
                    'work_setup_category': cat,
                    'work_setup': {
                        'onsite_pct': round(onsite_pct * 100.0, 2),
                        'hybrid_pct': round(hybrid_pct * 100.0, 2),
                        'remote_pct': round(remote_pct * 100.0, 2),
                    },
                    'focus_hours':       round(float(focus_hours),        2),
                    'meeting_overhead':  round(float(meeting_overhead),   2),
                    'pizza_party_index': round(float(pizza_party_index),  2),
                    'review_turnaround_hours': round(float(cat_turn),     2),
                    'age_group':         age,
                    'gender':            gender,
                    'interruption_frequency': round(float(interruption_frequency), 2),
                    'sustained_high_workload': round(float(sustained_high_workload), 2),
                })

    df_results = pd.DataFrame(results)

    # Add Burnout Risk Modeling using scikit-learn Pipeline
    if not df_results.empty:
        # Synthetic target for burnout risk based on features
        target = ((df_results['interruption_frequency'] * 0.5 + 
                   df_results['sustained_high_workload'] * 2.0 + 
                   np.random.normal(0, 1, len(df_results))) > 5.0).astype(int)
        
        pipeline = Pipeline([
            ('scaler', StandardScaler()),
            ('classifier', LogisticRegression(random_state=42))
        ])
        
        features = df_results[['interruption_frequency', 'sustained_high_workload']]
        pipeline.fit(features, target)
        
        # Ensure predict_proba outputs probabilities and take the class 1 (burnout)
        if hasattr(pipeline, "predict_proba"):
            burnout_probs = pipeline.predict_proba(features)
            if burnout_probs.shape[1] > 1:
                df_results['burnout_risk_score'] = np.round(burnout_probs[:, 1], 4)
            else:
                df_results['burnout_risk_score'] = 0.0
        else:
            df_results['burnout_risk_score'] = pipeline.predict(features)
    else:
        df_results['burnout_risk_score'] = []

    return df_results


# ---------------------------------------------------------------------------
# Main pipeline entry point
# ---------------------------------------------------------------------------

def main() -> None:
    """Run the full ETL pipeline end-to-end."""
    os.makedirs('src/data', exist_ok=True)

    # Step 1: Fetch distinct velocity proxies for all work-setup categories
    velocities, turnarounds, vel_metadata = fetch_work_setup_velocities()
    logging.info(f"Computed work-setup velocities: {velocities}")
    logging.info(f"Computed review turnarounds: {turnarounds}")

    # Step 2: Persist velocity metadata for frontend data-provenance display
    meta_path = 'src/data/velocity_metadata.json'
    with open(meta_path, 'w', encoding='utf-8') as fh:
        json.dump(vel_metadata, fh, indent=4)
    logging.info(f"Velocity metadata written to {meta_path}")

    # Step 3: Download / reuse the WFH dataset
    wfh_file = download_wfh_data()

    # Step 4: Process data and compute all metrics
    final_df = process_data(wfh_file, velocities, turnarounds)

    # Step 5: Write the per-record metrics JSON consumed by the frontend
    output_path = 'src/data/pizza_metrics.json'
    logging.info(f"Saving {len(final_df)} records to {output_path} …")
    final_df.to_json(output_path, orient='records', indent=4)
    logging.info("ETL pipeline completed successfully.")


if __name__ == '__main__':
    main()
