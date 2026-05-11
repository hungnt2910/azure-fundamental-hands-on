import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Get the auth token from the service
    const authToken = this.authService.getToken();

    // Clone the request and add authorization header if token exists
    if (authToken) {
        console.log(authToken)
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${authToken}`
        }
      });
      console.log(`🔐 [AUTH] Token added to ${request.method} ${request.url}`);
    } else {
      console.log(`ℹ️ [AUTH] No token available for ${request.method} ${request.url}`);
    }

    return next.handle(request).pipe(
      tap(event => {
        // Log successful responses
        if (event.type === 4) { // HttpResponse
          console.log(`✅ [AUTH] Success: ${request.method} ${request.url}`);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error(`❌ [AUTH] Error: ${request.method} ${request.url}`, error);
        
        // If 401 (Unauthorized), logout and redirect to login
        if (error.status === 401) {
          console.warn('🔓 [AUTH] Unauthorized (401) - Logging out...');
          this.authService.logout();
          this.router.navigate(['/login']);
        }
        
        return throwError(() => error);
      })
    );
  }
}
