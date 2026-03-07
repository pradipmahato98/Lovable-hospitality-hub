import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Users, 
  Calendar, 
  Clock, 
  UserPlus,
  Search,
  Briefcase,
  Award,
  TrendingUp,
  FileText,
  IndianRupee,
  CalendarDays,
} from "lucide-react";
import { useIsAdmin } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { useQuickActions } from "@/contexts/QuickActionsContext";
import { PayrollPanel } from "@/components/hr/PayrollPanel";
import { LeaveManagement } from "@/components/hr/LeaveManagement";
import { ShiftScheduling } from "@/components/hr/ShiftScheduling";
import { PerformanceReviews } from "@/components/hr/PerformanceReviews";
import { StaffDirectoryTab } from "@/components/staff/StaffDirectoryTab";
import { StaffRecordsTab } from "@/components/hr/StaffRecordsTab";
import { StaffAddEditDialog } from "@/components/staff/StaffAddEditDialog";

const mockEmployees = [
  { id: "1", name: "John Smith", department: "Front Desk", position: "Receptionist", status: "Active", hireDate: "2023-01-15" },
  { id: "2", name: "Sarah Johnson", department: "Housekeeping", position: "Supervisor", status: "Active", hireDate: "2022-06-20" },
  { id: "3", name: "Mike Brown", department: "F&B", position: "Chef", status: "Active", hireDate: "2021-09-10" },
  { id: "4", name: "Emily Davis", department: "Front Desk", position: "Manager", status: "Active", hireDate: "2020-03-05" },
  { id: "5", name: "David Wilson", department: "Maintenance", position: "Technician", status: "On Leave", hireDate: "2023-04-18" },
  { id: "6", name: "Lisa Anderson", department: "F&B", position: "Server", status: "Active", hireDate: "2024-01-08" },
];

const departments = ["Front Desk", "Housekeeping", "F&B", "Maintenance", "Management"];

const HR = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "employees";
  const empSubTab = searchParams.get("sub") || "directory";

  const setActiveTab = (tab: string) => {
    setSearchParams(prev => {
      prev.set("tab", tab);
      return prev;
    });
  };

  const setEmpSubTab = (sub: string) => {
    setSearchParams(prev => {
      prev.set("tab", activeTab);
      prev.set("sub", sub);
      return prev;
    });
  };

  const { isAdmin, isLoading } = useIsAdmin();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const { setNewStaffOpen } = useQuickActions();

  if (isLoading) {
    return (
      <MainLayout title="HR Management" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const filteredEmployees = mockEmployees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = !selectedDept || emp.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const stats = [
    { label: "Total Employees", value: mockEmployees.length, icon: Users, color: "text-primary" },
    { label: "Departments", value: departments.length, icon: Briefcase, color: "text-blue-400" },
    { label: "On Leave", value: mockEmployees.filter(e => e.status === "On Leave").length, icon: Calendar, color: "text-amber-400" },
    { label: "New This Month", value: 2, icon: UserPlus, color: "text-success" },
  ];

  return (
    <MainLayout title="HR Management" subtitle="Employee management and HR operations">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-flex">
          <TabsTrigger value="employees" className="gap-2">
            <Users className="h-4 w-4" />
            Employees
          </TabsTrigger>
          <TabsTrigger value="payroll" className="gap-2">
            <IndianRupee className="h-4 w-4" />
            Payroll & Slips
          </TabsTrigger>
          <TabsTrigger value="leave" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Leave
          </TabsTrigger>
          <TabsTrigger value="schedules" className="gap-2">
            <Calendar className="h-4 w-4" />
            Schedules
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <Award className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Quick Actions */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setNewStaffOpen(true)}>
                  <UserPlus className="h-4 w-4" />
                  Add Employee
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => setActiveTab("schedules")}
                >
                  <Calendar className="h-4 w-4" />
                  Schedule Shifts
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setActiveTab("payroll")}>
                  <Clock className="h-4 w-4" />
                  Time & Attendance
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setActiveTab("leave")}>
                  <FileText className="h-4 w-4" />
                  Leave Requests
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => setActiveTab("performance")}
                >
                  <Award className="h-4 w-4" />
                  Performance Reviews
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setActiveTab("payroll")}>
                  <TrendingUp className="h-4 w-4" />
                  Payroll Reports
                </Button>
              </CardContent>
            </Card>

            {/* Employee List / Staff Directory */}
            <div className="lg:col-span-3 space-y-6">
              <Tabs value={empSubTab} onValueChange={setEmpSubTab} className="w-full">
                <TabsList className="bg-muted/50 p-1 h-auto inline-flex mb-4">
                  <TabsTrigger value="directory" className="gap-2 px-4 py-2">
                    <Users className="h-4 w-4" />
                    Staff Directory
                  </TabsTrigger>
                  <TabsTrigger value="records" className="gap-2 px-4 py-2">
                    <FileText className="h-4 w-4" />
                    Employee Records
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="directory" className="mt-0">
                  <StaffDirectoryTab />
                </TabsContent>

                <TabsContent value="records" className="mt-0">
                  <StaffRecordsTab />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payroll">
          <PayrollPanel />
        </TabsContent>

        <TabsContent value="leave">
          <LeaveManagement />
        </TabsContent>

        <TabsContent value="schedules">
          <ShiftScheduling />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceReviews />
        </TabsContent>
      </Tabs>

      <StaffAddEditDialog />
    </MainLayout>
  );
};

export default HR;
