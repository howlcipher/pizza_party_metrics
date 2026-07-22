import os
import json
import logging
import time
import math
import hashlib
import asyncio
import aiohttp
import requests
import pandas as pd
from datetime import datetime, timezone
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split

try:
    from scripts import config
except ImportError:
    import config

FALLBACK_VELOCITIES = config.FALLBACK_VELOCITIES
SETUP_REPOS = config.SETUP_REPOS

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


def _load_cache(path: str) -> list | None:
    if not os.path.exists(path):
        return None
    try:
        with open(path, 'r', encoding='utf-8') as fh:
            envelope = json.load(fh)
        if (time.time() - envelope.get('ts', 0)) / 3600.0 <= config.CACHE_TTL_HOURS:
            return envelope['data']
    except Exception as exc:
        logging.debug(f"Cache load error: {exc}")
    return None


def _save_cache(path: str, data: list) -> None:
    try:
        with open(path, 'w', encoding='utf-8') as fh:
            json.dump({'ts': time.time(), 'data': data}, fh)
    except Exception as exc:
        logging.warning(f"Cache write error: {exc}")


class GitHubClient:
    """Handles GitHub API requests asynchronously with exponential backoff and caching."""

    def __init__(self):
        self.headers = {'Accept': 'application/vnd.github.v3+json'}
        if os.getenv('GITHUB_TOKEN'):
            self.headers['Authorization'] = f"token {os.getenv('GITHUB_TOKEN')}"
        os.makedirs(config.CACHE_DIR, exist_ok=True)
        self.semaphore = asyncio.Semaphore(10)

    def _cache_key(self, repo: str, endpoint: str) -> str:
        safe = hashlib.md5(f"{repo}_{endpoint}".encode(), usedforsecurity=False).hexdigest()[:12]
        return os.path.join(config.CACHE_DIR, f"{safe}.json")

    async def fetch_endpoint(self, session: aiohttp.ClientSession, url: str, cache_id: str, description: str) -> list:
        cache_path = self._cache_key(*cache_id)
        cached = _load_cache(cache_path)
        if cached is not None:
            return cached

        logging.info(f"  → GET {description} …")
        items = await self._fetch_with_backoff(session, url, description)
        if items is None:
            items = []
        _save_cache(cache_path, items)
        return items

    async def _fetch_with_backoff(self, session: aiohttp.ClientSession, url: str, description: str) -> list | None:
        async with self.semaphore:
            for attempt in range(1, config.MAX_RETRIES + 1):
                try:
                    async with session.get(url, headers=self.headers, timeout=20) as resp:
                        if resp.status == 200:
                            return await resp.json()
                        if resp.status in (429, 403):
                            wait = float(resp.headers.get('Retry-After') or max(0.0, float(resp.headers.get('X-RateLimit-Reset', 0)) - time.time()) or (config.BASE_BACKOFF_SECONDS * math.pow(2, attempt - 1)))
                            await asyncio.sleep(min(wait, 60.0))
                            continue
                        if resp.status >= 500:
                            await asyncio.sleep(min(config.BASE_BACKOFF_SECONDS * math.pow(2, attempt - 1), 60.0))
                            continue
                        return None
                except Exception as e:
                    logging.error(f"Error fetching {url}: {e}")
                    await asyncio.sleep(min(config.BASE_BACKOFF_SECONDS * math.pow(2, attempt - 1), 60.0))
            return None


class VelocityAnalyzer:
    """Calculates PR merge times and code review turnarounds."""

    def __init__(self, client: GitHubClient):
        self.client = client

    def _resolution_hours(self, item: dict) -> float | None:
        created_raw = item.get('created_at')
        closed_raw = item.get('merged_at') or item.get('closed_at')
        if not created_raw or not closed_raw:
            return None
        try:
            hours = (pd.to_datetime(closed_raw, utc=True) - pd.to_datetime(created_raw, utc=True)).total_seconds() / 3600.0
            if config.MIN_RESOLUTION_HOURS <= hours <= config.MAX_RESOLUTION_HOURS:
                return hours
        except Exception as exc:
            logging.debug(f"Error calculating resolution hours: {exc}")
        return None

    async def analyze(self, setup_repos=None, issues_per_repo=None, pulls_per_repo=None) -> tuple[dict, dict, dict]:
        target_repos = setup_repos or config.SETUP_REPOS
        num_issues = issues_per_repo or config.GITHUB_ISSUES_PER_REPO
        num_pulls = pulls_per_repo or config.GITHUB_PULLS_PER_REPO
        velocities, turnarounds, metadata = {}, {}, {}
        
        async with aiohttp.ClientSession() as session:
            for category, repos in target_repos.items():
                cat_pr_times, cat_issue_times, cat_turnarounds, repo_stats = [], [], [], []
                for repo in repos:
                    pr_url = config.GITHUB_PULLS_URL_TEMPLATE.format(repo=repo, limit=num_pulls)
                    pulls = await self.client.fetch_endpoint(session, pr_url, (repo, 'pulls'), f"{repo}/pulls")
                    
                    repo_pr_times, repo_turnaround_times = [], []
                    
                    # Fetch reviews concurrently
                    review_tasks = []
                    for pr in pulls:
                        h = self._resolution_hours(pr)
                        if h is not None:
                            repo_pr_times.append(h)
                        if pr.get('number'):
                            rev_url = f"https://api.github.com/repos/{repo}/pulls/{pr['number']}/reviews?per_page=100"
                            review_tasks.append((pr, self.client.fetch_endpoint(session, rev_url, (repo, f"pulls_{pr['number']}_reviews"), f"{repo} PR #{pr['number']} reviews")))
                    
                    if review_tasks:
                        results = await asyncio.gather(*(t[1] for t in review_tasks))
                        for (pr, _), reviews in zip(review_tasks, results):
                            t = self._pr_review_turnaround_hours(pr, reviews)
                            if t is not None:
                                repo_turnaround_times.append(t)
                                
                    issue_url = config.GITHUB_ISSUES_URL_TEMPLATE.format(repo=repo, limit=num_issues)
                    issues_raw = await self.client.fetch_endpoint(session, issue_url, (repo, 'issues'), f"{repo}/issues")
                    issues = [i for i in issues_raw if 'pull_request' not in i]
                    repo_issue_times = [h for i in issues if (h := self._resolution_hours(i)) is not None]

                    cat_pr_times.extend(repo_pr_times)
                    cat_issue_times.extend(repo_issue_times)
                    cat_turnarounds.extend(repo_turnaround_times)
                    repo_stats.append({'repo': repo, 'samples': len(repo_pr_times) + len(repo_issue_times)})

                all_hours = cat_pr_times + cat_issue_times
                median_h = float(np.median(all_hours)) if all_hours else None
                is_fallback = median_h is None or median_h <= 0
                velocity = 1.0 / median_h if not is_fallback else config.FALLBACK_VELOCITIES[category]
                avg_turn = float(np.mean(cat_turnarounds)) if cat_turnarounds else config.ETL_SETTINGS['review_turnaround_default']

                velocities[category] = velocity
                turnarounds[category] = avg_turn
                metadata[category] = {
                    'velocity_proxy': round(velocity, 6),
                    'median_resolution_h': round(median_h, 2) if median_h else None,
                    'total_samples': len(all_hours),
                    'pr_samples': len(cat_pr_times),
                    'issue_samples': len(cat_issue_times),
                    'review_turnaround_samples': len(cat_turnarounds),
                    'avg_review_turnaround_hours': round(avg_turn, 2),
                    'repos': repo_stats,
                    'fetched_at': datetime.now(timezone.utc).isoformat(),
                    'is_fallback': is_fallback,
                }
                
        return velocities, turnarounds, metadata

    def _pr_review_turnaround_hours(self, pr: dict, reviews: list) -> float | None:
        created_raw = pr.get('created_at')
        if not created_raw or not reviews:
            return None
        try:
            created = pd.to_datetime(created_raw, utc=True)
            pr_author = pr.get('user', {}).get('login')
            valid_times = [pd.to_datetime(r['submitted_at'], utc=True) for r in reviews if r.get('submitted_at') and r.get('user', {}).get('login') != pr_author]
            if not valid_times:
                return None
            hours = (min(valid_times) - created).total_seconds() / 3600.0
            if 0.0 <= hours <= config.MAX_RESOLUTION_HOURS:
                return hours
        except Exception as exc:
            logging.debug(f"Error calculating review turnaround: {exc}")
        return None


class WFHDataExtractor:
    """Downloads and reads the WFH dataset."""

    @staticmethod
    def download(filepath="raw_data/wfh_data.xlsx") -> str:
        if os.path.exists(filepath):
            return filepath
        for url in config.WFH_DATA_URLS:
            try:
                os.makedirs(os.path.dirname(filepath), exist_ok=True)
                r = requests.get(url, timeout=60)
                r.raise_for_status()
                with open(filepath, 'wb') as f:
                    f.write(r.content)
                return filepath
            except Exception as exc:
                logging.debug(f"Download failed for {url}: {exc}")
        raise RuntimeError("Failed to download WFH dataset.")


class MetricsProcessor:
    """Transforms raw data into the final Pizza Party Index analytics."""

    def __init__(self, wfh_file: str, velocities: dict, turnarounds: dict):
        self.wfh_file = wfh_file
        self.velocities = velocities
        self.turnarounds = turnarounds

    def process(self) -> pd.DataFrame:
        df = pd.read_excel(self.wfh_file, sheet_name='Work Arrangements by Industry')
        df['date'] = pd.to_datetime(df['date'])
        latest_row = df.dropna(subset=['date']).sort_values('date', ascending=False).iloc[0]

        industries = [c.replace('full_onsite_', '') for c in df.columns if c.startswith('full_onsite_') and not pd.isna(latest_row[c])]
        
        # Ingestion Checks
        for ind in industries:
            if f'full_onsite_{ind}' not in latest_row:
                raise ValueError(f"Missing data column for full_onsite_{ind}")
            if f'hybrid_{ind}' not in latest_row:
                raise ValueError(f"Missing data column for hybrid_{ind}")

        industries.extend([i for i in config.ADDITIONAL_INDUSTRIES if i not in industries])
        
        np.random.seed(config.ETL_SETTINGS['random_seed'])
        
        N = config.ETL_SETTINGS['synthetic_n_size']
        df_results = pd.DataFrame({
            'industry_raw': np.random.choice(sorted(industries), size=N),
            'age_group': np.random.choice(config.DEMOGRAPHICS['age_groups'], size=N, p=config.DEMOGRAPHICS['age_distribution']),
            'gender': np.random.choice(config.DEMOGRAPHICS['genders'], size=N, p=config.DEMOGRAPHICS['gender_distribution'])
        })
        
        def get_pct(ind, prefix): return float(latest_row.get(f'{prefix}_{ind}', 0.0) or 0.0) / 100.0
        
        df_results = df_results.assign(
            onsite_pct=lambda x: x['industry_raw'].map(lambda i: get_pct(i, 'full_onsite')),
            hybrid_pct=lambda x: x['industry_raw'].map(lambda i: get_pct(i, 'hybrid')),
            remote_pct=lambda x: x['industry_raw'].map(lambda i: get_pct(i, 'full_remote')),
            industry=lambda x: x['industry_raw'].str.replace('_', ' ').str.title()
        )
        
        mask_zero = (df_results['onsite_pct'] + df_results['hybrid_pct'] + df_results['remote_pct']) == 0
        df_results.loc[mask_zero, ['remote_pct', 'hybrid_pct', 'onsite_pct']] = [0.33, 0.33, 0.34]
        
        total = df_results['onsite_pct'] + df_results['hybrid_pct'] + df_results['remote_pct']
        rand_cat = np.random.uniform(0, 1, size=N)
        p_rem, p_hyb = df_results['remote_pct'] / total, df_results['hybrid_pct'] / total
        
        df_results = df_results.assign(
            work_setup_category=np.select([rand_cat < p_rem, rand_cat < p_rem + p_hyb], ['Remote-First', 'Hybrid'], default='Onsite-Heavy')
        )
        
        df_results = df_results.assign(
            cat_vel=lambda x: x['work_setup_category'].map(lambda c: self.velocities.get(c, 0.05)),
            review_turnaround_hours=lambda x: x['work_setup_category'].map(lambda c: self.turnarounds.get(c, 24.0)).round(2)
        )
        
        df_results = df_results.assign(
            cat_factor=lambda x: np.select(
                [x['work_setup_category'] == 'Remote-First', x['work_setup_category'] == 'Hybrid'],
                [0.55 + x['remote_pct'] * 0.20, 0.45 + x['hybrid_pct'] * 0.15],
                default=0.35 + x['onsite_pct'] * 0.10
            )
        )
        
        base_h = config.ETL_SETTINGS['base_focus_hours']
        df_results = df_results.assign(
            collaboration_score=lambda x: (24.0 / np.maximum(x['review_turnaround_hours'], 1.0) * 10).round(2),
            focus_hours=lambda x: (base_h * (x['cat_factor'] + np.random.uniform(-0.05, 0.05, size=N)) * (1.0 + x['cat_vel'])).round(2)
        )
        df_results = df_results.assign(
            meeting_overhead=lambda x: np.maximum(5.0, base_h - x['focus_hours']).round(2),
        )
        df_results = df_results.assign(
            pizza_party_index=lambda x: (x['focus_hours'] + x['collaboration_score'] * 2.0).round(2),
            interruption_frequency=lambda x: ((x['meeting_overhead'] / base_h) * 10.0 + np.random.poisson(2, size=N)).round(2),
        )
        df_results = df_results.assign(
            sustained_high_workload=lambda x: (np.maximum(0.0, (x['focus_hours'] + x['meeting_overhead'] - base_h) / 5.0) + np.random.exponential(1.0, size=N)).round(2)
        )
        
        df_results['work_setup'] = df_results.apply(lambda row: {'onsite_pct': round(row['onsite_pct'] * 100, 2), 'hybrid_pct': round(row['hybrid_pct'] * 100, 2), 'remote_pct': round(row['remote_pct'] * 100, 2)}, axis=1)
        
        cols = ['industry', 'work_setup_category', 'work_setup', 'focus_hours', 'meeting_overhead', 'pizza_party_index', 'review_turnaround_hours', 'collaboration_score', 'age_group', 'gender', 'interruption_frequency', 'sustained_high_workload']
        df_results = df_results[cols]
        
        pipeline = Pipeline([('scaler', StandardScaler()), ('classifier', LogisticRegression(random_state=config.ETL_SETTINGS['random_seed']))])
        features = df_results[['interruption_frequency', 'sustained_high_workload']]
        target = ((df_results['interruption_frequency'] * 0.5 + df_results['sustained_high_workload'] * 2.0 + np.random.normal(0, 1, N)) > 5.0).astype(int)
        
        X_train, X_test, y_train, y_test = train_test_split(features, target, test_size=0.2, random_state=42)
        pipeline.fit(X_train, y_train)
        
        df_results['burnout_risk_score'] = np.round(pipeline.predict_proba(features)[:, 1], 4) if hasattr(pipeline, "predict_proba") else pipeline.predict(features)
        
        return df_results


class ETLPipeline:
    """Orchestrates the extraction, transformation, and loading of metrics."""

    async def run(self):
        os.makedirs('src/data', exist_ok=True)
        
        client = GitHubClient()
        analyzer = VelocityAnalyzer(client)
        velocities, turnarounds, metadata = await analyzer.analyze()
        
        with open('src/data/velocity_metadata.json', 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=4)
            
        wfh_file = WFHDataExtractor.download()
        processor = MetricsProcessor(wfh_file, velocities, turnarounds)
        final_df = processor.process()
        
        final_df.to_json('src/data/pizza_metrics.json', orient='records', indent=4)
        logging.info("ETL pipeline completed successfully.")


if __name__ == '__main__':
    asyncio.run(ETLPipeline().run())

def _resolution_hours(item: dict) -> float | None:
    return VelocityAnalyzer(GitHubClient())._resolution_hours(item)

def fetch_work_setup_velocities(setup_repos=None, issues_per_repo=None, pulls_per_repo=None) -> tuple[dict, dict, dict]:
    # This requires an event loop in tests, but the test might call this synchronously.
    # We should run it with asyncio if it's async now.
    return asyncio.run(VelocityAnalyzer(GitHubClient()).analyze(setup_repos=setup_repos, issues_per_repo=issues_per_repo, pulls_per_repo=pulls_per_repo))

def download_wfh_data(filepath="raw_data/wfh_data.xlsx") -> str:
    return WFHDataExtractor.download(filepath)

def process_data(wfh_file: str, velocities: dict, turnarounds: dict) -> pd.DataFrame:
    return MetricsProcessor(wfh_file, velocities, turnarounds).process()
