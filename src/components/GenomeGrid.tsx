/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GENOME_NODES } from '../genomeData';
import { GenomeNode, OverrideType } from '../types';
import { Network, Search, Filter, ShieldAlert, ArrowRight, CornerDownRight, Sparkles } from 'lucide-react';

interface GenomeGridProps {
  activeOverrides: OverrideType[];
}

export default function GenomeGrid({ activeOverrides }: GenomeGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [selectedNode, setSelectedNode] = useState<GenomeNode | null>(null);

  // Determine if a node should highlight based on active overrides
  const getHighlightReason = (nodeId: number): string | null => {
    if (activeOverrides.includes('freeze') && (nodeId === 11 || nodeId === 12)) {
      return 'Freeze Override: Defilade Priority';
    }
    if (activeOverrides.includes('neuroimmune') && (nodeId === 3 || nodeId === 4 || nodeId === 5)) {
      return 'Neuroimmune Override: Quench System';
    }
    if (activeOverrides.includes('structural') && (nodeId === 6 || nodeId === 7 || nodeId === 8)) {
      return 'Structural Override: Decompress';
    }
    if (activeOverrides.includes('performance') && (nodeId === 10 || nodeId === 13 || nodeId === 15)) {
      return 'Performance Override: Optimization';
    }
    if (activeOverrides.includes('executive') && (nodeId === 16 || nodeId === 17)) {
      return 'Executive Override: Neural Inhibition';
    }
    return null;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Autonomic': return 'border-cyan-500 text-cyan-400 bg-cyan-950/25';
      case 'Neuroimmune': return 'border-red-500 text-red-400 bg-red-950/25';
      case 'Structural': return 'border-amber-500 text-amber-400 bg-amber-950/25';
      case 'Performance': return 'border-emerald-500 text-emerald-400 bg-emerald-950/25';
      case 'Executive': return 'border-violet-500 text-violet-400 bg-violet-950/25';
      default: return 'border-slate-500 text-slate-400 bg-slate-950/25';
    }
  };

  const filteredNodes = GENOME_NODES.filter(node => {
    const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          node.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || node.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-5 flex flex-col h-full relative" id="genome-grid-card">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-850">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-emerald-400" />
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Genome Node Network Map</h2>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Clinical Laws & Somatic Checkpoints</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-2.5">
          {['All', 'Autonomic', 'Neuroimmune', 'Structural', 'Performance', 'Executive'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`py-1 px-2.5 rounded text-[10px] font-mono font-medium border cursor-pointer transition-all ${
                filterCategory === cat
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-950/40 text-slate-500 border-slate-800 hover:text-slate-300 hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Warning Banners based on Active Overrides */}
      {activeOverrides.length > 0 && (
        <div className="mb-4 space-y-2.5" id="genome-grid-banners">
          {activeOverrides.map((override) => {
            if (override === 'freeze') {
              return (
                <div key="freeze" className="p-3 bg-red-950/30 border border-red-500/30 rounded flex items-start gap-2.5 shadow-sm animate-pulse">
                  <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-red-200">
                    <span className="font-bold text-red-400 uppercase tracking-wider block mb-0.5">FREEZE OVERRIDEActive</span>
                    Autonomic deflection protocol active. Standard mechanical pathways are deferred. Lock attention on Node 11 (Diaphragm Reset) and Node 12 (Stellate Ganglion Inhibition).
                  </div>
                </div>
              );
            }
            if (override === 'neuroimmune') {
              return (
                <div key="neuroimmune" className="p-3 bg-rose-950/20 border border-rose-500/30 rounded flex items-start gap-2.5 shadow-sm">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-rose-200">
                    <span className="font-bold text-rose-400 uppercase tracking-wider block mb-0.5">NEUROIMMUNE OVERRIDEActive</span>
                    Somatic storm markers are active. Prioritize microglial de-activation, histamine barrier stabilization processes.
                  </div>
                </div>
              );
            }
            if (override === 'structural') {
              return (
                <div key="structural" className="p-3 bg-amber-950/20 border border-amber-500/30 rounded flex items-start gap-2.5 shadow-sm">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-amber-200">
                    <span className="font-bold text-amber-400 uppercase tracking-wider block mb-0.5">STRUCTURAL OVERRIDEActive</span>
                    Biomechanical tension blockade discovered. Perform craniosacral sacral pumping and TMJ alignment triggers.
                  </div>
                </div>
              );
            }
            if (override === 'performance') {
              return (
                <div key="performance" className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded flex items-start gap-2.5 shadow-sm">
                  <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-emerald-200">
                    <span className="font-bold text-emerald-400 uppercase tracking-wider block mb-0.5">PERFORMANCE OVERRIDEActive</span>
                    Restoration of dynamic ceiling. Focus on baroreceptor gating, lung ventilation-perfusion ratios.
                  </div>
                </div>
              );
            }
            if (override === 'executive') {
              return (
                <div key="executive" className="p-3 bg-violet-950/20 border border-violet-500/30 rounded flex items-start gap-2.5 shadow-sm">
                  <ShieldAlert className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-violet-200">
                    <span className="font-bold text-violet-400 uppercase tracking-wider block mb-0.5">EXECUTIVE OVERRIDEActive</span>
                    Integrative frontal down-regulation pathway called. Target prefrontal cortical inhibition systems first.
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}

      {/* Nodes Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto max-h-[380px] pr-1 pb-4" id="genome-grid-elements">
        {filteredNodes.map((node) => {
          const highlightReason = getHighlightReason(node.id);
          const isHighlighted = highlightReason !== null;

          return (
            <div
              key={node.id}
              onClick={() => setSelectedNode(node)}
              className={`p-3 rounded border transition-all duration-300 flex flex-col justify-between cursor-pointer group relative overflow-hidden ${
                isHighlighted 
                  ? 'bg-slate-900 border-amber-500 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/30 transform scale-[1.01]' 
                  : 'bg-slate-950 border-slate-850 hover:bg-slate-900/70 hover:border-slate-700'
              }`}
            >
              {/* Highlight background flash */}
              {isHighlighted && (
                <div className="absolute inset-0 bg-amber-550/5 animate-pulse" />
              )}

              <div className="flex items-start justify-between relative z-10">
                <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider border ${getCategoryColor(node.category)}`}>
                  {node.category}
                </span>
                <span className="text-[10px] font-mono text-slate-600">ID: {node.id.toString().padStart(2, '0')}</span>
              </div>

              <div className="mt-3 text-xs text-left relative z-10">
                <h3 className={`font-semibold tracking-tight ${isHighlighted ? 'text-amber-400' : 'text-slate-200 group-hover:text-slate-100 font-bold'}`}>
                  {node.name}
                </h3>
                <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-normal group-hover:text-slate-450">
                  {node.description}
                </p>
              </div>

              {highlightReason && (
                <div className="mt-2.5 pt-1.5 border-t border-amber-500/20 text-[9px] font-mono text-amber-500 flex items-center gap-1 uppercase tracking-wider relative z-10 font-bold">
                  <Sparkles className="w-2.5 h-2.5 shrink-0" />
                  <span>OVERRIDE FOCUS</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Expanded Node Details Modal / Drawer */}
      {selectedNode && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4 z-50 animate-fade-in" id="node-modal">
          <div className="bg-slate-900 border border-slate-800 rounded-lg w-full max-w-lg p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-5 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase border ${getCategoryColor(selectedNode.category)}`}>
                  {selectedNode.category}
                </span>
                <h2 className="text-sm font-bold text-slate-100 font-display">Node {selectedNode.id.toString().padStart(2, '0')}: {selectedNode.name}</h2>
              </div>
              <button 
                onClick={() => setSelectedNode(null)} 
                className="text-slate-500 hover:text-white font-bold cursor-pointer text-xs font-mono uppercase tracking-wider transition-colors"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[9px] uppercase tracking-widest font-mono text-slate-500 font-bold">Biological Purpose & Mapping</label>
                <p className="text-slate-300 mt-1.5 text-xs leading-relaxed font-sans">{selectedNode.description}</p>
              </div>

              <div className="p-4 bg-slate-950 rounded border border-emerald-500/20 flex items-start gap-3">
                <CornerDownRight className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <label className="text-[9px] uppercase tracking-widest font-mono text-emerald-400 font-bold block mb-1">Clinical Coherence Regulation Guideline</label>
                  <p className="text-slate-405 text-xs leading-relaxed font-mono">{selectedNode.guideline}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button 
                onClick={() => setSelectedNode(null)}
                className="py-1.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded text-xs cursor-pointer tracking-wider font-mono uppercase transition-all"
              >
                Accept Directive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
