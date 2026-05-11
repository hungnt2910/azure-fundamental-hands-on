import { Component, ChangeDetectionStrategy } from '@angular/core';
import { UploadComponent } from './components/upload/upload';
import { GalleryComponent } from './components/gallery/gallery';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [UploadComponent, GalleryComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  title = 'frontend';
}
