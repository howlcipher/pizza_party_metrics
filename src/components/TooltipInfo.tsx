import React, { useState } from "react";

const TooltipInfo = ({ content }: { content: React.ReactNode }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block ml-2 align-middle z-50">
      <button 
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-help"
        aria-label="More information"
      >
        ?
      </button>

      {show && (
        <div className="absolute z-50 w-64 sm:w-72 p-3 mt-2 text-sm text-left font-normal normal-case bg-[var(--card-text)] text-amber-50 rounded-lg shadow-xl border-2 border-[var(--dashboard-border)] -left-32 sm:left-auto sm:right-0 transform -translate-x-1/4 sm:translate-x-0">
          {content}
          <div className="absolute top-0 w-3 h-3 bg-[var(--card-text)] border-t-2 border-l-2 border-[var(--dashboard-border)] transform rotate-45 -mt-1.5 left-1/2 sm:left-auto sm:right-2"></div>
        </div>
      )}
    </div>
  );
};

export default TooltipInfo;