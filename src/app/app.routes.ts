import { Routes } from '@angular/router';
import { HomePageComponent } from './features/home/home-page.component';
import { LoginPageComponent } from './features/login/login-page.component';
import { MangaDetailsPageComponent } from './features/manga-details/manga-details-page.component';
import { ReaderPageComponent } from './features/reader/reader-page.component';
import { SavedPageComponent } from './features/saved/saved-page.component';
import { authGuard } from './guards/auth.guard';
import { ShellComponent } from './layout/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginPageComponent
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'home', component: HomePageComponent },
      { path: 'manga/:id', component: MangaDetailsPageComponent },
      { path: 'reader/:id', component: ReaderPageComponent },
      { path: 'saved', component: SavedPageComponent },
      { path: '', pathMatch: 'full', redirectTo: 'home' }
    ]
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];
