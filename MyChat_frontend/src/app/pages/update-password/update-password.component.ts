import {Component, signal} from '@angular/core';
import {
  AbstractControl,
  FormBuilder, FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {Router} from '@angular/router';
import {UserService} from '../../services/user/user.service';
import {UserStateService} from '../../services/user-state/user-state.service';
import {StorageService} from '../../services/storage/storage.service';
import {NgIf} from '@angular/common';
import {NzFormModule} from 'ng-zorro-antd/form';
import {NzInputModule} from 'ng-zorro-antd/input';
import {NzIconModule} from 'ng-zorro-antd/icon';
import {NzButtonModule} from 'ng-zorro-antd/button';
import {NzSpinModule} from 'ng-zorro-antd/spin';
import {NzMessageService} from 'ng-zorro-antd/message';
import {NzAlertModule} from 'ng-zorro-antd/alert';
import {AuthenticationService} from '../../services/auth/authentication.service';
import {TranslateModule, TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-update-password',
  imports: [
    ReactiveFormsModule,
    NgIf,
    NzFormModule,
    NzInputModule,
    NzIconModule,
    NzButtonModule,
    NzSpinModule,
    NzAlertModule,
    TranslateModule
  ],
  templateUrl: './update-password.component.html',
  styleUrl: './update-password.component.scss'
})
export class UpdatePasswordComponent {
  updatePasswordForm: FormGroup<{
    currentPassword: FormControl<string>;
    newPassword: FormControl<string>;
    confirmPassword: FormControl<string>;
  }>;

  isSpinning = signal(false);
  user: any;
  currentPasswordVisible = signal(false); // Pentru show/hide current password
  newPasswordVisible = signal(false); // Pentru show/hide new password
  confirmPasswordVisible = signal(false); // Pentru show/hide confirm password

  constructor(private fb: FormBuilder,
              private message: NzMessageService,
              private router: Router,
              private userService: UserService,
              private userStateService: UserStateService,
              private authService: AuthenticationService,
              private translate: TranslateService) {

    this.user = this.userStateService.user;
    this.updatePasswordForm = this.fb.group({
      currentPassword: this.fb.control('', {
        validators: [
          Validators.required,
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/),
        ],
        nonNullable: true
      }),
      newPassword: this.fb.control('', {
        validators: [
          Validators.required,
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/),
        ],
        nonNullable: true
      }),
      confirmPassword: this.fb.control('', {
        validators: [Validators.required],
        nonNullable: true
      }),
    }, { validators: this.passwordsMatchValidator });

  }

  private passwordsMatchValidator = (group: AbstractControl): ValidationErrors | null => {
    const password = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordsMismatch: true };
  }

  updatePassword(){

    if (this.updatePasswordForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.updatePasswordForm.controls).forEach(key => {
        this.updatePasswordForm.get(key)?.markAsTouched();
      });
      this.message.error(this.translate.instant('updatePassword.validationError'));
      return;
    }

    this.isSpinning.set(true);
    const currentUser = StorageService.getUser();
    const request = {
      userId: currentUser.id,
      currentPassword: this.updatePasswordForm.get('currentPassword')?.value,
      newPassword: this.updatePasswordForm.get('newPassword')?.value
    };

    this.userService.updatePassword(request).subscribe({
      next: (updatedUser) => {
        this.isSpinning.set(false);

        // Update user data in local storage
        if (updatedUser) {
          const currentUser = StorageService.getUser();
          const userToUpdate = {
            ...currentUser,
            firstname: updatedUser.firstName || currentUser.firstname,
            lastname: updatedUser.lastName || currentUser.lastname,
            email: updatedUser.email || currentUser.email,
            image: updatedUser.image || currentUser.image,
            mfaEnabled: updatedUser.mfaEnabled || currentUser.mfaEnabled
          };

          // Update both StorageService and UserStateService
          StorageService.saveUser(userToUpdate);
          this.userStateService.setUser(userToUpdate);
        }

        this.message.success(this.translate.instant('updatePassword.successMessage'));
        this.router.navigateByUrl('/profile');
      },
      error: (error) => {
        this.isSpinning.set(false);
        const errorMessage = error.error?.message || error.error || this.translate.instant('updatePassword.errorMessage');
        this.message.error(errorMessage);
      }
    })
  }

  resetForgottenPassword() {
    // Get current user email
    const currentUser = StorageService.getUser();

    if (currentUser && currentUser.email) {
      this.isSpinning.set(true);

      this.authService.forgotPassword(currentUser.email).subscribe({
        next: (response) => {
          this.isSpinning.set(false); // Stop spinner first
          this.message.success(this.translate.instant('updatePassword.resetCodeSent'));
          // Redirect to reset password page with email
          this.router.navigate(['/reset-password'], {
            queryParams: { email: currentUser.email }
          });
        },
        error: (error) => {
          this.isSpinning.set(false); // Stop spinner first
          console.error('Forgot password error:', error);
          const errorMessage = error.error?.message || error.error || this.translate.instant('updatePassword.resetCodeFailed');
          this.message.error(errorMessage);
        }
      });
    } else {
      this.message.error(this.translate.instant('updatePassword.emailNotFound'));
    }
  }



}
