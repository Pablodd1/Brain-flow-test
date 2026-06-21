import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SensoryFeed from './SensoryFeed';

describe('SensoryFeed', () => {
  const defaultProps = {
    heartRate: 75,
    hrv: 45,
    swayIndex: 2.1,
    onMetricUpdate: vi.fn(),
    overrideActive: false,
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders initial metrics correctly', () => {
    render(<SensoryFeed {...defaultProps} />);

    // Heart Rate
    expect(screen.getByText('Heart Rate')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();

    // HRV
    expect(screen.getByText('HRV ( RSA )')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();

    // Sway Index
    expect(screen.getByText('Sway Index')).toBeInTheDocument();
    expect(screen.getByText('2.1')).toBeInTheDocument();
  });

  it('calls onMetricUpdate at intervals for standard fluctuations', () => {
    render(<SensoryFeed {...defaultProps} />);

    // Fast-forward 1.2 seconds (interval duration)
    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(defaultProps.onMetricUpdate).toHaveBeenCalledTimes(1);

    const updateArg = defaultProps.onMetricUpdate.mock.calls[0][0];

    // Expect slight variation due to random math, but within boundaries
    expect(updateArg.heartRate).toBeGreaterThanOrEqual(65);
    expect(updateArg.heartRate).toBeLessThanOrEqual(95);
    expect(updateArg.hrv).toBeGreaterThanOrEqual(25);
    expect(updateArg.hrv).toBeLessThanOrEqual(65);
    expect(updateArg.swayIndex).toBeGreaterThanOrEqual(1.0);
    expect(updateArg.swayIndex).toBeLessThanOrEqual(4.5);
  });

  it('toggles anomaly mode and updates UI accordingly', () => {
    render(<SensoryFeed {...defaultProps} />);

    const toggleBtn = screen.getByRole('button', { name: /SIMULATE COMPLAINT TRIGGER/i });

    // Initial state: not in anomaly mode
    expect(screen.getByText(/Patient telemetry is stabilized/i)).toBeInTheDocument();

    // Click toggle
    act(() => {
      fireEvent.click(toggleBtn);
    });

    // Anomaly mode state
    expect(screen.getByText(/DISMISS DISTRESS WAVE/i)).toBeInTheDocument();
    expect(screen.getByText(/ANOMALY REPORTED/i)).toBeInTheDocument();

    // Verify interval math under anomaly mode
    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(defaultProps.onMetricUpdate).toHaveBeenCalledTimes(1);
    const updateArg = defaultProps.onMetricUpdate.mock.calls[0][0];

    // Expect anomaly mode boundaries
    expect(updateArg.heartRate).toBeGreaterThanOrEqual(95);
    expect(updateArg.heartRate).toBeLessThanOrEqual(140);
    expect(updateArg.hrv).toBeGreaterThanOrEqual(8);
    expect(updateArg.hrv).toBeLessThanOrEqual(22);
    expect(updateArg.swayIndex).toBeGreaterThanOrEqual(5.0);
    expect(updateArg.swayIndex).toBeLessThanOrEqual(8.5);
  });

  it('handles overrideActive correctly', () => {
    render(<SensoryFeed {...defaultProps} overrideActive={true} />);

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(defaultProps.onMetricUpdate).toHaveBeenCalledTimes(1);
    const updateArg = defaultProps.onMetricUpdate.mock.calls[0][0];

    // Expect override/safe reset boundaries
    expect(updateArg.heartRate).toBeGreaterThanOrEqual(58);
    expect(updateArg.heartRate).toBeLessThanOrEqual(72);
    expect(updateArg.hrv).toBeGreaterThanOrEqual(55);
    expect(updateArg.hrv).toBeLessThanOrEqual(95);
    expect(updateArg.swayIndex).toBeGreaterThanOrEqual(0.5);
    expect(updateArg.swayIndex).toBeLessThanOrEqual(2.2);
  });

  it('updates pulse wave on inner interval', () => {
    render(<SensoryFeed {...defaultProps} />);
    // The pulse wave interval is 100ms
    act(() => {
      vi.advanceTimersByTime(500); // 5 iterations
    });
    // This updates the pulseWave state but it's hard to assert the specific line points directly
    // unless we check the SVG polyline attributes
    const polyline = document.querySelector('polyline');
    expect(polyline).toBeInTheDocument();
    expect(polyline?.getAttribute('points')).toBeTruthy();
  });
});
