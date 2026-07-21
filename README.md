# 🍕 Pizza Party Metrics

**Replacing Performative Perks with Real Productivity Telemetry**

This project is a multi-agent orchestrated data pipeline and high-contrast web dashboard that calculates the "Pizza Party Index"—the ratio of performative office perks to actual uninterrupted focus hours.

## 📊 Live Data Sources (Transparency)

This project strictly utilizes real, publicly available data. There is no mocked data. 

1. **Work-From-Home (WFH) Timeseries Dataset**: Downloaded directly from [WFH Research](https://wfhresearch.com/) (SWAA data). This dataset provides empirical numbers on Remote, Hybrid, and In-Office setups across various industries.
2. **GitHub REST API (Issue Velocity)**: Fetched from public repositories (e.g., `pandas-dev/pandas`) to proxy actual "Focus Hours" and developer velocity.

## 🚀 Architecture

- **Data Engineering (Python)**: An automated ETL pipeline (`scripts/etl.py`) using `pandas` and `requests` that downloads the datasets, normalizes them, and dumps them into `src/data/pizza_metrics.json`.
- **Frontend (React + Vite)**: A highly aesthetic, componentized UI built with Tailwind CSS v4 and Recharts. 
- **DevOps (GitHub Actions)**: Fully automated CI/CD pipeline (`.github/workflows/deploy.yml`) that runs daily via Cron to rebuild the data and deploy to GitHub Pages.

## 🛠️ Local Development

1. Install dependencies: `npm install`
2. Run locally: `npm run dev`
