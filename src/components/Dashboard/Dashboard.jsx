import React, { useState, useEffect, useMemo } from 'react';
import Header from './Header';
import PizzaBoxFilter from '../Filters/PizzaBoxFilter';
import PizzaGauge from '../Charts/PizzaGauge';
import WorkSlicesChart from '../Charts/WorkSlicesChart';
import CollaborationChart from '../Charts/CollaborationChart';
import DemographicsChart from '../Charts/DemographicsChart';
import pizzaMetricsData from '../../data/pizza_metrics.json';

const Dashboard = () => {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
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
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen text-gray-900 font-sans">
      <Header rawData={rawData} />
      
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Filters Section */}
        <section>
          <PizzaBoxFilter filters={filters} setFilters={setFilters} data={rawData} />
        </section>

        {/* Charts Section - The Pizza Box */}
        <section className="bg-[#f2dfbe] border-4 border-[#d4ab71] rounded-sm p-6 lg:p-8 shadow-2xl relative">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-orange-600/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
            {/* Gauge takes 1 column */}
            <div className="col-span-1">
              <PizzaGauge data={filteredData} />
            </div>
            
            {/* Slices of Work takes 1 column (or 2 on XL) */}
            <div className="col-span-1 xl:col-span-2">
              <WorkSlicesChart data={filteredData} />
            </div>

            {/* Collaboration Chart takes 1 or 2 cols */}
            <div className="col-span-1 xl:col-span-2">
              <CollaborationChart data={filteredData} />
            </div>

            {/* Demographics Chart takes full width or remaining cols */}
            <div className="col-span-1 lg:col-span-2 xl:col-span-1">
              <DemographicsChart data={filteredData} />
            </div>
          </div>
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
      
      <footer className="text-center py-8 text-gray-800 text-sm font-bold mt-auto space-y-2 bg-white/80 border-t-4 border-green-600 backdrop-blur-sm">
        <p className="text-lg">Telemetry generated with 🧀 & 🍅</p>
        <p className="text-xs font-normal">
          <strong>Live Data Sources:</strong> <a href="https://wfhresearch.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-red-700">WFH Research (SWAA)</a> &amp; <a href="https://docs.github.com/en/rest" target="_blank" rel="noopener noreferrer" className="underline hover:text-red-700">GitHub REST API</a>
        </p>
      </footer>
    </div>
  );
};

export default Dashboard;

