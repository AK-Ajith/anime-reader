export type MangaGenre = 'Action' | 'Adventure' | 'Romance';

export interface Manga {
  id: string;
  title: string;
  coverImage: string;
  bannerImage: string;
  description: string;
  genres: MangaGenre[];
  rating: number;
  author: string;
  status: 'Ongoing' | 'Completed';
  chapters: number;
  pages: string[];
}
