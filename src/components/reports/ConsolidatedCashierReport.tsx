import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, Filter, User, Terminal, DollarSign, CreditCard } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { exportToExcel } from "@/lib/reportExport";

interface CashierTransaction {
  id: string;
  staff_name: string;
  source: "POS" | "Front Desk";
  amount: number;
  payment_method: string;
  timestamp: string;
  reference: string;
}

export const ConsolidatedCashierReport = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");

  const { data: posTransactions = [], isLoading: posLoading } = useQuery({
    queryKey: ["cashier-pos-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pos_transactions")
        .select("id, total, payment_method, created_at, transaction_number, created_by");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: frontDeskPayments = [], isLoading: fdLoading } = useQuery({
    queryKey: ["cashier-fd-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, amount, payment_method, payment_date, payment_number, received_by");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["user-profiles-short"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("user_id, first_name, last_name");
      if (error) throw error;
      return data || [];
    }
  });

  const consolidatedData = useMemo(() => {
    const pos = posTransactions.map(t => {
      const profile = profiles.find(p => p.user_id === (t as any).created_by);
      return {
        id: t.id,
        staff_name: profile ? `${profile.first_name} ${profile.last_name}` : "POS System",
        source: "POS" as const,
        amount: t.total,
        payment_method: t.payment_method,
        timestamp: t.created_at,
        reference: t.transaction_number,
      };
    });

    const fd = frontDeskPayments.map(p => {
      const profile = profiles.find(prof => prof.user_id === p.received_by);
      return {
        id: p.id,
        staff_name: profile ? `${profile.first_name} ${profile.last_name}` : "Front Desk Agent",
        source: "Front Desk" as const,
        amount: p.amount,
        payment_method: p.payment_method,
        timestamp: p.payment_date,
        reference: p.payment_number,
      };
    });

    return [...pos, ...fd].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [posTransactions, frontDeskPayments]);

  const filteredData = consolidatedData.filter(t => {
    const matchesSearch = t.staff_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = methodFilter === "all" || t.payment_method.toLowerCase() === methodFilter.toLowerCase();
    return matchesSearch && matchesMethod;
  });

  const totalsByMethod = useMemo(() => {
    return filteredData.reduce((acc, curr) => {
      const method = curr.payment_method || "Unknown";
      acc[method] = (acc[method] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);
  }, [filteredData]);

  const handleExport = () => {
    exportToExcel({
      title: "Consolidated_Cashier_Report",
      headers: ["Timestamp", "Staff", "Source", "Reference", "Method", "Amount"],
      rows: filteredData.map(t => [
        format(new Date(t.timestamp), "yyyy-MM-dd HH:mm"),
        t.staff_name,
        t.source,
        t.reference,
        t.payment_method,
        t.amount
      ])
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" /> Consolidated Cashier Report
          </h2>
          <p className="text-sm text-muted-foreground">Audit tool for cross-module payment tracking.</p>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" /> Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(totalsByMethod).map(([method, total]) => (
          <Card key={method} className="bg-primary/5">
            <CardContent className="pt-4">
              <p className="text-xs font-bold uppercase text-muted-foreground mb-1">{method}</p>
              <p className="text-xl font-bold">{formatCurrency(total)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Payment Audit Trail</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reference or staff..."
                  className="pl-9 w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Staff Member</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posLoading || fdLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Loading transactions...</TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No transactions found</TableCell>
                </TableRow>
              ) : (
                filteredData.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs font-mono">
                      {format(new Date(t.timestamp), "MMM dd, HH:mm")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{t.staff_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={t.source === "POS" ? "bg-blue-50" : "bg-purple-50"}>
                        {t.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{t.reference}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {t.payment_method.toLowerCase().includes("card") ? (
                          <CreditCard className="h-3 w-3" />
                        ) : (
                          <DollarSign className="h-3 w-3" />
                        )}
                        <span className="capitalize">{t.payment_method}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(t.amount)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
