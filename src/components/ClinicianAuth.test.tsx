import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClinicianAuth from './ClinicianAuth';
import { signInWithPopup, signInAnonymously } from 'firebase/auth';
import { getDoc, setDoc } from 'firebase/firestore';
import { vi } from 'vitest';

// Mock dependencies
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInAnonymously: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}));

vi.mock('../firebase', () => ({
  auth: {},
  db: {},
}));

describe('ClinicianAuth Component', () => {
  const mockOnSuccess = vi.fn();
  const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    consoleErrorMock.mockRestore();
  });

  it('renders the component with branding and buttons', () => {
    render(<ClinicianAuth onSuccess={mockOnSuccess} />);

    expect(screen.getByText('Coherence™')).toBeInTheDocument();
    expect(screen.getByText('Clinician Mission Control App')).toBeInTheDocument();
    expect(screen.getByText('Sign In with Google Credentials')).toBeInTheDocument();
    expect(screen.getByText('Initialize Clinician Demo Control')).toBeInTheDocument();
  });

  it('handles Google Sign In successfully (new user)', async () => {
    const mockUser = { uid: '123', email: 'test@example.com', displayName: 'Test User' };
    (signInWithPopup as any).mockResolvedValueOnce({ user: mockUser });
    (getDoc as any).mockResolvedValueOnce({ exists: () => false });
    (setDoc as any).mockResolvedValueOnce(undefined);

    render(<ClinicianAuth onSuccess={mockOnSuccess} />);

    const googleBtn = screen.getByText('Sign In with Google Credentials');
    fireEvent.click(googleBtn);

    expect(screen.getByText('Authenticating...')).toBeInTheDocument();

    await waitFor(() => {
      expect(signInWithPopup).toHaveBeenCalled();
      expect(getDoc).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalledWith(mockUser);
    });
  });

  it('handles Google Sign In successfully (existing user)', async () => {
    const mockUser = { uid: '123', email: 'test@example.com', displayName: 'Test User' };
    (signInWithPopup as any).mockResolvedValueOnce({ user: mockUser });
    (getDoc as any).mockResolvedValueOnce({ exists: () => true });

    render(<ClinicianAuth onSuccess={mockOnSuccess} />);

    const googleBtn = screen.getByText('Sign In with Google Credentials');
    fireEvent.click(googleBtn);

    await waitFor(() => {
      expect(signInWithPopup).toHaveBeenCalled();
      expect(getDoc).toHaveBeenCalled();
      expect(setDoc).not.toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalledWith(mockUser);
    });
  });

  it('shows error message if Google Sign In fails', async () => {
    const errorMessage = 'Popup closed by user';
    (signInWithPopup as any).mockRejectedValueOnce(new Error(errorMessage));

    render(<ClinicianAuth onSuccess={mockOnSuccess} />);

    const googleBtn = screen.getByText('Sign In with Google Credentials');
    fireEvent.click(googleBtn);

    await waitFor(() => {
      expect(screen.getByText('Authorization Deficit Detected:')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  it('handles Demo Sign In successfully', async () => {
    const mockUser = { uid: 'demo-123' };
    (signInAnonymously as any).mockResolvedValueOnce({ user: mockUser });
    (setDoc as any).mockResolvedValueOnce(undefined);

    render(<ClinicianAuth onSuccess={mockOnSuccess} />);

    const demoBtn = screen.getByText('Initialize Clinician Demo Control');
    fireEvent.click(demoBtn);

    await waitFor(() => {
      expect(signInAnonymously).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalledWith(mockUser);
    });
  });

  it('shows error message if Demo Sign In fails', async () => {
    const errorMessage = 'Failed to initialize clinical demo session.';
    (signInAnonymously as any).mockRejectedValueOnce(new Error(errorMessage));

    render(<ClinicianAuth onSuccess={mockOnSuccess} />);

    const demoBtn = screen.getByText('Initialize Clinician Demo Control');
    fireEvent.click(demoBtn);

    await waitFor(() => {
      expect(screen.getByText('Authorization Deficit Detected:')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });
});
