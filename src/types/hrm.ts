export const HRM_COLORS = {
  mint: {
    bg: "#E8F5E9",
    accent: "#4CAF50",
    light: "#F1F8F1",
  },
  lavender: {
    bg: "#F3E5F5",
    accent: "#9C27B0",
    light: "#F9F5FA",
  },
  blue: {
    bg: "#E3F2FD",
    accent: "#2196F3",
    light: "#F0F7FF",
  },
  pink: {
    bg: "#FCE4EC",
    accent: "#E91E63",
    light: "#FFF1F5",
  },
  gray: {
    text: "#64748B",
    title: "#1E293B",
    border: "#F1F5F9",
    bg: "#F8FAFC",
  },
  white: "#FFFFFF",
};

export const employeeData = {
  id: "emp-001",
  name: "Robin Mia",
  role: "UI/UX Designer",
  employeeId: "01302803634",
  email: "social@gtrbd.com",
  lastActive: "today - 1:37 PM",
  avatar: "https://i.pravatar.cc/150?u=robin",
  status: "Active",
  type: "Full time",
  level: "Admin",
  country: "Bangladesh",
  currency: "USD",

  salaryProfile: {
    earnings: [
      { label: "Gross salary", value: 15000.00, isTotal: true },
      { label: "Basic salary", value: 7500.00 },
      { label: "House rent allowance", value: 4000.00 },
      { label: "Medical allowance", value: 2000.00 },
      { label: "Transport allowance", value: 1500.00 },
    ],
    additions: [
      { label: "Overtime", value: 1500.00, percentage: 2, subLabel: "of Day" },
      { label: "Bonuses", value: 1000.00, percentage: 50, subLabel: "of Gross" },
    ],
    deductions: [
      { label: "Tax", value: 500.00, percentage: 2, subLabel: "of Gross" },
      { label: "PF", value: 1000.00, percentage: 50, subLabel: "of PF" },
    ],
    benefit: {
      company: "8% of Gross",
      employee: "10% of Gross",
    }
  },

  payrollSummary: {
    benefit: 8,
  },

  monthlyCosts: [
    { month: "Jan", payroll: 45000, loans: 12000, expenseAccrual: 8000, vacationAccrual: 5000, advance: 3000, other: 2000 },
    { month: "Feb", payroll: 42000, loans: 10000, expenseAccrual: 7000, vacationAccrual: 4500, advance: 2500, other: 1500 },
    { month: "Mar", payroll: 48000, loans: 15000, expenseAccrual: 9000, vacationAccrual: 6000, advance: 4000, other: 3000 },
    { month: "Apr", payroll: 38000, loans: 8000, expenseAccrual: 6000, vacationAccrual: 4000, advance: 2000, other: 1000 },
    { month: "May", payroll: 46000, loans: 13000, expenseAccrual: 8500, vacationAccrual: 5500, advance: 3500, other: 2500 },
    { month: "Jun", payroll: 40000, loans: 9000, expenseAccrual: 6500, vacationAccrual: 4200, advance: 2200, other: 1200 },
    { month: "Jul", payroll: 47000, loans: 14000, expenseAccrual: 8800, vacationAccrual: 5800, advance: 3800, other: 2800 },
    { month: "Aug", payroll: 41000, loans: 11000, expenseAccrual: 7500, vacationAccrual: 4800, advance: 2800, other: 1800 },
    { month: "Sep", payroll: 43000, loans: 12500, expenseAccrual: 7800, vacationAccrual: 5200, advance: 3200, other: 2200 },
    { month: "Oct", payroll: 45000, loans: 13500, expenseAccrual: 8200, vacationAccrual: 5600, advance: 3600, other: 2600 },
    { month: "Nov", payroll: 49000, loans: 16000, expenseAccrual: 9500, vacationAccrual: 6500, advance: 4500, other: 3500 },
    { month: "Dec", payroll: 52000, loans: 18000, expenseAccrual: 10000, vacationAccrual: 7000, advance: 5000, other: 4000 },
  ]
};
