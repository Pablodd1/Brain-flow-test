/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BARCODE_PATIENTS } from '../genomeData';
import { Barcode, ScanLine, X, RefreshCw } from 'lucide-react';

interface BarcodeScannerModalProps {
  onClose: () => void;
  onScanComplete: (patientData: any) => void;
}

export default function BarcodeScannerModal({ onClose, onScanComplete }: BarcodeScannerModalProps) {
  const [scanning, setScanning] = useState(false);
  const [scannedPatient, setScannedPatient] = useState<any | null>(null);

  const handleScanPatient = (patient: any) => {
    setScanning(true);
    setScannedPatient(patient);

    // Simulate real scanning laser delay
    setTimeout(() => {
      setScanning(false);
      onScanComplete(patient);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4 z-50 animate-fade-in" id="barcode-scanner-modal-view">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-cyan-500/10 rounded-full filter blur-xl pointer-events-none" />
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-850 relative z-10">
          <div className="flex items-center gap-2">
            <Barcode className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">Coherence™ Patient Scan Station</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Laser scanner viewport representation */}
        <div className="bg-slate-950 rounded-2xl h-44 border border-slate-800/80 relative flex flex-col items-center justify-center p-4 overflow-hidden mb-6">
          {/* Grid lines background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:12px_12px]" />
          
          {scanning ? (
            <>
              {/* Laser Line */}
              <div className="absolute left-0 right-0 h-0.5 bg-cyan-400/90 shadow-[0_0_12px_rgba(34,211,238,0.8)] top-1/2 -translate-y-1/2 animate-bounce z-20" />
              <div className="text-center relative z-10 leading-normal">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-2" />
                <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-widest">
                  DECRYPTION COMPILATION IN PROGRESS...
                </span>
                <p className="text-[9px] font-mono text-slate-500 mt-1 uppercase">Reading: {scannedPatient?.name}</p>
              </div>
            </>
          ) : (
            <div className="text-center relative z-10 leading-normal max-w-xs">
              <ScanLine className="w-10 h-10 text-slate-500 mx-auto mb-2 animate-pulse" />
              <span className="text-xs font-mono text-slate-400 font-bold uppercase block tracking-wider">Awaiting laser trigger...</span>
              <p className="text-[10px] text-slate-500 mt-2">
                Click one of the patient pre-visit barcodes below to simulate a wrist-band scan at the clinical threshold.
              </p>
            </div>
          )}
        </div>

        {/* Patient buttons */}
        <div className="space-y-2 relative z-10">
          <label className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest block mb-1">Trigger Pre-Visit Badges</label>
          
          {BARCODE_PATIENTS.map((pat, idx) => (
            <button
              key={idx}
              disabled={scanning}
              onClick={() => handleScanPatient(pat)}
              className="w-full p-3 bg-slate-950/60 border border-slate-850 hover:border-cyan-500/50 hover:bg-slate-900 rounded-xl flex items-center justify-between text-left cursor-pointer transition-all disabled:opacity-50 group font-sans"
            >
              <div className="pr-3">
                <p className="text-xs font-bold text-white group-hover:text-cyan-400 leading-tight">
                  {pat.name}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">DOB: {pat.dob}</p>
                <p className="text-[9px] text-slate-400 mt-0.5 line-clamp-1 italic">
                  Intake: {pat.intake}
                </p>
              </div>
              <div className="shrink-0">
                <Barcode className="w-5 h-5 text-slate-600 group-hover:text-cyan-400" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
