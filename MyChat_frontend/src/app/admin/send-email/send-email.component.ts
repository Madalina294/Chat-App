import {Component, signal} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzColDirective, NzRowDirective} from "ng-zorro-antd/grid";
import {NzFormControlComponent, NzFormDirective, NzFormLabelComponent} from "ng-zorro-antd/form";
import {NzInputDirective} from "ng-zorro-antd/input";
import {NzSpinComponent} from "ng-zorro-antd/spin";
import {ActivatedRoute, Router} from '@angular/router';
import {AdminService} from '../../services/admin/admin.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {TranslateModule, TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-send-email',
  imports: [
    FormsModule,
    NzButtonComponent,
    NzColDirective,
    NzFormControlComponent,
    NzFormDirective,
    NzRowDirective,
    NzSpinComponent,
    ReactiveFormsModule,
    NzInputDirective,
    NzFormLabelComponent,
    TranslateModule
  ],
  templateUrl: './send-email.component.html',
  styleUrl: './send-email.component.scss'
})
export class SendEmailComponent {
  isSpinning = signal(false);
  emailForm!: FormGroup;
  toEmail: string='';

  constructor(private fb: FormBuilder,
              private route: ActivatedRoute,
              private adminService : AdminService,
              private snackBar: MatSnackBar,
              private router: Router,
              private translate: TranslateService){
    this.emailForm = this.fb.group({
      subject: ['', [Validators.required]],
      content: ['', [Validators.required]]
    })
    this.toEmail = this.route.snapshot.queryParams['email'] || '';
  }

  onSubmit() {
    if(this.emailForm.valid){
      this.isSpinning.set(true);
    }

    const request = new FormData();
    request.append('subject', this.emailForm.get('subject')?.value);
    request.append('toEmail', this.toEmail);
    request.append('content', this.emailForm.get('content')?.value);

    this.adminService.sendEmail(request).subscribe({
      next: (res) =>{
        this.isSpinning.set(false);
        console.log("Email sent!");
        this.snackBar.open(this.translate.instant('sendEmail.successMessage'), this.translate.instant('sendEmail.ok'), {duration: 3000});
        this.router.navigate(["/admin/all-users"]);
      },
      error: (res) =>{
        this.isSpinning.set(false);
        console.log(res.err.message);
        this.snackBar.open(this.translate.instant('sendEmail.errorMessage'), this.translate.instant('sendEmail.ok'), {duration: 3000});
        this.emailForm.reset();
      }
    })
  }
}
