# Task Journal: #44 Move Aggregations to ETL

## Selection
- Selected item #44: [Agent Suggestion] Frontend: Move Aggregations to ETL.

## Re-evaluation
- Confirmed valid. Computing averages and summations within React render methods for large arrays is inefficient and impacts TTI.

## Next Steps
- Delegate the refactor to headless `agy` using the `gemini-3.1-pro-high` model to refactor `WorkSlicesChart.jsx` and `CollaborationChart.jsx` to stop doing local `.reduce` for aggregations, and instead rely on pre-aggregated data format or perform it outside the render cycle. (Wait, if we move it to ETL, we have to change the data format entirely which might affect other components. If we just do it outside of render, e.g. useMemo, that's better. But the issue explicitly says "Move Aggregations to ETL" which implies modifying the Python ETL `etl.py` and updating the UI to consume `aggregated_metrics.json` or similar. I'll write the brief carefully).
