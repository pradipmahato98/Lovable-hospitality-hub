
import { describe, it, expect } from 'vitest';
import { calculateSalary, numberToWords } from './salaryUtils';

describe('salaryUtils', () => {
  describe('calculateSalary', () => {
    it('should correctly calculate gross, deductions, and net salary', () => {
      const details = {
        basicSalary: 30000,
        houseRentAllowance: 12000,
        conveyanceAllowance: 1600,
        medicalAllowance: 1250,
        specialAllowance: 5000,
        otherEarnings: 2000,
        providentFund: 1800,
        professionalTax: 200,
        incomeTax: 1500,
        healthInsurance: 500,
        otherDeductions: 0,
      };

      const result = calculateSalary(details);

      expect(result.grossEarnings).toBe(51850);
      expect(result.totalDeductions).toBe(4000);
      expect(result.netSalary).toBe(47850);
      expect(result.netSalaryInWords).toBe('Forty Seven Thousand Eight Hundred and Fifty Only');
    });

    it('should handle zero net salary and not return negative values', () => {
      const details = {
        basicSalary: 1000,
        houseRentAllowance: 0,
        conveyanceAllowance: 0,
        medicalAllowance: 0,
        specialAllowance: 0,
        otherEarnings: 0,
        providentFund: 2000, // Higher than gross
        professionalTax: 0,
        incomeTax: 0,
        healthInsurance: 0,
        otherDeductions: 0,
      };

      const result = calculateSalary(details);

      expect(result.netSalary).toBe(0);
      expect(result.netSalaryInWords).toBe('Only'); // numberToWords(0) is ''
    });
  });

  describe('numberToWords', () => {
    it('should convert numbers to words correctly', () => {
      expect(numberToWords(123)).toBe('One Hundred and Twenty Three');
      expect(numberToWords(1000)).toBe('One Thousand');
      expect(numberToWords(51850)).toBe('Fifty One Thousand Eight Hundred and Fifty');
      expect(numberToWords(100000)).toBe('One Lakh');
    });
  });
});
