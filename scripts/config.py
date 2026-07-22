import os

# GitHub REST API endpoint templates
GITHUB_PULLS_URL_TEMPLATE = "https://api.github.com/repos/{repo}/pulls?state=closed&per_page={limit}&sort=updated&direction=desc"
GITHUB_ISSUES_URL_TEMPLATE = "https://api.github.com/repos/{repo}/issues?state=closed&per_page={limit}&sort=updated&direction=desc"

# WFH Research (Stanford SWAA) monthly dataset URLs
WFH_DATA_URLS = [
    "https://wfhresearch.com/wp-content/uploads/2026/07/WFHtimeseries_monthly.xlsx",
    "https://wfhresearch.com/wp-content/uploads/2025/01/WFHtimeseries_monthly.xlsx",
    "https://wfhresearch.com/wp-content/uploads/2024/01/WFHtimeseries_monthly.xlsx",
]

# GitHub API request settings
GITHUB_ISSUES_PER_REPO = 50
GITHUB_PULLS_PER_REPO = 50
MAX_RETRIES = 4
BASE_BACKOFF_SECONDS = 2

# Disk cache settings
CACHE_DIR = os.path.join(os.path.dirname(__file__), '.cache')
CACHE_TTL_HOURS = 12

# Valid resolution/merge window (in hours)
MIN_RESOLUTION_HOURS = 0.05
MAX_RESOLUTION_HOURS = 8760.0

# Repositories representing distinct work setups
SETUP_REPOS = {
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

# Conservative fallback velocities (issues/hour)
FALLBACK_VELOCITIES = {
    'Remote-First': 0.070,
    'Hybrid': 0.050,
    'Onsite-Heavy': 0.035,
}

# ETL Settings
ETL_SETTINGS = {
    'random_seed': 42,
    'synthetic_n_size': 5000,
    'base_focus_hours': 40.0,
    'review_turnaround_default': 24.0,
}

# Demographics Configuration
DEMOGRAPHICS = {
    'age_groups': ['18-24', '25-34', '35-44', '45-54', '55+'],
    'age_distribution': [0.10, 0.35, 0.30, 0.15, 0.10],
    'genders': ['Male', 'Female'],
    'gender_distribution': [0.52, 0.48]
}

# Injected Industries (to ensure broad coverage if original WFH dataset
# lacks them). 'healthcare' and 'education' are no-ops here since the WFH
# dataset already carries those columns natively.
#
# Removed 'it_infrastructure', 'software_engineering', and 'finance': the WFH
# dataset has no full_onsite_/hybrid_/full_remote_ columns for these keys, so
# they silently fell back to a meaningless uniform 33/33/34 split (see
# MetricsProcessor.process's mask_zero handling) instead of real survey data.
# 'finance' also duplicated the real 'finance_insurance' column under a
# different label. Re-add an industry here only once real percentage data
# for it is sourced.
ADDITIONAL_INDUSTRIES = [
    'healthcare',
    'education',
]

# Industries excluded from the dashboard: majority frontline/manual-labor
# roles (retail floor staff, line cooks, warehouse/transport workers,
# factory workers) where the site's core metrics -- Focus Hours vs Meeting
# Overhead, hybrid/remote arrangements, PR-review-based collaboration
# velocity -- don't meaningfully apply.
EXCLUDED_INDUSTRIES = [
    'retail',
    'manufacturing',
    'wholesale',
    'hospitaility_food',
    'transp_warehousing',
]

# Cosmetic renames for real WFH dataset columns whose raw names are
# truncated/abbreviated (e.g. spreadsheet column-width constraints).
INDUSTRY_DISPLAY_NAMES = {
    'Arts Entertain': 'Arts & Entertainment',
    'Prof Bus Services': 'Professional & Business Services',
    'Realestate': 'Real Estate',
}
