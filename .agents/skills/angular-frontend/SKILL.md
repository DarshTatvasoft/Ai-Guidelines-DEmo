---
name: angular-frontend
description: >-
  Skill for building Angular 22 frontend with industrial-standard architecture.
  Use this skill when creating components, services, routing, state management,
  or any frontend code following the project's standards.
---

# Angular 22 Frontend Development Skill

## Architecture Overview

```
src/app/
├── core/           # Singleton services, guards, interceptors (provided in root)
├── shared/         # Reusable components, directives, pipes
├── features/       # Feature-based modules (lazy-loaded routes)
├── layouts/        # Layout components (main layout, auth layout)
├── app.component.ts
├── app.config.ts
└── app.routes.ts
```

## Step-by-Step: Adding a New Feature

### 1. Create Feature Structure

```
features/customers/
├── components/
│   ├── customer-list/
│   │   ├── customer-list.component.ts
│   │   ├── customer-list.component.html
│   │   ├── customer-list.component.scss
│   │   └── customer-list.component.spec.ts
│   ├── customer-form/
│   └── customer-detail/
├── services/
│   └── customer.service.ts
├── models/
│   └── customer.model.ts
├── pages/
│   └── customer-page/
└── customers.routes.ts
```

### 2. Define Models (features/customers/models/)

```typescript
export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
}

export interface CreateCustomerRequest {
  firstName: string;
  lastName: string;
  email: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}
```

### 3. Create Service (features/customers/services/)

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, Customer, CreateCustomerRequest } from '../models/customer.model';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/customers`;

  getAll(): Observable<ApiResponse<Customer[]>> {
    return this.http.get<ApiResponse<Customer[]>>(this.baseUrl);
  }

  getById(id: number): Observable<ApiResponse<Customer>> {
    return this.http.get<ApiResponse<Customer>>(`${this.baseUrl}/${id}`);
  }

  create(customer: CreateCustomerRequest): Observable<ApiResponse<Customer>> {
    return this.http.post<ApiResponse<Customer>>(this.baseUrl, customer);
  }

  update(id: number, customer: CreateCustomerRequest): Observable<ApiResponse<Customer>> {
    return this.http.put<ApiResponse<Customer>>(`${this.baseUrl}/${id}`, customer);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}
```

### 4. Create Component with Signals

```typescript
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CustomerService } from '../../services/customer.service';
import { Customer } from '../../models/customer.model';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerListComponent implements OnInit {
  private readonly customerService = inject(CustomerService);

  readonly customers = signal<Customer[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchTerm = signal('');

  readonly filteredCustomers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.customers().filter(c =>
      c.firstName.toLowerCase().includes(term) ||
      c.lastName.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.customerService.getAll().subscribe({
      next: (response) => {
        this.customers.set(response.data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load customers');
        this.isLoading.set(false);
      },
    });
  }
}
```

### 5. Create Typed Reactive Form

```typescript
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './customer-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly customerService = inject(CustomerService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
  });

  onSubmit(): void {
    if (this.form.invalid) return;

    this.customerService.create(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/customers']),
      error: (err) => console.error('Failed to create customer', err),
    });
  }
}
```

### 6. Configure Routes (features/customers/customers.routes.ts)

```typescript
import { Routes } from '@angular/router';

export const CUSTOMER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/customer-page/customer-page.component')
        .then(m => m.CustomerPageComponent),
    children: [
      { path: '', loadComponent: () => import('./components/customer-list/customer-list.component').then(m => m.CustomerListComponent) },
      { path: 'new', loadComponent: () => import('./components/customer-form/customer-form.component').then(m => m.CustomerFormComponent) },
      { path: ':id', loadComponent: () => import('./components/customer-detail/customer-detail.component').then(m => m.CustomerDetailComponent) },
      { path: ':id/edit', loadComponent: () => import('./components/customer-form/customer-form.component').then(m => m.CustomerFormComponent) },
    ],
  },
];
```

### 7. Register in App Routes

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'customers', loadChildren: () => import('./features/customers/customers.routes').then(m => m.CUSTOMER_ROUTES) },
  // ... other feature routes
];
```

## Core Services (src/app/core/)

### HTTP Error Interceptor

```typescript
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle different HTTP error codes
      // Show toast notifications
      return throwError(() => error);
    })
  );
};
```

### Auth Interceptor

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req);
};
```

## Coding Conventions

- **Standalone components** — No NgModules
- **Signals first** — Use `signal()`, `computed()`, `effect()` for state
- **OnPush** — All components use `ChangeDetectionStrategy.OnPush`
- **inject() function** — Prefer over constructor injection
- **Typed forms** — Always use `fb.nonNullable.group()`
- **Lazy loading** — All feature routes are lazy-loaded
- **File naming** — kebab-case: `customer-list.component.ts`
- **Environment config** — Never hardcode API URLs
- **SCSS** — Component-scoped styles; shared styles in `styles/`
- **Accessibility** — Use semantic HTML, ARIA labels, keyboard navigation

## ⚠️ Before You Code

1. Check if a similar component/service already exists in `shared/` or `core/`
2. New features go in `features/` with their own folder structure
3. Reusable components go in `shared/components/`
4. All components must have corresponding `.spec.ts` test files

