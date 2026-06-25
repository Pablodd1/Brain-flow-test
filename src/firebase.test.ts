import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleFirestoreError } from './firebase';
import { OperationType } from './types';

// Mock variables hoisted automatically by vi.mock, but need to be defined *inside* vi.mock if used
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
}));

// We need a way to change currentUser per test, so let's mock it dynamically
let mockCurrentUser: any = null;

vi.mock('firebase/auth', () => {
  return {
    getAuth: vi.fn(() => ({
      get currentUser() { return mockCurrentUser; }
    })),
  };
});

// Have to mock firebaseConfig since it's a JSON import
vi.mock('../firebase-applet-config.json', () => ({
  default: {
    firestoreDatabaseId: 'test-db'
  }
}));

describe('handleFirestoreError', () => {
  const originalConsoleError = console.error;
  let consoleErrorMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    consoleErrorMock = vi.fn() as any;
    console.error = consoleErrorMock as any;

    // Default mock user
    mockCurrentUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      emailVerified: true,
      isAnonymous: false,
      tenantId: 'test-tenant',
      providerData: [
        {
          providerId: 'password',
          email: 'test@example.com',
        }
      ]
    };
  });

  afterEach(() => {
    console.error = originalConsoleError;
    vi.clearAllMocks();
  });

  it('should format Error objects correctly and stringify the output', () => {
    const error = new Error('Test Error');
    const path = 'users/123';

    expect(() => handleFirestoreError(error, OperationType.GET, path)).toThrow(Error);

    expect(consoleErrorMock).toHaveBeenCalled();
    const errorString = consoleErrorMock.mock.calls[0][1];
    const parsedError = JSON.parse(errorString);

    expect(parsedError.error).toBe('Test Error');
    expect(parsedError.operationType).toBe(OperationType.GET);
    expect(parsedError.path).toBe(path);
    expect(parsedError.authInfo.userId).toBe('test-uid');
    expect(parsedError.authInfo.email).toBe('test@example.com');
    expect(parsedError.authInfo.providerInfo[0].providerId).toBe('password');
  });

  it('should handle missing currentUser gracefully', () => {
    mockCurrentUser = null;
    const error = new Error('Auth Missing Error');
    const path = 'some/path';

    expect(() => handleFirestoreError(error, OperationType.WRITE, path)).toThrow(Error);

    const errorString = consoleErrorMock.mock.calls[0][1];
    const parsedError = JSON.parse(errorString);

    expect(parsedError.authInfo.userId).toBeUndefined();
    expect(parsedError.authInfo.email).toBeUndefined();
    expect(parsedError.authInfo.providerInfo).toEqual([]);
  });

  it('should handle non-Error objects by stringifying them', () => {
    const error = { code: 'permission-denied', message: 'Missing permissions' };
    const path = 'admin/123';

    expect(() => handleFirestoreError(error, OperationType.DELETE, path)).toThrow(Error);

    expect(consoleErrorMock).toHaveBeenCalled();
    const errorString = consoleErrorMock.mock.calls[0][1];
    const parsedError = JSON.parse(errorString);

    expect(parsedError.error).toBe(String(error)); // Usually "[object Object]"
    expect(parsedError.operationType).toBe(OperationType.DELETE);
    expect(parsedError.path).toBe(path);
  });

  it('should handle string errors directly', () => {
    const error = "Just a string error";
    const path = null;

    expect(() => handleFirestoreError(error, OperationType.LIST, path)).toThrow(Error);

    expect(consoleErrorMock).toHaveBeenCalled();
    const errorString = consoleErrorMock.mock.calls[0][1];
    const parsedError = JSON.parse(errorString);

    expect(parsedError.error).toBe("Just a string error");
    expect(parsedError.operationType).toBe(OperationType.LIST);
    expect(parsedError.path).toBeNull();
  });

  it('should handle providerData being null/undefined', () => {
    mockCurrentUser = {
      uid: 'test-uid',
      // providerData missing
    };
    const error = new Error('Missing Provider');

    expect(() => handleFirestoreError(error, OperationType.GET, null)).toThrow(Error);

    const errorString = consoleErrorMock.mock.calls[0][1];
    const parsedError = JSON.parse(errorString);

    expect(parsedError.authInfo.userId).toBe('test-uid');
    expect(parsedError.authInfo.providerInfo).toEqual([]);
  });
});
