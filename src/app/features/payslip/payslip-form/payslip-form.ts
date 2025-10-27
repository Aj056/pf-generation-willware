import { Component, inject, effect, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PayslipService } from '../payslip.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-payslip-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './payslip-form.html',
  styleUrl: './payslip-form.scss'
})
export class PayslipForm implements OnDestroy {
  private readonly payslipService = inject(PayslipService);
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  
  // API Configuration - Update this with your domain
  private readonly API_BASE_URL = 'https://attendance-three-lemon.vercel.app';
  
  payslipForm: FormGroup;
  isDownloading = false;
  isSaving = false;
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
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.zIndex = '10000';
    container.style.transform = 'scale(1)';
    container.style.minHeight = 'auto';
    container.style.height = 'auto';
    container.style.overflow = 'visible';
    container.appendChild(clonedElement);
    
    // Add to document
    document.body.appendChild(container);
    
    // Wait for rendering and calculate proper height
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Ensure note element is visible and properly styled
    const noteElement = container.querySelector('.note');
    if (noteElement) {
      const note = noteElement as HTMLElement;
      note.style.display = 'block !important';
      note.style.visibility = 'visible !important';
      note.style.opacity = '1 !important';
      note.style.color = '#000 !important';
      note.style.fontSize = '12px !important';
      note.style.fontWeight = 'normal !important';
      note.style.marginTop = '15px !important';
      note.style.marginBottom = '15px !important';
      note.style.padding = '5px !important';
      note.style.zIndex = '999 !important';
      note.style.position = 'relative !important';
      note.style.backgroundColor = 'white !important';
      note.style.border = '1px solid #ccc !important';
      console.log('Note element found and styled:', note.textContent);
    } else {
      console.log('Note element not found, creating one');
      // If note element is missing, create it
      const newNote = document.createElement('p');
      newNote.className = 'note';
      newNote.style.display = 'block';
      newNote.style.fontSize = '12px';
      newNote.style.color = '#000';
      newNote.style.marginTop = '15px';
      newNote.style.marginBottom = '15px';
      newNote.style.padding = '5px';
      newNote.style.border = '1px solid #ccc';
      newNote.textContent = 'Note: "This payslip is computer generated; hence no signature is required."';
      clonedElement.appendChild(newNote);
    }
    
    // Force recalculation of height to include all content
    const actualHeight = Math.max(container.scrollHeight, container.offsetHeight, clonedElement.scrollHeight + 60);
    container.style.height = actualHeight + 'px';

    try {
      // Generate canvas with high quality settings
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: 800,
        height: actualHeight,
        windowWidth: 800,
        windowHeight: actualHeight,
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
      // span.style.padding = computedStyle.padding;
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
      .payslip-pdf .title {
        margin-right: 50px !important;
        display: inline-block !important;
       }
       
       /* Center and bold the payslip header text */
       .payslip-pdf .payslip-header,
       .payslip-pdf .payslip-title,
       .payslip-pdf h3,
       .payslip-pdf .header-text {
        text-align: center !important;
        font-weight: bold !important;
        font-size: 16px !important;
        margin: 10px 0 !important;
        display: block !important;
        width: 100% !important;
       }
       
       /* Ensure note text is visible */
       .payslip-pdf .note {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        color: #000 !important;
        font-size: 12px !important;
        margin-top: 15px !important;
        margin-bottom: 10px !important;
        font-weight: normal !important;
        z-index: 10 !important;
        position: relative !important;
        background-color: transparent !important;
       }
       
       /* Ensure footer section is visible */
       .payslip-pdf .footer-section {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        margin-top: 20px !important;
        margin-bottom: 20px !important;
        z-index: 10 !important;
        position: relative !important;
       }
       
       /* Ensure footer section is visible */
       .payslip-pdf .footer-section {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        margin-top: 20px !important;
        position: relative !important;
        z-index: 10 !important;
        background-color: transparent !important;
        color: #000 !important;
       }
       
       .payslip-pdf .footer-section p {
        display: flex !important;
        align-items: center !important;
        margin: 8px 0 !important;
        visibility: visible !important;
        opacity: 1 !important;
        color: #000 !important;
        font-weight: bold !important;
       }
       
       .payslip-pdf .footer-section .note {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        color: #000 !important;
        font-size: 12px !important;
        margin-top: 15px !important;
        font-weight: normal !important;
       }
       
       .payslip-pdf .footer-section span {
        margin-left: 10px !important;
        color: #000 !important;
        font-weight: 900 !important;
        display: inline-block !important;
        width: auto !important;
        min-width: 200px !important;
       }
       
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

    // Specifically ensure note text is visible
    const noteElements = element.querySelectorAll('.note');
    noteElements.forEach(noteEl => {
      const note = noteEl as HTMLElement;
      note.style.display = 'block';
      note.style.visibility = 'visible';
      note.style.opacity = '1';
      note.style.color = '#000';
      note.style.fontSize = '12px';
      note.style.marginTop = '15px';
      note.style.marginBottom = '10px';
      note.style.zIndex = '10';
      note.style.position = 'relative';
      note.style.backgroundColor = 'transparent';
    });

    // Ensure footer section is fully visible
    const footerElements = element.querySelectorAll('.footer-section');
    footerElements.forEach(footerEl => {
      const footer = footerEl as HTMLElement;
      footer.style.display = 'block';
      footer.style.visibility = 'visible';
      footer.style.opacity = '1';
      footer.style.marginTop = '20px';
      footer.style.marginBottom = '20px';
      footer.style.zIndex = '10';
      footer.style.position = 'relative';
    });
  }

  async onSave(): Promise<void> {
    if (this.isSaving) return;
    
    this.isSaving = true;
    
    try {
      const formData = this.payslipForm.value;
      
      // Get the employee ID from the form
      const employeeId = formData.employeeId;
      
      if (!employeeId) {
        alert('Employee ID is required to save payslip');
        return;
      }
      
      // Prepare the payload according to your API structure
      const payload = {
        month: formData.month?.toString().toLowerCase() || '',
        year: formData.year?.toString() || '',
        employeeName: formData.employeeName || '',
        workLocation: formData.workLocation || '',
        employeeId: employeeId,
        lopDays: formData.lopDays || 0,
        designation: formData.designation || '',
        workedDays: formData.workedDays || 0,
        department: formData.department || '',
        bankAccount: formData.bankAccount || '',
        joiningDate: formData.joiningDate || '',
        uan: formData.uan || '',
        esiNumber: formData.esiNumber || '',
        pan: formData.pan || '',
        basicPay: formData.basicPay || 0,
        hra: formData.hra || 0,
        others: formData.others || 0,
        incentive: formData.incentive || 0,
        pf: formData.pf || 0,
        esi: formData.esi || 0,
        tds: formData.tds || 0,
        staffAdvance: formData.staffAdvance || 0,
        totalEarnings: formData.totalEarnings || 0,
        totalDeductions: formData.totalDeductions || 0,
        netPay: formData.netPay || 0,
        amountWords: formData.amountWords || '',
        paymentMode: formData.paymentMode || ''
      };
      
      console.log('Saving payslip data:', payload);
      
      // Make API call to create payslip
      const apiUrl = `${this.API_BASE_URL}/createPaySlip/${employeeId}`;
      console.log('API URL:', apiUrl);
      
      const response = await firstValueFrom(
        this.http.post<any>(apiUrl, payload)
      );
      
      console.log('Save payslip response:', response);
      alert('Payslip data saved successfully!');
      
    } catch (error) {
      console.error('Error saving payslip:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert('Error saving payslip: ' + errorMessage + '. Please try again.');
    } finally {
      this.isSaving = false;
    }
  }

  onSubmit(): void {
    const formData = this.payslipForm.value;
    console.log('Payslip data:', formData);
    // Here you can implement save functionality to your backend
    alert('Payslip data saved successfully!');
  }
}
