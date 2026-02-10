import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { InvoiceTable } from './InvoiceTable';
import { Invoice } from '@/hooks/useFinanceExtended';

const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoice_number: 'INV-001',
    guest_id: 'g1',
    reservation_id: 'r1',
    company_id: null,
    invoice_date: '2024-01-01',
    due_date: '2024-01-15',
    status: 'paid',
    subtotal: 100,
    tax_amount: 10,
    discount_amount: 0,
    total: 110,
    amount_paid: 110,
    balance_due: 0,
    notes: null,
    terms: null,
    created_at: '2024-01-01T00:00:00Z',
    guest: { first_name: 'John', last_name: 'Doe' },
  },
];

describe('InvoiceTable', () => {
  it('renders invoices correctly', () => {
    render(
      <InvoiceTable
        invoices={mockInvoices}
        isLoading={false}
        onExport={vi.fn()}
      />
    );

    expect(screen.getByText('INV-001')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('$110.00')).toBeInTheDocument();
    expect(screen.getByText('paid')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(
      <InvoiceTable
        invoices={[]}
        isLoading={true}
        onExport={vi.fn()}
      />
    );

    expect(screen.getByText('Loading invoices...')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(
      <InvoiceTable
        invoices={[]}
        isLoading={false}
        onExport={vi.fn()}
      />
    );

    expect(screen.getByText('No invoices found')).toBeInTheDocument();
  });
});
