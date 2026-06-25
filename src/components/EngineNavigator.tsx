/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ENGINES } from '../genomeData';
import { OverrideType, ClinicalEncounter } from '../types';
import { 
  CheckSquare, ArrowLeft, ArrowRight, Clipboard, Plus, Trash2, 
  Sparkles, CheckCircle2, ShieldClose, Lock, Eye, Compass, HeartHandshake, Zap, BrainCircuit,
  Mic
} from 'lucide-react';

interface EngineNavigatorProps {
  encounter: ClinicalEncounter;
  onUpdateEncounter: (updated: Partial<ClinicalEncounter>) => void;
  onToggleOverride: (type: OverrideType) => void;
  onPinConfidence: () => void;
  onLockSession: () => Promise<void>;
  saving: boolean;
}

export default function EngineNavigator({
  encounter,
  onUpdateEncounter,
  onToggleOverride,
  onPinConfidence,
  onLockSession,
  saving
}: EngineNavigatorProps) {
  const [newObservation, setNewObservation] = useState('');
  const [obsError, setObsError] = useState<string | null>(null);

  // Micro-transcription state engine
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupportError, setSpeechSupportError] = useState('');
  const recognitionRef = useRef<any>(null);

  // Clean up recording on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startRecording = () => {
    setSpeechSupportError('');
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupportError('Speech recognition is not supported in this browser. Please try Chrome/Safari.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechSupportError('Microphone permission blocked. Please check your browser privacy tools.');
        } else {
          setSpeechSupportError(`Mic Error: ${event.error}`);
        }
        stopRecording();
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.onresult = (event: any) => {
        const transcriptParts = [];
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcriptParts.push(event.results[i][0].transcript);
          }
        }
        const transcript = transcriptParts.join('');
        if (transcript) {
          onUpdateEncounter({
            notes: encounter.notes ? `${encounter.notes} ${transcript.trim()}` : transcript.trim()
          });
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setSpeechSupportError('Could not initialize microphone channels.');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const toggleVoiceRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Track state transitions direction to power modern slides
  const [direction, setDirection] = useState(1);
  const [prevEngine, setPrevEngine] = useState(encounter.currentEngine);

  if (encounter.currentEngine !== prevEngine) {
    setDirection(encounter.currentEngine > prevEngine ? 1 : -1);
    setPrevEngine(encounter.currentEngine);
  }

  const slideVariants = {
    initial: (dir: number) => ({
      opacity: 0,
      x: dir * 30,
    }),
    animate: {
      opacity: 1,
      x: 0,
    },
    exit: (dir: number) => ({
      opacity: 0,
      x: dir * -30,
    }),
  };

  const currentEngineInfo = ENGINES.find(e => e.index === encounter.currentEngine) || ENGINES[0];

  const handleAddObservation = () => {
    setObsError(null);
    if (!newObservation.trim()) return;

    if (encounter.observations.includes(newObservation.trim())) {
      setObsError('This symptom marker is already logged.');
      return;
    }

    const updatedObs = [...encounter.observations, newObservation.trim()];
    onUpdateEncounter({ observations: updatedObs });
    setNewObservation('');
  };

  const handleRemoveObservation = (index: number) => {
    const updatedObs = encounter.observations.filter((_, idx) => idx !== index);
    onUpdateEncounter({ observations: updatedObs });
  };

  const handleNextEngine = () => {
    setObsError(null);
    if (encounter.currentEngine === 1 && encounter.observations.length < 3) {
      setObsError('State 1 Validation Failure: Please document at least 3 clinical observations to authorize progression.');
      return;
    }

    if (encounter.currentEngine === 3) {
      onPinConfidence(); // Instruct parent to pin the metacognition banner
    }

    const nextIndex = Math.min(10, encounter.currentEngine + 1);
    const maxVal = Math.max(encounter.maxVisitedEngine, nextIndex);
    onUpdateEncounter({ 
      currentEngine: nextIndex,
      maxVisitedEngine: maxVal
    });
  };

  const handlePrevEngine = () => {
    setObsError(null);
    const prevIndex = Math.max(1, encounter.currentEngine - 1);
    onUpdateEncounter({ currentEngine: prevIndex });
  };

  const handleDirectJump = (targetIndex: number) => {
    setObsError(null);
    // Can only jump if targetIndex is <= maxVisitedEngine
    if (targetIndex <= encounter.maxVisitedEngine) {
      onUpdateEncounter({ currentEngine: targetIndex });
    }
  };

  // Quick prepopulation options for Perception Engine
  const quickObservationSuggestions = [
    "Shallow accessory-muscle breathing patterns with elevated collar rise",
    "Resting Heart Rate oscillations pointing to sympathetic dominance",
    "Suboccipital trigger points restricting lateral rotation",
    "Restlessness showing vestibular balance drift",
    "Increased ocular hyper-vigilance during sensory mapping"
  ];

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-5 flex flex-col h-full" id="engine-navigator-container">
      {/* State Machine Steps Visual Road */}
      <div className="overflow-x-auto pb-4 mb-4 border-b border-slate-800" id="state-road-header">
        <div className="flex gap-2 min-w-[700px] justify-between">
          {ENGINES.map((eng) => {
            const isCurrent = eng.index === encounter.currentEngine;
            const isUnlocked = eng.index <= encounter.maxVisitedEngine;
            const isPassed = eng.index < encounter.currentEngine;

            return (
              <button
                key={eng.index}
                disabled={!isUnlocked}
                onClick={() => handleDirectJump(eng.index)}
                className={`py-1 px-2 rounded flex flex-col items-center justify-center text-center flex-1 transition-all border ${
                  isCurrent
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50 font-bold'
                    : isPassed
                      ? 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-900 cursor-pointer'
                      : isUnlocked
                        ? 'bg-slate-950/45 text-slate-500 border-slate-800 hover:bg-slate-900/80 hover:border-slate-700 cursor-pointer'
                        : 'bg-slate-950/10 text-slate-600 border-transparent cursor-not-allowed opacity-30 select-none'
                }`}
              >
                <span className="text-[8px] font-mono leading-none tracking-wider uppercase">Eng</span>
                <span className="text-sm font-mono font-bold mt-0.5">{eng.index.toString().padStart(2, '0')}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Focus Card */}
      <div className="bg-slate-950/50 rounded p-5 border border-slate-850 flex-1 flex flex-col mb-4">
        <div className="flex items-start justify-between gap-4 mb-3 pb-3 border-b border-slate-900">
          <div>
            <span className="text-[9px] font-mono text-emerald-400 tracking-wider uppercase font-bold">Cortex Reasoning Engine {currentEngineInfo.index}</span>
            <h3 className="text-sm font-bold text-slate-100 font-display tracking-tight mt-0.5">{currentEngineInfo.name}</h3>
            <p className="text-xs text-slate-400 mt-1">{currentEngineInfo.subtitle}</p>
          </div>
          <div className="px-3 py-1 bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-500 rounded font-bold">
            Focus: {encounter.currentEngine.toString().padStart(2, '0')}/10
          </div>
        </div>

        {/* Engine-Specific Interaction Modules */}
        <div className="flex-1 flex flex-col justify-between overflow-x-hidden p-0.5">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={encounter.currentEngine}
              custom={direction}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="flex-1 flex flex-col justify-between"
            >
              
              {/* STATE 1: Perception Engine */}
          {encounter.currentEngine === 1 && (
            <div className="space-y-4" id="engine-perception-view">
              <div className="p-4 bg-slate-950/70 border border-slate-850 rounded">
                <label className="text-[9px] font-mono text-slate-400 font-bold uppercase block mb-1">Clinical Observation Logging</label>
                <p className="text-xs text-slate-400 leading-normal">
                  Document patient somatic markers. Security policy mandates compiling a minimum of <strong>3</strong> baseline markers before formulating Pattern Recognition Overrides.
                </p>
                
                {/* Input block */}
                <div className="flex gap-2.5 mt-3">
                  <input
                    type="text"
                    value={newObservation}
                    placeholder="Enter observation (e.g. shallow chest breathing)..."
                    onChange={(e) => setNewObservation(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddObservation()}
                    className="flex-1 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none font-sans"
                  />
                  <button
                    onClick={handleAddObservation}
                    className="py-2 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold rounded text-xs flex items-center gap-1 tracking-wider uppercase cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
                {obsError && <p className="text-[10px] font-medium text-red-450 mt-2 font-mono">{obsError}</p>}
              </div>

              {/* Suggestions Quick Buttons */}
              <div>
                <label className="text-[9px] uppercase tracking-wider font-mono text-slate-500 block mb-1.5 font-bold">Simulation Shortcuts (Prepopulation):</label>
                <div className="flex flex-wrap gap-1.5">
                  {quickObservationSuggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (!encounter.observations.includes(sug)) {
                          onUpdateEncounter({ observations: [...encounter.observations, sug] });
                        }
                      }}
                      className="py-1 px-2.5 bg-slate-900 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-slate-300 text-[9px] rounded cursor-pointer text-left font-sans leading-tight max-w-[280px] transition-colors"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Logged List */}
              <div className="flex-1 min-h-[120px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Logged Markers ({encounter.observations.length})</span>
                  {encounter.observations.length >= 3 ? (
                    <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      SYSTEM LOCK UNLOCKED
                    </span>
                  ) : (
                    <span className="text-[10px] text-red-450 font-mono font-bold uppercase">
                      MIN. 3 REQUIRED ({3 - encounter.observations.length} left)
                    </span>
                  )}
                </div>

                {encounter.observations.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-slate-800 rounded text-xs text-slate-500 font-mono">
                    No clinical observations documented. Record symptoms to initialize tracking.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                    {encounter.observations.map((obs, idx) => (
                      <div key={idx} className="flex items-start justify-between gap-3 bg-slate-900/60 border border-slate-850/60 rounded p-2.5">
                        <div className="flex gap-2">
                          <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-xs text-slate-300">{obs}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveObservation(idx)}
                          className="text-slate-550 hover:text-red-400 cursor-pointer shrink-0 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STATE 2: Pattern Recognition Engine */}
          {encounter.currentEngine === 2 && (
            <div className="space-y-4" id="engine-pattern-view">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                <label className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block mb-1">Cortex Override Diagnostics</label>
                <p className="text-xs text-slate-400 leading-normal">
                  Based on observations, toggle high-stakes clinical safety overrides. Activating overrides adapts clinical layouts, highlights relevant genome nodes, and focuses your intervention priorities.
                </p>
              </div>

              {/* Overrides Selection Panel */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* FREEZE OVERRIDE */}
                <button
                  id="btn-override-freeze"
                  onClick={() => onToggleOverride('freeze')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    encounter.activeOverrides.includes('freeze')
                      ? 'bg-red-500/10 border-red-500 text-red-200'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs font-sans">1. Freeze Override</span>
                    <span className={`w-2 h-2 rounded-full ${encounter.activeOverrides.includes('freeze') ? 'bg-red-500 animate-ping' : 'bg-slate-700'}`} />
                  </div>
                  <p className="text-[10px] mt-1 leading-normal text-slate-350">
                    Deflection priority. Defers normal loading. Highlighting Node 11 (Diaphragm Reset) & Node 12 (Stellate Ganglion Inhibition).
                  </p>
                </button>

                {/* NEUROIMMUNE OVERRIDE */}
                <button
                  id="btn-override-neuroimmune"
                  onClick={() => onToggleOverride('neuroimmune')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    encounter.activeOverrides.includes('neuroimmune')
                      ? 'bg-rose-500/10 border-rose-500 text-rose-200'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs font-sans">2. Neuroimmune Override</span>
                    <span className={`w-2 h-2 rounded-full ${encounter.activeOverrides.includes('neuroimmune') ? 'bg-rose-500' : 'bg-slate-700'}`} />
                  </div>
                  <p className="text-[10px] mt-1 leading-normal text-slate-350">
                    Target metabolic storms. Focusing Node 3 (Mast Cell), Node 4 (Microglia), and Node 5 (Blood-Brain Barrier).
                  </p>
                </button>

                {/* STRUCTURAL OVERRIDE */}
                <button
                  id="btn-override-structural"
                  onClick={() => onToggleOverride('structural')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    encounter.activeOverrides.includes('structural')
                      ? 'bg-amber-500/10 border-amber-500 text-amber-200'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs font-sans">3. Structural Override</span>
                    <span className={`w-2 h-2 rounded-full ${encounter.activeOverrides.includes('structural') ? 'bg-amber-500' : 'bg-slate-700'}`} />
                  </div>
                  <p className="text-[10px] mt-1 leading-normal text-slate-350">
                    Manage severe mechanical locking blocks. Focus on C1 occipital decompression & TMJ resets.
                  </p>
                </button>

                {/* PERFORMANCE OVERRIDE */}
                <button
                  id="btn-override-performance"
                  onClick={() => onToggleOverride('performance')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    encounter.activeOverrides.includes('performance')
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-200'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs font-sans">4. Performance Override</span>
                    <span className={`w-2 h-2 rounded-full ${encounter.activeOverrides.includes('performance') ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                  </div>
                  <p className="text-[10px] mt-1 leading-normal text-slate-350">
                    Calibrate autonomic ceiling range. Highlight Baroreceptors and HRV visually.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* STATE 3: Confidence Engine */}
          {encounter.currentEngine === 3 && (
            <div className="space-y-4" id="engine-confidence-view">
              <div className="p-4 bg-red-950/20 border border-red-500/60 rounded-xl">
                <span className="text-[10px] font-mono text-red-400 tracking-wider uppercase block mb-1">Clinician Warning Safeguard</span>
                <p className="text-sm font-semibold text-white leading-normal">
                  "Am I anchoring? Am I open to being wrong?"
                </p>
                <p className="text-xs text-red-300/80 leading-normal mt-2">
                  Heuristic analysis indicates that clinical errors spike within minutes of a tentative pattern match because clinicians lock onto their initial diagnosis. Keep this metacognition question pinned as a diagnostic check.
                </p>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl space-y-3">
                <label className="text-[10px] font-mono text-slate-400 font-bold uppercase">Clinician Confirmation Check</label>
                <div className="flex items-start gap-2.5">
                  <input type="checkbox" className="mt-1 shrink-0" id="bias-check-checkbox-1" />
                  <p className="text-xs text-slate-300">I have actively parsed alternative diagnoses (e.g., differential somatic dysfunctions vs. pure autonomic anxiety states).</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <input type="checkbox" className="mt-1 shrink-0" id="bias-check-checkbox-2" />
                  <p className="text-xs text-slate-300">I agree to pivot our neuro-somatic strategy if live patient telemetry indicators reveal negative autonomic trending.</p>
                </div>
              </div>
            </div>
          )}

          {/* STATES 4 to 9: Unfolding progressions */}
          {encounter.currentEngine >= 4 && encounter.currentEngine <= 9 && (
            <div className="space-y-4 font-sans text-left" id="engine-progressive-view">
              <div className="p-4 bg-slate-950/70 border border-slate-850 rounded-xl">
                <label className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider block mb-1.5">Action Checklist</label>
                
                {/* Custom questions to ensure genuine engagement during progressive study */}
                {encounter.currentEngine === 4 && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-300 leading-normal"><strong>Reserve Gating:</strong> Evaluate the current physiological battery capacity before scheduling load tests.</p>
                    <div className="p-3 bg-slate-900 rounded-lg space-y-2">
                      <label className="flex items-center gap-2 text-xs text-slate-200">
                        <input type="checkbox" /> Patient sleeps &gt; 7 hours regularly
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-200">
                        <input type="checkbox" /> Metabolic cellular fuels mapped (mitochondrial pathways)
                      </label>
                    </div>
                  </div>
                )}

                {encounter.currentEngine === 5 && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-300 leading-normal"><strong>Sequencing Hierarchy:</strong> Verify safety priorities. High-intensity cerebral focus exercises fail if pre-visit somatic tension blocks the vagus route.</p>
                    <div className="p-3 bg-slate-900 rounded-lg space-y-2">
                      <label className="flex items-center gap-2 text-xs text-slate-200">
                        <input type="checkbox" /> Autonomic balance verified as safe prefix
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-200">
                        <input type="checkbox" /> Secondary structural alignments cataloged
                      </label>
                    </div>
                  </div>
                )}

                {encounter.currentEngine === 6 && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-300 leading-normal"><strong>Therapeutic Alliance:</strong> Align patient cognitive expectations. Confirm deep presence before starting visceral maneuvers.</p>
                    <div className="p-3 bg-slate-900 rounded-lg space-y-2">
                      <label className="flex items-center gap-2 text-xs text-slate-200">
                        <input type="checkbox" /> Deep collaborative resonance built
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-200">
                        <input type="checkbox" /> Active therapeutic boundaries declared
                      </label>
                    </div>
                  </div>
                )}

                {encounter.currentEngine === 7 && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-300 leading-normal"><strong>Neuromodulation Intervention:</strong> Execute physical task maneuvers for highlighted Genome Nodes.</p>
                    <div className="p-3 bg-slate-900 rounded-lg space-y-2">
                      {encounter.activeOverrides.map((ov) => (
                        <div key={ov} className="text-xs text-cyan-400 font-mono flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 shrink-0" /> Override Active: Prioritizing {ov.toUpperCase()} Guidelines!
                        </div>
                      ))}
                      {encounter.activeOverrides.length === 0 && (
                        <p className="text-[11px] text-slate-400">Regular clinical sequencing active. Work through standard vagal stimulus routines.</p>
                      )}
                    </div>
                  </div>
                )}

                {encounter.currentEngine === 8 && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-300 leading-normal"><strong>Autonomic Response Shift:</strong> Look at the simulated live Sensory bio-feed on the right to track stress de-escalation results.</p>
                    <div className="p-3 bg-slate-900 rounded-lg space-y-2">
                      <label className="flex items-center gap-2 text-xs text-slate-200">
                        <input type="checkbox" /> Telemetry signals moving towards homeostatic baselines
                      </label>
                    </div>
                  </div>
                )}

                {encounter.currentEngine === 9 && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-300 leading-normal"><strong>Clinician Learning Integration:</strong> Update system heuristic memory. Reflect on discrepancies between anticipated values and observed outcomes.</p>
                    <div className="p-3 bg-slate-900 rounded-lg space-y-2">
                      <label className="flex items-center gap-2 text-xs text-slate-200">
                        <input type="checkbox" /> Archival insights logged for database memory syncing
                      </label>
                    </div>
                  </div>
                )}
              </div>

               {/* Progress text notes input */}
              <div className="space-y-1.5 font-sans relative">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider block">Practitioner Encounter Progress Notes</label>
                  <button
                    type="button"
                    onClick={toggleVoiceRecording}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase transition-all border cursor-pointer ${
                      isRecording
                        ? 'bg-rose-950/40 border-rose-500 text-rose-400 animate-pulse font-extrabold'
                        : 'bg-slate-950/60 border-slate-850 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                    title="Dictate observations directly"
                  >
                    <Mic className={`w-2.5 h-2.5 ${isRecording ? 'text-rose-450 animate-bounce' : 'text-slate-500'}`} />
                    {isRecording ? 'Listening (Click to Save)' : 'Record (Mic Input)'}
                  </button>
                </div>
                <textarea
                  value={encounter.notes}
                  placeholder="Record insights, dictations, raw thresholds, or therapeutic metrics..."
                  onChange={(e) => onUpdateEncounter({ notes: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded p-3 h-20 text-xs text-slate-200 focus:outline-none focus:ring-0 font-sans resize-none"
                />
                {speechSupportError && (
                  <p className="text-[8px] font-mono text-rose-400 font-bold uppercase tracking-wider mt-0.5 leading-none">
                    ⚠️ {speechSupportError}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STATE 10: Meaning Engine (Lockdown State) */}
          {encounter.currentEngine === 10 && (
            <div className="space-y-4" id="engine-final-view">
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded space-y-1.5">
                <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">Final Integration Unlocked</span>
                <p className="text-sm font-bold text-slate-100 font-display">Synthesize Session Outcomes & Secure Archive</p>
                <p className="text-xs text-slate-400 leading-normal">
                  All 10 Cortex reasoning engines successfully evaluated. Ready to lock and write this session to our permanent Zero-Trust Cloud record. Once processed, clinical details become immutable.
                </p>
              </div>

              <div className="p-4 bg-slate-900/60 border border-slate-850 rounded font-sans text-xs space-y-2.5">
                <p className="font-semibold text-slate-300 font-mono text-[10px] uppercase tracking-wider">Session Summary Checklist:</p>
                <div className="flex items-center gap-2.5">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-slate-300 font-mono text-[11px]">{encounter.observations.length} Clinical Observation metrics captured</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-slate-300 font-mono text-[11px]">{encounter.activeOverrides.length} Active System Overrides managed</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-slate-300 font-mono text-[11px]">End Metrics: HRV ({encounter.hrv}ms), HR ({encounter.heartRate}BPM)</span>
                </div>
              </div>

              <button
                id="lock-session-btn"
                onClick={onLockSession}
                disabled={saving}
                className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] transition-all text-slate-950 font-mono font-bold rounded text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                <Lock className="w-4 h-4 text-slate-950" />
                {saving ? 'SECURING CLINICAL CONTRACT...' : 'LOCK & FINALIZE CLINICAL ENCOUNTER'}
              </button>
            </div>
          )}
            </motion.div>
          </AnimatePresence>

          {/* Bottom Action Navigation */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-800" id="engine-navigation-controls-footer">
            <button
              onClick={handlePrevEngine}
              disabled={encounter.currentEngine === 1}
              className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded text-xs font-mono tracking-wider uppercase flex items-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              Prev Engine
            </button>

            {encounter.currentEngine < 10 ? (
              <button
                id="engine-next-btn"
                onClick={handleNextEngine}
                className="py-2 px-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:text-slate-950 font-mono font-bold rounded text-xs tracking-wider uppercase flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
              >
                Next Engine
                <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
              </button>
            ) : (
              <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1 uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                Step 10 Complete
              </span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
