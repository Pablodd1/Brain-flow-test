/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Shield, Brain, Activity, Key, ChevronRight } from 'lucide-react';

interface ClinicianAuthProps {
  onSuccess: (user: any) => void;
}

export default function ClinicianAuth({ onSuccess }: ClinicianAuthProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check / Create Clinician Profile
      const profRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(profRef);
      if (!docSnap.exists()) {
        await setDoc(profRef, {
          userId: user.uid,
          email: user.email || 'anonymous',
          name: user.displayName || 'Guest Clinician',
          createdAt: new Date()
        });
      }
      onSuccess(user);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Authentication failed. Popups might be blocked by your browser.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInAnonymously(auth);
      const user = result.user;

      // Assign a simulated clinician profile
      const profRef = doc(db, 'users', user.uid);
      await setDoc(profRef, {
        userId: user.uid,
        email: 'clinician.demo@coherence.health',
        name: 'Dr. Evelyn Moss (Clinician Demo)',
        createdAt: new Date()
      });

      onSuccess(user);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to initialize clinical demo session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-slate-100 font-sans" id="clinician-auth-view">
      {/* Glow Ambient Ring */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-violet-600/10 rounded-full filter blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative">
        {/* Logo and Branding */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-cyan-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20 mb-4 ring-1 ring-slate-800">
            <Brain className="w-8 h-8 text-slate-950" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white mb-1 font-sans">
            Coherence™
          </h1>
          <p className="text-xs font-mono text-cyan-400 tracking-widest uppercase">
            Clinician Mission Control App
          </p>
        </div>

        {/* Intro */}
        <div className="mb-8 p-4 bg-slate-950/50 rounded-xl border border-slate-800/40 text-sm">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-slate-200 font-medium font-sans">Clinical Reasoning Systems Gate</p>
              <p className="text-xs text-slate-400 mt-1">
                Enter Coherence™ Cockpit. Implements the 10-Engine Cortex clinical logic flow and the 17-node Genome laws.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-900/50 rounded-xl text-xs text-red-300">
            <p className="font-semibold mb-1">Authorization Deficit Detected:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            id="google-signin-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-750 active:scale-[0.98] transition-all rounded-xl font-medium font-sans text-sm border border-slate-750 flex items-center justify-center gap-3 text-white cursor-pointer disabled:opacity-50"
          >
            <Key className="w-4 h-4 text-cyan-400" />
            {loading ? 'Authenticating...' : 'Sign In with Google Credentials'}
          </button>

          <button
            id="demo-signin-btn"
            onClick={handleDemoSignIn}
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 active:scale-[0.98] text-slate-950 hover:text-slate-950 font-semibold font-sans text-sm rounded-xl transition-all shadow-md shadow-cyan-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>Initialize Clinician Demo Control</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Info Signpost */}
        <div className="mt-8 text-center flex items-center justify-center gap-2 text-xs text-slate-500 font-sans">
          <Activity className="w-3.5 h-3.5 text-cyan-500" />
          <span>Secured bio-cryptographic session</span>
        </div>
      </div>

      <div className="mt-8 text-center text-[10px] text-slate-600 font-mono tracking-wider max-w-sm">
        COHERENCE CLINICAL DECISION COGNITIVE NETWORKS • AGENT v5.12 • LICENSED RESEARCH PROTOCOL ONLY
      </div>
    </div>
  );
}
