import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class RegisterComponent {
  username: string = '';
  password: string = '';
  confirmPassword: string = '';
  loading: boolean = false;
  error: string = '';
  success: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  register(): void {
    if (!this.username || !this.password || !this.confirmPassword) {
      this.error = 'Vui lòng điền đầy đủ thông tin';
      this.success = '';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Mật khẩu xác nhận không trùng khớp';
      this.success = '';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'Mật khẩu phải có ít nhất 6 ký tự';
      this.success = '';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    this.authService.register(this.username, this.password).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = 'Đăng ký thành công! Chuyển hướng đến đăng nhập...';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      }
    });
  }
}
