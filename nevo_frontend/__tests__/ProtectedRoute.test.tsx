import React from 'react';
import { render, screen } from '@testing-library/react';
import ProtectedRoute from '../components/ProtectedRoute';
import { useWalletStore } from '@/src/store/walletStore';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/dashboard',
}));

jest.mock('@/src/store/walletStore', () => ({
  useWalletStore: jest.fn(),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects unauthenticated users to /login with a from query param', () => {
    (useWalletStore as unknown as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      loading: false,
      initialize: jest.fn(),
    });

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Secret</div>
      </ProtectedRoute>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(mockPush).toHaveBeenCalledWith('/login?from=%2Fdashboard');
  });

  it('renders children when the user is authenticated', () => {
    (useWalletStore as unknown as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      loading: false,
      initialize: jest.fn(),
    });

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Secret</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows a loading indicator and does not redirect while loading', () => {
    (useWalletStore as unknown as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      loading: true,
      initialize: jest.fn(),
    });

    render(
      <ProtectedRoute>
        <div data-testid="protected-content">Secret</div>
      </ProtectedRoute>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
