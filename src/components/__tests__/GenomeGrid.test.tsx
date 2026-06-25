import { vi } from "vitest";
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GenomeGrid from '../GenomeGrid';
import { OverrideType } from '../../types';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Network: () => <div data-testid="icon-network" />,
  Search: () => <div data-testid="icon-search" />,
  Filter: () => <div data-testid="icon-filter" />,
  ShieldAlert: () => <div data-testid="icon-shield-alert" />,
  ArrowRight: () => <div data-testid="icon-arrow-right" />,
  CornerDownRight: () => <div data-testid="icon-corner-down-right" />,
  Sparkles: () => <div data-testid="icon-sparkles" />,
}));

// We'll mock genomeData to have a known set of test data
vi.mock('../../genomeData', () => ({
  GENOME_NODES: [
    { id: 1, name: 'Node 1', description: 'Desc 1', category: 'Autonomic', guideline: 'Guideline 1' },
    { id: 11, name: 'Diaphragm Reset', description: 'Desc 11', category: 'Structural', guideline: 'Guideline 11' },
    { id: 3, name: 'Quench Node', description: 'Desc 3', category: 'Neuroimmune', guideline: 'Guideline 3' },
  ],
}));

describe('GenomeGrid Component', () => {
  it('renders without crashing', () => {
    const { container } = render(<GenomeGrid activeOverrides={[]} />);
    expect(container).toBeInTheDocument();

    // Check main title
    expect(screen.getByText('Genome Node Network Map')).toBeInTheDocument();

    // Check nodes rendered (based on mocked GENOME_NODES)
    expect(screen.getByText('Node 1')).toBeInTheDocument();
    expect(screen.getByText('Diaphragm Reset')).toBeInTheDocument();
  });

  it('displays active override banners when provided', () => {
    render(<GenomeGrid activeOverrides={['freeze', 'neuroimmune']} />);

    // Check for freeze banner
    expect(screen.getByText(/FREEZE OVERRIDE/i)).toBeInTheDocument();
    expect(screen.getByText(/Autonomic deflection protocol active/i)).toBeInTheDocument();

    // Check for neuroimmune banner
    expect(screen.getByText(/NEUROIMMUNE OVERRIDE/i)).toBeInTheDocument();
    expect(screen.getByText(/Somatic storm markers are active/i)).toBeInTheDocument();

    // Should not display banners for unactive overrides
    expect(screen.queryByText(/STRUCTURAL OVERRIDE/i)).not.toBeInTheDocument();
  });

  it('filters nodes by category when category button clicked', () => {
    render(<GenomeGrid activeOverrides={[]} />);

    // All nodes should be visible initially
    expect(screen.getByText('Node 1')).toBeInTheDocument();
    expect(screen.getByText('Diaphragm Reset')).toBeInTheDocument();
    expect(screen.getByText('Quench Node')).toBeInTheDocument();

    // Click 'Autonomic' category filter
    fireEvent.click(screen.getByRole('button', { name: 'Autonomic' }));

    // Only 'Node 1' (Autonomic) should be visible
    expect(screen.getByText('Node 1')).toBeInTheDocument();
    expect(screen.queryByText('Diaphragm Reset')).not.toBeInTheDocument(); // Structural
    expect(screen.queryByText('Quench Node')).not.toBeInTheDocument(); // Neuroimmune

    // Click 'All' category filter to reset
    fireEvent.click(screen.getByRole('button', { name: 'All' }));

    // All nodes should be visible again
    expect(screen.getByText('Node 1')).toBeInTheDocument();
    expect(screen.getByText('Diaphragm Reset')).toBeInTheDocument();
    expect(screen.getByText('Quench Node')).toBeInTheDocument();
  });

  it('highlights correct nodes based on active overrides', () => {
    render(<GenomeGrid activeOverrides={['freeze']} />);

    // Node 11 (Diaphragm Reset) should be highlighted due to 'freeze' override
    expect(screen.getByText('OVERRIDE FOCUS')).toBeInTheDocument();
  });

  it('opens and closes expanded node modal when node is clicked', () => {
    render(<GenomeGrid activeOverrides={[]} />);

    // Modal should not be open
    expect(screen.queryByText(/Biological Purpose & Mapping/i)).not.toBeInTheDocument();

    // Click on a node
    fireEvent.click(screen.getByText('Node 1'));

    // Modal should now be open
    expect(screen.getByText(/Biological Purpose & Mapping/i)).toBeInTheDocument();
    expect(screen.getByText('Node 01: Node 1')).toBeInTheDocument(); // Formatted ID

    // Close the modal
    fireEvent.click(screen.getByRole('button', { name: /Close/i }));

    // Modal should be closed again
    expect(screen.queryByText(/Biological Purpose & Mapping/i)).not.toBeInTheDocument();
  });
});
