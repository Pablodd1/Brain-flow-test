import React from 'react';
import { Brain } from 'lucide-react';

interface CockpitEmptyStateProps {
  onStartNewEncounter: () => void;
  onBarcodeScanClick: () => void;
}

export default function CockpitEmptyState({
  onStartNewEncounter,
  onBarcodeScanClick
}: CockpitEmptyStateProps) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-16 text-center flex-1 flex flex-col items-center justify-center text-slate-400 shadow-md" id="cockpit-empty-state">
      <Brain className="w-12 h-12 text-slate-700 animate-pulse mb-4" />
      <h3 className="text-base font-bold text-slate-200 uppercase tracking-wide font-display">Awaiting Clinical Encounter</h3>
      <p className="text-xs text-slate-500 max-w-sm mt-2 leading-relaxed">
        To initiate the 10-Engine Cortex sequence, create a new record from the archives or scan a patient pre-visit intake badge.
      </p>

      <div className="flex gap-4 justify-center mt-8">
        <button
          onClick={onStartNewEncounter}
          className="py-2.5 px-5 bg-slate-800 hover:bg-slate-750 hover:border-slate-600 text-white font-mono font-bold text-xs uppercase tracking-wider rounded border border-slate-700 cursor-pointer shadow transition-all active:scale-95"
        >
          Create Blank Card
        </button>
        <button
          onClick={onBarcodeScanClick}
          className="py-2.5 px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs uppercase tracking-wider rounded cursor-pointer shadow transition-all active:scale-95"
        >
          Barcode Scan Pre-Visit Intake
        </button>
      </div>
    </div>
  );
}
