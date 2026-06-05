import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (!auth.isLoggedIn()) {
    inject(Router).navigate(['/login']);
    return false;
  }
  return true;
};

export const roleGuard =
  (roles: string[]): CanActivateFn =>
  () => {
    const auth = inject(AuthService);
    const role = auth.user()?.role;
    if (!role || !roles.includes(role)) {
      inject(Router).navigate(['/browse']);
      return false;
    }
    return true;
  };
