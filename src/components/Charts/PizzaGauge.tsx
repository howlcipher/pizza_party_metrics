import { PizzaData } from "../../types";
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
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

const PizzaGauge = ({ data }: { data: PizzaData[] }) => {
  const { bestScore, bestSetup, maxObserved } = useMemo(() => {
    let topScore = 0;
    let topSetup = "No Data";
    let observedMax = 0;

    if (data && data.length > 0) {
      const setupScores: Record<string, { total: number, count: number }> = {};
      for (let i = 0; i < data.length; i++) {
        const cat = data[i].work_setup_category;
        if (!setupScores[cat]) {
          setupScores[cat] = { total: 0, count: 0 };
        }
        setupScores[cat].total += data[i].pizza_party_index;
        setupScores[cat].count += 1;
        observedMax = Math.max(observedMax, data[i].pizza_party_index);
      }

      for (const [setup, stats] of Object.entries(setupScores)) {
        const avg = stats.total / stats.count;
        if (avg > topScore) {
          topScore = avg;
          topSetup = setup;
        }
      }
    }

    return { bestScore: topScore, bestSetup: topSetup, maxObserved: observedMax };
  }, [data]);

  // The Index's scale isn't fixed: its collaboration-score term is refetched
  // periodically from live GitHub PR/review data and can shift the whole
  // range between ETL runs. Calibrate the gauge to the data actually loaded
  // instead of a hardcoded ceiling, so it can't silently pin at 100%.
  const maxIndex = Math.max(maxObserved * 1.05, 1);
  const normalizedValue = Math.min(bestScore, maxIndex);
  const remainingValue = maxIndex - normalizedValue;

  const gaugeData = [
    { name: 'Pizza Party Index', value: normalizedValue },
    { name: 'Remaining', value: remainingValue }
  ];

  const COLORS = ['var(--chart-primary)', 'var(--chart-secondary)']; // Green (good performance) and dough color

  // Determine environment optimization based on score, relative to the
  // observed range rather than an absolute number that can drift.
  const scoreRatio = maxIndex > 0 ? bestScore / maxIndex : 0;
  let optimizationLabel = `Best: ${bestSetup}`;
  let optimizationColor = "text-yellow-600";
  if (scoreRatio >= 0.75) {
    optimizationColor = "text-green-700";
  } else if (scoreRatio < 0.55 && bestScore > 0) {
    optimizationColor = "text-red-600";
  }

  const renderCustomNeedle = () => {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-20">
        <span className="text-5xl font-extrabold text-gray-800 drop-shadow-md">{bestScore.toFixed(1)}</span>
        <span className="text-sm font-extrabold text-gray-500 uppercase mt-1">Top Score</span>
        <span className={`text-xs font-bold mt-2 px-3 py-1 bg-white border border-gray-200 rounded-full shadow-sm ${optimizationColor}`}>
          {optimizationLabel}
        </span>
      </div>
    );
  };

  return (
    <div className="pizza-card p-5 h-full flex flex-col relative">
      <h3 className="pizza-card-title text-xl font-bold text-[var(--card-text)] mb-2 pizza-divider pb-2 flex items-center">
        The Pizza Party Index Gauge
        <TooltipInfo content={
          <div>
            <p className="font-bold mb-1">Pizza Party Index (PPI):</p>
            <p className="mb-1">A composite score of overall team performance and satisfaction.</p>
            <p className="text-xs text-gray-300"><strong>Formula:</strong> Focus Hours + (Collaboration Score × 2.0). Higher is better. The Collaboration Score is refreshed periodically from live GitHub PR/review data and can shift the Index's overall scale between updates, so the gauge is scaled to the current dataset rather than a fixed ceiling.</p>
          </div>
        } />
      </h3>
      <p className="text-sm text-[var(--card-subtext)] mb-4 font-bold">
        Displays the highest-scoring Work Setup for your filters. Higher scores = Better performance.
        <span className="block font-normal text-xs text-gray-500 mt-1">
          Formula: Focus Hours + (Collaboration Score × 2.0). Scale shown reflects the current dataset.
        </span>
      </p>

      <div className="flex-grow relative min-h-[200px]" role="figure" aria-label={`Pizza Party Index Gauge. Top score is ${bestScore.toFixed(1)} for ${bestSetup}.`}>
        <div style={srOnlyStyle}>
          This gauge displays the highest Pizza Party Index among work setups. The top score is {bestScore.toFixed(1)} for {bestSetup}.
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
              contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '2px solid #e3342f', color: '#333', fontWeight: 'bold' }}
              wrapperClassName="hidden md:block"
            />
          </PieChart>
        </ResponsiveContainer>
        {renderCustomNeedle()}
      </div>
    </div>
  );
};

export default PizzaGauge;

