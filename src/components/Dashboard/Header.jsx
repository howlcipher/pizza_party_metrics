import React from 'react';
import { Pizza } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-4">
        <div className="bg-gradient-to-br from-red-500 to-orange-600 p-3 rounded-full text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]">
          <Pizza size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500 tracking-tight">
            Pizza Party Metrics
          </h1>
          <p className="text-gray-400 font-medium mt-1">
            Replacing Performative Perks with Real Productivity Telemetry
          </p>
        </div>
      </div>
      <div className="hidden md:flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-full border border-gray-700">
        <span className="flex h-3 w-3 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
        <span className="text-sm font-bold text-green-400">Live Telemetry</span>
      </div>
    </header>
  );
};

export default Header;

