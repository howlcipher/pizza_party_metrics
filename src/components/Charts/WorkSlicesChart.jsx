import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const WorkSlicesChart = ({ data }) => {
  // Aggregate data by work_setup to compare
  const aggregatedData = data.reduce((acc, curr) => {
    // using work_setup_category now instead of work_setup object
    const existing = acc.find(item => item.work_setup === curr.work_setup_category);
    if (existing) {
      existing.focus_hours += curr.focus_hours;
      existing.meeting_overhead += curr.meeting_overhead;
      existing.count += 1;
    } else {
      acc.push({
        work_setup: curr.work_setup_category,
        focus_hours: curr.focus_hours,
        meeting_overhead: curr.meeting_overhead,
        count: 1
      });
    }
    return acc;
  }, []);

  const chartData = aggregatedData.map(item => ({
    name: item.work_setup,
    "Focus Hours": Number((item.focus_hours / item.count).toFixed(1)),
    "Meeting Overhead": Number((item.meeting_overhead / item.count).toFixed(1))
  }));

  return (
    <div className="bg-gray-800 border-2 border-gray-700 rounded-xl p-5 shadow-lg h-full flex flex-col">
      <h3 className="text-lg font-bold text-red-400 mb-2 border-b border-gray-700 pb-2">
        Slices of Work: Focus vs Meetings
      </h3>
      <p className="text-xs text-gray-400 mb-4">
        Weekly Focus Hours vs. Meeting Overhead across different mandates.
      </p>
      
      <div className="flex-grow min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#9ca3af', fontWeight: 600 }} 
              axisLine={{ stroke: '#4b5563' }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: '#9ca3af' }}
              axisLine={{ stroke: '#4b5563' }}
              tickLine={false}
              label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
            />
            <Tooltip 
              cursor={{ fill: '#374151', opacity: 0.4 }}
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: '1px solid #4b5563',
                borderRadius: '8px',
                color: '#e5e7eb',
                fontWeight: 'bold'
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Bar dataKey="Focus Hours" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={60} />
            <Bar dataKey="Meeting Overhead" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={60} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WorkSlicesChart;

