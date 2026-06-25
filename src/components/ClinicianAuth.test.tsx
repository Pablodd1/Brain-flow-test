import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ClinicianAuth from './ClinicianAuth';

// Mock dependencies
vi.mock('../firebase', () => ({
  auth: {},
  db: {}
}));

vi.mock('firebase/auth', () => ({
  signInAnonymously: vi.fn(),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
}));

import { signInAnonymously, signInWithPopup } from 'firebase/auth';

describe('ClinicianAuth', () => {
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles demo sign in error gracefully', async () => {
    const mockError = new Error('Simulated demo auth error');
    (signInAnonymously as any).mockRejectedValueOnce(mockError);

    render(<ClinicianAuth onSuccess={mockOnSuccess} />);

    const demoBtn = screen.getByText('Initialize Clinician Demo Control');
    fireEvent.click(demoBtn);

    await waitFor(() => {
      expect(screen.getByText('Simulated demo auth error')).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
    // button should be re-enabled after failure
    expect(demoBtn).not.toBeDisabled();
  });

  it('handles Google sign in error gracefully', async () => {
    const mockError = new Error('Simulated google auth error');
    (signInWithPopup as any).mockRejectedValueOnce(mockError);

    render(<ClinicianAuth onSuccess={mockOnSuccess} />);

    const googleBtn = screen.getByText('Sign In with Google Credentials');
    fireEvent.click(googleBtn);

    await waitFor(() => {
      expect(screen.getByText('Simulated google auth error')).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
    // button should be re-enabled after failure
    expect(googleBtn).not.toBeDisabled();
  });


  it('handles Google sign in fallback error message gracefully', async () => {
    (signInWithPopup as any).mockRejectedValueOnce({});

    render(<ClinicianAuth onSuccess={mockOnSuccess} />);

    const googleBtn = screen.getByText('Sign In with Google Credentials');
    fireEvent.click(googleBtn);

    await waitFor(() => {
      expect(screen.getByText('Authentication failed. Popups might be blocked by your browser.')).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
    // button should be re-enabled after failure
    expect(googleBtn).not.toBeDisabled();
  });

  it('handles demo sign in fallback error message gracefully', async () => {
    (signInAnonymously as any).mockRejectedValueOnce({});

    render(<ClinicianAuth onSuccess={mockOnSuccess} />);

    const demoBtn = screen.getByText('Initialize Clinician Demo Control');
    fireEvent.click(demoBtn);

    await waitFor(() => {
      expect(screen.getByText('Failed to initialize clinical demo session.')).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
    // button should be re-enabled after failure
    expect(demoBtn).not.toBeDisabled();
  });


  it('handles successful Google sign in', async () => {
    const mockUser = {
      uid: 'user123',
      email: 'test@example.com',
      displayName: 'Test User'
    };
    (signInWithPopup as any).mockResolvedValueOnce({ user: mockUser });

    // Simulate user not existing in DB
    const mockDocSnap = { exists: () => false };
    const { getDoc } = await import('firebase/firestore');
    (getDoc as any).mockResolvedValueOnce(mockDocSnap);

    render(<ClinicianAuth onSuccess={mockOnSuccess} />);

    const googleBtn = screen.getByText('Sign In with Google Credentials');
    fireEvent.click(googleBtn);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(mockUser);
    });

    const { setDoc } = await import('firebase/firestore');
    expect(setDoc).toHaveBeenCalled();
  });

  it('handles successful Google sign in with existing user', async () => {
    const mockUser = {
      uid: 'user123',
      email: 'test@example.com',
      displayName: 'Test User'
    };
    (signInWithPopup as any).mockResolvedValueOnce({ user: mockUser });

    // Simulate user existing in DB
    const mockDocSnap = { exists: () => true };
    const { getDoc } = await import('firebase/firestore');
    (getDoc as any).mockResolvedValueOnce(mockDocSnap);

    render(<ClinicianAuth onSuccess={mockOnSuccess} />);

    const googleBtn = screen.getByText('Sign In with Google Credentials');
    fireEvent.click(googleBtn);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(mockUser);
    });

    const { setDoc } = await import('firebase/firestore');
    // It shouldn't setDoc again if user exists
    // (the previous test already called it once, we need to clear mocks or check correctly, we clear it in beforeEach so we check for not called here)
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('handles successful demo sign in', async () => {
    const mockUser = { uid: 'demo123' };
    (signInAnonymously as any).mockResolvedValueOnce({ user: mockUser });

    render(<ClinicianAuth onSuccess={mockOnSuccess} />);

    const demoBtn = screen.getByText('Initialize Clinician Demo Control');
    fireEvent.click(demoBtn);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(mockUser);
    });

    const { setDoc } = await import('firebase/firestore');
    expect(setDoc).toHaveBeenCalled();
  });
});
