import React, { useMemo } from 'react';
import { PizzaData } from '../../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import TooltipInfo from '../TooltipInfo';

const srOnlyStyle: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

const MakerVsMeetingChart = ({ data }: { data: PizzaData[] }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const setupMap: Record<string, { focus_hours: number; meeting_overhead: number; count: number }> = {};
    for (let i = 0; i < data.length; i++) {
      const curr = data[i];
      const cat = curr.work_setup_category || 'Other';
      if (!setupMap[cat]) {
        setupMap[cat] = { focus_hours: 0, meeting_overhead: 0, count: 0 };
      }
      setupMap[cat].focus_hours += (curr.focus_hours || 0);
      setupMap[cat].meeting_overhead += (curr.meeting_overhead || 0);
      setupMap[cat].count += 1;
    }

    const preferredOrder = ['Remote-First', 'Hybrid', 'Onsite-Heavy'];
    const keys = Object.keys(setupMap);
    const sortedKeys = [
      ...preferredOrder.filter(k => keys.includes(k)),
      ...keys.filter(k => !preferredOrder.includes(k))
    ];

    return sortedKeys.map(cat => {
      const item = setupMap[cat];
      const avgFocus = item.count > 0 ? Number((item.focus_hours / item.count).toFixed(1)) : 0;
      const avgMeeting = item.count > 0 ? Number((item.meeting_overhead / item.count).toFixed(1)) : 0;
      const total = Number((avgFocus + avgMeeting).toFixed(1));
      const makerRatio = total > 0 ? Number(((avgFocus / total) * 100).toFixed(0)) : 0;

      return {
        category: cat,
        "Maker Time (Focus Hours)": avgFocus,
        "Meeting Time (Overhead)": avgMeeting,
        total,
        makerRatio
      };
    });
  }, [data]);

  return (
    <div className="bg-[var(--card-bg)] border-[var(--card-border)] rounded p-5 shadow-sm h-full flex flex-col">
      <h3 className="text-xl font-bold text-[var(--card-text)] mb-2 border-b border-gray-200 pb-2 flex items-center">
        Maker vs. Meeting Time Ratio
        <TooltipInfo content={
          <div>
            <p className="font-bold mb-1">Metrics Explained:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Maker Time:</strong> Continuous focus hours dedicated to deep creative and engineering work.</li>
              <li><strong>Meeting Time:</strong> Fragmented hours spent in synchronous meetings and call overhead.</li>
              <li><strong>Ratio:</strong> Higher Maker Time ratio enables longer flow states and higher velocity.</li>
            </ul>
          </div>
        } />
      </h3>
      <p className="text-sm text-[var(--card-subtext)] font-bold mb-4">
        Ratio of uninterrupted Maker Time vs. fragmented Meeting Overhead by Work Setup Category.
      </p>

      {/* Summary KPI Badges */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {chartData.map(item => (
            <div key={item.category} className="bg-amber-50/80 border border-amber-200 rounded p-2 text-center shadow-xs">
              <span className="block text-xs font-bold text-amber-900 truncate">{item.category}</span>
              <span className="text-lg font-extrabold text-green-700">{item.makerRatio}%</span>
              <span className="block text-[10px] text-gray-600 font-semibold">Maker Ratio</span>
            </div>
          ))}
        </div>
      )}

      <div 
        className="flex-grow min-h-[300px]" 
        role="img" 
        aria-label="Stacked bar chart comparing average Maker Time focus hours versus Meeting Time overhead grouped by work setup category."
      >
        <div className="sr-only" style={srOnlyStyle}>
          This stacked bar chart compares average weekly uninterrupted Maker Time (Focus Hours) against fragmented Meeting Time (Meeting Overhead) for each work setup category including Remote-First, Hybrid, and Onsite-Heavy.
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-line)" vertical={false} />
            <XAxis 
              dataKey="category" 
              tick={{ fill: 'var(--axis-text)', fontWeight: 700 }} 
              axisLine={{ stroke: 'var(--axis-line)' }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: 'var(--axis-text)', fontWeight: 600 }}
              axisLine={{ stroke: 'var(--axis-line)' }}
              tickLine={false}
              label={{ value: 'Hours / Week', angle: -90, position: 'insideLeft', fill: 'var(--axis-text)', fontWeight: 'bold' }}
            />
            <Tooltip 
              cursor={{ fill: '#fcd34d', opacity: 0.3 }}
              contentStyle={{ 
                backgroundColor: 'var(--tooltip-bg)', 
                border: '2px solid #16a34a',
                borderRadius: '8px',
                color: '#333',
                fontWeight: 'bold'
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px', fontWeight: 'bold', color: '#333' }} />
            <Bar dataKey="Maker Time (Focus Hours)" stackId="a" fill="var(--chart-primary)" radius={[0, 0, 4, 4]} maxBarSize={60} />
            <Bar dataKey="Meeting Time (Overhead)" stackId="a" fill="var(--chart-danger)" radius={[4, 4, 0, 0]} maxBarSize={60} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MakerVsMeetingChart;
