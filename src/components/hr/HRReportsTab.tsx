import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { useStaffMembers, useStaffDepartments } from "@/hooks/useStaffMembers";
import { useHRStats } from "@/hooks/useHR";
import { formatCurrency } from "@/lib/utils";

export function HRReportsTab() {
  const { data: staff = [] } = useStaffMembers();
  const { data: departments = [] } = useStaffDepartments();
  const stats = useHRStats();

  const departmentBreakdown = departments.map(dept => ({
    name: dept,
    count: staff.filter(s => s.department === dept).length,
  })).sort((a, b) => b.count - a.count);

  const activeCount = staff.filter(s => s.status === "active").length;
  const onLeaveCount = staff.filter(s => s.status === "on_leave").length;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Staff</p>
                <p className="text-2xl font-bold">{staff.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">On Leave Today</p>
                <p className="text-2xl font-bold text-amber-500">{onLeaveCount}</p>
              </div>
              <Calendar className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Leave</p>
                <p className="text-2xl font-bold">{stats.pendingLeaveRequests}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paid Payroll</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalPayrollAmount)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Headcount by Department</CardTitle>
          <CardDescription>{departments.length} departments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {departmentBreakdown.map((dept) => (
              <div key={dept.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <span className="font-medium">{dept.name}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2"
                      style={{ width: `${Math.min(100, (dept.count / Math.max(staff.length, 1)) * 100)}%` }}
                    />
                  </div>
                  <Badge variant="outline">{dept.count}</Badge>
                </div>
              </div>
            ))}
            {departmentBreakdown.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No departments found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attendance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-success/10 text-center">
              <p className="text-3xl font-bold text-success">{stats.clockedInToday}</p>
              <p className="text-sm text-muted-foreground">Currently Clocked In</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/30 text-center">
              <p className="text-3xl font-bold">{stats.totalStaffToday}</p>
              <p className="text-sm text-muted-foreground">Total Clock Records</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
