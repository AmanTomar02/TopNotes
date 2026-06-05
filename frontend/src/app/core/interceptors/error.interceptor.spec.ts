import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { throwError } from 'rxjs';
import { ToastService } from '@core/services/toast.service';
import { AuthService } from '@core/services/auth.service';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let toast: { error: jest.Mock };
  let auth: { logout: jest.Mock };

  function run(url: string, status: number) {
    toast = { error: jest.fn() };
    auth = { logout: jest.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: ToastService, useValue: toast },
        { provide: AuthService, useValue: auth },
      ],
    });
    const req = new HttpRequest('GET', url);
    const next: HttpHandlerFn = () => throwError(() => new HttpErrorResponse({ status, url }));
    return TestBed.runInInjectionContext(() => errorInterceptor(req, next));
  }

  it('401 → toast + logout', (done) => {
    run('http://x/api/notes', 401).subscribe({
      error: () => {
        expect(toast.error).toHaveBeenCalled();
        expect(auth.logout).toHaveBeenCalled();
        done();
      },
    });
  });

  it('500 → toast, no logout', (done) => {
    run('http://x/api/notes', 500).subscribe({
      error: () => {
        expect(toast.error).toHaveBeenCalled();
        expect(auth.logout).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('does not toast for 4xx validation (422)', (done) => {
    run('http://x/api/notes', 422).subscribe({
      error: () => {
        expect(toast.error).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('skips /auth/ endpoints (login shows its own error)', (done) => {
    run('http://x/api/auth/login', 401).subscribe({
      error: () => {
        expect(toast.error).not.toHaveBeenCalled();
        expect(auth.logout).not.toHaveBeenCalled();
        done();
      },
    });
  });
});
