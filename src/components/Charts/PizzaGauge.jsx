import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

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

  const COLORS = ['#ef4444', '#fef3c7']; // red-500, amber-50

  const renderCustomNeedle = () => {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-16">
        <span className="text-4xl font-extrabold text-red-600">{avgIndex.toFixed(1)}</span>
        <span className="text-sm font-semibold text-amber-800">Avg Index</span>
      </div>
    );
  };

  return (
    <div className="bg-white border-2 border-amber-500 rounded-xl p-5 shadow-lg h-full flex flex-col relative">
      <h3 className="text-lg font-bold text-red-600 mb-2 border-b border-amber-100 pb-2">
        Pizza Party Index Gauge
      </h3>
      <p className="text-xs text-amber-700 mb-4">
        Correlation of in-office perks with fragmented focus time. Higher = More Performative.
      </p>
      
      <div className="flex-grow relative min-h-[200px]">
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
              contentStyle={{ borderRadius: '8px', border: '2px solid #f59e0b' }}
            />
          </PieChart>
        </ResponsiveContainer>
        {renderCustomNeedle()}
      </div>
    </div>
  );
};

export default PizzaGauge;
