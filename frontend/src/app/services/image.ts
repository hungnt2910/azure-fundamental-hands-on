import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { AuthService } from './auth';

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
  private apiUrl = 'https://image-gallery-api-demo-ehdff4d6gwhqgfgk.southeastasia-01.azurewebsites.net/api/images';
  private hubUrl = 'https://image-gallery-api-demo-ehdff4d6gwhqgfgk.southeastasia-01.azurewebsites.net/hubs/images';
  
  private hubConnection: signalR.HubConnection;
  private imageUploadedSubject = new Subject<ImageMetadata[]>();
  imageUploaded$ = this.imageUploadedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { 
    // Khởi tạo SignalR Connection
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.hubUrl, {
        accessTokenFactory: () => this.authService.getToken() || ''
      })
      .withAutomaticReconnect()
      .build();

    this.startSignalRConnection();

    // Lắng nghe sự kiện từ Server
    this.hubConnection.on('ReceiveNewImages', (newImages: ImageMetadata[]) => {
      console.log('🖼️ [IMAGE] SignalR: Nhận được ảnh mới!', newImages);
      this.imageUploadedSubject.next(newImages);
    });
  }

  private startSignalRConnection() {
    this.hubConnection
      .start()
      .then(() => console.log('🔗 [IMAGE] SignalR: Đã kết nối thành công!'))
      .catch(err => console.error('❌ [IMAGE] SignalR: Lỗi kết nối: ', err));
  }

  getImages(): Observable<ImageMetadata[]> {
    console.log('📥 [IMAGE] Fetching images from:', this.apiUrl);
    return this.http.get<ImageMetadata[]>(this.apiUrl).pipe(
      tap(images => {
        console.log(`✅ [IMAGE] Received ${images?.length || 0} images`);
      })
    );
  }

  uploadImages(files: File[]): Observable<ImageMetadata[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file, file.name);
    });

    console.log(`📤 [IMAGE] Uploading ${files.length} file(s)...`);
    // Không cần .pipe(tap(...)) nữa vì SignalR sẽ tự lo việc thông báo cho toàn bộ client (bao gồm cả chính mình)
    return this.http.post<ImageMetadata[]>(this.apiUrl, formData).pipe(
      tap(response => {
        console.log(`✅ [IMAGE] Upload successful, ${response?.length || 0} file(s) processed`);
      })
    );
  }
}
