import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeFilterService } from './employeeFilterservice';
import { EmployeeService } from './employeeService';

@Component({
  selector: 'app-employee-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white dark:bg-gray-800 p-4  shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
      <!-- Search Input -->
      <div class="flex flex-col lg:flex-row gap-4">
        <!-- Main Search -->
        <div class="flex-1">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              [ngModel]="filterService.searchQuery()"
              (ngModelChange)="filterService.setSearchQuery($event)"
              placeholder="Search employees by name, email, department..."
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            @if (filterService.searchQuery()) {
              <button
                (click)="filterService.setSearchQuery('')"
                class="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 dark:hover:text-gray-300">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            }
          </div>
        </div>

        <!-- Filters -->
        <div class="flex flex-col sm:flex-row gap-3">
          <!-- Department Filter -->
          <select
            [ngModel]="filterService.departmentFilter()"
            (ngModelChange)="filterService.setDepartmentFilter($event)"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
            <option value="">All Departments</option>
            @for (dept of uniqueDepartments(); track dept) {
              <option [value]="dept">{{ dept }}</option>
            }
          </select>

          <!-- Status Filter -->
          <select
            [ngModel]="filterService.statusFilter()"
            (ngModelChange)="filterService.setStatusFilter($event)"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <!-- Sort Options -->
          <select
            [ngModel]="filterService.sortBy()"
            (ngModelChange)="setSortBy($event)"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
            <option value="name">Sort by Name</option>
            <option value="email">Sort by Email</option>
            <option value="department">Sort by Department</option>
            <option value="joinDate">Sort by Join Date</option>
          </select>

          <!-- Sort Order Toggle -->
          <button
            (click)="filterService.toggleSortOrder()"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            [title]="filterService.sortOrder() === 'asc' ? 'Ascending' : 'Descending'">
            @if (filterService.sortOrder() === 'asc') {
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
            } @else {
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
              </svg>
            }
          </button>

          <!-- Clear Filters -->
          @if (filterService.hasActiveFilters()) {
            <button
              (click)="filterService.clearFilters()"
              class="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
              Clear
            </button>
          }
        </div>
      </div>

      <!-- Results Summary -->
      <div class="mt-3 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
        <span>{{ filteredCount() }} of {{ totalCount() }} employees</span>
        @if (filterService.hasActiveFilters()) {
          <span class="text-blue-600 dark:text-blue-400">Filtered results</span>
        }
      </div>
    </div>
  `
})
export class EmployeeSearchComponent {
  readonly filterService = inject(EmployeeFilterService);
  readonly employeeService = inject(EmployeeService);
  loademployees = signal({});
  // Computed properties
  readonly uniqueDepartments = () => this.filterService.getUniqueDepartments(this.employeeService.employees());
  readonly totalCount = () => this.employeeService.employees().length;
  readonly filteredCount = () => this.filterService.filterEmployees(this.employeeService.employees()).length;

  setSortBy(sortBy: string): void {
    this.filterService.setSorting(
      sortBy as 'name' | 'email' | 'department' | 'joinDate',
      this.filterService.sortOrder()
    );
  }
    ngOnInit(): void {
        this.loademployees.set(this.employeeService.loadEmployees());
        console.log('EmployeeService initialized and employees loaded', this.loademployees());
    }

}
