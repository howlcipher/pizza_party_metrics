import React from 'react';
import { Filter } from 'lucide-react';

const PizzaBoxFilter = ({ filters, setFilters, data }) => {
  const industries = [...new Set(data.map(d => d.industry))];
  const ageGroups = [...new Set(data.map(d => d.age_group))];
  const workSetups = [...new Set(data.map(d => d.work_setup))];

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-white border-2 border-amber-500 rounded-xl p-5 shadow-lg relative overflow-hidden">
      {/* Decorative corner */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-amber-100 transform rotate-45 translate-x-8 -translate-y-8 border-l border-b border-amber-200"></div>
      
      <div className="flex items-center gap-2 mb-4 text-red-600 border-b border-amber-100 pb-2">
        <Filter size={20} />
        <h2 className="text-xl font-bold">The Pizza Box Filter</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Industry Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-bold text-amber-800 uppercase tracking-wide">Industry</label>
          <select 
            className="p-2 rounded-md border border-amber-300 bg-amber-50 text-amber-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
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
          <label className="text-sm font-bold text-amber-800 uppercase tracking-wide">Age Group</label>
          <select 
            className="p-2 rounded-md border border-amber-300 bg-amber-50 text-amber-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
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
          <label className="text-sm font-bold text-amber-800 uppercase tracking-wide">Work Setup</label>
          <select 
            className="p-2 rounded-md border border-amber-300 bg-amber-50 text-amber-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
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
