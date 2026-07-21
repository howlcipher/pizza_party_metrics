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

import config

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class GitHubClient:
    """Handles GitHub API requests with exponential backoff, rate limiting, and caching."""
    def __init__(self):
        self.headers = {'Accept': 'application/vnd.github.v3+json'}
        if os.getenv('GITHUB_TOKEN'):
            self.headers['Authorization'] = f"token {os.getenv('GITHUB_TOKEN')}"
        os.makedirs(config.CACHE_DIR, exist_ok=True)

    def _cache_key(self, repo: str, endpoint: str) -> str:
        safe = hashlib.md5(f"{repo}_{endpoint}".encode()).hexdigest()[:12]
        return os.path.join(config.CACHE_DIR, f"{safe}.json")

    def _load_cache(self, path: str) -> list | None:
        if not os.path.exists(path):
            return None
        try:
            with open(path, 'r', encoding='utf-8') as fh:
                envelope = json.load(fh)
            if (time.time() - envelope.get('ts', 0)) / 3600.0 <= config.CACHE_TTL_HOURS:
                return envelope['data']
        except Exception:
            pass
        return None

    def _save_cache(self, path: str, data: list) -> None:
        try:
            with open(path, 'w', encoding='utf-8') as fh:
                json.dump({'ts': time.time(), 'data': data}, fh)
        except Exception as exc:
            logging.warning(f"Cache write error: {exc}")

    def fetch_endpoint(self, url: str, cache_id: str, description: str) -> list:
        cache_path = self._cache_key(*cache_id)
        cached = self._load_cache(cache_path)
        if cached is not None:
            return cached

        logging.info(f"  → GET {description} …")
        items = self._fetch_with_backoff(url, description)
        if items is None:
            items = []
        self._save_cache(cache_path, items)
        return items

    def _fetch_with_backoff(self, url: str, description: str) -> list | None:
        for attempt in range(1, config.MAX_RETRIES + 1):
            try:
                resp = requests.get(url, headers=self.headers, timeout=20)
                if resp.status_code == 200:
                    return resp.json()
                if resp.status_code in (429, 403):
                    wait = float(resp.headers.get('Retry-After') or max(0.0, float(resp.headers.get('X-RateLimit-Reset', 0)) - time.time()) or (config.BASE_BACKOFF_SECONDS * math.pow(2, attempt - 1)))
                    time.sleep(min(wait, 60.0))
                    continue
                if resp.status_code >= 500:
                    time.sleep(min(config.BASE_BACKOFF_SECONDS * math.pow(2, attempt - 1), 60.0))
                    continue
                return None
            except Exception as exc:
                time.sleep(min(config.BASE_BACKOFF_SECONDS * math.pow(2, attempt - 1), 60.0))
        return None

class VelocityAnalyzer:
    """Calculates PR merge times and code review turnarounds."""
    def __init__(self, client: GitHubClient):
        self.client = client

    def _resolution_hours(self, item: dict) -> float | None:
        created_raw = item.get('created_at')
        closed_raw  = item.get('merged_at') or item.get('closed_at')
        if not created_raw or not closed_raw:
            return None
        try:
            hours = (pd.to_datetime(closed_raw, utc=True) - pd.to_datetime(created_raw, utc=True)).total_seconds() / 3600.0
            if config.MIN_RESOLUTION_HOURS <= hours <= config.MAX_RESOLUTION_HOURS:
                return hours
        except Exception:
            pass
        return None

    def analyze(self) -> tuple[dict, dict, dict]:
        velocities, turnarounds, metadata = {}, {}, {}
        for category, repos in config.SETUP_REPOS.items():
            all_hours, cat_turnarounds, repo_stats = [], [], []
            for repo in repos:
                pr_url = config.GITHUB_PULLS_URL_TEMPLATE.format(repo=repo, limit=config.GITHUB_PULLS_PER_REPO)
                pulls = self.client.fetch_endpoint(pr_url, (repo, 'pulls'), f"{repo}/pulls")
                
                repo_pr_times, repo_turnaround_times = [], []
                for pr in pulls:
                    h = self.resolution_hours(pr)
                    if h is not None:
                        repo_pr_times.append(h)
                    if pr.get('number'):
                        rev_url = f"https://api.github.com/repos/{repo}/pulls/{pr['number']}/reviews?per_page=100"
                        reviews = self.client.fetch_endpoint(rev_url, (repo, f"pulls_{pr['number']}_reviews"), f"{repo} PR #{pr['number']} reviews")
                        t = self._pr_review_turnaround_hours(pr, reviews)
                        if t is not None:
                            repo_turnaround_times.append(t)
                            
                issue_url = config.GITHUB_ISSUES_URL_TEMPLATE.format(repo=repo, limit=config.GITHUB_ISSUES_PER_REPO)
                issues = [i for i in self.client.fetch_endpoint(issue_url, (repo, 'issues'), f"{repo}/issues") if 'pull_request' not in i]
                repo_issue_times = [h for i in issues if (h := self._resolution_hours(i)) is not None]

                all_hours.extend(repo_pr_times + repo_issue_times)
                cat_turnarounds.extend(repo_turnaround_times)
                repo_stats.append({'repo': repo, 'samples': len(repo_pr_times) + len(repo_issue_times)})

            median_h = float(np.median(all_hours)) if all_hours else None
            velocity = 1.0 / median_h if median_h and median_h > 0 else config.FALLBACK_VELOCITIES[category]
            avg_turn = float(np.mean(cat_turnarounds)) if cat_turnarounds else config.ETL_SETTINGS['review_turnaround_default']

            velocities[category] = velocity
            turnarounds[category] = avg_turn
            metadata[category] = {'velocity_proxy': round(velocity, 6), 'median_resolution_h': round(median_h, 2) if median_h else None, 'repos': repo_stats}
            
        return velocities, turnarounds, metadata

    def _pr_review_turnaround_hours(self, pr: dict, reviews: list) -> float | None:
        created_raw = pr.get('created_at')
        if not created_raw or not reviews: return None
        try:
            created = pd.to_datetime(created_raw, utc=True)
            pr_author = pr.get('user', {}).get('login')
            valid_times = [pd.to_datetime(r['submitted_at'], utc=True) for r in reviews if r.get('submitted_at') and r.get('user', {}).get('login') != pr_author]
            if not valid_times: return None
            hours = (min(valid_times) - created).total_seconds() / 3600.0
            if 0.0 <= hours <= config.MAX_RESOLUTION_HOURS: return hours
        except Exception: pass
        return None

class WFHDataExtractor:
    """Downloads and reads the WFH dataset."""
    @staticmethod
    def download(filepath="raw_data/wfh_data.xlsx") -> str:
        if os.path.exists(filepath): return filepath
        for url in config.WFH_DATA_URLS:
            try:
                os.makedirs(os.path.dirname(filepath), exist_ok=True)
                r = requests.get(url, timeout=60)
                r.raise_for_status()
                with open(filepath, 'wb') as f: f.write(r.content)
                return filepath
            except Exception: pass
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
            assert f'full_onsite_{ind}' in latest_row, f"Missing data column for full_onsite_{ind}"
            assert f'hybrid_{ind}' in latest_row, f"Missing data column for hybrid_{ind}"

        industries.extend([i for i in config.ADDITIONAL_INDUSTRIES if i not in industries])
        
        np.random.seed(config.ETL_SETTINGS['random_seed'])
        
        N = config.ETL_SETTINGS['synthetic_n_size']
        df_results = pd.DataFrame({
            'industry_raw': np.random.choice(sorted(industries), size=N),
            'age_group': np.random.choice(config.DEMOGRAPHICS['age_groups'], size=N, p=config.DEMOGRAPHICS['age_distribution']),
            'gender': np.random.choice(config.DEMOGRAPHICS['genders'], size=N, p=config.DEMOGRAPHICS['gender_distribution'])
        })
        
        def get_pct(ind, prefix): return float(latest_row.get(f'{prefix}_{ind}', 0.0) or 0.0) / 100.0
        df_results['onsite_pct'] = df_results['industry_raw'].map(lambda x: get_pct(x, 'full_onsite'))
        df_results['hybrid_pct'] = df_results['industry_raw'].map(lambda x: get_pct(x, 'hybrid'))
        df_results['remote_pct'] = df_results['industry_raw'].map(lambda x: get_pct(x, 'full_remote'))
        df_results['industry'] = df_results['industry_raw'].str.replace('_', ' ').str.title()
        
        mask_zero = (df_results['onsite_pct'] + df_results['hybrid_pct'] + df_results['remote_pct']) == 0
        df_results.loc[mask_zero, ['remote_pct', 'hybrid_pct', 'onsite_pct']] = [0.33, 0.33, 0.34]
        
        total = df_results['onsite_pct'] + df_results['hybrid_pct'] + df_results['remote_pct']
        rand_cat = np.random.uniform(0, 1, size=N)
        p_rem, p_hyb = df_results['remote_pct'] / total, df_results['hybrid_pct'] / total
        df_results['work_setup_category'] = np.select([rand_cat < p_rem, rand_cat < p_rem + p_hyb], ['Remote-First', 'Hybrid'], default='Onsite-Heavy')
        
        df_results['cat_vel'] = df_results['work_setup_category'].map(lambda c: self.velocities.get(c, 0.05))
        df_results['review_turnaround_hours'] = df_results['work_setup_category'].map(lambda c: self.turnarounds.get(c, 24.0)).round(2)
        
        df_results['cat_factor'] = np.select(
            [df_results['work_setup_category'] == 'Remote-First', df_results['work_setup_category'] == 'Hybrid'],
            [0.55 + df_results['remote_pct'] * 0.20, 0.45 + df_results['hybrid_pct'] * 0.15],
            default=0.35 + df_results['onsite_pct'] * 0.10
        )
        
        base_h = config.ETL_SETTINGS['base_focus_hours']
        df_results['collaboration_score'] = (24.0 / np.maximum(df_results['review_turnaround_hours'], 1.0)).round(2)
        df_results['focus_hours'] = (base_h * (df_results['cat_factor'] + np.random.uniform(-0.05, 0.05, size=N)) * (1.0 + df_results['cat_vel'])).round(2)
        df_results['meeting_overhead'] = np.maximum(5.0, base_h - df_results['focus_hours']).round(2)
        df_results['pizza_party_index'] = (df_results['focus_hours'] + df_results['collaboration_score'] * 2.0).round(2)
        
        df_results['interruption_frequency'] = ((df_results['meeting_overhead'] / base_h) * 10.0 + np.random.poisson(2, size=N)).round(2)
        df_results['sustained_high_workload'] = (np.maximum(0.0, (df_results['focus_hours'] + df_results['meeting_overhead'] - base_h) / 5.0) + np.random.exponential(1.0, size=N)).round(2)
        
        df_results['work_setup'] = df_results.apply(lambda row: {'onsite_pct': round(row['onsite_pct']*100,2), 'hybrid_pct': round(row['hybrid_pct']*100,2), 'remote_pct': round(row['remote_pct']*100,2)}, axis=1)
        
        cols = ['industry', 'work_setup_category', 'work_setup', 'focus_hours', 'meeting_overhead', 'pizza_party_index', 'review_turnaround_hours', 'age_group', 'gender', 'interruption_frequency', 'sustained_high_workload']
        df_results = df_results[cols]
        
        pipeline = Pipeline([('scaler', StandardScaler()), ('classifier', LogisticRegression(random_state=config.ETL_SETTINGS['random_seed']))])
        features = df_results[['interruption_frequency', 'sustained_high_workload']]
        target = ((df_results['interruption_frequency'] * 0.5 + df_results['sustained_high_workload'] * 2.0 + np.random.normal(0, 1, N)) > 5.0).astype(int)
        pipeline.fit(features, target)
        df_results['burnout_risk_score'] = np.round(pipeline.predict_proba(features)[:, 1], 4) if hasattr(pipeline, "predict_proba") else pipeline.predict(features)
        
        return df_results

class ETLPipeline:
    """Orchestrates the extraction, transformation, and loading of metrics."""
    def run(self):
        os.makedirs('src/data', exist_ok=True)
        
        client = GitHubClient()
        analyzer = VelocityAnalyzer(client)
        velocities, turnarounds, metadata = analyzer.analyze()
        
        with open('src/data/velocity_metadata.json', 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=4)
            
        wfh_file = WFHDataExtractor.download()
        processor = MetricsProcessor(wfh_file, velocities, turnarounds)
        final_df = processor.process()
        
        final_df.to_json('src/data/pizza_metrics.json', orient='records', indent=4)
        logging.info("ETL pipeline completed successfully.")

if __name__ == '__main__':
    ETLPipeline().run()
