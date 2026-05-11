import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageService } from '../../services/image';

export interface SelectedFile {
  file: File;
  previewUrl: string;
}

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload.html',
  styleUrls: ['./upload.scss']
})
export class UploadComponent {
  selectedFiles: SelectedFile[] = [];
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
    const newFiles = Array.from(fileList)
      .filter(f => f.type.startsWith('image/'))
      .map(file => ({
        file: file,
        previewUrl: URL.createObjectURL(file) // Tạo URL để hiển thị ảnh preview
      }));
    
    this.selectedFiles = [...this.selectedFiles, ...newFiles];
    this.uploadSuccess = false;
  }

  removeFile(index: number) {
    const file = this.selectedFiles[index];
    URL.revokeObjectURL(file.previewUrl); // Giải phóng bộ nhớ
    this.selectedFiles.splice(index, 1);
  }

  clearSelection() {
    this.selectedFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
    this.selectedFiles = [];
    this.uploadSuccess = false;
  }

  upload() {
    if (this.selectedFiles.length === 0) return;

    this.isUploading = true;
    this.lastUploadedCount = this.selectedFiles.length;
    
    const filesToUpload = this.selectedFiles.map(sf => sf.file);

    this.imageService.uploadImages(filesToUpload).subscribe({
      next: (res) => {
        this.isUploading = false;
        this.uploadSuccess = true;
        this.clearSelection(); // Xóa và giải phóng bộ nhớ
      },
      error: (err) => {
        this.isUploading = false;
        console.error('Upload failed', err);
      
        alert('Có lỗi xảy ra khi tải ảnh lên.');
      }
    });
  }
}
