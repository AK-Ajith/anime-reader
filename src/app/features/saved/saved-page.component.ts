import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { take } from 'rxjs';
import { Manga } from '../../models/manga.model';
import { LibraryService } from '../../services/library.service';
import { MangaService } from '../../services/manga.service';
import { MangaCardComponent } from '../../shared/manga-card.component';

@Component({
  selector: 'app-saved-page',
  imports: [CommonModule, MangaCardComponent, MatCardModule, MatIconModule],
  templateUrl: './saved-page.component.html',
  styleUrl: './saved-page.component.scss'
})
export class SavedPageComponent {
  private readonly mangaService = inject(MangaService);
  private readonly libraryService = inject(LibraryService);

  protected readonly mangaList = signal<Manga[]>([]);
  protected readonly savedManga = computed(() => this.libraryService.getSavedManga(this.mangaList()));
  protected readonly continueReading = computed(() => this.libraryService.getContinueReading(this.mangaList()));

  constructor() {
    this.mangaService
      .getManga()
      .pipe(take(1))
      .subscribe((manga) => this.mangaList.set(manga));
  }
}
