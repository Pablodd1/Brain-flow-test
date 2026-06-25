/// <reference types="vitest/globals" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GenomeGrid from './GenomeGrid';
import { GENOME_NODES } from '../genomeData';
import { OverrideType } from '../types';

describe('GenomeGrid', () => {
  it('renders correctly with no overrides', () => {
    render(<GenomeGrid activeOverrides={[]} />);
    expect(screen.getByText('Genome Node Network Map')).toBeInTheDocument();

    // Check if the filters are rendered
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Autonomic' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Neuroimmune' })).toBeInTheDocument();
  });

  it('filters nodes by category', () => {
    render(<GenomeGrid activeOverrides={[]} />);

    const autonomicButton = screen.getByRole('button', { name: 'Autonomic' });
    fireEvent.click(autonomicButton);

    // Should show autonomic nodes but not neuroimmune nodes
    const autonomicNode = GENOME_NODES.find(n => n.category === 'Autonomic');
    const neuroimmuneNode = GENOME_NODES.find(n => n.category === 'Neuroimmune');

    if (autonomicNode) expect(screen.getByText(autonomicNode.name)).toBeInTheDocument();
    if (neuroimmuneNode) expect(screen.queryByText(neuroimmuneNode.name)).not.toBeInTheDocument();
  });


  it('displays freeze override banner and highlights nodes', () => {
    render(<GenomeGrid activeOverrides={['freeze']} />);

    expect(screen.getByText(/FREEZE OVERRIDE/i)).toBeInTheDocument();

    const overrideFocusElements = screen.getAllByText('OVERRIDE FOCUS');
    expect(overrideFocusElements.length).toBe(2); // Node 11 and 12
  });

  it('displays neuroimmune override banner and highlights nodes', () => {
    render(<GenomeGrid activeOverrides={['neuroimmune']} />);

    expect(screen.getByText(/NEUROIMMUNE OVERRIDE/i)).toBeInTheDocument();

    const overrideFocusElements = screen.getAllByText('OVERRIDE FOCUS');
    expect(overrideFocusElements.length).toBe(3); // Node 3, 4, 5
  });

  it('displays structural override banner and highlights nodes', () => {
    render(<GenomeGrid activeOverrides={['structural']} />);

    expect(screen.getByText(/STRUCTURAL OVERRIDE/i)).toBeInTheDocument();

    const overrideFocusElements = screen.getAllByText('OVERRIDE FOCUS');
    expect(overrideFocusElements.length).toBe(3); // Node 6, 7, 8
  });

  it('displays performance override banner and highlights nodes', () => {
    render(<GenomeGrid activeOverrides={['performance']} />);

    expect(screen.getByText(/PERFORMANCE OVERRIDE/i)).toBeInTheDocument();

    const overrideFocusElements = screen.getAllByText('OVERRIDE FOCUS');
    expect(overrideFocusElements.length).toBe(3); // Node 10, 13, 15
  });

  it('displays executive override banner and highlights nodes', () => {
    render(<GenomeGrid activeOverrides={['executive']} />);

    expect(screen.getByText(/EXECUTIVE OVERRIDE/i)).toBeInTheDocument();

    const overrideFocusElements = screen.getAllByText('OVERRIDE FOCUS');
    expect(overrideFocusElements.length).toBe(2); // Node 16, 17
  });

  it('displays multiple override banners simultaneously', () => {
    render(<GenomeGrid activeOverrides={['freeze', 'executive']} />);

    expect(screen.getByText(/FREEZE OVERRIDE/i)).toBeInTheDocument();
    expect(screen.getByText(/EXECUTIVE OVERRIDE/i)).toBeInTheDocument();

    const overrideFocusElements = screen.getAllByText('OVERRIDE FOCUS');
    expect(overrideFocusElements.length).toBe(4); // 2 + 2
  });

  it('opens and closes node details modal', () => {
    render(<GenomeGrid activeOverrides={[]} />);

    // Find the first node and click it
    const firstNode = GENOME_NODES[0];
    const nodeElement = screen.getByText(firstNode.name);
    fireEvent.click(nodeElement);

    // Modal should appear
    expect(screen.getByText(`Node ${firstNode.id.toString().padStart(2, '0')}: ${firstNode.name}`)).toBeInTheDocument();
    expect(screen.getByText('Biological Purpose & Mapping')).toBeInTheDocument();
    expect(screen.getByText('Clinical Coherence Regulation Guideline')).toBeInTheDocument();

    // Accept Directive button
    const acceptButton = screen.getByRole('button', { name: /Accept Directive/i });
    expect(acceptButton).toBeInTheDocument();

    // Close modal via close button
    const closeButton = screen.getByText('✕ Close');
    fireEvent.click(closeButton);

    // Modal should disappear
    expect(screen.queryByText('Biological Purpose & Mapping')).not.toBeInTheDocument();
  });

  it('closes modal when Accept Directive is clicked', () => {
    render(<GenomeGrid activeOverrides={[]} />);

    // Open modal
    const firstNode = GENOME_NODES[0];
    const nodeElement = screen.getByText(firstNode.name);
    fireEvent.click(nodeElement);

    // Click Accept Directive
    const acceptButton = screen.getByRole('button', { name: /Accept Directive/i });
    fireEvent.click(acceptButton);

    // Modal should disappear
    expect(screen.queryByText('Biological Purpose & Mapping')).not.toBeInTheDocument();
  });
});
