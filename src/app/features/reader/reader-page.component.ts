import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { switchMap, take } from 'rxjs';
import { Manga } from '../../models/manga.model';
import { LibraryService } from '../../services/library.service';
import { MangaService } from '../../services/manga.service';

@Component({
  selector: 'app-reader-page',
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './reader-page.component.html',
  styleUrl: './reader-page.component.scss'
})
export class ReaderPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly mangaService = inject(MangaService);
  private readonly libraryService = inject(LibraryService);

  protected readonly loading = signal(true);
  protected readonly manga = signal<Manga | null>(null);
  protected readonly currentPage = signal(0);
  protected readonly currentImage = computed(() => this.manga()?.pages[this.currentPage()] ?? '');
  protected readonly progressPercent = computed(() => {
    const manga = this.manga();
    if (!manga) {
      return 0;
    }

    return ((this.currentPage() + 1) / manga.pages.length) * 100;
  });

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => this.mangaService.getMangaById(params.get('id') ?? '')),
        take(1)
      )
      .subscribe((manga) => {
        this.manga.set(manga ?? null);
        if (manga) {
          const savedProgress = this.libraryService.getProgress(manga.id);
          this.currentPage.set(savedProgress?.currentPage ?? 0);
          this.libraryService.updateProgress(manga.id, this.currentPage());
        }
        this.loading.set(false);
      });
  }

  protected goToPrevious(): void {
    const nextPage = Math.max(this.currentPage() - 1, 0);
    this.updatePage(nextPage);
  }

  protected goToNext(): void {
    const manga = this.manga();
    if (!manga) {
      return;
    }

    const nextPage = Math.min(this.currentPage() + 1, manga.pages.length - 1);
    this.updatePage(nextPage);
  }

  private updatePage(page: number): void {
    const manga = this.manga();
    if (!manga) {
      return;
    }

    this.currentPage.set(page);
    this.libraryService.updateProgress(manga.id, page);
  }
}
