import { Component, inject, effect, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PayslipService } from '../payslip.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-payslip-form',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './payslip-form.html',
  styleUrl: './payslip-form.scss'
})
export class PayslipForm implements OnDestroy {
  private readonly payslipService = inject(PayslipService);
  private readonly fb = inject(FormBuilder);
  
  payslipForm: FormGroup;
  isDownloading = false;
  private isUpdatingFromService = false;

  constructor() {
    this.payslipForm = this.createForm();
    this.setupFormValueChanges();
    this.setupEmployeeSelectionEffect();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  private createForm(): FormGroup {
    const defaultData = this.payslipService.getDefaultPayslipData();
    return this.fb.group({
      month: [defaultData.month],
      year: [defaultData.year],
      employeeName: [defaultData.employeeName],
      workLocation: [defaultData.workLocation],
      employeeId: [defaultData.employeeId],
      lopDays: [defaultData.lopDays],
      designation: [defaultData.designation],
      workedDays: [defaultData.workedDays],
      department: [defaultData.department],
      bankAccount: [defaultData.bankAccount],
      joiningDate: [defaultData.joiningDate],
      uan: [defaultData.uan],
      esiNumber: [defaultData.esiNumber],
      pan: [defaultData.pan],
      basicPay: [defaultData.basicPay],
      hra: [defaultData.hra],
      others: [defaultData.others],
      incentive: [defaultData.incentive],
      pf: [defaultData.pf],
      esi: [defaultData.esi],
      tds: [defaultData.tds],
      staffAdvance: [defaultData.staffAdvance],
      totalEarnings: [defaultData.totalEarnings],
      totalDeductions: [defaultData.totalDeductions],
      netPay: [defaultData.netPay],
      amountWords: [defaultData.amountWords],
      paymentMode: [defaultData.paymentMode],
    });
  }

  private setupFormValueChanges(): void {
    // Watch for changes in salary fields to auto-calculate totals
    this.payslipForm.valueChanges.subscribe(() => {
      if (!this.isUpdatingFromService) {
        this.calculateTotals();
      }
    });
  }

  private setupEmployeeSelectionEffect(): void {
    // Effect to watch for employee selection changes
    effect(() => {
      const selectedEmployee = this.payslipService.selectedEmployee();
      if (selectedEmployee) {
        this.populateFormFromEmployee();
      }
    });
  }

  private populateFormFromEmployee(): void {
    const selectedEmployee = this.payslipService.selectedEmployee();
    if (!selectedEmployee) return;

    this.isUpdatingFromService = true;
    
    const payslipData = this.payslipService.getPayslipDataFromEmployee(selectedEmployee);
    
    // Update form with employee data and calculated salary components
    this.payslipForm.patchValue(payslipData);

    // Calculate totals and amount in words
    setTimeout(() => {
      this.calculateTotals();
      this.isUpdatingFromService = false;
    }, 0);
  }

  private calculateTotals(): void {
    const formValue = this.payslipForm.value;
    const totals = this.payslipService.calculateTotals(formValue);
    const amountWords = this.payslipService.convertToWords(totals.netPay);

    this.isUpdatingFromService = true;
    
    this.payslipForm.patchValue({
      totalEarnings: totals.totalEarnings,
      totalDeductions: totals.totalDeductions,
      netPay: totals.netPay,
      amountWords: amountWords
    });

    setTimeout(() => {
      this.isUpdatingFromService = false;
    }, 0);
  }

  onReset(): void {
    this.payslipService.clearSelectedEmployee();
    const defaultData = this.payslipService.getDefaultPayslipData();
    
    this.isUpdatingFromService = true;
    this.payslipForm.reset(defaultData);
    
    setTimeout(() => {
      this.isUpdatingFromService = false;
    }, 0);
  }

  async onDownload(): Promise<void> {
    if (this.isDownloading) return;
    
    this.isDownloading = true;
    
    try {
      // Use html2canvas to preserve exact browser layout
      await this.generateLayoutPreservedPDF();
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert('Error generating PDF: ' + errorMessage + '. Please try again.');
    } finally {
      this.isDownloading = false;
    }
  }

  private async generateLayoutPreservedPDF(): Promise<void> {
    // Get the payslip section only (not the whole form)
    const payslipElement = document.querySelector('.payslip') as HTMLElement;
    if (!payslipElement) {
      throw new Error('Payslip element not found');
    }

    // Create a clone to modify for PDF
    const clonedElement = payslipElement.cloneNode(true) as HTMLElement;
    
    // Replace all inputs with spans but keep the exact styling
    this.prepareElementForPDFPreserveLayout(clonedElement);
    
    // Create a container for PDF generation
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '800px';
    container.style.background = 'white';
    container.style.padding = '20px';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.zIndex = '10000';
    container.style.transform = 'scale(1)';
    container.appendChild(clonedElement);
    
    // Add to document
    document.body.appendChild(container);
    
    // Wait for rendering
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Generate canvas with high quality settings
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: 800,
        height: container.scrollHeight,
        windowWidth: 800,
        windowHeight: container.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        foreignObjectRendering: false,
        imageTimeout: 0,
        removeContainer: false
      });

      // Remove container and cleanup
      document.body.removeChild(container);
      
      // Remove the added style
      const addedStyles = document.querySelectorAll('style');
      addedStyles.forEach(style => {
        if (style.textContent?.includes('payslip-pdf')) {
          style.remove();
        }
      });

      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Failed to capture content');
      }

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // Calculate dimensions to fit A4
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = 297; // A4 height in mm
      const margin = 10;
      const availableWidth = pdfWidth - (2 * margin);
      const availableHeight = pdfHeight - (2 * margin);
      
      const imgAspectRatio = canvas.height / canvas.width;
      let imgWidth = availableWidth;
      let imgHeight = imgWidth * imgAspectRatio;
      
      // If height exceeds page, scale down
      if (imgHeight > availableHeight) {
        imgHeight = availableHeight;
        imgWidth = imgHeight / imgAspectRatio;
      }
      
      // Center the image
      const xOffset = (pdfWidth - imgWidth) / 2;
      const yOffset = margin;
      
      pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
      
      // Download
      const formData = this.payslipForm.value;
      const employeeName = formData.employeeName || 'Employee';
      const month = formData.month || 'Month';
      const year = formData.year || 'Year';
      
      pdf.save(`${employeeName}_Payslip_${month}_${year}.pdf`);
      alert('Payslip PDF downloaded successfully!');
      
    } catch (canvasError) {
      document.body.removeChild(container);
      
      // Remove the added style
      const addedStyles = document.querySelectorAll('style');
      addedStyles.forEach(style => {
        if (style.textContent?.includes('payslip-pdf')) {
          style.remove();
        }
      });
      
      throw canvasError;
    }
  }

  private prepareElementForPDFPreserveLayout(element: HTMLElement): void {
    // Replace inputs with spans but preserve exact styling
    const inputs = element.querySelectorAll('input');
    inputs.forEach(input => {
      const span = document.createElement('span');
      span.textContent = input.value || 'N/A';
      
      // Copy all computed styles from input to span
      const computedStyle = window.getComputedStyle(input);
      span.style.cssText = computedStyle.cssText;
      
      // Ensure text visibility
      span.style.color = '#000';
      span.style.backgroundColor = 'transparent';
      span.style.border = 'none';
      span.style.outline = 'none';
      span.style.boxShadow = 'none';
      span.style.display = 'inline-block';
      span.style.verticalAlign = 'baseline';
      span.style.lineHeight = computedStyle.lineHeight;
      span.style.fontSize = computedStyle.fontSize;
      span.style.fontFamily = computedStyle.fontFamily;
      span.style.padding = computedStyle.padding;
      span.style.margin = computedStyle.margin;
      span.style.width = computedStyle.width;
      span.style.height = computedStyle.height;
      span.style.minWidth = computedStyle.minWidth;
      span.style.minHeight = computedStyle.minHeight;
      
      if (input.parentNode) {
        input.parentNode.replaceChild(span, input);
      }
    });

    // Remove any buttons
    const buttons = element.querySelectorAll('button');
    buttons.forEach(button => button.remove());

    // Ensure the CSS watermark is visible by adding inline styles
    element.style.position = 'relative';
    element.style.overflow = 'visible';
    
    // Force CSS pseudo-elements to be visible in html2canvas
    const style = document.createElement('style');
    style.textContent = `
      .payslip-pdf::before {
        content: "WILLWARE TECHNOLOGIES" !important;
        position: absolute !important;
        top: 50% !important;
        left: 50% !important;
        font-size: 60px !important;
        font-weight: bold !important;
        color: #87CEEB !important;
        opacity: 0.3 !important;
        transform: translate(-50%, -50%) rotate(-30deg) !important;
        pointer-events: none !important;
        z-index: 0 !important;
        white-space: nowrap !important;
        font-family: Arial, sans-serif !important;
        letter-spacing: 3px !important;
        user-select: none !important;
      }
      .payslip-pdf::after {
        content: "WILLWARE TECHNOLOGIES" !important;
        position: absolute !important;
        top: 30% !important;
        left: 50% !important;
        font-size: 45px !important;
        font-weight: bold !important;
        color: #ADD8E6 !important;
        opacity: 0.2 !important;
        transform: translate(-50%, -50%) rotate(-30deg) !important;
        pointer-events: none !important;
        z-index: 0 !important;
        white-space: nowrap !important;
        font-family: Arial, sans-serif !important;
        user-select: none !important;
      }
      .payslip-pdf > * {
        position: relative !important;
        z-index: 5 !important;
      }
    `;
    document.head.appendChild(style);
    
    // Add the PDF class to trigger the watermark
    element.classList.add('payslip-pdf');
    
    // Ensure all text content is visible and has proper z-index
    const allTextElements = element.querySelectorAll('*');
    allTextElements.forEach(el => {
      const textEl = el as HTMLElement;
      if (textEl.style) {
        textEl.style.visibility = 'visible';
        textEl.style.opacity = textEl.style.opacity || '1';
        textEl.style.zIndex = '5';
        textEl.style.position = 'relative';
        if (!textEl.style.color || textEl.style.color === 'transparent') {
          textEl.style.color = '#000';
        }
      }
    });
  }

  onSubmit(): void {
    const formData = this.payslipForm.value;
    console.log('Payslip data:', formData);
    // Here you can implement save functionality to your backend
    alert('Payslip data saved successfully!');
  }
}
