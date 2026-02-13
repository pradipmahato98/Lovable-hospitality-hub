import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// We need to mock supabase
const mockUpdate = vi.fn(() => ({
  eq: vi.fn(() => Promise.resolve({ error: null }))
}));

const mockInsert = vi.fn(() => Promise.resolve({ error: null }));

const mockMaybeSingle = vi.fn(() => Promise.resolve({
  data: {
    value: {
      gateways: [
        { id: 'stripe', secret_key: 'sk_test_real_key', enabled: true, is_configured: true }
      ]
    }
  },
  error: null
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: mockMaybeSingle
        }))
      })),
      update: mockUpdate,
      insert: mockInsert
    }))
  }
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }
}));

// Mock @stripe/stripe-js
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(),
}));

import { usePaymentGateways, useUpdatePaymentGateway } from './usePaymentGateways';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
        retry: false,
    }
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('usePaymentGateways hooks', () => {
  it('should mask the secret_key in usePaymentGateways', async () => {
    const { result } = renderHook(() => usePaymentGateways(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const stripeGateway = result.current.data?.gateways.find(g => g.id === 'stripe');
    expect(stripeGateway?.secret_key).toBe('••••••••');
  });

  it('should preserve the original secret_key when receiving masked key in useUpdatePaymentGateway', async () => {
    const { result } = renderHook(() => useUpdatePaymentGateway(), { wrapper });

    const maskedGateway = {
      id: 'stripe',
      name: 'Stripe',
      code: 'STRIPE',
      enabled: true,
      is_configured: true,
      secret_key: '••••••••', // Masked key from UI
      sandbox_mode: true,
      type: 'international' as const,
      description: 'Test'
    };

    await result.current.mutateAsync(maskedGateway);

    // Verify that update was called with the real key 'sk_test_real_key', not '••••••••'
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      value: expect.objectContaining({
        gateways: expect.arrayContaining([
          expect.objectContaining({
            id: 'stripe',
            secret_key: 'sk_test_real_key'
          })
        ])
      })
    }));
  });
});
