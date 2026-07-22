import React, { useState, useMemo } from 'react';
import {
  Clock,
  Hourglass,
  Dumbbell,
  BookOpen,
  Utensils,
  Moon,
  Sparkles,
  Calculator,
  Calendar,
  Zap,
  Trees,
  Film,
  TrendingDown,
  CheckCircle2,
  MapPin,
  ArrowRight,
  Pizza,
  Layers,
  Heart,
  Award,
  Sliders
} from 'lucide-react';
import TooltipInfo from '../TooltipInfo';
import { PizzaData } from '../../types';

interface CommuteTimeCardProps {
  data?: PizzaData[];
  selectedWorkSetup?: string;
}

// Preset setup mappings for days in office per week
const SETUP_DAYS_MAP: Record<string, { days: number; label: string; description: string }> = {
  'Remote-First': { days: 0, label: 'Remote-First', description: '0 office days/week' },
  'Hybrid': { days: 2.5, label: 'Hybrid', description: '2.5 office days/week (avg)' },
  'Onsite-Heavy': { days: 5, label: 'Onsite-Heavy', description: '5 office days/week' },
};

interface OpportunityActivity {
  id: string;
  label: string;
  hoursPerUnit: number;
  unitName: string;
  icon: React.ElementType;
  gradient: string;
  borderColor: string;
  textColor: string;
  bgColor: string;
  badgeBg: string;
  category: 'Health & Wellness' | 'Personal Growth' | 'Family & Social' | 'Pizza & Leisure';
  description: string;
}

const ACTIVITIES: OpportunityActivity[] = [
  {
    id: 'workouts',
    label: 'Gym Workouts',
    hoursPerUnit: 1.5,
    unitName: 'workouts',
    icon: Dumbbell,
    gradient: 'from-amber-500 to-orange-600',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
    badgeBg: 'bg-amber-100 text-amber-800',
    category: 'Health & Wellness',
    description: '90-min strength & cardio fitness sessions'
  },
  {
    id: 'books',
    label: 'Books Read',
    hoursPerUnit: 5.0,
    unitName: 'books',
    icon: BookOpen,
    gradient: 'from-blue-500 to-indigo-600',
    borderColor: 'border-indigo-500/30',
    textColor: 'text-indigo-600',
    bgColor: 'bg-indigo-500/10',
    badgeBg: 'bg-indigo-100 text-indigo-800',
    category: 'Personal Growth',
    description: 'Complete 250-page books read cover to cover'
  },
  {
    id: 'dinners',
    label: 'Family Dinners',
    hoursPerUnit: 2.0,
    unitName: 'dinners',
    icon: Utensils,
    gradient: 'from-rose-500 to-pink-600',
    borderColor: 'border-rose-500/30',
    textColor: 'text-rose-600',
    bgColor: 'bg-rose-500/10',
    badgeBg: 'bg-rose-100 text-rose-800',
    category: 'Family & Social',
    description: 'Quality 2-hour cooked family meals & conversations'
  },
  {
    id: 'pizza',
    label: 'Pizza Feasts',
    hoursPerUnit: 3.0,
    unitName: 'pizza nights',
    icon: Pizza,
    gradient: 'from-red-500 to-emerald-600',
    borderColor: 'border-emerald-500/30',
    textColor: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
    badgeBg: 'bg-emerald-100 text-emerald-800',
    category: 'Pizza & Leisure',
    description: 'Slow dough proofing & gourmet pizza party nights'
  },
  {
    id: 'sleep',
    label: 'Restorative Sleep',
    hoursPerUnit: 8.0,
    unitName: 'full nights',
    icon: Moon,
    gradient: 'from-purple-500 to-violet-600',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-600',
    bgColor: 'bg-purple-500/10',
    badgeBg: 'bg-purple-100 text-purple-800',
    category: 'Health & Wellness',
    description: 'Full 8-hour deep sleep cycles recovered'
  },
  {
    id: 'skills',
    label: 'Skills Mastered',
    hoursPerUnit: 20.0,
    unitName: 'skills',
    icon: Zap,
    gradient: 'from-cyan-500 to-blue-600',
    borderColor: 'border-cyan-500/30',
    textColor: 'text-cyan-600',
    bgColor: 'bg-cyan-500/10',
    badgeBg: 'bg-cyan-100 text-cyan-800',
    category: 'Personal Growth',
    description: '20-hr deliberate practice milestones (coding, music)'
  },
  {
    id: 'hikes',
    label: 'Nature Hikes',
    hoursPerUnit: 2.5,
    unitName: 'hikes',
    icon: Trees,
    gradient: 'from-teal-500 to-emerald-600',
    borderColor: 'border-teal-500/30',
    textColor: 'text-teal-600',
    bgColor: 'bg-teal-500/10',
    badgeBg: 'bg-teal-100 text-teal-800',
    category: 'Health & Wellness',
    description: 'Energizing 2.5-hour outdoor trail hikes in fresh air'
  },
  {
    id: 'movies',
    label: 'Movies & Cinema',
    hoursPerUnit: 2.0,
    unitName: 'films',
    icon: Film,
    gradient: 'from-amber-400 to-yellow-600',
    borderColor: 'border-yellow-500/30',
    textColor: 'text-yellow-600',
    bgColor: 'bg-yellow-500/10',
    badgeBg: 'bg-yellow-100 text-yellow-800',
    category: 'Pizza & Leisure',
    description: '2-hour feature films or docuseries watch parties'
  }
];

const CommuteTimeCard: React.FC<CommuteTimeCardProps> = ({
  data = [],
  selectedWorkSetup = ''
}) => {
  // Customization state
  const [commuteTimeMinutes, setCommuteTimeMinutes] = useState<number>(30); // 30 mins one-way
  const [customDaysOverride, setCustomDaysOverride] = useState<number | null>(null);
  const [weeksPerYear, setWeeksPerYear] = useState<number>(50);
  const [showCalculator, setShowCalculator] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Calculate average office days across current dataset when no specific filter is active
  const averageDaysFromData = useMemo(() => {
    if (!data || data.length === 0) return 2.5;
    const totalDays = data.reduce((sum, item) => {
      const cat = item.work_setup_category || 'Hybrid';
      const days = SETUP_DAYS_MAP[cat]?.days ?? 2.5;
      return sum + days;
    }, 0);
    return Math.round((totalDays / data.length) * 10) / 10;
  }, [data]);

  // Determine active days per week based on filter selection, manual slider override, or aggregated dataset
  const activeDaysPerWeek = useMemo(() => {
    if (customDaysOverride !== null) {
      return customDaysOverride;
    }
    if (selectedWorkSetup && SETUP_DAYS_MAP[selectedWorkSetup]) {
      return SETUP_DAYS_MAP[selectedWorkSetup].days;
    }
    return averageDaysFromData;
  }, [customDaysOverride, selectedWorkSetup, averageDaysFromData]);

  // Commute Time Calculations
  const roundTripMinutes = commuteTimeMinutes * 2;
  const dailyCommuteHours = roundTripMinutes / 60;
  const weeklyCommuteHours = dailyCommuteHours * activeDaysPerWeek;
  const annualCommuteHours = weeklyCommuteHours * weeksPerYear;

  // Life equivalencies
  const annualCommuteDays = Math.round((annualCommuteHours / 24) * 10) / 10;
  const equivalentWorkWeeks = Math.round((annualCommuteHours / 40) * 10) / 10;
  const fiveYearCommuteHours = annualCommuteHours * 5;

  // Baseline comparing to 5-day Onsite Heavy
  const maxOnsiteAnnualHours = (roundTripMinutes / 60) * 5 * weeksPerYear;
  const annualHoursSavedVsOnsite = maxOnsiteAnnualHours - annualCommuteHours;

  // Filtered activity list
  const filteredActivities = useMemo(() => {
    if (selectedCategory === 'All') return ACTIVITIES;
    return ACTIVITIES.filter(act => act.category === selectedCategory);
  }, [selectedCategory]);

  // Setup comparative breakdown
  const setupBreakdowns = useMemo(() => {
    return Object.entries(SETUP_DAYS_MAP).map(([key, config]) => {
      const setupAnnualHours = dailyCommuteHours * config.days * weeksPerYear;
      const setupHoursSaved = maxOnsiteAnnualHours - setupAnnualHours;
      const isSelected = selectedWorkSetup ? selectedWorkSetup === key : activeDaysPerWeek === config.days;

      // Calculate sample activity yields for workouts (1.5h) & books (5h)
      const workoutsYield = Math.floor(setupAnnualHours / 1.5);
      const booksYield = Math.floor(setupAnnualHours / 5.0);
      const dinnersYield = Math.floor(setupAnnualHours / 2.0);

      return {
        key,
        label: config.label,
        days: config.days,
        description: config.description,
        annualHours: setupAnnualHours,
        hoursSavedVsOnsite: setupHoursSaved,
        workoutsYield,
        booksYield,
        dinnersYield,
        isSelected
      };
    });
  }, [dailyCommuteHours, maxOnsiteAnnualHours, selectedWorkSetup, activeDaysPerWeek, weeksPerYear]);

  return (
    <div className="pizza-card p-5 lg:p-6 transition-all flex flex-col h-full relative overflow-hidden">
      {/* Background Decorative Ambient Glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 pizza-divider relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
              <Hourglass className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="pizza-card-title text-xl font-extrabold text-[var(--card-text)] flex items-center">
              Commute Time Opportunity Cost
              <TooltipInfo content={
                <div className="space-y-2 text-xs">
                  <p className="font-bold text-sm text-amber-300">Opportunity Cost Math:</p>
                  <p>
                    <strong>1. Annual Commute Hours:</strong> (One-way min × 2 ÷ 60) × Days in Office/wk × Weeks/yr.
                  </p>
                  <p>
                    <strong>2. Time Equivalencies:</strong> 150 hours = 100 workouts (1.5h each), 30 books read (5h each), or 75 family dinners (2h each).
                  </p>
                  <p className="text-gray-300 pt-1 border-t border-gray-700">
                    Highlights how remote &amp; hybrid work restores precious life hours for health, family, and hobbies.
                  </p>
                </div>
              } />
            </h3>
          </div>
          <p className="text-sm text-[var(--card-subtext)] mt-1">
            Quantifies annual hours locked in transit &amp; contrasts them against real-world life activities.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {selectedWorkSetup && (
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/15 text-amber-700 border border-amber-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {selectedWorkSetup} ({SETUP_DAYS_MAP[selectedWorkSetup]?.days ?? 0} d/wk)
            </span>
          )}
          <button
            onClick={() => setShowCalculator(!showCalculator)}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
              showCalculator
                ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
            }`}
            aria-label="Toggle commute parameters customizer"
          >
            <Sliders className="w-4 h-4" />
            {showCalculator ? 'Hide Customizer' : 'Adjust Commute'}
          </button>
        </div>
      </div>

      {/* Interactive Customizer Drawer */}
      {showCalculator && (
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 transition-all relative z-10">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-amber-500" />
              Adjust Commute Duration &amp; Office Frequency
            </h4>
            <button
              onClick={() => {
                setCommuteTimeMinutes(30);
                setCustomDaysOverride(null);
                setWeeksPerYear(50);
              }}
              className="text-xs text-amber-600 hover:underline font-semibold"
            >
              Reset to Defaults
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Slider 1: One-Way Commute Time */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="commute-mins-input" className="text-xs font-medium text-slate-600">
                  One-Way Commute
                </label>
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-white border rounded text-amber-600">
                  {commuteTimeMinutes} min
                </span>
              </div>
              <input
                id="commute-mins-input"
                type="range"
                min="10"
                max="90"
                step="5"
                value={commuteTimeMinutes}
                onChange={(e) => setCommuteTimeMinutes(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                = {roundTripMinutes} min round-trip ({dailyCommuteHours.toFixed(1)} hrs/day)
              </span>
            </div>

            {/* Slider 2: Office Days per Week */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="office-days-input" className="text-xs font-medium text-slate-600">
                  Office Days / Week
                </label>
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-white border rounded text-amber-600">
                  {activeDaysPerWeek} days
                </span>
              </div>
              <input
                id="office-days-input"
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={activeDaysPerWeek}
                onChange={(e) => setCustomDaysOverride(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {activeDaysPerWeek === 0 ? 'Full Remote' : activeDaysPerWeek === 5 ? 'Full Onsite' : 'Hybrid Model'}
              </span>
            </div>

            {/* Slider 3: Work Weeks per Year */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="work-weeks-input" className="text-xs font-medium text-slate-600">
                  Work Weeks / Year
                </label>
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-white border rounded text-amber-600">
                  {weeksPerYear} weeks
                </span>
              </div>
              <input
                id="work-weeks-input"
                type="range"
                min="40"
                max="52"
                step="1"
                value={weeksPerYear}
                onChange={(e) => setWeeksPerYear(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Accounts for PTO &amp; holidays
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Primary Summary Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5 relative z-10">
        {/* KPI 1: Annual Commute Hours */}
        <div className="bg-white/80 border border-gray-200 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-600" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              Annual Transit Time
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold">
              {activeDaysPerWeek} d/wk
            </span>
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-extrabold text-gray-900 font-mono">
              {Math.round(annualCommuteHours)} <span className="text-lg text-gray-500 font-sans font-medium">hrs/yr</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {weeklyCommuteHours.toFixed(1)} hours spent in a vehicle every week
            </p>
          </div>
        </div>

        {/* KPI 2: Consecutive Days Lost */}
        <div className="bg-white/80 border border-gray-200 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 to-pink-600" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-rose-500" />
              Full Days Lost
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold">
              24-Hr Blocks
            </span>
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-extrabold text-gray-900 font-mono">
              {annualCommuteDays} <span className="text-lg text-gray-500 font-sans font-medium">days</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Equivalent to {annualCommuteDays} full 24-hour days sitting in traffic
            </p>
          </div>
        </div>

        {/* KPI 3: Equivalent Workweeks */}
        <div className="bg-white/80 border border-gray-200 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 to-purple-600" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              Workweeks Lost
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold">
              40-Hr Base
            </span>
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-extrabold text-gray-900 font-mono">
              {equivalentWorkWeeks} <span className="text-lg text-gray-500 font-sans font-medium">weeks</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Equal to working almost {equivalentWorkWeeks} extra unpaid full-time weeks!
            </p>
          </div>
        </div>

        {/* KPI 4: Remote Hours Saved vs 5-Day Onsite */}
        <div className="bg-white/80 border border-gray-200 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Hours Saved / Yr
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              vs 5-Day Onsite
            </span>
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-extrabold text-emerald-600 font-mono">
              +{Math.round(annualHoursSavedVsOnsite)} <span className="text-lg font-sans font-medium">hrs</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {activeDaysPerWeek === 0
                ? '100% full remote commute hours reclaimed!'
                : `Reclaimed vs 5-day commute (${Math.round(maxOnsiteAnnualHours)} total hrs)`}
            </p>
          </div>
        </div>
      </div>

      {/* Alternative Activities Section */}
      <div className="mt-6 bg-slate-50/70 border border-slate-200/80 rounded-xl p-5 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-200">
          <div>
            <h4 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              What Else Could You Do With {Math.round(annualCommuteHours)} Hours/Year?
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Contrasting vehicle transit time against life-enriching personal activities &amp; hobbies.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {['All', 'Health & Wellness', 'Personal Growth', 'Family & Social', 'Pizza & Leisure'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Activity Icon Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredActivities.map((act) => {
            const count = Math.floor(annualCommuteHours / act.hoursPerUnit);
            const totalActivityHoursNeeded = count * act.hoursPerUnit;
            const percentageOfTotal = annualCommuteHours > 0 ? Math.min(100, Math.round((totalActivityHoursNeeded / annualCommuteHours) * 100)) : 0;
            const Icon = act.icon;

            return (
              <div
                key={act.id}
                className={`bg-white border ${act.borderColor} rounded-xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all relative overflow-hidden group`}
              >
                {/* Top Accent Bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${act.gradient}`} />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-lg ${act.bgColor} ${act.textColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${act.badgeBg}`}>
                      {act.hoursPerUnit} hr / unit
                    </span>
                  </div>

                  <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {act.label}
                  </h5>

                  <div className="mt-1 flex items-baseline gap-2">
                    <span className={`text-3xl font-extrabold font-mono ${act.textColor}`}>
                      {count.toLocaleString()}
                    </span>
                    <span className="text-sm font-bold text-gray-700">
                      {act.unitName}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                    {act.description}
                  </p>
                </div>

                {/* Progress bar visual */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex justify-between items-center text-[11px] text-gray-500 mb-1 font-mono">
                    <span>Equivalence Yield</span>
                    <span className="font-bold text-slate-700">
                      {count * act.hoursPerUnit} / {Math.round(annualCommuteHours)} hrs
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${act.gradient} transition-all duration-500`}
                      style={{ width: `${annualCommuteHours > 0 ? 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Highlight Formula Banner */}
        <div className="mt-5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-full text-amber-600 shrink-0">
              <Pizza className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-amber-800">
                The Pizza Party Perspective:
              </span>{' '}
              <span>
                A standard {activeDaysPerWeek} day/week commute ({Math.round(annualCommuteHours)} hours/yr) is equal to doing{' '}
                <strong className="text-amber-700 font-mono">{Math.floor(annualCommuteHours / 1.5)} workouts</strong>,{' '}
                reading <strong className="text-amber-700 font-mono">{Math.floor(annualCommuteHours / 5.0)} books</strong>, or baking sourdough pizzas for{' '}
                <strong className="text-amber-700 font-mono">{Math.floor(annualCommuteHours / 3.0)} pizza parties</strong>!
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparative Setup Opportunity Cost Matrix */}
      <div className="mt-6 bg-slate-50/70 border border-slate-200/80 rounded-xl p-5 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-500" />
            Work Setup Opportunity Cost Comparison
          </h4>
          <span className="text-xs text-gray-500">
            Based on {commuteTimeMinutes} min one-way commute ({weeksPerYear} work weeks/yr)
          </span>
        </div>

        <div className="space-y-4">
          {setupBreakdowns.map((setup) => {
            const percentageOfMax = maxOnsiteAnnualHours > 0 ? (setup.annualHours / maxOnsiteAnnualHours) * 100 : 0;
            const barColor =
              setup.days === 0 ? 'bg-emerald-500' :
              setup.days <= 3 ? 'bg-amber-500' : 'bg-rose-500';

            return (
              <div
                key={setup.key}
                className={`p-4 rounded-xl border transition-all ${
                  setup.isSelected
                    ? 'bg-amber-500/10 border-amber-500/40 shadow-sm ring-1 ring-amber-500/30'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${barColor}`} />
                    <span className="text-sm font-bold text-gray-900">
                      {setup.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({setup.description})
                    </span>
                    {setup.isSelected && (
                      <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-amber-600 text-white rounded">
                        Active Model
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-gray-500">
                      {(dailyCommuteHours * setup.days).toFixed(1)} hrs/wk
                    </span>
                    <span className="font-bold text-gray-900 text-sm">
                      {Math.round(setup.annualHours)} hrs/yr lost
                    </span>
                    <span className={`font-bold ${setup.hoursSavedVsOnsite > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                      (+{Math.round(setup.hoursSavedVsOnsite)} hrs saved)
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.max(percentageOfMax, setup.days === 0 ? 0 : 5)}%` }}
                  />
                </div>

                {/* Equivalent Life Yield Tags */}
                <div className="flex flex-wrap items-center gap-2 text-xs pt-1 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">Alternative Yield:</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 font-semibold flex items-center gap-1">
                    <Dumbbell className="w-3 h-3 text-amber-500" />
                    {setup.workoutsYield} Workouts
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-700 font-semibold flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-indigo-500" />
                    {setup.booksYield} Books
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 font-semibold flex items-center gap-1">
                    <Utensils className="w-3 h-3 text-rose-500" />
                    {setup.dinnersYield} Family Dinners
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 5-Year Cumulative Hours Summary */}
        <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              <strong>5-Year Macro Impact:</strong> Switching from 5-day Onsite to Remote-First saves an employee <strong>{Math.round(maxOnsiteAnnualHours * 5)} hours</strong> ({Math.round((maxOnsiteAnnualHours * 5) / 24)} continuous days) in traffic over 5 years!
            </span>
          </div>
          <div className="flex items-center gap-1 text-emerald-600 font-bold self-end md:self-auto">
            <span>Reclaim Life Hours</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommuteTimeCard;
