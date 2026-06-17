/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { Activity, Radio, AlertTriangle, Battery, ShieldAlert, Heart, TrendingUp } from 'lucide-react';

interface SensoryFeedProps {
  heartRate: number;
  hrv: number;
  swayIndex: number;
  onMetricUpdate: (metrics: { heartRate: number; hrv: number; swayIndex: number }) => void;
  overrideActive: boolean;
}

export default function SensoryFeed({ heartRate, hrv, swayIndex, onMetricUpdate, overrideActive }: SensoryFeedProps) {
  const [anomalyMode, setAnomalyMode] = useState<boolean>(false);
  const [pulseWave, setPulseWave] = useState<number[]>(Array(40).fill(50));
  const waveIndexRef = useRef(0);

  // Dynamic simulation of metrics
  useEffect(() => {
    const interval = setInterval(() => {
      let deltaHR = Math.floor(Math.random() * 5) - 2; // -2 to +2
      let deltaHRV = Math.floor(Math.random() * 7) - 3; // -3 to +3
      let deltaSway = (Math.random() * 0.4) - 0.2; // -0.2 to +0.2

      let targetHR = heartRate;
      let targetHRV = hrv;
      let targetSway = swayIndex;

      // Anomaly Mode: severe distress simulation
      if (anomalyMode) {
        targetHR = Math.max(95, Math.min(140, heartRate + Math.floor(Math.random() * 8) - 2));
        targetHRV = Math.max(8, Math.min(22, hrv - Math.floor(Math.random() * 4)));
        targetSway = Math.min(8.5, Math.max(5.0, swayIndex + (Math.random() * 0.6) - 0.1));
      } else if (overrideActive) {
        // Safe reset override: peaceful stabilization
        targetHR = Math.max(58, Math.min(72, heartRate - Math.floor(Math.random() * 4)));
        targetHRV = Math.min(95, Math.max(55, hrv + Math.floor(Math.random() * 5)));
        targetSway = Math.max(0.5, Math.min(2.2, swayIndex - 0.1));
      } else {
        // Standard fluctuations
        targetHR = Math.max(65, Math.min(95, heartRate + deltaHR));
        targetHRV = Math.max(25, Math.min(65, hrv + deltaHRV));
        targetSway = Math.max(1.0, Math.min(4.5, swayIndex + deltaSway));
      }

      onMetricUpdate({
        heartRate: Math.round(targetHR),
        hrv: Math.round(targetHRV),
        swayIndex: parseFloat(targetSway.toFixed(2))
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [heartRate, hrv, swayIndex, anomalyMode, overrideActive, onMetricUpdate]);

  // Telemetry Oscilloscope pulse wave simulation
  useEffect(() => {
    const drawWave = () => {
      setPulseWave((prev) => {
        const next = [...prev.slice(1)];
        // Generate ECG-like complexes
        const t = waveIndexRef.current % 12;
        let value = 50; // baseline
        if (anomalyMode) {
          // Tachycardia, chaotic pulse
          if (t === 2) value = 15; // Q
          else if (t === 3) value = 95; // R
          else if (t === 4) value = 30; // S
          else if (t === 6) value = 62; // T
        } else {
          // Regular sinus wave
          if (t === 3) value = 10; // Q
          else if (t === 4) value = 90; // R
          else if (t === 5) value = 35; // S
          else if (t === 7) value = 60; // T
        }
        // Add minor static noise
        value += (Math.random() * 4 - 2);
        next.push(value);
        return next;
      });
      waveIndexRef.current += 1;
    };

    const interval = setInterval(drawWave, 100);
    return () => clearInterval(interval);
  }, [anomalyMode]);

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 flex flex-col h-full select-none" id="sensory-feed-card">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Radio className={`w-3.5 h-3.5 ${anomalyMode ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`} />
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Live Sensory Feed</h2>
        </div>
        <div className="flex gap-1.5 items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">LIVE FEED</span>
        </div>
      </div>

      {/* Visual Oscilloscope / EKG SVG */}
      <div className="bg-slate-950 rounded border border-slate-800/80 h-24 flex flex-col justify-between mb-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.02)_1px,transparent_1px)] bg-[size:10px_10px]" />
        
        <svg viewBox="0 0 400 100" className="w-full h-full" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke={anomalyMode ? "rgba(239, 68, 68, 0.85)" : "rgba(16, 185, 129, 0.85)"}
            strokeWidth="1.5"
            points={pulseWave.map((val, idx) => `${(idx * 400) / 39},${val}`).join(' ')}
          />
        </svg>
        <span className="absolute bottom-1 right-2 text-[8px] font-mono text-slate-500 uppercase tracking-wider">Resonant Vagal Sinus</span>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {/* Heart Rate */}
        <div className="bg-slate-950/50 p-2.5 rounded border border-slate-850 flex flex-col items-center justify-center text-center">
          <Heart className={`w-3.5 h-3.5 mb-1 ${anomalyMode ? 'text-red-500 animate-bounce' : 'text-rose-500'}`} />
          <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">Heart Rate</span>
          <span className="text-base font-mono font-bold text-slate-100 mt-1">
            {heartRate}<span className="text-[9px] text-slate-550 font-normal ml-0.5">BPM</span>
          </span>
        </div>

        {/* HRV */}
        <div className="bg-slate-950/50 p-2.5 rounded border border-slate-850 flex flex-col items-center justify-center text-center">
          <Activity className="w-3.5 h-3.5 text-emerald-400 mb-1" />
          <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">HRV ( RSA )</span>
          <span className="text-base font-mono font-bold text-emerald-400 mt-1">
            {hrv}<span className="text-[9px] text-emerald-500/60 font-normal ml-0.5">ms</span>
          </span>
        </div>

        {/* Sway Index */}
        <div className="bg-slate-950/50 p-2.5 rounded border border-slate-850 flex flex-col items-center justify-center text-center">
          <TrendingUp className="w-3.5 h-3.5 text-sky-400 mb-1" />
          <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">Sway Index</span>
          <span className="text-base font-mono font-bold text-sky-450 mt-1">
            {swayIndex}<span className="text-[9px] text-sky-500/60 font-normal ml-0.5">BSI</span>
          </span>
        </div>
      </div>

      {/* Distress Controller Area */}
      <div className="mt-auto pt-4 border-t border-slate-800">
        <label className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-widest block mb-2 text-center">Somatic Simulation Controls</label>
        <button
          id="toggle-anomaly-btn"
          onClick={() => setAnomalyMode(!anomalyMode)}
          className={`w-full py-2 px-3 rounded text-[10px] font-mono font-bold uppercase transition-all tracking-wider flex items-center justify-center gap-2 cursor-pointer border ${
            anomalyMode 
              ? 'bg-red-950/30 text-red-400 border-red-900/60 hover:bg-red-900/40' 
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
        >
          <AlertTriangle className={`w-3.5 h-3.5 ${anomalyMode ? 'animate-ping' : ''}`} />
          {anomalyMode ? 'DISMISS DISTRESS WAVE' : 'SIMULATE COMPLAINT TRIGGER'}
        </button>

        {anomalyMode ? (
          <div className="mt-3 p-3 bg-slate-950 rounded border border-red-500/30 flex items-start gap-2.5 text-[10px] text-red-400">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <p className="leading-relaxed">
              <strong>ANOMALY REPORTED:</strong> Autonomic breakdown simulated. High heart pacing, critical HRV drop, elevated somatic postural sway. Safety Overrides are recommended!
            </p>
          </div>
        ) : (
          <div className="mt-3 p-3 bg-slate-950 rounded border border-slate-800 flex items-start gap-2.5 text-[10px] text-slate-500">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0 animate-pulse" />
            <p className="leading-snug italic font-mono">
              Patient telemetry is stabilized. System coherence laws are operating cleanly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
