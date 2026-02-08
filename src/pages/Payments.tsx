import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StripeConnect } from "@/components/finance/StripeConnect";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, CreditCard, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";

const payments = [
  { id: "PAY-001", guest: "Sarah Johnson", amount: 1560.00, date: "2024-12-20", status: "succeeded", method: "Visa •••• 4242" },
  { id: "PAY-002", guest: "Michael Chen", amount: 480.00, date: "2024-12-19", status: "pending", method: "Mastercard •••• 5555" },
  { id: "PAY-003", guest: "Emma Wilson", amount: 360.00, date: "2024-12-18", status: "succeeded", method: "Amex •••• 1001" },
];

const Payments = () => {
  return (
    <MainLayout title="Payments" subtitle="Manage transactions and payment processing">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Net Revenue"
            value="$42,500"
            change="+15% this month"
            changeType="positive"
            icon={DollarSign}
          />
          <MetricCard
            title="Successful Payments"
            value="156"
            change="+12 vs last month"
            changeType="positive"
            icon={CreditCard}
          />
          <MetricCard
            title="Pending Payouts"
            value="$5,240"
            change="Next: Dec 25"
            changeType="neutral"
            icon={ArrowUpRight}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Guest</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Method</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-mono text-xs">{payment.id}</TableCell>
                        <TableCell>{payment.guest}</TableCell>
                        <TableCell className="font-semibold">${payment.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={payment.status === "succeeded" ? "success" : "warning"}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {payment.method}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <StripeConnect />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Payments;
