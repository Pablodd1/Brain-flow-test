import React from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { Brain, Activity, Clock, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

interface AppHeaderProps {
  currentUser: FirebaseUser;
  activeView: 'cockpit' | 'analytics';
  setActiveView: (view: 'cockpit' | 'analytics') => void;
  syncStatus: 'idle' | 'saving' | 'synced' | 'error';
}

export default function AppHeader({
  currentUser,
  activeView,
  setActiveView,
  syncStatus
}: AppHeaderProps) {
  const handleSignOut = () => {
    signOut(auth);
  };

  return (
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
  );
}
