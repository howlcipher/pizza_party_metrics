import asyncio
import logging

from scripts.etl.main import ETLPipeline
from scripts.etl.github_client import GitHubClient, _load_cache, _save_cache
from scripts.etl.velocity_analyzer import VelocityAnalyzer
from scripts.etl.wfh_extractor import WFHDataExtractor
from scripts.etl.metrics_processor import MetricsProcessor
from scripts import config

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

FALLBACK_VELOCITIES = config.FALLBACK_VELOCITIES
SETUP_REPOS = config.SETUP_REPOS

if __name__ == '__main__':
    asyncio.run(ETLPipeline().run())
