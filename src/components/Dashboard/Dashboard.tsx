import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import Header from './Header';
import PizzaBoxFilter from '../Filters/PizzaBoxFilter';
import pizzaMetricsData from '../../data/pizza_metrics.json';

const PizzaGauge = lazy(() => import('../Charts/PizzaGauge'));
const WorkSlicesChart = lazy(() => import('../Charts/WorkSlicesChart'));
const CommuterCostCard = lazy(() => import('../Charts/CommuterCostCard'));
const CommuteTimeCard = lazy(() => import('../Charts/CommuteTimeCard'));
const CommuteCO2Card = lazy(() => import('../Charts/CommuteCO2Card'));
const CollaborationChart = lazy(() => import('../Charts/CollaborationChart'));
const MakerVsMeetingChart = lazy(() => import('../Charts/MakerVsMeetingChart'));
const DemographicsChart = lazy(() => import('../Charts/DemographicsChart'));
const IndustryBenchmarksChart = lazy(() => import('../Charts/IndustryBenchmarksChart'));
const StatisticalInsightsCard = lazy(() => import('../Charts/StatisticalInsightsCard'));

const Dashboard = () => {
  const [rawData, setRawData] = useState([]);
  const [filters, setFilters] = useState<Record<string, string>>({
    industry: '',
    age_group: '',
    work_setup: '' // this will filter by work_setup_category
  });

  const filteredData = useMemo(() => {
    return rawData.filter(item => {
      return (
        (!filters.industry || item.industry === filters.industry) &&
        (!filters.age_group || item.age_group === filters.age_group) &&
        (!filters.work_setup || item.work_setup_category === filters.work_setup)
      );
    });
  }, [filters, rawData]);

  useEffect(() => {
    // Load local JSON data instead of fetching from API for GitHub Pages compatibility
    setRawData(pizzaMetricsData);
  }, []);

  return (
    <div className="min-h-screen text-[var(--app-text)] font-sans">
      <Header rawData={rawData} />
      
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Filters Section */}
        <section>
          <PizzaBoxFilter filters={filters} setFilters={setFilters} data={rawData} />
        </section>

        {/* Charts Section - The Pizza Box */}
        <section className="bg-[var(--dashboard-bg)] border-4 border-[var(--dashboard-border)] rounded-sm p-6 lg:p-8 shadow-2xl relative">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-orange-600/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <Suspense fallback={<div className="flex items-center justify-center p-12 text-amber-900 font-bold text-lg animate-pulse">Loading chart...</div>}>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
              {/* Gauge takes 1 column */}
              <div className="col-span-1">
                <PizzaGauge data={filteredData} />
              </div>
              
              {/* Slices of Work takes 1 column (or 2 on XL) */}
              <div className="col-span-1 xl:col-span-2">
                <WorkSlicesChart data={filteredData} />
              </div>

              {/* Commuter Cost & Vehicle Wear Analysis */}
              <div className="col-span-1 lg:col-span-2 xl:col-span-3">
                <CommuterCostCard data={filteredData} selectedWorkSetup={filters.work_setup} />
              </div>

              {/* Commute Time Opportunity Cost Card */}
              <div className="col-span-1 lg:col-span-2 xl:col-span-3">
                <CommuteTimeCard data={filteredData} selectedWorkSetup={filters.work_setup} />
              </div>

              {/* Commute CO2 & Environmental Impact Card */}
              <div className="col-span-1 lg:col-span-2 xl:col-span-3">
                <CommuteCO2Card data={filteredData} selectedWorkSetup={filters.work_setup} />
              </div>

              {/* Collaboration Chart takes 1 or 2 cols */}
              <div className="col-span-1 xl:col-span-2">
                <CollaborationChart data={filteredData} />
              </div>

              {/* Meeting vs. Maker Time Analysis Chart */}
              <div className="col-span-1 xl:col-span-2">
                <MakerVsMeetingChart data={filteredData} />
              </div>

              {/* Demographics Chart takes full width or remaining cols */}
              <div className="col-span-1 lg:col-span-2 xl:col-span-1">
                <DemographicsChart data={filteredData} />
              </div>

              {/* Industry Benchmarks & Leaderboard Chart */}
              <div className="col-span-1 lg:col-span-2 xl:col-span-3">
                <IndustryBenchmarksChart selectedIndustry={filters.industry} />
              </div>

              {/* Statistical Insights & Key Takeaways Card */}
              <div className="col-span-1 lg:col-span-2 xl:col-span-3">
                <StatisticalInsightsCard />
              </div>
            </div>
          </Suspense>
        </section>

        {filteredData.length === 0 && (
          <div className="bg-red-100 border-4 border-red-600 p-6 rounded-xl text-center shadow-md">
            <p className="text-red-800 font-extrabold text-2xl mb-4 font-serif italic">Mamma mia! No slices left! Try adjusting your filters.</p>
            <button 
              onClick={() => setFilters({ industry: '', age_group: '', work_setup: '' })}
              className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-full font-bold text-lg transition-colors cursor-pointer shadow-lg border-2 border-green-800"
            >
              Reset Filters
            </button>
          </div>
        )}
      </main>
      
      <footer className="text-center py-8 text-gray-800 text-sm font-bold mt-auto space-y-2 bg-[var(--card-bg)] border-t-4 border-green-600 backdrop-blur-sm">
        <p className="text-lg">Telemetry generated with 🧀 & 🍅</p>
        <p className="text-xs font-normal">
          <strong>Live Data Sources:</strong> <a href="https://wfhresearch.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-red-700">WFH Research (SWAA)</a> &amp; <a href="https://docs.github.com/en/rest" target="_blank" rel="noopener noreferrer" className="underline hover:text-red-700">GitHub REST API</a>
        </p>
        <p className="text-xs font-normal mt-2">
          <a href="https://github.com/howlcipher/pizza_party_metrics" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1 text-gray-600 hover:text-red-700 transition-colors">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
            View Source Code on GitHub
          </a>
        </p>
      </footer>
    </div>
  );
};

export default Dashboard;

