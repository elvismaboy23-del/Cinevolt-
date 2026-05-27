export type UserRole = 'PRODUCER' | 'BUYER';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  createdAt: string;
  password?: string;
  // Producer specific
  isSubscribed?: boolean;
  subscriptionPlan?: 'monthly' | 'annual' | null;
  subscriptionExpiresAt?: string | null;
  phoneNumber?: string;
  momoNetwork?: string;
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  thrillerUrl: string; // url to trailer video
  fullMovieUrl: string; // url to full movie video
  priceCedis: number; // Price in GH₵
  category: string;
  durationMins: number;
  producerId: string;
  producerName: string;
  createdAt: string;
  purchaseCount: number;
}

export interface CartItem {
  movie: Movie;
  addedAt: string;
}

export interface Purchase {
  id: string;
  userId: string;
  movieId: string;
  pricePaidCedis: number;
  paymentRef: string;
  purchasedAt: string;
}
