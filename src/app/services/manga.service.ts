import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { Manga } from '../models/manga.model';

interface MangaDexTextMap {
  [key: string]: string | undefined;
}

interface MangaDexTag {
  attributes?: {
    name?: MangaDexTextMap;
  };
}

interface MangaDexRelationship {
  id: string;
  type: string;
  attributes?: {
    name?: string;
    fileName?: string;
  };
}

interface MangaDexMangaAttributes {
  title: MangaDexTextMap;
  altTitles?: MangaDexTextMap[];
  description?: MangaDexTextMap;
  status?: string;
  lastChapter?: string;
  tags?: MangaDexTag[];
}

interface MangaDexMangaItem {
  id: string;
  attributes: MangaDexMangaAttributes;
  relationships?: MangaDexRelationship[];
}

interface MangaDexListResponse {
  data: MangaDexMangaItem[];
}

interface MangaDexStatisticsEntry {
  rating?: {
    average?: number;
  };
}

interface MangaDexStatisticsResponse {
  statistics: Record<string, MangaDexStatisticsEntry>;
}

interface MangaDexChapterItem {
  id: string;
}

interface MangaDexChapterListResponse {
  data: MangaDexChapterItem[];
}

interface MangaDexAtHomeResponse {
  baseUrl: string;
  chapter: {
    hash: string;
    data: string[];
  };
}

interface AppConfig {
  mangaDexApiBaseUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MangaService {
  private readonly http = inject(HttpClient);
  private readonly appConfig = (globalThis as typeof globalThis & { __APP_CONFIG__?: AppConfig }).__APP_CONFIG__;
  private readonly baseUrl = this.resolveBaseUrl();
  private readonly proxyOrigin = this.resolveProxyOrigin();
  private readonly fallbackCover = 'https://placehold.co/600x900/111111/f3f3f3?text=Manga';

  getManga(title = ''): Observable<Manga[]> {
    let params = new HttpParams()
      .set('limit', '20')
      .append('includes[]', 'cover_art')
      .append('availableTranslatedLanguage[]', 'en');

    if (title.trim()) {
      params = params.set('title', title.trim()).set('order[relevance]', 'desc');
    }

    return this.http.get<MangaDexListResponse>(`${this.baseUrl}/manga`, { params }).pipe(
      switchMap((response) => {
        const mangaIds = response.data.map((item) => item.id);

        if (!mangaIds.length) {
          return of([]);
        }

        return this.getStatistics(mangaIds).pipe(
          map((statistics) => response.data.map((item) => this.mapManga(item, statistics[item.id])))
        );
      }),
      catchError(() => of([]))
    );
  }

  getMangaById(id: string): Observable<Manga | undefined> {
    if (!id) {
      return of(undefined);
    }

    let params = new HttpParams()
      .append('includes[]', 'cover_art')
      .append('includes[]', 'author')
      .append('includes[]', 'artist');

    return forkJoin({
      manga: this.http.get<{ data: MangaDexMangaItem }>(`${this.baseUrl}/manga/${id}`, { params }),
      statistics: this.getStatistics([id]),
      pages: this.getPagesForManga(id)
    }).pipe(
      map(({ manga, statistics, pages }) => this.mapManga(manga.data, statistics[id], pages)),
      catchError(() => of(undefined))
    );
  }

  private getStatistics(mangaIds: string[]): Observable<Record<string, MangaDexStatisticsEntry>> {
    let params = new HttpParams();

    for (const mangaId of mangaIds) {
      params = params.append('manga[]', mangaId);
    }

    return this.http.get<MangaDexStatisticsResponse>(`${this.baseUrl}/statistics/manga`, { params }).pipe(
      map((response) => response.statistics ?? {}),
      catchError(() => of({}))
    );
  }

  private getPagesForManga(mangaId: string): Observable<string[]> {
    let params = new HttpParams()
      .set('limit', '5')
      .set('order[chapter]', 'asc')
      .append('manga', mangaId)
      .append('translatedLanguage[]', 'en');

    return this.http.get<MangaDexChapterListResponse>(`${this.baseUrl}/chapter`, { params }).pipe(
      switchMap((response) => {
        const firstChapterId = response.data.find((chapter) => !!chapter.id)?.id;

        if (!firstChapterId) {
          return of([]);
        }

        return this.http.get<MangaDexAtHomeResponse>(`${this.baseUrl}/at-home/server/${firstChapterId}`).pipe(
          map((atHome) =>
            atHome.chapter.data.map((fileName) =>
              this.buildImageProxyUrl(`${atHome.baseUrl}/data/${atHome.chapter.hash}/${fileName}`)
            )
          ),
          catchError(() => of([]))
        );
      }),
      catchError(() => of([]))
    );
  }

  private mapManga(item: MangaDexMangaItem, statistics?: MangaDexStatisticsEntry, pages: string[] = []): Manga {
    const coverFileName = item.relationships
      ?.find((relationship) => relationship.type === 'cover_art')
      ?.attributes?.fileName;
    const coverImage = coverFileName ? this.buildCoverProxyUrl(item.id, coverFileName) : this.fallbackCover;
    const author =
      item.relationships?.find((relationship) => relationship.type === 'author')?.attributes?.name ??
      item.relationships?.find((relationship) => relationship.type === 'artist')?.attributes?.name ??
      'Unknown author';
    const fallbackPages = pages.length ? pages : [coverImage];

    return {
      id: item.id,
      title: this.pickLocalizedText(item.attributes.title, item.attributes.altTitles) ?? 'Untitled',
      coverImage,
      bannerImage: coverImage,
      description: this.pickLocalizedText(item.attributes.description) ?? 'No description available for this title yet.',
      genres:
        item.attributes.tags
          ?.map((tag) => this.pickLocalizedText(tag.attributes?.name))
          .filter((tag): tag is string => !!tag) ?? [],
      rating: this.normalizeRating(statistics?.rating?.average),
      author,
      status: this.mapStatus(item.attributes.status),
      chapters: this.toChapterCount(item.attributes.lastChapter),
      pages: fallbackPages
    };
  }

  private buildCoverProxyUrl(mangaId: string, fileName: string): string {
    return `${this.proxyOrigin}/api/mangadex-cover/${mangaId}/${fileName}`;
  }

  private buildImageProxyUrl(sourceUrl: string): string {
    return `${this.proxyOrigin}/api/mangadex-image?url=${encodeURIComponent(sourceUrl)}`;
  }

  private pickLocalizedText(textMap?: MangaDexTextMap, fallbacks: MangaDexTextMap[] = []): string | undefined {
    const candidates = [textMap, ...fallbacks].filter((entry): entry is MangaDexTextMap => !!entry);

    for (const candidate of candidates) {
      const value =
        candidate['en'] ??
        candidate['en-us'] ??
        candidate['ja-ro'] ??
        Object.values(candidate).find((entry) => !!entry);

      if (value) {
        return value;
      }
    }

    return undefined;
  }

  private normalizeRating(rawRating?: number): number {
    if (!rawRating) {
      return 0;
    }

    return Math.round((rawRating / 2) * 10) / 10;
  }

  private mapStatus(status?: string): Manga['status'] {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'hiatus':
        return 'Hiatus';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Ongoing';
    }
  }

  private toChapterCount(lastChapter?: string): number {
    const chapterCount = Number(lastChapter);
    return Number.isFinite(chapterCount) && chapterCount > 0 ? Math.floor(chapterCount) : 0;
  }

  private resolveBaseUrl(): string {
    return this.appConfig?.mangaDexApiBaseUrl?.replace(/\/$/, '') || 'https://api.mangadex.org';
  }

  private resolveProxyOrigin(): string {
    if (this.baseUrl.includes('/api/mangadex')) {
      return this.baseUrl.replace(/\/api\/mangadex$/, '');
    }

    return this.baseUrl;
  }
}
