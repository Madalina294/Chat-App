import {ChangeDetectionStrategy, ChangeDetectorRef, Component, signal} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors} from '@angular/forms';
import {RegisterRequest} from '../../models/register-request';
import {AuthenticationResponse} from '../../models/authentication-response';
import {RouterLink, Router} from '@angular/router';
import {AuthenticationService} from '../../services/auth/authentication.service';
import {VerificationRequest} from '../../models/verification-request';
import {NgIf} from '@angular/common';
import {NzSpinComponent} from 'ng-zorro-antd/spin';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {NzFormControlComponent, NzFormDirective, NzFormItemComponent} from 'ng-zorro-antd/form';
import {NzMessageService} from 'ng-zorro-antd/message';
import {StorageService} from '../../services/storage/storage.service';
import { UserStateService } from '../../services/user-state/user-state.service';
import {TranslatePipe} from '@ngx-translate/core';
import {NzIconDirective} from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-register',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    NgIf,
    NzSpinComponent,
    NzButtonComponent,
    NzInputDirective,
    NzIconDirective,
    NzFormControlComponent,
    NzFormDirective,
    NzFormItemComponent,
    TranslatePipe
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  registerForm!: FormGroup;
  registerRequest: RegisterRequest = {};
  authResponse: AuthenticationResponse | null = null;
  otpCode = '';
  isSpinning = signal(false);
  isVerifying = signal(false);
  qrCodeUri: string = '';
  private message: NzMessageService;
  showMfaEnabled: boolean = false;
  passwordVisible = signal(false); // Pentru show/hide password
  confirmPasswordVisible = signal(false); // Pentru show/hide confirm password

  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private fb: FormBuilder,
    message: NzMessageService,
    private userStateService: UserStateService
  ) {
    this.message = message;
    this.initializeForm();
  }

  private initializeForm() {
    this.registerForm = this.fb.group({
      firstname: ['', [Validators.required, Validators.minLength(2)]],
      lastname: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
      ]],
      confirmPassword: ['', [Validators.required]],
      mfaEnabled: [false]
    }, { validators: this.passwordsMatchValidator });
  }

  private passwordsMatchValidator = (group: AbstractControl): ValidationErrors | null => {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordsMismatch: true };
  }

  async registerUser() {
    if (this.registerForm.invalid) {
      Object.values(this.registerForm.controls).forEach(control => control.markAsDirty());
      this.registerForm.updateValueAndValidity();
      return;
    }

    this.isSpinning.set(true);

    // Populez registerRequest din form
    this.registerRequest = {
      firstname: this.registerForm.get('firstname')?.value,
      lastname: this.registerForm.get('lastname')?.value,
      email: this.registerForm.get('email')?.value,
      password: this.registerForm.get('password')?.value,
      role: 'USER',
      mfaEnabled: this.registerForm.get('mfaEnabled')?.value
    };

    this.authService.register(this.registerRequest)
      .subscribe({
        next: (response) => {
          console.log('Register response:', response); // Debug log

          if (response && response.mfaEnabled) {
            // Utilizatorul are 2FA activat - afișează QR code pentru setup
            this.authResponse = response;
            this.isSpinning.set(false);
            this.showMfaEnabled = true;

            // Folosește QR code-ul din răspunsul inițial - MULT MAI RAPID!
            this.qrCodeUri = response.qrCodeUrl || '';
            this.message.success('Account created! Please set up 2FA.', { nzDuration: 3000 });
            return;
          } else if (response) {
            // Utilizatorul nu are 2FA activat - loghează automat și redirectează
            this.isSpinning.set(false);

            // Verificăm că toate câmpurile necesare sunt prezente
            if (response.userId && response.userRole && response.userFirstName && response.userLastName) {
              const user = {
                id: response.userId,
                role: response.userRole,
                firstname: response.userFirstName,
                lastname: response.userLastName,
                email: this.registerRequest.email || '',
                image: response.image || null,
                preferredTheme: response.preferredTheme || "dark",
                preferredLanguage: response.preferredLanguage || "en",
                mfaEnabled: response.mfaEnabled || false,
                googleId: response.googleId || null
              };

              this.userStateService.setUser(user);
              StorageService.saveToken(response.accessToken as string);

              this.message.success('Account created successfully! Welcome!', { nzDuration: 2000 });
              setTimeout(() => {
                this.router.navigate(['chat']);
              }, 1000);
            } else {
              this.isSpinning.set(false);
              this.message.error('Registration completed but user data is incomplete. Please try logging in.', { nzDuration: 5000 });
              setTimeout(() => {
                this.router.navigate(['/login']);
              }, 2000);
            }
          } else {
            // Response este null sau undefined
            this.isSpinning.set(false);
            this.message.success('Account created successfully! Please log in.', { nzDuration: 3000 });
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 2000);
          }
        },
        error: (err) => {
          this.isSpinning.set(false);
          if (err.status === 400) {
            this.message.error('Email already exists or invalid data', { nzDuration: 5000 });
          } else {
            this.message.error('Registration failed. Please try again.', { nzDuration: 5000 });
          }
        }
      });
  }

  verifyTfa() {
    if (this.otpCode.length !== 6) {
      this.message.error('Code must be 6 digits', { nzDuration: 3000 });
      return;
    }

    this.isVerifying.set(true);

    const verifyRequest: VerificationRequest = {
      email: this.registerRequest.email,
      code: this.otpCode
    };

    this.authService.verifyCode(verifyRequest)
      .subscribe({
        next: (response) => {
          // Salvez datele utilizatorului din response (care conține toate datele după verificare)
          let userImage;

          const user = {
            id: response.userId,
            role: response.userRole,
            firstname: response.userFirstName,
            lastname: response.userLastName,
            email: this.registerRequest.email || '',
            image: response.image || null, // Backend-ul returnează acum image,
            preferredTheme: response.preferredTheme || "dark",
            preferredLanguage: response.preferredLanguage || "en",
            mfaEnabled: true,
            googleId: response.googleId || null
          };

          this.userStateService.setUser(user);
          StorageService.saveToken(response.accessToken as string);

          this.message.success('2FA verified successfully! Welcome!', { nzDuration: 2000 });

          setTimeout(() => {
            this.isVerifying.set(false);
            this.router.navigate(['chat']);
          }, 1000);
        },
        error: (err) => {
          this.isVerifying.set(false);
          if (err.status === 400 || err.status === 401) {
            this.message.error('Verification code is incorrect', { nzDuration: 5000 });
          } else {
            this.message.error('Verification failed. Please try again.', { nzDuration: 5000 });
          }
          this.otpCode = '';
        }
      });
  }

  onQrCodeLoaded() {
    console.log('QR Code loaded successfully!');
  }

  onQrCodeError(event: any) {
    console.error('QR Code failed to load:', event);
    console.error('QR Code URL was:', this.qrCodeUri);
  }

}
