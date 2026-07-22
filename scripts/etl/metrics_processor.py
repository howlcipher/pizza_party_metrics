import pandas as pd
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split

try:
    from scripts import config
except ImportError:
    import config


class MetricsProcessor:
    def __init__(self, wfh_file: str, velocities: dict, turnarounds: dict):
        self.wfh_file = wfh_file
        self.velocities = velocities
        self.turnarounds = turnarounds

    def validate_schema(self, df: pd.DataFrame) -> None:
        required_columns = {
            'industry': str,
            'work_setup_category': str,
            'work_setup': object,
            'focus_hours': float,
            'meeting_overhead': float,
            'fatigue_penalty': float,
            'pizza_party_index': float,
            'review_turnaround_hours': float,
            'collaboration_score': float,
            'age_group': str,
            'gender': str,
            'interruption_frequency': float,
            'sustained_high_workload': float,
            'burnout_risk_score': float
        }

        for col, dtype in required_columns.items():
            if col not in df.columns:
                raise ValueError(f"Missing required column: {col}")
            if df[col].isnull().any():
                raise ValueError(f"Null values found in column: {col}")

    def process(self) -> pd.DataFrame:
        df = pd.read_excel(
            self.wfh_file,
            sheet_name='Work Arrangements by Industry')
        df['date'] = pd.to_datetime(df['date'])
        latest_row = df.dropna(
            subset=['date']).sort_values(
            'date',
            ascending=False).iloc[0]

        industries = [
            c.replace(
                'full_onsite_',
                '') for c in df.columns if c.startswith('full_onsite_') and not pd.isna(
                latest_row[c])]

        for ind in industries:
            if f'full_onsite_{ind}' not in latest_row:
                raise ValueError(f"Missing data column for full_onsite_{ind}")
            if f'hybrid_{ind}' not in latest_row:
                raise ValueError(f"Missing data column for hybrid_{ind}")

        industries = [
            i for i in industries if i not in config.EXCLUDED_INDUSTRIES]
        industries.extend(
            [i for i in config.ADDITIONAL_INDUSTRIES if i not in industries])

        np.random.seed(config.ETL_SETTINGS['random_seed'])

        N = config.ETL_SETTINGS['synthetic_n_size']
        df_results = pd.DataFrame(
            {
                'industry_raw': np.random.choice(
                    sorted(industries),
                    size=N),
                'age_group': np.random.choice(
                    config.DEMOGRAPHICS['age_groups'],
                    size=N,
                    p=config.DEMOGRAPHICS['age_distribution']),
                'gender': np.random.choice(
                    config.DEMOGRAPHICS['genders'],
                    size=N,
                    p=config.DEMOGRAPHICS['gender_distribution'])})

        def get_pct(
            ind,
            prefix): return float(
            latest_row.get(
                f'{prefix}_{ind}',
                0.0) or 0.0) / 100.0

        df_results = df_results.assign(
            onsite_pct=lambda x: x['industry_raw'].map(lambda i: get_pct(i, 'full_onsite')),
            hybrid_pct=lambda x: x['industry_raw'].map(lambda i: get_pct(i, 'hybrid')),
            remote_pct=lambda x: x['industry_raw'].map(lambda i: get_pct(i, 'full_remote')),
            industry=lambda x: x['industry_raw'].str.replace('_', ' ').str.title().replace(
                config.INDUSTRY_DISPLAY_NAMES)
        )

        mask_zero = (
            df_results['onsite_pct'] +
            df_results['hybrid_pct'] +
            df_results['remote_pct']) == 0
        df_results.loc[mask_zero, ['remote_pct', 'hybrid_pct', 'onsite_pct']] = [
            0.33, 0.33, 0.34]

        total = df_results['onsite_pct'] + \
            df_results['hybrid_pct'] + df_results['remote_pct']
        rand_cat = np.random.uniform(0, 1, size=N)
        p_rem, p_hyb = df_results['remote_pct'] / \
            total, df_results['hybrid_pct'] / total

        df_results = df_results.assign(work_setup_category=np.select(
            [rand_cat < p_rem, rand_cat < p_rem + p_hyb], ['Remote-First', 'Hybrid'], default='Onsite-Heavy'))

        df_results = df_results.assign(
            cat_vel=lambda x: x['work_setup_category'].map(
                lambda c: self.velocities.get(
                    c, 0.05)), review_turnaround_hours=lambda x: x['work_setup_category'].map(
                lambda c: self.turnarounds.get(
                    c, 24.0)).round(2))

        df_results = df_results.assign(
            cat_factor=lambda x: np.select(
                [x['work_setup_category'] == 'Remote-First', x['work_setup_category'] == 'Hybrid'],
                [0.55 + x['remote_pct'] * 0.20, 0.45 + x['hybrid_pct'] * 0.15],
                default=0.35 + x['onsite_pct'] * 0.10
            )
        )

        df_results = df_results.assign(
            fatigue_penalty=lambda x: np.select(
                [x['work_setup_category'] == 'Onsite-Heavy', x['work_setup_category'] == 'Hybrid'],
                [5.0, 2.5],
                default=0.0
            ).round(2)
        )

        base_h = config.ETL_SETTINGS['base_focus_hours']
        df_results = df_results.assign(
            collaboration_score=lambda x: (24.0 / np.maximum(x['review_turnaround_hours'], 1.0) * 10).round(2),
            focus_hours=lambda x: (base_h * (x['cat_factor'] + np.random.uniform(-0.05, 0.05, size=N)) * (1.0 + x['cat_vel']) - x['fatigue_penalty']).round(2)
        )
        df_results = df_results.assign(
            meeting_overhead=lambda x: np.maximum(
                5.0, base_h - x['focus_hours']).round(2), )
        df_results = df_results.assign(
            pizza_party_index=lambda x: (
                x['focus_hours'] +
                x['collaboration_score'] *
                2.0).round(2),
            interruption_frequency=lambda x: (
                (x['meeting_overhead'] /
                 base_h) *
                10.0 +
                np.random.poisson(
                    2,
                    size=N)).round(2),
        )
        df_results = df_results.assign(
            sustained_high_workload=lambda x: (
                np.maximum(
                    0.0,
                    (x['focus_hours'] +
                     x['meeting_overhead'] -
                        base_h) /
                    5.0) +
                np.random.exponential(
                    1.0,
                    size=N)).round(2))

        df_results['work_setup'] = df_results.apply(
            lambda row: {
                'onsite_pct': round(
                    row['onsite_pct'] * 100,
                    2),
                'hybrid_pct': round(
                    row['hybrid_pct'] * 100,
                    2),
                'remote_pct': round(
                    row['remote_pct'] * 100,
                    2)},
            axis=1)

        cols = [
            'industry',
            'work_setup_category',
            'work_setup',
            'focus_hours',
            'meeting_overhead',
            'fatigue_penalty',
            'pizza_party_index',
            'review_turnaround_hours',
            'collaboration_score',
            'age_group',
            'gender',
            'interruption_frequency',
            'sustained_high_workload']
        df_results = df_results[cols]

        pipeline = Pipeline([('scaler', StandardScaler()), ('classifier', LogisticRegression(
            random_state=config.ETL_SETTINGS['random_seed']))])
        features = df_results[[
            'interruption_frequency', 'sustained_high_workload']]
        target = (
            (df_results['interruption_frequency'] *
             0.5 +
             df_results['sustained_high_workload'] *
             2.0 +
             np.random.normal(
                0,
                1,
                N)) > 5.0).astype(int)

        X_train, X_test, y_train, y_test = train_test_split(
            features, target, test_size=0.2, random_state=42)
        pipeline.fit(X_train, y_train)

        df_results['burnout_risk_score'] = np.round(
            pipeline.predict_proba(features)[
                :, 1], 4) if hasattr(
            pipeline, "predict_proba") else pipeline.predict(features)

        self.validate_schema(df_results)

        return df_results
