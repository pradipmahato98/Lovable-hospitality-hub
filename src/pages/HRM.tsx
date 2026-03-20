import { useState, useMemo } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Calendar, Clock, Briefcase,
  Mail, Phone, Clock3, MoreVertical, Edit, Trash2, Plus,
  Layout, User, Building2,
  CalendarCheck, GraduationCap, Heart, BarChart, LogOut, RefreshCw,
  ArrowUpRight, ArrowDownRight, CheckCircle
} from "lucide-react";
import { useIsAdmin } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { HRM_COLORS, employeeData } from "@/types/hrm";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend
} from 'recharts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const HRM = () => {
  const { isAdmin, isLoading: roleLoading } = useIsAdmin();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "payroll_finance";
  const [period, setPeriod] = useState<"monthly" | "quarterly" | "annually">("monthly");
  const [status, setStatus] = useState("Active");

  const handleTabChange = (value: string) => {
    setSearchParams(prev => {
      prev.set("tab", value);
      return prev;
    });
  };

  const multiplyValues = (val: number) => {
    if (period === "quarterly") return val * 3;
    if (period === "annually") return val * 12;
    return val;
  };

  const dashboardData = useMemo(() => {
    const scaledEarnings = employeeData.salaryProfile.earnings.map(e => ({ ...e, value: multiplyValues(e.value) }));
    const scaledAdditions = employeeData.salaryProfile.additions.map(e => ({ ...e, value: multiplyValues(e.value) }));
    const scaledDeductions = employeeData.salaryProfile.deductions.map(e => ({ ...e, value: multiplyValues(e.value) }));

    const grossTotal = scaledEarnings.reduce((acc, curr) => acc + curr.value, 0);
    const additionTotal = scaledAdditions.reduce((acc, curr) => acc + curr.value, 0);
    const deductionTotal = scaledDeductions.reduce((acc, curr) => acc + curr.value, 0);

    // Net Payable = (Gross + Additions) - Deductions
    const netPayableCalculated = (grossTotal + additionTotal) - deductionTotal;

    return {
      payrollSummary: {
        earnings: grossTotal,
        additions: additionTotal,
        deductions: deductionTotal,
        netPayable: netPayableCalculated,
        benefit: employeeData.payrollSummary.benefit
      },
      salaryProfile: {
        earnings: scaledEarnings,
        additions: scaledAdditions,
        deductions: scaledDeductions,
        payable: netPayableCalculated
      }
    };
  }, [period]);

  const pieData = [
    { name: 'Earnings', value: 50, color: '#4CAF50' },
    { name: 'Additions', value: 25, color: '#FFB74D' },
    { name: 'Deductions', value: 15, color: '#FF8A65' },
    { name: 'Net Pay', value: 10, color: '#26C6DA' },
  ];

  if (roleLoading) {
    return (
      <MainLayout title="HRM Management" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const statusPills = ["Active", "Training", "Learning", "Development", "+7"];
  const navTabs = [
    { id: "personal", label: "Personal", icon: User },
    { id: "organization", label: "Organization", icon: Building2 },
    { id: "attendance_leave", label: "Attendance & Leave", icon: CalendarCheck },
    { id: "payroll_finance", label: "Payroll & Finance", icon: RefreshCw },
    { id: "learning_development", label: "Learning & Development", icon: GraduationCap },
    { id: "benefits", label: "Benefits", icon: Heart },
    { id: "performance", label: "Performance", icon: BarChart },
    { id: "offboarding", label: "Offboarding", icon: LogOut },
  ];

  return (
    <MainLayout title="HRM Management" subtitle="Employee management and HR operations">
      <div className="max-w-[1400px] mx-auto space-y-6 pb-10">

        {/* Employee Header */}
        <Card className="border-none shadow-sm overflow-hidden bg-white">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="relative">
                <img
                  src={employeeData.avatar}
                  alt={employeeData.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-50"
                />
                <div className="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow-sm border border-gray-100 cursor-pointer">
                  <Plus className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{employeeData.name}</h1>
                  <Badge className="bg-purple-100 text-purple-600 hover:bg-purple-100 border-none px-3 py-0.5 rounded-full text-xs font-medium">
                    {employeeData.level}
                  </Badge>
                  <Badge className="bg-green-100 text-green-600 hover:bg-green-100 border-none px-3 py-0.5 rounded-full text-xs font-medium">
                    {employeeData.type}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-6">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Briefcase className="w-4 h-4" />
                    <span>{employeeData.role}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Phone className="w-4 h-4" />
                    <span>{employeeData.employeeId}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Mail className="w-4 h-4" />
                    <span>{employeeData.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock3 className="w-4 h-4" />
                    <span>Last active time is {employeeData.lastActive}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {statusPills.map((p) => (
            <button
              key={p}
              onClick={() => p !== "+7" && setStatus(p)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                status === p
                ? "bg-green-500 text-white border-green-500"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {p === "Active" && <span className="inline-block w-2 h-2 rounded-full bg-white mr-2" />}
              {p}
            </button>
          ))}
        </div>

        {/* Main Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar bg-white p-1 rounded-xl shadow-sm border border-gray-100">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                ? "bg-green-50 text-green-600"
                : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-green-600" : "text-gray-400"}`} />
              {tab.label}
            </button>
          ))}
          <button className="p-2.5 text-gray-400 hover:bg-gray-50 rounded-lg ml-auto">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsContent value="payroll_finance" className="space-y-6">

            {/* Employee Self-Service Portal Card */}
            <Card className="border border-gray-100 shadow-sm overflow-hidden bg-white">
              <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Layout className="w-5 h-5 text-green-600" />
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-800">Employee self service portal</CardTitle>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-gray-50 rounded-lg p-1">
                    {(["monthly", "quarterly", "annually"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                          period === p ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>1 Jan 2023 - 30 Dec 2023</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Salary Chart */}
                  <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-bold text-gray-700">Salary</span>
                      <button className="text-[10px] text-gray-400 font-medium hover:text-gray-600">View All</button>
                    </div>
                    <div className="h-40 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                      {pieData.map((item) => (
                        <div key={item.name} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-[10px] text-gray-500">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Additions Chart */}
                  <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-bold text-gray-700">Additions</span>
                      <button className="text-[10px] text-gray-400 font-medium hover:text-gray-600">View All</button>
                    </div>
                    <div className="space-y-4">
                      {dashboardData.salaryProfile.additions.map((add, idx) => (
                        <div key={add.label} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 flex items-center justify-center">
                              <svg className="w-10 h-10 -rotate-90">
                                <circle cx="20" cy="20" r="16" fill="transparent" stroke="#E2E8F0" strokeWidth="3" />
                                <circle
                                  cx="20" cy="20" r="16" fill="transparent" stroke="#4CAF50"
                                  strokeWidth="3" strokeDasharray={100}
                                  strokeDashoffset={100 - (idx === 0 ? 2 : 50)}
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center leading-tight">
                                <span className="text-[10px] font-bold text-green-600">{idx === 0 ? "2%" : "50%"}</span>
                                <span className="text-[6px] text-gray-400">per hour</span>
                              </div>
                            </div>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap">@ {add.label}</span>
                          </div>
                          <span className="text-sm font-bold text-gray-700">{add.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Deductions Chart */}
                  <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-bold text-gray-700">Deductions</span>
                      <button className="text-[10px] text-gray-400 font-medium hover:text-gray-600">View All</button>
                    </div>
                    <div className="space-y-4">
                      {dashboardData.salaryProfile.deductions.map((ded, idx) => (
                        <div key={ded.label} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 flex items-center justify-center">
                              <svg className="w-10 h-10 -rotate-90">
                                <circle cx="20" cy="20" r="16" fill="transparent" stroke="#E2E8F0" strokeWidth="3" />
                                <circle
                                  cx="20" cy="20" r="16" fill="transparent" stroke="#FFB74D"
                                  strokeWidth="3" strokeDasharray={100}
                                  strokeDashoffset={100 - (idx === 0 ? 2 : 50)}
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center leading-tight">
                                <span className="text-[10px] font-bold text-orange-400">{idx === 0 ? "2%" : "50%"}</span>
                                <span className="text-[6px] text-gray-400">of Gross</span>
                              </div>
                            </div>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap">@ {ded.label === "Tax @ 10%" ? "Tax" : "PF"}</span>
                          </div>
                          <span className="text-sm font-bold text-gray-700">{ded.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* View Payslip */}
                  <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold text-gray-700">View Payslip</span>
                        <button className="text-[10px] text-gray-400 font-medium hover:text-gray-600">View All</button>
                      </div>
                      <p className="text-xs text-gray-400 mb-6">Month of November</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xl font-extrabold text-gray-900">{dashboardData.payrollSummary.netPayable.toLocaleString()}.00</p>
                      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Net Payable</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payroll Metric Cards */}
            <Card className="border border-gray-100 shadow-sm overflow-hidden bg-white">
              <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-800">Payroll</CardTitle>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-gray-50 rounded-lg p-1">
                    {(["monthly", "quarterly", "annually"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                          period === p ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>1 Jan 2023 - 30 Dec 2023</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {[
                    { label: "Earnings", value: dashboardData.payrollSummary.earnings, color: "text-gray-900", icon: ArrowUpRight, iconColor: "text-green-500" },
                    { label: "Additions", value: dashboardData.payrollSummary.additions, color: "text-gray-900", icon: ArrowUpRight, iconColor: "text-green-500" },
                    { label: "Deductions", value: dashboardData.payrollSummary.deductions, color: "text-gray-900", icon: ArrowDownRight, iconColor: "text-red-500", iconBg: "bg-red-50" },
                    { label: "Benefit", value: dashboardData.payrollSummary.benefit, suffix: "%", badge: "Company", color: "text-gray-900", icon: ArrowUpRight, iconColor: "text-green-500" },
                    { label: "Net Payable", value: dashboardData.payrollSummary.netPayable, color: "text-gray-900", icon: ArrowUpRight, iconColor: "text-green-500" },
                  ].map((metric) => (
                    <div key={metric.label} className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-xl font-bold text-gray-900">
                            {metric.value.toLocaleString()}{metric.suffix || ""}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{metric.label}</span>
                            {metric.badge && (
                              <Badge className="bg-purple-100 text-purple-600 hover:bg-purple-100 border-none px-2 py-0 rounded-full text-[8px] font-bold h-4">
                                {metric.badge}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className={`p-1.5 rounded-full ${metric.iconBg || "bg-green-50"}`}>
                          <metric.icon className={`w-3 h-3 ${metric.iconColor}`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Salary Profile Setup Table */}
            <Card className="border border-gray-100 shadow-sm overflow-hidden bg-white">
              <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Briefcase className="w-5 h-5 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-800">Salary Profile Setup</CardTitle>
                  <Badge className="bg-green-100 text-green-600 border-none px-3 py-0.5 rounded-md text-xs font-medium">Permanent</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 hover:bg-gray-50 rounded">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem className="gap-2"><Edit className="w-4 h-4" /> Edit</DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-red-600"><Trash2 className="w-4 h-4" /> Delete</DropdownMenuItem>
                      <DropdownMenuItem className="gap-2"><Plus className="w-4 h-4" /> New</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Button variant="outline" size="sm" className="gap-2 border-gray-200 text-gray-600 font-bold h-9">
                  <Edit className="w-4 h-4" /> Edit
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50/50">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[20%] font-bold text-gray-700">Country</TableHead>
                        <TableHead className="w-[20%] font-bold text-gray-700">
                          <div className="flex items-center gap-2">Earnings <Plus className="w-3 h-3 p-0.5 bg-red-100 text-red-500 rounded-full" /></div>
                        </TableHead>
                        <TableHead className="w-[20%] font-bold text-gray-700">
                          <div className="flex items-center gap-2">Additions <Plus className="w-3 h-3 p-0.5 bg-purple-100 text-purple-500 rounded-full" /></div>
                        </TableHead>
                        <TableHead className="w-[20%] font-bold text-gray-700">
                          <div className="flex items-center gap-2">Deductions <Plus className="w-3 h-3 p-0.5 bg-green-100 text-green-500 rounded-full" /></div>
                        </TableHead>
                        <TableHead className="w-[10%] font-bold text-gray-700">Benefit</TableHead>
                        <TableHead className="w-[10%] font-bold text-gray-700">Payable</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="border-none hover:bg-transparent align-top">
                        <TableCell>
                          <div className="flex items-center gap-2 py-2">
                            <span className="text-xl">🇧🇩</span>
                            <span className="text-sm font-medium text-gray-600">Bangladesh</span>
                          </div>
                        </TableCell>
                        <TableCell className="p-0">
                          <div className="space-y-4 py-4 px-4">
                            {dashboardData.salaryProfile.earnings.map(e => (
                              <div key={e.label} className="flex justify-between items-center text-xs">
                                <span className="text-gray-400 font-medium">{e.label}</span>
                                <span className="text-gray-900 font-bold">{e.value.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="p-0">
                          <div className="space-y-4 py-4 px-4">
                            {dashboardData.salaryProfile.additions.map(e => (
                              <div key={e.label} className="flex justify-between items-center text-xs">
                                <span className="text-gray-400 font-medium">{e.label}</span>
                                <span className="text-gray-900 font-bold">{e.value.toFixed(2)}</span>
                              </div>
                            ))}
                            <div className="flex justify-between items-center text-xs pt-4 border-t border-gray-50">
                              <span className="text-gray-900 font-bold">Total</span>
                              <span className="text-gray-900 font-bold">{dashboardData.payrollSummary.additions.toLocaleString()}.00</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="p-0">
                          <div className="space-y-4 py-4 px-4">
                            {dashboardData.salaryProfile.deductions.map(e => (
                              <div key={e.label} className="flex justify-between items-center text-xs">
                                <span className="text-gray-400 font-medium">{e.label}</span>
                                <span className="text-gray-900 font-bold">{e.value.toFixed(2)}</span>
                              </div>
                            ))}
                            <div className="flex justify-between items-center text-xs pt-4 border-t border-gray-50">
                              <span className="text-gray-900 font-bold">Total</span>
                              <span className="text-gray-900 font-bold">{dashboardData.payrollSummary.deductions.toLocaleString()}.00</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="p-0">
                          <div className="space-y-4 py-4 px-4">
                            <div className="space-y-1">
                              <span className="text-[10px] text-gray-400 block">Company</span>
                              <span className="text-xs text-gray-900 font-medium">{employeeData.salaryProfile.benefit.company}</span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-gray-400 block">Employee</span>
                              <span className="text-xs text-gray-900 font-medium">{employeeData.salaryProfile.benefit.employee}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="py-2">
                            <span className="text-xs font-bold text-gray-900">{dashboardData.salaryProfile.payable.toLocaleString()}.00</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Employee Cost Card */}
            <Card className="border border-gray-100 shadow-sm overflow-hidden bg-white">
              <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <User className="w-5 h-5 text-red-400" />
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-800">Employee cost</CardTitle>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-gray-50 rounded-lg p-1">
                    {(["monthly", "quarterly", "annually"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                          period === p ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>1 Jan 2023 - 30 Dec 2023</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart
                      data={employeeData.monthlyCosts}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      barSize={15}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748B', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748B', fontSize: 12 }}
                        tickFormatter={(value) => `${value / 1000}k`}
                      />
                      <ReTooltip
                        cursor={{ fill: '#F8FAFC' }}
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
                                <p className="text-xs font-bold text-gray-900 mb-2">{label}</p>
                                {payload.map((entry) => (
                                  <div key={entry.name} className="flex items-center justify-between gap-4 text-[10px] mb-1">
                                    <span className="text-gray-500">{entry.name}:</span>
                                    <span className="font-bold text-gray-900">${entry.value?.toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ paddingBottom: '20px', fontSize: '12px' }}
                      />
                      <Bar dataKey="payroll" name="Payroll" stackId="a" fill="#2196F3" radius={[10, 10, 10, 10]} />
                      <Bar dataKey="loans" name="Loans" stackId="a" fill="#9C27B0" radius={[10, 10, 10, 10]} />
                      <Bar dataKey="expenseAccrual" name="Expense service accrual" stackId="a" fill="#4CAF50" radius={[10, 10, 10, 10]} />
                      <Bar dataKey="vacationAccrual" name="Vacation accrual" stackId="a" fill="#FF7043" radius={[10, 10, 10, 10]} />
                      <Bar dataKey="advance" name="Advance" stackId="a" fill="#EC407A" radius={[10, 10, 10, 10]} />
                      <Bar dataKey="other" name="Other" stackId="a" fill="#26C6DA" radius={[10, 10, 10, 10]} />
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

          </TabsContent>

          <TabsContent value="personal">
            <div className="p-10 text-center text-gray-400">Personal Information Section</div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

const HRMPage = () => (
  <ErrorBoundary>
    <HRM />
  </ErrorBoundary>
);

export default HRMPage;
