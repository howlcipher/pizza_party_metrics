import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Flame, 
  ArrowRightLeft, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import TooltipInfo from '../TooltipInfo';
import { correlations } from '../../data/advanced_collaboration_insights.json';

interface CorrelationPair {
  id: string;
  metric1: string;
  metric2: string;
  value: number;
  type: 'positive' | 'negative';
  percentage: string;
  badgeLabel: string;
  badgeClass: string;
  headline: string;
  summary: string;
  recommendation: string;
  icon: React.ReactNode;
}

const StatisticalInsightsCard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cards' | 'matrix'>('cards');
  const [hoveredCell, setHoveredCell] = useState<{ row: string; col: string; val: number } | null>(null);

  // Safely reference correlation data
  const meetingPpi = correlations?.meeting_overhead?.pizza_party_index ?? 0.968;
  const focusPpi = correlations?.focus_hours?.pizza_party_index ?? -0.968;
  const focusMeeting = correlations?.focus_hours?.meeting_overhead ?? -1.0;

  const keyPairs: CorrelationPair[] = [
    {
      id: 'meeting_ppi',
      metric1: 'Meeting Overhead',
      metric2: 'Pizza Party Index',
      value: meetingPpi,
      type: 'positive',
      percentage: '+96.8%',
      badgeLabel: 'Strong Direct Correlation',
      badgeClass: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
      headline: 'Meeting Overload Triggers Pizza Interventions',
      summary: 'Empirical data reveals a 96.8% positive correlation between meeting fatigue and pizza party deployments. As meeting hours rise, management increasingly relies on pizza parties to boost morale.',
      recommendation: 'Replace mandatory pizza socials with calendar audits to directly address root fatigue.',
      icon: <Flame className="w-5 h-5 text-amber-500" />
    },
    {
      id: 'focus_meeting',
      metric1: 'Focus Hours',
      metric2: 'Meeting Overhead',
      value: focusMeeting,
      type: 'negative',
      percentage: '-100.0%',
      badgeLabel: 'Perfect Inverse Tradeoff',
      badgeClass: 'bg-rose-500/15 text-rose-700 border-rose-500/30',
      headline: 'Zero Cushion: Meetings Directly Destroy Focus',
      summary: 'A perfect -100.0% inverse correlation exists between focus hours and meeting overhead. Every hour scheduled in meetings directly subtracts from deep focus time.',
      recommendation: 'Establish no-meeting focus blocks to guarantee uninterrupted developer output.',
      icon: <ArrowRightLeft className="w-5 h-5 text-rose-500" />
    },
    {
      id: 'focus_ppi',
      metric1: 'Focus Hours',
      metric2: 'Pizza Party Index',
      value: focusPpi,
      type: 'negative',
      percentage: '-96.8%',
      badgeLabel: 'Strong Inverse Correlation',
      badgeClass: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
      headline: 'High Focus Teams Require 96.8% Fewer Pizza Parties',
      summary: 'Teams with sustained focus hours show a -96.8% inverse correlation with the Pizza Party Index. Protecting focus time is the most effective cure for employee dissatisfaction.',
      recommendation: 'Measure productivity by uninterrupted focus time rather than attendance at team events.',
      icon: <Sparkles className="w-5 h-5 text-emerald-500" />
    }
  ];

  const matrixMetrics = [
    { key: 'focus_hours', label: 'Focus Hours' },
    { key: 'meeting_overhead', label: 'Meeting Overhead' },
    { key: 'pizza_party_index', label: 'Pizza Party Index' }
  ];

  const getMatrixValue = (rowKey: string, colKey: string): number => {
    if (rowKey === colKey) return 1.0;
    const rowObj = (correlations as Record<string, Record<string, number>>)[rowKey];
    if (rowObj && typeof rowObj[colKey] === 'number') {
      return rowObj[colKey];
    }
    return 0;
  };

  const getCellColor = (val: number, isSelf: boolean) => {
    if (isSelf) return 'bg-gray-100 text-gray-500 font-mono';
    if (val > 0.8) return 'bg-amber-500/20 text-amber-800 font-bold border border-amber-500/40';
    if (val < -0.8) return 'bg-emerald-500/20 text-emerald-800 font-bold border border-emerald-500/40';
    return 'bg-gray-50 text-gray-700';
  };

  return (
    <div className="pizza-card p-5 lg:p-6 transition-all flex flex-col h-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 pizza-divider">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h3 className="pizza-card-title text-xl font-extrabold text-[var(--card-text)] flex items-center">
              Key Takeaways &amp; Statistical Insights
              <TooltipInfo content={
                <div>
                  <p className="font-bold mb-1">Pearson Correlation Coefficient (r):</p>
                  <p className="text-xs leading-relaxed mb-2">
                    Measures linear correlation between variables ranging from -1.0 (perfect inverse) to +1.0 (perfect positive).
                  </p>
                  <ul className="list-disc pl-4 text-xs space-y-1">
                    <li><strong>+0.968:</strong> Strong positive link between meeting churn &amp; pizza parties.</li>
                    <li><strong>-1.000:</strong> Direct 1:1 tradeoff between meetings &amp; focus hours.</li>
                    <li><strong>-0.968:</strong> High focus reduces need for pizza morale boosters.</li>
                  </ul>
                </div>
              } />
            </h3>
          </div>
          <p className="text-sm text-[var(--card-subtext)] mt-1">
            Empirical correlation analysis across meeting overhead, deep focus hours, and the Pizza Party Index (PPI).
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-gray-100 p-1 rounded-lg self-start sm:self-auto border border-gray-200">
          <button
            onClick={() => setActiveTab('cards')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
              activeTab === 'cards'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Insights Cards
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
              activeTab === 'matrix'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Correlation Matrix
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'cards' ? (
        <div className="mt-6 space-y-6">
          {/* Featured Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {keyPairs.map((pair) => (
              <div 
                key={pair.id} 
                className="bg-white/80 border border-gray-200 rounded-xl p-4 flex flex-col justify-between hover:shadow-lg transition-all duration-200 relative overflow-hidden group"
              >
                {/* Top Accent Line */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  pair.type === 'positive' ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 
                  pair.id === 'focus_meeting' ? 'bg-gradient-to-r from-rose-400 to-red-600' :
                  'bg-gradient-to-r from-emerald-400 to-teal-500'
                }`} />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {pair.icon}
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {pair.metric1} vs {pair.metric2}
                      </span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${pair.badgeClass}`}>
                      {pair.percentage}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors">
                    {pair.headline}
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed mb-4">
                    {pair.summary}
                  </p>
                </div>

                {/* Progress / Magnitude Bar */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500 font-medium">Correlation Intensity</span>
                    <span className="font-mono font-bold text-gray-700">
                      {pair.value > 0 ? `+${pair.value.toFixed(3)}` : pair.value.toFixed(3)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        pair.type === 'positive' ? 'bg-amber-500' : 
                        pair.id === 'focus_meeting' ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.abs(pair.value) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actionable Executive Takeaways */}
          <div className="bg-orange-50/60 border border-orange-200/80 rounded-xl p-5">
            <h4 className="text-sm font-bold text-orange-950 flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-orange-600" />
              Strategic Takeaways for Engineering Leaders
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-700">
              <div className="flex items-start gap-2 bg-white/60 p-3 rounded-lg border border-orange-100">
                <span className="font-extrabold text-orange-600 text-sm">01</span>
                <p>
                  <strong>Address Root Causes:</strong> Free pizza cannot offset calendar bloat. Reducing weekly meetings by 2 hours improves developer satisfaction faster than social events.
                </p>
              </div>
              <div className="flex items-start gap-2 bg-white/60 p-3 rounded-lg border border-orange-100">
                <span className="font-extrabold text-orange-600 text-sm">02</span>
                <p>
                  <strong>Protect Deep Focus:</strong> Every hour in meetings directly cannibalizes developer focus time at a strict 1:1 ratio (-100% correlation).
                </p>
              </div>
              <div className="flex items-start gap-2 bg-white/60 p-3 rounded-lg border border-orange-100">
                <span className="font-extrabold text-orange-600 text-sm">03</span>
                <p>
                  <strong>Track the Index:</strong> High Pizza Party Index (PPI) is a diagnostic alarm for high meeting churn rather than a metric of successful team bonding.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Correlation Matrix View */
        <div className="mt-6 space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="pizza-divider">
                  <th className="py-3 px-4 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                    Metric
                  </th>
                  {matrixMetrics.map(m => (
                    <th key={m.key} className="py-3 px-4 text-xs font-extrabold text-gray-700 uppercase tracking-wider text-center">
                      {m.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {matrixMetrics.map((row) => (
                  <tr key={row.key} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-900 text-xs">
                      {row.label}
                    </td>
                    {matrixMetrics.map((col) => {
                      const val = getMatrixValue(row.key, col.key);
                      const isSelf = row.key === col.key;
                      return (
                        <td 
                          key={col.key} 
                          onMouseEnter={() => setHoveredCell({ row: row.label, col: col.label, val })}
                          onMouseLeave={() => setHoveredCell(null)}
                          className="py-3 px-4 text-center cursor-default transition-all"
                        >
                          <span className={`inline-block px-3 py-1.5 rounded-md text-xs ${getCellColor(val, isSelf)}`}>
                            {val > 0 && !isSelf ? `+${val.toFixed(3)}` : val.toFixed(3)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Matrix Hover Helper / Details */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs">
            {hoveredCell ? (
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">
                  {hoveredCell.row} &amp; {hoveredCell.col}:
                </span>
                <span className="font-mono font-extrabold text-amber-600">
                  r = {hoveredCell.val > 0 ? `+${hoveredCell.val.toFixed(3)}` : hoveredCell.val.toFixed(3)}
                </span>
                <span className="text-gray-600">
                  ({hoveredCell.val === 1 ? 'Identical metric baseline' :
                    hoveredCell.val > 0 ? 'Strong positive correlation — metrics increase together' :
                    'Inverse correlation — increase in one decreases the other'})
                </span>
              </div>
            ) : (
              <p className="text-gray-500 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-gray-400" />
                Hover over matrix cells to inspect specific metric correlation relationships.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatisticalInsightsCard;
