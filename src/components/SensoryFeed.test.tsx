import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SensoryFeed from './SensoryFeed';

describe('SensoryFeed', () => {
  const defaultProps = {
    heartRate: 75,
    hrv: 45,
    swayIndex: 2.5,
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

  it('renders standard metrics on mount', () => {
    render(<SensoryFeed {...defaultProps} />);

    // Check main titles
    expect(screen.getByText(/Live Sensory Feed/i)).toBeInTheDocument();

    // Check actual metrics display
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('2.5')).toBeInTheDocument();
  });

  it('updates metrics dynamically over time in normal mode', () => {
    render(<SensoryFeed {...defaultProps} />);

    // Advance 1 interval (1200ms)
    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(defaultProps.onMetricUpdate).toHaveBeenCalledTimes(1);
    const updatedMetrics = defaultProps.onMetricUpdate.mock.calls[0][0];

    // standard bounds +/- based on code:
    // HR + deltaHR ( -2 to +2 ) => max(65, min(95, heartRate + deltaHR)) => 73 to 77
    expect(updatedMetrics.heartRate).toBeGreaterThanOrEqual(73);
    expect(updatedMetrics.heartRate).toBeLessThanOrEqual(77);

    // HRV + deltaHRV ( -3 to +3 ) => 42 to 48
    expect(updatedMetrics.hrv).toBeGreaterThanOrEqual(42);
    expect(updatedMetrics.hrv).toBeLessThanOrEqual(48);

    // Sway + deltaSway ( -0.2 to +0.2 ) => 2.3 to 2.7
    expect(updatedMetrics.swayIndex).toBeGreaterThanOrEqual(2.3);
    expect(updatedMetrics.swayIndex).toBeLessThanOrEqual(2.7);
  });

  it('toggles anomaly mode and updates metrics into anomaly ranges', () => {
    render(<SensoryFeed {...defaultProps} />);

    const anomalyBtn = screen.getByText('SIMULATE COMPLAINT TRIGGER');
    expect(anomalyBtn).toBeInTheDocument();

    // Click to enable anomaly mode
    fireEvent.click(anomalyBtn);
    expect(screen.getByText('DISMISS DISTRESS WAVE')).toBeInTheDocument();
    expect(screen.getByText(/ANOMALY REPORTED/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(defaultProps.onMetricUpdate).toHaveBeenCalledTimes(1);
    const updatedMetrics = defaultProps.onMetricUpdate.mock.calls[0][0];

    // anomaly mode bounds based on code:
    // targetHR = Math.max(95, Math.min(140, heartRate + Math.floor(Math.random() * 8) - 2)); // heartRate=75 => 75 + (-2 to 5) => 73 to 80 => min max clamps to 95!
    expect(updatedMetrics.heartRate).toBe(95);

    // targetHRV = Math.max(8, Math.min(22, hrv - Math.floor(Math.random() * 4))); // hrv=45 => 45 - (0 to 3) => 42 to 45 => clamped to 22!
    expect(updatedMetrics.hrv).toBe(22);

    // targetSway = Math.min(8.5, Math.max(5.0, swayIndex + (Math.random() * 0.6) - 0.1)); // sway=2.5 => 2.4 to 3.0 => clamped to 5.0!
    expect(updatedMetrics.swayIndex).toBe(5.0);

    // Click again to disable
    fireEvent.click(screen.getByText('DISMISS DISTRESS WAVE'));
    expect(screen.getByText('SIMULATE COMPLAINT TRIGGER')).toBeInTheDocument();
  });

  it('stabilizes metrics when overrideActive is true', () => {
    render(<SensoryFeed {...defaultProps} overrideActive={true} />);

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(defaultProps.onMetricUpdate).toHaveBeenCalledTimes(1);
    const updatedMetrics = defaultProps.onMetricUpdate.mock.calls[0][0];

    // overrideActive bounds:
    // targetHR = Math.max(58, Math.min(72, heartRate - Math.floor(Math.random() * 4))); // heartRate=75 => 75 - (0 to 3) => 72 to 75 => min 58 max 72 => 72!
    expect(updatedMetrics.heartRate).toBe(72);

    // targetHRV = Math.min(95, Math.max(55, hrv + Math.floor(Math.random() * 5))); // hrv=45 => 45 + (0 to 4) => 45 to 49 => min 95 max 55 => 55!
    expect(updatedMetrics.hrv).toBe(55);

    // targetSway = Math.max(0.5, Math.min(2.2, swayIndex - 0.1)); // sway=2.5 => 2.4 => min 0.5 max 2.2 => 2.2!
    expect(updatedMetrics.swayIndex).toBe(2.2);
  });
});
