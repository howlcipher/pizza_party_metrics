import os
import json
import logging
import requests
import pandas as pd
from datetime import datetime
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Set fixed random seed as per data_analyst skill constraints
np.random.seed(42)

def fetch_github_velocity(repo="pandas-dev/pandas", limit=100):
    """
    Fetch recent closed issues from GitHub to calculate an average 'velocity' or 'focus hours' proxy.
    Returns average hours taken to close an issue.
    """
    logging.info(f"Fetching GitHub issue data for {repo}...")
    url = f"https://api.github.com/repos/{repo}/issues?state=closed&per_page={limit}"
    
    headers = {'Accept': 'application/vnd.github.v3+json'}
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        logging.warning(f"Failed to fetch GitHub data (Status {response.status_code}). Using fallback velocity.")
        return 0.05
        
    issues = response.json()
    
    closing_times = []
    for issue in issues:
        if issue.get('created_at') and issue.get('closed_at'):
            created = pd.to_datetime(issue['created_at'])
            closed = pd.to_datetime(issue['closed_at'])
            diff_hours = (closed - created).total_seconds() / 3600.0
            closing_times.append(diff_hours)
    
    if not closing_times:
        return 0.05
        
    avg_closing_time = np.median(closing_times)
    # We use inverse of closing time as a proxy for velocity (issues closed per hour)
    velocity = 1.0 / avg_closing_time if avg_closing_time > 0 else 0.1
    logging.info(f"Calculated GitHub median closing time: {avg_closing_time:.2f} hours. Velocity proxy: {velocity:.4f}")
    return velocity

def download_wfh_data(filepath="wfh_data.xlsx"):
    """
    Download WFH Research dataset if it doesn't exist.
    """
    url = "https://wfhresearch.com/wp-content/uploads/2026/07/WFHtimeseries_monthly.xlsx"
    if not os.path.exists(filepath):
        logging.info("Downloading WFH dataset...")
        response = requests.get(url)
        response.raise_for_status()
        with open(filepath, 'wb') as f:
            f.write(response.content)
    else:
        logging.info("WFH dataset already exists. Skipping download.")
    return filepath

def process_data(wfh_filepath, github_velocity):
    """
    Process the WFH data and calculate the Pizza Party Index.
    """
    logging.info("Reading WFH data...")
    # Load Work Arrangements by Industry
    df = pd.read_excel(wfh_filepath, sheet_name='Work Arrangements by Industry')
    
    # We will compute the latest month's data
    df['date'] = pd.to_datetime(df['date'])
    df = df.dropna(subset=['date'])
    latest_df = df.sort_values('date', ascending=False).iloc[0:1].copy()
    
    # Extract industries
    industries = []
    for col in latest_df.columns:
        if col.startswith('full_onsite_'):
            ind = col.replace('full_onsite_', '')
            if ind not in industries:
                # Check if data is available
                if not pd.isna(latest_df[col].iloc[0]):
                    industries.append(ind)
    
    results = []
    
    for ind in industries:
        onsite_col = f'full_onsite_{ind}'
        hybrid_col = f'hybrid_{ind}'
        remote_col = f'full_remote_{ind}'
        
        # Safely get values, defaulting to 0 if columns missing or NaN
        onsite_pct = (latest_df[onsite_col].iloc[0] if onsite_col in latest_df.columns else 0.0) / 100.0
        hybrid_pct = (latest_df[hybrid_col].iloc[0] if hybrid_col in latest_df.columns else 0.0) / 100.0
        remote_pct = (latest_df[remote_col].iloc[0] if remote_col in latest_df.columns else 0.0) / 100.0
        
        # Calculate performative office perks (higher for onsite and hybrid)
        # Assuming onsite implies 100% "perks", hybrid implies 50% "perks"
        performative_perks = (onsite_pct * 1.0) + (hybrid_pct * 0.5)
        
        # Calculate actual uninterrupted focus hours
        # Assuming remote gets full focus, hybrid gets 50%, onsite gets 20%
        # Scaled by GitHub velocity
        focus_multiplier = (remote_pct * 1.0) + (hybrid_pct * 0.5) + (onsite_pct * 0.2)
        base_focus_hours = 40.0 # baseline weekly hours
        focus_hours = base_focus_hours * focus_multiplier * (1 + github_velocity)
        
        # Meeting overhead inversely proportional to focus hours
        meeting_overhead = base_focus_hours - focus_hours if base_focus_hours > focus_hours else 5.0
        
        # Pizza Party Index: Ratio of performative perks to actual focus hours
        # We scale it so it's a readable number (e.g. 0 to 10)
        pizza_party_index = (performative_perks / max(focus_hours, 1.0)) * 100.0
        
        record = {
            'industry': ind.replace('_', ' ').title(),
            'work_setup': {
                'onsite_pct': round(float(onsite_pct) * 100.0, 2),
                'hybrid_pct': round(float(hybrid_pct) * 100.0, 2),
                'remote_pct': round(float(remote_pct) * 100.0, 2)
            },
            'focus_hours': round(float(focus_hours), 2),
            'meeting_overhead': round(float(meeting_overhead), 2),
            'pizza_party_index': round(float(pizza_party_index), 2),
            'age_group': 'All Ages' # Age group not in this specific cut, use fallback
        }
        results.append(record)
        
    final_df = pd.DataFrame(results)
    
    return final_df

def main():
    # Ensure paths exist
    os.makedirs('src/data', exist_ok=True)
    
    velocity = fetch_github_velocity()
    wfh_file = download_wfh_data()
    
    final_df = process_data(wfh_file, velocity)
    
    output_path = 'src/data/pizza_metrics.json'
    logging.info(f"Saving results to {output_path}...")
    final_df.to_json(output_path, orient='records', indent=4)
    logging.info("ETL pipeline completed successfully.")

if __name__ == '__main__':
    main()
