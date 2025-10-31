import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {StorageService} from '../storage/storage.service';
import {Observable} from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class UserService {

  private baseUrl = 'http://localhost:8080/api/user'
  constructor(
    private http: HttpClient
  ) { }

  deleteAccount(userId: number) {
    return this.http.delete(this.baseUrl + `/delete/${userId}`, {headers: this.createAuthorizationHeader()});
  }


  updateProfileWithFormData(formData: any): Observable<any>{
    const headers = this.createAuthorizationHeader();
    return this.http.put(this.baseUrl + `/update-infos`, formData, {headers: headers});
  }

  updatePreferredTheme(userId: number, theme: string): Observable<any> {
    const headers = this.createAuthorizationHeader();
    return this.http.put(this.baseUrl + `/update-theme/${userId}/${theme}`, {}, {
      headers: headers
    });
  }

  updatePreferredLanguage(userId: number, language: string): Observable<any> {
    const headers = this.createAuthorizationHeader();
    return this.http.put(this.baseUrl + `/update-language/${userId}/${language}`, {}, {
      headers: headers
    });
  }

  updatePassword(data: any): Observable<any>{
    const headers = this.createAuthorizationHeader();
    console.log('Update password request:', data);
    console.log('Headers:', headers.keys());
    return this.http.put(this.baseUrl + `/update-password`, data, {headers: headers});
  }


  createAuthorizationHeader(): HttpHeaders{
    const token = StorageService.getToken();
    if (!token) {
      console.error('No token found in storage');
      return new HttpHeaders();
    }

    return new HttpHeaders({
      'Authorization': 'Bearer ' + token
    });
  }
}
