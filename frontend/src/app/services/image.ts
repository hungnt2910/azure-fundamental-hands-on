import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';

export interface ImageMetadata {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  tags: string[];
  uploadedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private apiUrl = 'http://localhost:5000/api/images';
  
  private imageUploadedSubject = new Subject<ImageMetadata[]>();
  imageUploaded$ = this.imageUploadedSubject.asObservable();

  constructor(private http: HttpClient) { }

  getImages(): Observable<ImageMetadata[]> {
    return this.http.get<ImageMetadata[]>(this.apiUrl);
  }

  // Cập nhật để hỗ trợ gửi nhiều file trong 1 request
  uploadImages(files: File[]): Observable<ImageMetadata[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file, file.name);
    });

    return this.http.post<ImageMetadata[]>(this.apiUrl, formData).pipe(
      tap(newImages => {
        this.imageUploadedSubject.next(newImages);
      })
    );
  }
}
