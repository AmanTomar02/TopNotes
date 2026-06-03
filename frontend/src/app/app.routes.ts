import { Routes } from '@angular/router';
import { authGuard, roleGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/browse', pathMatch: 'full' },

  // ── Auth ────────────────────────────────────────────────────
  { path: 'login',
    loadComponent: () => import('@features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'register',
    loadComponent: () => import('@features/auth/register/register.component').then(m => m.RegisterComponent) },

  // ── Public ──────────────────────────────────────────────────
  { path: 'browse',
    loadComponent: () => import('@features/buyer/browse/browse.component').then(m => m.BrowseComponent) },
  { path: 'notes/:id',
    loadComponent: () => import('@features/buyer/note-detail/note-detail.component').then(m => m.NoteDetailComponent) },

  // ── Buyer ───────────────────────────────────────────────────
  { path: 'notes/:id/view',
    canActivate: [authGuard, roleGuard(['BUYER'])],
    loadComponent: () => import('@features/buyer/note-view/note-view.component').then(m => m.NoteViewComponent) },
  { path: 'my-purchases',
    canActivate: [authGuard, roleGuard(['BUYER'])],
    loadComponent: () => import('@features/buyer/my-purchases/my-purchases.component').then(m => m.MyPurchasesComponent) },

  // ── Seller ──────────────────────────────────────────────────
  { path: 'seller', canActivate: [authGuard, roleGuard(['SELLER'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',
        loadComponent: () => import('@features/seller/dashboard/seller-dashboard.component').then(m => m.SellerDashboardComponent) },
      { path: 'verification',
        loadComponent: () => import('@features/seller/verification/verification.component').then(m => m.VerificationComponent) },
      { path: 'upload',
        loadComponent: () => import('@features/seller/upload-note/upload-note.component').then(m => m.UploadNoteComponent) },
      { path: 'notes',
        loadComponent: () => import('@features/seller/my-notes/my-notes.component').then(m => m.MyNotesComponent) },
    ]
  },

  // ── Admin ───────────────────────────────────────────────────
  { path: 'admin', canActivate: [authGuard, roleGuard(['ADMIN'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',
        loadComponent: () => import('@features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'users',
        loadComponent: () => import('@features/admin/users/admin-users.component').then(m => m.AdminUsersComponent) },
      { path: 'verifications',
        loadComponent: () => import('@features/admin/verifications/admin-verifications.component').then(m => m.AdminVerificationsComponent) },
      { path: 'config',
        loadComponent: () => import('@features/admin/config/admin-config.component').then(m => m.AdminConfigComponent) },
      { path: 'test',
        loadComponent: () => import('@features/admin/test-manager/admin-test-manager.component').then(m => m.AdminTestManagerComponent) },
    ]
  },

  { path: '**', redirectTo: '/browse' }
];
