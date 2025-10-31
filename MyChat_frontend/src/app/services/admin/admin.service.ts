import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageService } from '../storage/storage.service';

export interface UserData {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  imageUrl?: string; 
  mfaEnabled: boolean;
}

export interface PaginatedResponse {
  content: UserData[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private baseUrl = 'http://localhost:8080/api/admin';

  constructor(private http: HttpClient) { }

  getAllUsers(): Observable<UserData[]> {
    return this.http.get<UserData[]>(`${this.baseUrl}/users`, {
      headers: this.createAuthorizationHeader()
    });
  }

  getUsersPaginated(page: number = 0, size: number = 10, sortBy: string = 'id', sortDir: string = 'asc'): Observable<PaginatedResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy: sortBy,
      sortDir: sortDir
    });
    
    return this.http.get<PaginatedResponse>(`${this.baseUrl}/users/paginated?${params}`, {
      headers: this.createAuthorizationHeader()
    });
  }

  deleteUser(userId: number) {
    return this.http.delete(`${this.baseUrl}/delete-user/${userId}`, {
      headers: this.createAuthorizationHeader()
    });
  }

  sendEmail(requestData: any){
    return this.http.post(`${this.baseUrl}/send-email`, requestData, {
      headers: this.createAuthorizationHeader()
    });
  }

  getUserById(userId: number){
    return this.http.get(`${this.baseUrl}/get-user/${userId}`, {
      headers: this.createAuthorizationHeader()
    });
  }


  private createAuthorizationHeader(): HttpHeaders {
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
