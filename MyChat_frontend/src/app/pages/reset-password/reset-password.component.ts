import {Component, signal} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {AuthenticationService} from '../../services/auth/authentication.service';
import {NzMessageService} from 'ng-zorro-antd/message';
import {NzSpinComponent} from 'ng-zorro-antd/spin';
import {NzFormControlComponent, NzFormDirective, NzFormItemComponent, NzFormLabelComponent} from 'ng-zorro-antd/form';
import {NzInputDirective, NzInputGroupComponent} from 'ng-zorro-antd/input';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NgIf} from '@angular/common';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {UserStateService} from '../../services/user-state/user-state.service';
import {TranslateModule, TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-reset-password',
  imports: [
    NzSpinComponent,
    NzFormDirective,
    ReactiveFormsModule,
    NzFormItemComponent,
    NzFormLabelComponent,
    NzFormControlComponent,
    NzInputDirective,
    NzIconDirective,
    NgIf,
    NzButtonComponent,
    RouterLink,
    TranslateModule
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent {

  email: string;
  resetForm!: FormGroup;
  isLoading = signal(false);
  isUserLoggedIn: any;
  newPasswordVisible = signal(false); // Pentru show/hide new password
  confirmPasswordVisible = signal(false); // Pentru show/hide confirm password

  constructor(private router: Router,
              private fb: FormBuilder,
              private authService: AuthenticationService,
              private message: NzMessageService,
              private route: ActivatedRoute,
              private userState: UserStateService,
              private translate: TranslateService){
    this.isUserLoggedIn = this.userState.isCustomer || this.userState.isAdmin;
    this.email = this.route.snapshot.queryParams['email'] || '';

    this.resetForm = this.fb.group({
      resetCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      newPassword: ['', [
        Validators.required,
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
      ]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }
  passwordMatchValidator = (group: any) => {
    const password = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordsMismatch: true };
  };

  onSubmit(){
    if (this.resetForm.valid) {
      this.isLoading.set(true);

      const request = {
        email: this.email,
        resetCode: this.resetForm.get('resetCode')?.value,
        newPassword: this.resetForm.get('newPassword')?.value
      };

      this.authService.resetPassword(request).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.message.success(this.translate.instant('resetPassword.successMessage'));
          this.router.navigate(['/login']);

        },
        error: (error) => {
          this.isLoading.set(false);
          this.message.error(error.error || this.translate.instant('resetPassword.errorMessage'));
        }
      });
    }
  }

}
