import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
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

const DemographicsChart = ({ data }) => {
  // Aggregate data for Age
  const ageData = data.reduce((acc, curr) => {
    const existing = acc.find(item => item.age === curr.age_group);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ age: curr.age_group, count: 1 });
    }
    return acc;
  }, []);
  
  // Sort age groups naturally
  ageData.sort((a, b) => a.age.localeCompare(b.age));

  // Aggregate data for Gender
  const genderData = data.reduce((acc, curr) => {
    const existing = acc.find(item => item.name === curr.gender);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: curr.gender, value: 1 });
    }
    return acc;
  }, []);

  const PIE_COLORS = ['#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b'];

  return (
    <div className="bg-gray-800 border-2 border-gray-700 rounded-xl p-5 shadow-lg h-full flex flex-col gap-6">
      <h3 className="text-lg font-bold text-purple-400 mb-2 border-b border-gray-700 pb-2">
        Demographic Distribution
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
        {/* Age Bar Chart */}
        <div className="flex flex-col min-h-[250px]" role="img" aria-label="Bar chart showing age distribution of respondents.">
          <p className="text-sm text-gray-400 mb-2 text-center font-semibold">Age Ranges</p>
          <div style={srOnlyStyle}>
            This bar chart displays the number of respondents for each age range.
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="age" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#4b5563' }} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#4b5563' }} tickLine={false} />
              <Tooltip 
                cursor={{ fill: '#374151', opacity: 0.4 }}
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', borderRadius: '8px', color: '#e5e7eb' }}
              />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Respondents" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gender Pie Chart */}
        <div className="flex flex-col min-h-[250px]" role="img" aria-label="Pie chart showing gender breakdown of respondents.">
          <p className="text-sm text-gray-400 mb-2 text-center font-semibold">Gender Breakdown</p>
          <div style={srOnlyStyle}>
            This pie chart displays the gender breakdown of the survey respondents.
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                innerRadius="40%"
                outerRadius="80%"
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {genderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [value, name]}
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', borderRadius: '8px', color: '#e5e7eb' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DemographicsChart;
