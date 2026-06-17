/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ClinicalEncounter } from '../types';
import { FileText, Lock, Plus, Search, Calendar, Activity, ChevronRight, Barcode, CheckCircle } from 'lucide-react';

interface HistoricEncountersProps {
  encounters: ClinicalEncounter[];
  activeEncounterId: string | null;
  onSelectEncounter: (id: string) => void;
  onStartNewEncounter: (patientTemplate?: any) => void;
  onBarcodeScanClick: () => void;
  compareIds?: string[];
  onToggleCompare?: (id: string) => void;
  onLaunchComparison?: () => void;
}

export default function HistoricEncounters({
  encounters,
  activeEncounterId,
  onSelectEncounter,
  onStartNewEncounter,
  onBarcodeScanClick,
  compareIds = [],
  onToggleCompare,
  onLaunchComparison
}: HistoricEncountersProps) {
  const [patientSearch, setPatientSearch] = useState('');

  const filtered = encounters.filter(enc => 
    enc.patientName.toLowerCase().includes(patientSearch.toLowerCase())
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col h-full" id="historic-encounters-card">
      {/* Title */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-850">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono tracking-widest text-slate-400 uppercase font-bold">Encounter Archives & Logs</span>
        </div>
        <div className="flex gap-2">
          {/* Barcode scanner launcher */}
          <button
            id="barcode-scanner-btn"
            onClick={onBarcodeScanClick}
            className="py-1 px-2.5 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 hover:from-cyan-500/35 hover:to-indigo-500/35 text-cyan-300 font-semibold font-sans text-[10px] uppercase rounded-lg border border-cyan-500/30 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            title="Scan Pre-Visit Barcode Intake"
          >
            <Barcode className="w-3.5 h-3.5" />
            Barcode Scan Intake
          </button>
          
          <button
            id="start-blank-encounter-btn"
            onClick={() => onStartNewEncounter()}
            className="p-1 text-cyan-400 hover:text-white bg-slate-950/50 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg cursor-pointer transition-all"
            title="New blank encounter"
          >
            <Plus className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Search enc */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
        <input
          type="text"
          placeholder="Search patient name..."
          value={patientSearch}
          onChange={(e) => setPatientSearch(e.target.value)}
          className="w-full bg-slate-950 border border-slate-850 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
        />
      </div>

      {/* Comparison Controller Station */}
      {compareIds.length > 0 && (
        <div className="mb-3 p-3 bg-slate-950/80 border border-cyan-500/30 rounded-xl flex flex-col gap-2" id="comparison-dock-station">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono text-cyan-405 font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Compare Mode ({compareIds.length}/2)
            </span>
            <button 
              onClick={() => {
                if (onToggleCompare) {
                  compareIds.forEach(id => onToggleCompare(id));
                }
              }}
              className="text-[9px] font-mono text-slate-500 hover:text-slate-350 cursor-pointer underline"
            >
              Clear All
            </button>
          </div>
          {compareIds.length === 2 ? (
            <button
              onClick={onLaunchComparison}
              className="w-full py-1.5 px-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:opacity-90 active:scale-[0.98] text-slate-950 font-bold font-mono text-[9px] tracking-wide uppercase rounded-lg cursor-pointer transition-all shadow-md"
            >
              Compare Side-by-Side →
            </button>
          ) : (
            <p className="text-[9px] text-slate-500 font-mono italic leading-snug">
              Select exactly 2 sessions to visually chart comparative timelines and metrics.
            </p>
          )}
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto max-h-[200px] sm:max-h-none space-y-2 pr-1" id="encounters-scroller-area">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-850 rounded-xl leading-normal">
            No patient sessions archived.<br />Scan a barcode to pre-populate an intake immediately!
          </div>
        ) : (
          filtered.map((enc) => {
            const isActive = enc.id === activeEncounterId;
            const isCompleted = enc.status === 'completed';

            // Format date helper
            let dateStr = 'Recent';
            if (enc.createdAt?.seconds) {
              dateStr = new Date(enc.createdAt.seconds * 1000).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
            } else if (enc.createdAt instanceof Date) {
              dateStr = enc.createdAt.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
            }

            return (
              <div
                key={enc.id}
                onClick={() => onSelectEncounter(enc.id)}
                className={`p-3 rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/10 border-cyan-500 shadow-md shadow-cyan-500/5'
                    : 'bg-slate-950/40 border-slate-850 hover:bg-slate-900 hover:border-slate-750'
                }`}
              >
                <div className="flex items-center gap-2.5 w-full min-w-0">
                  {onToggleCompare && (
                    <input
                      type="checkbox"
                      checked={compareIds.includes(enc.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCompare(enc.id);
                      }}
                      onChange={() => {}} // Controlled React element
                      className="cursor-pointer bg-slate-900 border-slate-800 focus:ring-0 focus:ring-offset-0 text-cyan-400 rounded w-3.5 h-3.5 shrink-0"
                      title="Toggle session comparison"
                    />
                  )}
                  
                  <div className="flex-1 min-w-0 pr-1 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-xs text-white leading-tight font-sans truncate">
                        {enc.patientName}
                      </span>
                      {isCompleted ? (
                        <span className="p-0.5 bg-emerald-950/40 border border-emerald-500/50 rounded-md text-[8px] font-mono text-emerald-400 flex items-center gap-0.5 uppercase shrink-0">
                          <Lock className="w-2 h-2 text-emerald-400" />
                          Locked
                        </span>
                      ) : (
                        <span className="p-0.5 bg-cyan-950/40 border border-cyan-500/50 rounded-md text-[8px] font-mono text-cyan-400 uppercase shrink-0">
                          Active
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500 flex-wrap">
                      <span className="flex items-center gap-0.5 shrink-0">
                        <Calendar className="w-2.5 h-2.5 text-slate-500" />
                        {dateStr}
                      </span>
                      <span>•</span>
                      <span className="shrink-0">Engine {enc.currentEngine}/10</span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center">
                    <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'translate-x-0.5 text-cyan-400' : 'text-slate-600'}`} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
