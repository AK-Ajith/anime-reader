import { Injectable, inject, signal } from '@angular/core';
import { Manga } from '../models/manga.model';
import { ReadingProgress } from '../models/reading-progress.model';
import { StorageService } from './storage.service';

const SAVED_KEY = 'anime-reader-saved-manga';
const PROGRESS_KEY = 'anime-reader-progress';

@Injectable({
  providedIn: 'root'
})
export class LibraryService {
  private readonly storage = inject(StorageService);

  private readonly savedIds = signal<string[]>(this.storage.getItem<string[]>(SAVED_KEY, []));
  private readonly progressMap = signal<Record<string, ReadingProgress>>(
    this.storage.getItem<Record<string, ReadingProgress>>(PROGRESS_KEY, {})
  );

  isSaved(mangaId: string): boolean {
    return this.savedIds().includes(mangaId);
  }

  toggleSaved(mangaId: string): void {
    const updatedIds = this.isSaved(mangaId)
      ? this.savedIds().filter((id) => id !== mangaId)
      : [...this.savedIds(), mangaId];

    this.savedIds.set(updatedIds);
    this.storage.setItem(SAVED_KEY, updatedIds);
  }

  getSavedManga(mangaList: Manga[]): Manga[] {
    return mangaList.filter((manga) => this.savedIds().includes(manga.id));
  }

  updateProgress(mangaId: string, currentPage: number): void {
    const updatedMap = {
      ...this.progressMap(),
      [mangaId]: {
        mangaId,
        currentPage,
        updatedAt: new Date().toISOString()
      }
    };

    this.progressMap.set(updatedMap);
    this.storage.setItem(PROGRESS_KEY, updatedMap);
  }

  getProgress(mangaId: string): ReadingProgress | undefined {
    return this.progressMap()[mangaId];
  }

  getContinueReading(mangaList: Manga[]): Array<Manga & { progress: ReadingProgress }> {
    return mangaList
      .map((manga) => ({
        ...manga,
        progress: this.progressMap()[manga.id]
      }))
      .filter((manga): manga is Manga & { progress: ReadingProgress } => !!manga.progress)
      .sort((a, b) => Date.parse(b.progress.updatedAt) - Date.parse(a.progress.updatedAt));
  }
}
