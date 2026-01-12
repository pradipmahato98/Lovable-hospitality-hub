// POS hooks - Types for future database integration
// Currently using localStorage until database migration is applied

export interface POSTable {
  id: string;
  table_number: string;
  capacity: number;
  status: "available" | "occupied" | "reserved" | "billing" | "held";
  guests: number | null;
  server_name: string | null;
  start_time: string | null;
  merged_with: string[] | null;
  orders: POSOrderItem[];
}

export interface POSOrderItem {
  id: string;
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
const COMPANIES_KEY = "pos_companies_data";
const TRANSACTIONS_KEY = "pos_transactions_data";

// Company management with localStorage
export function usePOSCompanies(searchTerm?: string) {
  const getCompanies = (): POSCompany[] => {
    const saved = localStorage.getItem(COMPANIES_KEY);
    return saved ? JSON.parse(saved) : [];
  };

  let companies = getCompanies();
  
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    companies = companies.filter(c => 
      c.name.toLowerCase().includes(term) ||
      c.vat_number?.toLowerCase().includes(term) ||
      c.pan_number?.toLowerCase().includes(term)
    );
  }

  return { data: companies, isLoading: false };
}

export function useCreatePOSCompany() {
  const saveCompany = (company: Omit<POSCompany, "id">) => {
    const saved = localStorage.getItem(COMPANIES_KEY);
    const companies: POSCompany[] = saved ? JSON.parse(saved) : [];
    const newCompany: POSCompany = {
      ...company,
      id: Date.now().toString(),
    };
    companies.push(newCompany);
    localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies));
    return newCompany;
  };

  return {
    mutateAsync: async (company: Omit<POSCompany, "id">) => saveCompany(company),
    isPending: false,
  };
}

// Transaction management with localStorage
export function usePOSTransactions(filters?: {
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
}) {
  const getTransactions = (): POSTransaction[] => {
    const saved = localStorage.getItem(TRANSACTIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  };

  let transactions = getTransactions();
  
  if (filters?.startDate) {
    transactions = transactions.filter(t => t.created_at >= filters.startDate!);
  }
  if (filters?.endDate) {
    transactions = transactions.filter(t => t.created_at <= filters.endDate! + "T23:59:59");
  }
  if (filters?.paymentMethod) {
    transactions = transactions.filter(t => t.payment_method === filters.paymentMethod);
  }

  return { data: transactions, isLoading: false, refetch: () => {} };
}

export function saveTransaction(transaction: Omit<POSTransaction, "id" | "transaction_number" | "created_at">) {
  const saved = localStorage.getItem(TRANSACTIONS_KEY);
  const transactions: POSTransaction[] = saved ? JSON.parse(saved) : [];
  
  const newTransaction: POSTransaction = {
    ...transaction,
    id: Date.now().toString(),
    transaction_number: `TXN-${new Date().toISOString().slice(0,10).replace(/-/g, "")}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`,
    created_at: new Date().toISOString(),
  };
  
  transactions.unshift(newTransaction);
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  return newTransaction;
}
