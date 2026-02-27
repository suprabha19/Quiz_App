import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';

// Mock API
vi.mock('../../services/api', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    getProfile: vi.fn()
  }
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
global.localStorage = localStorageMock;

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should initialize with null user when no token in localStorage', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should login user successfully', async () => {
    const mockUser = { _id: '123', username: 'testuser', role: 'user' };
    const mockToken = 'mock-jwt-token';

    authAPI.login.mockResolvedValue({
      data: { user: mockUser, token: mockToken }
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    await act(async () => {
      await result.current.login('testuser', 'password123');
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', mockToken);
    expect(authAPI.login).toHaveBeenCalledWith('testuser', 'password123');
  });

  it('should logout user successfully', async () => {
    const mockUser = { _id: '123', username: 'testuser', role: 'user' };
    const mockToken = 'mock-jwt-token';

    authAPI.login.mockResolvedValue({
      data: { user: mockUser, token: mockToken }
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    // Login first
    await act(async () => {
      await result.current.login('testuser', 'password123');
    });

    // Then logout
    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
  });

  it('should handle login error', async () => {
    const mockError = new Error('Invalid credentials');
    authAPI.login.mockRejectedValue(mockError);

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    await expect(async () => {
      await act(async () => {
        await result.current.login('testuser', 'wrongpassword');
      });
    }).rejects.toThrow('Invalid credentials');

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should register user successfully', async () => {
    const mockUser = { _id: '123', username: 'newuser', role: 'user' };
    const mockToken = 'mock-jwt-token';

    authAPI.register.mockResolvedValue({
      data: { user: mockUser, token: mockToken }
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    await act(async () => {
      await result.current.register('newuser', 'password123');
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', mockToken);
    expect(authAPI.register).toHaveBeenCalledWith('newuser', 'password123');
  });

  it('should check authentication on mount if token exists', async () => {
    const mockUser = { _id: '123', username: 'testuser', role: 'user' };
    const mockToken = 'existing-token';

    localStorageMock.getItem.mockReturnValue(mockToken);
    authAPI.getProfile.mockResolvedValue({
      data: mockUser
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    expect(authAPI.getProfile).toHaveBeenCalled();
  });

  it('should clear user if token is invalid on mount', async () => {
    const mockToken = 'invalid-token';

    localStorageMock.getItem.mockReturnValue(mockToken);
    authAPI.getProfile.mockRejectedValue(new Error('Invalid token'));

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
  });
});
