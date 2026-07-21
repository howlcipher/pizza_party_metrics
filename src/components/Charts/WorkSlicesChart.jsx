import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine 
} from 'recharts';

const WorkSlicesChart = ({ data }) => {
  // Aggregate data by work_setup to compare
  const aggregatedData = data.reduce((acc, curr) => {
    const existing = acc.find(item => item.work_setup === curr.work_setup);
    if (existing) {
      existing.focus_hours += curr.focus_hours;
      existing.meeting_overhead += curr.meeting_overhead;
      existing.count += 1;
    } else {
      acc.push({
        work_setup: curr.work_setup,
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
    <div className="bg-white border-2 border-amber-500 rounded-xl p-5 shadow-lg h-full flex flex-col">
      <h3 className="text-lg font-bold text-red-600 mb-2 border-b border-amber-100 pb-2">
        Slices of Work: Focus vs Meetings
      </h3>
      <p className="text-xs text-amber-700 mb-4">
        Weekly Focus Hours vs. Meeting Overhead across different mandates.
      </p>
      
      <div className="flex-grow min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#fef3c7" vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#92400e', fontWeight: 600 }} 
              axisLine={{ stroke: '#f59e0b' }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: '#92400e' }}
              axisLine={{ stroke: '#f59e0b' }}
              tickLine={false}
              label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: '#92400e' }}
            />
            <Tooltip 
              cursor={{ fill: '#fef3c7', opacity: 0.4 }}
              contentStyle={{ 
                backgroundColor: '#fffbeb', 
                border: '2px solid #f59e0b',
                borderRadius: '8px',
                color: '#92400e',
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
