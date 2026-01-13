// POS hooks - Using localStorage until database migration is applied
// These hooks provide a consistent API that can be switched to database later

import { useState, useEffect, useCallback } from "react";

// ============= Types =============
export interface POSTable {
  id: string;
  table_number: string;
  capacity: number;
  status: "available" | "occupied" | "reserved" | "billing" | "held";
  guests: number | null;
  server_name: string | null;
  start_time: string | null;
  merged_with: string[] | null;
}

export interface POSOrderItem {
  id: string;
  order_id?: string;
  item_name: string;
  item_price: number;
  quantity: number;
  category: string | null;
  status: "pending" | "preparing" | "ready" | "served" | "cancelled";
  notes: string | null;
}

export interface POSCompany {
  id: string;
  name: string;
  address: string | null;
  vat_number: string | null;
  pan_number: string | null;
  phone: string | null;
  email: string | null;
}

export interface POSTransaction {
  id: string;
  transaction_number: string;
  table_number: string;
  customer_name: string | null;
  customer_address: string | null;
  company_id: string | null;
  company_name: string | null;
  vat_number: string | null;
  pan_number: string | null;
  subtotal: number;
  discount_amount: number | null;
  tax_amount: number;
  tip_amount: number | null;
  total: number;
  payment_method: string;
  rrn_number: string | null;
  transaction_ref: string | null;
  card_last_four: string | null;
  card_type: string | null;
  room_number: string | null;
  items_count: number;
  items: POSOrderItem[];
  created_at: string;
}

// LocalStorage keys
const TABLES_KEY = "pos_tables_data";
const COMPANIES_KEY = "pos_companies_data";
const TRANSACTIONS_KEY = "pos_transactions_data";

// Default tables
const defaultTables: POSTable[] = [
  { id: "t1", table_number: "1", capacity: 4, status: "available", guests: null, server_name: null, start_time: null, merged_with: null },
  { id: "t2", table_number: "2", capacity: 2, status: "available", guests: null, server_name: null, start_time: null, merged_with: null },
  { id: "t3", table_number: "3", capacity: 6, status: "available", guests: null, server_name: null, start_time: null, merged_with: null },
  { id: "t4", table_number: "4", capacity: 4, status: "available", guests: null, server_name: null, start_time: null, merged_with: null },
  { id: "t5", table_number: "5", capacity: 8, status: "available", guests: null, server_name: null, start_time: null, merged_with: null },
  { id: "t6", table_number: "6", capacity: 2, status: "available", guests: null, server_name: null, start_time: null, merged_with: null },
  { id: "t7", table_number: "7", capacity: 4, status: "available", guests: null, server_name: null, start_time: null, merged_with: null },
  { id: "t8", table_number: "8", capacity: 4, status: "available", guests: null, server_name: null, start_time: null, merged_with: null },
];

// ============= POS Tables Hooks =============
export function usePOSTables() {
  const [data, setData] = useState<POSTable[]>(() => {
    const saved = localStorage.getItem(TABLES_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultTables;
      }
    }
    return defaultTables;
  });
  const [isLoading, setIsLoading] = useState(false);

  // Sync with localStorage changes (for multi-tab support)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === TABLES_KEY && e.newValue) {
        try {
          setData(JSON.parse(e.newValue));
        } catch {
          // ignore parse errors
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const refetch = useCallback(() => {
    const saved = localStorage.getItem(TABLES_KEY);
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch {
        setData(defaultTables);
      }
    }
  }, []);

  return { data, isLoading, refetch };
}

export function useUpdatePOSTable() {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async ({ id, updates }: { id: string; updates: Partial<POSTable> }) => {
    setIsPending(true);
    try {
      const saved = localStorage.getItem(TABLES_KEY);
      const tables: POSTable[] = saved ? JSON.parse(saved) : defaultTables;
      const updatedTables = tables.map(t => 
        t.id === id ? { ...t, ...updates } : t
      );
      localStorage.setItem(TABLES_KEY, JSON.stringify(updatedTables));
      // Dispatch storage event for other tabs
      window.dispatchEvent(new StorageEvent("storage", { key: TABLES_KEY, newValue: JSON.stringify(updatedTables) }));
      return updatedTables.find(t => t.id === id);
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}

// ============= POS Companies Hooks =============
export function usePOSCompanies(searchTerm?: string) {
  const [isLoading] = useState(false);

  const getCompanies = (): POSCompany[] => {
    const saved = localStorage.getItem(COMPANIES_KEY);
    return saved ? JSON.parse(saved) : [];
  };

  let companies = getCompanies();

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    companies = companies.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.vat_number?.toLowerCase().includes(term) ||
        c.pan_number?.toLowerCase().includes(term)
    );
  }

  return { data: companies, isLoading };
}

export function useCreatePOSCompany() {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async (company: Omit<POSCompany, "id">) => {
    setIsPending(true);
    try {
      const saved = localStorage.getItem(COMPANIES_KEY);
      const companies: POSCompany[] = saved ? JSON.parse(saved) : [];
      const newCompany: POSCompany = {
        ...company,
        id: Date.now().toString(),
      };
      companies.push(newCompany);
      localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies));
      return newCompany;
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}

// ============= POS Transactions Hooks =============
export function usePOSTransactions(filters?: {
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
}) {
  const [isLoading] = useState(false);

  const getTransactions = (): POSTransaction[] => {
    const saved = localStorage.getItem(TRANSACTIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  };

  let transactions = getTransactions();

  if (filters?.startDate) {
    transactions = transactions.filter((t) => t.created_at >= filters.startDate!);
  }
  if (filters?.endDate) {
    transactions = transactions.filter(
      (t) => t.created_at <= filters.endDate! + "T23:59:59"
    );
  }
  if (filters?.paymentMethod) {
    transactions = transactions.filter(
      (t) => t.payment_method === filters.paymentMethod
    );
  }

  const refetch = () => {
    // Trigger re-render by calling this
  };

  return { data: transactions, isLoading, refetch };
}

export function useCreatePOSTransaction() {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async (
    transaction: Omit<POSTransaction, "id" | "transaction_number" | "created_at">
  ) => {
    setIsPending(true);
    try {
      const saved = localStorage.getItem(TRANSACTIONS_KEY);
      const transactions: POSTransaction[] = saved ? JSON.parse(saved) : [];

      const newTransaction: POSTransaction = {
        ...transaction,
        id: Date.now().toString(),
        transaction_number: `TXN-${new Date()
          .toISOString()
          .slice(0, 10)
          .replace(/-/g, "")}-${Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0")}`,
        created_at: new Date().toISOString(),
      };

      transactions.unshift(newTransaction);
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
      return newTransaction;
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}

// Helper function to save transaction (for compatibility with existing code)
export function saveTransaction(
  transaction: Omit<POSTransaction, "id" | "transaction_number" | "created_at">
) {
  const saved = localStorage.getItem(TRANSACTIONS_KEY);
  const transactions: POSTransaction[] = saved ? JSON.parse(saved) : [];

  const newTransaction: POSTransaction = {
    ...transaction,
    id: Date.now().toString(),
    transaction_number: `TXN-${new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "")}-${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")}`,
    created_at: new Date().toISOString(),
  };

  transactions.unshift(newTransaction);
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  return newTransaction;
}

// Save/update tables to localStorage
export function savePOSTables(tables: POSTable[]) {
  localStorage.setItem(TABLES_KEY, JSON.stringify(tables));
  window.dispatchEvent(new StorageEvent("storage", { key: TABLES_KEY, newValue: JSON.stringify(tables) }));
}
