import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Hotel } from "lucide-react";
import { format } from "date-fns";
import { SalaryDetails, calculateSalary } from "@/utils/salaryUtils";

interface SalarySlipProps {
  employeeName: string;
  employeeId: string;
  designation: string;
  department: string;
  payPeriod: string;
  employeePan: string;
  bankAccountNo: string;
  dateOfPayment: string;
  details: SalaryDetails;
}

export const SalarySlip: React.FC<SalarySlipProps> = ({
  employeeName,
  employeeId,
  designation,
  department,
  payPeriod,
  employeePan,
  bankAccountNo,
  dateOfPayment,
  details,
}) => {
  const { grossEarnings, totalDeductions, netSalary, netSalaryInWords } = calculateSalary(details);

  return (
    <div className="bg-white p-8 text-slate-900 border border-slate-200 rounded-lg shadow-sm max-w-4xl mx-auto font-sans" id="salary-slip">
      {/* Company Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-slate-900 rounded flex items-center justify-center">
            <Hotel className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-tight">LuxeStay Grand Hotel</h1>
            <p className="text-xs text-slate-500 font-medium">123 Luxury Avenue, Downtown, New York, NY 10001</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-black text-slate-900 bg-slate-100 px-3 py-1 rounded">SALARY SLIP</h2>
          <p className="text-sm font-semibold mt-1">Period: {payPeriod}</p>
        </div>
      </div>

      {/* Employee Details */}
      <div className="grid grid-cols-2 gap-x-12 gap-y-2 mb-8 text-sm">
        <div className="flex justify-between border-b border-slate-100 py-1">
          <span className="font-bold text-slate-600">Employee Name:</span>
          <span className="font-semibold text-slate-900">{employeeName}</span>
        </div>
        <div className="flex justify-between border-b border-slate-100 py-1">
          <span className="font-bold text-slate-600">Pay Period:</span>
          <span className="font-semibold text-slate-900">{payPeriod}</span>
        </div>
        <div className="flex justify-between border-b border-slate-100 py-1">
          <span className="font-bold text-slate-600">Employee ID:</span>
          <span className="font-semibold text-slate-900">{employeeId}</span>
        </div>
        <div className="flex justify-between border-b border-slate-100 py-1">
          <span className="font-bold text-slate-600">Employee PAN:</span>
          <span className="font-semibold text-slate-900">{employeePan}</span>
        </div>
        <div className="flex justify-between border-b border-slate-100 py-1">
          <span className="font-bold text-slate-600">Designation:</span>
          <span className="font-semibold text-slate-900">{designation}</span>
        </div>
        <div className="flex justify-between border-b border-slate-100 py-1">
          <span className="font-bold text-slate-600">Bank Account No:</span>
          <span className="font-semibold text-slate-900">{bankAccountNo}</span>
        </div>
        <div className="flex justify-between border-b border-slate-100 py-1">
          <span className="font-bold text-slate-600">Department:</span>
          <span className="font-semibold text-slate-900">{department}</span>
        </div>
        <div className="flex justify-between border-b border-slate-100 py-1">
          <span className="font-bold text-slate-600">Date of Payment:</span>
          <span className="font-semibold text-slate-900">{dateOfPayment}</span>
        </div>
      </div>

      {/* Earnings & Deductions Tables */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Earnings */}
        <div>
          <table className="w-full text-sm border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="p-2 text-left border border-slate-900 font-bold">Earnings Description</th>
                <th className="p-2 text-right border border-slate-900 font-bold">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="font-medium">
              <tr>
                <td className="p-2 border border-slate-200">Basic Salary</td>
                <td className="p-2 text-right border border-slate-200">{details.basicSalary.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-200">House Rent Allowance</td>
                <td className="p-2 text-right border border-slate-200">{details.houseRentAllowance.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-200">Conveyance Allowance</td>
                <td className="p-2 text-right border border-slate-200">{details.conveyanceAllowance.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-200">Medical Allowance</td>
                <td className="p-2 text-right border border-slate-200">{details.medicalAllowance.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-200">Special Allowance</td>
                <td className="p-2 text-right border border-slate-200">{details.specialAllowance.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-200">Other Earnings</td>
                <td className="p-2 text-right border border-slate-200">{details.otherEarnings.toLocaleString()}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold">
                <td className="p-2 border border-slate-200 uppercase">Gross Earnings</td>
                <td className="p-2 text-right border border-slate-200">{grossEarnings.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Deductions */}
        <div>
          <table className="w-full text-sm border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="p-2 text-left border border-slate-900 font-bold">Deductions Description</th>
                <th className="p-2 text-right border border-slate-900 font-bold">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="font-medium">
              <tr>
                <td className="p-2 border border-slate-200">Provident Fund</td>
                <td className="p-2 text-right border border-slate-200">{details.providentFund.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-200">Professional Tax</td>
                <td className="p-2 text-right border border-slate-200">{details.professionalTax.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-200">Income Tax (TDS)</td>
                <td className="p-2 text-right border border-slate-200">{details.incomeTax.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-200">Health Insurance</td>
                <td className="p-2 text-right border border-slate-200">{details.healthInsurance.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-200">Other Deductions</td>
                <td className="p-2 text-right border border-slate-200">{details.otherDeductions.toLocaleString()}</td>
              </tr>
              <tr className="invisible">
                <td className="p-2 border border-slate-200">&nbsp;</td>
                <td className="p-2 text-right border border-slate-200">&nbsp;</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold">
                <td className="p-2 border border-slate-200 uppercase">Total Deductions</td>
                <td className="p-2 text-right border border-slate-200">{totalDeductions.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Net Salary */}
      <div className="bg-slate-900 text-white p-4 rounded-lg mb-8 flex justify-between items-center shadow-md">
        <div>
          <p className="text-xs uppercase font-bold tracking-widest text-slate-400">Net Salary Payable</p>
          <p className="text-lg font-medium">{netSalaryInWords}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black">₹{netSalary.toLocaleString()}</p>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-12 mt-12 pt-8 border-t-2 border-slate-100">
        <div className="text-center">
          <div className="w-48 h-1 bg-slate-200 mx-auto mb-2"></div>
          <p className="text-sm font-bold text-slate-900 uppercase tracking-wider">Prepared By</p>
          <p className="text-xs text-slate-500 font-medium">HR Department</p>
        </div>
        <div className="text-center">
          <div className="w-48 h-1 bg-slate-200 mx-auto mb-2"></div>
          <p className="text-sm font-bold text-slate-900 uppercase tracking-wider">Authorized Signatory</p>
          <p className="text-xs text-slate-500 font-medium">Finance Manager</p>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-12 text-center text-[10px] text-slate-400 font-medium uppercase tracking-tighter border-t border-slate-50 pt-4">
        <p>This is a computer-generated document and does not require a physical signature.</p>
        <p className="mt-1">Generated on {format(new Date(), "PPpp")}</p>
      </div>
    </div>
  );
};
