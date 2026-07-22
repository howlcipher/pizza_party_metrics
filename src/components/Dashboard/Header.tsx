import React, { useState } from 'react';
import { Pizza, Download, Info } from 'lucide-react';
import MethodologyModal from './MethodologyModal';

const Header = ({ rawData = [] }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const exportData = () => {
    const payload = {
      metadata: {
        random_seed: 42,
        source: "Pizza Party Metrics Dashboard",
        exported_at: new Date().toISOString()
      },
      dataset: rawData
    };
    
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pizza_metrics_export.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  };

  return (
    <header className="bg-[var(--card-bg)] border-b-8 border-[var(--chart-danger)] text-[var(--card-text)] p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.15)] relative overflow-hidden">
      {/* Decorative green top border */}
      <div className="absolute top-0 left-0 w-full h-2 bg-green-600"></div>
      
      <div className="flex items-center gap-4 relative z-10">
        <div className="bg-green-600 p-3 rounded-full text-white shadow-lg border-2 border-white transform -rotate-12">
          <Pizza size={36} fill="#ffcc00" />
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-3xl sm:text-4xl md:text-5xl text-[var(--chart-danger)] tracking-tight drop-shadow-sm" style={{ fontFamily: 'var(--font-brand)' }}>
            Luigi's Pizza Party Metrics
          </h1>
          <p className="text-[var(--chart-primary)] font-bold mt-1 text-xs md:text-sm uppercase tracking-wider">
            Authentic Telemetry, Fresh Outta The Oven! 🤌
          </p>
        </div>
      </div>
      <div className="flex flex-wrap justify-center md:justify-end items-center gap-3 relative z-10">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-white hover:bg-gray-100 text-[var(--chart-danger)] hover:text-red-800 px-4 py-2 rounded-full border-2 border-red-200 transition-colors text-sm font-bold shadow-sm"
        >
          <Info size={18} />
          <span>The Recipe (Methodology)</span>
        </button>
        <button
          onClick={exportData}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full border-2 border-red-800 transition-colors text-sm font-bold shadow-md"
        >
          <Download size={18} />
          <span>Box Up Data</span>
        </button>
        
        <div className="hidden md:flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full border-2 border-green-600 shadow-sm">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-600 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-600"></span>
          </span>
          <span className="text-sm font-extrabold text-[var(--chart-primary)] uppercase">Oven is Hot</span>
        </div>
      </div>
      <MethodologyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </header>
  );
};

export default Header;

