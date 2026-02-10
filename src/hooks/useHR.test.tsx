import { describe, it, expect, vi } from 'vitest';
import { useHRStats } from './useHR';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
          gte: vi.fn(() => ({
            lt: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      }))
    })),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn()
      }))
    })),
    removeChannel: vi.fn()
  }
}));

const queryClient = new QueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useHRStats', () => {
  it('returns default stats when no data is present', async () => {
    const { result } = renderHook(() => useHRStats(), { wrapper });

    // Initial state before queries resolve
    expect(result.current).toEqual({
      pendingLeaveRequests: 0,
      approvedLeaveRequests: 0,
      pendingPayroll: 0,
      totalPayrollAmount: 0,
      clockedInToday: 0,
      totalStaffToday: 0,
    });
  });
});
