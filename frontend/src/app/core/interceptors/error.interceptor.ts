import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '@core/services/toast.service';
import { AuthService } from '@core/services/auth.service';

/**
 * Global HTTP error handling:
 *  - 401 (expired/invalid token) → toast + logout (skipped for /auth/* so login shows its own inline error)
 *  - 403 → permission toast
 *  - 0   → network toast
 *  - 5xx → generic server toast
 * 4xx validation (400/422) is left to the calling component; the error is always re-thrown.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const auth = inject(AuthService);
  const isAuthCall = req.url.includes('/auth/');

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (!isAuthCall) {
        if (err.status === 401) {
          toast.error('Your session expired — please log in again.');
          auth.logout();
        } else if (err.status === 403) {
          toast.error("You don't have permission to do that.");
        } else if (err.status === 0) {
          toast.error('Network error — check your connection.');
        } else if (err.status >= 500) {
          toast.error('Something went wrong on our end. Please try again.');
        }
      }
      return throwError(() => err);
    }),
  );
};
