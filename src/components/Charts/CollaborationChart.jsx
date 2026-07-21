import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const srOnlyStyle = {
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

const CollaborationChart = ({ data }) => {
  // Aggregate data by work_setup to compare collaboration scores
  const aggregatedData = data.reduce((acc, curr) => {
    const existing = acc.find(item => item.work_setup === curr.work_setup_category);
    if (existing) {
      existing.collaboration_score += curr.collaboration_score;
      existing.turnaround_hours += curr.review_turnaround_hours;
      existing.count += 1;
    } else {
      acc.push({
        work_setup: curr.work_setup_category,
        collaboration_score: curr.collaboration_score || 0,
        turnaround_hours: curr.review_turnaround_hours || 0,
        count: 1
      });
    }
    return acc;
  }, []);

  const chartData = aggregatedData.map(item => ({
    name: item.work_setup,
    "Online Collaboration Score": Number((item.collaboration_score / item.count).toFixed(1)),
    "Review Turnaround (Hrs)": Number((item.turnaround_hours / item.count).toFixed(1))
  }));

  return (
    <div className="bg-white/95 border border-gray-200 rounded p-5 shadow-sm h-full flex flex-col">
      <h3 className="text-xl font-bold text-[#3E2723] mb-2 border-b border-gray-200 pb-2">
        Async Collaboration Velocity
      </h3>
      <p className="text-sm text-gray-600 font-bold mb-4">
        Online collaboration efficiency (PR merges, code reviews) vs. time blocked waiting.
      </p>
      
      <div className="flex-grow min-h-[300px]" role="img" aria-label="Bar chart comparing Collaboration Scores across work setups.">
        <div style={srOnlyStyle}>
          This bar chart displays the breakdown of online collaboration scores versus review turnaround hours across different work setup categories.
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#4b5563', fontWeight: 700 }} 
              axisLine={{ stroke: '#d1d5db' }}
              tickLine={false}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fill: '#3b82f6', fontWeight: 600 }}
              axisLine={{ stroke: '#d1d5db' }}
              tickLine={false}
              label={{ value: 'Collab Score', angle: -90, position: 'insideLeft', fill: '#3b82f6', fontWeight: 'bold' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#f59e0b', fontWeight: 600 }}
              axisLine={{ stroke: '#d1d5db' }}
              tickLine={false}
              label={{ value: 'Wait Hours', angle: 90, position: 'insideRight', fill: '#f59e0b', fontWeight: 'bold' }}
            />
            <Tooltip 
              cursor={{ fill: '#e5e7eb', opacity: 0.3 }}
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '2px solid #3b82f6',
                borderRadius: '8px',
                color: '#333',
                fontWeight: 'bold'
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px', fontWeight: 'bold', color: '#333' }} />
            <Bar yAxisId="left" dataKey="Online Collaboration Score" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} />
            <Bar yAxisId="right" dataKey="Review Turnaround (Hrs)" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={60} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CollaborationChart;
