import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://image-gallery-api-demo-ehdff4d6gwhqgfgk.southeastasia-01.azurewebsites.net/api/auth';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private currentUserSubject = new BehaviorSubject<string | null>(this.getUsername());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  register(username: string, password: string): Observable<AuthResponse> {
    console.log('📝 [AUTH] Registering user:', username);
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, {
      username,
      password
    });
  }

  login(username: string, password: string): Observable<AuthResponse> {
    console.log('🔑 [AUTH] Logging in user:', username);
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, {
      username,
      password
    }).pipe(
      tap(response => {
          if (response.token) {
          this.setToken(response.token);
          this.setUsername(username);
          this.isAuthenticatedSubject.next(true);
          this.currentUserSubject.next(username);
          console.log('✅ [AUTH] Login successful, token saved');
        }
      })
    );
  }

  logout(): void {
    console.log('🚪 [AUTH] Logging out...');
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
    console.log('✅ [AUTH] Logout complete');
  }

  private setToken(token: string): void {
    localStorage.setItem('token', token);
    console.log('💾 [AUTH] Token stored in localStorage');
  }

  private setUsername(username: string): void {
    localStorage.setItem('username', username);
  }

  getToken(): string | null {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('🔍 [AUTH] Token retrieved from localStorage');
    }
    return token;
  }

  getUsername(): string | null {
    return localStorage.getItem('username');
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return this.hasToken();
  }
}
