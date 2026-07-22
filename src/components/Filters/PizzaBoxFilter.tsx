import { PizzaData } from "../../types";
import React, { useMemo } from 'react';
import { Filter } from 'lucide-react';

const PizzaBoxFilter = ({ filters, setFilters, data }: { filters: Record<string, string>, setFilters: (f: Record<string, string>) => void, data: PizzaData[] }) => {
  const { industries, ageGroups, workSetups } = useMemo(() => ({
    industries: [...new Set(data.map(d => d.industry))].sort(),
    ageGroups: [...new Set(data.map(d => d.age_group))].sort(),
    workSetups: [...new Set(data.map(d => d.work_setup_category))].sort(),
  }), [data]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-[#f2dfbe] border-4 border-[#d4ab71] rounded-sm p-6 shadow-xl relative overflow-hidden">
      {/* Decorative pizza box corner */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-red-600 transform rotate-45 translate-x-12 -translate-y-12 border-4 border-red-800 shadow-md flex items-end justify-center pb-2">
        <span className="text-white font-bold text-xs -rotate-45">100% FRESH</span>
      </div>
      
      <div className="flex items-center gap-3 mb-6 text-red-700 border-b-2 border-red-800/30 pb-3">
        <Filter size={24} />
        <h2 className="text-2xl font-extrabold font-serif italic drop-shadow-sm">Build Your Own Pizza (Filters)</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {/* Industry Filter */}
        <div className="flex flex-col gap-2">
          <label htmlFor="industry-select" className="text-sm font-bold text-[#3E2723] uppercase tracking-wide">Industry Flavor</label>
          <select 
            id="industry-select"
            className="p-3 rounded border border-[#d4ab71] bg-[#fffcf5] text-[#3E2723] hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors font-medium shadow-sm cursor-pointer"
            value={filters.industry || ''}
            onChange={(e) => handleFilterChange('industry', e.target.value)}
          >
            <option value="">All Industries (The Works)</option>
            {industries.map(ind => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>

        {/* Age Group Filter */}
        <div className="flex flex-col gap-2">
          <label htmlFor="age-group-select" className="text-sm font-bold text-[#3E2723] uppercase tracking-wide">Age Group</label>
          <select 
            id="age-group-select"
            className="p-3 rounded border border-[#d4ab71] bg-[#fffcf5] text-[#3E2723] hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors font-medium shadow-sm cursor-pointer"
            value={filters.age_group || ''}
            onChange={(e) => handleFilterChange('age_group', e.target.value)}
          >
            <option value="">All Ages (Family Size)</option>
            {ageGroups.map(age => (
              <option key={age} value={age}>{age}</option>
            ))}
          </select>
        </div>

        {/* Work Setup Filter */}
        <div className="flex flex-col gap-2">
          <label htmlFor="work-setup-select" className="text-sm font-bold text-[#3E2723] uppercase tracking-wide">Work Setup</label>
          <select 
            id="work-setup-select"
            className="p-3 rounded border border-[#d4ab71] bg-[#fffcf5] text-[#3E2723] hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors font-medium shadow-sm cursor-pointer"
            value={filters.work_setup || ''}
            onChange={(e) => handleFilterChange('work_setup', e.target.value)}
          >
            <option value="">All Setups (Extra Cheese)</option>
            {workSetups.map(setup => (
              <option key={setup} value={setup}>{setup}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default PizzaBoxFilter;

