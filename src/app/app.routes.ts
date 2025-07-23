import { Routes } from '@angular/router';
import { AnimationActionComponent } from './scenes/animation-action/animation-action.component';
import { ThreeViewerComponent } from './components/three-viewer/three-viewer.component';
import { HeroThreeComponent } from './scenes/hero-three/hero-three.component';
import { AnimationClipComponent } from './scenes/animation-clip/animation-clip.component';
import { AnimationMixerComponent } from './scenes/animation-mixer/animation-mixer.component';
import { AnimationObjctGroupComponent } from './scenes/animation-objct-group/animation-objct-group.component';

export const routes: Routes = [
  { path: '', redirectTo: 'helmet', pathMatch: 'full' },
  { path: 'animation-action', component: AnimationActionComponent },
  { path: 'helmet', component: ThreeViewerComponent },
  { path: 'hero-three', component: HeroThreeComponent },
  { path: 'animation-clip', component: AnimationClipComponent },
  { path: 'animation-mixer', component: AnimationMixerComponent },
  { path: 'animation-objct-group', component: AnimationObjctGroupComponent },
  { path: '**', redirectTo: 'hero-three' },
];
