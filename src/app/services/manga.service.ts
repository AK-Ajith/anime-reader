import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { MOCK_MANGA } from '../data/mock-manga';
import { Manga, MangaGenre } from '../models/manga.model';

@Injectable({
  providedIn: 'root'
})
export class MangaService {
  getManga(): Observable<Manga[]> {
    return of(MOCK_MANGA).pipe(delay(400));
  }

  getMangaById(id: string): Observable<Manga | undefined> {
    return of(MOCK_MANGA.find((manga) => manga.id === id)).pipe(delay(300));
  }

  getGenres(): MangaGenre[] {
    return ['Action', 'Adventure', 'Romance'];
  }
}
