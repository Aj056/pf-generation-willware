import { Injectable, computed, signal } from '@angular/core';

export interface Employee {
  readonly _id: string;
  readonly employeeName: string;
  readonly employeeEmail: string;
  readonly workLocation: string;
  readonly department: string;
  readonly role: 'admin' | 'employee';
  readonly designation: string;
  readonly joinDate: string;
  readonly bankAccount: string;
  readonly uanNumber: string;
  readonly esiNumber: string;
  readonly panNumber: string;
  readonly resourceType: string;
  readonly username: string;
  readonly password: string;
  readonly address: string;
  readonly phone: string;
  readonly status: boolean;
  readonly __v: number;
}

export interface SearchFilters {
  query: string;
  department: string;
  status: 'all' | 'active' | 'inactive';
  sortBy: 'name' | 'email' | 'department' | 'joinDate';
  sortOrder: 'asc' | 'desc';
}

@Injectable({ providedIn: 'root' })
export class EmployeeFilterService {
  private readonly _searchQuery = signal('');
  private readonly _departmentFilter = signal('');
  private readonly _statusFilter = signal<'all' | 'active' | 'inactive'>('all');
  private readonly _sortBy = signal<'name' | 'email' | 'department' | 'joinDate'>('name');
  private readonly _sortOrder = signal<'asc' | 'desc'>('asc');

  // Public readonly signals
  readonly searchQuery = this._searchQuery.asReadonly();
  readonly departmentFilter = this._departmentFilter.asReadonly();
  readonly statusFilter = this._statusFilter.asReadonly();
  readonly sortBy = this._sortBy.asReadonly();
  readonly sortOrder = this._sortOrder.asReadonly();

  // Current filters as computed signal
  readonly currentFilters = computed<SearchFilters>(() => ({
    query: this._searchQuery(),
    department: this._departmentFilter(),
    status: this._statusFilter(),
    sortBy: this._sortBy(),
    sortOrder: this._sortOrder()
  }));

  /**
   * Filter and sort employees based on current filters
   */
  filterEmployees(employees: Employee[]): Employee[] {
    if (!employees || employees.length === 0) {
      return [];
    }

    let filtered = [...employees];

    // Text search
    const query = this._searchQuery().toLowerCase().trim();
    if (query) {
      filtered = filtered.filter(employee =>
        (employee.employeeName?.toLowerCase().includes(query) || false) ||
        (employee.employeeEmail?.toLowerCase().includes(query) || false) ||
        (employee.department?.toLowerCase().includes(query) || false) ||
        (employee.designation?.toLowerCase().includes(query) || false) ||
        (employee.workLocation?.toLowerCase().includes(query) || false)
      );
    }

    // Department filter
    const department = this._departmentFilter();
    if (department) {
      filtered = filtered.filter(employee => 
        employee.department?.toLowerCase() === department.toLowerCase()
      );
    }

    // Status filter
    const status = this._statusFilter();
    if (status !== 'all') {
      const isActive = status === 'active';
      filtered = filtered.filter(employee => employee.status === isActive);
    }

    // Sort
    const sortBy = this._sortBy();
    const sortOrder = this._sortOrder();
    
    filtered.sort((a, b) => {
      let aValue: string;
      let bValue: string;

      switch (sortBy) {
        case 'name':
          aValue = a.employeeName || '';
          bValue = b.employeeName || '';
          break;
        case 'email':
          aValue = a.employeeEmail || '';
          bValue = b.employeeEmail || '';
          break;
        case 'department':
          aValue = a.department || '';
          bValue = b.department || '';
          break;
        case 'joinDate':
          aValue = a.joinDate || '';
          bValue = b.joinDate || '';
          break;
        default:
          aValue = a.employeeName || '';
          bValue = b.employeeName || '';
      }

      const comparison = aValue.localeCompare(bValue);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }

  /**
   * Get unique departments from employees
   */
  getUniqueDepartments(employees: Employee[]): string[] {
    if (!employees || employees.length === 0) {
      return [];
    }
    
    const departments = employees
      .map(emp => emp.department)
      .filter(dept => dept && dept.trim() !== ''); // Filter out null, undefined, and empty strings
    
    return [...new Set(departments)].sort();
  }

  /**
   * Update search query
   */
  setSearchQuery(query: string): void {
    this._searchQuery.set(query);
  }

  /**
   * Update department filter
   */
  setDepartmentFilter(department: string): void {
    this._departmentFilter.set(department);
  }

  /**
   * Update status filter
   */
  setStatusFilter(status: 'all' | 'active' | 'inactive'): void {
    this._statusFilter.set(status);
  }

  /**
   * Update sort configuration
   */
  setSorting(sortBy: 'name' | 'email' | 'department' | 'joinDate', sortOrder: 'asc' | 'desc'): void {
    this._sortBy.set(sortBy);
    this._sortOrder.set(sortOrder);
  }

  /**
   * Toggle sort order for current sort field
   */
  toggleSortOrder(): void {
    this._sortOrder.update(order => order === 'asc' ? 'desc' : 'asc');
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this._searchQuery.set('');
    this._departmentFilter.set('');
    this._statusFilter.set('all');
    this._sortBy.set('name');
    this._sortOrder.set('asc');
  }

  /**
   * Check if any filters are active
   */
  hasActiveFilters(): boolean {
    return this._searchQuery() !== '' || 
           this._departmentFilter() !== '' || 
           this._statusFilter() !== 'all';
  }
}
