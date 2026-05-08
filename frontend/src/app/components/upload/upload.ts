import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageService } from '../../services/image';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload.html',
  styleUrls: ['./upload.scss']
})
export class UploadComponent {
  selectedFiles: File[] = [];
  isDragging = false;
  isUploading = false;
  uploadSuccess = false;
  lastUploadedCount = 0;

  constructor(private imageService: ImageService) {}

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.addFiles(files);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.addFiles(files);
    }
  }

  private addFiles(fileList: FileList) {
    const newFiles = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    this.selectedFiles = [...this.selectedFiles, ...newFiles];
    this.uploadSuccess = false;
  }

  clearSelection() {
    this.selectedFiles = [];
    this.uploadSuccess = false;
  }

  upload() {
    if (this.selectedFiles.length === 0) return;

    this.isUploading = true;
    this.lastUploadedCount = this.selectedFiles.length;
    
    this.imageService.uploadImages(this.selectedFiles).subscribe({
      next: (res) => {
        this.isUploading = false;
        this.uploadSuccess = true;
        this.selectedFiles = []; // Xóa danh sách sau khi upload thành công
      },
      error: (err) => {
        this.isUploading = false;
        console.error('Upload failed', err);
        alert('Có lỗi xảy ra khi tải ảnh lên.');
      }
    });
  }
}
