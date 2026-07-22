import { PizzaData } from "../../types";
import React, { useMemo } from 'react';
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

const WorkSlicesChart = ({ data }: { data: PizzaData[] }) => {
  // Aggregate data by work_setup_category using memoized single-pass accumulator
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const setupMap: Record<string, { focus_hours: number, meeting_overhead: number, fatigue_penalty: number, count: number }> = {};
    for (let i = 0; i < data.length; i++) {
      const curr = data[i];
      const cat = curr.work_setup_category || 'Other';
      if (!setupMap[cat]) {
        setupMap[cat] = { focus_hours: 0, meeting_overhead: 0, fatigue_penalty: 0, count: 0 };
      }
      setupMap[cat].focus_hours += (curr.focus_hours || 0);
      setupMap[cat].meeting_overhead += (curr.meeting_overhead || 0);
      setupMap[cat].fatigue_penalty += (curr.fatigue_penalty || 0);
      setupMap[cat].count += 1;
    }

    return Object.entries(setupMap).map(([cat, item]) => ({
      name: cat,
      "Focus Hours": Number((item.focus_hours / item.count).toFixed(1)),
      "Meeting Overhead": Number((item.meeting_overhead / item.count).toFixed(1)),
      "Fatigue Penalty": Number((item.fatigue_penalty / item.count).toFixed(1))
    }));
  }, [data]);

  return (
    <div className="pizza-card p-5 h-full flex flex-col">
      <h3 className="pizza-card-title text-xl font-bold text-[var(--card-text)] mb-2 pizza-divider pb-2 flex items-center">
        Slices of Work: Focus vs Meetings vs Fatigue
        <TooltipInfo content={
          <div>
            <p className="font-bold mb-1">Metrics Explained:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Focus Hours:</strong> Uninterrupted time dedicated to deep work (higher is better).</li>
              <li><strong>Meeting Overhead:</strong> Time spent in sync meetings that fragment the day.</li>
              <li><strong>Fatigue Penalty:</strong> Capacity lost due to commute strain and physical work setup demands.</li>
            </ul>
          </div>
        } />
      </h3>
      <p className="text-sm text-[var(--card-subtext)] font-bold mb-4">
        Weekly Focus Hours, Meeting Overhead, and Fatigue Penalty across different mandates.
      </p>
      
      <div className="flex-grow min-h-[300px]" role="figure" aria-label="Bar chart comparing Focus Hours, Meeting Overhead, and Fatigue Penalty by work setup category.">
        <div style={srOnlyStyle}>
          This bar chart displays the breakdown of weekly focus hours, meeting overhead, and commute fatigue penalty in hours across different work setup categories, such as Onsite-Heavy, Hybrid, and Remote-First.
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-line)" vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fill: 'var(--axis-text)', fontWeight: 700 }} 
              axisLine={{ stroke: 'var(--axis-line)' }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: 'var(--axis-text)', fontWeight: 600 }}
              axisLine={{ stroke: 'var(--axis-line)' }}
              tickLine={false}
              label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: 'var(--axis-text)', fontWeight: 'bold' }}
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
            <Bar dataKey="Focus Hours" fill="var(--chart-primary)" radius={[4, 4, 0, 0]} maxBarSize={60} />
            <Bar dataKey="Meeting Overhead" fill="var(--chart-danger)" radius={[4, 4, 0, 0]} maxBarSize={60} />
            <Bar dataKey="Fatigue Penalty" fill="var(--chart-warning)" radius={[4, 4, 0, 0]} maxBarSize={60} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WorkSlicesChart;

