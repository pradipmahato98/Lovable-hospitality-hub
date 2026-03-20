import { useState, useMemo } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Calendar, Briefcase, Mail, Phone, Clock3, MoreVertical, Edit, Trash2, Plus,
  Layout, User, Building2, CalendarCheck, GraduationCap, Heart, BarChart,
  LogOut, RefreshCw, ArrowUpRight, ArrowDownRight, CheckCircle,
  ChevronDown
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

    const grossItem = scaledEarnings.find(e => e.isTotal);
    const grossTotal = grossItem ? grossItem.value : 0;

    const additionTotal = scaledAdditions.reduce((acc, curr) => acc + curr.value, 0);
    const deductionTotal = scaledDeductions.reduce((acc, curr) => acc + curr.value, 0);

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
    { name: 'Earnings', value: 50, color: HRM_COLORS.mint.accent },
    { name: 'Additions', value: 25, color: '#FFB74D' },
    { name: 'Deductions', value: 15, color: '#FF8A65' },
    { name: 'Net Pay', value: 10, color: '#26C6DA' },
  ];

  if (roleLoading) {
    return (
      <MainLayout title="HRM Management" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Clock3 className="h-8 w-8 animate-spin text-muted-foreground" />
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
      <div className="bg-[#F8FAFC] min-h-screen -m-4 lg:-m-8 p-4 lg:p-8 space-y-6">
        <div className="max-w-[1400px] mx-auto space-y-6">

          {/* Employee Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-2">
            <div className="relative">
              <img
                src={employeeData.avatar}
                alt={employeeData.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-sm"
              />
              <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-md border border-gray-100 cursor-pointer">
                <Plus className="w-3 h-3 text-gray-500" />
              </div>
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-bold text-slate-800">{employeeData.name}</h1>
                <Badge className="bg-purple-100 text-purple-600 hover:bg-purple-100 border-none px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                  {employeeData.level}
                </Badge>
                <Badge className="bg-green-100 text-green-600 hover:bg-green-100 border-none px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                  {employeeData.type}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-1">
                <div className="flex items-center gap-1.5 text-[12px] text-slate-500 font-medium">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>{employeeData.role}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[12px] text-slate-500 font-medium">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{employeeData.employeeId}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[12px] text-slate-500 font-medium">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{employeeData.email}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[12px] text-slate-400 font-medium italic">
                  <Clock3 className="w-3.5 h-3.5" />
                  <span>Last active time is {employeeData.lastActive}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {statusPills.map((p) => (
              <button
                key={p}
                onClick={() => p !== "+7" && setStatus(p)}
                className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all border shadow-sm ${
                  status === p
                  ? "bg-[#4CAF50] text-white border-[#4CAF50]"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                } flex items-center gap-2 h-9`}
              >
                {p === "Active" && (
                  <div className="w-9 h-5 bg-white rounded-full relative p-1 flex items-center">
                    <div className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${status === "Active" ? "bg-[#4CAF50] ml-auto" : "bg-slate-200"}`} />
                  </div>
                )}
                {p}
              </button>
            ))}
          </div>

          {/* Main Navigation Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar bg-white p-1 rounded-xl shadow-sm border border-slate-100">
            {navTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                  ? "bg-[#E8F5E9] text-[#4CAF50]"
                  : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-[#4CAF50]" : "text-slate-400"}`} />
                {tab.label}
              </button>
            ))}
            <button className="p-2.5 text-slate-400 hover:bg-slate-50 rounded-lg ml-auto">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsContent value="payroll_finance" className="space-y-6">

              {/* Employee Self-Service Portal Card */}
              <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: HRM_COLORS.mint.bg }}>
                      <Layout className="w-5 h-5" style={{ color: HRM_COLORS.mint.accent }} />
                    </div>
                    <CardTitle className="text-[16px] font-bold text-slate-800">Employee self service portal</CardTitle>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-100">
                      {(["monthly", "quarterly", "annually"] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPeriod(p)}
                          className={`px-4 py-1.5 rounded-md text-[12px] font-bold transition-all ${
                            period === p ? "bg-white text-[#4CAF50] shadow-sm" : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-[12px] text-slate-600 font-medium">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>1 Jan 2023 - 30 Dec 2023</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Salary Chart */}
                    <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-slate-100">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[13px] font-bold text-slate-700">Salary</span>
                        <button className="text-[10px] text-slate-400 font-bold hover:text-slate-600">View All</button>
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
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2 px-2">
                        {pieData.map((item) => (
                          <div key={item.name} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-[10px] font-bold text-slate-500">{item.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Additions Chart */}
                    <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-slate-100">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[13px] font-bold text-slate-700">Additions</span>
                        <button className="text-[10px] text-slate-400 font-bold hover:text-slate-600">View All</button>
                      </div>
                      <div className="space-y-4">
                        {dashboardData.salaryProfile.additions.map((add, idx) => (
                          <div key={add.label} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="relative w-11 h-11 flex items-center justify-center">
                                <svg className="w-11 h-11 -rotate-90">
                                  <circle cx="22" cy="22" r="18" fill="transparent" stroke="#E2E8F0" strokeWidth="3" />
                                  <circle
                                    cx="22" cy="22" r="18" fill="transparent" stroke="#4CAF50"
                                    strokeWidth="3" strokeDasharray={113}
                                    strokeDashoffset={113 * (1 - (add.percentage / 100))}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                  <span className="text-[9px] font-extrabold text-[#4CAF50] leading-none">{add.percentage}%</span>
                                  <span className="text-[5px] font-bold text-slate-400 uppercase leading-none mt-0.5">{add.subLabel}</span>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-slate-400">@ {add.label}</span>
                            </div>
                            <span className="text-[13px] font-extrabold text-slate-700">{add.value.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Deductions Chart */}
                    <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-slate-100">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[13px] font-bold text-slate-700">Deductions</span>
                        <button className="text-[10px] text-slate-400 font-bold hover:text-slate-600">View All</button>
                      </div>
                      <div className="space-y-4">
                        {dashboardData.salaryProfile.deductions.map((ded, idx) => (
                          <div key={ded.label} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="relative w-11 h-11 flex items-center justify-center">
                                <svg className="w-11 h-11 -rotate-90">
                                  <circle cx="22" cy="22" r="18" fill="transparent" stroke="#E2E8F0" strokeWidth="3" />
                                  <circle
                                    cx="22" cy="22" r="18" fill="transparent" stroke="#FFB74D"
                                    strokeWidth="3" strokeDasharray={113}
                                    strokeDashoffset={113 * (1 - (ded.percentage / 100))}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                  <span className="text-[9px] font-extrabold text-[#FFB74D] leading-none">{ded.percentage}%</span>
                                  <span className="text-[5px] font-bold text-slate-400 uppercase leading-none mt-0.5">{ded.subLabel}</span>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-slate-400">@ {ded.label}</span>
                            </div>
                            <span className="text-[13px] font-extrabold text-slate-700">{ded.value.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* View Payslip */}
                    <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-slate-100 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[13px] font-bold text-slate-700">View Payslip</span>
                          <button className="text-[10px] text-slate-400 font-bold hover:text-slate-600">View All</button>
                        </div>
                        <p className="text-[11px] font-medium text-slate-400">Month of November</p>
                      </div>
                      <div className="space-y-0.5 pb-2">
                        <p className="text-[20px] font-extrabold text-slate-900 leading-tight">
                          {dashboardData.payrollSummary.netPayable.toLocaleString()}.00
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net Payable</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payroll Metric Cards */}
              <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: HRM_COLORS.mint.bg }}>
                      <CheckCircle className="w-5 h-5" style={{ color: HRM_COLORS.mint.accent }} />
                    </div>
                    <CardTitle className="text-[16px] font-bold text-slate-800">Payroll</CardTitle>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-100">
                      {(["monthly", "quarterly", "annually"] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPeriod(p)}
                          className={`px-4 py-1.5 rounded-md text-[12px] font-bold transition-all ${
                            period === p ? "bg-white text-[#4CAF50] shadow-sm" : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-[12px] text-slate-600 font-medium">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>1 Jan 2023 - 30 Dec 2023</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {[
                      { label: "Earnings", value: dashboardData.payrollSummary.earnings, icon: ArrowUpRight, iconColor: "#4CAF50", iconBg: "bg-[#E8F5E9]" },
                      { label: "Additions", value: dashboardData.payrollSummary.additions, icon: ArrowUpRight, iconColor: "#4CAF50", iconBg: "bg-[#E8F5E9]" },
                      { label: "Deductions", value: dashboardData.payrollSummary.deductions, icon: ArrowDownRight, iconColor: "#E53935", iconBg: "bg-red-50" },
                      { label: "Benefit", value: dashboardData.payrollSummary.benefit, suffix: "%", badge: "Company", icon: ArrowUpRight, iconColor: "#4CAF50", iconBg: "bg-[#E8F5E9]" },
                      { label: "Net Payable", value: dashboardData.payrollSummary.netPayable, icon: ArrowUpRight, iconColor: "#4CAF50", iconBg: "bg-[#E8F5E9]" },
                    ].map((metric) => (
                      <div key={metric.label} className="bg-[#F8FAFC] rounded-2xl p-4 border border-slate-100 relative group transition-all hover:bg-white hover:shadow-md">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <p className="text-[20px] font-extrabold text-slate-900 leading-none">
                                {metric.value.toLocaleString()}
                                {metric.suffix && <span className="text-[14px] font-bold">{metric.suffix}</span>}
                              </p>
                              {metric.badge && (
                                <Badge className="bg-purple-100 text-purple-600 hover:bg-purple-100 border-none px-1.5 py-0.5 rounded-md text-[9px] font-extrabold h-3.5">
                                  {metric.badge}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-2">
                              <span className="text-[12px] font-bold text-slate-400">{metric.label}</span>
                            </div>
                          </div>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm" style={{ backgroundColor: metric.iconBg.replace('bg-[', '').replace(']', '') }}>
                            <metric.icon className="w-4 h-4" color={metric.iconColor} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Salary Profile Setup Table */}
              <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Briefcase className="w-5 h-5 text-purple-600" />
                    </div>
                    <CardTitle className="text-[16px] font-bold text-slate-800">Salary Profile Setup</CardTitle>
                    <Badge className="bg-[#E8F5E9] text-[#4CAF50] border-none px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1">
                      Permanent
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-0.5 hover:bg-green-200/50 rounded">
                            <MoreVertical className="w-3 h-3" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="rounded-xl border-slate-100 shadow-xl">
                          <DropdownMenuItem className="gap-2 text-[12px] font-bold py-2"><Edit className="w-3.5 h-3.5" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-[12px] font-bold py-2 text-red-600"><Trash2 className="w-3.5 h-3.5" /> Delete</DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-[12px] font-bold py-2 border-t border-slate-50"><Plus className="w-3.5 h-3.5" /> New</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2 border-slate-200 text-slate-600 font-bold h-9 rounded-xl px-4 hover:bg-slate-50">
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/80">
                        <TableRow className="hover:bg-transparent border-slate-100">
                          <TableHead className="w-[18%] font-extrabold text-slate-700 text-[13px] h-12 px-6">Country</TableHead>
                          <TableHead className="w-[22%] font-extrabold text-slate-700 text-[13px] h-12">
                            <div className="flex items-center gap-2">Earnings <div className="w-4 h-4 bg-[#FCE4EC] rounded-full flex items-center justify-center"><Plus className="w-2.5 h-2.5 text-[#E91E63]" /></div></div>
                          </TableHead>
                          <TableHead className="w-[22%] font-extrabold text-slate-700 text-[13px] h-12">
                            <div className="flex items-center gap-2">Additions <div className="w-4 h-4 bg-[#F3E5F5] rounded-full flex items-center justify-center"><Plus className="w-2.5 h-2.5 text-[#9C27B0]" /></div></div>
                          </TableHead>
                          <TableHead className="w-[22%] font-extrabold text-slate-700 text-[13px] h-12">
                            <div className="flex items-center gap-2">Deductions <div className="w-4 h-4 bg-[#E8F5E9] rounded-full flex items-center justify-center"><Plus className="w-2.5 h-2.5 text-[#4CAF50]" /></div></div>
                          </TableHead>
                          <TableHead className="w-[10%] font-extrabold text-slate-700 text-[13px] h-12">Benefit</TableHead>
                          <TableHead className="w-[10%] font-extrabold text-slate-700 text-[13px] h-12 pr-6 text-right">Payable</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="border-none hover:bg-transparent align-top">
                          <TableCell className="py-6 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-100 flex items-center justify-center bg-white">
                                <span className="text-lg leading-none">🇧🇩</span>
                              </div>
                              <span className="text-[13px] font-bold text-slate-600">Bangladesh</span>
                            </div>
                          </TableCell>
                          <TableCell className="p-0 border-r border-slate-50/50">
                            <div className="space-y-4 py-6 px-4">
                              {dashboardData.salaryProfile.earnings.map(e => (
                                <div key={e.label} className="flex justify-between items-center">
                                  <span className={`text-[12px] font-bold ${e.isTotal ? 'text-slate-800' : 'text-slate-400'}`}>{e.label}</span>
                                  <span className={`text-[12px] font-extrabold ${e.isTotal ? 'text-slate-900' : 'text-slate-700'}`}>{e.value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="p-0 border-r border-slate-50/50">
                            <div className="space-y-4 py-6 px-4">
                              {dashboardData.salaryProfile.additions.map(e => (
                                <div key={e.label} className="flex justify-between items-center">
                                  <span className="text-[12px] text-slate-400 font-bold">{e.label}</span>
                                  <span className="text-[12px] text-slate-700 font-extrabold">{e.value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                </div>
                              ))}
                              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                                <span className="text-[12px] text-slate-800 font-extrabold">Total</span>
                                <span className="text-[12px] text-slate-800 font-extrabold">{dashboardData.payrollSummary.additions.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="p-0 border-r border-slate-50/50">
                            <div className="space-y-4 py-6 px-4">
                              {dashboardData.salaryProfile.deductions.map(e => (
                                <div key={e.label} className="flex justify-between items-center">
                                  <span className="text-[12px] text-slate-400 font-bold">{e.label}</span>
                                  <span className="text-[12px] text-slate-700 font-extrabold">{e.value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                </div>
                              ))}
                              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                                <span className="text-[12px] text-slate-800 font-extrabold">Total</span>
                                <span className="text-[12px] text-slate-800 font-extrabold">{dashboardData.payrollSummary.deductions.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="p-0">
                            <div className="space-y-4 py-6 px-4">
                              <div className="space-y-0.5">
                                <span className="text-[11px] text-slate-400 font-bold block">Company</span>
                                <span className="text-[12px] text-slate-700 font-extrabold">{employeeData.salaryProfile.benefit.company}</span>
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-[11px] text-slate-400 font-bold block">Employee</span>
                                <span className="text-[12px] text-slate-700 font-extrabold">{employeeData.salaryProfile.benefit.employee}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-6 pr-6 text-right">
                            <span className="text-[13px] font-extrabold text-slate-800">{dashboardData.salaryProfile.payable.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Employee Cost Card */}
              <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#FCE4EC] rounded-lg">
                      <User className="w-5 h-5 text-[#E91E63]" />
                    </div>
                    <CardTitle className="text-[16px] font-bold text-slate-800">Employee cost</CardTitle>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-100">
                      {(["monthly", "quarterly", "annually"] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPeriod(p)}
                          className={`px-4 py-1.5 rounded-md text-[12px] font-bold transition-all ${
                            period === p ? "bg-white text-[#4CAF50] shadow-sm" : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-[12px] text-slate-600 font-medium">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>1 Jan 2023 - 30 Dec 2023</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[380px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart
                        data={employeeData.monthlyCosts}
                        margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
                        barSize={14}
                        barGap={0}
                      >
                        <CartesianGrid strokeDasharray="0" vertical={false} stroke="#F1F5F9" />
                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }}
                          dy={15}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }}
                          tickFormatter={(value) => value === 0 ? "0" : `${value / 1000}k`}
                        />
                        <ReTooltip
                          cursor={{ fill: 'transparent' }}
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-4 rounded-xl shadow-2xl border border-slate-50 min-w-[200px]">
                                  <p className="text-[13px] font-extrabold text-slate-900 mb-3 pb-2 border-b border-slate-50">{label} Cost Breakdown</p>
                                  {payload.map((entry) => (
                                    <div key={entry.name} className="flex items-center justify-between gap-6 text-[12px] mb-2 last:mb-0">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                        <span className="text-slate-500 font-semibold">{entry.name}</span>
                                      </div>
                                      <span className="font-extrabold text-slate-900">${entry.value?.toLocaleString()}</span>
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
                          wrapperStyle={{ paddingBottom: '40px', fontSize: '11px', fontWeight: 600, color: '#64748B' }}
                          formatter={(value) => (
                            <span className="flex items-center gap-1">
                              {value} {value === "Other" && <ChevronDown className="w-3 h-3" />}
                            </span>
                          )}
                        />
                        <Bar dataKey="payroll" name="Payroll" stackId="a" fill="#2196F3" radius={[6, 6, 6, 6]} />
                        <Bar dataKey="loans" name="Loans" stackId="a" fill="#9C27B0" radius={[6, 6, 6, 6]} />
                        <Bar dataKey="expenseAccrual" name="Expense service accrual" stackId="a" fill="#4CAF50" radius={[6, 6, 6, 6]} />
                        <Bar dataKey="vacationAccrual" name="Vacation accrual" stackId="a" fill="#FF7043" radius={[6, 6, 6, 6]} />
                        <Bar dataKey="advance" name="Advance" stackId="a" fill="#EC407A" radius={[6, 6, 6, 6]} />
                        <Bar dataKey="other" name="Other" stackId="a" fill="#26C6DA" radius={[6, 6, 6, 6]} />
                      </ReBarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

            </TabsContent>

            <TabsContent value="personal">
              <div className="bg-white rounded-2xl p-20 text-center border border-slate-100 shadow-sm">
                <User className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-bold">Personal Information Content</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
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
