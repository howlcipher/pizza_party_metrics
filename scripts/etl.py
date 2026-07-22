import asyncio
import logging
import sys
import os

# Add root directory to sys.path so we can import from 'scripts'
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from scripts.etl.main import ETLPipeline
from scripts import config

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s')

FALLBACK_VELOCITIES = config.FALLBACK_VELOCITIES
SETUP_REPOS = config.SETUP_REPOS

if __name__ == '__main__':
    asyncio.run(ETLPipeline().run())
