import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { Manga } from '../../models/manga.model';
import { LibraryService } from '../../services/library.service';
import { MangaService } from '../../services/manga.service';
import { MangaCardComponent } from '../../shared/manga-card.component';

@Component({
  selector: 'app-home-page',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MangaCardComponent,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {
  private readonly mangaService = inject(MangaService);
  private readonly libraryService = inject(LibraryService);
  private readonly searchRequests = new Subject<string>();

  protected readonly loading = signal(true);
  protected readonly mangaList = signal<Manga[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly selectedGenre = signal<string | 'All'>('All');
  protected readonly selectedRating = signal<number | 'All'>('All');
  protected readonly genres = computed(() => [...new Set(this.mangaList().flatMap((manga) => manga.genres))].sort());
  protected readonly ratingOptions = [4, 4.5];

  protected readonly filteredManga = computed(() =>
    this.mangaList().filter((manga) => {
      const matchesSearch = manga.title.toLowerCase().includes(this.searchTerm().trim().toLowerCase());
      const matchesGenre = this.selectedGenre() === 'All' || manga.genres.includes(this.selectedGenre());
      const selectedRating = this.selectedRating();
      const matchesRating = selectedRating === 'All' || manga.rating >= selectedRating;
      return matchesSearch && matchesGenre && matchesRating;
    })
  );

  protected readonly continueReading = computed(() => this.libraryService.getContinueReading(this.mangaList()).slice(0, 3));

  constructor() {
    this.searchRequests
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        switchMap((title) => this.mangaService.getManga(title)),
        takeUntilDestroyed()
      )
      .subscribe((manga) => {
        this.mangaList.set(manga);
        this.loading.set(false);
      });

    this.searchRequests.next('');
  }

  protected onSearchTermChange(term: string): void {
    this.searchTerm.set(term);
    this.loading.set(true);
    this.searchRequests.next(term);
  }
}
