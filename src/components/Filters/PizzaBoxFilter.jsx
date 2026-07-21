import React, { useMemo } from 'react';
import { Filter } from 'lucide-react';

const PizzaBoxFilter = ({ filters, setFilters, data }) => {
  const { industries, ageGroups, workSetups } = useMemo(() => ({
    industries: [...new Set(data.map(d => d.industry))].sort(),
    ageGroups: [...new Set(data.map(d => d.age_group))].sort(),
    workSetups: [...new Set(data.map(d => d.work_setup_category))].sort(),
  }), [data]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-gray-800 border-2 border-gray-700 rounded-xl p-5 shadow-lg relative overflow-hidden">
      {/* Decorative corner */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gray-700 transform rotate-45 translate-x-8 -translate-y-8 border-l border-b border-gray-600"></div>
      
      <div className="flex items-center gap-2 mb-4 text-red-400 border-b border-gray-700 pb-2">
        <Filter size={20} />
        <h2 className="text-xl font-bold">The Pizza Box Filter</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        {/* Industry Filter */}
        <div className="flex flex-col gap-1">
          <label htmlFor="industry-select" className="text-sm font-bold text-gray-400 uppercase tracking-wide">Industry</label>
          <select 
            id="industry-select"
            className="p-2 rounded-md border border-gray-600 bg-gray-900 text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
            value={filters.industry || ''}
            onChange={(e) => handleFilterChange('industry', e.target.value)}
          >
            <option value="">All Industries</option>
            {industries.map(ind => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>

        {/* Age Group Filter */}
        <div className="flex flex-col gap-1">
          <label htmlFor="age-group-select" className="text-sm font-bold text-gray-400 uppercase tracking-wide">Age Group</label>
          <select 
            id="age-group-select"
            className="p-2 rounded-md border border-gray-600 bg-gray-900 text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
            value={filters.age_group || ''}
            onChange={(e) => handleFilterChange('age_group', e.target.value)}
          >
            <option value="">All Ages</option>
            {ageGroups.map(age => (
              <option key={age} value={age}>{age}</option>
            ))}
          </select>
        </div>

        {/* Work Setup Filter */}
        <div className="flex flex-col gap-1">
          <label htmlFor="work-setup-select" className="text-sm font-bold text-gray-400 uppercase tracking-wide">Work Setup</label>
          <select 
            id="work-setup-select"
            className="p-2 rounded-md border border-gray-600 bg-gray-900 text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
            value={filters.work_setup || ''}
            onChange={(e) => handleFilterChange('work_setup', e.target.value)}
          >
            <option value="">All Setups</option>
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

