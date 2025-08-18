import { Component } from '@angular/core';
import { PayslipForm } from './features/payslip/payslip-form/payslip-form';
import { EmployeeSearchComponent } from './features/payslip/employeelist';
import { EmployeeListComponent } from './features/payslip/listview';

@Component({
  selector: 'app-root',
  imports: [ PayslipForm, EmployeeSearchComponent,EmployeeListComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'payslip-app';
}
