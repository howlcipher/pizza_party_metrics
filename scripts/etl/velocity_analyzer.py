import logging
import asyncio
import pandas as pd
import numpy as np
import aiohttp
from datetime import datetime, timezone
from .github_client import GitHubClient

try:
    from scripts import config
except ImportError:
    import config

class VelocityAnalyzer:
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
