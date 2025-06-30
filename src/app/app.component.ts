import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThreeViewerComponent } from './components/three-viewer/three-viewer.component';
import { NavigationComponent } from './components/navigation/navigation.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ThreeViewerComponent, NavigationComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'angular-3d';
}
