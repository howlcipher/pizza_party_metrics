import React, { useState, useMemo } from 'react';
import { 
  Car, 
  DollarSign, 
  Clock, 
  Fuel, 
  PiggyBank, 
  TrendingDown, 
  Sparkles, 
  Calculator, 
  CheckCircle2, 
  MapPin, 
  ArrowRight,
  Info
} from 'lucide-react';
import TooltipInfo from '../TooltipInfo';
import { PizzaData } from '../../types';

interface CommuterCostCardProps {
  data?: PizzaData[];
  selectedWorkSetup?: string;
}

// Preset setup mappings for days in office per week
const SETUP_DAYS_MAP: Record<string, { days: number; label: string; description: string }> = {
  'Remote-First': { days: 0, label: 'Remote-First', description: '0 office days/week' },
  'Hybrid': { days: 2.5, label: 'Hybrid', description: '2.5 office days/week (average)' },
  'Onsite-Heavy': { days: 5, label: 'Onsite-Heavy', description: '5 office days/week' },
};

const CommuterCostCard: React.FC<CommuterCostCardProps> = ({ 
  data = [], 
  selectedWorkSetup = '' 
}) => {
  // Customizable calculation state
  const [commuteTimeMinutes, setCommuteTimeMinutes] = useState<number>(30);
  const [mileageRate, setMileageRate] = useState<number>(0.67); // IRS standard mileage rate ($0.67/mile)
  const [averageSpeedMph] = useState<number>(30); // 30 mph average speed assumption
  const [showCalculator, setShowCalculator] = useState<boolean>(false);

  // Compute average days in office across current dataset when no specific filter is active
  const averageDaysFromData = useMemo(() => {
    if (!data || data.length === 0) return 2.5;
    const totalDays = data.reduce((sum, item) => {
      const cat = item.work_setup_category || 'Hybrid';
      const days = SETUP_DAYS_MAP[cat]?.days ?? 2.5;
      return sum + days;
    }, 0);
    return Math.round((totalDays / data.length) * 10) / 10;
  }, [data]);

  // Determine active days per week based on selection or aggregated dataset
  const activeDaysPerWeek = useMemo(() => {
    if (selectedWorkSetup && SETUP_DAYS_MAP[selectedWorkSetup]) {
      return SETUP_DAYS_MAP[selectedWorkSetup].days;
    }
    return averageDaysFromData;
  }, [selectedWorkSetup, averageDaysFromData]);

  // Financial calculations
  // 1. One-way distance in miles (Speed * Time)
  const oneWayDistanceMiles = (averageSpeedMph * commuteTimeMinutes) / 60; // 30mph * 30m / 60 = 15 miles
  
  // 2. Round-trip distance per office day
  const dailyDistanceMiles = oneWayDistanceMiles * 2; // 15 * 2 = 30 miles/day

  // 3. Daily vehicle wear cost
  const dailyWearCost = dailyDistanceMiles * mileageRate; // 30 * $0.67 = $20.10

  // 4. Annual cost (50 work weeks per year)
  const weeksPerYear = 50;
  const annualCost = dailyWearCost * activeDaysPerWeek * weeksPerYear;

  // 5. Max potential annual cost (5 days/week Onsite baseline)
  const maxOnsiteAnnualCost = dailyWearCost * 5 * weeksPerYear; // $5,025

  // 6. Annual remote savings compared to 5-day Onsite
  const annualSavingsVsOnsite = maxOnsiteAnnualCost - annualCost;

  // 7. 5-Year cumulative impact
  const fiveYearSavings = annualSavingsVsOnsite * 5;

  // 8. Pizza party equivalent ($20 per corporate pizza)
  const pizzaPartyCost = 20;
  const equivalentPizzaParties = Math.round(annualCost / pizzaPartyCost);

  // Breakdown for all three setups for comparative analysis
  const setupBreakdowns = useMemo(() => {
    return Object.entries(SETUP_DAYS_MAP).map(([key, config]) => {
      const setupAnnualCost = dailyWearCost * config.days * weeksPerYear;
      const setupSavings = maxOnsiteAnnualCost - setupAnnualCost;
      const isSelected = selectedWorkSetup ? selectedWorkSetup === key : false;

      return {
        key,
        label: config.label,
        days: config.days,
        description: config.description,
        dailyCost: dailyWearCost * (config.days > 0 ? 1 : 0),
        annualCost: setupAnnualCost,
        savingsVsOnsite: setupSavings,
        isSelected
      };
    });
  }, [dailyWearCost, maxOnsiteAnnualCost, selectedWorkSetup]);

  return (
    <div className="pizza-card p-5 lg:p-6 transition-all flex flex-col h-full relative overflow-hidden">
      {/* Background Decorative Accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 pizza-divider">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <Car className="w-6 h-6" />
            </div>
            <h3 className="pizza-card-title text-xl font-extrabold text-[var(--card-text)] flex items-center">
              Commuter Cost &amp; Vehicle Wear Analysis
              <TooltipInfo content={
                <div className="space-y-2 text-xs">
                  <p className="font-bold text-sm text-emerald-300">Vehicle Wear Financial Math:</p>
                  <p>
                    <strong>1. Distance per Commute:</strong> 30 min at 30 mph = 15 miles one-way (30 miles round-trip).
                  </p>
                  <p>
                    <strong>2. Daily Wear Cost:</strong> 30 miles × $0.67/mi (IRS Standard Rate) = $20.10/day.
                  </p>
                  <p>
                    <strong>3. Annualized Projection:</strong> Daily Cost × Days in Office/Week × 50 Weeks/Year.
                  </p>
                  <p className="text-gray-300 pt-1 border-t border-gray-700">
                    Demonstrates how remote-first setups eliminate hidden financial penalties for workers.
                  </p>
                </div>
              } />
            </h3>
          </div>
          <p className="text-sm text-[var(--card-subtext)] mt-1">
            Calculates daily vehicle degradation &amp; gas expenses projected annually per work setup.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {selectedWorkSetup && (
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Filtered: {selectedWorkSetup} ({SETUP_DAYS_MAP[selectedWorkSetup]?.days ?? 0} days/wk)
            </span>
          )}
          <button
            onClick={() => setShowCalculator(!showCalculator)}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 border ${
              showCalculator
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
            }`}
            aria-label="Toggle custom calculator settings"
          >
            <Calculator className="w-4 h-4" />
            {showCalculator ? 'Hide Settings' : 'Customize Model'}
          </button>
        </div>
      </div>

      {/* Interactive Calculator Drawer */}
      {showCalculator && (
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 transition-all">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-emerald-500" />
              Adjust Mileage &amp; Commute Parameters
            </h4>
            <span className="text-xs text-slate-500">
              Assumes 30 mph average city/highway speed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="commute-time-input" className="block text-xs font-medium text-slate-600 mb-1">
                One-Way Commute Duration
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="commute-time-input"
                  type="range"
                  min="10"
                  max="90"
                  step="5"
                  value={commuteTimeMinutes}
                  onChange={(e) => setCommuteTimeMinutes(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <span className="text-xs font-mono font-bold w-16 px-2 py-1 bg-white border rounded text-center">
                  {commuteTimeMinutes} min
                </span>
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                = {oneWayDistanceMiles.toFixed(1)} miles one-way ({dailyDistanceMiles.toFixed(0)} mi/day)
              </span>
            </div>

            <div>
              <label htmlFor="mileage-rate-select" className="block text-xs font-medium text-slate-600 mb-1">
                IRS / AAA Mileage Rate ($/mile)
              </label>
              <select
                id="mileage-rate-select"
                value={mileageRate}
                onChange={(e) => setMileageRate(Number(e.target.value))}
                className="w-full p-2 text-xs rounded border border-slate-300 bg-white text-slate-800 font-medium"
              >
                <option value={0.67}>$0.67 / mile (2024 IRS Standard Rate)</option>
                <option value={0.72}>$0.72 / mile (AAA Full SUV Average)</option>
                <option value={0.58}>$0.58 / mile (Compact / EV Average)</option>
                <option value={0.80}>$0.80 / mile (Heavy Vehicle / Truck)</option>
              </select>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Includes gas, depreciation, wear &amp; insurance
              </span>
            </div>

            <div className="sm:col-span-2 lg:col-span-1 flex items-end">
              <button
                onClick={() => {
                  setCommuteTimeMinutes(30);
                  setMileageRate(0.67);
                }}
                className="w-full py-2 px-3 text-xs font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 rounded transition-colors"
              >
                Reset to Standard Defaults
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
        {/* Card 1: Daily Wear Cost */}
        <div className="bg-white/80 border border-gray-200 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-600" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              Daily Office Cost
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">
              Per Office Day
            </span>
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-extrabold text-gray-900 font-mono">
              ${(dailyDistanceMiles * mileageRate).toFixed(2)}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {dailyDistanceMiles.toFixed(0)} miles round-trip @ ${mileageRate}/mi
            </p>
          </div>
        </div>

        {/* Card 2: Projected Annual Cost */}
        <div className="bg-white/80 border border-gray-200 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className={`absolute top-0 left-0 right-0 h-1 ${
            annualCost === 0 ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-rose-400 to-red-600'
          }`} />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-rose-500" />
              Projected Annual Cost
            </span>
            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
              annualCost === 0 
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-rose-50 text-rose-700'
            }`}>
              {activeDaysPerWeek} days/wk (50 wks)
            </span>
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-extrabold text-gray-900 font-mono">
              ${annualCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {annualCost === 0 ? 'Zero financial commute penalty!' : 'Out-of-pocket vehicle & fuel burden'}
            </p>
          </div>
        </div>

        {/* Card 3: Annual Remote Savings */}
        <div className="bg-white/80 border border-gray-200 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-green-600" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <PiggyBank className="w-3.5 h-3.5 text-emerald-500" />
              Remote Savings / Yr
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              vs 5-Day Onsite
            </span>
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-extrabold text-emerald-600 font-mono">
              +${annualSavingsVsOnsite.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {activeDaysPerWeek === 0 ? '100% full remote savings' : `Saved vs 5-day commute ($${maxOnsiteAnnualCost.toFixed(0)}/yr)`}
            </p>
          </div>
        </div>

        {/* Card 4: Pizza Equivalent Morale Stat */}
        <div className="bg-white/80 border border-gray-200 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Fuel className="w-3.5 h-3.5 text-amber-500" />
              Pizza Party Equivalent
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold">
              $20 / Pizza Box
            </span>
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-extrabold text-amber-600 font-mono">
              🍕 {equivalentPizzaParties} Boxes
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Annual commute cost equals {equivalentPizzaParties} large pizzas per worker!
            </p>
          </div>
        </div>
      </div>

      {/* Comparative Setup Breakdown Bars */}
      <div className="mt-6 bg-slate-50/70 border border-slate-200/80 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-500" />
            Comparative Financial Breakdown by Work Setup
          </h4>
          <span className="text-xs text-gray-500">
            Based on 50 work weeks @ ${mileageRate}/mile ({commuteTimeMinutes} min commute)
          </span>
        </div>

        <div className="space-y-4">
          {setupBreakdowns.map((setup) => {
            const percentageOfMax = maxOnsiteAnnualCost > 0 ? (setup.annualCost / maxOnsiteAnnualCost) * 100 : 0;
            const barColor = 
              setup.days === 0 ? 'bg-emerald-500' :
              setup.days <= 3 ? 'bg-amber-500' : 'bg-rose-500';

            return (
              <div 
                key={setup.key} 
                className={`p-3.5 rounded-lg border transition-all ${
                  setup.isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm ring-1 ring-emerald-500/30'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${barColor}`} />
                    <span className="text-sm font-bold text-gray-900">
                      {setup.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({setup.description})
                    </span>
                    {setup.isSelected && (
                      <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-600 text-white rounded">
                        Active Filter
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-gray-500">
                      ${setup.dailyCost.toFixed(2)}/day
                    </span>
                    <span className="font-bold text-gray-900 text-sm">
                      ${setup.annualCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/yr
                    </span>
                    <span className={`font-bold ${setup.savingsVsOnsite > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                      (Save ${setup.savingsVsOnsite.toLocaleString('en-US', { maximumFractionDigits: 0 })})
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden flex">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.max(percentageOfMax, setup.days === 0 ? 0 : 4)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* 5-Year Macro Impact Summary */}
        <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>
              <strong>Macro Impact:</strong> Switching from 5-day Onsite to Remote-First saves an employee <strong>${fiveYearSavings.toLocaleString('en-US', { maximumFractionDigits: 0 })}</strong> over 5 years in pure vehicle wear and fuel costs.
            </span>
          </div>
          <div className="flex items-center gap-1 text-emerald-600 font-bold self-end md:self-auto">
            <span>Direct Remote Benefit</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommuterCostCard;
