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
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { usePayrollRecords, useTimeClock, useHRStats, useClockIn, useClockOut } from "@/hooks/useHR";
import { useStaffMembers } from "@/hooks/useStaffMembers";

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  draft: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  approved: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  paid: "bg-success/20 text-success border-success/30",
};

export function PayrollPanel() {
  const { data: payrollRecords = [], isLoading: loadingPayroll } = usePayrollRecords();
  const { data: timeEntries = [] } = useTimeClock();
  const clockIn = useClockIn();
  const clockOut = useClockOut();
  const { data: staffMembers = [] } = useStaffMembers();
  const hrStats = useHRStats();

  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<typeof payrollRecords[number] | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [clockInDialogOpen, setClockInDialogOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState("");

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClockIn = async () => {
    if (!selectedStaffId) {
      toast.error("Please select an employee");
      return;
    }
    try {
      await clockIn.mutateAsync(selectedStaffId);
      toast.success("Clocked in successfully");
      setClockInDialogOpen(false);
      setSelectedStaffId("");
    } catch (error) {
      toast.error("Failed to clock in");
    }
  };

  const handleClockOut = async (id: string) => {
    try {
      await clockOut.mutateAsync({ id, breakMinutes: 0 });
      toast.success("Clocked out successfully");
    } catch (error) {
      toast.error("Failed to clock out");
    }
  };

  const calculateDuration = (clockInStr: string, clockOutStr: string | null) => {
    const start = new Date(clockInStr);
    const end = clockOutStr ? new Date(clockOutStr) : currentTime;
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
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
          <Button variant="gold" className="gap-2" onClick={() => setClockInDialogOpen(true)}>
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
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold">${hrStats.totalPayrollAmount.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Payroll</p>
                <p className="text-2xl font-bold">{hrStats.pendingPayroll}</p>
              </div>
              <FileText className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Clocks</p>
                <p className="text-2xl font-bold">{hrStats.clockedInToday}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Staff Today</p>
                <p className="text-2xl font-bold">{hrStats.totalStaffToday}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Time Entries */}
      {timeEntries.filter((e) => !e.clock_out).length > 0 && (
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
                .filter((e) => !e.clock_out)
                .map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-success/10 border border-success/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
                        <span className="text-sm font-semibold text-success">
                          {entry.staff?.first_name?.[0]}{entry.staff?.last_name?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{entry.staff?.first_name} {entry.staff?.last_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Clocked in at {format(new Date(entry.clock_in), "HH:mm")} • Duration:{" "}
                          <span className="text-success font-mono">
                            {calculateDuration(entry.clock_in, null)}
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
              <CardDescription>Current payroll cycle</CardDescription>
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
                        <p className="font-medium">{record.staff?.first_name} {record.staff?.last_name}</p>
                        <p className="text-xs text-muted-foreground">{record.staff?.employee_id}</p>
                      </div>
                    </TableCell>
                    <TableCell>{record.staff?.department || "N/A"}</TableCell>
                    <TableCell>{record.overtime_hours + 160}h</TableCell>
                    <TableCell>
                      {record.overtime_hours > 0 ? (
                        <span className="text-amber-400">+{record.overtime_hours}h</span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">${record.net_pay.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[record.status]}>
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {record.status === "draft" && (
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
                      {record.status === "approved" && (
                        <span className="text-xs text-blue-400">Ready to Pay</span>
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
            <DialogDescription>Select employee to start time tracking</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Select Employee</Label>
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.map(staff => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.first_name} {staff.last_name} ({staff.employee_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-center p-4 rounded-lg bg-secondary/50">
              <p className="text-sm text-muted-foreground">Current Time</p>
              <p className="text-3xl font-bold font-mono">{format(currentTime, "HH:mm:ss")}</p>
            </div>
            <Button variant="gold" className="w-full gap-2" onClick={handleClockIn} disabled={clockIn.isPending}>
              {clockIn.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
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
              Confirm payroll processing for {selectedPayroll?.staff?.first_name} {selectedPayroll?.staff?.last_name}
            </DialogDescription>
          </DialogHeader>
          {selectedPayroll && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary/50 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Salary</span>
                  <span>${selectedPayroll.basic_salary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Overtime ({selectedPayroll.overtime_hours}h)</span>
                  <span className="text-success">+${selectedPayroll.overtime_pay.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deductions</span>
                  <span className="text-destructive">-${selectedPayroll.deductions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-border pt-2">
                  <span>Net Pay</span>
                  <span className="text-primary">${selectedPayroll.net_pay.toLocaleString()}</span>
                </div>
              </div>
              <Button variant="gold" className="w-full" onClick={() => setProcessDialogOpen(false)}>
                Confirm & Process
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
