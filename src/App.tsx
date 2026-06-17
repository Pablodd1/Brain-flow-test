/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { auth, db, handleFirestoreError } from './firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { 
  collection, doc, query, where, onSnapshot, orderBy, 
  setDoc, updateDoc, deleteDoc, getDocFromServer, serverTimestamp
} from 'firebase/firestore';
import { 
  ShieldAlert, Activity, LogOut, Loader2, Brain, Sparkles, 
  FileText, ShieldCheck, Heart, User, Plus, Clock, HelpCircle, AlertTriangle
} from 'lucide-react';
import { ClinicalEncounter, OverrideType, OperationType } from './types';
import ClinicianAuth from './components/ClinicianAuth';
import SensoryFeed from './components/SensoryFeed';
import GenomeGrid from './components/GenomeGrid';
import EngineNavigator from './components/EngineNavigator';
import HistoricEncounters from './components/HistoricEncounters';
import BarcodeScannerModal from './components/BarcodeScannerModal';
import Dashboard from './components/Dashboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [encounters, setEncounters] = useState<ClinicalEncounter[]>([]);
  const [activeEncounterId, setActiveEncounterId] = useState<string | null>(null);
  const [isConfidencePinned, setIsConfidencePinned] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [dbSaving, setDbSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'synced' | 'error'>('synced');
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

  // Find active encounter object
  const activeEncounter = encounters.find(e => e.id === activeEncounterId) || null;

  // 1. Initial connection validate
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();
  }, []);

  // 2. Track Firebase auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  // 3. Realtime listening to Clinician Encounters
  useEffect(() => {
    if (!currentUser) {
      setEncounters([]);
      setActiveEncounterId(null);
      return;
    }

    const path = 'encounters';
    const q = query(
      collection(db, path),
      where('ownerId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ClinicalEncounter[] = [];
      snapshot.forEach((snapshotDoc) => {
        const data = snapshotDoc.data();
        list.push({
          id: snapshotDoc.id,
          ...data,
          // Handle timestamps safely
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        } as ClinicalEncounter);
      });
      setEncounters(list);
      
      // Auto-select the first encounter if none selected and list has item
      if (list.length > 0 && !activeEncounterId) {
        setActiveEncounterId(list[0].id);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 4. Save encounter state changes directly to Cloud Firestore
  const handleUpdateActiveEncounter = async (updates: Partial<ClinicalEncounter>) => {
    if (!activeEncounterId || !currentUser) return;

    // Reject updates on completed sessions to honor security policies
    if (activeEncounter && activeEncounter.status === 'completed') {
      alert('Clinical Safeguard: Completed clinical sessions are locked and cannot be restructured.');
      return;
    }

    setSyncStatus('saving');
    const path = `encounters/${activeEncounterId}`;
    try {
      const docRef = doc(db, 'encounters', activeEncounterId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('error');
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  // 5. Toggle Overrides
  const handleToggleOverride = (type: OverrideType) => {
    if (!activeEncounter) return;
    let updated: OverrideType[] = [...activeEncounter.activeOverrides];
    if (updated.includes(type)) {
      updated = updated.filter(o => o !== type);
    } else {
      updated.push(type);
    }
    handleUpdateActiveEncounter({ activeOverrides: updated });
  };

  // 6. Clinician metric feed updater
  const handleMetricUpdate = (metrics: { heartRate: number; hrv: number; swayIndex: number }) => {
    if (!activeEncounter || activeEncounter.status === 'completed') return;
    // Debounce updates by only saving to database occasionally or keeping it local
    // For this full-stack proof we keep the real-time simulation reactive in local variables, and save occasionally
    handleUpdateActiveEncounter({
      heartRate: metrics.heartRate,
      hrv: metrics.hrv,
      swayIndex: metrics.swayIndex
    });
  };

  // 7. Initialize a new clinical encounter session
  const handleStartNewEncounter = async (barcodePatient?: any) => {
    if (!currentUser) return;

    setDbSaving(true);
    const newId = 'enc_' + Math.random().toString(36).substring(2, 11);
    const path = `encounters/${newId}`;

    // Standard clinical defaults
    let patientName = "EHR Patient Outline";
    let preVisitIntake = "Patient requests autonomic and neuro-somatic screening.";
    let patientDob = "1994-01-01";
    let initialObs: string[] = [];

    if (barcodePatient) {
      patientName = barcodePatient.name;
      patientDob = barcodePatient.dob;
      preVisitIntake = barcodePatient.intake;
      initialObs = barcodePatient.observations || [];
    }

    const newEncPayload = {
      id: newId,
      ownerId: currentUser.uid,
      patientName,
      patientDob,
      preVisitIntake,
      currentEngine: 1,
      maxVisitedEngine: 1,
      observations: initialObs,
      activeOverrides: [],
      notes: '',
      heartRate: 72,
      hrv: 48,
      swayIndex: 2.1,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'encounters', newId), newEncPayload);
      setActiveEncounterId(newId);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setDbSaving(false);
    }
  };

  const handleBarcodeScanComplete = async (patient: any) => {
    setShowBarcodeScanner(false);
    await handleStartNewEncounter(patient);
  };

  // 8. Meaning Engine Session Lockdown
  const handleLockSession = async () => {
    if (!activeEncounterId) return;
    setDbSaving(true);
    const path = `encounters/${activeEncounterId}`;
    try {
      const docRef = doc(db, 'encounters', activeEncounterId);
      await updateDoc(docRef, {
        status: 'completed',
        updatedAt: serverTimestamp()
      });
      alert('Secure Storage Archive Synced: This somatic encounter lock is active.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setDbSaving(false);
    }
  };

  const handleSignOut = () => {
    signOut(auth);
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

      {/* Header Bio Rail */}
      <header className="bg-slate-950/80 border-b border-slate-800 xl:px-8 px-6 py-4 sticky top-0 z-30 backdrop-blur-md" id="control-panel-header">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo Title */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500 rounded flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/10">
              <Brain className="w-5.5 h-5.5 text-slate-950" strokeWidth={2.5} />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-bold tracking-tight text-slate-100 font-display">Coherence™ Mission Control</h1>
                <span className="text-[9px] font-mono font-bold bg-slate-900 px-2 py-0.5 border border-slate-800 rounded text-emerald-400">STABLE SESSION</span>
              </div>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Senior Clinical Systems Architect Console</p>
            </div>
          </div>

          {/* View Switcher Tabs */}
          <div className="flex bg-slate-900 border border-slate-800 rounded p-0.5" id="view-mode-tabs">
            <button
              onClick={() => setActiveView('cockpit')}
              className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold tracking-wider uppercase transition-all cursor-pointer ${
                activeView === 'cockpit'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cockpit
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                activeView === 'analytics'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3 h-3" />
              Analytics
            </button>
          </div>

          {/* Clinician Profile details */}
          <div className="flex items-center gap-5">
            <div className="hidden sm:flex text-right flex-col">
              <span className="text-xs font-semibold text-slate-300 font-sans">{currentUser.displayName || 'Clinician Admin'}</span>
              <span className="text-[10px] font-mono text-slate-500 mt-0.5">MD, Neuro-Somatic Architect</span>
            </div>
            
            {/* Sync Status Badge */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded border border-slate-800 text-[10px] font-mono text-slate-400">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              {syncStatus === 'saving' ? (
                <span className="text-emerald-400 animate-pulse">SYNCING...</span>
              ) : syncStatus === 'error' ? (
                <span className="text-red-400">SYNC ERROR</span>
              ) : (
                <span className="text-slate-400 uppercase">FIREBASE ONLINE</span>
              )}
            </div>

            <button
              onClick={handleSignOut}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded text-xs tracking-wider uppercase font-mono font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

        </div>
      </header>

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
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-16 text-center flex-1 flex flex-col items-center justify-center text-slate-400 shadow-md" id="cockpit-empty-state">
                <Brain className="w-12 h-12 text-slate-700 animate-pulse mb-4" />
                <h3 className="text-base font-bold text-slate-200 uppercase tracking-wide font-display">Awaiting Clinical Encounter</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-2 leading-relaxed">
                  To initiate the 10-Engine Cortex sequence, create a new record from the archives or scan a patient pre-visit intake badge.
                </p>
                
                <div className="flex gap-4 justify-center mt-8">
                  <button
                    onClick={() => handleStartNewEncounter()}
                    className="py-2.5 px-5 bg-slate-800 hover:bg-slate-750 hover:border-slate-600 text-white font-mono font-bold text-xs uppercase tracking-wider rounded border border-slate-700 cursor-pointer shadow transition-all active:scale-95"
                  >
                    Create Blank Card
                  </button>
                  <button
                    onClick={() => setShowBarcodeScanner(true)}
                    className="py-2.5 px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs uppercase tracking-wider rounded cursor-pointer shadow transition-all active:scale-95"
                  >
                    Barcode Scan Pre-Visit Intake
                  </button>
                </div>
              </div>
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
