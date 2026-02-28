import { format } from "date-fns";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export interface SalaryDetails {
  basicSalary: number;
  houseRentAllowance: number;
  conveyanceAllowance: number;
  medicalAllowance: number;
  specialAllowance: number;
  otherEarnings: number;
  providentFund: number;
  professionalTax: number;
  incomeTax: number;
  healthInsurance: number;
  otherDeductions: number;
}

export interface CalculatedSalary {
  grossEarnings: number;
  totalDeductions: number;
  netSalary: number;
  netSalaryInWords: string;
}

export interface EmployeeInfo {
  employeeName: string;
  employeeId: string;
  designation: string;
  department: string;
  payPeriod: string;
  employeePan: string;
  bankAccountNo: string;
  dateOfPayment: string;
}

/**
 * Calculates net salary and generates words representation.
 * All financial calculations are guarded against negative values.
 *
 * @param details Salary breakdown components (Basic, HRA, etc.)
 * @returns Calculated earnings, deductions, and net salary with words
 */
export function calculateSalary(details: SalaryDetails): CalculatedSalary {
  const grossEarnings =
    details.basicSalary +
    details.houseRentAllowance +
    details.conveyanceAllowance +
    details.medicalAllowance +
    details.specialAllowance +
    details.otherEarnings;

  const totalDeductions =
    details.providentFund +
    details.professionalTax +
    details.incomeTax +
    details.healthInsurance +
    details.otherDeductions;

  const netSalary = Math.max(0, Math.round(grossEarnings - totalDeductions));

  return {
    grossEarnings,
    totalDeductions,
    netSalary,
    netSalaryInWords: (numberToWords(netSalary) + " Only").trim(),
  };
}

export function numberToWords(num: number): string {
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if ((num = num.toString()).length > 9) return 'overflow';
  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';

  let str = '';
  str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + ' Crore ' : '';
  str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + ' Lakh ' : '';
  str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + ' Thousand ' : '';
  str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + ' Hundred ' : '';
  str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';

  return str.trim();
}

export function downloadSalarySlipPDF(info: EmployeeInfo, details: SalaryDetails) {
  const { grossEarnings, totalDeductions, netSalary, netSalaryInWords } = calculateSalary(details);
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(40);
  doc.text("LuxeStay Grand Hotel", 105, 20, { align: "center" });
  doc.setFontSize(10);
  doc.text("123 Luxury Avenue, Downtown, New York, NY 10001", 105, 26, { align: "center" });

  doc.setLineWidth(0.5);
  doc.line(20, 30, 190, 30);

  doc.setFontSize(16);
  doc.text("SALARY SLIP", 105, 40, { align: "center" });
  doc.setFontSize(10);
  doc.text(`Period: ${info.payPeriod}`, 105, 46, { align: "center" });

  // Employee Details
  const employeeData = [
    ["Employee Name:", info.employeeName, "Pay Period:", info.payPeriod],
    ["Employee ID:", info.employeeId, "Employee PAN:", info.employeePan],
    ["Designation:", info.designation, "Bank Account No:", info.bankAccountNo],
    ["Department:", info.department, "Date of Payment:", info.dateOfPayment]
  ];

  autoTable(doc, {
    startY: 55,
    body: employeeData,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 35 },
      1: { cellWidth: 50 },
      2: { fontStyle: "bold", cellWidth: 35 },
      3: { cellWidth: 50 }
    }
  });

  // Earnings and Deductions Table
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  autoTable(doc, {
    startY: finalY,
    head: [["Earnings Description", "Amount (Rs.)", "Deductions Description", "Amount (Rs.)"]],
    body: [
      ["Basic Salary", details.basicSalary.toLocaleString(), "Provident Fund", details.providentFund.toLocaleString()],
      ["House Rent Allowance", details.houseRentAllowance.toLocaleString(), "Professional Tax", details.professionalTax.toLocaleString()],
      ["Conveyance Allowance", details.conveyanceAllowance.toLocaleString(), "Income Tax (TDS)", details.incomeTax.toLocaleString()],
      ["Medical Allowance", details.medicalAllowance.toLocaleString(), "Health Insurance", details.healthInsurance.toLocaleString()],
      ["Special Allowance", details.specialAllowance.toLocaleString(), "Other Deductions", details.otherDeductions.toLocaleString()],
      ["Other Earnings", details.otherEarnings.toLocaleString(), "", ""],
    ],
    foot: [["Gross Earnings", grossEarnings.toLocaleString(), "Total Deductions", totalDeductions.toLocaleString()]],
    theme: "grid",
    headStyles: { fillColor: [40, 40, 40] },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
    styles: { fontSize: 9 }
  });

  // Net Salary
  const netY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Net Salary Payable: Rs. ${netSalary.toLocaleString()}`, 20, netY);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`In Words: ${netSalaryInWords}`, 20, netY + 7);

  // Signatures
  const sigY = netY + 30;
  doc.line(20, sigY, 80, sigY);
  doc.text("Prepared By", 50, sigY + 5, { align: "center" });
  doc.line(130, sigY, 190, sigY);
  doc.text("Authorized Signatory", 160, sigY + 5, { align: "center" });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("This is a computer-generated document and does not require a physical signature.", 105, 280, { align: "center" });
  doc.text(`Generated on ${format(new Date(), "PPpp")}`, 105, 285, { align: "center" });

  doc.save(`SalarySlip_${info.employeeId}_${info.payPeriod.replace(" ", "_")}.pdf`);
}

export function downloadSalarySlipExcel(info: EmployeeInfo, details: SalaryDetails) {
  const { grossEarnings, totalDeductions, netSalary, netSalaryInWords } = calculateSalary(details);

  const wb = XLSX.utils.book_new();

  const data = [
    ["LuxeStay Grand Hotel"],
    ["123 Luxury Avenue, Downtown, New York, NY 10001"],
    [""],
    ["SALARY SLIP", "", "", "Period:", info.payPeriod],
    [""],
    ["Employee Name:", info.employeeName, "", "Pay Period:", info.payPeriod],
    ["Employee ID:", info.employeeId, "", "Employee PAN:", info.employeePan],
    ["Designation:", info.designation, "", "Bank Account No:", info.bankAccountNo],
    ["Department:", info.department, "", "Date of Payment:", info.dateOfPayment],
    [""],
    ["Earnings", "Amount (Rs.)", "Deductions", "Amount (Rs.)"],
    ["Basic Salary", details.basicSalary, "Provident Fund", details.providentFund],
    ["House Rent Allowance", details.houseRentAllowance, "Professional Tax", details.professionalTax],
    ["Conveyance Allowance", details.conveyanceAllowance, "Income Tax (TDS)", details.incomeTax],
    ["Medical Allowance", details.medicalAllowance, "Health Insurance", details.healthInsurance],
    ["Special Allowance", details.specialAllowance, "Other Deductions", details.otherDeductions],
    ["Other Earnings", details.otherEarnings, "", ""],
    ["Gross Earnings", grossEarnings, "Total Deductions", totalDeductions],
    [""],
    ["Net Salary (Rs.)", netSalary],
    ["Net Amount in Words:", netSalaryInWords],
    [""],
    [""],
    ["Prepared By", "", "", "Authorized Signatory"],
    [""],
    ["This is a computer-generated document and does not require a physical signature."],
    [`Generated on ${format(new Date(), "PPpp")}`]
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  ws['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 25 }, { wch: 20 }, { wch: 20 }];

  XLSX.utils.book_append_sheet(wb, ws, "Salary Slip");
  XLSX.writeFile(wb, `SalarySlip_${info.employeeId}_${info.payPeriod.replace(" ", "_")}.xlsx`);
}
