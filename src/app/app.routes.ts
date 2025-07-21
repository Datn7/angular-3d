import { Routes } from '@angular/router';
import { AnimationActionComponent } from './scenes/animation-action/animation-action.component';
import { ThreeViewerComponent } from './components/three-viewer/three-viewer.component';

export const routes: Routes = [
  { path: '', redirectTo: 'helmet', pathMatch: 'full' },
  { path: 'animation-action', component: AnimationActionComponent },
  { path: 'helmet', component: ThreeViewerComponent },
  { path: '**', redirectTo: 'helmet' },
];
