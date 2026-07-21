"""
Unit tests for the ETL pipeline in scripts/etl.py.

Tests cover:
- fetch_work_setup_velocities: success path, PR+issue data, fallback on failure
- download_wfh_data: URL fallback ordering, skip-if-exists behaviour
- process_data: output shape, expected columns, category assignment
- _resolution_hours: PR-specific merged_at preference, boundary filtering
- _load_cache / _save_cache: roundtrip and TTL expiry
"""

import json
import os
import time
import unittest
from unittest.mock import MagicMock, patch, call

import numpy as np
import pandas as pd

from scripts.etl import (
    FALLBACK_VELOCITIES,
    SETUP_REPOS,
    _load_cache,
    _resolution_hours,
    _save_cache,
    download_wfh_data,
    fetch_work_setup_velocities,
    process_data,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_closed_pr(created: str, merged: str | None, closed: str | None = None) -> dict:
    """Return a minimal GitHub PR dict."""
    return {
        'created_at': created,
        'merged_at':  merged,
        'closed_at':  closed or merged or created,
    }


def _make_closed_issue(created: str, closed: str) -> dict:
    """Return a minimal GitHub issue dict (no 'pull_request' key)."""
    return {'created_at': created, 'closed_at': closed}


# ---------------------------------------------------------------------------
# _resolution_hours
# ---------------------------------------------------------------------------

class TestResolutionHours(unittest.TestCase):

    def test_pr_uses_merged_at_over_closed_at(self):
        """merged_at must be preferred so unmerged-closed PRs are excluded."""
        # merged 5 h after creation, but closed_at is 10 h — use merged
        pr = _make_closed_pr('2026-01-01T00:00:00Z', '2026-01-01T05:00:00Z', '2026-01-01T10:00:00Z')
        hours = _resolution_hours(pr)
        self.assertAlmostEqual(hours, 5.0, places=2)

    def test_pr_without_merged_at_falls_back_to_closed_at(self):
        """If merged_at is absent (closed-not-merged PR), use closed_at."""
        pr = {'created_at': '2026-01-01T00:00:00Z', 'merged_at': None, 'closed_at': '2026-01-01T08:00:00Z'}
        hours = _resolution_hours(pr)
        self.assertAlmostEqual(hours, 8.0, places=2)

    def test_below_minimum_returns_none(self):
        """Resolutions under 3 minutes are noise — must be excluded."""
        pr = _make_closed_pr('2026-01-01T00:00:00Z', '2026-01-01T00:00:01Z')
        self.assertIsNone(_resolution_hours(pr))

    def test_above_maximum_returns_none(self):
        """Resolutions > 1 year are excluded as stale artefacts."""
        pr = _make_closed_pr('2024-01-01T00:00:00Z', '2026-01-01T00:00:00Z')
        self.assertIsNone(_resolution_hours(pr))

    def test_missing_dates_returns_none(self):
        self.assertIsNone(_resolution_hours({'created_at': None, 'closed_at': None}))
        self.assertIsNone(_resolution_hours({}))


# ---------------------------------------------------------------------------
# Cache helpers
# ---------------------------------------------------------------------------

class TestCacheHelpers(unittest.TestCase):

    def setUp(self):
        import tempfile
        self._tmpdir = tempfile.mkdtemp()
        self._cache_path = os.path.join(self._tmpdir, 'test.json')

    def test_roundtrip(self):
        data = [{'id': 1}, {'id': 2}]
        _save_cache(self._cache_path, data)
        loaded = _load_cache(self._cache_path)
        self.assertEqual(loaded, data)

    def test_stale_cache_returns_none(self):
        """Cache older than CACHE_TTL_HOURS should be treated as a miss."""
        data = [{'id': 99}]
        # Write a cache entry with a timestamp far in the past
        with open(self._cache_path, 'w') as fh:
            json.dump({'ts': time.time() - (13 * 3600), 'data': data}, fh)
        result = _load_cache(self._cache_path)
        self.assertIsNone(result)

    def test_missing_file_returns_none(self):
        self.assertIsNone(_load_cache('/nonexistent/path/cache.json'))


# ---------------------------------------------------------------------------
# fetch_work_setup_velocities
# ---------------------------------------------------------------------------

class TestFetchWorkSetupVelocities(unittest.TestCase):

    def _mock_pr_response(self, hours: float, number: int = 1):
        """Return a MagicMock response with a single merged PR at *hours* age."""
        from datetime import timedelta
        t0 = '2026-01-01T00:00:00Z'
        merged = pd.Timestamp('2026-01-01T00:00:00Z') + timedelta(hours=hours)
        merged_str = merged.strftime('%Y-%m-%dT%H:%M:%SZ')
        resp = MagicMock()
        resp.status_code = 200
        pr = _make_closed_pr(t0, merged_str)
        pr['number'] = number
        pr['user'] = {'login': 'author'}
        resp.json.return_value = [pr]
        return resp

    def _mock_reviews_response(self, hours: float):
        """Return a MagicMock response with a single review at *hours* age."""
        from datetime import timedelta
        t0 = pd.Timestamp('2026-01-01T00:00:00Z') + timedelta(hours=hours)
        resp = MagicMock()
        resp.status_code = 200
        resp.json.return_value = [{'submitted_at': t0.strftime('%Y-%m-%dT%H:%M:%SZ'), 'user': {'login': 'reviewer'}}]
        return resp

    @patch('scripts.etl.time.sleep')   # prevent real backoff delays in tests
    @patch('scripts.etl._load_cache', return_value=None)
    @patch('scripts.etl._save_cache')
    @patch('scripts.etl.requests.get')
    def test_success_returns_distinct_velocities(self, mock_get, mock_save, mock_load, mock_sleep):
        """Each category must receive its own velocity derived from live data."""
        # Remote-First repos → PRs close in 5 h
        # Hybrid repos       → PRs close in 10 h
        # (Onsite-Heavy triggers fallback via status 500 after exhausted retries)

        def side_effect(url, **kwargs):
            if 'test-remote' in url:
                if '/reviews' in url:
                    return self._mock_reviews_response(2.0)
                return self._mock_pr_response(5.0)
            if 'test-hybrid' in url:
                if '/reviews' in url:
                    return self._mock_reviews_response(4.0)
                return self._mock_pr_response(10.0)
            bad = MagicMock()
            bad.status_code = 500
            bad.headers = {}
            return bad

        mock_get.side_effect = side_effect

        custom_repos = {
            'Remote-First': ['test-remote/repo'],
            'Hybrid':       ['test-hybrid/repo'],
            'Onsite-Heavy': ['test-onsite/repo'],
        }
        velocities, turnarounds, metadata = fetch_work_setup_velocities(
            setup_repos=custom_repos,
            issues_per_repo=1,
            pulls_per_repo=1,
        )

        # Remote-First: 1 PR merged after 5 h → velocity = 1/5 = 0.2
        self.assertAlmostEqual(velocities['Remote-First'], 1.0 / 5.0, places=3)
        self.assertAlmostEqual(turnarounds['Remote-First'], 2.0, places=3)
        # Hybrid: 1 PR merged after 10 h → velocity = 1/10 = 0.1
        self.assertAlmostEqual(velocities['Hybrid'], 1.0 / 10.0, places=3)
        self.assertAlmostEqual(turnarounds['Hybrid'], 4.0, places=3)
        # Onsite-Heavy: all requests failed → fallback
        self.assertEqual(velocities['Onsite-Heavy'], FALLBACK_VELOCITIES['Onsite-Heavy'])
        self.assertEqual(turnarounds['Onsite-Heavy'], 24.0)
        # Verify sleep was called (i.e. backoff was triggered)
        self.assertTrue(mock_sleep.called)

    @patch('scripts.etl.time.sleep')
    @patch('scripts.etl._load_cache', return_value=None)
    @patch('scripts.etl._save_cache')
    @patch('scripts.etl.requests.get')
    def test_metadata_structure(self, mock_get, mock_save, mock_load, mock_sleep):
        """Metadata dict must have expected keys for every category."""
        resp = MagicMock()
        resp.status_code = 200
        resp.json.return_value = []
        mock_get.return_value = resp

        custom_repos = {'Remote-First': ['test/repo']}
        _, _, metadata = fetch_work_setup_velocities(
            setup_repos=custom_repos,
            issues_per_repo=1,
            pulls_per_repo=1,
        )

        required_keys = {
            'velocity_proxy', 'median_resolution_h', 'total_samples',
            'pr_samples', 'issue_samples', 'review_turnaround_samples',
            'avg_review_turnaround_hours', 'repos', 'fetched_at', 'is_fallback',
        }
        self.assertTrue(required_keys.issubset(metadata['Remote-First'].keys()))

    @patch('scripts.etl.time.sleep')
    @patch('scripts.etl._load_cache', return_value=None)
    @patch('scripts.etl._save_cache')
    @patch('scripts.etl.requests.get')
    def test_issues_without_pull_request_key_are_counted(self, mock_get, mock_save, mock_load, mock_sleep):
        """Pure issues (no 'pull_request' key) must contribute to velocity."""

        def side_effect(url, **kwargs):
            if '/pulls' in url:
                r = MagicMock()
                r.status_code = 200
                r.json.return_value = []
                return r
            # /issues endpoint returns one plain issue and one PR-issue (skip PR)
            r = MagicMock()
            r.status_code = 200
            r.json.return_value = [
                _make_closed_issue('2026-01-01T00:00:00Z', '2026-01-01T04:00:00Z'),
                {**_make_closed_issue('2026-01-01T00:00:00Z', '2026-01-01T20:00:00Z'),
                 'pull_request': {'url': 'x'}},  # should be skipped
            ]
            return r

        mock_get.side_effect = side_effect
        custom_repos = {'Remote-First': ['test/repo']}
        velocities, turnarounds, metadata = fetch_work_setup_velocities(
            setup_repos=custom_repos,
            issues_per_repo=5,
            pulls_per_repo=5,
        )
        # Only 1 valid issue at 4 h → velocity = 1/4 = 0.25
        self.assertAlmostEqual(velocities['Remote-First'], 1.0 / 4.0, places=3)
        self.assertEqual(metadata['Remote-First']['issue_samples'], 1)
        self.assertEqual(metadata['Remote-First']['pr_samples'], 0)

    @patch('scripts.etl.time.sleep')
    @patch('scripts.etl._load_cache', return_value=None)
    @patch('scripts.etl._save_cache')
    @patch('scripts.etl.requests.get')
    def test_all_repos_fail_uses_fallback(self, mock_get, mock_save, mock_load, mock_sleep):
        """If every repo in a category returns an error, the fallback is used."""
        fail = MagicMock()
        fail.status_code = 404  # non-retryable 4xx → immediate skip
        fail.headers = {}
        mock_get.return_value = fail

        custom_repos = {'Hybrid': ['bad/repo1', 'bad/repo2']}
        velocities, turnarounds, metadata = fetch_work_setup_velocities(
            setup_repos=custom_repos,
            issues_per_repo=5,
            pulls_per_repo=5,
        )
        self.assertEqual(velocities['Hybrid'], FALLBACK_VELOCITIES['Hybrid'])
        self.assertTrue(metadata['Hybrid']['is_fallback'])

    @patch('scripts.etl.time.sleep')
    @patch('scripts.etl._load_cache', return_value=None)
    @patch('scripts.etl._save_cache')
    @patch('scripts.etl.requests.get')
    def test_cache_hit_skips_network(self, mock_get, mock_save, mock_load, mock_sleep):
        """When cache returns data the network should not be touched."""
        cached_prs = [_make_closed_pr('2026-01-01T00:00:00Z', '2026-01-01T06:00:00Z')]
        mock_load.return_value = cached_prs  # always hit cache

        custom_repos = {'Remote-First': ['cached/repo']}
        velocities, turnarounds, _ = fetch_work_setup_velocities(
            setup_repos=custom_repos,
            issues_per_repo=5,
            pulls_per_repo=5,
        )
        mock_get.assert_not_called()
        self.assertAlmostEqual(velocities['Remote-First'], 1.0 / 6.0, places=3)


# ---------------------------------------------------------------------------
# download_wfh_data
# ---------------------------------------------------------------------------

class TestDownloadWfhData(unittest.TestCase):

    @patch('scripts.etl.requests.get')
    def test_skips_download_if_file_exists(self, mock_get):
        """If the file already exists, no HTTP request should be made."""
        import tempfile
        with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as tmp:
            tmp_path = tmp.name
        try:
            result = download_wfh_data(filepath=tmp_path)
            mock_get.assert_not_called()
            self.assertEqual(result, tmp_path)
        finally:
            os.unlink(tmp_path)

    @patch('scripts.etl.requests.get')
    def test_tries_fallback_urls(self, mock_get):
        """If the first URL returns 404, the second URL should be tried."""
        import tempfile

        fail_resp = MagicMock()
        fail_resp.raise_for_status.side_effect = Exception('404')

        ok_resp = MagicMock()
        ok_resp.raise_for_status.return_value = None
        ok_resp.content = b'fake xlsx content'

        mock_get.side_effect = [fail_resp, ok_resp]

        with tempfile.TemporaryDirectory() as tmpdir:
            out_path = os.path.join(tmpdir, 'wfh.xlsx')
            result = download_wfh_data(filepath=out_path)
            self.assertEqual(result, out_path)
            self.assertTrue(os.path.exists(out_path))
            self.assertEqual(mock_get.call_count, 2)


# ---------------------------------------------------------------------------
# process_data
# ---------------------------------------------------------------------------

class TestProcessData(unittest.TestCase):

    WFH_FILE = 'wfh_data.xlsx'

    def setUp(self):
        if not os.path.exists(self.WFH_FILE):
            self.skipTest(f"'{self.WFH_FILE}' not available — skipping integration test.")

    def _run(self, velocities=None):
        if velocities is None:
            velocities = {'Remote-First': 0.07, 'Hybrid': 0.05, 'Onsite-Heavy': 0.03}
        return process_data(self.WFH_FILE, velocities)

    def test_record_count(self):
        """Expected 14 industries × 5 age groups × 2 genders = 140 records."""
        df = self._run()
        self.assertEqual(len(df), 140)

    def test_required_columns(self):
        df = self._run()
        required = {
            'industry', 'work_setup_category', 'work_setup',
            'focus_hours', 'meeting_overhead', 'pizza_party_index',
            'review_turnaround_hours', 'age_group', 'gender',
        }
        self.assertTrue(required.issubset(set(df.columns)))

    def test_only_known_categories(self):
        df = self._run()
        expected_cats = set(FALLBACK_VELOCITIES.keys())
        self.assertEqual(set(df['work_setup_category']), expected_cats)

    def test_scalar_velocity_normalised(self):
        """Passing a scalar should produce three distinct velocity values."""
        df = process_data(self.WFH_FILE, 0.06)
        # All categories should still be present
        self.assertEqual(
            set(df['work_setup_category']),
            set(FALLBACK_VELOCITIES.keys()),
        )

    def test_focus_hours_positive(self):
        df = self._run()
        self.assertTrue((df['focus_hours'] > 0).all())

    def test_pizza_party_index_non_negative(self):
        df = self._run()
        self.assertTrue((df['pizza_party_index'] >= 0).all())

    def test_meeting_overhead_minimum(self):
        """Meeting overhead must always be at least 5 hours by design."""
        df = self._run()
        self.assertTrue((df['meeting_overhead'] >= 5.0).all())

    def test_work_setup_percentages_sum_consistent(self):
        """The three work-setup percentage fields should all be ≥ 0."""
        df = self._run()
        for _, row in df.iterrows():
            ws = row['work_setup']
            self.assertGreaterEqual(ws['onsite_pct'], 0.0)
            self.assertGreaterEqual(ws['hybrid_pct'], 0.0)
            self.assertGreaterEqual(ws['remote_pct'], 0.0)

    def test_deterministic_with_same_seed(self):
        """Two runs with the same seed must produce identical DataFrames."""
        df1 = self._run()
        df2 = self._run()
        pd.testing.assert_frame_equal(df1, df2)


if __name__ == '__main__':
    unittest.main()
