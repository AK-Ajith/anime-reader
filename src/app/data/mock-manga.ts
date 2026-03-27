import { Manga } from '../models/manga.model';

export const MOCK_MANGA: Manga[] = [
  {
    id: 'skyline-chronicles',
    title: 'Skyline Chronicles',
    coverImage: 'https://placehold.co/600x900/10141f/f3f7ff?text=Skyline+Chronicles',
    bannerImage: 'https://placehold.co/1600x700/182033/cddefe?text=Skyline+Chronicles',
    description:
      'A courier with a forbidden map races through floating megacities, uncovering a war between ancient guardians and machine-born kings.',
    genres: ['Action', 'Adventure'],
    rating: 4.8,
    author: 'Reina Sol',
    status: 'Ongoing',
    chapters: 48,
    pages: [
      'https://placehold.co/900x1300/111827/e5eefb?text=Skyline+01',
      'https://placehold.co/900x1300/172036/e5eefb?text=Skyline+02',
      'https://placehold.co/900x1300/1f2a44/e5eefb?text=Skyline+03',
      'https://placehold.co/900x1300/24314f/e5eefb?text=Skyline+04',
      'https://placehold.co/900x1300/2a395d/e5eefb?text=Skyline+05'
    ]
  },
  {
    id: 'moonlit-promise',
    title: 'Moonlit Promise',
    coverImage: 'https://placehold.co/600x900/24111d/fff0f5?text=Moonlit+Promise',
    bannerImage: 'https://placehold.co/1600x700/38192c/ffe0ef?text=Moonlit+Promise',
    description:
      'A shrine maiden and a runaway prince form a fragile pact beneath a cursed moon, where every confession changes fate.',
    genres: ['Romance', 'Adventure'],
    rating: 4.5,
    author: 'Aya Mizuno',
    status: 'Completed',
    chapters: 36,
    pages: [
      'https://placehold.co/900x1300/2f1525/fff0f5?text=Moonlit+01',
      'https://placehold.co/900x1300/3b1a31/fff0f5?text=Moonlit+02',
      'https://placehold.co/900x1300/4b2440/fff0f5?text=Moonlit+03',
      'https://placehold.co/900x1300/5a2b4d/fff0f5?text=Moonlit+04',
      'https://placehold.co/900x1300/6d345d/fff0f5?text=Moonlit+05'
    ]
  },
  {
    id: 'iron-heart-arena',
    title: 'Iron Heart Arena',
    coverImage: 'https://placehold.co/600x900/1c140d/fff1db?text=Iron+Heart+Arena',
    bannerImage: 'https://placehold.co/1600x700/342515/ffe2b8?text=Iron+Heart+Arena',
    description:
      'In a city where duels decide law, a rookie mech pilot must win the arena to save her family and expose the league owners.',
    genres: ['Action', 'Adventure'],
    rating: 4.2,
    author: 'Daisuke Ren',
    status: 'Ongoing',
    chapters: 22,
    pages: [
      'https://placehold.co/900x1300/23170f/fff1db?text=Iron+01',
      'https://placehold.co/900x1300/342113/fff1db?text=Iron+02',
      'https://placehold.co/900x1300/4a2f1c/fff1db?text=Iron+03',
      'https://placehold.co/900x1300/5a3a21/fff1db?text=Iron+04',
      'https://placehold.co/900x1300/714929/fff1db?text=Iron+05'
    ]
  }
];
