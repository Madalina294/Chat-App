import { Component, ChangeDetectionStrategy, effect, ChangeDetectorRef, Injector, computed, signal } from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormField, MatHint, MatInput} from '@angular/material/input';
import {MatButton} from '@angular/material/button';
import {StorageService} from '../../services/storage/storage.service';
import {UserService} from '../../services/user/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatError, MatLabel } from '@angular/material/form-field';
import { OnInit } from '@angular/core';
import {NgIf} from '@angular/common';
import { UserStateService } from '../../services/user-state/user-state.service';
import { ThemeService } from '../../services/theme/theme.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDeleteComponent } from '../../shared/confirm-delete/confirm-delete.component';
import {MatIcon} from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-profile',
  imports: [
    MatFormField,
    MatInput,
    MatButton,
    MatLabel,
    MatError,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    MatCheckbox,
    NgIf,
    MatIcon,
    TranslateModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit {
  updateForm!: FormGroup;
  selectedFile: File | null = null;
  tempImagePreview = signal<string | null>(null); // Signal pentru preview-ul temporar

  // Signals din UserStateService - vor fi inițializate în constructor
  user!: any;
  userName!: any;
  userImage!: any;

  // Computed signal pentru preview-ul imaginii
  imageToDisplay = computed(() => {
    const image = this.tempImagePreview() || this.userImage();
    if (image && image.startsWith('/uploads/')) {
      return 'http://localhost:8080' + image;
    }
    return image || 'assets/default-avatar.png';
  });

  // Computed signal pentru a verifica dacă utilizatorul este conectat prin Google
  isGoogleUser = computed(() => {
    const currentUser = this.user();

    const isGoogle = currentUser &&
                     currentUser.googleId &&
                     currentUser.googleId !== null &&
                     currentUser.googleId !== undefined &&
                     currentUser.googleId.trim() !== '';

    console.log('Final isGoogle result:', isGoogle);
    return !!isGoogle; // Convert to boolean
  });

  constructor(private router: Router,
              private fb: FormBuilder,
              private userService: UserService,
              private snackBar: MatSnackBar,
              private userStateService: UserStateService,
              private themeService: ThemeService,
              private cdr: ChangeDetectorRef,
              private injector: Injector,
              private dialog: MatDialog,
              private translate: TranslateService){
    // Inițializez signals după ce userStateService este disponibil
    this.user = this.userStateService.user;
    this.userName = this.userStateService.userName;
    this.userImage = this.userStateService.userImage;

    this.updateForm = this.fb.group({
      firstName: [''],
      lastName: [''],
      email: ['', Validators.email],
      mfaEnabled: [false]
    });

  }

  ngOnInit() {
    // Effect pentru actualizarea formularului când se schimbă datele utilizatorului
    effect(() => {
      const currentUser = this.user();
      if (currentUser) {
        this.updateForm.patchValue({
          firstName: currentUser.firstname,
          lastName: currentUser.lastname,
          email: currentUser.email,
          mfaEnabled: currentUser.mfaEnabled
        });
      }
      this.cdr.markForCheck();
    }, { injector: this.injector });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      // Validate type
      if (!file.type.startsWith('image/')) {
        this.snackBar.open(this.translate.instant('profile.invalidImageType'), this.translate.instant('profile.ok'));
        return;
      }

      // Validate size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.snackBar.open(this.translate.instant('profile.imageTooLarge'), this.translate.instant('profile.ok'));
        return;
      }

      // Save file for upload
      this.selectedFile = file;

      // Generate preview
      const reader = new FileReader();
      reader.onload = () => {
        this.tempImagePreview.set(reader.result as string); // base64 string
        this.cdr.markForCheck(); // force UI update (OnPush)
      };
      reader.readAsDataURL(file);
    }
  }

  logout() {
    this.userStateService.clearUser();
    // Revino la dark mode ca default la logout
    this.themeService.resetToDefaultTheme();
    this.router.navigateByUrl("/login");
  }

  deleteAccount() {
    const dialogRef = this.dialog.open(ConfirmDeleteComponent, {
      width: '400px',
      data: {
        message: this.translate.instant('profile.confirmDelete.message'),
        title: this.translate.instant('profile.confirmDelete.title'),
        confirmText: this.translate.instant('profile.confirmDelete.confirmText'),
        cancelText: this.translate.instant('profile.confirmDelete.cancelText')
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result === true){
        const userId = StorageService.getUserId();
        if(userId !== -1){
          this.userService.deleteAccount(userId).subscribe({
            next: (res) => {
              this.snackBar.open(this.translate.instant('profile.accountDeleted'),
                this.translate.instant('profile.ok'), {duration: 2000});
              this.userStateService.clearUser();
              this.router.navigateByUrl("/register");
            },
            error: (err) =>{
              console.error('Delete account error:', err);
              if (err.status === 403) {
                this.snackBar.open(this.translate.instant('profile.deleteOwnAccount'), this.translate.instant('profile.ok'), {duration: 3000});
              } else if (err.status === 404) {
                this.snackBar.open(this.translate.instant('profile.accountNotFound'), this.translate.instant('profile.ok'), {duration: 3000});
              } else {
                this.snackBar.open(this.translate.instant('profile.somethingWentWrong'), this.translate.instant('profile.ok'), {duration: 3000});
              }
            }
          })
        }
        else{
          this.snackBar.open(this.translate.instant('profile.userIdNotFound'), this.translate.instant('profile.ok'), {duration: 3000});
        }
      }
    });
  }

  async updateProfile() {
    if (this.updateForm.invalid) {
      this.snackBar.open(this.translate.instant('profile.fillFieldsCorrectly'), this.translate.instant('profile.ok'));
      return;
    }

    const formData = this.updateForm.value;
    const currentUser = this.user();
    if (!currentUser) return;



    // Creez FormData
    const updateData = new FormData();
    updateData.append('userId', currentUser.id.toString());
    updateData.append('firstName', formData.firstName);
    updateData.append('lastName', formData.lastName);
    updateData.append('email', formData.email);
    updateData.append('mfaEnabled', currentUser.googleId ? "false" : formData.mfaEnabled.toString());

    // Append image only if selected
    if (this.selectedFile) {
      updateData.append('image', this.selectedFile, this.selectedFile.name);
    }

    this.userService.updateProfileWithFormData(updateData).subscribe({
      next: (response: any) => {
        this.snackBar.open(this.translate.instant('profile.profileUpdated'), this.translate.instant('profile.ok'), { duration: 2000 });

        //  Backend-ul returnează acum imageUrl (URL-ul imaginii), nu base64
        let finalImage: string | null = null;
        if (response.image) {
          // Backend-ul returnează URL-ul imaginii
          finalImage = response.image;
        } else {
          // Păstrează imaginea existentă dacă nu s-a uploadat una nouă
          finalImage = currentUser.image;
        }

        //  Update state immediately
        this.userStateService.updateUser({
          firstname: response.firstname || formData.firstName,
          lastname: response.lastname || formData.lastName,
          email: response.email || formData.email,
          image: finalImage,
          mfaEnabled: response.mfaEnabled ?? formData.mfaEnabled
        });

        //  Reset file selection & preview
        this.selectedFile = null;
        this.tempImagePreview.set(null);

        // Force change detection (OnPush)
        this.cdr.markForCheck();

        // Handle 2FA enable
        if (formData.mfaEnabled && !currentUser.mfaEnabled) {
          this.snackBar.open(this.translate.instant('profile.2FAEnabled'), this.translate.instant('profile.ok'), { duration: 3000 });
          setTimeout(() => {
            this.userStateService.clearUser();
            this.router.navigateByUrl("/login");
          }, 3000);
        }
      },
      error: (error) => {
        if (error.error?.message) {
          this.snackBar.open(error.error.message, this.translate.instant('profile.ok'));
        } else {
          this.snackBar.open(this.translate.instant('profile.somethingWentWrong'), this.translate.instant('profile.ok'));
        }
      }
    });
  }

  // Metodă pentru utilizatorii Google
  goToGoogleAccount() {
    window.open('https://myaccount.google.com/security', '_blank');
  }

}
