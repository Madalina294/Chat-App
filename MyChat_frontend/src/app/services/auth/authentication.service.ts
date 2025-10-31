import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {RegisterRequest} from '../../models/register-request';
import {AuthenticationResponse} from '../../models/authentication-response';
import {Observable} from 'rxjs';
import {VerificationRequest} from '../../models/verification-request';
import {AuthenticationRequest} from '../../models/authentication-request';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  private baseUrl = 'http://localhost:8080/api/auth'
  constructor(
    private http: HttpClient
  ) { }

  register(registerRequest : RegisterRequest): Observable<AuthenticationResponse> {
    return this.http.post<AuthenticationResponse>(`${this.baseUrl}/register`, registerRequest,  { responseType: 'json' });
  }

  login(authRequest: AuthenticationRequest):Observable<AuthenticationResponse> {
    return this.http.post<AuthenticationResponse>(`${this.baseUrl}/login`, authRequest,  { responseType: 'json' });
  }

  verifyCode(verificationRequest: VerificationRequest):Observable<AuthenticationResponse>{
    return this.http.post<AuthenticationResponse>(`${this.baseUrl}/verify`, verificationRequest,  { responseType: 'json' });
  }


  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/forgot-password`, { email });
  }

  resetPassword(request: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/reset-password`, request);
  }
}
