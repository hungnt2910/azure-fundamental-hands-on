import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
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
  styleUrls: ['./upload.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadComponent {
  selectedFiles = signal<SelectedFile[]>([]);
  isDragging = signal<boolean>(false);
  isUploading = signal<boolean>(false);
  uploadSuccess = signal<boolean>(false);
  lastUploadedCount = signal<number>(0);

  constructor(private imageService: ImageService) {}

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.addFiles(files);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
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
    
    this.selectedFiles.update(current => [...current, ...newFiles]);
    this.uploadSuccess.set(false);
  }

  removeFile(index: number) {
    const file = this.selectedFiles()[index];
    URL.revokeObjectURL(file.previewUrl); // Giải phóng bộ nhớ
    this.selectedFiles.update(current => {
      const updated = [...current];
      updated.splice(index, 1);
      return updated;
    });
  }

  clearSelection() {
    this.selectedFiles().forEach(f => URL.revokeObjectURL(f.previewUrl));
    this.selectedFiles.set([]);
    this.uploadSuccess.set(false);
  }

  upload() {
    if (this.selectedFiles().length === 0) return;

    this.isUploading.set(true);
    this.lastUploadedCount.set(this.selectedFiles().length);
    
    const filesToUpload = this.selectedFiles().map(sf => sf.file);

    this.imageService.uploadImages(filesToUpload).subscribe({
      next: (res) => {
        this.isUploading.set(false);
        this.uploadSuccess.set(true);
        this.clearSelection(); // Xóa và giải phóng bộ nhớ
      },
      error: (err) => {
        this.isUploading.set(false);
        console.error('Upload failed', err);
        alert('Có lỗi xảy ra khi tải ảnh lên.');
      }
    });
  }
}
