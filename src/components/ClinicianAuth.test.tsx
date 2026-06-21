import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClinicianAuth from './ClinicianAuth';
import { vi } from 'vitest';
import * as firebaseAuth from 'firebase/auth';
import * as firebaseFirestore from 'firebase/firestore';

// Mock dependencies
vi.mock('firebase/auth', () => ({
  signInWithPopup: vi.fn(),
  signInAnonymously: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  getAuth: vi.fn()
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  getFirestore: vi.fn()
}));

vi.mock('../firebase', () => ({
  auth: {},
  db: {}
}));

describe('ClinicianAuth Component', () => {
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Google sign in button', () => {
    render(<ClinicianAuth onSuccess={mockOnSuccess} />);
    expect(screen.getByText('Sign In with Google Credentials')).toBeInTheDocument();
  });

  describe('handleGoogleSignIn Error Path', () => {
    it('sets and displays error message when signInWithPopup fails', async () => {
      const errorMessage = 'Network error during sign in';
      vi.mocked(firebaseAuth.signInWithPopup).mockRejectedValueOnce(new Error(errorMessage));

      render(<ClinicianAuth onSuccess={mockOnSuccess} />);

      const signInButton = screen.getByText('Sign In with Google Credentials');
      fireEvent.click(signInButton);

      // Loading state
      expect(screen.getByText('Authenticating...')).toBeInTheDocument();
      expect(signInButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();

      // Loading state should be removed
      expect(screen.getByText('Sign In with Google Credentials')).toBeInTheDocument();
      expect(screen.getByText('Sign In with Google Credentials')).not.toBeDisabled();
    });

    it('displays default error message when error has no message property', async () => {
      vi.mocked(firebaseAuth.signInWithPopup).mockRejectedValueOnce('Some string error');

      render(<ClinicianAuth onSuccess={mockOnSuccess} />);

      const signInButton = screen.getByText('Sign In with Google Credentials');
      fireEvent.click(signInButton);

      await waitFor(() => {
        expect(screen.getByText('Authentication failed. Popups might be blocked by your browser.')).toBeInTheDocument();
      });
    });
  });

  describe('handleDemoSignIn Error Path', () => {
    it('sets and displays error message when signInAnonymously fails', async () => {
      const errorMessage = 'Failed to initialize clinical demo session.';
      vi.mocked(firebaseAuth.signInAnonymously).mockRejectedValueOnce(new Error('Internal server error'));

      render(<ClinicianAuth onSuccess={mockOnSuccess} />);

      const demoButton = screen.getByText('Initialize Clinician Demo Control');
      fireEvent.click(demoButton);

      await waitFor(() => {
        // The component falls back to err?.message || 'Failed to initialize clinical demo session.'
        // So for "Internal server error" it will display "Internal server error"
        expect(screen.getByText('Internal server error')).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });
});

  const mockOnSuccess = vi.fn();
  beforeEach(() => { vi.clearAllMocks(); });
  describe('Happy Paths', () => {
    it('calls onSuccess when google signin completes successfully and profile exists', async () => {
      const mockUser = { uid: 'user123', email: 'test@example.com', displayName: 'Test User' };
      vi.mocked(firebaseAuth.signInWithPopup).mockResolvedValueOnce({ user: mockUser } as any);
      vi.mocked(firebaseFirestore.getDoc).mockResolvedValueOnce({ exists: () => true } as any);

      render(<ClinicianAuth onSuccess={mockOnSuccess} />);

      const signInButton = screen.getByText('Sign In with Google Credentials');
      fireEvent.click(signInButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockUser);
      });
      expect(firebaseFirestore.setDoc).not.toHaveBeenCalled();
    });

    it('creates profile and calls onSuccess when google signin completes and profile does not exist', async () => {
      const mockUser = { uid: 'user123', email: 'test@example.com', displayName: 'Test User' };
      vi.mocked(firebaseAuth.signInWithPopup).mockResolvedValueOnce({ user: mockUser } as any);
      vi.mocked(firebaseFirestore.getDoc).mockResolvedValueOnce({ exists: () => false } as any);

      render(<ClinicianAuth onSuccess={mockOnSuccess} />);

      const signInButton = screen.getByText('Sign In with Google Credentials');
      fireEvent.click(signInButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockUser);
      });
      expect(firebaseFirestore.setDoc).toHaveBeenCalledWith(undefined, {
        userId: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: expect.any(Date)
      });
    });

    it('calls onSuccess when demo signin completes successfully', async () => {
      const mockUser = { uid: 'demo123' };
      vi.mocked(firebaseAuth.signInAnonymously).mockResolvedValueOnce({ user: mockUser } as any);

      render(<ClinicianAuth onSuccess={mockOnSuccess} />);

      const demoButton = screen.getByText('Initialize Clinician Demo Control');
      fireEvent.click(demoButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockUser);
      });
      expect(firebaseFirestore.setDoc).toHaveBeenCalledWith(undefined, {
        userId: 'demo123',
        email: 'clinician.demo@coherence.health',
        name: 'Dr. Evelyn Moss (Clinician Demo)',
        createdAt: expect.any(Date)
      });
    });
  });

  describe('Additional Branches', () => {
    it('creates profile with anonymous values when email and displayName are missing', async () => {
      const mockUser = { uid: 'user123' }; // No email or displayName
      vi.mocked(firebaseAuth.signInWithPopup).mockResolvedValueOnce({ user: mockUser } as any);
      vi.mocked(firebaseFirestore.getDoc).mockResolvedValueOnce({ exists: () => false } as any);

      render(<ClinicianAuth onSuccess={mockOnSuccess} />);

      const signInButton = screen.getByText('Sign In with Google Credentials');
      fireEvent.click(signInButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockUser);
      });
      expect(firebaseFirestore.setDoc).toHaveBeenCalledWith(undefined, {
        userId: 'user123',
        email: 'anonymous',
        name: 'Guest Clinician',
        createdAt: expect.any(Date)
      });
    });
  });

  describe('handleDemoSignIn Error Path Without Message', () => {
    it('sets default error message when signInAnonymously fails without message', async () => {
      vi.mocked(firebaseAuth.signInAnonymously).mockRejectedValueOnce('Some object error');

      render(<ClinicianAuth onSuccess={mockOnSuccess} />);

      const demoButton = screen.getByText('Initialize Clinician Demo Control');
      fireEvent.click(demoButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to initialize clinical demo session.')).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });
