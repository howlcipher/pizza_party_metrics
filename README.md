# 🍕 Pizza Party Metrics (PPM)

*Mamma mia! Replacing performative corporate pizza parties with cold, hard, freshly-baked data.* 🤌

Welcome to **Pizza Party Metrics**, a highly thematic, automated dashboard that calculates the **"Pizza Party Index"**—a holistic score measuring actual productivity (Focus Hours) combined with collaboration velocity (PR merge speeds and review turnarounds). We combine real-world Work-From-Home (WFH) survey data with live GitHub repository delivery cadence to serve up the spiciest insights on Remote, Hybrid, and Onsite work setups. A higher index means your team is a high-performing pizza pie!

## 📈 The Freshly Baked Metrics
<!-- METRICS_START -->
**Total Records Analyzed**: 5000<br>
**Average Pizza Party Index**: 47.84<br>
**Average Focus Hours**: 16.27<br>
**Average Meeting Overhead**: 23.73
<!-- METRICS_END -->
*(These metrics are automatically updated by our automated ETL pipeline!)*

## 🍅 The Ingredients (Live Data Sources)
We strictly use 100% organic, real-world data to calculate our metrics:

1. **WFH Research Dataset (SWAA Data)**: Sourced directly from [WFH Research](https://wfhresearch.com/). We parse the latest monthly Excel timeseries to get empirical Remote/Hybrid/Onsite distributions across major industries.
2. **GitHub REST API (Velocity Proxies)**: We dynamically fetch real Pull Request merge times and code review turnarounds from public repositories that champion specific work styles:
   - *Remote-First*: `gitlabhq/gitlabhq`, `pandas-dev/pandas`, `hashicorp/terraform`
   - *Hybrid*: `microsoft/vscode`, `facebook/react`
   - *Onsite-Heavy*: `apache/kafka`, `oracle/graal`

**Note on Data Synthesis (Monte Carlo):** To protect privacy, the Stanford WFH dataset provides *macro-aggregated percentages* rather than individual respondent micro-data. To generate our interactive 5,000-respondent dashboard, our ETL pipeline acts as a statistical synthesizer. It uses a Monte Carlo approach to sample exactly 5,000 virtual respondents, perfectly weighted against the true empirical distributions of the underlying raw data (e.g., industry, age, and gender percentages). This ensures the dashboard's simulated dataset is statistically accurate to the real-world macro data!

## 👨‍🍳 The Kitchen Architecture

- **Data Engineering (Python)**: Our vectorized ETL pipeline (`scripts/etl.py`) pulls data, applies dynamic ingestion assertions, normalizes it, and calculates demographic probabilities. It caches GitHub API responses locally and gracefully handles API rate limits using exponential backoff. 
- **Advanced Multi-Agent Insights**: A secondary pipeline (`scripts/multi_agent_analysis.py`) calculates deep-dish analytics like **Burnout Risk Scores**, **True Productive Hours**, and **Work-Setup Correlations** using Scikit-Learn.
- **Frontend (React + Vite)**: A beautifully styled, fully-responsive dashboard built with Tailwind CSS v4, Recharts, and a whole lot of *comical Italian pizza parlor* charm. 
- **DevOps (GitHub Actions)**: A multi-stage CI/CD workflow (`.github/workflows/deploy.yml`) runs on push and on a daily schedule to refresh data, scan for vulnerabilities (`npm audit`, Trivy), update the README metrics, and deploy seamlessly to GitHub Pages.

## 🛵 Delivery & Local Development

Want to spin some dough locally? 

1. **Install Dependencies:**
   ```bash
   npm install
   pip install -r requirements.txt
   ```

2. **Run the Data Pipeline (Optional):**
   ```bash
   python scripts/etl.py
   python scripts/multi_agent_analysis.py
   ```
   *(Ensure you have a `GITHUB_TOKEN` environment variable exported to avoid API rate limits!)*

3. **Serve the Pizza (Start Frontend):**
   ```bash
   npm run dev
   ```

Buon appetito! 🍕
