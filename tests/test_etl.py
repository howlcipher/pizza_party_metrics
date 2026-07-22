import json
import os
import time
import unittest
from unittest.mock import MagicMock, patch, AsyncMock

import pandas as pd
import pytest

from scripts.config import FALLBACK_VELOCITIES
from scripts.etl.github_client import GitHubClient, _load_cache, _save_cache
from scripts.etl.velocity_analyzer import VelocityAnalyzer
from scripts.etl.wfh_extractor import WFHDataExtractor
from scripts.etl.metrics_processor import MetricsProcessor
import asyncio


def _make_closed_pr(created: str, merged: str | None, closed: str | None = None) -> dict:
    return {'created_at': created, 'merged_at': merged, 'closed_at': closed or merged or created}

def _make_closed_issue(created: str, closed: str) -> dict:
    return {'created_at': created, 'closed_at': closed}

class TestResolutionHours(unittest.TestCase):
    def test_pr_uses_merged_at_over_closed_at(self):
        pr = _make_closed_pr('2026-01-01T00:00:00Z', '2026-01-01T05:00:00Z', '2026-01-01T10:00:00Z')
        self.assertAlmostEqual(VelocityAnalyzer(GitHubClient())._resolution_hours(pr), 5.0, places=2)

    def test_pr_without_merged_at_falls_back_to_closed_at(self):
        pr = {'created_at': '2026-01-01T00:00:00Z', 'merged_at': None, 'closed_at': '2026-01-01T08:00:00Z'}
        self.assertAlmostEqual(VelocityAnalyzer(GitHubClient())._resolution_hours(pr), 8.0, places=2)

    def test_below_minimum_returns_none(self):
        self.assertIsNone(VelocityAnalyzer(GitHubClient())._resolution_hours(_make_closed_pr('2026-01-01T00:00:00Z', '2026-01-01T00:00:01Z')))

    def test_above_maximum_returns_none(self):
        self.assertIsNone(VelocityAnalyzer(GitHubClient())._resolution_hours(_make_closed_pr('2024-01-01T00:00:00Z', '2026-01-01T00:00:00Z')))

    def test_missing_dates_returns_none(self):
        self.assertIsNone(VelocityAnalyzer(GitHubClient())._resolution_hours({'created_at': None, 'closed_at': None}))
        self.assertIsNone(VelocityAnalyzer(GitHubClient())._resolution_hours({}))

class TestCacheHelpers(unittest.TestCase):
    def setUp(self):
        import tempfile
        self._tmpdir = tempfile.mkdtemp()
        self._cache_path = os.path.join(self._tmpdir, 'test.json')

    def test_roundtrip(self):
        data = [{'id': 1}, {'id': 2}]
        _save_cache(self._cache_path, data)
        self.assertEqual(_load_cache(self._cache_path), data)

    def test_stale_cache_returns_none(self):
        data = [{'id': 99}]
        with open(self._cache_path, 'w') as fh:
            json.dump({'ts': time.time() - (13 * 3600), 'data': data}, fh)
        self.assertIsNone(_load_cache(self._cache_path))

    def test_missing_file_returns_none(self):
        self.assertIsNone(_load_cache('/nonexistent/path/cache.json'))

class TestDownloadWfhData(unittest.TestCase):
    @patch('scripts.etl.wfh_extractor.requests.get')
    def test_skips_download_if_file_exists(self, mock_get):
        import tempfile
        with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as tmp:
            tmp_path = tmp.name
        try:
            result = WFHDataExtractor.download(filepath=tmp_path)
            mock_get.assert_not_called()
            self.assertEqual(result, tmp_path)
        finally:
            os.unlink(tmp_path)

    @patch('scripts.etl.wfh_extractor.requests.get')
    def test_tries_fallback_urls(self, mock_get):
        import tempfile
        fail_resp = MagicMock()
        fail_resp.raise_for_status.side_effect = Exception('404')
        ok_resp = MagicMock()
        ok_resp.raise_for_status.return_value = None
        ok_resp.content = b'fake xlsx content'
        mock_get.side_effect = [fail_resp, ok_resp]

        with tempfile.TemporaryDirectory() as tmpdir:
            out_path = os.path.join(tmpdir, 'wfh.xlsx')
            result = WFHDataExtractor.download(filepath=out_path)
            self.assertEqual(result, out_path)
            self.assertTrue(os.path.exists(out_path))
            self.assertEqual(mock_get.call_count, 2)

class TestProcessData(unittest.TestCase):
    WFH_FILE = 'wfh_data.xlsx'

    def setUp(self):
        if not os.path.exists(self.WFH_FILE):
            self.skipTest(f"'{self.WFH_FILE}' not available — skipping integration test.")

    def _run(self, velocities=None, turnarounds=None):
        if velocities is None:
            velocities = {'Remote-First': 0.07, 'Hybrid': 0.05, 'Onsite-Heavy': 0.03}
        if turnarounds is None:
            turnarounds = {'Remote-First': 12.0, 'Hybrid': 24.0, 'Onsite-Heavy': 110.0}
        return MetricsProcessor(self.WFH_FILE, velocities, turnarounds).process()

    def test_record_count(self):
        self.assertEqual(len(self._run()), 170)

    def test_required_columns(self):
        df = self._run()
        required = {'industry', 'work_setup_category', 'work_setup', 'focus_hours', 'meeting_overhead', 'pizza_party_index', 'review_turnaround_hours', 'age_group', 'gender', 'interruption_frequency', 'sustained_high_workload', 'burnout_risk_score'}
        self.assertTrue(required.issubset(set(df.columns)))

    def test_only_known_categories(self):
        self.assertEqual(set(self._run()['work_setup_category']), set(FALLBACK_VELOCITIES.keys()))

    def test_scalar_velocity_normalised(self):
        df = MetricsProcessor(self.WFH_FILE, {}, {}).process()
        self.assertEqual(set(df['work_setup_category']), set(FALLBACK_VELOCITIES.keys()))

    def test_focus_hours_positive(self):
        self.assertTrue((self._run()['focus_hours'] > 0).all())

    def test_pizza_party_index_non_negative(self):
        self.assertTrue((self._run()['pizza_party_index'] >= 0).all())

    def test_meeting_overhead_minimum(self):
        self.assertTrue((self._run()['meeting_overhead'] >= 5.0).all())

    def test_work_setup_percentages_sum_consistent(self):
        df = self._run()
        for _, row in df.iterrows():
            ws = row['work_setup']
            self.assertGreaterEqual(ws['onsite_pct'], 0.0)
            self.assertGreaterEqual(ws['hybrid_pct'], 0.0)
            self.assertGreaterEqual(ws['remote_pct'], 0.0)

    def test_deterministic_with_same_seed(self):
        pd.testing.assert_frame_equal(self._run(), self._run())

    def test_burnout_risk_score_range(self):
        df = self._run()
        self.assertTrue((df['burnout_risk_score'] >= 0.0).all())
        self.assertTrue((df['burnout_risk_score'] <= 1.0).all())

if __name__ == '__main__':
    unittest.main()
