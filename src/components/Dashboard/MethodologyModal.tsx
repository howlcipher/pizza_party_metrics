import React, { useRef, useEffect } from 'react';
import { X, Info } from 'lucide-react';

const MethodologyModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  const handleCancel = (e) => {
    e.preventDefault();
    onClose();
  };

  const handleBackdropClick = (e) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const rect = dialog.getBoundingClientRect();
    const isOutside = (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    );
    if (isOutside) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      className="bg-[#fdf5e6] border-4 border-red-600 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto backdrop:bg-black/70 backdrop:backdrop-blur-sm p-0 m-auto text-left"
    >
      <div className="sticky top-0 bg-white border-b-4 border-red-200 p-4 flex justify-between items-center z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Info className="text-red-600" size={24} />
          <h2 className="pizza-card-title text-2xl font-bold text-red-800">The Secret Recipe (Methodology)</h2>
        </div>
        <button 
          onClick={onClose}
          type="button"
          className="text-red-700 hover:text-red-900 transition-colors p-1 bg-red-100 hover:bg-red-200 rounded-lg border-2 border-transparent hover:border-red-300 font-bold"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="p-6 space-y-6 text-gray-800 text-sm leading-relaxed font-medium">
        <section>
          <h3 className="text-xl font-extrabold text-red-800 mb-2 flex items-center gap-2 pizza-card-title">
            <span className="text-xl">🍕</span> Pizza Party Index (PPI)
          </h3>
          <div className="bg-white p-4 rounded-lg border-2 border-green-600 shadow-sm">
            <p className="mb-2 text-gray-800">
              The <strong>Pizza Party Index</strong> is a holistic score measuring actual productivity combined with async collaboration velocity. A higher PPI indicates a highly optimized environment where workers spend time focusing and collaborating online, rather than stuck in meetings.
            </p>
            <h4 className="font-extrabold text-green-800 mt-3 mb-1 uppercase tracking-wide text-xs">Calculation:</h4>
            <ul className="list-disc list-inside space-y-1 ml-2 text-gray-700 font-medium">
              <li><strong>Productivity:</strong> Calculated as base Focus Hours, adjusted by the industry's meeting overhead.</li>
              <li><strong>Collaboration:</strong> Derived from asynchronous online collaboration metrics (e.g., turnaround times on digital approvals, document reviews, or task resolutions). Faster turnarounds boost the score!</li>
              <li><strong>The Formula:</strong> <code>Focus Hours + (Collaboration Score × 2.0)</code> — higher is better, no fixed ceiling.</li>
              <li><strong>Caveat:</strong> The Collaboration term is refetched periodically from a small, fixed basket of public GitHub repos (see "Task Completion Rate" below) — the same repos for every industry. It can dominate the Index and shift its whole scale between data refreshes, so treat exact scores as relative within a single snapshot, not as a stable absolute number to compare over time.</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-extrabold text-red-800 mb-2 flex items-center gap-2 pizza-card-title">
            <span className="text-xl">⚡</span> Task Completion Rate
          </h3>
          <div className="bg-white p-4 rounded-lg border-2 border-green-600 shadow-sm">
            <p className="mb-2 text-gray-800">
              The <strong>Task Completion Rate</strong> is a proxy for delivery speed and efficiency, measured once per <em>work-setup category</em> — not per industry.
            </p>
            <h4 className="font-extrabold text-green-800 mt-3 mb-1 uppercase tracking-wide text-xs">Calculation:</h4>
            <ul className="list-disc list-inside space-y-1 ml-2 text-gray-700 font-medium">
              <li>Pulled from real pull request and issue activity on a fixed basket of ~10 public GitHub repositories, chosen to represent each work-setup category (e.g. GitLab and Terraform for Remote-First, VS Code and React for Hybrid).</li>
              <li>Calculates the median PR/issue resolution time and average reviewer turnaround for that basket.</li>
              <li><strong>Every industry filter shows the same three category-level numbers</strong> — this metric doesn't vary by industry, only by which work setup is selected.</li>
              <li>Because it depends on whichever PRs happen to exist in those repos at fetch time, values can shift materially between data refreshes.</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-extrabold text-red-800 mb-2 flex items-center gap-2 pizza-card-title">
            <span className="text-xl">🚗</span> Fatigue Penalty & Deep Work Capacity
          </h3>
          <div className="bg-white p-4 rounded-lg border-2 border-green-600 shadow-sm">
            <p className="mb-2 text-gray-800">
              The <strong>Fatigue Penalty</strong> measures the reduction in deep work focus capacity caused by commute drain and physical workplace mandates.
            </p>
            <h4 className="font-extrabold text-green-800 mt-3 mb-1 uppercase tracking-wide text-xs">Calculation & Focus Hours Impact:</h4>
            <ul className="list-disc list-inside space-y-1 ml-2 text-gray-700 font-medium">
              <li><strong>Onsite-Heavy:</strong> High penalty (5.0 hours/week) due to full 5-day commute fatigue and transit overhead.</li>
              <li><strong>Hybrid:</strong> Medium penalty (2.5 hours/week) reflecting partial-week commuting drain.</li>
              <li><strong>Remote-First:</strong> Zero penalty (0.0 hours/week) preserving maximum cognitive energy for deep work.</li>
              <li><strong>Focus Hours Formula:</strong> <code>Focus Hours = (Base Focus Hours × Category Factor × Velocity) - Fatigue Penalty</code></li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-extrabold text-red-800 mb-2 pizza-card-title">Data Ingredients</h3>
          <p className="mb-2 text-gray-800">
            Our models fuse subjective survey data with objective digital telemetry to provide a balanced view of modern work environments.
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-gray-700 font-medium bg-red-50 p-4 rounded-lg border-2 border-red-200">
            <li><strong>Survey of Working Arrangements and Attitudes (SWAA):</strong> Provides foundational data on work setups and meeting loads.</li>
            <li><strong>Digital Telemetry Proxies:</strong> Supplies real-time, objective data on turnaround times and task resolution rates (using open-source repository telemetry as a baseline).</li>
          </ul>
        </section>
      </div>
    </dialog>
  );
};

export default MethodologyModal;
