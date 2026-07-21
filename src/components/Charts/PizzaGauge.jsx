import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

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

const PizzaGauge = ({ data }) => {
  // Calculate average index
  const avgIndex = data.length > 0 
    ? data.reduce((acc, curr) => acc + curr.pizza_party_index, 0) / data.length 
    : 0;
  
  // Assume max index is 5 for the gauge
  const maxIndex = 5;
  const normalizedValue = Math.min(avgIndex, maxIndex);
  const remainingValue = maxIndex - normalizedValue;

  const gaugeData = [
    { name: 'Pizza Party Index', value: normalizedValue },
    { name: 'Remaining', value: remainingValue }
  ];

  const COLORS = ['#ef4444', '#374151']; // red-500, gray-700

  const renderCustomNeedle = () => {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-16">
        <span className="text-4xl font-extrabold text-red-500 drop-shadow-md">{avgIndex.toFixed(1)}</span>
        <span className="text-sm font-semibold text-gray-400">Avg Index</span>
      </div>
    );
  };

  return (
    <div className="bg-gray-800 border-2 border-gray-700 rounded-xl p-5 shadow-lg h-full flex flex-col relative">
      <h3 className="text-lg font-bold text-red-400 mb-2 border-b border-gray-700 pb-2">
        Pizza Party Index Gauge
      </h3>
      <p className="text-xs text-gray-400 mb-4">
        Correlation of in-office perks with fragmented focus time. Higher = More Performative.
      </p>
      
      <div className="flex-grow relative min-h-[200px]" role="img" aria-label={`Pizza Party Index Gauge. Current average index is ${avgIndex.toFixed(1)} out of 5.`}>
        <div style={srOnlyStyle}>
          This gauge displays the Pizza Party Index, reflecting the correlation of in-office perks with fragmented focus time. The current average index is {avgIndex.toFixed(1)} out of 5.
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={gaugeData}
              cx="50%"
              cy="80%" // Push down since it's a half circle
              startAngle={180}
              endAngle={0}
              innerRadius="60%"
              outerRadius="90%"
              dataKey="value"
              stroke="none"
              cornerRadius={5}
            >
              {gaugeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name) => [value.toFixed(2), name]}
              contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: '1px solid #4b5563', color: '#e5e7eb' }}
            />
          </PieChart>
        </ResponsiveContainer>
        {renderCustomNeedle()}
      </div>
    </div>
  );
};

export default PizzaGauge;

