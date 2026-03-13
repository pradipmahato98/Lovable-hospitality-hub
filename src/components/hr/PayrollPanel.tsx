import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  Clock,
  Calendar,
  TrendingUp,
  FileText,
  Play,
  Pause,
  Users,
  Calculator,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  baseSalary: number;
  hoursWorked: number;
  overtime: number;
  deductions: number;
  netPay: number;
  status: "pending" | "processed" | "paid";
  payPeriod: string;
}

interface TimeEntry {
  id: string;
  employeeName: string;
  clockIn: Date;
  clockOut: Date | null;
  status: "active" | "completed";
}

const mockPayrollRecords: PayrollRecord[] = [
  { id: "1", employeeId: "EMP001", employeeName: "John Smith", department: "Front Desk", baseSalary: 3500, hoursWorked: 160, overtime: 8, deductions: 450, netPay: 3250, status: "processed", payPeriod: "Jan 2024" },
  { id: "2", employeeId: "EMP002", employeeName: "Sarah Johnson", department: "Housekeeping", baseSalary: 3200, hoursWorked: 168, overtime: 12, deductions: 400, netPay: 3100, status: "pending", payPeriod: "Jan 2024" },
  { id: "3", employeeId: "EMP003", employeeName: "Mike Brown", department: "F&B", baseSalary: 4000, hoursWorked: 160, overtime: 0, deductions: 500, netPay: 3500, status: "paid", payPeriod: "Jan 2024" },
  { id: "4", employeeId: "EMP004", employeeName: "Emily Davis", department: "Front Desk", baseSalary: 4500, hoursWorked: 160, overtime: 4, deductions: 550, netPay: 4100, status: "pending", payPeriod: "Jan 2024" },
];

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  processed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  paid: "bg-success/20 text-success border-success/30",
};

export function PayrollPanel() {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(mockPayrollRecords);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [clockInDialogOpen, setClockInDialogOpen] = useState(false);
  const [employeeName, setEmployeeName] = useState("");

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update active time entries duration in real-time
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeEntries((prev) => [...prev]); // Trigger re-render
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const handleClockIn = () => {
    if (!employeeName.trim()) {
      toast.error("Please enter employee name");
      return;
    }
    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      employeeName: employeeName.trim(),
      clockIn: new Date(),
      clockOut: null,
      status: "active",
    };
    setTimeEntries([newEntry, ...timeEntries]);
    toast.success(`${employeeName} clocked in at ${format(new Date(), "HH:mm")}`);
    setEmployeeName("");
    setClockInDialogOpen(false);
  };

  const handleClockOut = (id: string) => {
    setTimeEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, clockOut: new Date(), status: "completed" as const } : entry
      )
    );
    const entry = timeEntries.find((e) => e.id === id);
    if (entry) {
      toast.success(`${entry.employeeName} clocked out at ${format(new Date(), "HH:mm")}`);
    }
  };

  const handleProcessPayroll = () => {
    if (!selectedPayroll) return;
    setPayrollRecords((prev) =>
      prev.map((r) => (r.id === selectedPayroll.id ? { ...r, status: "processed" as const } : r))
    );
    toast.success(`Payroll processed for ${selectedPayroll.employeeName}`);
    setProcessDialogOpen(false);
    setSelectedPayroll(null);
  };

  const handleMarkAsPaid = (id: string) => {
    setPayrollRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "paid" as const } : r))
    );
    toast.success("Marked as paid");
  };

  const calculateDuration = (clockIn: Date, clockOut: Date | null) => {
    const end = clockOut || currentTime;
    const diff = end.getTime() - clockIn.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const stats = {
    totalPayroll: payrollRecords.reduce((sum, r) => sum + r.netPay, 0),
    pending: payrollRecords.filter((r) => r.status === "pending").length,
    processed: payrollRecords.filter((r) => r.status === "processed").length,
    activeTimeEntries: timeEntries.filter((e) => e.status === "active").length,
  };

  return (
    <div className="space-y-6">
      {/* Real-time Clock */}
      <Card variant="glass" className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-primary animate-pulse" />
            <div>
              <p className="text-2xl font-bold font-mono">{format(currentTime, "HH:mm:ss")}</p>
              <p className="text-sm text-muted-foreground">{format(currentTime, "EEEE, MMMM d, yyyy")}</p>
            </div>
          </div>
          <Button variant="blue" className="gap-2" onClick={() => setClockInDialogOpen(true)}>
            <Play className="h-4 w-4" />
            Clock In
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Payroll</p>
                <p className="text-2xl font-bold">${stats.totalPayroll.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <FileText className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processed</p>
                <p className="text-2xl font-bold">{stats.processed}</p>
              </div>
              <Calculator className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Clocks</p>
                <p className="text-2xl font-bold">{stats.activeTimeEntries}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Time Entries */}
      {timeEntries.filter((e) => e.status === "active").length > 0 && (
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-success animate-pulse" />
              Active Time Entries
            </CardTitle>
            <CardDescription>Currently clocked in employees</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {timeEntries
                .filter((e) => e.status === "active")
                .map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-success/10 border border-success/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
                        <span className="text-sm font-semibold text-success">
                          {entry.employeeName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{entry.employeeName}</p>
                        <p className="text-xs text-muted-foreground">
                          Clocked in at {format(entry.clockIn, "HH:mm")} • Duration:{" "}
                          <span className="text-success font-mono">
                            {calculateDuration(entry.clockIn, null)}
                          </span>
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleClockOut(entry.id)}
                    >
                      <Pause className="h-4 w-4" />
                      Clock Out
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payroll Records */}
      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payroll Records
              </CardTitle>
              <CardDescription>January 2024 payroll cycle</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Overtime</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{record.employeeName}</p>
                        <p className="text-xs text-muted-foreground">{record.employeeId}</p>
                      </div>
                    </TableCell>
                    <TableCell>{record.department}</TableCell>
                    <TableCell>{record.hoursWorked}h</TableCell>
                    <TableCell>
                      {record.overtime > 0 ? (
                        <span className="text-amber-400">+{record.overtime}h</span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">${record.netPay.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[record.status]}>
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {record.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPayroll(record);
                            setProcessDialogOpen(true);
                          }}
                        >
                          Process
                        </Button>
                      )}
                      {record.status === "processed" && (
                        <Button variant="ghost" size="sm" onClick={() => handleMarkAsPaid(record.id)}>
                          Mark Paid
                        </Button>
                      )}
                      {record.status === "paid" && (
                        <span className="text-xs text-muted-foreground">Completed</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Clock In Dialog */}
      <Dialog open={clockInDialogOpen} onOpenChange={setClockInDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clock In</DialogTitle>
            <DialogDescription>Enter employee name to start time tracking</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Employee Name</Label>
              <Input
                id="employee"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="Enter name..."
              />
            </div>
            <div className="text-center p-4 rounded-lg bg-secondary/50">
              <p className="text-sm text-muted-foreground">Current Time</p>
              <p className="text-3xl font-bold font-mono">{format(currentTime, "HH:mm:ss")}</p>
            </div>
            <Button variant="blue" className="w-full gap-2" onClick={handleClockIn}>
              <Play className="h-4 w-4" />
              Clock In Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Process Payroll Dialog */}
      <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payroll</DialogTitle>
            <DialogDescription>
              Confirm payroll processing for {selectedPayroll?.employeeName}
            </DialogDescription>
          </DialogHeader>
          {selectedPayroll && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary/50 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Salary</span>
                  <span>${selectedPayroll.baseSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Overtime ({selectedPayroll.overtime}h)</span>
                  <span className="text-success">+${(selectedPayroll.overtime * 25).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deductions</span>
                  <span className="text-destructive">-${selectedPayroll.deductions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-border pt-2">
                  <span>Net Pay</span>
                  <span className="text-primary">${selectedPayroll.netPay.toLocaleString()}</span>
                </div>
              </div>
              <Button variant="blue" className="w-full" onClick={handleProcessPayroll}>
                Confirm & Process
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
