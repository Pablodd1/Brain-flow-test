import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HistoricEncounters from './HistoricEncounters';
import { ClinicalEncounter } from '../types';

const mockEncounters: ClinicalEncounter[] = [
  {
    id: '1',
    ownerId: 'owner1',
    patientName: 'John Doe',
    patientDob: '1980-01-01',
    preVisitIntake: 'Headache',
    currentEngine: 1,
    maxVisitedEngine: 2,
    observations: [],
    activeOverrides: [],
    notes: '',
    heartRate: 80,
    hrv: 40,
    swayIndex: 0.5,
    status: 'active',
    createdAt: { seconds: 1672531200 }, // 2023-01-01T00:00:00Z
    updatedAt: { seconds: 1672531200 },
  },
  {
    id: '2',
    ownerId: 'owner1',
    patientName: 'Jane Smith',
    patientDob: '1990-02-02',
    preVisitIntake: 'Back pain',
    currentEngine: 3,
    maxVisitedEngine: 3,
    observations: [],
    activeOverrides: [],
    notes: '',
    heartRate: 75,
    hrv: 45,
    swayIndex: 0.3,
    status: 'completed',
    createdAt: new Date('2023-02-01T10:00:00Z'),
    updatedAt: new Date('2023-02-01T10:00:00Z'),
  },
];

describe('HistoricEncounters', () => {
  const defaultProps = {
    encounters: mockEncounters,
    activeEncounterId: null,
    onSelectEncounter: vi.fn(),
    onStartNewEncounter: vi.fn(),
    onBarcodeScanClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component title and buttons', () => {
    render(<HistoricEncounters {...defaultProps} />);

    expect(screen.getByText(/Encounter Archives & Logs/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Barcode Scan Intake/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New blank encounter/i })).toBeInTheDocument();
  });

  it('renders a list of encounters', () => {
    render(<HistoricEncounters {...defaultProps} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('renders the empty state when no encounters are provided', () => {
    render(<HistoricEncounters {...defaultProps} encounters={[]} />);

    expect(screen.getByText(/No patient sessions archived/i)).toBeInTheDocument();
  });

  it('filters encounters based on search input', async () => {
    const user = userEvent.setup();
    render(<HistoricEncounters {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/Search patient name/i);
    await user.type(searchInput, 'Jane');

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('calls onSelectEncounter when an encounter is clicked', async () => {
    const user = userEvent.setup();
    render(<HistoricEncounters {...defaultProps} />);

    const encounterItem = screen.getByText('John Doe').closest('div[role="button"]') || screen.getByText('John Doe').closest('div[class*="cursor-pointer"]');

    if (encounterItem) {
        await user.click(encounterItem);
    } else {
        throw new Error('Encounter item not found');
    }

    expect(defaultProps.onSelectEncounter).toHaveBeenCalledWith('1');
  });

  it('calls onStartNewEncounter when the new encounter button is clicked', async () => {
    const user = userEvent.setup();
    render(<HistoricEncounters {...defaultProps} />);

    const newButton = screen.getByRole('button', { name: /New blank encounter/i });
    await user.click(newButton);

    expect(defaultProps.onStartNewEncounter).toHaveBeenCalled();
  });

  it('calls onBarcodeScanClick when the barcode scan button is clicked', async () => {
    const user = userEvent.setup();
    render(<HistoricEncounters {...defaultProps} />);

    const scanButton = screen.getByRole('button', { name: /Barcode Scan Intake/i });
    await user.click(scanButton);

    expect(defaultProps.onBarcodeScanClick).toHaveBeenCalled();
  });

  describe('comparison functionality', () => {
    const comparisonProps = {
      ...defaultProps,
      compareIds: [],
      onToggleCompare: vi.fn(),
      onLaunchComparison: vi.fn(),
    };

    it('renders checkboxes when onToggleCompare is provided', () => {
      render(<HistoricEncounters {...comparisonProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(2);
    });

    it('calls onToggleCompare when a checkbox is clicked', async () => {
      const user = userEvent.setup();
      render(<HistoricEncounters {...comparisonProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      expect(comparisonProps.onToggleCompare).toHaveBeenCalledWith('1');
    });

    it('renders the comparison dock when compareIds is not empty', () => {
      render(<HistoricEncounters {...comparisonProps} compareIds={['1']} />);

      expect(screen.getByText(/Compare Mode \(1\/2\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Select exactly 2 sessions/i)).toBeInTheDocument();
    });

    it('shows launch comparison button when exactly 2 compareIds are provided', async () => {
      const user = userEvent.setup();
      render(<HistoricEncounters {...comparisonProps} compareIds={['1', '2']} />);

      const launchButton = screen.getByRole('button', { name: /Compare Side-by-Side/i });
      expect(launchButton).toBeInTheDocument();

      await user.click(launchButton);
      expect(comparisonProps.onLaunchComparison).toHaveBeenCalled();
    });

    it('clears all selections when Clear All is clicked', async () => {
      const user = userEvent.setup();
      render(<HistoricEncounters {...comparisonProps} compareIds={['1', '2']} />);

      const clearAllButton = screen.getByRole('button', { name: /Clear All/i });
      await user.click(clearAllButton);

      expect(comparisonProps.onToggleCompare).toHaveBeenCalledWith('1');
      expect(comparisonProps.onToggleCompare).toHaveBeenCalledWith('2');
      expect(comparisonProps.onToggleCompare).toHaveBeenCalledTimes(2);
    });
  });
});
