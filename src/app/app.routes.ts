import { Routes } from '@angular/router';
import { HelmetViewerComponent } from './scenes/helmet-viewer/helmet-viewer.component';
import { ArchitectureViewerComponent } from './scenes/architecture-viewer/architecture-viewer.component';
import { ProductViewerComponent } from './scenes/product-viewer/product-viewer.component';

export const routes: Routes = [
  { path: '', redirectTo: 'helmet', pathMatch: 'full' },
  { path: 'helmet', component: HelmetViewerComponent },
  { path: 'architecture', component: ArchitectureViewerComponent },
  { path: 'product', component: ProductViewerComponent },
  { path: '**', redirectTo: 'helmet' },
];
