import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from '@ui/toast/toast.component';
import { ConfirmDialogComponent } from '@ui/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, ToastComponent, ConfirmDialogComponent],
  template: `<router-outlet></router-outlet><app-toast /><app-confirm />`,
})
export class AppComponent {}
