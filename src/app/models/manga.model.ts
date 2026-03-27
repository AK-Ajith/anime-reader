export interface Manga {
  id: string;
  title: string;
  coverImage: string;
  bannerImage: string;
  description: string;
  genres: string[];
  rating: number;
  author: string;
  status: 'Ongoing' | 'Completed' | 'Hiatus' | 'Cancelled';
  chapters: number;
  pages: string[];
}
