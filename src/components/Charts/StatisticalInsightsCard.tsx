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

  // Read correlations live so displayed percentages can never drift out of
  // sync with the badge/headline copy below (this dashboard's data is
  // refreshed periodically by an automated ETL job).
  const meetingPpi = correlations?.meeting_overhead?.pizza_party_index ?? 0;
  const focusPpi = correlations?.focus_hours?.pizza_party_index ?? 0;
  const focusMeeting = correlations?.focus_hours?.meeting_overhead ?? -1.0;

  const pct = (v: number) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}%`;
  const strengthBadge = (v: number): { label: string; cls: string } => {
    const abs = Math.abs(v);
    if (abs >= 0.9) {
      return v >= 0
        ? { label: 'Very Strong Direct Correlation', cls: 'bg-amber-500/15 text-amber-700 border-amber-500/30' }
        : { label: 'Very Strong Inverse Correlation', cls: 'bg-rose-500/15 text-rose-700 border-rose-500/30' };
    }
    if (abs >= 0.5) {
      return v >= 0
        ? { label: 'Moderate Direct Correlation', cls: 'bg-amber-500/15 text-amber-700 border-amber-500/30' }
        : { label: 'Moderate Inverse Correlation', cls: 'bg-rose-500/15 text-rose-700 border-rose-500/30' };
    }
    return { label: 'Weak Correlation', cls: 'bg-gray-200 text-gray-700 border-gray-300' };
  };

  const meetingPpiBadge = strengthBadge(meetingPpi);
  const focusPpiBadge = strengthBadge(focusPpi);

  const keyPairs: CorrelationPair[] = [
    {
      id: 'meeting_ppi',
      metric1: 'Meeting Overhead',
      metric2: 'Pizza Party Index',
      value: meetingPpi,
      type: meetingPpi >= 0 ? 'positive' : 'negative',
      percentage: pct(meetingPpi),
      badgeLabel: meetingPpiBadge.label,
      badgeClass: meetingPpiBadge.cls,
      headline: 'Meeting Overhead Tracks the Pizza Party Index',
      summary: `The Index (Focus Hours + Collaboration Score × 2.0) currently ${meetingPpi >= 0 ? 'rises' : 'falls'} alongside Meeting Overhead. Because the Collaboration term comes from a fixed GitHub-repo proxy shared across all industries (see "The Recipe"), this relationship is driven as much by which work-setup category is faster on GitHub right now as by meeting culture itself — read it as a snapshot, not a fixed law.`,
      recommendation: 'Use this alongside the raw Focus Hours / Meeting Overhead numbers below, not as a standalone verdict on meeting culture.',
      icon: <Flame className="w-5 h-5 text-amber-500" />
    },
    {
      id: 'focus_meeting',
      metric1: 'Focus Hours',
      metric2: 'Meeting Overhead',
      value: focusMeeting,
      type: 'negative',
      percentage: pct(focusMeeting),
      badgeLabel: 'Correlation by Definition',
      badgeClass: 'bg-rose-500/15 text-rose-700 border-rose-500/30',
      headline: 'Focus Hours and Meeting Overhead Are Complementary',
      summary: 'This near-perfect inverse relationship is built into how the two metrics are defined (Meeting Overhead is derived as the remainder of a fixed weekly-hours budget after Focus Hours), not an independently discovered finding — the underlying, meaningful signal is how that split shifts by work setup, shown in "Slices of Work" below.',
      recommendation: 'Compare the two metrics across work setups directly rather than citing this correlation as new evidence on its own.',
      icon: <ArrowRightLeft className="w-5 h-5 text-rose-500" />
    },
    {
      id: 'focus_ppi',
      metric1: 'Focus Hours',
      metric2: 'Pizza Party Index',
      value: focusPpi,
      type: focusPpi >= 0 ? 'positive' : 'negative',
      percentage: pct(focusPpi),
      badgeLabel: focusPpiBadge.label,
      badgeClass: focusPpiBadge.cls,
      headline: 'Focus Hours vs. the Pizza Party Index',
      summary: `Focus Hours currently move ${focusPpi >= 0 ? 'with' : 'against'} the Index. Since the Index adds Focus Hours directly, a negative reading here means the Collaboration term (see caveat above) is swinging hard enough in the opposite direction to overwhelm it for the current data snapshot.`,
      recommendation: 'Prefer the individual Focus Hours and Collaboration figures over the combined Index when comparing work setups.',
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
                    Measures linear correlation between variables ranging from -1.0 (perfect inverse) to +1.0 (perfect positive). Values below refresh with the live dataset — see each card's caveat for how to read it.
                  </p>
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
                  <strong>Protect Deep Focus:</strong> Focus Hours and Meeting Overhead move in lockstep by definition — every hour added to one is an hour removed from the other's fixed weekly budget.
                </p>
              </div>
              <div className="flex items-start gap-2 bg-white/60 p-3 rounded-lg border border-orange-100">
                <span className="font-extrabold text-orange-600 text-sm">03</span>
                <p>
                  <strong>Read the Index Carefully:</strong> A high Pizza Party Index reflects strong Focus Hours and fast async collaboration — but its collaboration term is a shared GitHub-repo proxy, not an industry-specific measurement, so use the underlying Focus Hours / Meeting Overhead numbers for industry comparisons.
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
