import { Component, OnInit, OnDestroy, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ImageService, ImageMetadata } from '../../services/image';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './gallery.html',
  styleUrls: ['./gallery.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GalleryComponent implements OnInit, OnDestroy {
  images = signal<ImageMetadata[]>([]);
  isLoading = signal<boolean>(true);
  selectedImage = signal<ImageMetadata | null>(null);
  
  private uploadSub: Subscription | null = null;

  constructor(private imageService: ImageService) {}

  ngOnInit() {
    this.fetchImages();
    
    // Đăng ký nhận thông báo real-time khi có ảnh mới
    this.uploadSub = this.imageService.imageUploaded$.subscribe((newImages) => {
      // Thêm các ảnh mới vào đầu danh sách sử dụng signal update
      this.images.update(current => [...newImages, ...current]);
    });
  }

  ngOnDestroy() {
    if (this.uploadSub) {
      this.uploadSub.unsubscribe();
    }
  }

  fetchImages() {
    this.isLoading.set(true);
    this.imageService.getImages().subscribe({
      next: (data) => {
        this.images.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch images', err);
        this.isLoading.set(false);
      }
    });
  }

  openPreview(image: ImageMetadata) {
    this.selectedImage.set(image);
    document.body.style.overflow = 'hidden'; // Khóa cuộn trang
  }

  closePreview() {
    this.selectedImage.set(null);
    document.body.style.overflow = 'auto'; // Mở lại cuộn trang
  }
}
