import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageService, ImageMetadata } from '../../services/image';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gallery.html',
  styleUrls: ['./gallery.scss']
})
export class GalleryComponent implements OnInit, OnDestroy {
  images: ImageMetadata[] = [];
  isLoading = true;
  selectedImage: ImageMetadata | null = null;
  private uploadSub: Subscription | null = null;

  constructor(private imageService: ImageService) {}

  ngOnInit() {
    this.fetchImages();
    
    // Đăng ký nhận thông báo real-time khi có ảnh mới
    this.uploadSub = this.imageService.imageUploaded$.subscribe((newImages) => {
      // Thêm các ảnh mới vào đầu danh sách
      this.images = [...newImages, ...this.images];
    });
  }

  ngOnDestroy() {
    if (this.uploadSub) {
      this.uploadSub.unsubscribe();
    }
  }

  fetchImages() {
    this.isLoading = true;
    this.imageService.getImages().subscribe({
      next: (data) => {
        this.images = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to fetch images', err);
        this.isLoading = false;
      }
    });
  }

  openPreview(image: ImageMetadata) {
    this.selectedImage = image;
    document.body.style.overflow = 'hidden'; // Khóa cuộn trang
  }

  closePreview() {
    this.selectedImage = null;
    document.body.style.overflow = 'auto'; // Mở lại cuộn trang
  }
}
