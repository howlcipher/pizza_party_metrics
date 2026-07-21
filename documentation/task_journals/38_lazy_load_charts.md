# Task Journal: #38 Lazy Load Chart Components

## Selection
- Selected item #38: [Agent Suggestion] Frontend: Lazy Load Chart Components.

## Re-evaluation
- Confirmed valid. Using `React.lazy()` and `<Suspense>` for the Recharts components will enable code-splitting in Vite, significantly reducing the main bundle size and improving TTI.

## Next Steps
- Delegate to headless `agy` using `gemini-3.1-pro-high` to refactor `Dashboard.jsx` (and any other files that import the charts) to dynamically import them.
