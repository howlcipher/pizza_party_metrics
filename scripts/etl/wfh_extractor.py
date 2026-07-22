import os
import requests
import logging

try:
    from scripts import config
except ImportError:
    import config

class WFHDataExtractor:
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
