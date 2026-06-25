import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the modules before importing the file that uses them
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: null,
  })),
}));

vi.mock('../firebase-applet-config.json', () => ({
  default: {
    projectId: 'test-project',
    firestoreDatabaseId: 'test-db-id'
  }
}));

import { handleFirestoreError, auth } from './firebase';
import { OperationType } from './types';

describe('handleFirestoreError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Reset auth.currentUser to null before each test
    Object.defineProperty(auth, 'currentUser', {
      value: null,
      configurable: true
    });
  });

  it('should throw an error with formatted error string when given an Error object', () => {
    const error = new Error('Test error message');

    expect(() => {
      handleFirestoreError(error, OperationType.CREATE, 'users/123');
    }).toThrow();

    // Verify console.error was called
    expect(console.error).toHaveBeenCalled();
  });

  it('should format error correctly with no current user', () => {
    const error = new Error('Test error');

    try {
      handleFirestoreError(error, OperationType.GET, 'items/1');
      expect.fail('Should have thrown an error');
    } catch (e: any) {
      const errInfo = JSON.parse(e.message);
      expect(errInfo.error).toBe('Test error');
      expect(errInfo.operationType).toBe(OperationType.GET);
      expect(errInfo.path).toBe('items/1');
      expect(errInfo.authInfo.userId).toBeUndefined();
      expect(errInfo.authInfo.providerInfo).toEqual([]);
    }
  });

  it('should include user info when user is authenticated', () => {
    // Mock the currentUser properties
    Object.defineProperty(auth, 'currentUser', {
      value: {
        uid: 'user-123',
        email: 'test@example.com',
        emailVerified: true,
        isAnonymous: false,
        tenantId: 'tenant-1',
        providerData: [
          { providerId: 'password', email: 'test@example.com' }
        ]
      },
      configurable: true
    });

    try {
      handleFirestoreError('String error message', OperationType.UPDATE, 'docs/1');
      expect.fail('Should have thrown an error');
    } catch (e: any) {
      const errInfo = JSON.parse(e.message);
      expect(errInfo.error).toBe('String error message');
      expect(errInfo.authInfo.userId).toBe('user-123');
      expect(errInfo.authInfo.email).toBe('test@example.com');
      expect(errInfo.authInfo.emailVerified).toBe(true);
      expect(errInfo.authInfo.isAnonymous).toBe(false);
      expect(errInfo.authInfo.tenantId).toBe('tenant-1');
      expect(errInfo.authInfo.providerInfo).toEqual([
        { providerId: 'password', email: 'test@example.com' }
      ]);
    }
  });
});
