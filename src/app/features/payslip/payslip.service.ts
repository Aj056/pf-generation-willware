import { Injectable, signal } from '@angular/core';
import { Employee } from './employeeService';

export interface PayslipData {
  month: string;
  year: string;
  employeeName: string;
  workLocation: string;
  employeeId: string;
  wwtId: string; // Add wwtId field
  lopDays: number;
  designation: string;
  workedDays: number;
  department: string;
  bankAccount: string;
  joiningDate: string;
  uan: string;
  esiNumber: string;
  pan: string;
  basicPay: number;
  hra: number;
  others: number;
  incentive: number;
  pf: number;
  esi: number;
  tds: number;
  staffAdvance: number;
  totalEarnings: number;
  totalDeductions: number;
  netPay: number;
  amountWords: string;
  paymentMode: string;
  additionalFiled: string; // Add additionalFiled field
}

@Injectable({ providedIn: 'root' })
export class PayslipService {
  // Signal to store selected employee data
  private readonly _selectedEmployee = signal<Employee | null>(null);
  
  // Public readonly signal
  readonly selectedEmployee = this._selectedEmployee.asReadonly();

  // Method to set selected employee
  setSelectedEmployee(employee: Employee): void {
    this._selectedEmployee.set(employee);
  }

  // Method to clear selected employee
  clearSelectedEmployee(): void {
    this._selectedEmployee.set(null);
  }

  // Method to convert employee data to payslip data
  getPayslipDataFromEmployee(employee: Employee): Partial<PayslipData> {
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
    const currentYear = currentDate.getFullYear().toString();

    // Use actual employee data if available, otherwise use calculated defaults
    const actualBasicPay = employee.basicPay;
    const actualHRA = employee.hra;
    const actualOthers = employee.others;
    const actualIncentive = employee.incentive;
    const actualPF = employee.pf;
    const actualESI = employee.esi;
    const actualTDS = employee.tds;
    const actualStaffAdvance = employee.staffAdvance;

    // Calculate default salary based on role/designation (only if actual data not available)
    let defaultBasicPay = 30000; // Default basic pay
    let defaultHRA = 12000; // 40% of basic
    let defaultOthers = 3000; // Other allowances
    let defaultIncentive = 2000; // Performance incentive

    // Adjust salary based on designation
    if (employee.designation.toLowerCase().includes('intern')) {
      defaultBasicPay = 15000;
      defaultHRA = 6000;
      defaultOthers = 1500;
      defaultIncentive = 1000;
    } else if (employee.designation.toLowerCase().includes('senior') || 
               employee.designation.toLowerCase().includes('lead')) {
      defaultBasicPay = 50000;
      defaultHRA = 20000;
      defaultOthers = 5000;
      defaultIncentive = 5000;
    } else if (employee.designation.toLowerCase().includes('manager')) {
      defaultBasicPay = 80000;
      defaultHRA = 32000;
      defaultOthers = 8000;
      defaultIncentive = 8000;
    }

    // Use actual values or defaults (properly handle 0 values)
    const finalBasicPay = actualBasicPay !== null && actualBasicPay !== undefined ? actualBasicPay : defaultBasicPay;
    const finalHRA = actualHRA !== null && actualHRA !== undefined ? actualHRA : defaultHRA;
    const finalOthers = actualOthers !== null && actualOthers !== undefined ? actualOthers : defaultOthers;
    const finalIncentive = actualIncentive !== null && actualIncentive !== undefined ? actualIncentive : defaultIncentive;

    // Calculate standard deductions if not provided (properly handle 0 values)
    const totalEarnings = finalBasicPay + finalHRA + finalOthers + finalIncentive;
    const defaultPF = Math.round(finalBasicPay * 0.12); // 12% of basic
    const defaultESI = totalEarnings <= 21000 ? Math.round(totalEarnings * 0.0075) : 0; // 0.75% if eligible
    const defaultTDS = totalEarnings > 40000 ? Math.round(totalEarnings * 0.05) : 0; // 5% if applicable

    const defaultWorkedDays = 22; // Standard working days in a month
    const defaultLOPDays = 0;

    return {
      month: currentMonth,
      year: currentYear,
      employeeName: employee.employeeName,
      workLocation: employee.workLocation,
      employeeId: employee._id,
      wwtId: employee.wwtId || employee._id, // Use wwtId if available, fallback to _id
      designation: employee.designation,
      department: employee.department,
      bankAccount: employee.bankAccount,
      joiningDate: this.formatDate(employee.joinDate),
      uan: employee.uanNumber || 'N/A',
      esiNumber: employee.esiNumber || 'N/A',
      pan: employee.panNumber,
      paymentMode: 'Bank Transfer',
      workedDays: defaultWorkedDays,
      lopDays: defaultLOPDays,
      basicPay: finalBasicPay,
      hra: finalHRA,
      others: finalOthers,
      incentive: finalIncentive,
      pf: actualPF !== null && actualPF !== undefined ? actualPF : defaultPF,
      esi: actualESI !== null && actualESI !== undefined ? actualESI : defaultESI,
      tds: actualTDS !== null && actualTDS !== undefined ? actualTDS : defaultTDS,
      staffAdvance: actualStaffAdvance !== null && actualStaffAdvance !== undefined ? actualStaffAdvance : 0,
      additionalFiled: employee.additionalFiled || 'N/A'
    };
  }

  // Method to calculate totals
  calculateTotals(payslipData: Partial<PayslipData>): { totalEarnings: number, totalDeductions: number, netPay: number } {
    const basicPay = payslipData.basicPay || 0;
    const hra = payslipData.hra || 0;
    const others = payslipData.others || 0;
    const incentive = payslipData.incentive || 0;
    
    const pf = payslipData.pf || 0;
    const esi = payslipData.esi || 0;
    const tds = payslipData.tds || 0;
    const staffAdvance = payslipData.staffAdvance || 0;

    const totalEarnings = basicPay + hra + others + incentive;
    const totalDeductions = pf + esi + tds + staffAdvance;
    const netPay = totalEarnings - totalDeductions;

    return { totalEarnings, totalDeductions, netPay };
  }

  // Method to convert number to words (Indian numbering system)
  convertToWords(amount: number): string {
    if (amount === 0) return 'Zero only';

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function convertHundreds(num: number): string {
      let result = '';
      
      if (num >= 100) {
        result += ones[Math.floor(num / 100)] + ' Hundred ';
        num %= 100;
      }
      
      if (num >= 20) {
        result += tens[Math.floor(num / 10)] + ' ';
        num %= 10;
      } else if (num >= 10) {
        result += teens[num - 10] + ' ';
        return result;
      }
      
      if (num > 0) {
        result += ones[num] + ' ';
      }
      
      return result;
    }

    // Convert using Indian numbering system
    let result = '';
    
    // Crores
    if (amount >= 10000000) {
      result += convertHundreds(Math.floor(amount / 10000000)) + 'Crore ';
      amount %= 10000000;
    }
    
    // Lakhs
    if (amount >= 100000) {
      result += convertHundreds(Math.floor(amount / 100000)) + 'Lakh ';
      amount %= 100000;
    }
    
    // Thousands
    if (amount >= 1000) {
      result += convertHundreds(Math.floor(amount / 1000)) + 'Thousand ';
      amount %= 1000;
    }
    
    // Hundreds
    if (amount > 0) {
      result += convertHundreds(amount);
    }

    return result.trim() + ' only';
  }

  // Helper method to format date
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  }

  // Method to get default payslip data
  getDefaultPayslipData(): PayslipData {
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
    const currentYear = currentDate.getFullYear().toString();

    return {
      month: currentMonth,
      year: currentYear,
      employeeName: 'N/A',
      workLocation: 'N/A',
      employeeId: 'N/A',
      wwtId: 'N/A', // New field
      lopDays: 0,
      designation: 'N/A',
      workedDays: 0,
      department: 'N/A',
      bankAccount: 'N/A',
      joiningDate: 'N/A',
      uan: 'N/A',
      esiNumber: 'N/A',
      pan: 'N/A',
      basicPay: 0,
      hra: 0,
      others: 0,
      incentive: 0,
      pf: 0,
      esi: 0,
      tds: 0,
      staffAdvance: 0,
      totalEarnings: 0,
      totalDeductions: 0,
      netPay: 0,
      amountWords: 'Zero only',
      paymentMode: 'Bank Transfer',
      additionalFiled: 'N/A'
    };
  }
}
