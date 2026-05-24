import { Movie } from './types';

export const INITIAL_MOVIES: Movie[] = [
  {
    id: 'movie-1',
    title: 'The Golden Stool: Legend of Asante',
    description: 'An epic historic drama tracing the rise of the Ashanti Kingdom, the defense of the sacred Golden Stool, and the legendary warrior Queen Mother Yaa Asantewaa of Ejisu.',
    coverUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop',
    thrillerUrl: 'https://assets.mixkit.co/videos/preview/mixkit-cinematic-shot-of-a-mystery-man-with-a-hoodie-42004-large.mp4',
    fullMovieUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-dancing-under-neon-lights-42289-large.mp4', // Safe public video representing full length
    priceCedis: 45.00,
    category: 'Epic Drama',
    durationMins: 135,
    producerId: 'prod-yaa',
    producerName: 'Yaa Asantewaa Films',
    createdAt: '2026-04-10T11:00:00Z',
    purchaseCount: 245
  },
  {
    id: 'movie-2',
    title: 'Accra Nights: Neon Sizzle',
    description: 'A suspenseful neo-noir thriller following an investigative blogger deep into the high-octane subculture of Osu, street racing, and hidden corporate secrets in Accra.',
    coverUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=600&auto=format&fit=crop',
    thrillerUrl: 'https://assets.mixkit.co/videos/preview/mixkit-car-headlights-reflected-on-rainy-asphalt-at-night-42261-large.mp4',
    fullMovieUrl: 'https://assets.mixkit.co/videos/preview/mixkit-neon-light-from-an-arcade-machine-glows-at-night-42286-large.mp4',
    priceCedis: 35.00,
    category: 'Action Thriller',
    durationMins: 112,
    producerId: 'prod-kwame',
    producerName: 'Kwame Sparks Studio',
    createdAt: '2026-05-01T15:30:00Z',
    purchaseCount: 189
  },
  {
    id: 'movie-3',
    title: 'Kumasi Kente: Thread of Power',
    description: 'A deeply emotional family documentary recounting the visual language of Kente weaving, tracing royal ancestry, dispute resolution, and artistic preservation through generations of master craftsmen.',
    coverUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop',
    thrillerUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-weaving-thread-on-a-loom-41712-large.mp4',
    fullMovieUrl: 'https://assets.mixkit.co/videos/preview/mixkit-spinning-yarn-of-different-colors-on-spools-41713-large.mp4',
    priceCedis: 50.00,
    category: 'Documentary',
    durationMins: 89,
    producerId: 'prod-yaa',
    producerName: 'Yaa Asantewaa Films',
    createdAt: '2026-05-18T09:15:00Z',
    purchaseCount: 78
  }
];
