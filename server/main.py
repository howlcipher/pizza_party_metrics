import sys
import os
import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Add the project root to sys.path to import scripts.etl
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.etl.github_client import GitHubClient  # noqa: E402
from scripts.etl.velocity_analyzer import VelocityAnalyzer  # noqa: E402
from scripts.etl.wfh_extractor import WFHDataExtractor  # noqa: E402
from scripts.etl.metrics_processor import MetricsProcessor  # noqa: E402

app = FastAPI(title="Pizza Party Metrics API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CACHE = {
    "data": None,
    "timestamp": 0
}
CACHE_TTL = 3600 * 12  # 12 hours


@app.get("/api/metrics")
async def get_metrics():
    current_time = time.time()
    if CACHE["data"] is not None and (current_time - CACHE["timestamp"]) < CACHE_TTL:
        return CACHE["data"]

    # Run ETL
    client = GitHubClient()
    analyzer = VelocityAnalyzer(client)
    velocities, turnarounds, metadata = await analyzer.analyze()
    wfh_file = WFHDataExtractor.download()
    processor = MetricsProcessor(wfh_file, velocities, turnarounds)
    final_df = processor.process()
    
    data = final_df.to_dict(orient="records")
    
    result = {
        "metrics": data,
        "metadata": metadata
    }
    
    CACHE["data"] = result
    CACHE["timestamp"] = current_time
    
    return result
