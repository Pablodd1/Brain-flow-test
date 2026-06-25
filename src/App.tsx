/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, Loader2, AlertTriangle
} from 'lucide-react';
import ClinicianAuth from './components/ClinicianAuth';
import SensoryFeed from './components/SensoryFeed';
import GenomeGrid from './components/GenomeGrid';
import EngineNavigator from './components/EngineNavigator';
import HistoricEncounters from './components/HistoricEncounters';
import BarcodeScannerModal from './components/BarcodeScannerModal';
import Dashboard from './components/Dashboard';

// Extracted UI Components
import AppHeader from './components/AppHeader';
import CockpitEmptyState from './components/CockpitEmptyState';

// Extracted State & Logic Hooks
import { useAuth } from './hooks/useAuth';
import { useEncounters } from './hooks/useEncounters';

export default function App() {
  const { currentUser, authChecking, setCurrentUser } = useAuth();
  const {
    encounters,
    activeEncounterId,
    setActiveEncounterId,
    activeEncounter,
    dbSaving,
    syncStatus,
    handleUpdateActiveEncounter,
    handleToggleOverride,
    handleMetricUpdate,
    handleStartNewEncounter,
    handleLockSession
  } = useEncounters(currentUser);

  const [isConfidencePinned, setIsConfidencePinned] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [activeView, setActiveView] = useState<'cockpit' | 'analytics'>('cockpit');
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const handleToggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 2) {
        // limit to 2
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  const handleBarcodeScanComplete = async (patient: any) => {
    setShowBarcodeScanner(false);
    await handleStartNewEncounter(patient);
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-100" id="global-loading-screen">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
          <p className="text-sm font-mono tracking-widest text-slate-400 uppercase">COHERENCE™ BOOT SEQUENCE...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <ClinicianAuth onSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans flex flex-col antialiased relative selection:bg-emerald-500/30 selection:text-white" id="applet-viewport">
      {/* Subtle Ambient Glow Effects */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-slate-900/40 rounded-full filter blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-slate-950/20 rounded-full filter blur-[140px] pointer-events-none" />

      {/* METACGNOTIVE WARNING BANNER: PINNED ONCE STATE 3 ACCESSED */}
      {isConfidencePinned && (
        <div className="bg-amber-900/20 border-b border-amber-500/30 p-3 text-center text-xs relative z-35 flex items-center justify-center gap-2.5" id="pinned-metacognition-banner">
          <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
          <span className="text-slate-100 font-sans tracking-wide">
            <strong>CONFIDENENCE CHECK:</strong> "Am I anchoring? Am I open to being wrong?" Maintain differential neuro-somatic checkpoints.
          </span>
          <button 
            onClick={() => setIsConfidencePinned(false)}
            className="text-[10px] font-mono text-amber-400 hover:text-amber-300 ml-4 font-bold uppercase tracking-wider cursor-pointer transition-colors"
          >
            DISMISS SAFEGUARD
          </button>
        </div>
      )}

      <AppHeader
        currentUser={currentUser}
        activeView={activeView}
        setActiveView={setActiveView}
        syncStatus={syncStatus}
      />

      {/* Dynamic Viewport Container */}
      {activeView === 'analytics' ? (
        <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 relative z-10" id="main-analytics-container">
          <Dashboard
            encounters={encounters}
            onSelectEncounter={(id) => setActiveEncounterId(id)}
            onClose={() => {
              setActiveView('cockpit');
              setCompareIds([]);
            }}
            compareIds={compareIds}
            onClearCompare={() => setCompareIds([])}
          />
        </main>
      ) : (
        /* Main Dashboard Layout */
        <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10" id="main-cockpit-grid">
          
          {/* Left Hand: EHR Records & Telemetry Logs (Rails 1-3) */}
          <section className="lg:col-span-3 flex flex-col gap-6">
            <HistoricEncounters
              encounters={encounters}
              activeEncounterId={activeEncounterId}
              onSelectEncounter={(id) => setActiveEncounterId(id)}
              onStartNewEncounter={() => handleStartNewEncounter()}
              onBarcodeScanClick={() => setShowBarcodeScanner(true)}
              compareIds={compareIds}
              onToggleCompare={handleToggleCompare}
              onLaunchComparison={() => setActiveView('analytics')}
            />
            
            {activeEncounter ? (
              <SensoryFeed
                heartRate={activeEncounter.heartRate}
                hrv={activeEncounter.hrv}
                swayIndex={activeEncounter.swayIndex}
                overrideActive={activeEncounter.activeOverrides.length > 0}
                onMetricUpdate={handleMetricUpdate}
              />
            ) : (
              <div className="bg-slate-900/50 border border-slate-850 rounded p-6 text-center text-xs text-slate-500 font-mono">
                Sensory Telemetry Feed Offline.<br />Select or start an active session to initialize bio-feedback loop.
              </div>
            )}
          </section>

          {/* Middle and Right: State Machine + Genome Grid (Rails 4-12) */}
          <section className="lg:col-span-9 flex flex-col gap-6">
            {activeEncounter ? (
              <>
                {/* Patient Badge summary */}
                <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Active Encounter File</span>
                      <span className="text-[10px] font-mono text-slate-600 bg-slate-950 border border-slate-850 px-1.5 py-0.5 rounded">ENC_ID: {activeEncounter.id}</span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-100 font-display tracking-tight leading-tight">{activeEncounter.patientName}</h2>
                    <p className="text-xs text-slate-400">
                      DOB: <span className="text-slate-300 font-mono">{activeEncounter.patientDob}</span> • Pre-visit Symptoms: <span className="italic text-slate-300">"{activeEncounter.preVisitIntake}"</span>
                    </p>
                  </div>
                  {activeEncounter.status === 'completed' ? (
                    <div className="py-2 px-4 bg-emerald-950/40 border border-emerald-500/55 rounded text-emerald-400 text-xs font-mono font-bold flex items-center gap-2 tracking-wide uppercase">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      LOCKED ARCHIVE
                    </div>
                  ) : (
                    <div className="py-2 px-4 bg-blue-950/40 border border-blue-500/40 rounded text-blue-400 text-xs font-mono font-bold flex items-center gap-2 tracking-wide uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                      ACTIVE ASSESSMENT
                    </div>
                  )}
                </div>

                {/* Progressing Engine state machine navigation */}
                <EngineNavigator
                  encounter={activeEncounter}
                  saving={dbSaving}
                  onUpdateEncounter={handleUpdateActiveEncounter}
                  onToggleOverride={handleToggleOverride}
                  onPinConfidence={() => setIsConfidencePinned(true)}
                  onLockSession={handleLockSession}
                />

                {/* Genome network mapping */}
                <GenomeGrid activeOverrides={activeEncounter.activeOverrides} />
              </>
            ) : (
              <CockpitEmptyState
                onStartNewEncounter={() => handleStartNewEncounter()}
                onBarcodeScanClick={() => setShowBarcodeScanner(true)}
              />
            )}
          </section>

        </main>
      )}

      {/* Barcode scanner dialog trigger */}
      {showBarcodeScanner && (
        <BarcodeScannerModal
          onClose={() => setShowBarcodeScanner(false)}
          onScanComplete={handleBarcodeScanComplete}
        />
      )}

      {/* Subtle Elegant Footer */}
      <footer className="bg-slate-950/80 max-w-7xl w-full mx-auto mt-6 py-6 px-8 border-t border-slate-800 flex justify-between items-center text-[10px] font-mono text-slate-600 relative z-10" id="cockpit-credit-footer">
        <div className="flex gap-6">
          <span>SYSTEM_VERSION: v5.1.0-stable</span>
          <span>LATENCY: 11ms</span>
          <span>COHERENCE™ DECISION MULTIVERSE</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>FIREBASE_SYNC_ONLINE</span>
        </div>
      </footer>
    </div>
  );
}
