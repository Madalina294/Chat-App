import {Component, ChangeDetectorRef, OnInit, signal} from '@angular/core';
import {NgIf} from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {AuthenticationRequest} from '../../models/authentication-request';
import {AuthenticationResponse} from '../../models/authentication-response';
import {AuthenticationService} from '../../services/auth/authentication.service';
import {Router, RouterLink} from '@angular/router';
import {VerificationRequest} from '../../models/verification-request';
import {NzSpinComponent} from 'ng-zorro-antd/spin';
import {NzColDirective, NzRowDirective} from 'ng-zorro-antd/grid';
import {NzFormControlComponent, NzFormDirective} from 'ng-zorro-antd/form';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzMessageService} from 'ng-zorro-antd/message';
import {StorageService} from '../../services/storage/storage.service';
import { UserStateService } from '../../services/user-state/user-state.service';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  imports: [
    NgIf,
    FormsModule,
    RouterLink,
    ReactiveFormsModule,
    NzSpinComponent,
    NzRowDirective,
    NzColDirective,
    NzFormDirective,
    NzFormControlComponent,
    NzInputDirective,
    NzIconDirective,
    NzButtonComponent,
    TranslatePipe
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit{
  authRequest: AuthenticationRequest = {};
  otpCode = '';
  authResponse: AuthenticationResponse | null = null;
  loginForm!: FormGroup;
  isSpinning = signal(false);
  qrCodeUri: string ='';
  showMfaSection = signal(false);// Variabilă separată pentru controlul afișării 2FA
  passwordVisible = signal(false); // Pentru show/hide password
  private message : NzMessageService;


  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private fb: FormBuilder,
    message: NzMessageService,
    private userStateService: UserStateService
  ) {
    this.message = message;
    this.router = router;
    this.loginForm = this.fb.group({
      email: [null, [Validators.required, Validators.email]],
      password: [null, [
        Validators.required,
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
      ]],
    });
  }


  ngOnInit() {
    this.authResponse = null; // Reset state
    this.otpCode = '';
    this.authRequest = {};

    // Verifică dacă suntem în browser (nu în SSR)
    if (typeof window !== 'undefined') {
      // Verifică dacă există token în URL (pentru OAuth)
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (token) {
        console.log('OAuth token found in URL:', token);
        // Salvează token-ul și navighează către welcome (ca logarea normală)
        StorageService.saveToken(token);

        // Obține datele utilizatorului direct din URL (trimise de backend)
        const imageParam = urlParams.get('image');

        const userData = {
          id: parseInt(urlParams.get('id') || '0'),
          firstname: urlParams.get('firstname') || '',
          lastname: urlParams.get('lastname') || '',
          email: urlParams.get('email') || '',
          role: urlParams.get('role') || 'USER',
          image: imageParam || null,
          preferredTheme: urlParams.get('preferredTheme') || "dark",
          preferredLanguage: urlParams.get('preferredLanguage') || "en",
          mfaEnabled: urlParams.get('mfaEnabled') === 'true'
        };

        console.log('User data from OAuth backend:', userData);

        StorageService.saveUser(userData);
        this.userStateService.setUser(userData);

        // Navighează către welcome
        this.router.navigate(['/chat']);
      }
    }
  }


  login() {
    if (this.loginForm.invalid) {
      Object.values(this.loginForm.controls).forEach(control => control.markAsDirty());
      this.loginForm.updateValueAndValidity();
      return;
    }
    this.isSpinning.set(true);

    // Populez authRequest din form
    this.authRequest = {
      email: this.loginForm.get('email')?.value,
      password: this.loginForm.get('password')?.value
    };

    this.authService.login(this.authRequest).subscribe({
      next: (res): any => {
        console.log('Login response:', res);
        this.isSpinning.set(false);

        if (res.userId !== null) {
          if (res.mfaEnabled) {
            this.authResponse = res;
            this.showMfaSection.set(true);
            this.qrCodeUri = res.qrCodeUrl || '';

            return;
          }

          const user = {
            id: res.userId,
            role: res.userRole,
            firstname: res.userFirstName,
            lastname: res.userLastName,
            email: this.authRequest.email || '',
            image: res.image || null,
            preferredTheme: res.preferredTheme || "dark",
            preferredLanguage: res.preferredLanguage || "en",
            mfaEnabled: res.mfaEnabled || false,
            googleId: res.googleId || null
          };

          this.userStateService.setUser(user);
          StorageService.saveUser(user);
          StorageService.saveToken(res.accessToken as string);

          // după ce salvezi token + user:
          setTimeout(() => {
            this.router.navigateByUrl('/chat')
              .then(ok => console.log('Navigated to /chat:', ok))
              .catch(err => console.error('Navigation to /chat failed:', err));
          }, 10);
        } else {
          this.isSpinning.set(false);
          return this.message.error("Bad credentials", {nzDuration: 5000});
        }
        this.isSpinning.set(false);
      },
      error: (err) => {
        this.isSpinning.set(false);
        if (err && (err.status === 401 || err.status === 403)) {
          this.message.error("Email or password is incorrect", {nzDuration: 5000});
        } else {
          this.isSpinning.set(false);
          this.message.error("Error at authentication. Try again.", {nzDuration: 5000});
        }
      }
    });
  }

  verifyCode() {
    const verifyRequest: VerificationRequest = {
      email: this.authRequest.email,
      code: this.otpCode
    };
    this.isSpinning.set(true);

    this.authService.verifyCode(verifyRequest)
      .subscribe({
        next: (response) => {
          this.isSpinning.set(false);
          const user = {
            id: response.userId,
            role: response.userRole,
            firstname: response.userFirstName,
            lastname: response.userLastName,
            email: this.authRequest.email || '',
            image: response.image || null,
            preferredTheme: response.preferredTheme || "dark",
            preferredLanguage: response.preferredLanguage || "en",
            mfaEnabled: true,
            googleId: response.googleId || null
          };

          this.userStateService.setUser(user);
          StorageService.saveToken(response.accessToken as string);

          this.router.navigate(['/chat']);
        },
        error: (err) => {
          this.isSpinning.set(false);
          this.message.error("Verification code is incorrect!", {nzDuration: 5000});
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

  loginWithGoogle() {
    if (typeof window !== 'undefined') {
      window.location.href = 'http://localhost:8080/oauth2/authorization/google';
    }
  }
}
