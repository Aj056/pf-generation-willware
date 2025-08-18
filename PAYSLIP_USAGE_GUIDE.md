# Payslip Application - Usage Guide

## Overview
This Angular application allows you to generate payslips for employees with the following features:

### Key Features:
1. **Employee Selection & Pre-population**: Select an employee from the list to automatically populate the payslip form
2. **Automatic Calculations**: Total earnings, deductions, and net pay are calculated automatically
3. **PDF Download**: Generate and download professional payslip PDFs
4. **Reset Functionality**: Clear the form and start fresh
5. **Manual Entry**: Fill the form manually or modify auto-populated values

## How to Use

### 1. Selecting an Employee
- Browse the employee list at the top of the page
- Use the search and filter functionality to find specific employees
- Click the "Select" button next to any employee
- The payslip form will automatically populate with:
  - Employee personal details (name, ID, department, etc.)
  - Default salary components based on designation
  - Current month and year
  - Calculated deductions (PF, ESI, TDS)

### 2. Employee Data Mapping
When you select an employee like the sample data provided:
```json
{
    "_id": "68948e386cf4bd04dd1fa185",
    "employeeName": "Abirami P",
    "employeeEmail": "abiramidurairaj19@gmail.com",
    "workLocation": "Vridhachalam",
    "department": "Recruitment Department",
    "designation": "IT Recruitment Intern",
    "joinDate": "2025-08-04",
    "bankAccount": "50100477309657",
    "uanNumber": "NA",
    "esiNumber": "N/A",
    "panNumber": "CKIPK9026Q"
}
```

The form will auto-populate:
- **Employee Name**: Abirami P
- **Work Location**: Vridhachalam
- **Employee ID**: 68948e386cf4bd04dd1fa185
- **Designation**: IT Recruitment Intern
- **Department**: Recruitment Department
- **Bank Account**: 50100477309657
- **Date of Joining**: 04/08/2025
- **UAN Number**: NA
- **ESI Number**: N/A
- **PAN**: CKIPK9026Q

### 3. Salary Calculation Logic
The application automatically calculates salary based on designation:

#### For Interns:
- Basic Pay: ₹15,000
- HRA: ₹6,000 (40% of basic)
- Others: ₹1,500
- Incentive: ₹1,000
- PF: ₹1,800 (12% of basic)
- ESI: ₹177 (0.75% if total ≤ ₹21,000)

#### For Regular Employees:
- Basic Pay: ₹30,000
- HRA: ₹12,000
- Others: ₹3,000
- Incentive: ₹2,000

#### For Senior/Lead positions:
- Basic Pay: ₹50,000+
- Proportional allowances and deductions

### 4. Editing Values
- You can manually edit any field after auto-population
- Salary amounts automatically recalculate totals when changed
- Amount in words updates automatically

### 5. Downloading PDF
1. Click the "Download" button
2. The application generates a professional PDF
3. PDF includes company letterhead and formatting
4. File is automatically named: `EmployeeName_Payslip_Month_Year.pdf`

### 6. Reset Functionality
- Click "Reset" to clear all fields
- Returns form to default N/A values
- Clears any selected employee

## Features in Detail

### Auto-Calculations
- **Total Earnings**: Sum of Basic Pay + HRA + Others + Incentive
- **Total Deductions**: Sum of PF + ESI + TDS + Staff Advance
- **Net Pay**: Total Earnings - Total Deductions
- **Amount in Words**: Converts net pay to Indian currency words format

### PDF Generation
- High-quality PDF output
- Company branding with watermark
- Professional payslip format
- Proper page formatting for printing

### Validation
- Real-time form validation
- Automatic number formatting
- Error handling for PDF generation

## Technical Implementation

### Services Used:
1. **PayslipService**: Manages employee selection and calculations
2. **EmployeeService**: Handles employee data from API
3. **PDF Generation**: Uses jsPDF and html2canvas libraries

### Key Components:
1. **Employee List**: Browse and select employees
2. **Payslip Form**: Main form for payslip data
3. **PDF Generator**: Converts form to downloadable PDF

## Sample Output
When you select "Abirami P" and download the PDF, you'll get a professionally formatted payslip with:
- Company header (WILLWARE TECHNOLOGIES PVT LTD)
- All employee details properly filled
- Calculated salary components
- Net pay in both numbers and words
- Professional formatting suitable for official use

## Troubleshooting
- If PDF download fails, check browser permissions
- Ensure all required fields are filled
- For calculation issues, try refreshing the page
- Contact support if employee data doesn't load properly
