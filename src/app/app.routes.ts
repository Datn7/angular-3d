import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'helmet', pathMatch: 'full' },
  { path: '**', redirectTo: 'helmet' },
];
