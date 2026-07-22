import { PizzaData } from "../../types";
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users } from 'lucide-react';
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

const DemographicsChart = ({ data }: { data: PizzaData[] }) => {
  const { ageData, genderData, focusMeetingData } = useMemo(() => {
    if (!data || data.length === 0) return { ageData: [], genderData: [], focusMeetingData: [] };

    const ageMap: Record<string, number> = {};
    const genderMap: Record<string, number> = {};
    const focusMeetingMap: Record<string, { focus: number, meeting: number, count: number }> = {};

    for (let i = 0; i < data.length; i++) {
      const curr = data[i];
      if (curr.age_group) {
        ageMap[curr.age_group] = (ageMap[curr.age_group] || 0) + 1;
        
        if (!focusMeetingMap[curr.age_group]) {
          focusMeetingMap[curr.age_group] = { focus: 0, meeting: 0, count: 0 };
        }
        focusMeetingMap[curr.age_group].focus += curr.focus_hours || 0;
        focusMeetingMap[curr.age_group].meeting += curr.meeting_overhead || 0;
        focusMeetingMap[curr.age_group].count += 1;
      }
      if (curr.gender) {
        genderMap[curr.gender] = (genderMap[curr.gender] || 0) + 1;
      }
    }

    const ages = Object.entries(ageMap)
      .map(([age, count]) => ({ age, count }))
      .sort((a, b) => a.age.localeCompare(b.age));

    const genders = Object.entries(genderMap)
      .map(([name, value]) => ({ name, value }));

    const focusMeeting = Object.entries(focusMeetingMap)
      .map(([age, stats]) => ({
        age,
        focus: Number((stats.focus / stats.count).toFixed(1)),
        meeting: Number((stats.meeting / stats.count).toFixed(1))
      }))
      .sort((a, b) => a.age.localeCompare(b.age));

    return { ageData: ages, genderData: genders, focusMeetingData: focusMeeting };
  }, [data]);

  const PIE_COLORS = ['var(--chart-primary)', 'var(--chart-danger)', 'var(--chart-warning)', 'var(--chart-info)']; // Italian green, red, cheese yellow, blue

  return (
    <div className="pizza-card p-5 h-full flex flex-col gap-6">
      <h3 className="pizza-card-title text-xl font-bold text-[var(--card-text)] mb-2 pizza-divider pb-2 flex items-center gap-2">
        <Users className="text-red-600 w-6 h-6 shrink-0" />
        Demographic Distribution & Work Setup
        <TooltipInfo content={
          <div>
            <p className="font-bold mb-1">Chart Explanation:</p>
            <p>Displays the age and gender distribution of respondents, along with average focus vs. meeting hours by age group.</p>
          </div>
        } />
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Age Bar Chart */}
        <div className="flex flex-col min-h-[250px]" role="figure" aria-label="Bar chart showing age distribution of respondents.">
          <p className="text-sm text-[var(--card-subtext)] mb-2 text-center font-bold">Age Ranges</p>
          <div style={srOnlyStyle}>
            This bar chart displays the number of respondents for each age range.
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-line)" vertical={false} />
              <XAxis dataKey="age" tick={{ fill: 'var(--axis-text)', fontSize: 12, fontWeight: 'bold' }} axisLine={{ stroke: 'var(--axis-line)' }} tickLine={false} />
              <YAxis tick={{ fill: 'var(--axis-text)', fontSize: 12, fontWeight: 'bold' }} axisLine={{ stroke: 'var(--axis-line)' }} tickLine={false} />
              <Tooltip 
                cursor={{ fill: '#fcd34d', opacity: 0.3 }}
                contentStyle={{ backgroundColor: 'var(--tooltip-bg)', border: '2px solid #e3342f', borderRadius: '8px', color: '#333', fontWeight: 'bold' }}
              />
              <Bar dataKey="count" fill="var(--chart-danger)" radius={[4, 4, 0, 0]} name="Respondents" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gender Pie Chart */}
        <div className="flex flex-col min-h-[250px]" role="figure" aria-label="Pie chart showing gender breakdown of respondents.">
          <p className="text-sm text-[var(--card-subtext)] mb-2 text-center font-bold">Gender Breakdown</p>
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
                formatter={(value: any, name: any) => [value, name]}
                contentStyle={{ backgroundColor: 'var(--tooltip-bg)', border: '2px solid #16a34a', borderRadius: '8px', color: '#333', fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#333', fontWeight: 'bold' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mt-4">
        {/* Focus vs Meeting by Age Group Stacked Bar Chart */}
        <div className="flex flex-col min-h-[300px]" role="figure" aria-label="Stacked bar chart showing focus vs meeting hours by age group.">
          <p className="text-sm text-[var(--card-subtext)] mb-2 text-center font-bold">Average Focus vs. Meeting Hours by Age Group</p>
          <div style={srOnlyStyle}>
            This stacked bar chart displays the average focus hours and meeting hours for each age group.
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={focusMeetingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-line)" vertical={false} />
              <XAxis dataKey="age" tick={{ fill: 'var(--axis-text)', fontSize: 12, fontWeight: 'bold' }} axisLine={{ stroke: 'var(--axis-line)' }} tickLine={false} />
              <YAxis tick={{ fill: 'var(--axis-text)', fontSize: 12, fontWeight: 'bold' }} axisLine={{ stroke: 'var(--axis-line)' }} tickLine={false} />
              <Tooltip 
                cursor={{ fill: '#fcd34d', opacity: 0.3 }}
                contentStyle={{ backgroundColor: 'var(--tooltip-bg)', border: '2px solid #3b82f6', borderRadius: '8px', color: '#333', fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#333', fontWeight: 'bold' }} />
              <Bar dataKey="focus" stackId="a" fill="var(--chart-primary)" name="Focus Hours" radius={[0, 0, 0, 0]} />
              <Bar dataKey="meeting" stackId="a" fill="var(--chart-warning)" name="Meeting Hours" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DemographicsChart;
