import React from 'react';
import { Pizza } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-amber-50 border-b-4 border-amber-500 p-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <div className="bg-red-600 p-3 rounded-full text-white shadow-md">
          <Pizza size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-red-600 tracking-tight">
            Pizza Party Metrics
          </h1>
          <p className="text-amber-800 font-medium mt-1">
            Replacing Performative Perks with Real Productivity Telemetry
          </p>
        </div>
      </div>
      <div className="hidden md:flex items-center gap-2">
        <span className="flex h-3 w-3 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
        <span className="text-sm font-bold text-green-700">Live Telemetry</span>
      </div>
    </header>
  );
};

export default Header;
