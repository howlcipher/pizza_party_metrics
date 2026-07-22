import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell 
} from 'recharts';
import { Trophy, Award, CheckCircle2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import TooltipInfo from '../TooltipInfo';
import advancedInsights from '../../data/advanced_collaboration_insights.json';

interface IndustryProfile {
  industry: string;
  avg_focus_hours: number;
  avg_meeting_overhead: number;
  avg_pizza_party_index: number;
}

interface BestSetupByIndustry {
  industry: string;
  work_setup_category: string;
  focus_meeting_ratio: number;
}

interface IndustryBenchmarksChartProps {
  selectedIndustry?: string;
}

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

const IndustryBenchmarksChart: React.FC<IndustryBenchmarksChartProps> = ({ selectedIndustry }) => {
  const [sortBy, setSortBy] = useState<'focus' | 'meeting' | 'ratio' | 'ppi' | 'name'>('focus');
  const [viewMode, setViewMode] = useState<'chart' | 'leaderboard' | 'both'>('both');

  const rawProfiles: IndustryProfile[] = useMemo(() => {
    return (advancedInsights.industry_profile || []) as IndustryProfile[];
  }, []);

  const bestSetupMap = useMemo(() => {
    const map: Record<string, string> = {};
    const items = ((advancedInsights as any).best_setup_by_industry || []) as BestSetupByIndustry[];
    items.forEach(item => {
      if (item.industry && item.work_setup_category) {
        map[item.industry] = item.work_setup_category;
      }
    });
    return map;
  }, []);

  // Compute baseline industry averages across all industries
  const overallStats = useMemo(() => {
    if (!rawProfiles.length) return { avgFocus: 0, avgMeeting: 0, avgPPI: 0 };
    const totalFocus = rawProfiles.reduce((acc, curr) => acc + curr.avg_focus_hours, 0);
    const totalMeeting = rawProfiles.reduce((acc, curr) => acc + curr.avg_meeting_overhead, 0);
    const totalPPI = rawProfiles.reduce((acc, curr) => acc + curr.avg_pizza_party_index, 0);
    const count = rawProfiles.length;
    return {
      avgFocus: Number((totalFocus / count).toFixed(2)),
      avgMeeting: Number((totalMeeting / count).toFixed(2)),
      avgPPI: Number((totalPPI / count).toFixed(2)),
    };
  }, [rawProfiles]);

  // Selected industry profile & stats comparison
  const selectedProfile = useMemo(() => {
    if (!selectedIndustry) return null;
    return rawProfiles.find(p => p.industry.toLowerCase() === selectedIndustry.toLowerCase()) || null;
  }, [selectedIndustry, rawProfiles]);

  // Ranked focus list for calculating benchmark rank
  const focusRankList = useMemo(() => {
    return [...rawProfiles].sort((a, b) => b.avg_focus_hours - a.avg_focus_hours);
  }, [rawProfiles]);

  const selectedRank = useMemo(() => {
    if (!selectedProfile) return null;
    const idx = focusRankList.findIndex(p => p.industry === selectedProfile.industry);
    return idx !== -1 ? idx + 1 : null;
  }, [selectedProfile, focusRankList]);

  // Sorted data for display according to current sort criteria
  const sortedProfiles = useMemo(() => {
    const data = [...rawProfiles].map(item => ({
      ...item,
      ratio: Number((item.avg_focus_hours / (item.avg_meeting_overhead || 1)).toFixed(2))
    }));

    switch (sortBy) {
      case 'focus':
        return data.sort((a, b) => b.avg_focus_hours - a.avg_focus_hours);
      case 'meeting':
        return data.sort((a, b) => a.avg_meeting_overhead - b.avg_meeting_overhead);
      case 'ratio':
        return data.sort((a, b) => b.ratio - a.ratio);
      case 'ppi':
        return data.sort((a, b) => a.avg_pizza_party_index - b.avg_pizza_party_index);
      case 'name':
        return data.sort((a, b) => a.industry.localeCompare(b.industry));
      default:
        return data;
    }
  }, [rawProfiles, sortBy]);

  // Maximum focus hours for scaling progress bars
  const maxFocusHours = useMemo(() => {
    return Math.max(...rawProfiles.map(p => p.avg_focus_hours), 25);
  }, [rawProfiles]);

  return (
    <div className="pizza-card p-5 h-full flex flex-col gap-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pizza-divider pb-4">
        <div>
          <h3 className="pizza-card-title text-xl font-bold text-[var(--card-text)] flex items-center gap-2">
            <Trophy className="text-amber-500 w-6 h-6 inline-block shrink-0" />
            Industry Collaboration Benchmarks & Leaderboard
            <TooltipInfo content={
              <div>
                <p className="font-bold mb-1">Benchmark Analysis:</p>
                <p className="mb-2">Compares average Focus Hours and Meeting Overhead across 14 industry sectors based on nationwide research profiles.</p>
                <ul className="list-disc pl-4 space-y-1 text-xs">
                  <li><strong>Focus Hours:</strong> Deep work time unobstructed by meetings.</li>
                  <li><strong>Meeting Overhead:</strong> Time spent in recurring or synchronous meetings.</li>
                  <li><strong>Pizza Party Index:</strong> Friction/burnout risk proxy score (lower is healthier).</li>
                </ul>
              </div>
            } />
          </h3>
          <p className="text-sm text-[var(--card-subtext)] font-semibold mt-1">
            Compare your selected industry filter against baseline industry norms
          </p>
        </div>

        {/* View Mode Switches */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-gray-100 p-1 rounded border border-gray-300 text-xs font-bold">
          <button
            type="button"
            onClick={() => setViewMode('both')}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
              viewMode === 'both' ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            Combined View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('chart')}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
              viewMode === 'chart' ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            Bar Chart
          </button>
          <button
            type="button"
            onClick={() => setViewMode('leaderboard')}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
              viewMode === 'leaderboard' ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            Leaderboard
          </button>
        </div>
      </div>

      {/* Selected Industry Benchmark Comparison Card */}
      {selectedProfile ? (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-400 rounded-lg p-4 sm:p-5 shadow-xs relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-amber-500 text-white text-xs px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 size={12} /> Active Filter Match
                </span>
                <span className="text-xs font-bold text-amber-900">Rank #{selectedRank} of {rawProfiles.length} in Focus Time</span>
              </div>
              <h4 className="pizza-card-title text-2xl font-bold text-amber-950">
                {selectedProfile.industry}
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
              {/* Focus Hours comparison */}
              <div className="bg-white/80 backdrop-blur-xs p-3 rounded border border-amber-200 shadow-xs">
                <span className="text-xs font-bold text-gray-500 block">Focus Hours</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xl font-extrabold text-green-700">{selectedProfile.avg_focus_hours}h</span>
                  <span className="text-xs text-gray-500">/ wk</span>
                </div>
                {(() => {
                  const diff = selectedProfile.avg_focus_hours - overallStats.avgFocus;
                  const isPos = diff >= 0;
                  return (
                    <span className={`text-xs font-bold flex items-center mt-1 ${isPos ? 'text-green-700' : 'text-red-600'}`}>
                      {isPos ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {Math.abs(diff).toFixed(2)}h vs avg ({overallStats.avgFocus}h)
                    </span>
                  );
                })()}
              </div>

              {/* Meeting Overhead comparison */}
              <div className="bg-white/80 backdrop-blur-xs p-3 rounded border border-amber-200 shadow-xs">
                <span className="text-xs font-bold text-gray-500 block">Meeting Overhead</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xl font-extrabold text-red-600">{selectedProfile.avg_meeting_overhead}h</span>
                  <span className="text-xs text-gray-500">/ wk</span>
                </div>
                {(() => {
                  const diff = selectedProfile.avg_meeting_overhead - overallStats.avgMeeting;
                  const isLower = diff <= 0;
                  return (
                    <span className={`text-xs font-bold flex items-center mt-1 ${isLower ? 'text-green-700' : 'text-red-600'}`}>
                      {diff > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {Math.abs(diff).toFixed(2)}h vs avg ({overallStats.avgMeeting}h)
                    </span>
                  );
                })()}
              </div>

              {/* Pizza Party Index */}
              <div className="bg-white/80 backdrop-blur-xs p-3 rounded border border-amber-200 shadow-xs col-span-2 sm:col-span-1">
                <span className="text-xs font-bold text-gray-500 block">Pizza Party Index</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xl font-extrabold text-amber-700">{selectedProfile.avg_pizza_party_index}</span>
                  <span className="text-xs text-gray-500">/ 10</span>
                </div>
                <span className="text-xs font-semibold text-gray-600 block mt-1">
                  Baseline Benchmark
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50/60 border border-amber-200 rounded p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-900">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-sm sm:text-base">Compare Your Sector Against Industry Benchmarks</p>
              <p className="text-xs text-amber-800">Select an <strong>Industry Flavor</strong> filter above to see detailed variance vs. the nationwide average.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-extrabold bg-white/70 px-3 py-2 rounded border border-amber-200 shrink-0">
            <div>Avg Focus: <span className="text-green-700">{overallStats.avgFocus}h</span></div>
            <div>Avg Meetings: <span className="text-red-600">{overallStats.avgMeeting}h</span></div>
          </div>
        </div>
      )}

      {/* Sorting & Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 p-3 rounded border border-gray-200">
        <div className="flex items-center gap-2">
          <label htmlFor="benchmark-sort" className="text-xs font-bold uppercase text-gray-700 tracking-wider">
            Sort Rankings By:
          </label>
          <select
            id="benchmark-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs font-bold bg-white border border-gray-300 rounded px-2.5 py-1.5 text-gray-800 focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <option value="focus">Focus Hours (Highest First)</option>
            <option value="meeting">Meeting Overhead (Lowest First)</option>
            <option value="ratio">Focus / Meeting Ratio</option>
            <option value="ppi">Pizza Party Index (Lowest Risk)</option>
            <option value="name">Industry Name (A-Z)</option>
          </select>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[var(--chart-primary)] inline-block"></span> Avg Focus Hours
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[var(--chart-danger)] inline-block"></span> Avg Meeting Overhead
          </span>
        </div>
      </div>

      {/* Bar Chart Section */}
      {(viewMode === 'both' || viewMode === 'chart') && (
        <div className="flex flex-col min-h-[360px]" role="figure" aria-label="Bar chart comparing focus hours and meeting overhead across industries.">
          <div style={srOnlyStyle}>
            This bar chart compares average focus hours and meeting overhead across 14 industries.
          </div>
          <div className="w-full h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedProfiles}
                margin={{ top: 20, right: 20, left: -10, bottom: 65 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-line)" vertical={false} />
                <XAxis 
                  dataKey="industry" 
                  tick={({ x, y, payload }) => {
                    const isSelected = selectedIndustry && payload.value.toLowerCase() === selectedIndustry.toLowerCase();
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text
                          x={0}
                          y={0}
                          dy={12}
                          textAnchor="end"
                          fill={isSelected ? '#d97706' : 'var(--axis-text)'}
                          fontWeight={isSelected ? '900' : '700'}
                          fontSize={11}
                          transform="rotate(-35)"
                        >
                          {payload.value} {isSelected ? '★' : ''}
                        </text>
                      </g>
                    );
                  }}
                  interval={0}
                  axisLine={{ stroke: 'var(--axis-line)' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: 'var(--axis-text)', fontSize: 12, fontWeight: 'bold' }}
                  axisLine={{ stroke: 'var(--axis-line)' }}
                  tickLine={false}
                  unit="h"
                />
                <Tooltip 
                  cursor={{ fill: '#fef3c7', opacity: 0.4 }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload as IndustryProfile & { ratio: number };
                    const isSelected = selectedIndustry && item.industry.toLowerCase() === selectedIndustry.toLowerCase();
                    const optimalSetup = bestSetupMap[item.industry] || 'N/A';
                    return (
                      <div className="bg-white p-3 border-2 border-amber-500 rounded-lg shadow-xl text-xs font-sans text-gray-900">
                        <div className="font-extrabold text-sm pizza-divider pb-1 mb-2 text-amber-900 flex items-center justify-between gap-2">
                          <span>{item.industry}</span>
                          {isSelected && <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">SELECTED</span>}
                        </div>
                        <div className="space-y-1">
                          <p className="text-green-700 font-bold">Focus Hours: {item.avg_focus_hours} hrs/wk</p>
                          <p className="text-red-600 font-bold">Meeting Overhead: {item.avg_meeting_overhead} hrs/wk</p>
                          <p className="text-gray-700 font-medium">Focus/Meeting Ratio: {item.ratio}x</p>
                          <p className="text-indigo-700 font-bold">Optimal Setup: {optimalSetup}</p>
                          <p className="text-amber-700 font-medium">Pizza Party Index: {item.avg_pizza_party_index} / 10</p>
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px', fontWeight: 'bold' }} />
                
                {/* Reference line for baseline focus average */}
                <ReferenceLine 
                  y={overallStats.avgFocus} 
                  stroke="var(--chart-primary)" 
                  strokeDasharray="4 4" 
                  label={{ value: `Avg Focus: ${overallStats.avgFocus}h`, fill: 'var(--chart-primary)', position: 'insideTopLeft', fontSize: 10, fontWeight: 'bold' }} 
                />

                <Bar dataKey="avg_focus_hours" name="Focus Hours" radius={[4, 4, 0, 0]}>
                  {sortedProfiles.map((entry) => {
                    const isSelected = selectedIndustry && entry.industry.toLowerCase() === selectedIndustry.toLowerCase();
                    return (
                      <Cell 
                        key={`cell-focus-${entry.industry}`} 
                        fill={isSelected ? '#15803d' : 'var(--chart-primary)'} 
                        stroke={isSelected ? '#f59e0b' : undefined}
                        strokeWidth={isSelected ? 2 : 0}
                      />
                    );
                  })}
                </Bar>
                <Bar dataKey="avg_meeting_overhead" name="Meeting Overhead" radius={[4, 4, 0, 0]}>
                  {sortedProfiles.map((entry) => {
                    const isSelected = selectedIndustry && entry.industry.toLowerCase() === selectedIndustry.toLowerCase();
                    return (
                      <Cell 
                        key={`cell-meeting-${entry.industry}`} 
                        fill={isSelected ? '#b91c1c' : 'var(--chart-danger)'} 
                        stroke={isSelected ? '#f59e0b' : undefined}
                        strokeWidth={isSelected ? 2 : 0}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Leaderboard Table Section */}
      {(viewMode === 'both' || viewMode === 'leaderboard') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <Award size={18} className="text-amber-600" /> Industry Ranking Leaderboard
            </h4>
            <span className="text-xs text-gray-500 font-semibold">14 Industry Sectors</span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100/90 text-gray-700 pizza-divider uppercase font-extrabold tracking-wider">
                  <th className="py-3 px-4 w-16 text-center">Rank</th>
                  <th className="py-3 px-4">Industry Sector</th>
                  <th className="py-3 px-4">Focus Hours / Wk</th>
                  <th className="py-3 px-4">Meeting Overhead</th>
                  <th className="py-3 px-4 text-center">Focus/Meeting Ratio</th>
                  <th className="py-3 px-4 text-center">Optimal Setup</th>
                  <th className="py-3 px-4 text-center">Pizza Party Index</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {sortedProfiles.map((item, index) => {
                  const isSelected = selectedIndustry && item.industry.toLowerCase() === selectedIndustry.toLowerCase();
                  const focusPct = Math.min(100, Math.round((item.avg_focus_hours / maxFocusHours) * 100));

                  return (
                    <tr
                      key={item.industry}
                      className={`transition-colors hover:bg-amber-50/50 ${
                        isSelected 
                          ? 'bg-amber-100/80 font-bold border-l-4 border-l-amber-500 shadow-xs' 
                          : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
                      }`}
                    >
                      {/* Rank Medal / Badge */}
                      <td className="py-3 px-4 text-center">
                        {index === 0 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-black shadow-xs">🥇</span>
                        ) : index === 1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-900 font-black shadow-xs">🥈</span>
                        ) : index === 2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-600 text-white font-black shadow-xs">🥉</span>
                        ) : (
                          <span className="text-gray-500 font-bold">#{index + 1}</span>
                        )}
                      </td>

                      {/* Industry Name */}
                      <td className="py-3 px-4 font-bold text-gray-900">
                        <div className="flex items-center gap-2">
                          <span>{item.industry}</span>
                          {isSelected && (
                            <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase">
                              Selected
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Focus Hours Progress Bar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-green-700 w-12">{item.avg_focus_hours}h</span>
                          <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden max-w-[120px]">
                            <div 
                              className="bg-green-600 h-full rounded-full" 
                              style={{ width: `${focusPct}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Meeting Overhead Progress Bar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-red-600 w-12">{item.avg_meeting_overhead}h</span>
                          <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden max-w-[120px]">
                            <div 
                              className="bg-red-500 h-full rounded-full" 
                              style={{ width: `${Math.min(100, Math.round((item.avg_meeting_overhead / 25) * 100))}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Focus/Meeting Ratio */}
                      <td className="py-3 px-4 text-center font-extrabold">
                        <span className={`px-2 py-1 rounded ${item.ratio >= 1.0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {item.ratio}x
                        </span>
                      </td>

                      {/* Optimal Setup */}
                      <td className="py-3 px-4 text-center font-bold">
                        <span className="inline-block px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {bestSetupMap[item.industry] || 'N/A'}
                        </span>
                      </td>

                      {/* Pizza Party Index */}
                      <td className="py-3 px-4 text-center font-bold text-amber-800">
                        {item.avg_pizza_party_index}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndustryBenchmarksChart;
