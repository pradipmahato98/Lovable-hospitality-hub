import { useState } from "react";
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
  const { isAdmin, isLoading } = useIsAdmin();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("employees");
  const { setNewGuestOpen } = useQuickActions();

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
        </TabsList>

        <TabsContent value="employees">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Quick Actions */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setNewGuestOpen(true)}>
                  <UserPlus className="h-4 w-4" />
                  Add Employee
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
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
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Award className="h-4 w-4" />
                  Performance Reviews
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setActiveTab("payroll")}>
                  <TrendingUp className="h-4 w-4" />
                  Payroll Reports
                </Button>
              </CardContent>
            </Card>

            {/* Employee List */}
            <Card variant="elevated" className="lg:col-span-3">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Employees
                    </CardTitle>
                    <CardDescription>Manage staff records</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-48"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 overflow-x-auto pt-2">
                  <Button 
                    variant={selectedDept === null ? "secondary" : "outline"} 
                    size="sm"
                    onClick={() => setSelectedDept(null)}
                  >
                    All
                  </Button>
                  {departments.map(dept => (
                    <Button 
                      key={dept}
                      variant={selectedDept === dept ? "secondary" : "outline"} 
                      size="sm"
                      onClick={() => setSelectedDept(dept)}
                    >
                      {dept}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Hire Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.map((emp) => (
                        <TableRow key={emp.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="text-sm font-semibold text-primary">
                                  {emp.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <span className="font-medium">{emp.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{emp.department}</TableCell>
                          <TableCell>{emp.position}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline"
                              className={emp.status === "Active" 
                                ? "bg-success/20 text-success border-success/30"
                                : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                              }
                            >
                              {emp.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(emp.hireDate).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payroll">
          <PayrollPanel />
        </TabsContent>

        <TabsContent value="leave">
          <LeaveManagement />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default HR;
