import os
import json
import logging
import time
import hashlib
import asyncio
import math
import aiohttp

try:
    from scripts import config
except ImportError:
    import config

def _load_cache(path: str) -> list | None:
    if not os.path.exists(path):
        return None
    try:
        with open(path, 'r', encoding='utf-8') as fh:
            envelope = json.load(fh)
        if (time.time() - envelope.get("ts", 0)) / 3600.0 <= config.CACHE_TTL_HOURS:
            return envelope["data"]
    except Exception as exc:
        logging.debug(f"Cache load error: {exc}")
    return None

def _save_cache(path: str, data: list) -> None:
    try:
        with open(path, 'w', encoding='utf-8') as fh:
            json.dump({"ts": time.time(), "data": data}, fh)
    except Exception as exc:
        logging.warning(f"Cache write error: {exc}")

class GitHubClient:
    def __init__(self):
        self.headers = {'Accept': 'application/vnd.github.v3+json'}
        if os.getenv('GITHUB_TOKEN'):
            self.headers['Authorization'] = f"token {os.getenv('GITHUB_TOKEN')}"
        os.makedirs(config.CACHE_DIR, exist_ok=True)
        self.semaphore = asyncio.Semaphore(10)

    def _cache_key(self, repo: str, endpoint: str) -> str:
        safe = hashlib.md5(f"{repo}_{endpoint}".encode(), usedforsecurity=False).hexdigest()[:12]
        return os.path.join(config.CACHE_DIR, f"{safe}.json")

    async def fetch_endpoint(self, session: aiohttp.ClientSession, url: str, cache_id: tuple[str, str], description: str) -> list:
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
