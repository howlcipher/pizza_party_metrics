import React, { useState, useMemo, useEffect } from 'react';
import {
  Leaf,
  Trees,
  Car,
  Factory,
  Sparkles,
  Calculator,
  TrendingDown,
  Globe,
  Zap,
  CheckCircle2,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Award,
  RotateCcw,
  Bus,
  Fuel
} from 'lucide-react';
import TooltipInfo from '../TooltipInfo';
import { PizzaData } from '../../types';

interface CommuteCO2CardProps {
  data?: PizzaData[];
  selectedWorkSetup?: string;
}

// Preset setup mappings for days in office per week
const SETUP_DAYS_MAP: Record<string, { days: number; label: string; description: string }> = {
  'Remote-First': { days: 0, label: 'Remote-First', description: '0 office days/week' },
  'Hybrid': { days: 2.5, label: 'Hybrid', description: '2.5 office days/week (average)' },
  'Onsite-Heavy': { days: 5, label: 'Onsite-Heavy', description: '5 office days/week' },
};

// Vehicle efficiency & emissions profiles (CO2 kg per mile)
interface VehicleProfile {
  id: string;
  name: string;
  co2PerMileKg: number; // EPA average passenger car is 0.4 kg CO2/mi
  mpgLabel: string;
  description: string;
  icon: React.ElementType;
  badgeBg: string;
  badgeText: string;
}

const VEHICLE_PROFILES: Record<string, VehicleProfile> = {
  gas_avg: {
    id: 'gas_avg',
    name: 'Average Gas Car',
    co2PerMileKg: 0.40, // 400 grams per mile (EPA Standard)
    mpgLabel: '25 MPG',
    description: 'Standard gasoline passenger vehicle (~400g CO2/mile)',
    icon: Car,
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
  },
  gas_suv: {
    id: 'gas_suv',
    name: 'SUV / Light Truck',
    co2PerMileKg: 0.52,
    mpgLabel: '18 MPG',
    description: 'Larger gas vehicle or light truck (~520g CO2/mile)',
    icon: Fuel,
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-800',
  },
  hybrid: {
    id: 'hybrid',
    name: 'Hybrid Car',
    co2PerMileKg: 0.22,
    mpgLabel: '45 MPG',
    description: 'High-efficiency hybrid sedan (~220g CO2/mile)',
    icon: Leaf,
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
  },
  ev: {
    id: 'ev',
    name: 'Electric Vehicle (EV)',
    co2PerMileKg: 0.00,
    mpgLabel: '0 Direct CO2',
    description: 'Zero tailpipe emissions (100% electric drive)',
    icon: Zap,
    badgeBg: 'bg-cyan-100',
    badgeText: 'text-cyan-800',
  },
  transit: {
    id: 'transit',
    name: 'Public Transit / Bus',
    co2PerMileKg: 0.15,
    mpgLabel: 'Shared Commute',
    description: 'Public transit shared passenger emissions (~150g CO2/mile)',
    icon: Bus,
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800',
  }
};

const CommuteCO2Card: React.FC<CommuteCO2CardProps> = ({
  data = [],
  selectedWorkSetup = ''
}) => {
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

  // Active baseline days per week based on selection or aggregate data
  const defaultDaysPerWeek = useMemo(() => {
    if (selectedWorkSetup && SETUP_DAYS_MAP[selectedWorkSetup]) {
      return SETUP_DAYS_MAP[selectedWorkSetup].days;
    }
    return averageDaysFromData;
  }, [selectedWorkSetup, averageDaysFromData]);

  // Customizable state parameters
  const [distanceMiles, setDistanceMiles] = useState<number>(15); // One-way commute distance in miles
  const [daysPerWeek, setDaysPerWeek] = useState<number>(defaultDaysPerWeek); // Days in office
  const [weeksPerYear, setWeeksPerYear] = useState<number>(50); // Work weeks per year
  const [selectedVehicleKey, setSelectedVehicleKey] = useState<string>('gas_avg');
  const [showCalculator, setShowCalculator] = useState<boolean>(false);

  // Sync daysPerWeek when defaultDaysPerWeek changes due to external filter selection changes
  useEffect(() => {
    setDaysPerWeek(defaultDaysPerWeek);
  }, [defaultDaysPerWeek]);

  // Vehicle profile profile selected
  const activeVehicle = VEHICLE_PROFILES[selectedVehicleKey] || VEHICLE_PROFILES.gas_avg;

  // Environmental Math Calculations
  // 1. Round trip distance per office day (Miles)
  const roundTripMiles = distanceMiles * 2;

  // 2. Annual commute distance for current setup (Miles)
  const annualCommuteMiles = roundTripMiles * daysPerWeek * weeksPerYear;

  // 3. Total Annual CO2 Emitted (kg)
  const annualCO2Kg = annualCommuteMiles * activeVehicle.co2PerMileKg;
  const annualCO2MetricTons = annualCO2Kg / 1000;

  // 4. Baseline 5-Day Onsite schedule Annual CO2 Emitted (kg)
  const maxOnsiteAnnualMiles = roundTripMiles * 5 * weeksPerYear;
  const maxOnsiteAnnualCO2Kg = maxOnsiteAnnualMiles * activeVehicle.co2PerMileKg;

  // 5. Environmental Savings compared to 5-day Onsite schedule
  const annualCO2SavingsKg = maxOnsiteAnnualCO2Kg - annualCO2Kg;
  const annualCO2SavingsPercent = maxOnsiteAnnualCO2Kg > 0 
    ? Math.round((annualCO2SavingsKg / maxOnsiteAnnualCO2Kg) * 100)
    : 0;

  // 6. Equivalencies:
  // Mature tree absorbs ~22 kg (48 lbs) of CO2 per year
  const treesNeeded = Math.round(annualCO2Kg / 22);
  const treesSaved = Math.round(annualCO2SavingsKg / 22);

  // Equivalent gallons of gas consumed (1 gallon gas ≈ 8.887 kg CO2)
  const equivalentGallonsGas = Math.round(annualCO2Kg / 8.887);

  // Breakdown for all three standard work setups for comparative analysis
  const setupBreakdowns = useMemo(() => {
    return Object.entries(SETUP_DAYS_MAP).map(([key, config]) => {
      const miles = roundTripMiles * config.days * weeksPerYear;
      const co2Kg = miles * activeVehicle.co2PerMileKg;
      const co2Savings = maxOnsiteAnnualCO2Kg - co2Kg;
      const trees = Math.round(co2Kg / 22);
      const isSelected = selectedWorkSetup ? selectedWorkSetup === key : false;

      return {
        key,
        label: config.label,
        days: config.days,
        description: config.description,
        annualMiles: miles,
        annualCO2Kg: co2Kg,
        annualCO2MetricTons: co2Kg / 1000,
        co2SavingsKg: co2Savings,
        treesNeeded: trees,
        isSelected
      };
    });
  }, [roundTripMiles, weeksPerYear, activeVehicle.co2PerMileKg, maxOnsiteAnnualCO2Kg, selectedWorkSetup]);

  return (
    <div className="pizza-card p-5 lg:p-6 transition-all flex flex-col h-full relative overflow-hidden">
      {/* Background Decorative Accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 pizza-divider">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <Leaf className="w-6 h-6" />
            </div>
            <h3 className="pizza-card-title text-xl font-extrabold text-[var(--card-text)] flex items-center">
              Commute CO₂ &amp; Corporate ESG Impact Analysis
              <TooltipInfo content={
                <div className="space-y-2 text-xs">
                  <p className="font-bold text-sm text-emerald-300">EPA Environmental Math Standard:</p>
                  <p>
                    <strong>1. Annual Commute Distance:</strong> Round Trip Miles ({roundTripMiles} mi) × Days in Office/Wk ({daysPerWeek} d) × {weeksPerYear} Wks/Yr = {annualCommuteMiles.toLocaleString()} miles.
                  </p>
                  <p>
                    <strong>2. CO₂ Output Formula:</strong> Distance × Vehicle CO₂ per Mile ({activeVehicle.co2PerMileKg} kg/mi for {activeVehicle.name}).
                  </p>
                  <p>
                    <strong>3. Offset Equivalency:</strong> A mature tree absorbs ~22 kg (48 lbs) of CO₂ per year (EPA guideline).
                  </p>
                  <p className="text-gray-300 pt-1 border-t border-gray-700">
                    Connects hybrid and remote work policies directly to corporate sustainability and ESG targets.
                  </p>
                </div>
              } />
            </h3>
          </div>
          <p className="text-sm text-[var(--card-subtext)] mt-1">
            Tracks estimated carbon emissions from commuting and calculates tree offsets to support corporate ESG goals.
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
            aria-label="Toggle custom environmental calculator settings"
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
              Adjust Commute &amp; Vehicle Sustainability Parameters
            </h4>
            <button
              onClick={() => {
                setDistanceMiles(15);
                setDaysPerWeek(defaultDaysPerWeek);
                setWeeksPerYear(50);
                setSelectedVehicleKey('gas_avg');
              }}
              className="text-xs text-emerald-600 hover:underline font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset Defaults
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Slider 1: One-way distance */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="co2-distance-input" className="text-xs font-medium text-slate-600">
                  One-Way Commute Distance
                </label>
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-white border rounded text-emerald-600">
                  {distanceMiles} mi
                </span>
              </div>
              <input
                id="co2-distance-input"
                type="range"
                min="1"
                max="80"
                step="1"
                value={distanceMiles}
                onChange={(e) => setDistanceMiles(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Round Trip: {roundTripMiles} miles / day
              </span>
            </div>

            {/* Slider 2: Office Days per Week */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="co2-days-input" className="text-xs font-medium text-slate-600">
                  Office Days / Week
                </label>
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-white border rounded text-emerald-600">
                  {daysPerWeek} days
                </span>
              </div>
              <input
                id="co2-days-input"
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Default: {defaultDaysPerWeek} days/wk
              </span>
            </div>

            {/* Slider 3: Weeks per Year */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="co2-weeks-input" className="text-xs font-medium text-slate-600">
                  Work Weeks / Year
                </label>
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-white border rounded text-emerald-600">
                  {weeksPerYear} wks
                </span>
              </div>
              <input
                id="co2-weeks-input"
                type="range"
                min="10"
                max="52"
                step="1"
                value={weeksPerYear}
                onChange={(e) => setWeeksPerYear(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Accounts for holidays &amp; PTO
              </span>
            </div>

            {/* Dropdown: Vehicle Fuel Efficiency & Mode */}
            <div>
              <label htmlFor="co2-vehicle-select" className="block text-xs font-medium text-slate-600 mb-1">
                Vehicle Mode &amp; Fuel Efficiency
              </label>
              <select
                id="co2-vehicle-select"
                value={selectedVehicleKey}
                onChange={(e) => setSelectedVehicleKey(e.target.value)}
                className="w-full p-2 text-xs rounded border border-slate-300 bg-white text-slate-800 font-medium"
              >
                {Object.values(VEHICLE_PROFILES).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.mpgLabel})
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-500 mt-0.5 block truncate">
                {activeVehicle.description}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
        {/* Card 1: Annual CO2 Emitted */}
        <div className="bg-white/80 border border-gray-200 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Factory className="w-3.5 h-3.5 text-emerald-500" />
              Annual CO₂ Emitted
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${activeVehicle.badgeBg} ${activeVehicle.badgeText}`}>
              {activeVehicle.mpgLabel}
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-gray-900 tracking-tight">
                {annualCO2Kg.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-sm font-bold text-gray-500">kg CO₂/yr</span>
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <span>≈ <strong>{annualCO2MetricTons.toFixed(2)}</strong> Metric Tons</span>
              <span className="text-gray-400">•</span>
              <span><strong>{annualCommuteMiles.toLocaleString()}</strong> miles</span>
            </p>
          </div>
        </div>

        {/* Card 2: Trees Needed to Offset */}
        <div className="bg-white/80 border border-gray-200 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-600" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Trees className="w-3.5 h-3.5 text-green-500" />
              Trees to Offset Emissions
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-green-100 text-green-800">
              22 kg/tree/yr
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-600 tracking-tight">
                {treesNeeded.toLocaleString()}
              </span>
              <span className="text-sm font-bold text-gray-500">mature trees</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Number of mature trees required to absorb this annual commute CO₂.
            </p>
          </div>
        </div>

        {/* Card 3: CO2 Savings vs 5-Day Onsite */}
        <div className="bg-white/80 border border-gray-200 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 to-cyan-500" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-teal-500" />
              Savings vs 5-Day Onsite
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-teal-100 text-teal-800">
              -{annualCO2SavingsPercent}% CO₂
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-teal-600 tracking-tight">
                {annualCO2SavingsKg > 0 ? `${annualCO2SavingsKg.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '0'}
              </span>
              <span className="text-sm font-bold text-gray-500">kg saved/yr</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Avoided emissions compared to full 5-day mandatory office attendance.
            </p>
          </div>
        </div>

        {/* Card 4: Trees Preserved Equivalent */}
        <div className="bg-white/80 border border-gray-200 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 to-lime-500" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-lime-500" />
              Trees Saved Equivalent
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-lime-100 text-lime-800">
              ESG Gain
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-lime-600 tracking-tight">
                +{treesSaved.toLocaleString()}
              </span>
              <span className="text-sm font-bold text-gray-500">trees saved/yr</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Equivalent to planting {treesSaved} trees per year or saving {equivalentGallonsGas} gal gas.
            </p>
          </div>
        </div>
      </div>

      {/* Comparative Breakdown Table across Work Setups */}
      <div className="mt-6">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          ESG Impact Comparison across Work Models ({distanceMiles} mi one-way)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {setupBreakdowns.map((setup) => {
            const isCurrent = daysPerWeek === setup.days;
            return (
              <div
                key={setup.key}
                className={`p-4 rounded-xl border transition-all relative ${
                  isCurrent
                    ? 'bg-emerald-500/10 border-emerald-500 shadow-md'
                    : 'bg-white/60 border-gray-200 hover:border-gray-300'
                }`}
              >
                {isCurrent && (
                  <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white flex items-center gap-1 shadow-sm">
                    <CheckCircle2 className="w-3 h-3" /> Selected Model
                  </span>
                )}

                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-extrabold text-sm text-gray-900">
                    {setup.label}
                  </h5>
                  <span className="text-xs font-mono font-bold text-gray-500">
                    {setup.days} days/wk
                  </span>
                </div>

                <p className="text-xs text-gray-500 mb-3">
                  {setup.description}
                </p>

                <div className="space-y-2 pt-2 border-t border-gray-200/80">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Annual CO₂ Emitted:</span>
                    <span className="font-bold text-gray-900 font-mono">
                      {setup.annualCO2Kg.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Trees to Offset:</span>
                    <span className="font-bold text-emerald-600 font-mono">
                      {setup.treesNeeded} trees
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Annual CO₂ Avoided:</span>
                    <span className={`font-bold font-mono ${setup.co2SavingsKg > 0 ? 'text-teal-600' : 'text-gray-400'}`}>
                      {setup.co2SavingsKg > 0 ? `-${Math.round(setup.co2SavingsKg).toLocaleString()} kg` : 'Baseline'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Corporate ESG & Environmental Takeaway Footer */}
      <div className="mt-5 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-full bg-emerald-500/20 text-emerald-600 shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <p className="text-xs text-emerald-900">
            <strong>ESG Strategic Insight:</strong> Transitioning from 5-day onsite to a <strong>{daysPerWeek}-day hybrid model</strong> reduces individual employee commute CO₂ emissions by <strong>{annualCO2SavingsPercent}%</strong>, offsetting <strong>{treesSaved} trees per employee each year</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CommuteCO2Card;
