import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { authGuard, roleGuard } from './auth.guard';

const ROUTE = {} as ActivatedRouteSnapshot;
const STATE = {} as RouterStateSnapshot;

describe('auth guards', () => {
  let router: { navigate: jest.Mock };

  function configure(auth: Partial<AuthService>) {
    router = { navigate: jest.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });
  }

  describe('authGuard', () => {
    it('allows access when logged in', () => {
      configure({ isLoggedIn: () => true } as Partial<AuthService>);
      const result = TestBed.runInInjectionContext(() => authGuard(ROUTE, STATE));
      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('blocks and redirects to /login when logged out', () => {
      configure({ isLoggedIn: () => false } as Partial<AuthService>);
      const result = TestBed.runInInjectionContext(() => authGuard(ROUTE, STATE));
      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('roleGuard', () => {
    it('allows when the user role matches', () => {
      configure({ user: () => ({ role: 'ADMIN' }) } as unknown as Partial<AuthService>);
      const guard = roleGuard(['ADMIN']);
      expect(TestBed.runInInjectionContext(() => guard(ROUTE, STATE))).toBe(true);
    });

    it('blocks and redirects to /browse for the wrong role', () => {
      configure({ user: () => ({ role: 'BUYER' }) } as unknown as Partial<AuthService>);
      const guard = roleGuard(['ADMIN']);
      const result = TestBed.runInInjectionContext(() => guard(ROUTE, STATE));
      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/browse']);
    });
  });
});
