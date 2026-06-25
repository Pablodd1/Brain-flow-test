/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area
} from 'recharts';
import { 
  Activity, 
  Clock, 
  ShieldAlert, 
  Search, 
  TrendingUp, 
  ArrowLeftRight, 
  Calendar,
  Brain, 
  Sparkles,
  Award,
  Filter,
  CheckCircle,
  FileSpreadsheet,
  BookOpen,
  Heart,
  Info,
  Layers,
  Check
} from 'lucide-react';
import { ClinicalEncounter, OverrideType } from '../types';

interface DashboardProps {
  encounters: ClinicalEncounter[];
  onSelectEncounter: (id: string) => void;
  onClose: () => void;
  compareIds?: string[];
  onClearCompare?: () => void;
}

const OVERRIDE_COLORS: Record<OverrideType, string> = {
  freeze: '#ef4444',       // Vibrant Red
  neuroimmune: '#f43f5e',  // Rose Pink
  structural: '#f59e0b',   // Warm Amber
  performance: '#10b981',  // Emerald Green
  executive: '#8b5cf6'     // Royal Violet
};

export default function Dashboard({ 
  encounters, 
  onSelectEncounter, 
  onClose,
  compareIds = [],
  onClearCompare
}: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [dashboardMode, setDashboardMode] = useState<'analytics' | 'scientific'>('analytics');

  const compEncounter1 = useMemo(() => {
    return encounters.find(e => e.id === compareIds?.[0]) || null;
  }, [encounters, compareIds]);

  const compEncounter2 = useMemo(() => {
    return encounters.find(e => e.id === compareIds?.[1]) || null;
  }, [encounters, compareIds]);

  const showComparison = compareIds.length === 2;

  // 1. Calculate general summary stats
  const stats = useMemo(() => {
    const total = encounters.length;
    const completed = encounters.filter(e => e.status === 'completed');
    const active = encounters.filter(e => e.status === 'active');
    
    const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;
    
    // Average completion time (duration in seconds)
    let avgDurationSec = 0;
    if (completed.length > 0) {
      const sumDurations = completed.reduce((sum, e) => {
        if (!e.createdAt || !e.updatedAt) return sum;
        const dur = Math.max(1, Math.round((e.updatedAt.getTime() - e.createdAt.getTime()) / 1000));
        return sum + dur;
      }, 0);
      avgDurationSec = Math.round(sumDurations / completed.length);
    }

    // Average HRV and Heart Rate
    let avgHrv = 0;
    let avgHeartRate = 0;
    if (total > 0) {
      const sumHrv = encounters.reduce((sum, e) => sum + (e.hrv || 45), 0);
      const sumHr = encounters.reduce((sum, e) => sum + (e.heartRate || 72), 0);
      avgHrv = Math.round(sumHrv / total);
      avgHeartRate = Math.round(sumHr / total);
    }

    return {
      total,
      completedCount: completed.length,
      activeCount: active.length,
      completionRate,
      avgDurationSec,
      avgHrv,
      avgHeartRate
    };
  }, [encounters]);

  // 2. Prepare data for Override Deployments frequency chart
  const overrideFrequencyData = useMemo(() => {
    const counts: Record<OverrideType, number> = {
      freeze: 0,
      neuroimmune: 0,
      structural: 0,
      performance: 0,
      executive: 0
    };

    encounters.forEach((e) => {
      if (Array.isArray(e.activeOverrides)) {
        e.activeOverrides.forEach((override) => {
          if (counts[override] !== undefined) {
            counts[override]++;
          }
        });
      }
    });

    return Object.entries(counts).map(([name, count]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      key: name as OverrideType,
      Count: count,
      color: OVERRIDE_COLORS[name as OverrideType]
    }));
  }, [encounters]);

  // 3. Prepare data for Session Completion Times chart
  const completionTimesData = useMemo(() => {
    // We only take completed sessions
    const completed = encounters
      .filter(e => e.status === 'completed' && e.createdAt && e.updatedAt)
      // Sort chronologically ascending
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    return completed.map(e => {
      const durationSec = Math.max(1, Math.round((e.updatedAt.getTime() - e.createdAt.getTime()) / 1000));
      return {
        id: e.id,
        patientName: e.patientName.split(' ')[0] || e.id, // Just first name to avoid chart clutter
        fullName: e.patientName,
        'Duration (Sec)': durationSec,
        'HRV Score': e.hrv,
        'Max Engine': e.maxVisitedEngine
      };
    });
  }, [encounters]);

  // 4. Prepare data for Engine Progression Distribution
  const engineProgressionData = useMemo(() => {
    // Multi-staged count of occurrences for each of the 10 Cortex reasoning engines
    const distribution: Record<number, number> = {};
    for (let i = 1; i <= 10; i++) {
      distribution[i] = 0;
    }

    encounters.forEach(e => {
      const engine = e.maxVisitedEngine || e.currentEngine || 1;
      if (distribution[engine] !== undefined) {
        distribution[engine]++;
      }
    });

    return Object.entries(distribution).map(([engineNum, count]) => ({
      Engine: `Eng ${engineNum.toString().padStart(2, '0')}`,
      'Encounter Count': count
    }));
  }, [encounters]);

  // Helper to format session duration cleanly
  const formatDuration = (secondsVal: number) => {
    if (secondsVal < 60) return `${secondsVal}s`;
    const mins = Math.floor(secondsVal / 60);
    const secs = secondsVal % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  // 5. Filter list of all sessions in detailed grid
  const filteredSessions = useMemo(() => {
    return encounters.filter(e => {
      const matchesSearch = e.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            e.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            e.preVisitIntake.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).map(enc => {
      let durationStr = "---";
      if (enc.createdAt && enc.updatedAt) {
        const seconds = Math.max(1, Math.round((enc.updatedAt.getTime() - enc.createdAt.getTime()) / 1000));
        durationStr = formatDuration(seconds);
      }
      return { ...enc, durationStr };
    });
  }, [encounters, searchTerm, statusFilter]);


  // Determine the most common override (Primary Triage)
  const topOverride = useMemo(() => {
    const sorted = [...overrideFrequencyData].sort((a, b) => b.Count - a.Count);
    if (sorted.length > 0 && sorted[0].Count > 0) {
      return sorted[0];
    }
    return null;
  }, [overrideFrequencyData]);

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-5 flex flex-col h-full space-y-6 @container" id="clinical-dashboard-container">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-tight font-display">Cortex Systems Analytics</h2>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Aggregate Clinical Overrides & Bio-Mechanic Insights</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sub-tab view selector */}
          <div className="flex bg-slate-950/60 border border-slate-800 rounded p-0.5" id="dashboard-tab-sub-bar">
            <button
              onClick={() => setDashboardMode('analytics')}
              className={`px-3 py-1.5 text-[10px] font-mono tracking-wider uppercase rounded transition-all cursor-pointer ${
                dashboardMode === 'analytics'
                  ? 'bg-emerald-500/15 text-emerald-450 font-bold border border-emerald-500/25'
                  : 'text-slate-500 hover:text-slate-350 border border-transparent'
              }`}
            >
              Session Analytics
            </button>
            <button
              onClick={() => setDashboardMode('scientific')}
              className={`px-3 py-1.5 text-[10px] font-mono tracking-wider uppercase rounded transition-all cursor-pointer flex items-center gap-1 ${
                dashboardMode === 'scientific'
                  ? 'bg-emerald-500/15 text-emerald-450 font-bold border border-emerald-500/25'
                  : 'text-slate-500 hover:text-slate-350 border border-transparent'
              }`}
            >
              <Brain className="w-3 h-3 text-emerald-400" />
              Scientific Reference Desk
            </button>
          </div>

          <button 
            onClick={onClose}
            className="py-1.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded font-mono font-bold text-xs uppercase tracking-wider cursor-pointer transition-all border border-slate-700"
          >
            ← Return to Cockpit
          </button>
        </div>
      </div>      {dashboardMode === 'scientific' ? (
        <div className="space-y-6 @container" id="scientific-reference-desk-view">
          {/* Scientific Intro Jumbotron */}
          <div className="p-6 bg-slate-950/40 border border-slate-850 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 border border-emerald-500/25 rounded uppercase">Methodology Foundations</span>
                <span className="text-[9px] font-mono text-slate-550">UPDATED LATEST STANDARDS</span>
              </div>
              <h3 className="text-base font-bold text-slate-100 font-display">Autonomic Assessment & Neuro-Somatic Clinical Diagnostics</h3>
              <p className="text-xs text-slate-400 font-mono leading-relaxed">
                Coherence™ Mission Mission Control models real-time bio-feedback parameters into standard clinical pipelines designed similarly to top-tier laboratories (Mayo Clinic Autonomic Function Labs, Cleveland Clinic, Harvard CNS Labs). This reference portal traces our software state tracking to gold-standard physiological benchmarks.
              </p>
            </div>
            <div className="flex items-center gap-2 py-1.5 px-3 bg-slate-900 border border-slate-800 rounded">
              <Info className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-[10px] font-mono text-slate-400">Standardized to ESC/NASPE guidelines for HRV analysis</span>
            </div>
          </div>

          {/* Grid Layout of the Reference Desk */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Rail: 10 Cortex Engine Decision Pipes (Pipes 1-7) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Pipeline Card */}
              <div className="bg-slate-950/25 border border-slate-850 p-5 rounded-lg space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wide">10-Cortex Engine Clinical Workflow Logic</h4>
                </div>
                
                <p className="text-[11px] text-slate-450 leading-relaxed font-mono">
                  Standard Electronic Health Records (EHR) treat reports statically. Coherence utilizes an progressive, server-authoritative state-machine to pace clinicians through critical checkpoints. This workflow prevents heuristic anchoring, selection bias, and intervention-rushing.
                </p>

                {/* Vertical Stepper Timeline */}
                <div className="space-y-3 pt-2">
                  
                  {/* Step 1-2-3 Segment */}
                  <div className="relative pl-6 border-l border-slate-800 space-y-4">
                    <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold block">01 - 03: Telemetry Baselining & Metacognitive Gating</span>
                      <p className="text-[11px] text-slate-300 mt-1">
                        We scan patient bio-parameters (<span className="text-sky-405 font-semibold font-mono">HRV, HR, sway Index</span>) and log physical observations. The clinician must explicitly answer heuristic self-correction prompts inside the <span className="text-amber-400 italic">Confidence Engine</span> before any overrides/intervention tasks are unlocked. This protocol mirrors defensive diagnostic procedures limiting systemic clinical errors.
                      </p>
                    </div>
                  </div>

                  {/* Step 4-6 Segment */}
                  <div className="relative pl-6 border-l border-slate-800 space-y-4">
                    <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-550 border-2 border-slate-950" />
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold block">04 - 06: Buffer Profiling & Kinetic Consensus</span>
                      <p className="text-[11px] text-slate-300 mt-1">
                        Somatic interventions are energy-intensive. Standard autonomic testing is deferred if cellular reserve metrics demonstrate profound collapse (indicated by raw telemetry heart rate elevation & HRV tracking &lt;15ms). A mutual therapeutic contract is compiled before launching physical maneuvers to protect patient trust.
                      </p>
                    </div>
                  </div>

                  {/* Step 7-10 Segment */}
                  <div className="relative pl-6 border-l border-slate-800 space-y-4">
                    <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-slate-950" />
                    <div>
                      <span className="text-[10px] font-mono text-blue-400 font-bold block">07 - 10: Somatic Sequencing, Tracking & Integration</span>
                      <p className="text-[11px] text-slate-300 mt-1">
                        Clinicians activate customized bio-mechanical tasks synced directly from the 17-Genome physiological nodes. Continuous sensory telemetry tracks instantaneous shift, testing autonomic reactivity (Valsalva equivalent) prior to archiving, mapping, and downloading clean self-regulation scripts.
                      </p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Autonomic Diagnostics Benchmark Card */}
              <div className="bg-slate-950/25 border border-slate-850 p-5 rounded-lg space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                  <Heart className="w-4 h-4 text-emerald-450" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wide">Autonomic Lab Reference Baselines vs Coherence</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  
                  {/* Cardiovagal Deep Breathing (Mayo Standard) */}
                  <div className="bg-slate-950/70 p-3.5 border border-slate-850/80 rounded space-y-2">
                    <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block">1. Cardiovagal Deep Paced Breathing</span>
                    <p className="text-[11px] text-slate-350 leading-relaxed">
                      Mayo Clinic labs compute the <span className="text-slate-100 font-bold">Inspiration:Expiration (I:E) Ratio</span> during guided 6 breaths/min (0.1 Hz) resonant sequences.
                    </p>
                    <div className="text-[10px] bg-slate-900 p-1.5 rounded text-slate-400">
                      <span className="text-slate-200">Normal baseline:</span> &gt;1.15-1.20 target ratio.<br />
                      <span className="text-slate-200">Coherence Mapping:</span> Managed in <strong className="text-emerald-400">Node 1 (Vagus Nerve Tone)</strong> and <strong className="text-emerald-400">Node 15 (HRV Amplification)</strong>.
                    </div>
                  </div>

                  {/* Valsalva Ratio (Cardiovagal Adrenergic) */}
                  <div className="bg-slate-950/70 p-3.5 border border-slate-850/80 rounded space-y-2">
                    <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block">2. Valsalva Maneuver Ratio</span>
                    <p className="text-[11px] text-slate-350 leading-relaxed">
                      Measures baroreceptor sensitivity by tracking maximum HR in phase II vs minimum HR in phase IV.
                    </p>
                    <div className="text-[10px] bg-slate-900 p-1.5 rounded text-slate-400">
                      <span className="text-slate-200">Normal baseline:</span> Valsalva Ratio of &gt;1.50.<br />
                      <span className="text-slate-250">Coherence Mapping:</span> Managed inside <strong className="text-emerald-400 text-sky-400">Node 75 (Baroreceptor Tuning)</strong> and <strong className="text-emerald-400">Node 88 (Stellate Inhibition)</strong>.
                    </div>
                  </div>

                </div>

                <p className="text-[10px] text-slate-550 italic leading-relaxed font-mono">
                  Note: Patient active postural tracking leverages the smartphone/tablet/laptop visual frame balance limits (represented in Coherence as the dynamic kinetic sway index) providing a secure client-side proxy test for orthostatic stability.
                </p>
              </div>

            </div>

            {/* Right Rail: Interactive Genome Diagnostic Node Matrix (Pipes 8-12) */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="bg-slate-950/25 border border-slate-850 p-5 rounded-lg space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wide">AUTONOMIC OVERRIDES RESEARCH MAP</h4>
                </div>
                
                <p className="text-[11px] text-slate-450 leading-relaxed font-mono">
                  When clinicians deploy an override, they alter the biological hierarchy of the 10 Engines. Here is the literature reference model for each override:
                </p>

                <div className="space-y-3">
                  
                  {/* Freeze Override */}
                  <div className="p-3 bg-slate-950/70 border-l-2 border-rose-500 rounded space-y-1 text-xs">
                    <div className="flex justify-between font-mono">
                      <span className="font-bold text-rose-450">Freeze (Dorsal Vagal Lock)</span>
                      <span className="text-slate-500 uppercase text-[9px]">Polyvagal Theory</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Triggered by deep chronic metabolic overload. Standard vagal stimulation can catastrophically increase freeze state depth. Requires somatic high-frequency sensory decoupling, grounding exercises and heat protocols first to initiate safe transitions to sympathetic action before activating vagal calm.
                    </p>
                  </div>

                  {/* Neuroimmune Override */}
                  <div className="p-3 bg-slate-950/70 border-l-2 border-pink-550 rounded space-y-1 text-xs">
                    <div className="flex justify-between font-mono">
                      <span className="font-bold text-pink-400">Neuroimmune Cooldown</span>
                      <span className="text-slate-500 uppercase text-[9px]">Microglia Signaling</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Monitors cytoclinic storms, histamine overload, and BBB vascular leaking. Standard cognitive therapies are ineffective during active brain fog due to local neuro-inflammation. Prioritizes vagal tone suppression of histamine, photobiomodulation (VNS/laser), and neurovascular thermic cooling.
                    </p>
                  </div>

                  {/* Structural Override */}
                  <div className="p-3 bg-slate-950/70 border-l-2 border-amber-500 rounded space-y-1 text-xs">
                    <div className="flex justify-between font-mono">
                      <span className="font-bold text-amber-400">Structural Compression</span>
                      <span className="text-slate-500 uppercase text-[9px]">Biomechanics</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Cervical suboccipital tension (Atlanto-Occipital lock) compresses the jugular foramen. This blocks actual vagal efferent signal conduction. Standard visual breathing exercises are ineffective with physical pathway blockage. Prioritizes chin-tucks and AO decompression biomechanics.
                    </p>
                  </div>

                  {/* Performance Override */}
                  <div className="p-3 bg-slate-950/70 border-l-2 border-emerald-500 rounded space-y-1 text-xs">
                    <div className="flex justify-between font-mono">
                      <span className="font-bold text-emerald-400">Orthostatic Loading</span>
                      <span className="text-slate-500 uppercase text-[9px]">Aortic Arch Dynamics</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Baroreceptor tuning responds to orthostatic heart fluctuations, avoiding POTS/orthostatic distress. Employs isometric muscular compression sequences and tilt-shifting.
                    </p>
                  </div>

                  {/* Executive Override */}
                  <div className="p-3 bg-slate-950/70 border-l-2 border-violet-500 rounded space-y-1 text-xs">
                    <div className="flex justify-between font-mono">
                      <span className="font-bold text-violet-400">Prefrontal Cortical Brake</span>
                      <span className="text-slate-500 uppercase text-[9px]">Amygdala Regulation</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Supports direct intentional cortical down-regulation of hyperactive amygdala circuits through structured reframing and cognitive reallocation tasks.
                    </p>
                  </div>

                </div>

              </div>

            </div>

          </div>

          {/* Genome Core Scientific Standard Table */}
          <div className="bg-slate-950/25 border border-slate-850 p-5 rounded-lg space-y-4" id="genome-reference-standards-table">
            <div className="border-b border-slate-900 pb-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wide">The 17-Genome Physiological Node Reference Ledger</h4>
              <p className="text-[10px] text-slate-550 mt-1 font-mono">Scientific literature basis and direct recommendations for each somatic engine</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-500 uppercase text-[9px] font-bold">
                    <th className="py-3 px-4">Node Profile</th>
                    <th className="py-3 px-4">Anatomical System</th>
                    <th className="py-3 px-4 text-center">ESC Standards Base-Rate</th>
                    <th className="py-3 px-4">Physiological Guideline Intervention Basis</th>
                    <th className="py-3 px-4">Clinical Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 bg-slate-950/30">
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-slate-200 font-sans">Node 01: Vagus Nerve Tone</td>
                    <td className="py-3.5 px-4 text-rose-400">AUTONOMIC</td>
                    <td className="py-3.5 px-4 text-center text-sky-400 font-semibold">RMSSD &gt;50ms</td>
                    <td className="py-3.5 px-4 text-slate-350 font-sans">Paced respiration at 5.5s-6s resonance induces cardiovagal frequency oscillations to boost parasympathetic tone.</td>
                    <td className="py-3.5 px-4 text-slate-500 text-[10px]">Porges, S. (2011)</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-slate-200 font-sans">Node 03: Mast Cell Regulation</td>
                    <td className="py-3.5 px-4 text-pink-400">NEUROIMMUNE</td>
                    <td className="py-3.5 px-4 text-center text-slate-500">N/A (Histamine)</td>
                    <td className="py-3.5 px-4 text-slate-350 font-sans">VNS inhibits mast cell activation by releasing acetylcholine, binding to alpha-7-nicotinic receptors on macrophage lines.</td>
                    <td className="py-3.5 px-4 text-slate-500 text-[10px]">Tracey, K. J. (2009)</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-slate-200 font-sans">Node 07: Atlanto-Occipital Decompression</td>
                    <td className="py-3.5 px-4 text-amber-400">STRUCTURAL</td>
                    <td className="py-3.5 px-4 text-center text-slate-500">C1-C2 Alignment</td>
                    <td className="py-3.5 px-4 text-slate-350 font-sans">Restoring mechanical suboccipital glide uncompresses the vagus nerve (CN X) passing through the jugular foramen.</td>
                    <td className="py-3.5 px-4 text-slate-500 text-[10px]">Cramer, G. (2013)</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-slate-200 font-sans">Node 12: Stellate Ganglion Inhibition</td>
                    <td className="py-3.5 px-4 text-rose-450">AUTONOMIC</td>
                    <td className="py-3.5 px-4 text-center text-sky-400">Sympatho-Vagal Balance</td>
                    <td className="py-3.5 px-4 text-slate-350 font-sans">Blocks severe sympathetic storming. Mirrors real-world anesthetic stellate blocks using thermic and high-sensory counter-stimulation.</td>
                    <td className="py-3.5 px-4 text-slate-500 text-[10px]">Mulvaney, S. (2014)</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-slate-200 font-sans">Node 15: HRV Amplification</td>
                    <td className="py-3.5 px-4 text-emerald-400">PERFORMANCE</td>
                    <td className="py-3.5 px-4 text-center text-sky-400 font-semibold">SDNN &gt;100ms</td>
                    <td className="py-3.5 px-4 text-slate-350 font-sans">0.1 Hz respiratory synchrony matches baroreceptor reflex loop delay, maximizing heart rhythm pacing.</td>
                    <td className="py-3.5 px-4 text-slate-500 text-[10px]">Lehrer, P. (2020)</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-slate-200 font-sans">Node 16: Prefrontal Cortical Brake</td>
                    <td className="py-3.5 px-4 text-violet-400">EXECUTIVE</td>
                    <td className="py-3.5 px-4 text-center text-slate-500">fMRI Coherence</td>
                    <td className="py-3.5 px-4 text-slate-350 font-sans">Activates the prefrontal cortex during intense stress to stimulate the vagal pathway, inhibiting amygdala survival responses.</td>
                    <td className="py-3.5 px-4 text-slate-500 text-[10px]/9 pt-1">Thayer, J. F. (2012)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : showComparison && compEncounter1 && compEncounter2 ? (
        <div className="space-y-6 @container" id="side-by-side-comparison-view">
          {/* Comparison Header */}
          <div className="p-6 bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-850 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-cyan-500/5 filter blur-2xl rounded-r-2xl pointer-events-none" />
            <div className="space-y-1 relative z-10">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-400 px-2 py-0.5 border border-cyan-500/25 rounded uppercase">Comparison Sandbox</span>
                <span className="text-[9px] font-mono text-slate-500">SIDE-BY-SIDE CLINICAL PROFILING</span>
              </div>
              <h3 className="text-base font-bold text-slate-100 font-display">Comparative Biometric & Overrides Assessment</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans max-w-2xl">
                Analyzing autonomic divergence, active override timelines, and clinical notes between <strong className="text-cyan-455 font-bold font-mono">{compEncounter1.patientName}</strong> and <strong className="text-indigo-400 font-bold font-mono">{compEncounter2.patientName}</strong>.
              </p>
            </div>
            {onClearCompare && (
              <button
                onClick={onClearCompare}
                className="py-1.5 px-3 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-400 hover:text-slate-200 text-xs font-mono font-bold uppercase rounded-lg cursor-pointer transition-all shrink-0 z-10"
              >
                Clear Comparison ×
              </button>
            )}
          </div>

          {/* Side-by-Side Patient Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Patient 1 Profile Card */}
            <div className="bg-slate-950/40 border border-slate-850/80 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-start pb-3 border-b border-slate-900">
                <div>
                  <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-wider font-bold animate-pulse">Session A Reference</span>
                  <h4 className="text-sm font-bold text-white font-sans mt-0.5">{compEncounter1.patientName}</h4>
                  <p className="text-[10px] text-slate-500 font-mono">DOB: {compEncounter1.patientDob} • ID: {compEncounter1.id}</p>
                </div>
                <span className={`px-2 py-0.5 text-[9px] font-mono rounded font-bold uppercase ${
                  compEncounter1.status === 'completed' ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/30' : 'bg-blue-955/50 text-blue-400 border border-blue-500/30'
                }`}>
                  {compEncounter1.status}
                </span>
              </div>

              {/* Patient 1 Metrics Row */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-slate-950/60 p-3 border border-slate-900 rounded-xl text-center">
                  <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block">HRV Score</span>
                  <span className="text-base font-mono font-bold text-emerald-450 block mt-1">{compEncounter1.hrv}ms</span>
                </div>
                <div className="bg-slate-950/60 p-3 border border-slate-900 rounded-xl text-center">
                  <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block">Heart Rate</span>
                  <span className="text-base font-mono font-bold text-rose-455 block mt-1">{compEncounter1.heartRate} BPM</span>
                </div>
                <div className="bg-slate-950/60 p-3 border border-slate-900 rounded-xl text-center">
                  <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block">Sway Index</span>
                  <span className="text-base font-mono font-bold text-cyan-405 block mt-1">{compEncounter1.swayIndex}</span>
                </div>
              </div>

              {/* Patient 1 Overrides */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Active Override Deployments</span>
                <div className="flex flex-wrap gap-1.5">
                  {compEncounter1.activeOverrides.length === 0 ? (
                    <span className="text-[10px] text-slate-600 font-mono italic">No sensory overrides deployed</span>
                  ) : (
                    compEncounter1.activeOverrides.map((ov) => (
                      <span
                        key={ov}
                        className="px-2 py-1 bg-slate-900 border text-[9px] font-mono rounded-md font-bold uppercase"
                        style={{ borderColor: OVERRIDE_COLORS[ov] + '40', color: OVERRIDE_COLORS[ov] }}
                      >
                        {ov}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Patient 1 Timeline */}
              <div className="bg-slate-950/30 p-3.5 border border-slate-900 rounded-xl space-y-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Cortex Progress Timeline</span>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Current Reasoning Step:</span>
                  <span className="text-emerald-400 font-bold">Engine {compEncounter1.currentEngine}/10</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Max Engine Unlocked:</span>
                  <span className="text-indigo-400 font-bold">Engine {compEncounter1.maxVisitedEngine}/10</span>
                </div>
                <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden mt-1">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all" 
                    style={{ width: `${compEncounter1.maxVisitedEngine * 10}%` }}
                  />
                </div>
              </div>

              {/* Patient 1 Logged Symptoms */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-550 uppercase block font-bold">Logged Somatic Markers</span>
                <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                  {compEncounter1.observations.length === 0 ? (
                    <p className="text-[10px] text-slate-600 font-mono italic">No observations cataloged</p>
                  ) : (
                    compEncounter1.observations.map((obs, index) => (
                      <p key={index} className="text-[11px] text-slate-350 bg-slate-950/50 p-1.5 rounded border border-slate-900">
                        • {obs}
                      </p>
                    ))
                  )}
                </div>
              </div>

              {/* Patient 1 Clinical Notes */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-550 uppercase block font-bold">Encounter Progress Notes</span>
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-900 min-h-20 text-[11px] text-slate-300 font-sans italic whitespace-pre-wrap leading-relaxed">
                  {compEncounter1.notes || "No custom encounter notes documented yet."}
                </div>
              </div>
            </div>

            {/* Patient 2 Profile Card */}
            <div className="bg-slate-950/40 border border-slate-850/80 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-start pb-3 border-b border-slate-900">
                <div>
                  <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-wider font-bold animate-pulse">Session B Reference</span>
                  <h4 className="text-sm font-bold text-white font-sans mt-0.5">{compEncounter2.patientName}</h4>
                  <p className="text-[10px] text-slate-500 font-mono">DOB: {compEncounter2.patientDob} • ID: {compEncounter2.id}</p>
                </div>
                <span className={`px-2 py-0.5 text-[9px] font-mono rounded font-bold uppercase ${
                  compEncounter2.status === 'completed' ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/30' : 'bg-blue-955/50 text-blue-400 border border-blue-500/30'
                }`}>
                  {compEncounter2.status}
                </span>
              </div>

              {/* Patient 2 Metrics Row */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-slate-950/60 p-3 border border-slate-900 rounded-xl text-center">
                  <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block">HRV Score</span>
                  <span className="text-base font-mono font-bold text-emerald-450 block mt-1">{compEncounter2.hrv}ms</span>
                </div>
                <div className="bg-slate-950/60 p-3 border border-slate-900 rounded-xl text-center">
                  <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block">Heart Rate</span>
                  <span className="text-base font-mono font-bold text-rose-455 block mt-1">{compEncounter2.heartRate} BPM</span>
                </div>
                <div className="bg-slate-950/60 p-3 border border-slate-900 rounded-xl text-center">
                  <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block">Sway Index</span>
                  <span className="text-base font-mono font-bold text-cyan-405 block mt-1">{compEncounter2.swayIndex}</span>
                </div>
              </div>

              {/* Patient 2 Overrides */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Active Override Deployments</span>
                <div className="flex flex-wrap gap-1.5">
                  {compEncounter2.activeOverrides.length === 0 ? (
                    <span className="text-[10px] text-slate-600 font-mono italic">No sensory overrides deployed</span>
                  ) : (
                    compEncounter2.activeOverrides.map((ov) => (
                      <span
                        key={ov}
                        className="px-2 py-1 bg-slate-900 border text-[9px] font-mono rounded-md font-bold uppercase"
                        style={{ borderColor: OVERRIDE_COLORS[ov] + '40', color: OVERRIDE_COLORS[ov] }}
                      >
                        {ov}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Patient 2 Timeline */}
              <div className="bg-slate-950/30 p-3.5 border border-slate-900 rounded-xl space-y-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">Cortex Progress Timeline</span>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Current Reasoning Step:</span>
                  <span className="text-emerald-400 font-bold">Engine {compEncounter2.currentEngine}/10</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Max Engine Unlocked:</span>
                  <span className="text-indigo-400 font-bold">Engine {compEncounter2.maxVisitedEngine}/10</span>
                </div>
                <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden mt-1">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all" 
                    style={{ width: `${compEncounter2.maxVisitedEngine * 10}%` }}
                  />
                </div>
              </div>

              {/* Patient 2 Logged Symptoms */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-550 uppercase block font-bold">Logged Somatic Markers</span>
                <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                  {compEncounter2.observations.length === 0 ? (
                    <p className="text-[10px] text-slate-600 font-mono italic">No observations cataloged</p>
                  ) : (
                    compEncounter2.observations.map((obs, index) => (
                      <p key={index} className="text-[11px] text-slate-350 bg-slate-950/50 p-1.5 rounded border border-slate-900">
                        • {obs}
                      </p>
                    ))
                  )}
                </div>
              </div>

              {/* Patient 2 Clinical Notes */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-555 uppercase block font-bold">Encounter Progress Notes</span>
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-900 min-h-20 text-[11px] text-slate-300 font-sans italic whitespace-pre-wrap leading-relaxed">
                  {compEncounter2.notes || "No custom encounter notes documented yet."}
                </div>
              </div>
            </div>

          </div>

          {/* Combined Visual chart on comparison stats */}
          <div className="bg-slate-950/25 border border-slate-850 p-5 rounded-xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-900">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">Cross-Session Comparative Analytics Curve</span>
              <span className="text-[9px] font-mono text-slate-600">Autonomic parameters mapping</span>
            </div>
            <div className="w-full h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    {
                      name: compEncounter1.patientName.split(' ')[0],
                      'Heart Rate (BPM)': compEncounter1.heartRate,
                      'HRV Score (ms)': compEncounter1.hrv,
                      'Sway Index x10': compEncounter1.swayIndex * 10
                    },
                    {
                      name: compEncounter2.patientName.split(' ')[0],
                      'Heart Rate (BPM)': compEncounter2.heartRate,
                      'HRV Score (ms)': compEncounter2.hrv,
                      'Sway Index x10': compEncounter2.swayIndex * 10
                    }
                  ]}
                  margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#101725" vertical={false} />
                  <XAxis dataKey="name" stroke="#475569" fontSize={10} fontFamily="JetBrains Mono, monospace" tickLine={false} />
                  <YAxis stroke="#475569" fontSize={10} fontFamily="JetBrains Mono, monospace" tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }} />
                  <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', paddingTop: '10px' }} />
                  <Bar dataKey="HRV Score (ms)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Heart Rate (BPM)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Sway Index x10" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <>
          {encounters.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-slate-800 rounded flex flex-col items-center justify-center text-slate-500">
              <Brain className="w-12 h-12 text-slate-700 animate-pulse mb-3" />
              <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider font-mono">No Analytics Data Ready</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed font-mono">
                Create clinician records and log somatic encounters to begin charting clinical profiles.
              </p>
            </div>
          ) : (
            <>
              {/* Top Level KPIs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="dashboard-kpis">
                
                {/* KPI 1: Total & Active */}
                <div className="bg-slate-950/45 border border-slate-850/70 p-4 rounded flex flex-col justify-between">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">Total Sessions</span>
                  <div className="mt-2.5 flex items-baseline gap-2">
                    <span className="text-2xl font-mono font-bold text-slate-200">{stats.total}</span>
                    <span className="text-[10px] font-mono text-emerald-500">
                      ({stats.activeCount} active)
                    </span>
                  </div>
                  <div className="mt-2 text-[10px] text-slate-500 font-mono">
                    Across all patient cohorts
                  </div>
                </div>

                {/* KPI 2: Completion Rate */}
                <div className="bg-slate-950/45 border border-slate-850/70 p-4 rounded flex flex-col justify-between">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">Completion Rate</span>
                  <div className="mt-2.5 flex items-baseline gap-2">
                    <span className="text-2xl font-mono font-bold text-slate-200">{stats.completionRate}%</span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      {stats.completedCount} archived
                    </span>
                  </div>
                  <div className="mt-2 text-[10px] text-slate-500 font-mono">
                    Locked clinical coherence
                  </div>
                </div>

                {/* KPI 3: Avg Session Duration */}
                <div className="bg-slate-950/45 border border-slate-850/70 p-4 rounded flex flex-col justify-between">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">Avg Completed Duration</span>
                  <div className="mt-2.5 flex items-baseline gap-2">
                    <span className="text-2xl font-mono font-bold text-slate-200">
                      {stats.avgDurationSec > 0 ? formatDuration(stats.avgDurationSec) : 'N/A'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      secs
                    </span>
                  </div>
                  <div className="mt-2 text-[10px] text-slate-500 font-mono">
                    10-reasoning-engine speed
                  </div>
                </div>

                {/* KPI 4: Top Clinical Override */}
                <div className="bg-slate-950/45 border border-slate-850/70 p-4 rounded flex flex-col justify-between">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">Primary System Override</span>
                  <div className="mt-2.5 flex items-baseline gap-2">
                    {topOverride ? (
                      <>
                        <span 
                          className="text-lg font-mono font-bold truncate max-w-[130px] block" 
                          style={{ color: topOverride.color }}
                        >
                          {topOverride.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          (N={topOverride.Count})
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-mono font-bold text-slate-500">None Deployed</span>
                    )}
                  </div>
                  <div className="mt-2 text-[10px] text-slate-500 font-mono">
                    Most frequent autonomic shift
                  </div>
                </div>

              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-charts-row">
                
                {/* Chart Block 1: Override Frequencies (Bar Chart) - occupies 7 rails */}
                <div className="lg:col-span-7 bg-slate-950/25 border border-slate-850 p-4 rounded flex flex-col h-[340px]">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-900">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-emerald-400" />
                      <span className="text-[10px] font-mono text-slate-300 font-medium uppercase tracking-wider">Override Intervention Frequency</span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 uppercase">Triage Diagnostics</span>
                  </div>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={overrideFrequencyData}
                        margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#475569" 
                          fontSize={9} 
                          tickLine={false} 
                          fontFamily="JetBrains Mono, monospace"
                        />
                        <YAxis 
                          stroke="#475569" 
                          fontSize={9} 
                          tickLine={false}
                          allowDecimals={false}
                          fontFamily="JetBrains Mono, monospace"
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: '4px',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '11px'
                          }}
                          cursor={{ fill: '#1e293b', opacity: 0.2 }}
                        />
                        <Bar dataKey="Count" fill="#10b981" radius={[3, 3, 0, 0]}>
                          {overrideFrequencyData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart Block 2: Engine Level Distribution (Pie / Gauge / Area) - occupies 5 rails */}
                <div className="lg:col-span-5 bg-slate-950/25 border border-slate-850 p-4 rounded flex flex-col h-[340px]">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-900">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-emerald-400" />
                      <span className="text-[10px] font-mono text-slate-300 font-medium uppercase tracking-wider font-mono">Cortex Max depth reached</span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 uppercase">Engine 1-10</span>
                  </div>
                  <div className="flex-1 w-full min-h-0 flex flex-col justify-between">
                    <div className="h-52 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={engineProgressionData}
                          margin={{ top: 10, right: 10, left: -30, bottom: 5 }}
                        >
                          <defs>
                            <linearGradient id="engineGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis 
                            dataKey="Engine" 
                            stroke="#475569" 
                            fontSize={8} 
                            tickLine={false} 
                            fontFamily="JetBrains Mono, monospace"
                          />
                          <YAxis 
                            stroke="#475569" 
                            fontSize={9} 
                            tickLine={false}
                            allowDecimals={false}
                            fontFamily="JetBrains Mono, monospace"
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0f172a',
                              border: '1px solid #334155',
                              borderRadius: '4px',
                              fontFamily: 'JetBrains Mono, monospace',
                              fontSize: '11px'
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="Encounter Count" 
                            stroke="#10b981" 
                            strokeWidth={1.5}
                            fillOpacity={1} 
                            fill="url(#engineGrad)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] font-mono text-slate-500 leading-normal text-center italic mt-2">
                      Distribution of medical profiles based on absolute cortex progression depth.
                    </p>
                  </div>
                </div>

              </div>

              {/* Timeline Chart: Session Completion Durations */}
              {completionTimesData.length > 0 && (
                <div className="bg-slate-950/25 border border-slate-850 p-4 rounded flex flex-col h-[320px]" id="completion-times-chart-block">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-900">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      <span className="text-[10px] font-mono text-slate-300 font-medium uppercase tracking-wider">Session Completion Speed Progression</span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 uppercase">Chronological Archived Sessions</span>
                  </div>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={completionTimesData}
                        margin={{ top: 10, right: 20, left: -25, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis 
                          dataKey="patientName" 
                          stroke="#475569" 
                          fontSize={9} 
                          tickLine={false} 
                          fontFamily="JetBrains Mono, monospace"
                        />
                        <YAxis 
                          stroke="#475569" 
                          fontSize={9} 
                          tickLine={false}
                          label={{ value: 'Seconds', angle: -90, position: 'insideLeft', offset: -2, style: { fill: '#475569', fontSize: 9, fontFamily: 'JetBrains Mono', fontWeight: 'bold' } }}
                          fontFamily="JetBrains Mono, monospace"
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-slate-950 border border-slate-800 p-3 rounded font-mono text-[10px] text-slate-300 space-y-1">
                                  <p className="font-bold text-slate-100">{data.fullName}</p>
                                  <p>Session: {data.id}</p>
                                  <p className="text-emerald-400">Duration: {formatDuration(data['Duration (Sec)'])}</p>
                                  <p className="text-amber-400">HRV score: {data['HRV Score']} ms</p>
                                  <p>Engine index: {data['Max Engine']}/10</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend 
                          verticalAlign="top" 
                          height={32} 
                          iconType="circle"
                          iconSize={6}
                          wrapperStyle={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: '#64748b' }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="Duration (Sec)" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          dot={{ r: 3, strokeWidth: 0, fill: '#10b981' }}
                          activeDot={{ r: 5, strokeWidth: 0, fill: '#34d399' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="HRV Score" 
                          stroke="#38bdf8" 
                          strokeWidth={1.5}
                          strokeDasharray="4 4"
                          dot={{ r: 2, strokeWidth: 0, fill: '#38bdf8' }}
                          activeDot={{ r: 4, strokeWidth: 0, fill: '#7dd3fc' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Interactive Cohort Exploration Grid */}
              <div className="bg-slate-950/25 border border-slate-850 p-5 rounded space-y-4" id="cohort-data-browser">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-900 pb-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-250 uppercase font-mono tracking-wide">Cohort Patient Sessions Record Index</h3>
                    <p className="text-[10px] text-slate-550 mt-0.5 font-mono">Filter and lookup full clinician telemetry maps</p>
                  </div>

                  {/* Filters Panel */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by Patient name or ID..."
                        className="bg-slate-900 border border-slate-800 rounded px-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono w-full sm:w-60 transition-colors"
                      />
                    </div>

                    {/* Status Toggle buttons */}
                    <div className="flex border border-slate-800 rounded p-0.5 bg-slate-900">
                      {(['all', 'active', 'completed'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => setStatusFilter(st)}
                          className={`px-2.5 py-1 text-[9px] font-mono uppercase rounded transition-colors cursor-pointer ${
                            statusFilter === st 
                              ? 'bg-emerald-500/10 text-emerald-400 font-bold' 
                              : 'text-slate-500 hover:text-slate-350'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Structured Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-slate-850 text-slate-500 uppercase text-[9px] font-bold">
                        <th className="py-3 px-4">Patient Name / EHR ID</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Engine Progress</th>
                        <th className="py-3 px-4">Active Overrides</th>
                        <th className="py-3 px-4">HRV / HeartRate</th>
                        <th className="py-3 px-4">Time Elapsed</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 bg-slate-950/30">
                      {filteredSessions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-550 italic">
                            No clinical sessions match the active search parameters.
                          </td>
                        </tr>
                      ) : (
                        filteredSessions.map((enc) => {
                          const durationStr = enc.durationStr;

                          return (
                            <tr key={enc.id} className="hover:bg-slate-900/30 transition-colors group">
                              {/* Name & ID */}
                              <td className="py-3 px-4">
                                <div className="font-semibold text-slate-200 group-hover:text-slate-100 font-sans text-xs">{enc.patientName}</div>
                                <div className="text-[9px] text-slate-550 mt-0.5 font-mono">{enc.id}</div>
                              </td>

                              {/* Status */}
                              <td className="py-3 px-4">
                                {enc.status === 'completed' ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold">
                                    <CheckCircle className="w-2.5 h-2.5" />
                                    ARCHIVED
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[9px] text-blue-400 bg-blue-950/40 border border-blue-500/20 px-1.5 py-0.5 rounded font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                                    ACTIVE
                                  </span>
                                )}
                              </td>

                              {/* Engine progression index */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-300 font-bold">Eng {enc.maxVisitedEngine || enc.currentEngine}/10</span>
                                  <div className="w-12 bg-slate-800 rounded-full h-1 overflow-hidden hidden sm:block">
                                    <div 
                                      className="bg-emerald-400 h-full rounded-full" 
                                      style={{ width: `${((enc.maxVisitedEngine || enc.currentEngine) / 10) * 100}%` }}
                                    />
                                  </div>
                                </div>
                              </td>

                              {/* Overrides list */}
                              <td className="py-3 px-4">
                                {enc.activeOverrides && enc.activeOverrides.length > 0 ? (
                                  <div className="flex flex-wrap gap-1 max-w-[170px]">
                                    {enc.activeOverrides.map((over) => (
                                      <span 
                                        key={over} 
                                        className="text-[8px] font-bold uppercase py-0.5 px-1.5 rounded border"
                                        style={{ 
                                          color: OVERRIDE_COLORS[over],
                                          borderColor: `${OVERRIDE_COLORS[over]}30`,
                                          backgroundColor: `${OVERRIDE_COLORS[over]}10`
                                        }}
                                      >
                                        {over}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-600">No Overrides</span>
                                )}
                              </td>

                              {/* Heart Rate / HRV */}
                              <td className="py-3 px-4">
                                <span className="text-sky-400 font-bold">{enc.hrv}ms</span>
                                <span className="text-slate-500"> / {enc.heartRate} bpm</span>
                              </td>

                              {/* Duration elapsed */}
                              <td className="py-3 px-4 text-slate-400">
                                {durationStr}
                              </td>

                              {/* Go to session cockpit */}
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => {
                                    onSelectEncounter(enc.id);
                                    onClose();
                                  }}
                                  className="py-1 px-2.5 bg-emerald-500 hover:bg-emerald-400 hover:text-slate-950 font-bold rounded text-[9px] cursor-pointer transition-all uppercase tracking-wider text-slate-950"
                                >
                                  Load Workspace
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
