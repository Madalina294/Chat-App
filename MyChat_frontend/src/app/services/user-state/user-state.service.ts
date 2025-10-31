import { Injectable, signal, computed } from '@angular/core';
import { StorageService } from '../storage/storage.service';

export interface UserState {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  image: string | null;
  preferredTheme: string | "dark";
  preferredLanguage: string | "en"
  mfaEnabled: boolean;
  googleId?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class UserStateService {
  // Signal pentru starea utilizatorului
  private userSignal = signal<UserState | null>(null);

  // Computed signals pentru proprietăți specifice
  user = this.userSignal.asReadonly();
  userName = computed(() => {
    const user = this.userSignal();
    return user ? `${user.firstname} ${user.lastname}` : '';
  });
  userImage = computed(() => this.userSignal()?.image || null);
  userRole = computed(() => this.userSignal()?.role || '');
  isAdmin = computed(() => this.userRole() === 'ADMIN');
  isCustomer = computed(() => this.userRole() === 'USER');



  constructor() {
    this.loadUserFromStorage();
  }

  /**
   * Încarcă datele utilizatorului din localStorage
   */
  loadUserFromStorage(): void {
    const userData = StorageService.getUser();
    console.log('=== DEBUG: UserStateService loadUserFromStorage ===');
    console.log('UserData from storage:', userData);
    console.log('GoogleId from storage:', userData?.googleId);
    console.log('=== END DEBUG ===');

    if (userData) {
      this.userSignal.set({
        id: userData.id,
        firstname: userData.firstname,
        lastname: userData.lastname,
        email: userData.email,
        role: userData.role,
        image: userData.image,
        preferredTheme: userData.preferredTheme,
        preferredLanguage: userData.preferredLanguage,
        mfaEnabled: userData.mfaEnabled || false,
        googleId: userData.googleId
      });
    } else {
      this.userSignal.set(null);
    }
  }

  /**
   * Actualizează datele utilizatorului și sincronizează cu localStorage
   */
  updateUser(userData: Partial<UserState>): void {
    const currentUser = this.userSignal();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      this.userSignal.set(updatedUser);

      // Sincronizează cu localStorage
      StorageService.saveUser(updatedUser);
    }
  }

  /**
   * Setează datele complete ale utilizatorului
   */
  setUser(userData: UserState): void {
    this.userSignal.set(userData);
    StorageService.saveUser(userData);
  }

  /**
   * Șterge datele utilizatorului (logout)
   */
  clearUser(): void {
    this.userSignal.set(null);
    StorageService.signout();
  }

  /**
   * Actualizează imaginea utilizatorului
   */
  updateUserImage(imageBase64: string): void {
    this.updateUser({ image: imageBase64 });
  }

  /**
   * Actualizează numele utilizatorului
   */
  updateUserName(firstname: string, lastname: string): void {
    this.updateUser({ firstname, lastname });
  }

  /**
   * Actualizează email-ul utilizatorului
   */
  updateUserEmail(email: string): void {
    this.updateUser({ email });
  }

  /**
   * Actualizează statusul 2FA
   */
  updateMfaStatus(mfaEnabled: boolean): void {
    this.updateUser({ mfaEnabled });
  }
}
