import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { switchMap, take } from 'rxjs';
import { Manga } from '../../models/manga.model';
import { LibraryService } from '../../services/library.service';
import { MangaService } from '../../services/manga.service';

@Component({
  selector: 'app-manga-details-page',
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './manga-details-page.component.html',
  styleUrl: './manga-details-page.component.scss'
})
export class MangaDetailsPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly mangaService = inject(MangaService);
  protected readonly libraryService = inject(LibraryService);

  protected readonly loading = signal(true);
  protected readonly manga = signal<Manga | null>(null);
  protected readonly isSaved = computed(() => (this.manga() ? this.libraryService.isSaved(this.manga()!.id) : false));

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => this.mangaService.getMangaById(params.get('id') ?? '')),
        take(1)
      )
      .subscribe((manga) => {
        this.manga.set(manga ?? null);
        this.loading.set(false);
      });
  }

  protected toggleSaved(): void {
    const manga = this.manga();
    if (!manga) {
      return;
    }

    this.libraryService.toggleSaved(manga.id);
  }
}
