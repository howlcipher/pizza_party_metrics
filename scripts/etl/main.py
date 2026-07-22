import os
import json
import logging
import asyncio

from .github_client import GitHubClient
from .velocity_analyzer import VelocityAnalyzer
from .wfh_extractor import WFHDataExtractor
from .metrics_processor import MetricsProcessor

class ETLPipeline:
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
