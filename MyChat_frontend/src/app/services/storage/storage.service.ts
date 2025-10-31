import { Injectable } from '@angular/core';


const TOKEN = "token";
const REFRESH_TOKEN = "refreshToken";
const USER = "user";

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() { }

  private static isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  static saveToken(token: string): void{
    if (!this.isBrowser()) return;
    console.log('Saving token to localStorage:', token);
    window.localStorage.removeItem(TOKEN);
    window.localStorage.setItem(TOKEN, token);
    console.log('Token saved successfully');
  }

  static saveRefreshToken(refreshToken: string): void{
    if (!this.isBrowser()) return;
    console.log('Saving refresh token to localStorage:', refreshToken);
    window.localStorage.removeItem(REFRESH_TOKEN);
    window.localStorage.setItem(REFRESH_TOKEN, refreshToken);
    console.log('Refresh token saved successfully');
  }

  static saveUser(user: any): void{
    if (!this.isBrowser()) return;
    window.localStorage.removeItem(USER);
    window.localStorage.setItem(USER, JSON.stringify(user));
  }
  static getToken(): string | null{
    if (!this.isBrowser()) return null;
    const token = window.localStorage.getItem(TOKEN);
    console.log('Retrieved token from localStorage:', token);
    return token;
  }

  static getRefreshToken(): string | null{
    if (!this.isBrowser()) return null;
    const refreshToken = window.localStorage.getItem(REFRESH_TOKEN);
    console.log('Retrieved refresh token from localStorage:', refreshToken);
    return refreshToken;
  }

  static getUser(): any{
    if (!this.isBrowser()) return null;
    const rawUser = window.localStorage.getItem(USER);
    if (!rawUser) return null;
    try{
      return JSON.parse(rawUser);
    } catch {
      return null;
    }
  }

  static getUserRole() : string{
    const user = this.getUser();
    if(user == null) return '';
    return user.role;
  }

  static isAdminLoggedIn(): boolean{
    if (!this.isBrowser()) return false;
    if(this.getToken() === null) return false;
    const role:string = this.getUserRole();
    return role === "ADMIN";
  }

  static isCustomerLoggedIn(): boolean{
    if (!this.isBrowser()) return false;
    if(this.getToken() == null) return false;
    const role:string = this.getUserRole();
    return role === "USER";
  }

  static signout(): void{
    if (!this.isBrowser()) return;
    window.localStorage.removeItem(USER);
    window.localStorage.removeItem(TOKEN);
    window.localStorage.removeItem(REFRESH_TOKEN);
  }

  static getUserName(): string{
    const user = this.getUser();
    if(user){
      return user.firstname + " " + user.lastname;
    }
    return '';
  }

  static getUserId(): number{
    const user = this.getUser();
    if(user){
      return user.id;
    }
    return -1;
  }

}
