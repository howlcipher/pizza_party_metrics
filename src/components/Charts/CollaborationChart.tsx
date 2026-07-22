import { PizzaData } from "../../types";
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import TooltipInfo from '../TooltipInfo';
import velocityMetadata from '../../data/velocity_metadata.json';

const srOnlyStyle = {
  position: 'absolute' as const,
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

const CollaborationChart = ({ data }: { data: PizzaData[] }) => {
  // Extract active setups from the current filtered data to maintain filter functionality
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const activeSetups = new Set<string>();
    for (let i = 0; i < data.length; i++) {
      activeSetups.add(data[i].work_setup_category);
    }

    const setups = ["Remote-First", "Hybrid", "Onsite-Heavy"] as const;
    
    return setups
      .filter(setup => activeSetups.has(setup))
      .map(setup => {
        const meta = (velocityMetadata as any)[setup];
        return {
          name: setup,
          "Velocity Proxy": meta ? Number(meta.velocity_proxy.toFixed(4)) : 0,
          "Median Resolution (Hrs)": meta ? meta.median_resolution_h : 0
        };
      });
  }, [data]);

  return (
    <div className="bg-[var(--card-bg)] border-[var(--card-border)] rounded p-5 shadow-sm h-full flex flex-col">
      <h3 className="text-xl font-bold text-[var(--card-text)] mb-2 border-b border-gray-200 pb-2 flex items-center">
        Async Collaboration Velocity
        <TooltipInfo content={
          <div>
            <p className="font-bold mb-1">Metrics Explained:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Velocity Proxy:</strong> A measure of PRs/Issues resolved relative to open volume (higher is better).</li>
              <li><strong>Median Resolution (Hrs):</strong> Average time taken to resolve PRs and issues.</li>
            </ul>
          </div>
        } />
      </h3>
      <p className="text-sm text-[var(--card-subtext)] font-bold mb-4">
        GitHub telemetry: Velocity Proxy vs. Median Resolution Time.
      </p>
      
      <div className="flex-grow min-h-[300px]" role="figure" aria-label="Bar chart comparing Velocity Proxy across work setups.">
        <div style={srOnlyStyle}>
          This bar chart displays the breakdown of Velocity Proxy versus Median Resolution Hours across different work setup categories.
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
              yAxisId="left"
              tick={{ fill: 'var(--chart-primary)', fontWeight: 600 }}
              axisLine={{ stroke: 'var(--axis-line)' }}
              tickLine={false}
              label={{ value: 'Velocity Proxy', angle: -90, position: 'insideLeft', fill: 'var(--chart-primary)', fontWeight: 'bold' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fill: 'var(--chart-danger)', fontWeight: 600 }}
              axisLine={{ stroke: 'var(--axis-line)' }}
              tickLine={false}
              label={{ value: 'Median Res (Hrs)', angle: 90, position: 'insideRight', fill: 'var(--chart-danger)', fontWeight: 'bold' }}
            />
            <Tooltip 
              cursor={{ fill: '#e5e7eb', opacity: 0.3 }}
              contentStyle={{ 
                backgroundColor: 'var(--tooltip-bg)', 
                border: '2px solid #16a34a',
                borderRadius: '8px',
                color: '#333',
                fontWeight: 'bold'
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px', fontWeight: 'bold', color: '#333' }} />
            <Bar yAxisId="left" dataKey="Velocity Proxy" fill="var(--chart-primary)" radius={[4, 4, 0, 0]} maxBarSize={60} />
            <Bar yAxisId="right" dataKey="Median Resolution (Hrs)" fill="var(--chart-danger)" radius={[4, 4, 0, 0]} maxBarSize={60} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CollaborationChart;
