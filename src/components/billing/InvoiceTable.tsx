import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { Invoice } from "@/hooks/useFinanceExtended";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  paid: "bg-success/20 text-success border-success/30",
  pending: "bg-warning/20 text-warning border-warning/30",
  partial: "bg-primary/20 text-primary border-primary/30",
  overdue: "bg-destructive/20 text-destructive border-destructive/30",
  sent: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

interface InvoiceTableProps {
  invoices: Invoice[];
  isLoading: boolean;
  onExport: (invoice: Invoice) => void;
}

export const InvoiceTable = ({ invoices, isLoading, onExport }: InvoiceTableProps) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="whitespace-nowrap">Invoice ID</TableHead>
            <TableHead className="whitespace-nowrap">Guest</TableHead>
            <TableHead className="whitespace-nowrap hidden md:table-cell">Reservation</TableHead>
            <TableHead className="whitespace-nowrap hidden lg:table-cell">Date</TableHead>
            <TableHead className="whitespace-nowrap">Amount</TableHead>
            <TableHead className="whitespace-nowrap">Status</TableHead>
            <TableHead className="whitespace-nowrap">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                Loading invoices...
              </TableCell>
            </TableRow>
          ) : invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                No invoices found
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice) => (
              <TableRow key={invoice.id} className="border-border hover:bg-secondary/50">
                <TableCell className="font-mono text-sm text-primary whitespace-nowrap">
                  {invoice.invoice_number}
                </TableCell>
                <TableCell className="font-medium whitespace-nowrap">
                  {invoice.guest ? `${invoice.guest.first_name} ${invoice.guest.last_name}` : "N/A"}
                </TableCell>
                <TableCell className="text-muted-foreground hidden md:table-cell">
                  {invoice.reservation_id || "N/A"}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {format(new Date(invoice.invoice_date), "MMM dd, yyyy")}
                </TableCell>
                <TableCell className="font-semibold whitespace-nowrap">
                  ${invoice.total.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={statusColors[invoice.status] || statusColors.pending}
                  >
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => onExport(invoice)} className="gap-2">
                    <Download className="h-4 w-4" />
                    PDF
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
