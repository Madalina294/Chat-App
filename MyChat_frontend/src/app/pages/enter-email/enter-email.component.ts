import {Component, signal} from '@angular/core';
import {NzSpinComponent} from "ng-zorro-antd/spin";
import {NzFormControlComponent, NzFormDirective} from 'ng-zorro-antd/form';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {NzColDirective, NzRowDirective} from 'ng-zorro-antd/grid';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthenticationService} from '../../services/auth/authentication.service';
import {NzMessageService} from 'ng-zorro-antd/message';
import {UserState, UserStateService} from '../../services/user-state/user-state.service';
import {TranslateModule, TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-enter-email',
  imports: [
    NzSpinComponent,
    NzFormDirective,
    ReactiveFormsModule,
    NzColDirective,
    NzFormControlComponent,
    NzInputDirective,
    NzRowDirective,
    NzButtonComponent,
    TranslateModule
  ],
  templateUrl: './enter-email.component.html',
  styleUrl: './enter-email.component.scss'
})
export class EnterEmailComponent {
  isSpinning = signal(false);
  emailForm!: FormGroup;

  constructor(private router: Router,
              private fb: FormBuilder,
              private authService: AuthenticationService,
              private message: NzMessageService,
              private translate: TranslateService){
    this.emailForm = this.fb.group({
      email:['', [Validators.required, Validators.email]]
    });


  }

  onSubmit() {
    if(this.emailForm.valid){
      this.isSpinning.set(true);
    }
    const userEmail = this.emailForm.get('email')?.value;
    this.authService.forgotPassword(userEmail).subscribe({
      next: (response) =>{
        this.isSpinning.set(false); // Stop spinner first
        this.message.success(this.translate.instant('enterEmail.successMessage'));
        // Redirect to reset password page with email
        this.router.navigate(['/reset-password'], {
          queryParams: { email: userEmail }
        });
      },
      error: (response) => {
        this.isSpinning.set(false);
        this.message.error(this.translate.instant('enterEmail.errorMessage'));
      }
    })
  }
}
